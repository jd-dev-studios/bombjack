/**
 * src/levels/level9.js
 * --------------------
 * Layout data for Level 9 — created with the visual editor.
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
  playerStart: { x: 384, y: 496 },

  platforms: [
    { x:   0, y: 560, width: 800, height:  16 },
    { x: 384, y: 544, width:  32, height:  16 },
    { x:   0, y: 160, width: 800, height:  16 },
    { x: 784, y: 176, width:  16, height: 384 },
    { x:   0, y: 176, width:  16, height: 384 }
  ],

  bombs: [
    { x:  80, y: 288 },
    { x:  80, y: 320 },
    { x:  80, y: 352 },
    { x:  80, y: 384 },
    { x:  80, y: 416 },
    { x:  80, y: 448 },
    { x:  80, y: 480 },
    { x:  80, y: 512 },
    { x: 160, y: 288 },
    { x: 160, y: 320 },
    { x: 160, y: 352 },
    { x: 160, y: 384 },
    { x: 160, y: 416 },
    { x: 160, y: 448 },
    { x: 160, y: 480 },
    { x: 160, y: 512 },
    { x: 240, y: 288 },
    { x: 240, y: 320 },
    { x: 240, y: 352 },
    { x: 240, y: 384 },
    { x: 240, y: 416 },
    { x: 240, y: 448 },
    { x: 240, y: 480 },
    { x: 240, y: 512 },
    { x: 320, y: 288 },
    { x: 320, y: 320 },
    { x: 320, y: 352 },
    { x: 320, y: 384 },
    { x: 320, y: 416 },
    { x: 320, y: 448 },
    { x: 320, y: 480 },
    { x: 320, y: 512 },
    { x: 720, y: 288 },
    { x: 720, y: 320 },
    { x: 720, y: 352 },
    { x: 720, y: 384 },
    { x: 720, y: 416 },
    { x: 720, y: 448 },
    { x: 720, y: 480 },
    { x: 720, y: 512 },
    { x: 640, y: 288 },
    { x: 560, y: 288 },
    { x: 480, y: 288 },
    { x: 480, y: 320 },
    { x: 480, y: 352 },
    { x: 480, y: 384 },
    { x: 480, y: 416 },
    { x: 480, y: 448 },
    { x: 480, y: 480 },
    { x: 480, y: 512 },
    { x: 560, y: 320 },
    { x: 560, y: 352 },
    { x: 560, y: 384 },
    { x: 560, y: 416 },
    { x: 560, y: 448 },
    { x: 560, y: 480 },
    { x: 560, y: 512 },
    { x: 640, y: 320 },
    { x: 640, y: 352 },
    { x: 640, y: 384 },
    { x: 640, y: 416 },
    { x: 640, y: 448 },
    { x: 640, y: 480 },
    { x: 640, y: 512 }
  ],

  enemies: [
    { type: 'walker', x: 448, y: 544, dir: 'right' },
    { type: 'walker', x:  48, y: 544, dir: 'right' },
    { type: 'walker', x: 752, y: 544, dir: 'left' },
    { type: 'walker', x: 352, y: 544, dir: 'left' },
    { type: 'flier', x: 752, y: 192, dir: 'left' },
    { type: 'flier', x:  48, y: 192, dir: 'right' },
    { type: 'bouncer', x: 320, y: 224, dir: 'left' },
    { type: 'bouncer', x: 480, y: 224, dir: 'right' }
  ],
};
