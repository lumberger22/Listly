const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /transactions — create a transaction when an offer is accepted (protected)
router.post("/", auth, (req, res) => {
  const { lid, bid, sid, price, delivery_type, shipping_origin, shipping_address } = req.body;
  if (!lid || !bid || !sid || !price || !delivery_type) {
    return res.status(400).json({ error: "lid, bid, sid, price, and delivery_type are required" });
  }

  db.query(
    "INSERT INTO Transaction (LID, BID, SID, Price) VALUES (?, ?, ?, ?)",
    [lid, bid, sid, price],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const tid = result.insertId;

      db.query(
        "INSERT INTO Delivery_Method (TID, Type, Shipping_Origin, Shipping_Address) VALUES (?, ?, ?, ?)",
        [tid, delivery_type, shipping_origin || null, shipping_address || null],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          // Mark listing as sold
          db.query("UPDATE Item_Listing SET Status = 'sold' WHERE LID = ?", [lid], (err3) => {
            if (err3) return res.status(500).json({ error: err3.message });
            res.status(201).json({ tid });
          });
        }
      );
    }
  );
});

// GET /transactions/:uid — transaction history for a user (protected)
router.get("/:uid", auth, (req, res) => {
  if (parseInt(req.params.uid) !== req.user.uid) {
    return res.status(403).json({ error: "Not authorized" });
  }

  db.query(
    `SELECT t.*,
            l.Name AS ListingName, l.Images AS ListingImages,
            ub.Username AS BuyerName,
            us.Username AS SellerName
     FROM Transaction t
     JOIN Item_Listing l ON l.LID = t.LID
     JOIN Buyer b ON b.BID = t.BID
     JOIN User ub ON ub.UID = b.UID
     JOIN Seller s ON s.SID = t.SID
     JOIN User us ON us.UID = s.UID
     WHERE b.UID = ? OR s.UID = ?
     ORDER BY t.Created_At DESC`,
    [req.user.uid, req.user.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

module.exports = router;
