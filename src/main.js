/**
 * src/main.js
 * -----------
 * Entry point for the Bomb Jack game.
 * Configures the Phaser 3 Game instance and registers all scenes.
 *
 * Scene boot order:
 *   BootScene → MenuScene → GameScene (level 0, 1, 2 …) → VictoryScene
 *                         ↘ EditorScene (visual level editor)
 */

import Phaser from 'phaser';
import BootScene   from './scenes/BootScene.js';
import MenuScene   from './scenes/MenuScene.js';
import EditorScene from './scenes/EditorScene.js';
import GameScene   from './scenes/GameScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const config = {
  type: Phaser.AUTO,        // Use WebGL if available, fall back to Canvas.
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  parent: 'game-container', // Mount inside the div defined in index.html.

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 }, // Pixels per second² — classic arcade feel.
      debug: false,         // Flip to `true` to see physics bodies while developing.
    },
  },

  // Phaser starts scenes in the order listed; only the first is launched automatically.
  // BootScene runs first to generate all textures, then hands off to MenuScene.
  scene: [BootScene, MenuScene, EditorScene, GameScene, VictoryScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
