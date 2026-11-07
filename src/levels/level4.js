/**
 * src/levels/level4.js
 * --------------------
 * Layout data for Level 4 — created with the visual editor.
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
 * enemies      – Array of { type, x, y }
 *                  type : 'walker' | 'flier' | 'bouncer'
 *                  x / y: world-space spawn centre.
 *
 * NOTE: Canvas is 800 × 600 px.  Ground sits at y: 568.  Ceiling at y: 0.
 */

export default {
  playerStart: { x: 384, y: 400 },

  platforms: [
    { x:   0, y: 560, width: 800, height:  32 },
    { x: 112, y: 448, width:  96, height:  32 },
    { x: 592, y: 448, width:  96, height:  32 },
    { x: 320, y: 320, width: 160, height:  32 },
    { x: 480, y:  96, width: 160, height:  32 },
    { x: 160, y:  96, width: 160, height:  32 },
    { x: 784, y:   0, width:  16, height: 560 },
    { x:   0, y:   0, width:  16, height: 560 },
    { x:  16, y:   0, width: 768, height:  16 }
  ],

  bombs: [
    { x: 672, y: 432 },
    { x: 640, y: 432 },
    { x: 608, y: 432 },
    { x: 192, y: 432 },
    { x: 160, y: 432 },
    { x: 128, y: 432 },
    { x: 320, y: 160 },
    { x: 320, y: 192 },
    { x: 320, y: 224 },
    { x: 320, y: 256 },
    { x: 320, y: 288 },
    { x: 480, y: 160 },
    { x: 480, y: 192 },
    { x: 480, y: 224 },
    { x: 480, y: 256 },
    { x: 480, y: 288 },
    { x: 624, y:  80 },
    { x: 592, y:  80 },
    { x: 560, y:  80 },
    { x: 528, y:  80 },
    { x: 496, y:  80 },
    { x: 304, y:  80 },
    { x: 272, y:  80 },
    { x: 240, y:  80 },
    { x: 208, y:  80 },
    { x: 176, y:  80 },
    { x: 336, y: 368 },
    { x: 368, y: 368 },
    { x: 400, y: 368 },
    { x: 432, y: 368 },
    { x: 464, y: 368 },
    { x: 768, y: 112 },
    { x: 768, y: 144 },
    { x: 768, y: 176 },
    { x: 768, y: 208 },
    { x: 768, y: 272 },
    { x: 768, y: 304 },
    { x: 768, y: 336 },
    { x: 768, y: 368 },
    { x:  32, y: 144 },
    { x:  32, y: 112 },
    { x:  32, y: 176 },
    { x:  32, y: 208 },
    { x:  32, y: 304 },
    { x:  32, y: 272 },
    { x:  32, y: 336 },
    { x:  32, y: 368 }
  ],

  enemies: [
    { type: 'walker', x: 560, y:  80 },
    { type: 'walker', x: 240, y:  80 },
    { type: 'flier', x: 400, y: 208 },
    { type: 'walker', x: 640, y: 432 },
    { type: 'walker', x: 160, y: 432 }
  ],
};
