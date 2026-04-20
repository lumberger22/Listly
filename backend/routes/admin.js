const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();
router.use(requireAdmin);

// POST /admin/users — create a new user account
router.post("/users", async (req, res) => {
  const { username, password, email, address, is_admin } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: "username, password, and email are required" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO User (Username, Password, Email, Address, is_admin) VALUES (?, ?, ?, ?, ?)",
      [username, hashed, email, address || null, is_admin ? 1 : 0],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Username or email already taken" });
          return res.status(500).json({ error: err.message });
        }
        const uid = result.insertId;
        db.query("INSERT INTO Buyer (UID) VALUES (?)", [uid], (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          db.query("INSERT INTO Seller (UID) VALUES (?)", [uid], (err3) => {
            if (err3) return res.status(500).json({ error: err3.message });
            res.status(201).json({ uid, username, email, address: address || null, is_admin: is_admin ? 1 : 0 });
          });
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/users — all users with buyer/seller IDs
router.get("/users", (req, res) => {
  db.query(
    `SELECT u.UID, u.Username, u.Email, u.Address, u.is_admin,
            b.BID, s.SID,
            COUNT(DISTINCT l.LID)  AS listing_count,
            COUNT(DISTINCT t.TID)  AS transaction_count
     FROM User u
     LEFT JOIN Buyer  b ON b.UID = u.UID
     LEFT JOIN Seller s ON s.UID = u.UID
     LEFT JOIN Item_Listing l ON l.SID = s.SID
     LEFT JOIN Transaction  t ON t.BID = b.BID OR t.SID = s.SID
     GROUP BY u.UID, u.Username, u.Email, u.Address, u.is_admin, b.BID, s.SID
     ORDER BY u.UID ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// DELETE /admin/users/:uid — force-delete any account
router.delete("/users/:uid", (req, res) => {
  const uid = req.params.uid;

  db.beginTransaction((txErr) => {
    if (txErr) return res.status(500).json({ error: txErr.message });
    const rollback = (err) => db.rollback(() => res.status(500).json({ error: err.message }));

    db.query(
      "SELECT b.BID, s.SID FROM User u LEFT JOIN Buyer b ON b.UID=u.UID LEFT JOIN Seller s ON s.UID=u.UID WHERE u.UID=?",
      [uid],
      (err, rows) => {
        if (err) return rollback(err);
        if (!rows.length) return res.status(404).json({ error: "User not found" });

        const { BID: bid, SID: sid } = rows[0];

        const steps = [
          ["DELETE FROM Message WHERE UID_Sender=? OR UID_Receiver=?", [uid, uid]],
          ["DELETE FROM Conversation WHERE UID_1=? OR UID_2=?", [uid, uid]],
          ["DELETE FROM Review WHERE BID=? OR SID=?", [bid, sid]],
          ["DELETE FROM Offer WHERE BID=? OR SID=?", [bid, sid]],
        ];

        function runSteps(i) {
          if (i === steps.length) return deleteTxs();
          db.query(steps[i][0], steps[i][1], (err) => {
            if (err) return rollback(err);
            runSteps(i + 1);
          });
        }

        function deleteTxs() {
          db.query("SELECT TID FROM Transaction WHERE BID=? OR SID=?", [bid, sid], (err, txRows) => {
            if (err) return rollback(err);
            const tids = txRows.map((r) => r.TID);

            const finish = () => {
              db.query("DELETE FROM Transaction WHERE BID=? OR SID=?", [bid, sid], (err) => {
                if (err) return rollback(err);
                db.query("DELETE FROM Item_Listing WHERE SID=?", [sid], (err) => {
                  if (err) return rollback(err);
                  db.query("DELETE FROM User WHERE UID=?", [uid], (err) => {
                    if (err) return rollback(err);
                    db.commit((err) => {
                      if (err) return rollback(err);
                      res.json({ success: true });
                    });
                  });
                });
              });
            };

            if (!tids.length) return finish();
            db.query("DELETE FROM Delivery_Method WHERE TID IN (?)", [tids], (err) => {
              if (err) return rollback(err);
              db.query("DELETE FROM Payment WHERE TID IN (?)", [tids], (err) => {
                if (err) return rollback(err);
                finish();
              });
            });
          });
        }

        runSteps(0);
      }
    );
  });
});

// PUT /admin/users/:uid/toggle-admin — promote or demote admin status
router.put("/users/:uid/toggle-admin", (req, res) => {
  db.query(
    "UPDATE User SET is_admin = NOT is_admin WHERE UID = ?",
    [req.params.uid],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// GET /admin/listings — all listings regardless of status
router.get("/listings", (req, res) => {
  db.query(
    `SELECT l.*, u.Username AS SellerName, u.UID AS SellerUID
     FROM Item_Listing l
     JOIN Seller s ON s.SID = l.SID
     JOIN User   u ON u.UID = s.UID
     ORDER BY l.LID DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// DELETE /admin/listings/:id — force-remove any listing
router.delete("/listings/:id", (req, res) => {
  db.query("UPDATE Item_Listing SET Status = 'removed' WHERE LID = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

module.exports = router;
