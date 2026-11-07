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
 * enemies      – Array of { type, x, y }
 *                  type : 'walker' | 'flier' | 'bouncer'
 *                  x / y: world-space spawn centre.
 *
 * NOTE: Canvas is 800 × 600 px.  Ground sits at y: 568.  Ceiling at y: 0.
 */

export default {
  playerStart: { x: 480, y: 528 },

  platforms: [
    { x:   0, y: 576, width: 800, height:  16 },
    { x: 784, y:   0, width:  16, height: 576 },
    { x:   0, y:   0, width:  16, height: 576 },
    { x:  16, y:   0, width: 768, height:  16 },
    { x: 640, y: 144, width: 144, height:  16 },
    { x: 480, y: 304, width: 160, height:  16 },
    { x:  16, y: 144, width: 144, height:  16 },
    { x: 160, y: 304, width: 160, height:  16 },
    { x: 432, y: 464, width: 128, height:  16 },
    { x: 224, y: 464, width: 128, height:  16 }
  ],

  bombs: [
    { x: 656, y: 128 },
    { x: 688, y: 128 },
    { x: 720, y: 128 },
    { x: 752, y: 128 },
    { x:  32, y: 128 },
    { x:  64, y: 128 },
    { x:  96, y: 128 },
    { x: 128, y: 128 },
    { x: 176, y: 288 },
    { x: 208, y: 288 },
    { x: 240, y: 288 },
    { x: 272, y: 288 },
    { x: 304, y: 288 },
    { x: 496, y: 288 },
    { x: 528, y: 288 },
    { x: 560, y: 288 },
    { x: 592, y: 288 },
    { x: 624, y: 288 },
    { x: 448, y: 448 },
    { x: 480, y: 448 },
    { x: 512, y: 448 },
    { x: 544, y: 448 },
    { x: 240, y: 448 },
    { x: 272, y: 448 },
    { x: 304, y: 448 },
    { x: 336, y: 448 }
  ],

  enemies: [
    { type: 'walker', x: 768, y: 128 },
    { type: 'walker', x:  32, y: 128 },
    { type: 'walker', x: 624, y: 288 },
    { type: 'walker', x: 176, y: 288 },
    { type: 'walker', x: 240, y: 448 },
    { type: 'walker', x: 544, y: 448 },
    { type: 'bouncer', x: 400, y: 160 }
  ],
};
