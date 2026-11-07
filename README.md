# 💣 Bomb Jack — Phaser 3 Arcade Platformer

A modular 2D arcade platformer inspired by the classic Bomb Jack (1984), built
with **Phaser 3** and **Vite**. Collect every bomb on each level while dodging
enemies to advance. Beat all levels to reach the Victory screen.

All game textures are generated **procedurally at runtime** — no image files are
required. Clone it, `npm install`, and play.

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

# 2. Start the local development server (auto-opens http://localhost:3000)
npm run dev

# 3. Build for production
npm run build

# 4. Preview the production build locally
npm run preview
```

---

## 🎮 Controls

### In-game

| Key                                 | Action                                                        |
|-------------------------------------|---------------------------------------------------------------|
| `←` / `→`                           | Move left / right                                             |
| `↑` or `Space` *(tap)*              | Small hop                                                     |
| `↑` or `Space` *(hold)*             | Full jump — hold longer to jump higher (up to 220 ms boost)   |
| `↑` or `Space` *(hold while falling)* | Glide — dramatically slows descent                          |
| `ESC`                               | *(Play-test only)* Return to the Level Editor immediately     |

### Jump system

The jump has three distinct phases:

1. **Initial press** — applies an immediate upward velocity (`−280 px/s`).
2. **Hold boost** — while the key stays held and the player is still rising, an
   upward force continues to accelerate them (hard-capped at `−520 px/s` or 220 ms,
   whichever comes first). Releasing early produces a short hop; holding the full
   duration produces the maximum arc.
3. **Glide** — if the key is held while the player is falling, it cancels most of
   world gravity (`500 px/s²` → effectively `50 px/s²`), producing a slow floaty
   descent capped at `60 px/s` downward.

A **120 ms jump buffer** remembers a press that arrived a few frames before
landing, so jumps never feel missed near the ground.

### Main menu

| Key               | Action             |
|-------------------|--------------------|
| `Enter` / `Space` | Start the game     |
| `E`               | Open Level Editor  |

---

---

## 👾 Enemies

Three enemy types roam each level. Touching any of them triggers a **death
flash** (red tint + camera shake) and teleports the player back to the level's
spawn point after a 1.5 s pause. There are no lives — respawn is immediate.

| Type        | Colour | Behaviour |
|-------------|--------|-----------|
| **Walker**  | 🔴 Red    | Patrols platform surfaces at a constant speed. Reverses at walls and platform edges — never walks off into the air. |
| **Flier**   | 🟣 Purple | Gravity-exempt. Orbits the player at a 72 px radius, circling continuously. Each flier has a randomised starting angle and rotation speed so multiple fliers spread naturally around the player rather than stacking. |
| **Bouncer** | 🟢 Teal   | Gravity-exempt. Moves at constant speed on both axes simultaneously, reflecting off every surface it contacts (walls, floors, platforms) — DVD screensaver style. Speed never decays. |

---

## 📁 Project Structure

```
bombjack/
├── Dockerfile              # Multi-stage Docker build (Node builder → nginx runtime)
├── nginx.conf              # nginx SPA config with asset caching and gzip
├── index.html              # HTML shell — mounts the Phaser canvas
├── package.json            # Dependencies & npm scripts
├── vite.config.js          # Vite dev-server & build settings
├── README.md               # You are here
├── k8s/
│   ├── deployment.yaml     # Kubernetes Deployment (2 replicas, rolling update)
│   ├── service.yaml        # ClusterIP Service
│   └── ingress.yaml        # Ingress with TLS via cert-manager
└── src/
    ├── main.js             # Phaser Game config; registers all scenes
    ├── config/
    │   └── levels.js       # Central registry — import & list all levels here
    ├── levels/
    │   ├── level1.js       # Level 1 — introduces all three enemy types
    │   ├── level2.js       # Level 2 — vertical corridors, denser bombs
    │   └── level3.js       # Level 3 — open arena layout
    └── scenes/
        ├── BootScene.js    # Generates all textures procedurally; boots to MenuScene
        ├── MenuScene.js    # Main menu — Play Game or open Level Editor
        ├── GameScene.js    # Core loop: physics, input, bombs, enemies, HUD
        ├── EditorScene.js  # Visual level editor with play-test and export
        └── VictoryScene.js # End screen with Play Again button
