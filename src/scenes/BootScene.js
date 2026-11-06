/**
 * src/scenes/BootScene.js
 * -----------------------
 * Responsible for generating all game textures programmatically using Phaser's
 * Graphics API.  No external image files are required — the game works out of
 * the box on any machine after `npm install`.
 *
 * Textures created here:
 *   'player'      – Blue 32×48 rectangle (the hero).
 *   'platform'    – Earthy brown/green tile used for all platforms.
 *   'bomb'        – Bright orange circle with a dark fuse detail.
 *   'background'  – Full-canvas gradient backdrop (800×600).
 *
 * After all textures are ready the scene immediately hands off to GameScene,
 * passing `{ levelIndex: 0 }` so level data is read from LEVELS[0].
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

    // All textures are ready — start the first level immediately.
    this.scene.start('GameScene', { levelIndex: 0 });
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
}
