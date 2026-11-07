/**
 * src/scenes/BootScene.js
 * -----------------------
 * Responsible for generating all game textures programmatically using Phaser's
 * Graphics API.  No external image files are required — the game works out of
 * the box on any machine after `npm install`.
 *
 * Textures created here:
 *   'player'         – Blue 28×40 figure (the hero).
 *   'platform'       – Earthy brown/green tile used for all platforms.
 *   'bomb'           – Bright orange circle with a dark fuse detail.
 *   'background'     – Full-canvas gradient backdrop (800×600).
 *   'enemy_walker'   – Red hunched crawler that patrols platforms (32×32).
 *   'enemy_flier'    – Purple winged creature that drifts toward the player (32×32).
 *   'enemy_bouncer'  – Teal sphere that bounces diagonally off all surfaces (32×32).
 *
 * After all textures are ready the scene immediately hands off to MenuScene.
 */

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  // ---------------------------------------------------------------------------
  // preload() — nothing to load from disk; everything is generated in create().
  // ---------------------------------------------------------------------------
  preload() {
    // Intentionally empty — textures are drawn programmatically below.
  }

  // ---------------------------------------------------------------------------
  // create() — draw every texture the game needs, then boot into level 1.
  // ---------------------------------------------------------------------------
  create() {
    this._createBackgroundTexture();
    this._createPlatformTexture();
    this._createPlayerTexture();
    this._createBombTexture();
    this._createEnemyWalkerTexture();
    this._createEnemyFlierTexture();
    this._createEnemyBouncerTexture();

    // All textures are ready — show the main menu.
    this.scene.start('MenuScene');
  }

  // ---------------------------------------------------------------------------
  // Private helpers — one method per texture for easy tweaking.
  // ---------------------------------------------------------------------------

  /** Deep-blue gradient backdrop that fills the whole canvas. */
  _createBackgroundTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Top colour → bottom colour via a simple manual gradient using thin horizontal rects.
    const topColor    = Phaser.Display.Color.HexStringToColor('#1a1a2e');
    const bottomColor = Phaser.Display.Color.HexStringToColor('#16213e');
    const steps       = 600;

    for (let i = 0; i < steps; i++) {
      const t   = i / steps;
      const r   = Math.round(Phaser.Math.Linear(topColor.r, bottomColor.r, t));
      const gv  = Math.round(Phaser.Math.Linear(topColor.g, bottomColor.g, t));
      const b   = Math.round(Phaser.Math.Linear(topColor.b, bottomColor.b, t));
      g.fillStyle(Phaser.Display.Color.GetColor(r, gv, b), 1);
      g.fillRect(0, i, 800, 1);
    }

    g.generateTexture('background', 800, 600);
    g.destroy();
  }

  /** Tiled stone / wood platform block. */
  _createPlatformTexture() {
    const TILE_W = 32;
    const TILE_H = 20;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Base fill — warm dark earth tone.
    g.fillStyle(0x5c4033, 1);
    g.fillRect(0, 0, TILE_W, TILE_H);

    // Top highlight — lighter stripe to give a lit-from-above look.
    g.fillStyle(0x8d6e63, 1);
    g.fillRect(0, 0, TILE_W, 4);

    // Bottom shadow.
    g.fillStyle(0x3e2723, 1);
    g.fillRect(0, TILE_H - 3, TILE_W, 3);

    // Vertical grout lines to suggest individual tiles.
    g.fillStyle(0x3e2723, 1);
    g.fillRect(TILE_W / 2, 0, 2, TILE_H);

    g.generateTexture('platform', TILE_W, TILE_H);
    g.destroy();
  }

  /** The player character — a blocky blue figure. */
  _createPlayerTexture() {
    const W = 28;
    const H = 40;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Body.
    g.fillStyle(0x1565c0, 1);
    g.fillRect(4, 14, 20, 22);

    // Head.
    g.fillStyle(0xffcc80, 1); // Skin tone.
    g.fillRect(8, 2, 14, 14);

    // Eyes.
    g.fillStyle(0x1a237e, 1);
    g.fillRect(11, 6, 3, 3);
    g.fillRect(16, 6, 3, 3);

    // Arms.
    g.fillStyle(0x1565c0, 1);
    g.fillRect(0, 16, 6, 14);
    g.fillRect(22, 16, 6, 14);

    // Legs.
    g.fillStyle(0x0d47a1, 1);
    g.fillRect(5,  36, 8, 4);
    g.fillRect(15, 36, 8, 4);

    g.generateTexture('player', W, H);
    g.destroy();
  }

  /** Classic Bomb Jack bomb — round, black, with an orange fuse spark. */
  _createBombTexture() {
    const SIZE = 24;
    const cx   = SIZE / 2;
    const cy   = SIZE / 2 + 2;
    const r    = 9;
    const g    = this.make.graphics({ x: 0, y: 0, add: false });

    // Outer glow / shadow.
    g.fillStyle(0x333333, 0.5);
    g.fillCircle(cx + 1, cy + 1, r + 1);

    // Main bomb body — near-black dark grey.
    g.fillStyle(0x212121, 1);
    g.fillCircle(cx, cy, r);

    // Shine highlight (top-left quadrant).
    g.fillStyle(0x616161, 1);
    g.fillCircle(cx - 3, cy - 3, 3);

    // Fuse cord — thin dark brown rectangle leading to the spark.
    g.fillStyle(0x5d4037, 1);
    g.fillRect(cx - 1, cy - r - 5, 2, 6);

    // Spark at the top of the fuse — bright orange/yellow.
    g.fillStyle(0xffd600, 1);
    g.fillCircle(cx, cy - r - 5, 3);

    // Inner spark highlight — white hot centre.
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, cy - r - 5, 1);

    g.generateTexture('bomb', SIZE, SIZE);
    g.destroy();
  }

  // ---------------------------------------------------------------------------
  // Enemy textures — three distinct 32×32 sprites.
  // ---------------------------------------------------------------------------

  /**
   * 'enemy_walker' — Red hunched crawler.
   * Low-slung armoured body, back spikes, glowing amber eyes, four leg stubs.
   */
  _createEnemyWalkerTexture() {
    const SIZE = 32;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Ground shadow.
    g.fillStyle(0x000000, 0.22);
    g.fillRect(3, 28, 26, 4);

    // Back spikes — three sharp triangles.
    g.fillStyle(0xff3333, 1);
    g.fillTriangle( 7, 14,  11, 14,   9,  5);
    g.fillTriangle(13, 14,  19, 14,  16,  3);
    g.fillTriangle(21, 14,  25, 14,  23,  6);

    // Main crawler body — wide, flat, armoured.
    g.fillStyle(0xcc1111, 1);
    g.fillRect(2, 14, 28, 12);

    // Belly highlight.
    g.fillStyle(0xff5555, 0.35);
    g.fillRect(4, 18, 24, 5);

    // Head — pushed forward (right side).
    g.fillStyle(0xdd1a1a, 1);
    g.fillRect(18, 8, 12, 10);

    // Eyes — glowing amber.
    g.fillStyle(0xffcc00, 1);
    g.fillCircle(22, 12, 3);
    g.fillCircle(28, 12, 3);

    // Pupils.
    g.fillStyle(0x1a0000, 1);
    g.fillCircle(23, 12, 1);
    g.fillCircle(29, 12, 1);

    // Legs — four dark-red stubs.
    g.fillStyle(0x880000, 1);
    g.fillRect( 3, 24, 4, 8);
    g.fillRect( 9, 25, 4, 7);
    g.fillRect(16, 25, 4, 7);
    g.fillRect(22, 24, 4, 8);

    // Claw tips.
    g.fillStyle(0xffaaaa, 1);
    g.fillRect( 3, 31, 3, 1);
    g.fillRect( 9, 31, 3, 1);
    g.fillRect(16, 31, 3, 1);
    g.fillRect(22, 31, 3, 1);

    // Body outline.
    g.lineStyle(1, 0x880000, 0.8);
    g.strokeRect(2, 14, 28, 12);

    g.generateTexture('enemy_walker', SIZE, SIZE);
    g.destroy();
  }

  /**
   * 'enemy_flier' — Purple winged creature.
   * Spread wings, plump body, glowing eyes, stubby beak.
   */
  _createEnemyFlierTexture() {
    const SIZE = 32;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Wings — broad triangles sweeping out from the body centre.
    g.fillStyle(0x6a0080, 1);
    g.fillTriangle(16, 15,   1,  4,   5, 22); // left wing
    g.fillTriangle(16, 15,  31,  4,  27, 22); // right wing

    // Wing inner surface — lighter highlight.
    g.fillStyle(0xce93d8, 0.45);
    g.fillTriangle(16, 15,   6,  8,   7, 19);
    g.fillTriangle(16, 15,  26,  8,  25, 19);

    // Body — plump circle.
    g.fillStyle(0x7b1fa2, 1);
    g.fillCircle(16, 17, 9);

    // Belly sheen.
    g.fillStyle(0xab47bc, 0.5);
    g.fillCircle(14, 19, 5);

    // Eyes — bright yellow.
    g.fillStyle(0xffee58, 1);
    g.fillCircle(12, 14, 3);
    g.fillCircle(20, 14, 3);

    // Pupils.
    g.fillStyle(0x1a0030, 1);
    g.fillCircle(13, 14, 1);
    g.fillCircle(21, 14, 1);

    // Beak — amber downward triangle.
    g.fillStyle(0xffa000, 1);
    g.fillTriangle(14, 19, 18, 19, 16, 24);

    // Body outline.
    g.lineStyle(1, 0x4a0060, 0.9);
    g.strokeCircle(16, 17, 9);

    g.generateTexture('enemy_flier', SIZE, SIZE);
    g.destroy();
  }

  /**
   * 'enemy_bouncer' — Teal bouncing sphere.
   * Glossy sphere with specular highlight, glow ring, and energy crackle.
   */
  _createEnemyBouncerTexture() {
    const SIZE = 32;
    const cx   = 16;
    const cy   = 16;
    const r    = 12;
    const g    = this.make.graphics({ x: 0, y: 0, add: false });

    // Outer glow halo.
    g.fillStyle(0x80cbc4, 0.2);
    g.fillCircle(cx, cy, r + 4);

    // Drop shadow.
    g.fillStyle(0x000000, 0.2);
    g.fillCircle(cx + 2, cy + 2, r);

    // Main sphere body.
    g.fillStyle(0x00897b, 1);
    g.fillCircle(cx, cy, r);

    // Mid-tone overlay — lighter hemisphere for depth.
    g.fillStyle(0x26a69a, 0.55);
    g.fillCircle(cx - 2, cy + 1, r - 2);

    // Primary gloss highlight — top-left.
    g.fillStyle(0xb2dfdb, 0.85);
    g.fillCircle(cx - 4, cy - 4, 5);

    // Hot-spot — bright white centre.
    g.fillStyle(0xffffff, 0.75);
    g.fillCircle(cx - 5, cy - 5, 2);

    // Energy crackle lines.
    g.lineStyle(1, 0x80cbc4, 0.9);
    g.beginPath(); g.moveTo(cx + 5,  cy + 3); g.lineTo(cx + 10, cy + 8);  g.strokePath();
    g.beginPath(); g.moveTo(cx - 4,  cy + 6); g.lineTo(cx - 9,  cy + 11); g.strokePath();
    g.beginPath(); g.moveTo(cx + 7,  cy - 4); g.lineTo(cx + 11, cy - 8);  g.strokePath();

    // Rim outline.
    g.lineStyle(1.5, 0x004d40, 0.9);
    g.strokeCircle(cx, cy, r);

    g.generateTexture('enemy_bouncer', SIZE, SIZE);
    g.destroy();
  }
}
