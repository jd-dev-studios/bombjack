/**
 * src/scenes/MenuScene.js
 * -----------------------
 * Main-menu hub shown immediately after BootScene generates all textures.
 * Gives the player two paths: jump straight into the game, or open the
 * visual Level Editor.
 *
 * Controls
 *   ENTER / SPACE  →  Play Game (level 1)
 *   E              →  Open Level Editor
 *
 * Visual language matches VictoryScene: gold headings, dark background,
 * floating decorative bombs, entrance tweens.
 */

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  create() {
    const { width, height } = this.scale;
    const cx = width  / 2;
    const cy = height / 2;

    // ── Background ────────────────────────────────────────────────────────
    this.add.image(0, 0, 'background').setOrigin(0, 0);

    // Subtle radial centre glow.
    const glow = this.add.graphics();
    glow.fillStyle(0xffd600, 0.05);
    glow.fillCircle(cx, cy, 340);

    // ── Decorative bombs ─────────────────────────────────────────────────
    this._spawnDecorativeBombs(width, height);

    // ── Title ─────────────────────────────────────────────────────────────
    // Start slightly higher than the final position so the tween slides it in.
    const title = this.add.text(cx, 130, '💣 BOMB JACK', {
      fontSize:        '54px',
      fontFamily:      'Arial Black, Arial, sans-serif',
      color:           '#ffd600',
      stroke:          '#000000',
      strokeThickness: 6,
      align:           'center',
    }).setOrigin(0.5).setAlpha(0);

    const subtitle = this.add.text(cx, 195, 'Collect every bomb to advance!', {
      fontSize:        '17px',
      fontFamily:      'Arial, sans-serif',
      color:           '#aaaaaa',
      align:           'center',
    }).setOrigin(0.5).setAlpha(0);

    // ── Personal best ─────────────────────────────────────────────────────
    // Shown only when the player has at least one completed run on record.
    const bestMs = parseInt(localStorage.getItem('bombjack_speedrun_best') || '0', 10);
    this._pbText = null;
    if (bestMs > 0) {
      this._pbText = this.add.text(cx, 228, `🏆 Best: ${this._formatTime(bestMs)}`, {
        fontSize:        '15px',
        fontFamily:      'Arial, monospace',
        color:           '#ffd600',
        stroke:          '#000000',
        strokeThickness: 2,
        align:           'center',
      }).setOrigin(0.5).setAlpha(0);
    }

    // ── Play button ───────────────────────────────────────────────────────
    const playBg = this.add.rectangle(cx, cy + 30, 270, 62, 0xffd600, 1)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const playText = this.add.text(cx, cy + 30, '▶  Play Game', {
      fontSize:   '24px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color:      '#1a1a2e',
    }).setOrigin(0.5).setAlpha(0);

    // ── Editor button ─────────────────────────────────────────────────────
    const editBg = this.add.rectangle(cx, cy + 120, 270, 58, 0x1565c0, 1)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const editText = this.add.text(cx, cy + 120, '✏️  Level Editor', {
      fontSize:   '22px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color:      '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    // ── Reset times button ────────────────────────────────────────────────
    // Smaller tertiary button; dark-red signals a destructive-but-recoverable action.
    const resetBg = this.add.rectangle(cx, cy + 200, 220, 44, 0x7f0000, 1)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    const resetText = this.add.text(cx, cy + 200, '🗑  Reset Stored Times', {
      fontSize:   '16px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color:      '#ffcccc',
    }).setOrigin(0.5).setAlpha(0);

    // ── Keyboard shortcut hint ────────────────────────────────────────────
    const hint = this.add.text(cx, height - 28, 'ENTER / SPACE — Play     E — Editor     🎮 A / Start — Play     Select — Editor', {
      fontSize:   '13px',
      fontFamily: 'Arial, sans-serif',
      color:      '#555577',
      align:      'center',
    }).setOrigin(0.5).setAlpha(0);

    // ── Hover effects ─────────────────────────────────────────────────────
    playBg.on('pointerover',  () => playBg.setFillStyle(0xffc107));
    playBg.on('pointerout',   () => playBg.setFillStyle(0xffd600));
    playBg.on('pointerdown',  () => playBg.setFillStyle(0xff8f00));
    playBg.on('pointerup',    () => this._startGame());

    editBg.on('pointerover',  () => editBg.setFillStyle(0x1976d2));
    editBg.on('pointerout',   () => editBg.setFillStyle(0x1565c0));
    editBg.on('pointerdown',  () => editBg.setFillStyle(0x0d47a1));
    editBg.on('pointerup',    () => this._openEditor());

    resetBg.on('pointerover',  () => resetBg.setFillStyle(0xaa0000));
    resetBg.on('pointerout',   () => resetBg.setFillStyle(0x7f0000));
    resetBg.on('pointerdown',  () => resetBg.setFillStyle(0x550000));
    resetBg.on('pointerup',    () => this._resetTimes(resetBg, resetText));

    // ── Keyboard shortcuts ────────────────────────────────────────────────
    this.input.keyboard.on('keydown-ENTER', () => this._startGame());
    this.input.keyboard.on('keydown-SPACE', () => this._startGame());
    this.input.keyboard.on('keydown-E',     () => this._openEditor());

    // ── Gamepad shortcuts ─────────────────────────────────────────────────
    // Listen for button-down events on any connected pad.
    //   Button 0  = A (Xbox) / Cross (PS)       → Play Game
    //   Button 9  = Start / Options              → Play Game
    //   Button 8  = Select / Back / Share        → Open Editor
    this.input.gamepad.on('down', (_pad, button) => {
      if (button.index === 0 || button.index === 9) {
        this._startGame();
      } else if (button.index === 8) {
        this._openEditor();
      }
    });

    // ── Entrance animations ───────────────────────────────────────────────
    this.tweens.add({ targets: title,              alpha: 1, y: 114,      duration: 800, ease: 'Back.Out' });
    this.tweens.add({ targets: subtitle,           alpha: 1,              duration: 600, delay: 250 });
    if (this._pbText) {
      this.tweens.add({ targets: this._pbText,     alpha: 1,              duration: 500, delay: 400 });
    }
    this.tweens.add({ targets: [playBg, playText], alpha: 1,              duration: 500, delay: 420 });
    this.tweens.add({ targets: [editBg, editText], alpha: 1,              duration: 500, delay: 570 });
    this.tweens.add({ targets: [resetBg, resetText], alpha: 1,            duration: 500, delay: 700 });
    this.tweens.add({ targets: hint,               alpha: 1,              duration: 500, delay: 820 });

    // Gentle perpetual float on the title once it has arrived.
    this.tweens.add({
      targets:  title,
      y:        122,
      duration: 2200,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.InOut',
      delay:    1000,
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  _startGame() {
    this.scene.start('GameScene', { levelIndex: 0 });
  }

  _openEditor() {
    this.scene.start('EditorScene');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Clears both speedrun localStorage keys, hides the personal-best display,
   * and turns the button green as confirmation. No navigation — the player
   * stays on the menu. The button is disabled so it cannot fire twice.
   */
  _resetTimes(resetBg, resetText) {
    localStorage.removeItem('bombjack_speedrun_best');
    localStorage.removeItem('bombjack_speedrun_prev');

    // Hide the personal-best text if it was visible.
    if (this._pbText) {
      this._pbText.setVisible(false);
    }

    // Green confirmation state — mirrors the VictoryScene / BootScene style.
    resetBg.setFillStyle(0x1b5e20);
    resetBg.disableInteractive();
    resetText.setText('✓  Times cleared!');
    resetText.setColor('#ccffcc');
  }

  /** Formats milliseconds as MM:SS.ss (e.g. "01:23.45"). */
  _formatTime(ms) {
    const totalSeconds  = Math.floor(ms / 1000);
    const minutes       = Math.floor(totalSeconds / 60);
    const seconds       = totalSeconds % 60;
    const centiseconds  = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  }

  /** Floating semi-transparent bomb icons in the four corners — purely decorative. */
  _spawnDecorativeBombs(width, height) {
    const positions = [
      { x: 60,         y: 60          },
      { x: width - 60, y: 60          },
      { x: 60,         y: height - 60 },
      { x: width - 60, y: height - 60 },
    ];

    positions.forEach(({ x, y }, i) => {
      const b = this.add.image(x, y, 'bomb').setScale(1.3).setAlpha(0.3);
      this.tweens.add({
        targets:  b,
        y:        y + 14,
        duration: 1400 + i * 220,
        yoyo:     true,
        repeat:   -1,
        ease:     'Sine.InOut',
      });
    });
  }
}