```

### Scene flow

```
BootScene → MenuScene ──▶ GameScene (level 0) → GameScene (level 1) → … → VictoryScene
                     └──▶ EditorScene ⇄ GameScene (play-test, ESC returns)
```

---

## ✏️ Level Editor

The built-in visual editor lets you design levels on the exact 800 × 600 px
canvas and export them as ready-to-paste JavaScript files — no external tools
required. Open it from the main menu with `E` or the `✏️ Level Editor` button.

### Keyboard shortcuts

| Key         | Action                                                               |
|-------------|----------------------------------------------------------------------|
| `P`         | **Platform tool** — click and drag to draw a rectangle              |
| `B`         | **Bomb tool** — click to place a bomb                               |
| `S`         | **Player-Start tool** — click to set the spawn point                |
| `E`         | **Enemy tool** — click to place an enemy; choose type in toolbar    |
| `D`         | **Eraser tool** — click any object to delete it                     |
| `G`         | Toggle grid snap: **16 px ↔ 32 px**                                 |
| `Z`         | **Undo** last action (placements *and* deletions)                   |
| `V`         | Toggle **static preview** — real textures, no physics               |
| `T`         | **Play Test** — launches the full game; `ESC` returns here          |
| `ESC`       | Exit preview / return to Menu                                        |
| Right-click | Quick-place a bomb at the cursor (works with any active tool)       |

### Toolbar (DOM panel to the right of the canvas)

- **Active Tool** buttons (P / B / S / E / D) with highlighted active state
- **Enemy sub-type picker** (🔴 Walker / 🟣 Flier / 🟢 Bouncer) — appears inline when the Enemy tool is active
- **Grid Snap** — 16 px or 32 px
- **Undo** and **Clear All**
- **Export & Log** — prints the level JS to the browser console
- **Copy to Clipboard** — copies the full level JS string
- **Download level.js** — saves the file directly to disk
- **Open .js / .txt File** — load any previously exported level file from disk
- **Paste Level Source** — paste level JS into a modal dialog to import
- **Preview** toggle and **Play Test** launch
- **Status bar** — live object counts: platforms 🔲 · bombs 💣 · enemies 👾 · player-start 🧍

### What the editor renders

| Object       | Appearance                                                  |
|--------------|-------------------------------------------------------------|
| Platform     | Brown tiled block with highlight stripe and grout lines     |
| Bomb         | Black circle with fuse spark and orange glow ring           |
| Player-Start | Blue figure with green bounding box                         |
| Walker       | Red armoured crawler with amber eye, red bounding box       |
| Flier        | Purple winged creature with yellow eyes, purple bounding box|
| Bouncer      | Teal sphere with gloss highlight, teal bounding box         |

### Importing a level

Existing level files can be loaded into the editor in two ways:

1. **File picker** (`📂 Open .js / .txt File`) — browse to any `.js` or `.txt` level file.
2. **Paste** (`📋 Paste Level Source`) — paste raw JS directly. Supports both
   `export default { … }` and bare object syntax. The validator checks the shape
   before applying; the `enemies` field is optional so older levels load cleanly.

A full undo snapshot is pushed before every import, so `Z` reverts the entire
load in one keystroke.

---

## ➕ How to Add a New Level (manually)

Adding a level is **three steps** — nothing else in the codebase needs to change.

### Step 1 — Create the level file

```js
// src/levels/level4.js
export default {
  playerStart: { x: 100, y: 500 },

  platforms: [
    { x: 0,   y: 568, width: 800, height: 32 },  // ground floor
    { x: 200, y: 400, width: 150, height: 20 },
  ],

  bombs: [
    { x: 400, y: 540 },
    { x: 220, y: 375 },
  ],

  // Optional — omit entirely if you want no enemies on this level.
  enemies: [
    { type: 'walker',  x: 300, y: 552 },
    { type: 'flier',   x: 600, y: 300 },
    { type: 'bouncer', x: 100, y: 200 },
  ],
};
```

### Step 2 — Register it

```js
// src/config/levels.js
import level1 from '../levels/level1.js';
import level2 from '../levels/level2.js';
import level3 from '../levels/level3.js';
import level4 from '../levels/level4.js';   // ← add this

