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

  init(data) {
    this.completionTime = data?.completionTime ?? 0;
    this.isNewBest = false;
    // Capture prev/best before any writes so create() can display the old values.
    this.prevMs = 0;
    this.bestMs = 0;

    // Save times to localStorage and update personal best flag.
    if (this.completionTime > 0) {
      this.prevMs = parseInt(localStorage.getItem('bombjack_speedrun_prev') || '0', 10);
      const storedBest = parseInt(localStorage.getItem('bombjack_speedrun_best') || '0', 10);

      // Current time becomes the previous time.
      localStorage.setItem('bombjack_speedrun_prev', String(this.completionTime));

      // Update best if this is the first run or beats the current best.
      if (storedBest === 0 || this.completionTime < storedBest) {
        localStorage.setItem('bombjack_speedrun_best', String(this.completionTime));
        this.isNewBest = true;
        this.bestMs = this.completionTime;
      } else {
        this.bestMs = storedBest;
      }
    }
  }

  _formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
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
    const heading = this.add.text(cx, cy - 160, '🎉 Congratulations! 🎉', {
      fontSize:        '38px',
      fontFamily:      'Arial Black, Arial, sans-serif',
      color:           '#ffd600',
      stroke:          '#000000',
      strokeThickness: 5,
      align:           'center',
    }).setOrigin(0.5).setAlpha(0);

    // Sub-heading.
    const sub = this.add.text(cx, cy - 90, 'You collected every bomb!', {
      fontSize:        '22px',
      fontFamily:      'Arial, sans-serif',
      color:           '#ffffff',
      stroke:          '#000000',
      strokeThickness: 3,
      align:           'center',
    }).setOrigin(0.5).setAlpha(0);

    // Completion time.
    const timeStr = this.completionTime > 0 ? this._formatTime(this.completionTime) : '--:--.--';
    const completionTimeText = this.add.text(cx, cy - 40, `Completion Time: ${timeStr}`, {
      fontSize:        '20px',
      fontFamily:      'Arial, monospace',
      color:           '#ffd600',
      stroke:          '#000000',
      strokeThickness: 3,
      align:           'center',
    }).setOrigin(0.5).setAlpha(0);

    // Previous time (shown only when a prior run exists).
    let prevTimeText = null;
    if (this.prevMs > 0) {
      prevTimeText = this.add.text(cx, cy - 10, `Previous: ${this._formatTime(this.prevMs)}`, {
        fontSize:        '15px',
        fontFamily:      'Arial, monospace',
        color:           '#aaaaaa',
        stroke:          '#000000',
        strokeThickness: 2,
        align:           'center',
      }).setOrigin(0.5).setAlpha(0);
    }

    // Personal best (shown only when a best exists).
    let bestTimeText = null;
    if (this.bestMs > 0) {
      bestTimeText = this.add.text(cx, cy + (this.prevMs > 0 ? 15 : 10), `Best: ${this._formatTime(this.bestMs)}`, {
        fontSize:        '15px',
        fontFamily:      'Arial, monospace',
        color:           '#ffd600',
        stroke:          '#000000',
        strokeThickness: 2,
        align:           'center',
      }).setOrigin(0.5).setAlpha(0);
    }

    // New Personal Best badge (shown only if applicable).
    let bestBadge = null;
    if (this.isNewBest && this.completionTime > 0) {
      bestBadge = this.add.text(cx, cy + 42, '🏆 New Personal Best! 🏆', {
        fontSize:        '18px',
        fontFamily:      'Arial Black, Arial, sans-serif',
        color:           '#ffff00',
        stroke:          '#000000',
        strokeThickness: 3,
        align:           'center',
      }).setOrigin(0.5).setAlpha(0);
    }

    const flavour = this.add.text(cx, cy + 70, 'Bomb Jack would be proud.', {
      fontSize:        '16px',
      fontFamily:      'Arial, sans-serif',
      color:           '#aaaaaa',
      align:           'center',
    }).setOrigin(0.5).setAlpha(0);

    // ── Play-again button ────────────────────────────────────────────────────
    const btnBg = this.add.rectangle(cx, cy + 130, 240, 56, 0xffd600, 1)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const btnText = this.add.text(cx, cy + 130, '▶  Play Again', {
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

    // ── Gamepad shortcut ─────────────────────────────────────────────────────
    // A (0) or Start (9) confirm / play again — mirrors the on-screen button.
    this.input.gamepad.on('down', (_pad, button) => {
      if (button.index === 0 || button.index === 9) {
        this.scene.start('BootScene');
      }
    });

    // ── Entrance animation ───────────────────────────────────────────────────
    this.tweens.add({ targets: heading,  alpha: 1, y: cy - 150, duration: 700, ease: 'Back.Out' });
    this.tweens.add({ targets: completionTimeText, alpha: 1,    duration: 500, delay: 300 });
    if (prevTimeText) {
      this.tweens.add({ targets: prevTimeText,     alpha: 1,    duration: 500, delay: 380 });
    }
    if (bestTimeText) {
      this.tweens.add({ targets: bestTimeText,     alpha: 1,    duration: 500, delay: 440 });
    }
    if (bestBadge) {
      this.tweens.add({ targets: bestBadge, alpha: 1,            duration: 500, delay: 500 });
    }
    this.tweens.add({ targets: sub,      alpha: 1, y: cy - 85,  duration: 700, ease: 'Back.Out', delay: 200 });
    this.tweens.add({ targets: flavour,  alpha: 1,              duration: 500, delay: 560 });
    this.tweens.add({ targets: [btnBg, btnText], alpha: 1,      duration: 500, delay: 700 });


    // Gentle floating animation on the heading once it has arrived.
    this.tweens.add({
      targets:  heading,
      y:        cy - 158,
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
