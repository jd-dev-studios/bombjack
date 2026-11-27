/**
 * src/levels/level5.js
 * --------------------
 * Layout data for Level 5 — created with the visual editor.
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
  playerStart: { x: 192, y: 528 },

  platforms: [
    { x: 160, y: 576, width: 480, height:  16 },
    { x: 160, y: 432, width: 416, height:  16 },
    { x: 160, y:   0, width: 480, height:  16 },
    { x: 144, y:   0, width:  16, height: 592 },
    { x: 640, y:   0, width:  16, height: 592 },
    { x: 384, y: 304, width: 256, height:  16 },
    { x: 224, y: 304, width:  96, height:  16 },
    { x: 160, y: 192, width: 416, height:  16 },
    { x: 560, y:  96, width:  80, height:  16 },
    { x: 160, y:  96, width:  80, height:  16 }
  ],

  bombs: [
    { x: 288, y: 544 },
    { x: 320, y: 544 },
    { x: 352, y: 544 },
    { x: 384, y: 544 },
    { x: 432, y: 464 },
    { x: 464, y: 464 },
    { x: 496, y: 464 },
    { x: 528, y: 464 },
    { x: 624, y: 448 },
    { x: 624, y: 416 },
    { x: 624, y: 384 },
    { x: 624, y: 480 },
    { x: 624, y: 512 },
    { x: 464, y: 416 },
    { x: 432, y: 416 },
    { x: 400, y: 416 },
    { x: 368, y: 416 },
    { x: 288, y: 336 },
    { x: 256, y: 336 },
    { x: 176, y: 416 },
    { x: 176, y: 384 },
    { x: 176, y: 352 },
    { x: 176, y: 320 },
    { x: 224, y: 224 },
    { x: 256, y: 224 },
    { x: 288, y: 224 },
    { x: 320, y: 224 },
    { x: 432, y: 288 },
    { x: 464, y: 288 },
    { x: 496, y: 288 },
    { x: 624, y: 208 },
    { x: 624, y: 176 },
    { x: 624, y: 240 },
    { x: 464, y: 160 },
    { x: 432, y: 160 },
    { x: 400, y: 160 },
    { x: 368, y: 160 },
    { x: 336, y: 160 },
    { x: 224, y: 128 },
    { x: 192, y: 128 },
    { x: 592, y:  80 },
    { x: 624, y:  80 },
    { x: 192, y:  80 },
    { x: 224, y:  80 },
    { x: 624, y: 128 },
    { x: 592, y: 128 }
  ],

  enemies: [
    { type: 'walker', x: 176, y: 416, dir: 'right' },
    { type: 'walker', x: 624, y: 288, dir: 'left' },
    { type: 'walker', x: 176, y: 176, dir: 'right' }
  ],
};
