/**
 * src/config/levels.js
 * --------------------
 * Central registry of every level in the game.
 *
 * HOW TO ADD A NEW LEVEL
 * ──────────────────────
 * 1. Create `src/levels/levelN.js` following the same data shape as level1-a.js.
 * 2. Import it here.
 * 3. Push it into the LEVELS array — that's it. GameScene picks it up automatically.
 *
 * The index of each entry matches the `levelIndex` passed between scenes:
 *   LEVELS[0]  →  level1-a   (intro run — same layout as 1-b/c/d, no enemies)
 *   LEVELS[1]  →  level1-b   (Walkers introduced)
 *   LEVELS[2]  →  level1-c   (Fliers introduced)
 *   LEVELS[3]  →  level1-d   (Bouncers introduced — all three enemy types present)
 *   …          →  add further levels below as needed
 */

import level1a from '../levels/level1-a.js';
import level1b from '../levels/level1-b.js';
import level1c from '../levels/level1-c.js';
import level1d from '../levels/level1-d.js';

import level2a from '../levels/level2-a.js';
import level2b from '../levels/level2-b.js';
import level2c from '../levels/level2-c.js';
import level2d from '../levels/level2-d.js';


//import level3 from '../levels/level3.js';
//import level4 from '../levels/level4.js';
//import level5 from '../levels/level5.js';
//import level6 from '../levels/level6.js';

export const LEVELS = [
  level1a,
  level1b,
  level1c,
  level1d,
  level2a,
  level2b,
  level2c,
  level2d,
];

