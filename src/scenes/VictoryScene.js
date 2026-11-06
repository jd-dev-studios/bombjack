/**
 * src/scenes/VictoryScene.js
 * --------------------------
 * End screen shown after the player collects all bombs in every level.
 *
 * Displays:
 *   • "Congratulations!" heading
 *   • A short flavour message
 *   • An interactive "▶ Play Again" button that restarts from Level 1
 */

export default class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create() {
    const { width, height } = this.scale;
    const cx = width  / 2;
    const cy = height / 2;

    // ── Background ──────────────────────────────────────────────────────────
    // Reuse the procedural background generated in BootScene.
    this.add.image(0, 0, 'background').setOrigin(0, 0);

    // Subtle radial overlay — highlights the centre of the screen.
    const glow = this.add.graphics();
    glow.fillStyle(0xffd600, 0.06);
    glow.fillCircle(cx, cy, 320);

    // ── Decorative bomb sprites ─────────────────────────────────────────────
    this._spawnDecorativeBombs(width, height);

    // ── Text ────────────────────────────────────────────────────────────────
    // Main heading.
    const heading = this.add.text(cx, cy - 130, '🎉 Congratulations! 🎉', {
      fontSize:        '38px',
      fontFamily:      'Arial Black, Arial, sans-serif',
      color:           '#ffd600',
      stroke:          '#000000',
      strokeThickness: 5,
      align:           'center',
    }).setOrigin(0.5).setAlpha(0);

    // Sub-heading.
    const sub = this.add.text(cx, cy - 60, 'You collected every bomb!', {
      fontSize:        '22px',
      fontFamily:      'Arial, sans-serif',
      color:           '#ffffff',
      stroke:          '#000000',
      strokeThickness: 3,
      align:           'center',
    }).setOrigin(0.5).setAlpha(0);

    const flavour = this.add.text(cx, cy - 20, 'Bomb Jack would be proud.', {
      fontSize:        '16px',
      fontFamily:      'Arial, sans-serif',
      color:           '#aaaaaa',
      align:           'center',
    }).setOrigin(0.5).setAlpha(0);

    // ── Play-again button ────────────────────────────────────────────────────
    const btnBg = this.add.rectangle(cx, cy + 80, 240, 56, 0xffd600, 1)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const btnText = this.add.text(cx, cy + 80, '▶  Play Again', {
      fontSize:   '22px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color:      '#1a1a2e',
    }).setOrigin(0.5).setAlpha(0);

    // Hover effects.
    btnBg.on('pointerover',  () => btnBg.setFillStyle(0xffc107));
    btnBg.on('pointerout',   () => btnBg.setFillStyle(0xffd600));
    btnBg.on('pointerdown',  () => btnBg.setFillStyle(0xff8f00));
    btnBg.on('pointerup',    () => {
      // Restart from level 1 — BootScene re-generates textures cleanly.
      this.scene.start('BootScene');
    });

    // ── Entrance animation ───────────────────────────────────────────────────
    this.tweens.add({ targets: heading,  alpha: 1, y: cy - 120, duration: 700, ease: 'Back.Out' });
    this.tweens.add({ targets: sub,      alpha: 1, y: cy - 55,  duration: 700, ease: 'Back.Out', delay: 200 });
    this.tweens.add({ targets: flavour,  alpha: 1,              duration: 500, delay: 400 });
    this.tweens.add({ targets: [btnBg, btnText], alpha: 1,      duration: 500, delay: 700 });

    // Gentle floating animation on the heading once it has arrived.
    this.tweens.add({
      targets:  heading,
      y:        cy - 128,
      duration: 1800,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.InOut',
      delay:    800,
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Scatter a handful of decorative (non-interactive) bomb sprites around the
   * edges of the screen to reinforce the theme.
   */
  _spawnDecorativeBombs(width, height) {
    const positions = [
      { x: 60,        y: 60        },
      { x: width - 60, y: 60        },
      { x: 60,        y: height - 60 },
      { x: width - 60, y: height - 60 },
      { x: width / 2, y: 40        },
      { x: width / 2, y: height - 40 },
    ];

    positions.forEach(({ x, y }, i) => {
      const b = this.add.image(x, y, 'bomb').setScale(1.4).setAlpha(0.5);
      // Each bomb bobs at a slightly different phase.
      this.tweens.add({
        targets:  b,
        y:        y + 10,
        duration: 1200 + i * 150,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.InOut',
      });
    });
  }
}
