/**
 * src/scenes/EditorScene.js
 * -------------------------
 * Visual level editor for Bomb Jack.
 * Lets you paint platforms, place bombs, and set the player-start position
 * on an 800 × 600 canvas that exactly matches the game world, then export
 * the result as a ready-to-paste levelN.js file.
 *
 * ─────────────────────────────────────────────────────────────────
 *  KEYBOARD SHORTCUTS
 * ─────────────────────────────────────────────────────────────────
 *  P          →  Platform tool  (click-and-drag to draw rect)
 *  B          →  Bomb tool      (click to place a bomb)
 *  S          →  Player-Start   (click to move spawn point)
 *  E          →  Enemy tool     (click to place an enemy; sub-type selectable in toolbar)
 *  D          →  Eraser tool    (click to delete any object)
 *  G          →  Toggle grid snap  16 px ↔ 32 px
 *  Z          →  Undo last action  (works for placements AND deletions)
 *  V          →  Toggle static preview (no physics)
 *  T          →  Play Test  (launches full GameScene, ESC returns here)
 *  ESC        →  Exit preview / back to MenuScene
 *
 *  Right-click (any tool) →  Quick-place a bomb at cursor
 *
 * ─────────────────────────────────────────────────────────────────
 *  DOM TOOLBAR  (injected beside the canvas, removed on shutdown)
 * ─────────────────────────────────────────────────────────────────
 *  Tool buttons     P / B / S / E
 *  Snap buttons     16 px / 32 px
 *  Undo / Clear
 *  Export & Log → console.log  +  clipboard copy  +  .js download
 *  Back to Menu
 *  Status line  (live counts of platforms, bombs, player-start)
 */

import { LEVELS } from '../config/levels.js';

// ── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 800;
const CANVAS_H = 600;
const MIN_SIZE = 4; // Minimum rect dimension (px) to commit a drag as a platform.

// Colours — kept consistent with the actual game visuals.
const C_GRID             = 0x2a2a4a;
const C_GRID_MAJOR       = 0x3a3a6a;
const C_PLATFORM_FILL    = 0x5c4033; // warm brown — matches BootScene tile
const C_PLATFORM_TOP     = 0x8d6e63; // lighter top highlight strip
const C_PLATFORM_EDGE    = 0x3e2723; // darker border / grout
const C_BOMB_SPARK       = 0xffd600; // yellow spark (BOMB_TINT_B from GameScene)
const C_PLAYER_BODY      = 0x1565c0; // blue body — matches BootScene player
const C_PLAYER_HEAD      = 0xffcc80; // skin-tone head
const C_PREVIEW_FILL     = 0xffd600; // drag-preview ghost
const C_PLAYER_START_RING = 0x00e676; // green ring around player-start icon
const C_ERASE_HOVER       = 0xff1744; // red highlight when eraser hovers an object

// Enemy icon colours — mirrored from BootScene enemy textures.
const C_ENEMY_WALKER  = 0xcc1111; // red crawler
const C_ENEMY_FLIER   = 0x7b1fa2; // purple bird
const C_ENEMY_BOUNCER = 0x00897b; // teal sphere

