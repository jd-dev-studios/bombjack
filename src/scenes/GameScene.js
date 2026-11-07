/**
 * src/scenes/GameScene.js
 * -----------------------
 * Core gameplay scene. Reads level data from LEVELS[levelIndex], builds the
 * world, handles player movement / physics, manages bomb collection, enemies,
 * and drives level-progression / victory logic.
 *
 * SCENE DATA  { levelIndex: Number, levelData?: Object, returnTo?: string }
 *   levelIndex  — zero-based index into LEVELS (used for normal play).
 *   levelData   — optional inline level object injected by the editor play-test.
 *                 When present it takes priority over LEVELS[levelIndex].
 *   returnTo    — optional scene key to wake when play-test ends (e.g. 'EditorScene').
 *
 * CONTROLS
 *   ← / →        Move left / right
 *   ↑ / SPACE    Tap = small hop, hold = full jump; hold while falling = glide
 *   ESC          (play-test only) Return to editor immediately
 *
 * WIN FLOW
 *   All bombs collected → returnTo? YES → wake editor  |  more levels? YES → next level  |  NO → VictoryScene
 *
 * ENEMIES
 *   walker   — Patrols platform surfaces, reverses at edges and walls.
 *   flier    — Gravity-exempt; drifts toward the player at constant speed.
 *   bouncer  — Gravity-exempt; bounces diagonally off walls, floors, and platforms.
 *
 *   Touching any enemy triggers a brief death flash + camera shake, then
 *   teleports the player back to the level's playerStart position.
 */

import { LEVELS } from '../config/levels.js';

const PLAYER_SPEED     = 220;   // px / s horizontal

// ── Jump tuning ───────────────────────────────────────────────────────────────
// Tap the button → JUMP_VELOCITY_MIN applied instantly (small hop).
// Hold the button → JUMP_HOLD_FORCE boosts velocity upward each frame until
//   either the key is released, JUMP_VELOCITY_MAX is reached, or JUMP_HOLD_MAX_MS
//   expires — whichever comes first.
const JUMP_VELOCITY_MIN  = -280; // px/s  — velocity on initial jump press
const JUMP_VELOCITY_MAX  = -520; // px/s  — hard cap after hold boost (negative = up)
const JUMP_HOLD_FORCE    = 1100; // px/s² — upward acceleration while holding
const JUMP_HOLD_MAX_MS   = 220;  // ms    — max duration the hold boost can run

// A jump-buffer window remembers a press that arrived a few frames BEFORE
// landing so the player never has to time the button with pixel precision.
const JUMP_BUFFER_MS     = 120;  // ms    — how long a missed press is remembered

// ── Glide tuning ──────────────────────────────────────────────────────────────
// While airborne and falling, holding ↑/Space applies a negative per-body
// gravity that partially cancels the world gravity, producing a slow descent.
//   Effective gravity = world gravity (500) + GLIDE_GRAVITY_OVERRIDE (−450) = 50 px/s²
const GLIDE_GRAVITY      = -450; // px/s² — override added to body while gliding
const GLIDE_MAX_FALL     =  60;  // px/s  — hard cap on downward velocity in glide

const TRANSITION_DELAY = 1800;  // ms banner is shown before scene switch
const BOMB_TINT_A      = 0xff6f00;
const BOMB_TINT_B      = 0xffd600;

