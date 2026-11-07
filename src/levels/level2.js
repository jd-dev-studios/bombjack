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
 * NOTE: Canvas is 800 × 600 px.  Ground sits at y: 568.  Ceiling at y: 0.
 */

export default {
  playerStart: { x: 384, y: 400 },

  platforms: [
    { x:   0, y: 568, width: 800, height:  32 },
    { x:   0, y:   0, width: 800, height:  16 },
    { x:   0, y:   0, width:  16, height: 600 },
    { x: 784, y:   0, width:  16, height: 600 },
    { x:  16, y: 490, width: 120, height:  16 },
    { x:  16, y: 390, width: 100, height:  16 },
    { x:  16, y: 290, width: 120, height:  16 },
    { x:  16, y: 190, width: 100, height:  16 },
    { x: 664, y: 490, width: 120, height:  16 },
    { x: 684, y: 390, width: 100, height:  16 },
    { x: 664, y: 290, width: 120, height:  16 },
    { x: 684, y: 190, width: 100, height:  16 },
    { x: 200, y:  16, width:  16, height: 260 },
    { x: 584, y:  16, width:  16, height: 260 },
    { x: 200, y: 400, width:  16, height: 168 },
    { x: 584, y: 400, width:  16, height: 168 },
    { x: 310, y: 510, width: 180, height:  16 },
    { x: 270, y: 420, width: 100, height:  16 },
    { x: 430, y: 420, width: 100, height:  16 },
    { x: 310, y: 330, width: 180, height:  16 },
    { x: 310, y: 220, width: 180, height:  16 },
    { x: 250, y: 120, width: 300, height:  16 }
  ],

  bombs: [
    { x: 100, y: 548 },
    { x: 260, y: 548 },
    { x: 400, y: 548 },
    { x: 540, y: 548 },
    { x: 700, y: 548 },
    { x: 100, y:  30 },
    { x: 250, y:  30 },
    { x: 400, y:  30 },
    { x: 550, y:  30 },
    { x: 700, y:  30 },
    { x:  50, y: 474 },
    { x: 110, y: 474 },
    { x:  50, y: 374 },
    { x: 100, y: 374 },
    { x:  50, y: 274 },
    { x: 110, y: 274 },
    { x:  50, y: 174 },
    { x: 100, y: 174 },
    { x: 690, y: 474 },
    { x: 750, y: 474 },
    { x: 700, y: 374 },
    { x: 750, y: 374 },
    { x: 690, y: 274 },
    { x: 750, y: 274 },
    { x: 700, y: 174 },
    { x: 750, y: 174 },
    { x: 355, y: 494 },
    { x: 445, y: 494 },
    { x: 315, y: 404 },
    { x: 485, y: 404 },
    { x: 355, y: 314 },
    { x: 445, y: 314 },
    { x: 355, y: 204 },
    { x: 445, y: 204 },
    { x: 300, y: 104 },
    { x: 400, y: 104 },
    { x: 500, y: 104 }
  ],
};