export default class EditorScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EditorScene' });
  }

  // ── Init / Shutdown ──────────────────────────────────────────────────────────

  init() {
    /** @type {'platform'|'bomb'|'player'|'enemy'} */
    this.activeTool  = 'platform';
    this.snapSize    = 16;

    /** @type {Array<{x:number,y:number,width:number,height:number}>} */
    this.platforms   = [];

    /** @type {Array<{x:number,y:number}>} */
    this.bombs       = [];

    /** @type {{x:number,y:number}|null} */
    this.playerStart = null;

    /** @type {Array<{type:string,x:number,y:number}>} */
    this.enemies     = [];

    /** Active enemy sub-type when the enemy tool is selected. */
    this.activeEnemyType = 'walker';

    /**
     * Undo stack — each entry is one reversible action.
     * @type {Array<object>}
     */
    this.undoStack   = [];

    // Drag state (platform tool).
    this.isDragging  = false;
    this.dragStartX  = 0;
    this.dragStartY  = 0;

    // DOM references — cleaned up in shutdown().
    this._toolbar        = null;
    this._statusEl       = null;
    this._toolBtns       = {};
    this._snapBtns       = {};
    this._contextHandler = null;

    // These are re-created as closures once the toolbar is built.
    this._syncToolbarButtons = () => {};
    this._syncSnapButtons    = () => {};

    // Preview mode state.
    this.isPreviewMode   = false;
    this._previewObjects = [];
    this._previewTimer   = null;
    this._previewBtnEl   = null;

    // Play-test button DOM reference — label toggles while GameScene is running.
    this._playTestBtnEl  = null;

    // Enemy sub-type row DOM reference — shown/hidden with the enemy tool.
    this._enemySubRowEl  = null;

    // Paste-import modal reference — DOM element, null when closed.
    this._pasteModal = null;
  }

  shutdown() {
    if (this._toolbar && this._toolbar.parentNode) {
      this._toolbar.parentNode.removeChild(this._toolbar);
    }
    this._toolbar  = null;
    this._statusEl = null;

    // Close paste modal if it was left open when navigating away.
    if (this._pasteModal && this._pasteModal.parentNode) {
      this._pasteModal.parentNode.removeChild(this._pasteModal);
    }
    this._pasteModal = null;

    // Destroy any live preview objects (safety net — exitPreview normally cleans these).
    this._clearPreviewObjects();

    if (this._contextHandler) {
      const canvas = document.querySelector('#game-container canvas');
      if (canvas) canvas.removeEventListener('contextmenu', this._contextHandler);
      this._contextHandler = null;
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  create() {
    this.add.image(0, 0, 'background').setOrigin(0, 0);

    // Three Graphics layers — drawn in order: grid, objects, drag-preview.
    this.gridGraphics    = this.add.graphics();
    this.contentGraphics = this.add.graphics();
    this.previewGraphics = this.add.graphics();

    this._drawGrid();
    this._setupKeyboard();
    this._setupPointer();
    this._buildToolbar();
    this._updateStatus();

    // Re-show the DOM toolbar and refresh canvas when we wake from a play-test.
    this.events.on('wake', this._onEditorWake, this);

    // Editor title (top-left corner).
    this.add.text(8, 8, '✏️  Level Editor', {
      fontSize:        '14px',
      fontFamily:      'Arial Black, Arial, sans-serif',
      color:           '#ffd600',
      stroke:          '#000000',
      strokeThickness: 3,
    }).setDepth(10);

    // Controls hint — fades after 5 s.
    const tip = this.add.text(CANVAS_W / 2, CANVAS_H - 16,
      'P Platform  B Bomb  S Player  E Enemy  D Erase  G Snap  Z Undo  V Preview  T Play Test  ESC Menu',
      {
        fontSize:   '11px',
        fontFamily: 'Arial, sans-serif',
        color:      '#666688',
        align:      'center',
      }).setOrigin(0.5, 1).setDepth(10);

    this.tweens.add({ targets: tip, alpha: 0, delay: 5000, duration: 1500 });
  }

  update() {
    // In preview mode nothing is editable — the drag preview is suppressed too.
    if (this.isPreviewMode) return;
    // Live drag preview is redrawn every frame.
    this._drawPreview();
  }

  // ── Grid drawing ─────────────────────────────────────────────────────────────

  _drawGrid() {
    const g     = this.gridGraphics;
    const step  = this.snapSize;
    const major = step * 10;
    g.clear();

    for (let x = 0; x <= CANVAS_W; x += step) {
      const isMajor = (x % major === 0);
      g.lineStyle(1, isMajor ? C_GRID_MAJOR : C_GRID, isMajor ? 0.55 : 0.28);
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, CANVAS_H);
      g.strokePath();
    }

    for (let y = 0; y <= CANVAS_H; y += step) {
      const isMajor = (y % major === 0);
      g.lineStyle(1, isMajor ? C_GRID_MAJOR : C_GRID, isMajor ? 0.55 : 0.28);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(CANVAS_W, y);
      g.strokePath();
    }
  }

  // ── Content redraw ────────────────────────────────────────────────────────────

  /**
   * Redraws all placed objects from scratch.
   * Called whenever editor state changes (place, undo, clear).
   */
  _redraw() {
    const g = this.contentGraphics;
    g.clear();

    for (const p of this.platforms) {
      this._drawPlatformRect(g, p.x, p.y, p.width, p.height);
    }

    for (const b of this.bombs) {
      this._drawBombIcon(g, b.x, b.y);
    }

    for (const e of this.enemies) {
      this._drawEnemyIcon(g, e.type, e.x, e.y);
    }

    if (this.playerStart) {
      this._drawPlayerIcon(g, this.playerStart.x, this.playerStart.y);
    }

    this._updateStatus();
  }

  // ── Object rendering helpers ──────────────────────────────────────────────────

  /**
   * Draws a platform rectangle.
   * Mirrors the tile colours from BootScene._createPlatformTexture().
   */
  _drawPlatformRect(g, x, y, w, h) {
    // Base fill.
    g.fillStyle(C_PLATFORM_FILL, 1);
    g.fillRect(x, y, w, h);

    // Top highlight strip.
    const stripH = Math.min(4, h);
    g.fillStyle(C_PLATFORM_TOP, 1);
    g.fillRect(x, y, w, stripH);

    // Bottom shadow.
    const shadowH = Math.min(3, h);
    g.fillStyle(C_PLATFORM_EDGE, 0.8);
    g.fillRect(x, y + h - shadowH, w, shadowH);

    // Outer border.
    g.lineStyle(1, C_PLATFORM_EDGE, 0.9);
    g.strokeRect(x, y, w, h);

    // Vertical grout lines every 32 px.
    g.lineStyle(1, C_PLATFORM_EDGE, 0.5);
    for (let gx = x + 32; gx < x + w; gx += 32) {
      g.beginPath();
      g.moveTo(gx, y);
      g.lineTo(gx, y + h);
      g.strokePath();
    }
  }

  /**
   * Draws a bomb icon centred at (cx, cy).
   * Mirrors the bomb design from BootScene._createBombTexture().
   */
  _drawBombIcon(g, cx, cy) {
    const r = 7;

    // Shadow.
    g.fillStyle(0x333333, 0.4);
    g.fillCircle(cx + 1, cy + 1, r + 1);

    // Body.
    g.fillStyle(0x212121, 1);
    g.fillCircle(cx, cy, r);

    // Shine.
    g.fillStyle(0x616161, 1);
    g.fillCircle(cx - 2, cy - 2, 2);

    // Fuse.
    g.fillStyle(0x5d4037, 1);
    g.fillRect(cx - 1, cy - r - 4, 2, 5);

    // Spark.
    g.fillStyle(C_BOMB_SPARK, 1);
    g.fillCircle(cx, cy - r - 4, 3);

    // Orange glow ring (editor visual hint).
    g.lineStyle(1.5, 0xff6f00, 0.75);
    g.strokeCircle(cx, cy, r + 2);
  }

  /**
   * Draws the player-start icon at top-left origin (x, y).
   * Mirrors the player sprite from BootScene._createPlayerTexture().
   */
  _drawPlayerIcon(g, x, y) {
    // Green bounding ring so it's always visible.
    g.lineStyle(2, C_PLAYER_START_RING, 0.9);
    g.strokeRect(x - 2, y - 2, 32, 44);

    // Body.
    g.fillStyle(C_PLAYER_BODY, 1);
    g.fillRect(x + 4, y + 14, 20, 22);

    // Head.
    g.fillStyle(C_PLAYER_HEAD, 1);
    g.fillRect(x + 8, y + 2, 14, 14);

    // Eyes.
    g.fillStyle(0x1a237e, 1);
    g.fillRect(x + 11, y + 6, 3, 3);
    g.fillRect(x + 16, y + 6, 3, 3);

    // Arms.
    g.fillStyle(C_PLAYER_BODY, 1);
    g.fillRect(x,      y + 16, 6, 14);
    g.fillRect(x + 22, y + 16, 6, 14);

    // Legs.
    g.fillStyle(0x0d47a1, 1);
    g.fillRect(x + 5,  y + 36, 8, 4);
    g.fillRect(x + 15, y + 36, 8, 4);
  }

  /**
   * Draws a compact enemy icon centred at (cx, cy).
   * Mirrors the three BootScene enemy texture designs at editor scale.
   *
   * @param {Phaser.GameObjects.Graphics} g
   * @param {'walker'|'flier'|'bouncer'} type
   * @param {number} cx  Centre X.
   * @param {number} cy  Centre Y.
   */
  _drawEnemyIcon(g, type, cx, cy) {
    if (type === 'walker') {
      // Red armoured crawler body — 24 × 14 rectangle.
      g.fillStyle(C_ENEMY_WALKER, 1);
      g.fillRect(cx - 12, cy - 3, 24, 14);

      // Back spike.
      g.fillStyle(0xff3333, 1);
      g.fillTriangle(cx - 4, cy - 3, cx, cy - 3, cx - 2, cy - 10);
      g.fillTriangle(cx + 1, cy - 3, cx + 5, cy - 3, cx + 3, cy - 9);

      // Eye.
      g.fillStyle(0xffcc00, 1);
      g.fillCircle(cx + 8, cy + 2, 3);
      g.fillStyle(0x1a0000, 1);
      g.fillCircle(cx + 9, cy + 2, 1);

      // Leg stubs.
      g.fillStyle(0x880000, 1);
      g.fillRect(cx - 10, cy + 9, 4,  6);
      g.fillRect(cx -  2, cy + 9, 4,  6);
      g.fillRect(cx +  6, cy + 9, 4,  6);

      // Bounding ring.
      g.lineStyle(1, 0xff6666, 0.6);
      g.strokeRect(cx - 14, cy - 12, 28, 28);

    } else if (type === 'flier') {
      // Purple winged body.
      g.fillStyle(0x6a0080, 1);
      g.fillTriangle(cx, cy, cx - 14, cy - 10, cx - 10, cy + 8); // left wing
      g.fillTriangle(cx, cy, cx + 14, cy - 10, cx + 10, cy + 8); // right wing

      g.fillStyle(C_ENEMY_FLIER, 1);
      g.fillCircle(cx, cy, 8);

      g.fillStyle(0xffee58, 1);
      g.fillCircle(cx - 3, cy - 2, 2);
      g.fillCircle(cx + 3, cy - 2, 2);

      g.fillStyle(0xffa000, 1);
      g.fillTriangle(cx - 2, cy + 3, cx + 2, cy + 3, cx, cy + 7);

      // Bounding ring.
      g.lineStyle(1, 0xce93d8, 0.6);
      g.strokeRect(cx - 15, cy - 12, 30, 28);

    } else if (type === 'bouncer') {
      // Teal glowing sphere.
      g.fillStyle(0x80cbc4, 0.25);
      g.fillCircle(cx, cy, 14);

      g.fillStyle(C_ENEMY_BOUNCER, 1);
      g.fillCircle(cx, cy, 10);

      g.fillStyle(0x26a69a, 0.6);
      g.fillCircle(cx - 2, cy + 1, 8);

      // Gloss highlight.
      g.fillStyle(0xb2dfdb, 0.9);
      g.fillCircle(cx - 3, cy - 3, 4);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(cx - 4, cy - 4, 2);

      // Bounding ring.
      g.lineStyle(1, 0x80cbc4, 0.6);
      g.strokeRect(cx - 14, cy - 14, 28, 28);
    }

    // Type label below the icon so overlapping enemies can be distinguished.
    // (Drawn via Graphics is not possible; we rely on the bounding-ring colour
    //  and icon shape alone for type identification in the editor.)
  }

  // ── Live drag preview ─────────────────────────────────────────────────────────

  /** Runs every frame — shows a snapped crosshair and ghost rect while dragging. */
  _drawPreview() {
    const g   = this.previewGraphics;
    const ptr = this.input.activePointer;
    g.clear();

    const sx = this._snap(ptr.x);
    const sy = this._snap(ptr.y);

    // ── Eraser tool: red highlight on the hovered object ─────────────────
    if (this.activeTool === 'eraser') {
      const hit = this._findObjectAt(ptr.x, ptr.y);
      if (hit) {
        g.lineStyle(2, C_ERASE_HOVER, 0.9);
        g.fillStyle(C_ERASE_HOVER, 0.18);
        if (hit.kind === 'platform') {
          const p = this.platforms[hit.index];
          g.fillRect(p.x, p.y, p.width, p.height);
          g.strokeRect(p.x, p.y, p.width, p.height);
        } else if (hit.kind === 'bomb') {
          const b = this.bombs[hit.index];
          g.fillCircle(b.x, b.y, 12);
          g.strokeCircle(b.x, b.y, 12);
        } else if (hit.kind === 'player') {
          const ps = this.playerStart;
          g.fillRect(ps.x - 2, ps.y - 2, 32, 44);
          g.strokeRect(ps.x - 2, ps.y - 2, 32, 44);
        } else if (hit.kind === 'enemy') {
          const e = this.enemies[hit.index];
          g.fillCircle(e.x, e.y, 16);
          g.strokeCircle(e.x, e.y, 16);
        }
      }
      // Crosshair is an X for the eraser to reinforce its destructive intent.
      g.lineStyle(1.5, C_ERASE_HOVER, 0.8);
      g.beginPath(); g.moveTo(sx - 7, sy - 7); g.lineTo(sx + 7, sy + 7); g.strokePath();
      g.beginPath(); g.moveTo(sx + 7, sy - 7); g.lineTo(sx - 7, sy + 7); g.strokePath();
      return;
    }

    // ── All other tools: gold crosshair + platform drag ghost ────────────
    g.lineStyle(1, C_PREVIEW_FILL, 0.5);
    g.beginPath(); g.moveTo(sx - 8, sy); g.lineTo(sx + 8, sy); g.strokePath();
    g.beginPath(); g.moveTo(sx, sy - 8); g.lineTo(sx, sy + 8); g.strokePath();

    if (this.isDragging && this.activeTool === 'platform') {
      const { rx, ry, rw, rh } = this._normaliseRect(
        this.dragStartX, this.dragStartY, sx, sy,
      );
      g.fillStyle(C_PREVIEW_FILL, 0.18);
      g.fillRect(rx, ry, rw, rh);
      g.lineStyle(2, C_PREVIEW_FILL, 0.9);
      g.strokeRect(rx, ry, rw, rh);
    }
  }

  // ── Keyboard input ────────────────────────────────────────────────────────────

  _setupKeyboard() {
    const kb = this.input.keyboard;
    kb.on('keydown-P',   () => { if (!this.isPreviewMode) this._setTool('platform'); });
    kb.on('keydown-B',   () => { if (!this.isPreviewMode) this._setTool('bomb'); });
    kb.on('keydown-S',   () => { if (!this.isPreviewMode) this._setTool('player'); });
    kb.on('keydown-E',   () => { if (!this.isPreviewMode) this._setTool('enemy'); });
    kb.on('keydown-D',   () => { if (!this.isPreviewMode) this._setTool('eraser'); });
    kb.on('keydown-G',   () => { if (!this.isPreviewMode) this._toggleSnap(); });
    kb.on('keydown-Z',   () => { if (!this.isPreviewMode) this._undo(); });
    kb.on('keydown-V',   () => this._togglePreview());
    kb.on('keydown-T',   () => { if (!this.isPreviewMode) this._doPlayTest(); });
    kb.on('keydown-ESC', () => {
      if (this.isPreviewMode) { this._exitPreview(); return; }
      this.scene.start('MenuScene');
    });
  }

  // ── Pointer / Mouse input ─────────────────────────────────────────────────────

  _setupPointer() {
    // Suppress the browser context-menu inside the canvas.
    const canvas = document.querySelector('#game-container canvas');
    this._contextHandler = (e) => e.preventDefault();
    if (canvas) canvas.addEventListener('contextmenu', this._contextHandler);

    this.input.on('pointerdown', (ptr) => {
      if (this.isPreviewMode) return; // Pointer locked during preview.
      if (ptr.rightButtonDown()) return;
      const sx = this._snap(ptr.x);
      const sy = this._snap(ptr.y);
      if (this.activeTool === 'platform') {
        this.isDragging = true;
        this.dragStartX = sx;
        this.dragStartY = sy;
      }
    });

    this.input.on('pointerup', (ptr) => {
      if (this.isPreviewMode) return; // Pointer locked during preview.
      // Right-button release → quick bomb placement, regardless of active tool.
      if (ptr.rightButtonReleased()) {
        this._placeBomb(this._snap(ptr.x), this._snap(ptr.y));
        return;
      }

      const sx = this._snap(ptr.x);
      const sy = this._snap(ptr.y);

      if (this.activeTool === 'platform' && this.isDragging) {
        this.isDragging = false;
        this._commitPlatform(this.dragStartX, this.dragStartY, sx, sy);
      } else if (this.activeTool === 'bomb') {
        this._placeBomb(sx, sy);
      } else if (this.activeTool === 'player') {
        this._placePlayerStart(sx, sy);
      } else if (this.activeTool === 'enemy') {
        this._placeEnemy(sx, sy);
      } else if (this.activeTool === 'eraser') {
        this._deleteAt(ptr.x, ptr.y);
      }
    });
  }

  // ── State mutators ────────────────────────────────────────────────────────────

  _commitPlatform(x1, y1, x2, y2) {
    const { rx, ry, rw, rh } = this._normaliseRect(x1, y1, x2, y2);
    if (rw < MIN_SIZE || rh < MIN_SIZE) return; // Degenerate / accidental click.
    this.undoStack.push({ type: 'platform', index: this.platforms.length });
    this.platforms.push({ x: rx, y: ry, width: rw, height: rh });
    this._redraw();
  }

  _placeBomb(cx, cy) {
    this.undoStack.push({ type: 'bomb', index: this.bombs.length });
    this.bombs.push({ x: cx, y: cy });
    this._redraw();
  }

  _placeEnemy(cx, cy) {
    this.undoStack.push({ type: 'enemy', index: this.enemies.length });
    this.enemies.push({ type: this.activeEnemyType, x: cx, y: cy });
    this._redraw();
  }

  _placePlayerStart(x, y) {
    this.undoStack.push({ type: 'player', prev: this.playerStart });
    this.playerStart = { x, y };
    this._redraw();
  }

  _undo() {
    const entry = this.undoStack.pop();
    if (!entry) return;

    if (entry.type === '__clear__') {
      this.platforms   = entry.platforms;
      this.bombs       = entry.bombs;
      this.playerStart = entry.playerStart;
      this.enemies     = entry.enemies;
    } else if (entry.type === 'platform') {
      this.platforms.splice(entry.index, 1);
    } else if (entry.type === 'bomb') {
      this.bombs.splice(entry.index, 1);
    } else if (entry.type === 'player') {
      this.playerStart = entry.prev;
    } else if (entry.type === 'delete_platform') {
      // Splice the deleted platform back at its original index.
      this.platforms.splice(entry.index, 0, entry.data);
    } else if (entry.type === 'delete_bomb') {
      this.bombs.splice(entry.index, 0, entry.data);
    } else if (entry.type === 'delete_player') {
      this.playerStart = entry.data;
    } else if (entry.type === 'enemy') {
      this.enemies.splice(entry.index, 1);
    } else if (entry.type === 'delete_enemy') {
      this.enemies.splice(entry.index, 0, entry.data);
    }

    this._redraw();
  }

  _clearAll() {
    // Store a full snapshot so one Z restores everything.
    this.undoStack.push({
      type:        '__clear__',
      platforms:   [...this.platforms],
      bombs:       [...this.bombs],
      playerStart: this.playerStart,
      enemies:     this.enemies.map(e => ({ ...e })),
    });
    this.platforms   = [];
    this.bombs       = [];
    this.playerStart = null;
    this.enemies     = [];
    this._redraw();
  }

  // ── Tool / snap switching ─────────────────────────────────────────────────────

  _setTool(tool) {
    this.activeTool = tool;
    this.isDragging = false; // Cancel any in-progress drag.
    this._syncToolbarButtons();
    this._updateStatus();
  }

  _toggleSnap() {
    this.snapSize = this.snapSize === 16 ? 32 : 16;
    this._drawGrid();
    this._syncSnapButtons();
    this._updateStatus();
  }

  // ── Coordinate helpers ────────────────────────────────────────────────────────

  /** Snap a raw pixel value to the nearest grid increment. */
  _snap(val) {
    return Math.round(val / this.snapSize) * this.snapSize;
  }

  /**
   * Normalise two arbitrary corners into a positive-width/height rect.
   * @returns {{ rx:number, ry:number, rw:number, rh:number }}
   */
  _normaliseRect(x1, y1, x2, y2) {
    return {
      rx: Math.min(x1, x2),
      ry: Math.min(y1, y2),
      rw: Math.abs(x2 - x1),
      rh: Math.abs(y2 - y1),
    };
  }

  // ── Eraser: hit-testing & deletion ───────────────────────────────────────────

  /**
   * Returns the topmost editor object under raw pointer coords (px, py),
   * or null if nothing is nearby.
   *
   * Priority order (smallest target first so accidental platform clicks
   * don't eat bombs that sit on top of them):
   *   1. player-start icon  (28 × 40 bounding box)
   *   2. bombs              (12 px radius)
   *   3. platforms          (full rectangle)
   *
   * @param {number} px  Raw (un-snapped) pointer X.
   * @param {number} py  Raw (un-snapped) pointer Y.
   * @returns {{ kind: 'platform'|'bomb'|'player', index: number } | null}
   */
  _findObjectAt(px, py) {
    // 1. Player-start (icon occupies [x, x+28] × [y, y+40]).
    if (this.playerStart) {
      const { x, y } = this.playerStart;
      if (px >= x - 2 && px <= x + 30 && py >= y - 2 && py <= y + 42) {
        return { kind: 'player', index: 0 };
      }
    }

    // 2. Bombs — iterate in reverse so the most-recently-placed one wins when
    //    two bombs overlap exactly.
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      if (Math.hypot(px - b.x, py - b.y) <= 12) {
        return { kind: 'bomb', index: i };
      }
    }

    // 3. Enemies — 14 px radius hit zone (covers the 28×28 bounding box).
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (Math.hypot(px - e.x, py - e.y) <= 14) {
        return { kind: 'enemy', index: i };
      }
    }

    // 4. Platforms — reverse order (topmost drawn = last in array).
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const p = this.platforms[i];
      if (px >= p.x && px <= p.x + p.width && py >= p.y && py <= p.y + p.height) {
        return { kind: 'platform', index: i };
      }
    }

    return null;
  }

  /**
   * Deletes the object under raw pointer coords (px, py) and pushes an
   * undo entry so Z can restore it at the same array position.
   */
  _deleteAt(px, py) {
    const hit = this._findObjectAt(px, py);
    if (!hit) return;

    if (hit.kind === 'platform') {
      this.undoStack.push({ type: 'delete_platform', index: hit.index, data: { ...this.platforms[hit.index] } });
      this.platforms.splice(hit.index, 1);
    } else if (hit.kind === 'bomb') {
      this.undoStack.push({ type: 'delete_bomb', index: hit.index, data: { ...this.bombs[hit.index] } });
      this.bombs.splice(hit.index, 1);
    } else if (hit.kind === 'player') {
      this.undoStack.push({ type: 'delete_player', data: { ...this.playerStart } });
      this.playerStart = null;
    } else if (hit.kind === 'enemy') {
      this.undoStack.push({ type: 'delete_enemy', index: hit.index, data: { ...this.enemies[hit.index] } });
      this.enemies.splice(hit.index, 1);
    }

    this._redraw();
  }

  // ── Play Test ─────────────────────────────────────────────────────────────────

  /**
   * Sleeps the EditorScene (preserving all state) and launches GameScene with
   * the current level data injected directly — no file save required.
   *
   * GameScene's ESC key and its win-condition both call
   *   scene.stop('GameScene') + scene.wake('EditorScene')
   * which triggers _onEditorWake() below.
   */
  _doPlayTest() {
    if (!this.playerStart) {
      this._showImportError('Set a Player-Start position before play-testing.');
      return;
    }
    if (this.platforms.length === 0) {
      this._showImportError('Add at least one platform before play-testing.');
      return;
    }

    // Hide the DOM toolbar so it doesn't float over the game.
    if (this._toolbar) this._toolbar.style.display = 'none';

    // Update the play-test button to give visual feedback.
    if (this._playTestBtnEl) {
      this._playTestBtnEl.textContent      = '⏳ Playing…';
      this._playTestBtnEl.style.background = '#4a2a00';
      this._playTestBtnEl.style.color      = '#ffd600';
    }

    // Build the inline level object from current editor state.
    const levelData = {
      playerStart: { ...this.playerStart },
      platforms:   this.platforms.map(p => ({ ...p })),
      bombs:       this.bombs.map(b => ({ ...b })),
      enemies:     this.enemies.map(e => ({ ...e })),
    };

    // Sleep (not stop) so init() is not called and all state is kept.
    this.scene.sleep('EditorScene');
    this.scene.launch('GameScene', {
      levelIndex: 0,   // fallback index, not actually used when levelData is present
      levelData,
      returnTo: 'EditorScene',
    });
  }

  /**
   * Called by Phaser when this scene wakes after a play-test.
   * Re-shows the toolbar and refreshes the canvas to the current edit state.
   */
  _onEditorWake() {
    if (this._toolbar) this._toolbar.style.display = '';

    if (this._playTestBtnEl) {
      this._playTestBtnEl.textContent      = '▶ Play Test  [T]';
      this._playTestBtnEl.style.background = '';
      this._playTestBtnEl.style.color      = '';
    }

    // Re-draw everything in case the wake triggered a resize or repaint.
    this._drawGrid();
    this._redraw();
    this._updateStatus();
  }

  // ── Export code generation ────────────────────────────────────────────────────

  /**
   * Builds a formatted JS string that exactly matches the level1.js / level2.js
   * style — JSDoc header, column-aligned numbers, full `export default` block.
   *
   * @param {number} [levelNum]  — Level number for the filename comment.
   *                               Defaults to LEVELS.length + 1.
   * @returns {string}
   */
  _generateExportCode(levelNum) {
    const n = levelNum ?? (LEVELS.length + 1);

    // ── Header comment ───────────────────────────────────────────────────
    const header = [
      `/**`,
      ` * src/levels/level${n}.js`,
      ` * --------------------`,
      ` * Layout data for Level ${n} — created with the visual editor.`,
      ` *`,
      ` * DATA SHAPE`,
      ` * ----------`,
      ` * playerStart  – { x, y }  World position where the player spawns.`,
      ` *`,
      ` * platforms    – Array of { x, y, width, height }`,
      ` *                  x / y    : top-left corner in world pixels.`,
      ` *                  width    : extent along the X axis (large = shelf, small = wall).`,
      ` *                  height   : extent along the Y axis (small = shelf, large = wall).`,
      ` *`,
      ` * bombs        – Array of { x, y }`,
      ` *                  World-space centre of each static bomb pickup.`,
      ` *`,
      ` * enemies      – Array of { type, x, y }`,
      ` *                  type : 'walker' | 'flier' | 'bouncer'`,
      ` *                  x / y: world-space spawn centre.`,
      ` *`,
      ` * NOTE: Canvas is 800 × 600 px.  Ground sits at y: 568.  Ceiling at y: 0.`,
      ` */`,
    ].join('\n');

    // ── Column-width helpers ─────────────────────────────────────────────
    const padNum = (num, width) => String(num).padStart(width);

    const fmtPlatform = (p, xW, yW, wW, hW) =>
      `    { x: ${padNum(p.x, xW)}, y: ${padNum(p.y, yW)}, width: ${padNum(p.width, wW)}, height: ${padNum(p.height, hW)} }`;

    const fmtBomb = (b, xW, yW) =>
      `    { x: ${padNum(b.x, xW)}, y: ${padNum(b.y, yW)} }`;

    const fmtEnemy = (e, xW, yW) =>
      `    { type: '${e.type}', x: ${padNum(e.x, xW)}, y: ${padNum(e.y, yW)} }`;

    const plats = this.platforms;
    const boms  = this.bombs;
    const enems = this.enemies;

    // Max digit-widths for each numeric field.
    const pXW = plats.length ? Math.max(...plats.map(p => String(p.x).length))      : 1;
    const pYW = plats.length ? Math.max(...plats.map(p => String(p.y).length))      : 1;
    const pWW = plats.length ? Math.max(...plats.map(p => String(p.width).length))  : 1;
    const pHW = plats.length ? Math.max(...plats.map(p => String(p.height).length)) : 1;
    const bXW = boms.length  ? Math.max(...boms.map(b => String(b.x).length))       : 1;
    const bYW = boms.length  ? Math.max(...boms.map(b => String(b.y).length))       : 1;
    const eXW = enems.length ? Math.max(...enems.map(e => String(e.x).length))      : 1;
    const eYW = enems.length ? Math.max(...enems.map(e => String(e.y).length))      : 1;

    // ── playerStart ──────────────────────────────────────────────────────
    const ps = this.playerStart ?? { x: 400, y: 510 };
    const playerStartLine = `  playerStart: { x: ${ps.x}, y: ${ps.y} },`;

    // ── platforms block ──────────────────────────────────────────────────
    const platformLines = plats.length
      ? plats.map(p => fmtPlatform(p, pXW, pYW, pWW, pHW)).join(',\n')
      : '    // No platforms placed yet.';

    // ── bombs block ──────────────────────────────────────────────────────
    const bombLines = boms.length
      ? boms.map(b => fmtBomb(b, bXW, bYW)).join(',\n')
      : '    // No bombs placed yet.';

    // ── enemies block ────────────────────────────────────────────────────
    const enemyLines = enems.length
      ? enems.map(e => fmtEnemy(e, eXW, eYW)).join(',\n')
      : '    // No enemies placed yet.';

    return [
      header,
      '',
      'export default {',
      playerStartLine,
      '',
      '  platforms: [',
      platformLines,
      '  ],',
      '',
      '  bombs: [',
      bombLines,
      '  ],',
      '',
      '  enemies: [',
      enemyLines,
      '  ],',
      '};',
      '',
    ].join('\n');
  }

  // ── Export actions ────────────────────────────────────────────────────────────

  /** Always logs — also returns the string so callers can chain. */
  _doExport() {
    const code = this._generateExportCode();
    console.log(
      '%c── EditorScene Export ──────────────────────────────────────────────',
      'color:#ffd600; font-weight:bold; font-size:13px;',
    );
    console.log(code);
    console.log(
      '%c────────────────────────────────────────────────────────────────────',
      'color:#ffd600;',
    );
    return code;
  }

  _doCopyToClipboard(btnEl) {
    const code = this._doExport();
    navigator.clipboard.writeText(code).then(() => {
      const orig = btnEl.textContent;
      btnEl.textContent      = '✅ Copied!';
      btnEl.style.background = '#2e7d32';
      btnEl.style.color      = '#ffffff';
      setTimeout(() => {
        btnEl.textContent      = orig;
        btnEl.style.background = '';
        btnEl.style.color      = '';
      }, 2000);
    }).catch(() => {
      alert('Clipboard unavailable — see browser console for the exported code.');
    });
  }

  _doDownload() {
    const n    = LEVELS.length + 1;
    const code = this._generateExportCode(n);
    const blob = new Blob([code], { type: 'text/javascript' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `level${n}.js`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Status bar ────────────────────────────────────────────────────────────────

  // ── Import: file ─────────────────────────────────────────────────────────────

  /**
   * Opens a hidden <input type="file"> that accepts .js and .txt files.
   * The chosen file is read as text and passed to _parseAndLoadLevel().
   */
  _doLoadFile() {
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = '.js,.txt';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) { document.body.removeChild(input); return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        document.body.removeChild(input);
        const err = this._parseAndLoadLevel(e.target.result, file.name);
        if (err) this._showImportError(err);
      };
      reader.onerror = () => {
        document.body.removeChild(input);
        this._showImportError('Could not read file.');
      };
      reader.readAsText(file);
    });

    input.click();
  }

  // ── Import: paste modal ───────────────────────────────────────────────────────

  /**
   * Opens a centred DOM modal with a <textarea> for pasting level JS.
   * Phaser keyboard input is paused while the modal is open so typing
   * in the textarea is not intercepted by the game engine.
   * Ctrl+Enter confirms; Escape cancels.
   */
  _doOpenPasteModal() {
    if (this._pasteModal) return;
    this.input.keyboard.enabled = false;

    const overlay = document.createElement('div');
    overlay.id = 'import-modal-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.72)',
      zIndex: '99998', display: 'flex', alignItems: 'center', justifyContent: 'center',
    });

    const box = document.createElement('div');
    Object.assign(box.style, {
      background: '#12122a', border: '1px solid #4a4a7a', borderRadius: '10px',
      padding: '22px 24px', width: '560px', maxWidth: '92vw',
      boxShadow: '0 8px 40px rgba(0,0,0,0.85)', fontFamily: 'Arial, sans-serif',
      color: '#e0e0ff', display: 'flex', flexDirection: 'column', gap: '12px',
    });

    const heading = document.createElement('div');
    heading.textContent = '📥 Paste Level Source';
    Object.assign(heading.style, { fontSize: '16px', fontWeight: 'bold', color: '#ffd600' });

    const instr = document.createElement('div');
    instr.textContent =
      'Paste the full contents of a level .js file (or a plain object literal) below.\n' +
      'Ctrl+Enter to load  ·  Escape to cancel.';
    Object.assign(instr.style, { fontSize: '12px', color: '#888899', whiteSpace: 'pre-wrap' });

    const ta = document.createElement('textarea');
    Object.assign(ta.style, {
      width: '100%', height: '280px', background: '#0a0a1e',
      border: '1px solid #3a3a6a', borderRadius: '5px', color: '#e0e0ff',
      fontFamily: '"Courier New", Courier, monospace', fontSize: '12px',
      padding: '8px', resize: 'vertical', boxSizing: 'border-box', outline: 'none',
    });
    ta.placeholder =
      'export default {\n  playerStart: { x: 80, y: 510 },\n  platforms: [ ... ],\n  bombs: [ ... ],\n};';
    ta.spellcheck = false;

    const errorEl = document.createElement('div');
    Object.assign(errorEl.style, {
      color: '#ff6060', fontSize: '12px', background: '#2a0a0a',
      border: '1px solid #7a2020', borderRadius: '4px', padding: '6px 8px',
      display: 'none', whiteSpace: 'pre-wrap',
      fontFamily: '"Courier New", Courier, monospace',
    });

    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, { display: 'flex', gap: '10px', justifyContent: 'flex-end' });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    Object.assign(cancelBtn.style, {
      background: '#2a2a4a', color: '#e0e0ff', border: '1px solid #4a4a7a',
      borderRadius: '4px', padding: '7px 18px', cursor: 'pointer', fontSize: '13px',
    });

    const loadBtn = document.createElement('button');
    loadBtn.textContent = '📥 Load Level';
    Object.assign(loadBtn.style, {
      background: '#1565c0', color: '#fff', border: 'none', borderRadius: '4px',
      padding: '7px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
    });

    const attemptLoad = () => {
      const text = ta.value.trim();
      if (!text) { errorEl.textContent = 'Textarea is empty.'; errorEl.style.display = 'block'; return; }
      const err = this._parseAndLoadLevel(text, 'pasted text');
      if (!err) { this._closePasteModal(); }
      else { errorEl.textContent = err; errorEl.style.display = 'block'; }
    };

    loadBtn.addEventListener('click', attemptLoad);
    cancelBtn.addEventListener('click', () => this._closePasteModal());
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); attemptLoad(); }
      if (e.key === 'Escape') { e.preventDefault(); this._closePasteModal(); }
    });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(loadBtn);
    [heading, instr, ta, errorEl, btnRow].forEach(el => box.appendChild(el));
    overlay.appendChild(box);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this._closePasteModal(); });

    document.body.appendChild(overlay);
    this._pasteModal = overlay;
    requestAnimationFrame(() => ta.focus());
  }

  _closePasteModal() {
    if (this._pasteModal && this._pasteModal.parentNode) {
      this._pasteModal.parentNode.removeChild(this._pasteModal);
    }
    this._pasteModal = null;
    this.input.keyboard.enabled = true;
  }

  // ── Import: parser / validator ────────────────────────────────────────────────

  /**
   * Parses raw level source text and loads it into the editor.
   *
   * 1. Strip JS comments.
   * 2. Remove `export default` / `module.exports =` wrappers.
   * 3. Evaluate with `new Function` to get a plain JS object.
   * 4. Validate the shape.
   * 5. Call _loadLevelData() to apply.
   *
   * @param {string} text
   * @param {string} [label]  Used in error messages.
   * @returns {string|null}   null on success, error string on failure.
   */
  _parseAndLoadLevel(text, label) {
    label = label || 'input';
    try {
      let src = text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .trim();
      src = src
        .replace(/^export\s+default\s+/, '')
        .replace(/^module\.exports\s*=\s*/, '')
        .trim();
      if (src.endsWith(';')) src = src.slice(0, -1).trim();

      // eslint-disable-next-line no-new-func
      const data = new Function('"use strict"; return (' + src + ')')();

      const ve = this._validateLevelData(data);
      if (ve) return 'Validation error in ' + label + ':\n' + ve;

      this._loadLevelData(data, label);
      return null;
    } catch (e) {
      return 'Parse error in ' + label + ':\n' + e.message;
    }
  }

  /** Returns null if valid, or an error string describing the first problem. */
  _validateLevelData(data) {
    if (typeof data !== 'object' || data === null)
      return 'Top-level value is not an object.';
    if (data.playerStart !== undefined) {
      const ps = data.playerStart;
      if (typeof ps !== 'object' || typeof ps.x !== 'number' || typeof ps.y !== 'number')
        return '`playerStart` must be { x: number, y: number }.';
    }
    if (!Array.isArray(data.platforms)) return '`platforms` must be an array.';
    for (let i = 0; i < data.platforms.length; i++) {
      const p = data.platforms[i];
      if (typeof p.x !== 'number' || typeof p.y !== 'number' ||
          typeof p.width !== 'number' || typeof p.height !== 'number')
        return 'platforms[' + i + '] must be { x, y, width, height } (all numbers).';
    }
    if (!Array.isArray(data.bombs)) return '`bombs` must be an array.';
    for (let i = 0; i < data.bombs.length; i++) {
      const b = data.bombs[i];
      if (typeof b.x !== 'number' || typeof b.y !== 'number')
        return 'bombs[' + i + '] must be { x: number, y: number }.';
    }
    // enemies is optional — only validate if present.
    if (data.enemies !== undefined) {
      if (!Array.isArray(data.enemies)) return '`enemies` must be an array.';
      const validTypes = ['walker', 'flier', 'bouncer'];
      for (let i = 0; i < data.enemies.length; i++) {
        const e = data.enemies[i];
        if (typeof e.x !== 'number' || typeof e.y !== 'number')
          return 'enemies[' + i + '] must have numeric x and y.';
        if (typeof e.type !== 'string' || !validTypes.includes(e.type))
          return 'enemies[' + i + '].type must be "walker", "flier", or "bouncer".';
      }
    }
    return null;
  }

  /**
   * Overwrites editor state with validated level data.
   * Pushes a full snapshot to the undo stack so Z reverts the entire import.
   */
  _loadLevelData(data, label) {
    label = label || 'import';
    this.undoStack.push({
      type: '__clear__',
      platforms:   [...this.platforms],
      bombs:       [...this.bombs],
      playerStart: this.playerStart,
      enemies:     this.enemies.map(e => ({ ...e })),
    });
    this.platforms   = data.platforms.map(p => ({ ...p }));
    this.bombs       = data.bombs.map(b => ({ ...b }));
    this.playerStart = data.playerStart ? { ...data.playerStart } : null;
    this.enemies     = data.enemies ? data.enemies.map(e => ({ ...e })) : [];
    this._redraw();
    console.log('%c── EditorScene Import ── loaded from: ' + label, 'color:#00e676; font-weight:bold;');
    console.log('  platforms:', this.platforms.length, ' bombs:', this.bombs.length,
                ' enemies:', this.enemies.length, ' playerStart:', this.playerStart);
  }

  /** Show a timed error in the status bar (used by the file-import path). */
  _showImportError(msg) {
    if (!this._statusEl) return;
    const saved = this._statusEl.innerHTML;
    this._statusEl.innerHTML = '<span style="color:#ff6060">⚠ ' + msg.replace(/\n/g, '<br>') + '</span>';
    setTimeout(() => { this._statusEl.innerHTML = saved; this._updateStatus(); }, 5000);
  }

  // ── Preview mode ──────────────────────────────────────────────────────────────

  _togglePreview() {
    this.isPreviewMode ? this._exitPreview() : this._enterPreview();
  }

  /**
   * Hides all editor Graphics layers and spawns the same game objects that
   * GameScene uses so the level looks exactly as it will in play:
   * tileSprite platforms, bomb images with pulse tween, player at spawn point.
   */
  _enterPreview() {
    if (this.isPreviewMode) return;
    this.isPreviewMode = true;
    this.isDragging    = false;

    this.gridGraphics.setVisible(false);
    this.contentGraphics.setVisible(false);
    this.previewGraphics.setVisible(false);

    const objs = this._previewObjects;

    objs.push(this.add.image(0, 0, 'background').setOrigin(0, 0).setDepth(0));

    for (const p of this.platforms) {
      objs.push(
        this.add.tileSprite(p.x, p.y, p.width, p.height, 'platform')
          .setOrigin(0, 0).setDepth(1),
      );
    }

    const bombImgs = [];
    for (const b of this.bombs) {
      const img = this.add.image(b.x, b.y, 'bomb').setDepth(2);
      objs.push(img);
      bombImgs.push(img);
    }

    if (this.playerStart) {
      const ps = this.playerStart;
      objs.push(this.add.image(ps.x + 14, ps.y + 20, 'player').setDepth(3));
      objs.push(
        this.add.text(ps.x + 14, ps.y + 46, 'START', {
          fontSize: '9px', fontFamily: 'Arial, sans-serif',
          color: '#00e676', align: 'center',
        }).setOrigin(0.5, 0).setDepth(4),
      );
    }

    // Enemies — render using the same textures as GameScene.
    for (const e of this.enemies) {
      objs.push(
        this.add.image(e.x, e.y, 'enemy_' + e.type).setOrigin(0.5, 0.5).setDepth(3),
      );
    }

    // Bomb-pulse — mirrors GameScene._startBombPulse() exactly.
    if (bombImgs.length) {
      this._previewTimer = this.time.addEvent({
        delay: 600, loop: true,
        callback: () => {
          const tick = Math.floor(this.time.now / 600) % 2 === 0;
          bombImgs.forEach(b => { if (b.active) b.setTint(tick ? 0xff6f00 : 0xffd600); });
        },
      });
    }

    objs.push(this.add.rectangle(CANVAS_W / 2, 20, 360, 28, 0x000000, 0.72).setDepth(10));
    objs.push(
      this.add.text(CANVAS_W / 2, 20,
        '👁 PREVIEW  —  V or ESC to return to editor',
        { fontSize: '12px', fontFamily: 'Arial, sans-serif', color: '#ffd600', align: 'center' },
      ).setOrigin(0.5).setDepth(11),
    );

    if (this._previewBtnEl) {
      this._previewBtnEl.textContent      = '✏️ Back to Edit  [V]';
      this._previewBtnEl.style.background = '#1a4a1a';
      this._previewBtnEl.style.color      = '#00e676';
    }
  }

  _exitPreview() {
    if (!this.isPreviewMode) return;
    this.isPreviewMode = false;
    this._clearPreviewObjects();

    this.gridGraphics.setVisible(true);
    this.contentGraphics.setVisible(true);
    this.previewGraphics.setVisible(true);

    if (this._previewBtnEl) {
      this._previewBtnEl.textContent      = '👁 Preview  [V]';
      this._previewBtnEl.style.background = '';
      this._previewBtnEl.style.color      = '';
    }
  }

  /** Destroy all Phaser objects spawned during preview and stop the pulse timer. */
  _clearPreviewObjects() {
    if (this._previewTimer) { this._previewTimer.remove(false); this._previewTimer = null; }
    for (const obj of this._previewObjects) {
      if (obj && obj.active) obj.destroy();
    }
    this._previewObjects = [];
  }

  _updateStatus() {
    if (!this._statusEl) return;
    if (this.isPreviewMode) {
      this._statusEl.innerHTML =
        '<span style="color:#00e676"><b>👁 Preview mode</b></span><br>' +
        '<span style="font-size:11px">Press V or ESC to return</span>';
      return;
    }
    const toolLabels = {
      platform: '🔲 Platform',
      bomb:     '💣 Bomb',
      player:   '🧍 Player-Start',
      enemy:    '👾 Enemy',
      eraser:   '🗑 Eraser',
    };
    const ps = this.playerStart ? '✓' : '✗';
    this._statusEl.innerHTML =
      `<b>Tool:</b> ${toolLabels[this.activeTool]}&nbsp;&nbsp;` +
      `<b>Snap:</b> ${this.snapSize}px<br>` +
      `<b>🔲</b> ${this.platforms.length}&nbsp;&nbsp;` +
      `<b>💣</b> ${this.bombs.length}&nbsp;&nbsp;` +
      `<b>👾</b> ${this.enemies.length}&nbsp;&nbsp;` +
      `<b>🧍</b> ${ps}`;
  }

  // ── DOM Toolbar ───────────────────────────────────────────────────────────────

  /**
   * Injects a styled HTML panel to the right of the game canvas.
   * All DOM nodes are stored on `this._toolbar` and removed in shutdown().
   */
  _buildToolbar() {
    // ── Outer container ──────────────────────────────────────────────────
    const bar = document.createElement('div');
    bar.id = 'editor-toolbar';
    Object.assign(bar.style, {
      position:      'fixed',
      top:           '50%',
      // Canvas is centred; 400 px right of midpoint + 12 px gap.
      left:          'calc(50% + 412px)',
      transform:     'translateY(-50%)',
      zIndex:        '9999',
      background:    'rgba(18, 18, 36, 0.97)',
      border:        '1px solid #3a3a6a',
      borderRadius:  '8px',
      padding:       '12px 14px',
      color:         '#e0e0ff',
      fontFamily:    'Arial, sans-serif',
      fontSize:      '13px',
      minWidth:      '188px',
      maxWidth:      '215px',
      boxShadow:     '0 4px 24px rgba(0,0,0,0.75)',
      userSelect:    'none',
      lineHeight:    '1.5',
      display:       'flex',
      flexDirection: 'column',
      gap:           '10px',
    });

    // ── Local helpers ────────────────────────────────────────────────────
    const sectionHead = (text) => {
      const h = document.createElement('div');
      h.textContent = text;
      Object.assign(h.style, {
        color:         '#ffd600',
        fontWeight:    'bold',
        fontSize:      '10px',
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        borderBottom:  '1px solid #3a3a6a',
        paddingBottom: '3px',
        marginBottom:  '2px',
      });
      return h;
    };

    const makeBtn = (label, title, onClick, extra = {}) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.title       = title;
      Object.assign(btn.style, {
        background:   '#2a2a4a',
        color:        '#e0e0ff',
        border:       '1px solid #4a4a7a',
        borderRadius: '4px',
        padding:      '5px 8px',
        cursor:       'pointer',
        fontSize:     '13px',
        textAlign:    'left',
        transition:   'background 0.12s',
        ...extra,
      });
      const baseBg = extra.background ?? '#2a2a4a';
      btn._baseBg = baseBg;
      btn.addEventListener('mouseover', () => { if (!btn.dataset.active) btn.style.background = '#3a3a6a'; });
      btn.addEventListener('mouseout',  () => { if (!btn.dataset.active) btn.style.background = baseBg; });
      btn.addEventListener('click', onClick);
      return btn;
    };

    const markActive = (btn) => {
      btn.dataset.active   = '1';
      btn.style.background = '#ffd600';
      btn.style.color      = '#1a1a2e';
      btn.style.fontWeight = 'bold';
    };
    const markInactive = (btn) => {
      delete btn.dataset.active;
      btn.style.background = btn._baseBg ?? '#2a2a4a';
      btn.style.color      = '#e0e0ff';
      btn.style.fontWeight = 'normal';
    };

    // ── Section: Active Tool ─────────────────────────────────────────────
    const toolSec = document.createElement('div');
    toolSec.appendChild(sectionHead('Active Tool'));
    const toolCol = document.createElement('div');
    Object.assign(toolCol.style, { display: 'flex', flexDirection: 'column', gap: '4px' });

    const btnPlatform = makeBtn('🔲 Platform  [P]',     'Drag to draw a platform rect', () => this._setTool('platform'));
    const btnBomb     = makeBtn('💣 Bomb  [B]',          'Click to place a bomb',        () => this._setTool('bomb'));
    const btnPlayer   = makeBtn('🧍 Player-Start  [S]', 'Click to set spawn point',     () => this._setTool('player'));
    const btnEnemy    = makeBtn('👾 Enemy  [E]',         'Click to place an enemy',      () => this._setTool('enemy'));
    const btnEraser   = makeBtn('🗑 Eraser  [D]',        'Click any object to delete it',() => this._setTool('eraser'));

    // ── Enemy sub-type selector ─────────────────────────────────────────
    // Shown below the Enemy button only while the enemy tool is active.
    const enemySubRow = document.createElement('div');
    Object.assign(enemySubRow.style, {
      display:       'none',
      flexDirection: 'column',
      gap:           '3px',
      padding:       '4px 0 2px 8px',
      borderLeft:    '2px solid #7b1fa2',
    });

    const makeEnemyTypeBtn = (type, label, title) => {
      const b = makeBtn(label, title, () => {
        this.activeEnemyType = type;
        // Highlight the selected type.
        [btnWalker, btnFlier, btnBouncer].forEach(tb => markInactive(tb));
        markActive(b);
      }, { fontSize: '12px', padding: '3px 6px' });
      return b;
    };

    const btnWalker  = makeEnemyTypeBtn('walker',  '🔴 Walker',  'Patrols platform edges');
    const btnFlier   = makeEnemyTypeBtn('flier',   '🟣 Flier',   'Drifts toward the player');
    const btnBouncer = makeEnemyTypeBtn('bouncer', '🟢 Bouncer', 'Bounces diagonally off surfaces');

    [btnWalker, btnFlier, btnBouncer].forEach(b => enemySubRow.appendChild(b));
    this._enemySubRowEl = enemySubRow;

    // Default: Walker is pre-selected.
    markActive(btnWalker);

    this._toolBtns = { platform: btnPlatform, bomb: btnBomb, player: btnPlayer, enemy: btnEnemy, eraser: btnEraser };
    [btnPlatform, btnBomb, btnPlayer, btnEnemy, enemySubRow, btnEraser].forEach(b => toolCol.appendChild(b));
    toolSec.appendChild(toolCol);
    bar.appendChild(toolSec);

    // ── Section: Grid Snap ───────────────────────────────────────────────
    const snapSec = document.createElement('div');
    snapSec.appendChild(sectionHead('Grid Snap  [G to toggle]'));
    const snapRow = document.createElement('div');
    Object.assign(snapRow.style, { display: 'flex', gap: '6px' });

    const btn16 = makeBtn('16 px', 'Snap to 16 px', () => {
      this.snapSize = 16; this._drawGrid(); this._syncSnapButtons(); this._updateStatus();
    }, { flex: '1', textAlign: 'center' });

    const btn32 = makeBtn('32 px', 'Snap to 32 px', () => {
      this.snapSize = 32; this._drawGrid(); this._syncSnapButtons(); this._updateStatus();
    }, { flex: '1', textAlign: 'center' });

    this._snapBtns = { 16: btn16, 32: btn32 };
    snapRow.appendChild(btn16);
    snapRow.appendChild(btn32);
    snapSec.appendChild(snapRow);
    bar.appendChild(snapSec);

    // ── Section: Edit ────────────────────────────────────────────────────
    const editSec = document.createElement('div');
    editSec.appendChild(sectionHead('Edit'));
    const editRow = document.createElement('div');
    Object.assign(editRow.style, { display: 'flex', gap: '6px' });

    const btnUndo  = makeBtn('↩ Undo  [Z]', 'Undo last placement', () => this._undo(),
      { flex: '1', textAlign: 'center' });
    const btnClear = makeBtn('🗑 Clear All', 'Remove everything',    () => {
      if (window.confirm('Clear all platforms, bombs, and player-start?')) this._clearAll();
    }, { flex: '1', textAlign: 'center', background: '#4a1010' });

    editRow.appendChild(btnUndo);
    editRow.appendChild(btnClear);
    editSec.appendChild(editRow);
    bar.appendChild(editSec);

    // ── Section: Export ──────────────────────────────────────────────────
    const exportSec = document.createElement('div');
    exportSec.appendChild(sectionHead('Export'));
    const exportCol = document.createElement('div');
    Object.assign(exportCol.style, { display: 'flex', flexDirection: 'column', gap: '5px' });

    const btnLog  = makeBtn('📋 Export & Log to Console', 'Print level JS to console',  () => this._doExport());
    const btnCopy = makeBtn('⎘ Copy to Clipboard',        'Copy level JS to clipboard', () => this._doCopyToClipboard(btnCopy));
    const btnDl   = makeBtn('⬇ Download level.js',        'Download as a .js file',     () => this._doDownload());

    [btnLog, btnCopy, btnDl].forEach(b => exportCol.appendChild(b));
    exportSec.appendChild(exportCol);
    bar.appendChild(exportSec);

    // ── Section: Import ──────────────────────────────────────────────────
    const importSec = document.createElement('div');
    importSec.appendChild(sectionHead('Import'));
    const importCol = document.createElement('div');
    Object.assign(importCol.style, { display: 'flex', flexDirection: 'column', gap: '5px' });

    const btnLoadFile  = makeBtn('📂 Open .js / .txt File', 'Load a level file from disk',      () => this._doLoadFile());
    const btnPasteOpen = makeBtn('📋 Paste Level Source',   'Paste level JS into a text dialog', () => this._doOpenPasteModal());

    importCol.appendChild(btnLoadFile);
    importCol.appendChild(btnPasteOpen);
    importSec.appendChild(importCol);
    bar.appendChild(importSec);

    // ── Section: Preview ─────────────────────────────────────────────────
    const previewSec = document.createElement('div');
    previewSec.appendChild(sectionHead('Preview & Play Test'));
    const previewCol = document.createElement('div');
    Object.assign(previewCol.style, { display: 'flex', flexDirection: 'column', gap: '5px' });

    const previewBtn = makeBtn('👁 Preview  [V]', 'Static visual preview (no physics)', () => this._togglePreview());
    this._previewBtnEl = previewBtn;

    const playTestBtn = makeBtn('▶ Play Test  [T]',
      'Launch fully playable GameScene — ESC returns here',
      () => this._doPlayTest(),
      { background: '#1a3a1a' },
    );
    this._playTestBtnEl = playTestBtn;

    previewCol.appendChild(previewBtn);
    previewCol.appendChild(playTestBtn);
    previewSec.appendChild(previewCol);
    bar.appendChild(previewSec);

    // ── Section: Navigate ────────────────────────────────────────────────
    const navSec = document.createElement('div');
    navSec.appendChild(sectionHead('Navigate'));
    navSec.appendChild(makeBtn('← Back to Menu  [ESC]', 'Return to main menu', () => this.scene.start('MenuScene')));
    bar.appendChild(navSec);

    // ── Section: Status ──────────────────────────────────────────────────
    const statusSec = document.createElement('div');
    statusSec.appendChild(sectionHead('Status'));
    const statusEl = document.createElement('div');
    Object.assign(statusEl.style, {
      background:   '#0e0e20',
      border:       '1px solid #2a2a4a',
      borderRadius: '4px',
      padding:      '5px 7px',
      fontSize:     '12px',
      lineHeight:   '1.7',
      color:        '#aaaacc',
    });
    statusSec.appendChild(statusEl);
    bar.appendChild(statusSec);

    // ── Mount ────────────────────────────────────────────────────────────
    document.body.appendChild(bar);
    this._toolbar  = bar;
    this._statusEl = statusEl;

    // Sync helpers — need closure over markActive / markInactive.
    this._syncToolbarButtons = () => {
      Object.entries(this._toolBtns).forEach(([key, btn]) => {
        key === this.activeTool ? markActive(btn) : markInactive(btn);
      });
      // Show the enemy sub-type picker only while the enemy tool is active.
      if (this._enemySubRowEl) {
        this._enemySubRowEl.style.display =
          this.activeTool === 'enemy' ? 'flex' : 'none';
      }
    };

    this._syncSnapButtons = () => {
      Object.entries(this._snapBtns).forEach(([size, btn]) => {
        Number(size) === this.snapSize ? markActive(btn) : markInactive(btn);
      });
    };

    // Apply initial highlight state.
    this._syncToolbarButtons();
    this._syncSnapButtons();
  }
}

