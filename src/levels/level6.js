/**
 * src/levels/level6.js
 * --------------------
 * Layout data for Level 6 — created with the visual editor.
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
  playerStart: { x: 384, y: 512 },

  platforms: [
    { x: 160, y: 160, width:  32, height: 256 },
    { x: 608, y: 160, width:  32, height: 256 },
    { x: 160, y: 128, width: 480, height:  32 },
    { x: 320, y: 448, width: 160, height:  32 },
    { x:   0, y: 576, width:  96, height:  32 },
    { x:  96, y: 576, width: 704, height:  32 },
    { x: 640, y: 384, width:  32, height:  16 },
    { x: 128, y: 384, width:  32, height:  16 },
    { x: 752, y: 160, width:  48, height:  16 },
    { x:   0, y: 160, width:  48, height:  16 }
  ],

  bombs: [
    { x: 336, y: 432 },
    { x: 368, y: 432 },
    { x: 400, y: 432 },
    { x: 432, y: 432 },
    { x: 464, y: 432 },
    { x: 672, y: 448 },
    { x: 672, y: 480 },
    { x: 672, y: 512 },
    { x: 128, y: 448 },
    { x: 128, y: 480 },
    { x: 128, y: 512 },
    { x: 768, y: 352 },
    { x: 768, y: 320 },
    { x: 768, y: 288 },
    { x: 768, y: 256 },
    { x:  32, y: 320 },
    { x:  32, y: 352 },
    { x:  32, y: 288 },
    { x:  32, y: 256 },
    { x: 192, y: 112 },
    { x: 224, y: 112 },
    { x: 256, y: 112 },
    { x: 288, y: 112 },
    { x: 608, y: 112 },
    { x: 576, y: 112 },
    { x: 544, y: 112 },
    { x: 512, y: 112 },
    { x: 336, y:  16 },
    { x: 368, y:  16 },
    { x: 400, y:  16 },
    { x: 432, y:  16 },
    { x: 464, y:  16 },
    { x: 672, y: 544 },
    { x: 128, y: 544 }
  ],

  enemies: [
    { type: 'walker', x: 608, y: 112 },
    { type: 'walker', x: 192, y: 112 },
    { type: 'walker', x: 400, y: 432 },
    { type: 'flier', x: 768, y:  32 },
    { type: 'flier', x:  32, y:  48 }
  ],
};
