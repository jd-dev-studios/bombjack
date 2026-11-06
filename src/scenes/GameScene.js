/**
 * src/scenes/GameScene.js
 * -----------------------
 * Core gameplay scene. Reads level data from LEVELS[levelIndex], builds the
 * world, handles player movement / physics, manages bomb collection, and drives
 * level-progression / victory logic.
 *
 * SCENE DATA  { levelIndex: Number }  — zero-based index into LEVELS array.
 *
 * CONTROLS
 *   ← / →        Move left / right
 *   ↑ / SPACE    Jump (only when on a surface)
 *
 * WIN FLOW
 *   All bombs collected → more levels? YES → next level  |  NO → VictoryScene
 */

import { LEVELS } from '../config/levels.js';

const PLAYER_SPEED     = 220;   // px / s horizontal
const JUMP_VELOCITY    = -520;  // px / s vertical (negative = up)
const TRANSITION_DELAY = 1800;  // ms banner is shown before scene switch
const BOMB_TINT_A      = 0xff6f00;
const BOMB_TINT_B      = 0xffd600;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init(data) {
    this.levelIndex      = data?.levelIndex ?? 0;
    this.levelData       = LEVELS[this.levelIndex];
    this.bombsLeft       = 0;
    this.isTransitioning = false;
    // Explicitly null out HUD refs so the stale-object guard in
    // _refreshBombCounter() works correctly on scene.restart().
    // Without this, Phaser keeps the destroyed Text reference alive on the
    // instance, the `if (!this.bombCounterLabel)` check passes, and setText()
    // crashes trying to draw into a null WebGL canvas.
    this.bombCounterLabel = null;
    this.levelLabel       = null;
  }

  create() {
    this._buildBackground();
    this._buildPlatforms();

    // HUD must be built before bombs so bombCounterLabel is a live Text object
    // by the time _buildBombs() calls _refreshBombCounter().
    this._buildHUD();

    this._buildBombs();
    this._buildPlayer();
    this._setupColliders();

    this.cursors  = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this._startBombPulse();
  }

  update() {
    if (this.isTransitioning) return;
    this._handlePlayerMovement();
  }

  // ── World building ─────────────────────────────────────────────────────────

  _buildBackground() {
    this.add.image(0, 0, 'background').setOrigin(0, 0);
  }

  /**
   * Platforms: a TileSprite handles the visual; a matching static Rectangle
   * provides the physics body so collision geometry is always pixel-perfect.
   */
  _buildPlatforms() {
    this.platforms = this.physics.add.staticGroup();

    for (const plat of this.levelData.platforms) {
      const { x, y, width, height } = plat;

      // Visual — tiled texture, no stretching.
      this.add.tileSprite(x, y, width, height, 'platform').setOrigin(0, 0);

      // Physics body — invisible rectangle aligned to the visual tile.
      const body = this.add.rectangle(
        x + width  / 2,
        y + height / 2,
        width,
        height,
      );
      this.physics.add.existing(body, true); // true = static body
      this.platforms.add(body);
    }
  }

  /**
   * Bombs are completely static pickups — faithful to the original Bomb Jack.
   * They float in mid-air at the exact positions defined in the level data,
   * unaffected by gravity, with zero velocity. Using a StaticGroup means
   * Phaser never applies any physics simulation to them at all.
   */
  _buildBombs() {
    this.bombs = this.physics.add.staticGroup();

    for (const pos of this.levelData.bombs) {
      const bomb = this.bombs.create(pos.x, pos.y, 'bomb');
      bomb.setOrigin(0.5, 0.5);

      // Tighten the physics body to the circular core of the sprite art,
      // then call refreshBody() — required after resizing a static body.
      bomb.setCircle(9, 3, 3);
      bomb.refreshBody();
    }

    this.bombsLeft = this.bombs.getLength();
    this._refreshBombCounter();
  }

  _buildPlayer() {
    const { x, y } = this.levelData.playerStart;
    this.player = this.physics.add.sprite(x, y, 'player');
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);

    // Slightly smaller hit-box so visual edges don't clip into platforms.
    this.player.body.setSize(22, 38);
    this.player.body.setOffset(3, 1);
  }

  // ── Physics ────────────────────────────────────────────────────────────────

  _setupColliders() {
    // Player lands on platforms.
    this.physics.add.collider(this.player, this.platforms);

    // Bombs are static — they need no platform collider.

    // Collecting a bomb: overlap fires _collectBomb for that specific bomb.
    this.physics.add.overlap(
      this.player,
      this.bombs,
      this._collectBomb,
      null,
      this,
    );
  }

  // ── Input & movement ───────────────────────────────────────────────────────

  _handlePlayerMovement() {
    const onGround = this.player.body.blocked.down;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      // Smooth deceleration instead of instant stop.
      this.player.setVelocityX(this.player.body.velocity.x * 0.8);
    }

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);

    if (jumpPressed && onGround) {
      this.player.setVelocityY(JUMP_VELOCITY);
    }
  }

  // ── Bomb collection & win logic ────────────────────────────────────────────

  /** Overlap callback — `_player` arg is required by Phaser but unused here. */
  _collectBomb(_player, bomb) {
    bomb.destroy();
    this.bombsLeft -= 1;
    this._refreshBombCounter();
    this.cameras.main.shake(80, 0.006);

    if (this.bombsLeft <= 0) {
      this._handleLevelComplete();
    }
  }

  _handleLevelComplete() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const nextIndex    = this.levelIndex + 1;
    const hasNextLevel = nextIndex < LEVELS.length;
    const cx           = this.scale.width  / 2;
    const cy           = this.scale.height / 2;

    // Semi-transparent backdrop.
    this.add.rectangle(cx, cy, 420, 100, 0x000000, 0.75).setDepth(10);

    const message = hasNextLevel
      ? `Level ${this.levelIndex + 1} Complete!`
      : '🎉 All Levels Complete!';

    const banner = this.add.text(cx, cy, message, {
      fontSize:        '32px',
      fontFamily:      'Arial Black, Arial, sans-serif',
      color:           '#ffd600',
      stroke:          '#000000',
      strokeThickness: 4,
      align:           'center',
    }).setOrigin(0.5).setDepth(11);

    this.tweens.add({
      targets: banner, scaleX: 1.08, scaleY: 1.08,
      duration: 300, yoyo: true, repeat: 2,
    });

    this.time.delayedCall(TRANSITION_DELAY, () => {
      if (hasNextLevel) {
        this.scene.restart({ levelIndex: nextIndex });
      } else {
        this.scene.start('VictoryScene');
      }
    });
  }

  // ── HUD ────────────────────────────────────────────────────────────────────

  _buildHUD() {
    const baseStyle = {
      fontSize:        '18px',
      fontFamily:      'Arial, sans-serif',
      color:           '#ffffff',
      stroke:          '#000000',
      strokeThickness: 3,
    };

    // Level indicator — top-left.
    this.levelLabel = this.add
      .text(14, 12, `Level ${this.levelIndex + 1} / ${LEVELS.length}`, baseStyle)
      .setDepth(5);

    // Bomb counter — top-right.
    this.bombCounterLabel = this.add
      .text(this.scale.width - 14, 12, '', { ...baseStyle, align: 'right' })
      .setOrigin(1, 0)
      .setDepth(5);

    this._refreshBombCounter();

    // Controls hint — fades out after 4 s.
    const hint = this.add
      .text(14, this.scale.height - 24, '← → Move    ↑ / Space Jump', {
        fontSize: '13px', fontFamily: 'Arial, sans-serif', color: '#aaaaaa',
      })
      .setDepth(5);

    this.tweens.add({ targets: hint, alpha: 0, delay: 4000, duration: 1200 });
  }

  _refreshBombCounter() {
    if (!this.bombCounterLabel) return;
    this.bombCounterLabel.setText(`💣 ${this.bombsLeft}`);
  }

  // ── Ambient animations ─────────────────────────────────────────────────────

  /** Pulse all bombs between two tints so they stand out against the level. */
  _startBombPulse() {
    this.time.addEvent({
      delay: 600,
      loop:  true,
      callback: () => {
        if (!this.bombs) return;
        const tick = Math.floor(this.time.now / 600) % 2 === 0;
        this.bombs.setTint(tick ? BOMB_TINT_A : BOMB_TINT_B);
      },
    });
  }
}

