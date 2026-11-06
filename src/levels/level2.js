/**
 * src/levels/level2.js
 * --------------------
 * Layout data for Level 2 — denser bomb patterns, more interior walls,
 * asymmetric shelf layout to create a different routing challenge.
 *
 * See level1.js for a full description of the data shape.
 * Canvas dimensions: 800 × 600 px.
 */

export default {
  playerStart: { x: 400, y: 510 },

  platforms: [
    // ── Bounding surfaces ────────────────────────────────────────────────────
    { x:   0, y: 568, width: 800, height: 32 }, // floor
    { x:   0, y:   0, width: 800, height: 16 }, // ceiling
    { x:   0, y:   0, width:  16, height: 600 }, // left wall
    { x: 784, y:   0, width:  16, height: 600 }, // right wall

    // ── Left column of shelves ───────────────────────────────────────────────
    { x:  16, y: 490, width: 120, height: 16 },
    { x:  16, y: 390, width: 100, height: 16 },
    { x:  16, y: 290, width: 120, height: 16 },
    { x:  16, y: 190, width: 100, height: 16 },

    // ── Right column of shelves ──────────────────────────────────────────────
    { x: 664, y: 490, width: 120, height: 16 },
    { x: 684, y: 390, width: 100, height: 16 },
    { x: 664, y: 290, width: 120, height: 16 },
    { x: 684, y: 190, width: 100, height: 16 },

    // ── Interior vertical walls ──────────────────────────────────────────────
    { x: 200, y:  16, width: 16, height: 260 }, // left inner wall (top half)
    { x: 584, y:  16, width: 16, height: 260 }, // right inner wall (top half)
    { x: 200, y: 400, width: 16, height: 168 }, // left inner wall (bottom half)
    { x: 584, y: 400, width: 16, height: 168 }, // right inner wall (bottom half)

    // ── Central horizontal shelves ───────────────────────────────────────────
    { x: 310, y: 510, width: 180, height: 16 },
    { x: 270, y: 420, width: 100, height: 16 }, // left of centre
    { x: 430, y: 420, width: 100, height: 16 }, // right of centre
    { x: 310, y: 330, width: 180, height: 16 },
    { x: 310, y: 220, width: 180, height: 16 },

    // ── Top central shelf ────────────────────────────────────────────────────
    { x: 250, y: 120, width: 300, height: 16 },
  ],

  bombs: [
    // ── Floor line ───────────────────────────────────────────────────────────
    { x: 100, y: 548 },
    { x: 260, y: 548 },
    { x: 400, y: 548 },
    { x: 540, y: 548 },
    { x: 700, y: 548 },

    // ── Ceiling line ─────────────────────────────────────────────────────────
    { x: 100, y:  30 },
    { x: 250, y:  30 },
    { x: 400, y:  30 },
    { x: 550, y:  30 },
    { x: 700, y:  30 },

    // ── Left wall vertical column ────────────────────────────────────────────
    { x:  30, y: 120 },
    { x:  30, y: 250 },
    { x:  30, y: 380 },
    { x:  30, y: 500 },

    // ── Right wall vertical column ───────────────────────────────────────────
    { x: 770, y: 120 },
    { x: 770, y: 250 },
    { x: 770, y: 380 },
    { x: 770, y: 500 },

    // ── Left inner wall — top half column ────────────────────────────────────
    { x: 216, y:  50 },
    { x: 216, y: 130 },
    { x: 216, y: 210 },

    // ── Left inner wall — bottom half column ─────────────────────────────────
    { x: 216, y: 420 },
    { x: 216, y: 490 },
    { x: 216, y: 550 },

    // ── Right inner wall — top half column ───────────────────────────────────
    { x: 584, y:  50 },
    { x: 584, y: 130 },
    { x: 584, y: 210 },

    // ── Right inner wall — bottom half column ────────────────────────────────
    { x: 584, y: 420 },
    { x: 584, y: 490 },
    { x: 584, y: 550 },

    // ── Left shelves horizontal lines ────────────────────────────────────────
    { x:  50, y: 474 },
    { x: 110, y: 474 },
    { x:  50, y: 374 },
    { x: 100, y: 374 },
    { x:  50, y: 274 },
    { x: 110, y: 274 },
    { x:  50, y: 174 },
    { x: 100, y: 174 },

    // ── Right shelves horizontal lines ───────────────────────────────────────
    { x: 690, y: 474 },
    { x: 750, y: 474 },
    { x: 700, y: 374 },
    { x: 750, y: 374 },
    { x: 690, y: 274 },
    { x: 750, y: 274 },
    { x: 700, y: 174 },
    { x: 750, y: 174 },

    // ── Central area horizontal lines ─────────────────────────────────────────
    { x: 355, y: 494 },
    { x: 445, y: 494 },
    { x: 315, y: 404 },
    { x: 485, y: 404 },
    { x: 355, y: 314 },
    { x: 445, y: 314 },
    { x: 355, y: 204 },
    { x: 445, y: 204 },

    // ── Top shelf line ────────────────────────────────────────────────────────
    { x: 300, y: 104 },
    { x: 400, y: 104 },
    { x: 500, y: 104 },
  ],
};

