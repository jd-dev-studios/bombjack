/**
 * src/config/levels.js
 * --------------------
 * Central registry of every level in the game.
 *
 * HOW TO ADD A NEW LEVEL
 * ──────────────────────
 * 1. Create `src/levels/levelN.js` following the same data shape as level1.js.
 * 2. Import it here.
 * 3. Push it into the LEVELS array — that's it. GameScene picks it up automatically.
 *
 * The index of each entry matches the `levelIndex` passed between scenes:
 *   LEVELS[0]  →  level1   (first level played)
 *   LEVELS[1]  →  level2
 *   LEVELS[2]  →  level3   (add when ready)
 *   …
 */

import level1 from '../levels/level1.js';
import level2 from '../levels/level2.js';

export const LEVELS = [
  level1,
  level2,
];
