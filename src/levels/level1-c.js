/**
 * src/levels/level1-c.js
 * --------------------
 * Layout data for Sub-level 1-C — same arena layout as 1-A/B/D, Flier enemies added.
 *
 * DATA SHAPE
 * ----------
 * playerStart  – { x, y }  World position where the player spawns.
 *
 * platforms    – Array of { x, y, width, height }
 *                  x / y    : top-left corner in world pixels.
 *                  width    : extent along the X axis (large = shelf, small = wall).
 *                  height   : extent along the Y axis (small = shelf, large = wall).
 *
 * bombs        – Array of { x, y }
 *                  World-space centre of each static bomb pickup.
 *
 * enemies      – Array of { type, x, y, dir? }
 *                  type : 'walker' | 'flier' | 'bouncer'
 *                  dir  : 'left' | 'right' (optional; affects walkers and bouncers).
 *                  x / y: world-space spawn centre.
 *
 * NOTE: Canvas is 800 × 600 px.  Ground sits at y: 568.  Ceiling at y: 0.
 */

export default {
  playerStart: { x: 384, y: 272 },

  platforms: [
    { x: 480, y: 112, width: 160, height:  16 },
    { x: 160, y: 144, width: 128, height:  16 },
    { x:  96, y: 368, width: 160, height:  16 },
    { x: 752, y:   0, width:  16, height: 576 },
    { x:  32, y:   0, width:  16, height: 576 },
    { x:  32, y: 576, width: 736, height:  16 },
    { x: 512, y: 464, width: 192, height:  16 },
    { x:  48, y:   0, width: 704, height:  16 }
  ],

  bombs: [
    { x: 512, y:  96 },
    { x: 544, y:  96 },
    { x: 576, y:  96 },
    { x: 608, y:  96 },
    { x: 192, y: 128 },
    { x: 224, y: 128 },
    { x: 256, y: 128 },
    { x: 576, y: 448 },
    { x: 608, y: 448 },
    { x: 640, y: 448 },
    { x: 672, y: 448 },
    { x: 128, y: 352 },
    { x: 160, y: 352 },
    { x: 192, y: 352 },
    { x: 224, y: 352 },
    { x: 736, y: 160 },
    { x: 736, y: 192 },
    { x: 736, y: 224 },
    { x: 736, y: 256 },
    { x:  64, y: 256 },
    { x:  64, y: 224 },
    { x:  64, y: 192 },
    { x:  64, y: 160 },
    { x: 544, y: 448 }
  ],

  enemies: [
    { type: 'walker', x: 160, y: 560, dir: 'right' },
    { type: 'walker', x: 640, y: 560, dir: 'left' },
    { type: 'walker', x: 688, y: 448, dir: 'left' },
    { type: 'flier', x: 640, y: 160, dir: 'left' },
    { type: 'flier', x: 160, y: 480, dir: 'right' }
  ],
};