// ── Enemy tuning ──────────────────────────────────────────────────────────────
const ENEMY_WALKER_SPEED       =  80;  // px/s  — horizontal patrol speed
const ENEMY_FLIER_SPEED        =  90;  // px/s  — drift-to-orbit-point speed
const ENEMY_FLIER_ORBIT_RADIUS =  72;  // px    — flier orbit radius around the player
const ENEMY_BOUNCER_SPEED      = 130;  // px/s per axis — constant (DVD screensaver)
const DEATH_RESPAWN_DELAY      = 1500; // ms    — pause before the player reappears

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init(data) {
    this.levelIndex      = data?.levelIndex ?? 0;
    // Prefer an inline levelData payload (injected by the editor play-test)
    // over the registered LEVELS array so the editor doesn't have to save first.
    this.levelData       = data?.levelData ?? LEVELS[this.levelIndex];
    this.returnTo        = data?.returnTo  ?? null; // scene key to wake on exit
    this.bombsLeft       = 0;
    this.isTransitioning = false;
    // Explicitly null out HUD refs so the stale-object guard in
    // _refreshBombCounter() works correctly on scene.restart().
    this.bombCounterLabel = null;
    this.levelLabel       = null;
    // Jump state — reset every scene start so mechanics are fresh.
    this.jumpBufferMs = 0;     // counts down while a buffered press is pending
    this.isJumpHeld   = false; // true while the hold-boost phase is active
    this.jumpHoldMs   = 0;     // accumulates ms the hold boost has run
    // Death / respawn state.
    this.isDead       = false; // true during the respawn-pause after touching an enemy
  }

  create() {
    this._buildBackground();
    this._buildPlatforms();

    // HUD must be built before bombs so bombCounterLabel is a live Text object
    // by the time _buildBombs() calls _refreshBombCounter().
    this._buildHUD();

    this._buildBombs();
    this._buildPlayer();
    this._buildEnemies();
    this._setupColliders();

    this.cursors  = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Play-test mode: ESC immediately returns to the editor without saving.
    if (this.returnTo) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        .on('down', () => this._exitToEditor());
    }

    this._startBombPulse();
  }

  update() {
    if (this.isTransitioning) return;
    if (this.isDead)          return;
    this._handlePlayerMovement();
    this._updateEnemies();
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

  /**
   * Reads `this.levelData.enemies` and spawns each one as a physics sprite.
   * Safe to call even when the `enemies` key is absent or empty.
   *
   * Walker  — runs on platforms; gravity enabled; bounces off walls / edges.
   * Flier   — floats freely; gravity disabled; homes toward the player each frame.
   * Bouncer — gravity disabled; launches diagonally; elastic bounce (coeff 1).
   */
  _buildEnemies() {
    const defs = this.levelData.enemies;
    if (!defs || defs.length === 0) {
      this.enemies = null;
      return;
    }

    this.enemies = this.physics.add.group();

    for (const def of defs) {
      const key    = 'enemy_' + def.type;
      const sprite = this.physics.add.sprite(def.x, def.y, key);
      sprite.setOrigin(0.5, 0.5);
      sprite.enemyType = def.type;

      if (def.type === 'walker') {
        sprite.setCollideWorldBounds(true);
        sprite.setBounce(0);
        sprite.setVelocityX(ENEMY_WALKER_SPEED);
        sprite.body.setSize(28, 18);
        sprite.body.setOffset(2, 14);
        sprite.patrolDir = 1;

      } else if (def.type === 'flier') {
        sprite.body.setAllowGravity(false);
        sprite.setCollideWorldBounds(true);
        sprite.setVelocity(0, 0);
        sprite.body.setSize(18, 18);
        sprite.body.setOffset(7, 8);
        // Each flier gets a unique starting angle and rotation rate so
        // multiple fliers orbit the player at different positions and speeds,
        // giving the player breathing room rather than all stacking together.
        sprite.wanderAngle = Math.random() * Math.PI * 2;          // 0 – 2π
        sprite.wanderSpeed = 0.6 + Math.random() * 0.8;            // 0.6 – 1.4 rad/s

      } else if (def.type === 'bouncer') {
        sprite.body.setAllowGravity(false);
        sprite.setCollideWorldBounds(true);
        sprite.setBounce(1);
        const dirX = Math.random() < 0.5 ? 1 : -1;
        const dirY = Math.random() < 0.5 ? 1 : -1;
        sprite.setVelocity(ENEMY_BOUNCER_SPEED * dirX, ENEMY_BOUNCER_SPEED * dirY);
        sprite.body.setSize(24, 24);
        sprite.body.setOffset(4, 4);
      }

      this.enemies.add(sprite);
    }
  }

  // ── Enemy AI ───────────────────────────────────────────────────────────────

  /** Dispatches per-frame behaviour for every active enemy. */
  _updateEnemies() {
    if (!this.enemies) return;
    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active) continue;
      if (enemy.enemyType === 'walker')  this._updateWalker(enemy);
      else if (enemy.enemyType === 'flier')   this._updateFlier(enemy);
      else if (enemy.enemyType === 'bouncer') this._updateBouncer(enemy);
    }
  }

  /**
   * Walker AI — patrols a platform surface, reversing when:
   *   a) The body is blocked left or right (wall / world edge).
   *   b) No supporting ground exists one step ahead (cliff edge).
   *
   * Uses if/else so only ONE flip can happen per frame — prevents the
   * double-flip / spin-in-place bug that occurs at platform corners.
   * Uses body.bottom (world-space feet y) so the probe lands correctly
   * below the actual physics foot, not relative to the sprite centre.
   */
  _updateWalker(enemy) {
    const body = enemy.body;
    let flip = false;

    if (body.blocked.left || body.blocked.right) {
      // Hit a wall or world edge — reverse direction.
      flip = true;
    } else {
      // Edge detection: probe one body-width ahead and just below the feet.
      const probeX = enemy.x + enemy.patrolDir * (body.width / 2 + 6);
      const probeY = body.bottom + 4;  // body.bottom is world-space feet y
      if (!this._groundExistsAt(probeX, probeY)) {
        flip = true;
      }
    }

    if (flip) {
      enemy.patrolDir *= -1;
      enemy.setFlipX(enemy.patrolDir < 0);
    }

    enemy.setVelocityX(ENEMY_WALKER_SPEED * enemy.patrolDir);
  }

  /**
   * Returns true when a platform rectangle (or the canvas bottom edge) covers
   * the point (px, py).  Used by walkers for cliff-edge detection.
   */
  _groundExistsAt(px, py) {
    if (py >= this.scale.height - 4) return true;
    for (const p of this.levelData.platforms) {
      if (px >= p.x && px <= p.x + p.width &&
          py >= p.y && py <= p.y + p.height) {
        return true;
      }
    }
    return false;
  }

  /**
   * Flier AI — each flier orbits the player at a unique angle and speed.
   *
   * Rather than all fliers converging to the same pixel (the player's centre),
   * each instance advances its own wanderAngle each frame and steers toward a
   * point on a circle of ENEMY_FLIER_ORBIT_RADIUS around the player.  Different
   * starting angles (set at spawn) keep multiple fliers spread around the player;
   * different rotation rates prevent re-convergence over time.
   * A 30 px dead-zone stops micro-jitter once the orbit point is reached.
   */
  _updateFlier(enemy) {
    const dt = this.sys.game.loop.delta / 1000;   // seconds since last frame

    // Advance the per-instance orbit angle.
    enemy.wanderAngle += enemy.wanderSpeed * dt;

    // Target: a point on a circle centred on the player.
    const tx = this.player.x + Math.cos(enemy.wanderAngle) * ENEMY_FLIER_ORBIT_RADIUS;
    const ty = this.player.y + Math.sin(enemy.wanderAngle) * ENEMY_FLIER_ORBIT_RADIUS;

    const dx   = tx - enemy.x;
    const dy   = ty - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 30) {
      // Already close enough to the orbit point — coast, don't jitter.
      enemy.setVelocity(0, 0);
      return;
    }

    const inv = ENEMY_FLIER_SPEED / dist;
    enemy.setVelocity(dx * inv, dy * inv);
    enemy.setFlipX(dx < 0);
  }

  /**
   * Bouncer AI — DVD-screensaver style: constant speed on each axis, with
   * the sign flipped immediately when any surface is contacted.
   *
   * Why not rely on arcade physics setBounce(1)?
   * The static platform bodies carry a default bounce of 0 in Phaser's Arcade
   * engine, so the dynamic bounce coefficient alone is not guaranteed to
   * produce a clean reflection against hand-crafted static rectangles.
   * Instead we read the blocked flags (which ARE reliably set by the collider)
   * and force the exact velocity we want, keeping each axis at a constant
   * ±ENEMY_BOUNCER_SPEED every frame.  A per-axis stall watchdog (threshold
   * 25% of target speed) covers corner-trap and first-frame edge cases.
   */
  _updateBouncer(enemy) {
    const b = enemy.body;

    // ── Reflect off horizontal surfaces (platform tops / floors / ceiling) ──
    if (b.blocked.down) {
      enemy.setVelocityY(-ENEMY_BOUNCER_SPEED);
    } else if (b.blocked.up) {
      enemy.setVelocityY(ENEMY_BOUNCER_SPEED);
    }

    // ── Reflect off vertical surfaces (walls / platform sides) ────────────
    if (b.blocked.left) {
      enemy.setVelocityX(ENEMY_BOUNCER_SPEED);
    } else if (b.blocked.right) {
      enemy.setVelocityX(-ENEMY_BOUNCER_SPEED);
    }

    // ── Per-axis stall watchdog ────────────────────────────────────────────
    // If an axis velocity has drained below 25% of target (e.g. due to
    // platform overlap-resolution or a first-frame standing start) restore it
    // immediately, preserving the current sign where available.
    const vx = b.velocity.x;
    const vy = b.velocity.y;
    const threshold = ENEMY_BOUNCER_SPEED * 0.25;

    if (Math.abs(vx) < threshold) {
      // Default to rightward on a true zero so the ball always starts moving.
      enemy.setVelocityX((vx < 0 ? -1 : 1) * ENEMY_BOUNCER_SPEED);
    }
    if (Math.abs(vy) < threshold) {
      // Default upward on a true zero — away from the ground it spawns on.
      enemy.setVelocityY((vy > 0 ? 1 : -1) * ENEMY_BOUNCER_SPEED);
    }
  }

  // ── Death & respawn ────────────────────────────────────────────────────────

  /**
   * Overlap callback — fires when the player sprite overlaps any enemy.
   * Freezes the player, applies a red tint, shakes the camera, then
   * schedules _respawnPlayer() after DEATH_RESPAWN_DELAY milliseconds.
   */
  _hitEnemy(_player, _enemy) {
    if (this.isTransitioning || this.isDead) return;

    this.isDead = true;

    // Freeze the player in place so it doesn't slide off a platform while dead.
    this.player.setVelocity(0, 0);
    this.player.body.setAllowGravity(false);
    this.player.setTint(0xff2222);

    this.cameras.main.shake(300, 0.018);

    this.time.delayedCall(DEATH_RESPAWN_DELAY, () => this._respawnPlayer());
  }

  /** Restores the player at the level's spawn point and clears death state. */
  _respawnPlayer() {
    const { x, y } = this.levelData.playerStart;

    this.player.setPosition(x, y);
    this.player.setVelocity(0, 0);
    this.player.body.setAllowGravity(true);
    this.player.clearTint();

    this.jumpBufferMs = 0;
    this.isJumpHeld   = false;
    this.jumpHoldMs   = 0;

    this.isDead = false;
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

    // Enemies collide with platforms (lets walkers stand and bouncers reflect).
    if (this.enemies) {
      this.physics.add.collider(this.enemies, this.platforms, null, null, this);

      // Player touching any enemy → death / respawn.
      this.physics.add.overlap(
        this.player,
        this.enemies,
        this._hitEnemy,
        null,
        this,
      );
    }
  }

  // ── Input & movement ───────────────────────────────────────────────────────

  _handlePlayerMovement() {
    const { delta } = this.sys.game.loop; // ms elapsed since last frame
    const body      = this.player.body;
    const onGround  = body.blocked.down;

    // ── Horizontal ────────────────────────────────────────────────────────────
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      // Smooth deceleration instead of instant stop.
      this.player.setVelocityX(body.velocity.x * 0.8);
    }

    // ── Jump key state ────────────────────────────────────────────────────────
    const jumpJustPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);

    const jumpHeld =
      this.cursors.up.isDown || this.spaceKey.isDown;

    // ── 1. Jump buffer ────────────────────────────────────────────────────────
    // Refill the buffer on a fresh press; decay it every frame regardless.
    // This lets a press that arrived 1-3 frames before landing still register.
    if (jumpJustPressed) {
      this.jumpBufferMs = JUMP_BUFFER_MS;
    } else {
      this.jumpBufferMs = Math.max(0, this.jumpBufferMs - delta);
    }

    // ── 2. Execute jump ───────────────────────────────────────────────────────
    // Fires when the player is on the ground AND a buffered press is pending.
    if (onGround && this.jumpBufferMs > 0) {
      this.player.setVelocityY(JUMP_VELOCITY_MIN);
      this.jumpBufferMs = 0;    // consume the buffer
      this.isJumpHeld   = true; // begin hold-boost phase
      this.jumpHoldMs   = 0;
    }

    // ── 3. Hold-boost ─────────────────────────────────────────────────────────
    // While the button is still held and the player is still rising, apply an
    // upward force each frame. Stops when:
    //   • the key is released
    //   • the player starts falling (vy ≥ 0)
    //   • the max hold duration is exceeded
    if (this.isJumpHeld) {
      if (jumpHeld && body.velocity.y < 0 && this.jumpHoldMs < JUMP_HOLD_MAX_MS) {
        const boost  = JUMP_HOLD_FORCE * (delta / 1000);
        const newVy  = Math.max(body.velocity.y - boost, JUMP_VELOCITY_MAX);
        this.player.setVelocityY(newVy);
        this.jumpHoldMs += delta;
      } else {
        // Condition broken — end the boost phase.
        this.isJumpHeld = false;
      }
    }

    // ── 4. Glide ──────────────────────────────────────────────────────────────
    // Holding the jump key while airborne AND falling applies a near-cancelling
    // per-body gravity, producing the original Bomb Jack flutter descent.
    // The body gravity override stacks with world gravity:
    //   effective gravity = 500 (world) + GLIDE_GRAVITY (-450) = 50 px/s²
    // We also hard-cap downward velocity so the player can't accelerate through glide.
    const isFalling = body.velocity.y > 0 && !onGround;

    if (isFalling && jumpHeld && !this.isJumpHeld) {
      body.setGravityY(GLIDE_GRAVITY);
      if (body.velocity.y > GLIDE_MAX_FALL) {
        this.player.setVelocityY(GLIDE_MAX_FALL);
      }
    } else {
      // Restore neutral body gravity whenever glide is not active so normal
      // arcs are unaffected.
      body.setGravityY(0);
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

    // Play-test mode: flash a banner then hand control back to the editor.
    if (this.returnTo) {
      const cx = this.scale.width  / 2;
      const cy = this.scale.height / 2;
      this.add.rectangle(cx, cy, 440, 100, 0x000000, 0.75).setDepth(10);
      this.add.text(cx, cy, '🎉 All Bombs Collected!\nReturning to Editor…', {
        fontSize: '26px', fontFamily: 'Arial Black, Arial, sans-serif',
        color: '#ffd600', stroke: '#000000', strokeThickness: 4,
        align: 'center',
      }).setOrigin(0.5).setDepth(11);
      this.time.delayedCall(1800, () => this._exitToEditor());
      return;
    }

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

  /**
   * Stops this GameScene and wakes the editor, restoring its full state.
   * Called by ESC in play-test mode, or after all bombs are collected.
   */
  _exitToEditor() {
    this.scene.stop('GameScene');
    this.scene.wake(this.returnTo);
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
    // In play-test mode show a clear "PLAY TEST" badge instead of level number.
    const levelLabel = this.returnTo
      ? '🎮 PLAY TEST'
      : `Level ${this.levelIndex + 1} / ${LEVELS.length}`;

    this.levelLabel = this.add
      .text(14, 12, levelLabel, baseStyle)
      .setDepth(5);

    // Bomb counter — top-right.
    this.bombCounterLabel = this.add
      .text(this.scale.width - 14, 12, '', { ...baseStyle, align: 'right' })
      .setOrigin(1, 0)
      .setDepth(5);

    this._refreshBombCounter();

    // Controls hint — fades out after 4 s.
    const controlsText = this.returnTo
      ? '← → Move    ↑ / Space Jump (hold = higher, hold falling = glide)    ESC Return to Editor'
      : '← → Move    ↑ / Space Jump (hold = higher, hold falling = glide)';

    const hint = this.add
      .text(14, this.scale.height - 24, controlsText, {
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

