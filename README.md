# 💣 Bomb Jack — Phaser 3 Arcade Platformer

A modular 2D arcade platformer inspired by the classic Bomb Jack (1984), built
with **Phaser 3** and **Vite**. Collect every bomb on each level to advance.
Beat every level to reach the Victory screen.

---

## 🖥️ Prerequisites

| Tool    | Minimum version |
|---------|----------------|
| Node.js | 18.x            |
| npm     | 9.x             |

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server (opens http://localhost:3000)
npm run dev

# 3. Build for production
npm run build

# 4. Preview the production build locally
npm run preview
```

---

## 🎮 Controls

| Key              | Action                          |
|------------------|---------------------------------|
| `←` / `→`       | Move left / right               |
| `↑` or `Space`  | Jump (only when on a platform)  |

**Goal:** run and jump around to collect all 💣 bombs. When the counter reaches
zero the next level loads automatically. Clear every level to see the Victory
screen.

---

## 📁 Project Structure

```
bombjack/
├── index.html              # HTML shell — mounts the Phaser canvas
├── package.json            # Dependencies & npm scripts
├── vite.config.js          # Vite dev-server & build settings
├── README.md               # You are here
└── src/
    ├── main.js             # Phaser Game config; registers all scenes
    ├── config/
    │   └── levels.js       # Central registry — import & list all levels here
    ├── levels/
    │   ├── level1.js       # Platform layout, bomb positions, player start
    │   └── level2.js       # Second level (harder / asymmetric design)
    └── scenes/
        ├── BootScene.js    # Generates all textures procedurally; boots to Level 1
        ├── GameScene.js    # Core loop — physics, input, bomb collection, HUD
        └── VictoryScene.js # End screen with Play Again button
```

### Scene Boot Order

```
BootScene  →  GameScene (levelIndex 0)  →  GameScene (levelIndex 1)  →  …  →  VictoryScene
```

---

## ➕ How to Add a New Level

Adding a level is **three steps** — nothing else in the codebase needs to change.

### Step 1 — Create the level file

```js
// src/levels/level3.js
export default {
  playerStart: { x: 100, y: 500 },

  platforms: [
    // Ground floor (always recommended)
    { x: 0,   y: 568, width: 800, height: 32 },
    // Add your own platforms ...
    { x: 200, y: 400, width: 150, height: 20 },
  ],

  bombs: [
    { x: 400, y: 540 },
    // Add your own bomb positions ...
  ],
};
```

### Step 2 — Register it in the central config

```js
// src/config/levels.js
import level1 from '../levels/level1.js';
import level2 from '../levels/level2.js';
import level3 from '../levels/level3.js';   // ← add this

export const LEVELS = [
  level1,
  level2,
  level3,   // ← and this
];
```

### Step 3 — Play

Reload the dev server (`npm run dev`) — `GameScene` reads `LEVELS` dynamically,
so your new level is immediately playable after Level 2.

---

## 🗺️ Level Data Schema

Each level file exports a plain object:

```ts
{
  playerStart: { x: number, y: number },

  platforms: Array<{
    x:      number,   // top-left X in world pixels
    y:      number,   // top-left Y in world pixels
    width:  number,   // total platform width  (px)
    height: number,   // total platform height (px)
  }>,

  bombs: Array<{
    x: number,   // world-space centre X
    y: number,   // world-space centre Y
  }>,
}
```

Canvas dimensions: **800 × 600 px**.  
Ground floor sits at `y: 568` by convention.

---

## 🏗️ Architecture Notes

| Topic | Detail |
|---|---|
| **Asset loading** | All textures are generated at runtime via Phaser's Graphics API — no image files required. |
| **Physics** | Arcade physics (lightest weight, ideal for classic platformers). Flip `debug: true` in `src/main.js` to visualise bodies. |
| **Scene communication** | Data is passed between scenes with `scene.start(key, { levelIndex })`. |
| **Platform rendering** | `TileSprite` for visuals + invisible `Rectangle` with a static body for physics — keeps tile art crisp at any width. |
| **Level registry** | `src/config/levels.js` is the *only* file that needs editing when adding a level. |

---

## 🔧 Useful Dev Flags

Open `src/main.js` and toggle:

```js
physics: {
  arcade: {
    debug: true,   // Renders all physics bodies as wireframes — great for tuning hitboxes.
  },
},
```

---

## 📜 License

MIT — do whatever you like with it. Have fun! 💣
