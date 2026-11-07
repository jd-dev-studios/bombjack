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
  playerStart: { x: 80, y: 510 },

  platforms: [
    { x:   0, y: 568, width: 800, height:  32 },
    { x:   0, y:   0, width: 800, height:  16 },
    { x:   0, y:   0, width:  16, height: 600 },
    { x: 784, y:   0, width:  16, height: 600 },
    { x:  16, y: 460, width: 160, height:  16 },
    { x:  16, y: 340, width: 130, height:  16 },
    { x:  16, y: 220, width: 160, height:  16 },
    { x: 624, y: 460, width: 160, height:  16 },
    { x: 654, y: 340, width: 130, height:  16 },
    { x: 624, y: 220, width: 160, height:  16 },
    { x: 250, y: 350, width:  16, height: 218 },
    { x: 534, y: 350, width:  16, height: 218 },
    { x: 310, y: 490, width: 180, height:  16 },
    { x: 310, y: 380, width: 180, height:  16 },
    { x: 310, y: 270, width: 180, height:  16 },
    { x: 310, y: 160, width: 180, height:  16 }
  ],

  bombs: [
    { x:  60, y: 548 },
    { x: 200, y: 548 },
    { x: 400, y: 548 },
    { x: 600, y: 548 },
    { x: 740, y: 548 },
    { x: 150, y:  30 },
    { x: 300, y:  30 },
    { x: 400, y:  30 },
    { x: 500, y:  30 },
    { x: 650, y:  30 },
    { x:  30, y: 150 },
    { x:  30, y: 300 },
    { x:  30, y: 420 },
    { x: 770, y: 150 },
    { x: 770, y: 300 },
    { x: 770, y: 420 },
    { x: 236, y: 370 },
    { x: 236, y: 430 },
    { x: 236, y: 490 },
    { x: 236, y: 550 },
    { x: 564, y: 370 },
    { x: 564, y: 430 },
    { x: 564, y: 490 },
    { x: 564, y: 550 },
    { x:  60, y: 444 },
    { x: 130, y: 444 },
    { x:  60, y: 324 },
    { x: 120, y: 324 },
    { x:  60, y: 204 },
    { x: 130, y: 204 },
    { x: 668, y: 444 },
    { x: 738, y: 444 },
    { x: 668, y: 324 },
    { x: 728, y: 324 },
    { x: 668, y: 204 },
    { x: 738, y: 204 },
    { x: 355, y: 474 },
    { x: 445, y: 474 },
    { x: 355, y: 364 },
    { x: 445, y: 364 },
    { x: 355, y: 254 },
    { x: 445, y: 254 },
    { x: 355, y: 144 },
    { x: 445, y: 144 }
  ],

  enemies: [
    { type: 'walker', x: 720, y: 192 },
    { type: 'walker', x:  48, y: 192 },
    { type: 'flier', x: 400, y: 336 }
  ],
};
