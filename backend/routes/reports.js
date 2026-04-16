const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /reports/sellers
// Aggregates per-seller: listing counts, revenue, avg rating, review count
router.get("/sellers", (req, res) => {
  db.query(
    `SELECT
       u.Username,
       u.Email,
       COUNT(DISTINCT l.LID)                                          AS total_listings,
       SUM(l.Status = 'active')                                       AS active_listings,
       SUM(l.Status = 'sold')                                         AS sold_listings,
       COUNT(DISTINCT t.TID)                                          AS total_transactions,
       COALESCE(SUM(CASE WHEN t.Status = 'completed' THEN t.Price END), 0) AS total_revenue,
       ROUND(AVG(r.Rating), 1)                                        AS avg_rating,
       COUNT(DISTINCT r.ReviewID)                                     AS review_count
     FROM User u
     JOIN Seller s ON s.UID = u.UID
     LEFT JOIN Item_Listing  l ON l.SID = s.SID
     LEFT JOIN Transaction   t ON t.SID = s.SID
     LEFT JOIN Review        r ON r.SID = s.SID
     GROUP BY u.UID, u.Username, u.Email
     HAVING total_listings > 0
     ORDER BY total_revenue DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// GET /reports/categories
// Aggregates per-category: listing counts, price stats, offer activity
router.get("/categories", (req, res) => {
  db.query(
    `SELECT
       l.Category,
       COUNT(l.LID)                                                   AS total_listings,
       SUM(l.Status = 'active')                                       AS active_listings,
       SUM(l.Status = 'sold')                                         AS sold_listings,
       ROUND(AVG(CASE WHEN l.Status = 'active' THEN l.Price END), 2) AS avg_price,
       MIN(CASE WHEN l.Status = 'active' THEN l.Price END)           AS min_price,
       MAX(CASE WHEN l.Status = 'active' THEN l.Price END)           AS max_price,
       COUNT(DISTINCT o.OID)                                          AS total_offers
     FROM Item_Listing l
     LEFT JOIN Offer o ON o.LID = l.LID
     GROUP BY l.Category
     ORDER BY active_listings DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

module.exports = router;