export const LEVELS = [
  level1,
  level2,
  level3,
  level4,   // ← and this
];
```

### Step 3 — Play

Reload the dev server — `GameScene` reads `LEVELS` dynamically, so your new
level is immediately playable after the last registered level.

> **Tip:** Use the [Level Editor](#️-level-editor) to design and export the level
> visually, then paste the output into `src/levels/levelN.js` and register it.

---

## 🗺️ Level Data Schema

Each level file exports a plain object. The `enemies` field is **optional** —
levels without it are fully supported.

```ts
{
  playerStart: { x: number, y: number },

  platforms: Array<{
    x:      number,   // top-left X in world pixels
    y:      number,   // top-left Y in world pixels
    width:  number,   // platform width  (px)
    height: number,   // platform height (px)
  }>,

  bombs: Array<{
    x: number,   // world-space centre X
    y: number,   // world-space centre Y
  }>,

  enemies?: Array<{
    type: 'walker' | 'flier' | 'bouncer',
    x:    number,   // world-space spawn centre X
    y:    number,   // world-space spawn centre Y
  }>,
}
```

**Canvas:** 800 × 600 px. Ground floor sits at `y: 568` by convention.

---

## 🐳 Docker

A multi-stage `Dockerfile` is included. Stage 1 builds with Node; Stage 2 copies
only the compiled `dist/` into a lean `nginx:alpine` image (~75 MB total).

```bash
# Build the image
docker build -t bombjack:latest .

# Run locally on port 8080
docker run --rm -p 8080:80 bombjack:latest
# → open http://localhost:8080
```

`nginx.conf` handles:
- SPA fallback (`try_files … /index.html`)
- `Cache-Control: public, immutable` on hashed JS/CSS assets (1-year expiry — safe because Vite content-hashes every filename)
- `Cache-Control: no-store` on `index.html` so browsers always fetch the latest entry-point after a redeploy
- Gzip for text assets

---

## ☸️ Kubernetes

Production-ready manifests live in `k8s/`. Fill in the placeholders and apply:

```bash
kubectl apply -f k8s/
```

| File               | Resource   | Notes |
|--------------------|------------|-------|
| `deployment.yaml`  | Deployment | 2 replicas, rolling update (`maxSurge 1 / maxUnavailable 0`), readiness + liveness probes |
| `service.yaml`     | Service    | `ClusterIP` on port 80 |
| `ingress.yaml`     | Ingress    | nginx Ingress Controller + cert-manager Let's Encrypt TLS, HTTPS redirect, security headers |

**Placeholders to replace:**

| File              | Placeholder        | Example                   |
|-------------------|--------------------|---------------------------|
| `deployment.yaml` | `<IMAGE_REGISTRY>` | `ghcr.io/your-org`        |
| `deployment.yaml` | `<IMAGE_TAG>`      | `abc1234` or `latest`     |
| `ingress.yaml`    | `<YOUR_DOMAIN>`    | `bombjack.example.com`    |

A ready-to-paste `cert-manager ClusterIssuer` snippet is included as a comment
inside `ingress.yaml`.

---

## 🏗️ Architecture Notes

| Topic | Detail |
|---|---|
| **Asset loading** | All textures generated at runtime in `BootScene` via Phaser's Graphics API — zero image files, works fully offline. |
| **Physics** | Arcade physics (lightest weight; ideal for classic platformers). World gravity: `500 px/s²`. |
| **Jump system** | Three-phase: initial impulse → variable hold-boost → glide. 120 ms jump-buffer prevents missed inputs near the ground. |
| **Enemy AI** | Walker uses `body.bottom` edge-probing with a single-flip guard. Flier uses per-instance orbit angle + rotation speed to avoid stacking. Bouncer reads `body.blocked` flags for reliable DVD-style reflection independent of body bounce coefficients. |
| **Platform rendering** | `TileSprite` for visuals + invisible static `Rectangle` for physics — keeps tile art crisp at any width. |
| **Scene communication** | Data passed via `scene.start(key, data)`. Editor uses `sleep`/`wake` (not `stop`) to preserve all state during play-test. |
| **Level registry** | `src/config/levels.js` is the *only* file that needs editing to add a level. |

---

## 🔧 Useful Dev Flags

Toggle physics debug wireframes in `src/main.js`:

```js
physics: {
  arcade: {
    debug: true,   // Renders all physics bodies as coloured wireframes.
  },
},
```

---

## 📜 License

MIT — do whatever you like with it. Have fun! 💣
