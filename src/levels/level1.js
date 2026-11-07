/**
 * src/levels/level1.js
 * --------------------
 * Layout data for Level 1.
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
  playerStart: { x: 384, y: 272 },

  platforms: [
    { x:   0, y: 560, width: 800, height:  32 },
    { x:   0, y:   0, width:  32, height: 560 },
    { x: 768, y:   0, width:  32, height: 560 },
    { x:  32, y:   0, width: 736, height:  32 },
    { x: 544, y: 480, width: 176, height:  32 },
    { x:  80, y: 384, width:  80, height:  32 },
    { x: 320, y: 320, width: 160, height:  32 },
    { x: 160, y: 160, width: 112, height:  32 },
    { x: 480, y: 128, width: 160, height:  32 }
  ],

  bombs: [
    { x: 160, y: 544 },
    { x: 192, y: 544 },
    { x: 224, y: 544 },
    { x: 576, y: 464 },
    { x: 608, y: 464 },
    { x: 640, y: 464 },
    { x: 672, y: 464 },
    { x: 704, y: 464 },
    { x: 144, y:  48 },
    { x: 192, y:  48 },
    { x: 240, y:  48 },
    { x: 288, y:  48 },
    { x: 752, y:  48 },
    { x: 720, y:  48 },
    { x: 688, y:  48 },
    { x: 656, y:  48 },
    { x: 496, y: 176 },
    { x: 528, y: 176 },
    { x: 560, y: 176 },
    { x: 592, y: 176 },
    { x: 624, y: 176 },
    { x: 752, y: 192 },
    { x: 752, y: 224 },
    { x: 752, y: 256 },
    { x: 752, y: 288 },
    { x: 752, y: 320 },
    { x:  48, y: 384 },
    { x:  48, y: 352 },
    { x:  48, y: 320 },
    { x:  48, y: 288 },
    { x:  48, y: 256 },
    { x:  48, y: 224 }
  ],

  enemies: [
    // Walker: patrols the wide lower-right shelf (x 544–720, y 480 platform).
    { type: 'walker',  x: 624, y: 464 },
    // Flier: drifts in the open mid-arena space, hunting the player.
    { type: 'flier',   x: 400, y: 220 },
    // Bouncer: ricochets in the left-side vertical corridor.
    { type: 'bouncer', x: 200, y: 420 },
  ],
};
