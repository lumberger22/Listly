const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /reviews — submit a review after a transaction (protected)
router.post("/", auth, (req, res) => {
  const { tid, sid, lid, content, rating } = req.body;
  if (!tid || !sid || !rating) {
    return res.status(400).json({ error: "tid, sid, and rating are required" });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be between 1 and 5" });
  }

  // Get BID and verify buyer was part of this transaction
  db.query(
    `SELECT t.TID, b.BID FROM Transaction t
     JOIN Buyer b ON b.BID = t.BID
     WHERE t.TID = ? AND b.UID = ?`,
    [tid, req.user.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(403).json({ error: "Not authorized to review this transaction" });

      const bid = rows[0].BID;

      db.query(
        "INSERT INTO Review (TID, BID, SID, LID, Content, Rating) VALUES (?, ?, ?, ?, ?, ?)",
        [tid, bid, sid, lid || null, content || null, rating],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.status(201).json({ reviewId: result.insertId });
        }
      );
    }
  );
});

// GET /reviews/:sid — all reviews for a seller
router.get("/:sid", (req, res) => {
  db.query(
    `SELECT r.*, u.Username AS BuyerName, l.Name AS ListingName
     FROM Review r
     JOIN Buyer b ON b.BID = r.BID
     JOIN User u ON u.UID = b.UID
     LEFT JOIN Item_Listing l ON l.LID = r.LID
     WHERE r.SID = ?
     ORDER BY r.ReviewID DESC`,
    [req.params.sid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

module.exports = router;
