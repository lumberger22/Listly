const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /offers — buyer makes an offer (protected)
router.post("/", auth, (req, res) => {
  const { lid, price } = req.body;
  if (!lid || !price) return res.status(400).json({ error: "lid and price are required" });

  // Get BID and SID
  db.query("SELECT BID FROM Buyer WHERE UID = ?", [req.user.uid], (err, buyerRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!buyerRows.length) return res.status(403).json({ error: "Buyer record not found" });

    const bid = buyerRows[0].BID;

    db.query("SELECT SID FROM Item_Listing WHERE LID = ?", [lid], (err2, listingRows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (!listingRows.length) return res.status(404).json({ error: "Listing not found" });

      const sid = listingRows[0].SID;

      db.query(
        "INSERT INTO Offer (LID, BID, SID, Price) VALUES (?, ?, ?, ?)",
        [lid, bid, sid, price],
        (err3, result) => {
          if (err3) return res.status(500).json({ error: err3.message });
          res.status(201).json({ oid: result.insertId });
        }
      );
    });
  });
});

// GET /offers/mine — all offers made by the logged-in buyer (protected)
router.get("/mine", auth, (req, res) => {
  db.query("SELECT BID FROM Buyer WHERE UID = ?", [req.user.uid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(403).json({ error: "Buyer record not found" });

    const bid = rows[0].BID;

    db.query(
      `SELECT o.*,
              l.Name AS ListingName, l.Images AS ListingImages, l.Price AS ListingPrice,
              u.Username AS SellerName,
              t.TID,
              CASE WHEN r.ReviewID IS NOT NULL THEN 1 ELSE 0 END AS has_review
       FROM Offer o
       JOIN Item_Listing l ON l.LID = o.LID
       JOIN Seller s ON s.SID = o.SID
       JOIN User u ON u.UID = s.UID
       LEFT JOIN Transaction t ON t.BID = o.BID AND t.LID = o.LID
       LEFT JOIN Review r ON r.TID = t.TID
       WHERE o.BID = ?
       ORDER BY o.OID DESC`,
      [bid],
      (err2, offers) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json(offers);
      }
    );
  });
});

// GET /offers/:lid — all offers on a listing (protected, seller only)
router.get("/:lid", auth, (req, res) => {
  // Verify requester owns this listing
  db.query(
    `SELECT l.LID FROM Item_Listing l
     JOIN Seller s ON s.SID = l.SID
     WHERE l.LID = ? AND s.UID = ?`,
    [req.params.lid, req.user.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(403).json({ error: "Not authorized" });

      db.query(
        `SELECT o.*, u.Username AS BuyerName
         FROM Offer o
         JOIN Buyer b ON b.BID = o.BID
         JOIN User u ON u.UID = b.UID
         WHERE o.LID = ?
         ORDER BY o.OID DESC`,
        [req.params.lid],
        (err2, offers) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json(offers);
        }
      );
    }
  );
});

// PATCH /offers/:oid — buyer updates their offer price (protected, pending only)
router.patch("/:oid", auth, (req, res) => {
  const { price } = req.body;
  if (!price || isNaN(price) || price <= 0) {
    return res.status(400).json({ error: "A valid price is required" });
  }

  db.query(
    `SELECT o.OID FROM Offer o
     JOIN Buyer b ON b.BID = o.BID
     WHERE o.OID = ? AND b.UID = ? AND o.Status = 'pending'`,
    [req.params.oid, req.user.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(403).json({ error: "Not authorized or offer is not editable" });

      db.query("UPDATE Offer SET Price = ? WHERE OID = ?", [price, req.params.oid], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true });
      });
    }
  );
});

// DELETE /offers/:oid — buyer withdraws their offer (protected, pending or countered only)
router.delete("/:oid", auth, (req, res) => {
  db.query(
    `SELECT o.OID FROM Offer o
     JOIN Buyer b ON b.BID = o.BID
     WHERE o.OID = ? AND b.UID = ? AND o.Status IN ('pending', 'countered')`,
    [req.params.oid, req.user.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(403).json({ error: "Not authorized or offer cannot be withdrawn" });

      db.query("DELETE FROM Offer WHERE OID = ?", [req.params.oid], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ success: true });
      });
    }
  );
});

// PUT /offers/:oid — seller accepts, rejects, or counters (protected)
router.put("/:oid", auth, (req, res) => {
  const { status, counter_price } = req.body;
  const validStatuses = ["accepted", "rejected", "countered"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: "status must be accepted, rejected, or countered" });
  }
  if (status === "countered" && !counter_price) {
    return res.status(400).json({ error: "counter_price required when countering" });
  }

  // Verify seller owns the listing this offer is on
  db.query(
    `SELECT o.OID, o.LID, o.BID, o.SID, o.Price FROM Offer o
     JOIN Item_Listing l ON l.LID = o.LID
     JOIN Seller s ON s.SID = l.SID
     WHERE o.OID = ? AND s.UID = ?`,
    [req.params.oid, req.user.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(403).json({ error: "Not authorized" });

      const offer = rows[0];

      db.query(
        "UPDATE Offer SET Status = ?, Price = IF(? IS NOT NULL, ?, Price) WHERE OID = ?",
        [status, counter_price || null, counter_price || null, req.params.oid],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          if (status !== "accepted") return res.json({ success: true });

          // Create transaction and mark listing sold
          db.query(
            "INSERT INTO Transaction (LID, BID, SID, Price, Status) VALUES (?, ?, ?, ?, 'completed')",
            [offer.LID, offer.BID, offer.SID, offer.Price],
            (err3) => {
              if (err3) return res.status(500).json({ error: err3.message });
              db.query(
                "UPDATE Item_Listing SET Status = 'sold' WHERE LID = ?",
                [offer.LID],
                (err4) => {
                  if (err4) return res.status(500).json({ error: err4.message });
                  res.json({ success: true });
                }
              );
            }
          );
        }
      );
    }
  );
});

module.exports = router;
