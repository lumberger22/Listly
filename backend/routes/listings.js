const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /listings — all active listings, optional ?category=&search=
router.get("/", (req, res) => {
  const { category, search } = req.query;
  let sql = `
    SELECT l.*, u.Username AS SellerName
    FROM Item_Listing l
    JOIN Seller s ON s.SID = l.SID
    JOIN User u ON u.UID = s.UID
    WHERE l.Status = 'active'
  `;
  const params = [];

  if (category) {
    sql += " AND l.Category = ?";
    params.push(category);
  }
  if (search) {
    sql += " AND l.Name LIKE ?";
    params.push(`%${search}%`);
  }

  sql += " ORDER BY l.LID DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /listings/mine — current user's listings, all statuses (protected)
router.get("/mine", auth, (req, res) => {
  db.query(
    `SELECT l.*, u.Username AS SellerName, s.UID AS SellerUID
     FROM Item_Listing l
     JOIN Seller s ON s.SID = l.SID
     JOIN User u ON u.UID = s.UID
     WHERE s.UID = ?
     ORDER BY l.LID DESC`,
    [req.user.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// GET /listings/:id — single listing with seller info
router.get("/:id", (req, res) => {
  db.query(
    `SELECT l.*, u.Username AS SellerName, u.UID AS SellerUID, s.SID
     FROM Item_Listing l
     JOIN Seller s ON s.SID = l.SID
     JOIN User u ON u.UID = s.UID
     WHERE l.LID = ?`,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: "Listing not found" });
      res.json(rows[0]);
    }
  );
});

// POST /listings — create listing (protected)
router.post("/", auth, (req, res) => {
  const { name, description, images, price, category } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: "name, price, and category are required" });
  }

  // Get SID from UID
  db.query("SELECT SID FROM Seller WHERE UID = ?", [req.user.uid], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(403).json({ error: "Seller record not found" });

    const sid = rows[0].SID;
    db.query(
      "INSERT INTO Item_Listing (SID, Name, Description, Images, Price, Category) VALUES (?, ?, ?, ?, ?, ?)",
      [sid, name, description || null, images || null, price, category],
      (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json({ lid: result.insertId });
      }
    );
  });
});

// PUT /listings/:id — edit listing (protected, owner only)
router.put("/:id", auth, (req, res) => {
  const { name, description, images, price, category, status } = req.body;

  db.query(
    `SELECT l.LID FROM Item_Listing l
     JOIN Seller s ON s.SID = l.SID
     WHERE l.LID = ? AND s.UID = ?`,
    [req.params.id, req.user.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(403).json({ error: "Not authorized" });

      db.query(
        `UPDATE Item_Listing SET
          Name = COALESCE(?, Name),
          Description = COALESCE(?, Description),
          Images = COALESCE(?, Images),
          Price = COALESCE(?, Price),
          Category = COALESCE(?, Category),
          Status = COALESCE(?, Status)
         WHERE LID = ?`,
        [name, description, images, price, category, status, req.params.id],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ success: true });
        }
      );
    }
  );
});

// DELETE /listings/:id — remove listing (protected, owner only)
router.delete("/:id", auth, (req, res) => {
  db.query(
    `SELECT l.LID FROM Item_Listing l
     JOIN Seller s ON s.SID = l.SID
     WHERE l.LID = ? AND s.UID = ?`,
    [req.params.id, req.user.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(403).json({ error: "Not authorized" });

      db.query(
        "UPDATE Item_Listing SET Status = 'removed' WHERE LID = ?",
        [req.params.id],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ success: true });
        }
      );
    }
  );
});

module.exports = router;
