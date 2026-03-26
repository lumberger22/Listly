const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  const { username, password, email, address } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: "username, password, and email are required" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO User (Username, Password, Email, Address) VALUES (?, ?, ?, ?)",
      [username, hashed, email, address || null],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Username or email already taken" });
          }
          return res.status(500).json({ error: err.message });
        }

        const uid = result.insertId;

        // Create Buyer and Seller records for every user
        db.query("INSERT INTO Buyer (UID) VALUES (?)", [uid], (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          db.query("INSERT INTO Seller (UID) VALUES (?)", [uid], (err3) => {
            if (err3) return res.status(500).json({ error: err3.message });

            const token = jwt.sign({ uid }, process.env.JWT_SECRET, { expiresIn: "7d" });
            res.status(201).json({ token, uid, username, email });
          });
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  db.query(
    `SELECT u.*, b.BID, s.SID
     FROM User u
     LEFT JOIN Buyer b ON b.UID = u.UID
     LEFT JOIN Seller s ON s.UID = u.UID
     WHERE u.Username = ?`,
    [username],
    async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });

      const user = rows[0];
      const match = await bcrypt.compare(password, user.Password);
      if (!match) return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign({ uid: user.UID }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.json({
        token,
        uid: user.UID,
        bid: user.BID,
        sid: user.SID,
        username: user.Username,
        email: user.Email,
        address: user.Address,
      });
    }
  );
});

// DELETE /auth/account — delete the logged-in user's account (protected)
router.delete("/account", (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token provided" });

  let uid;
  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  db.beginTransaction((txErr) => {
    if (txErr) return res.status(500).json({ error: txErr.message });

    const rollback = (err) => {
      db.rollback(() => res.status(500).json({ error: err.message }));
    };

    // Step 1: get BID and SID for this user
    db.query(
      "SELECT b.BID, s.SID FROM User u LEFT JOIN Buyer b ON b.UID = u.UID LEFT JOIN Seller s ON s.UID = u.UID WHERE u.UID = ?",
      [uid],
      (err, rows) => {
        if (err) return rollback(err);
        if (!rows.length) return rollback(new Error("User not found"));

        const { BID: bid, SID: sid } = rows[0];

        // Step 2: delete messages
        db.query("DELETE FROM Message WHERE UID_Sender = ? OR UID_Receiver = ?", [uid, uid], (err) => {
          if (err) return rollback(err);

          // Step 3: delete conversations
          db.query("DELETE FROM Conversation WHERE UID_1 = ? OR UID_2 = ?", [uid, uid], (err) => {
            if (err) return rollback(err);

            // Step 4: delete reviews involving this user
            db.query("DELETE FROM Review WHERE BID = ? OR SID = ?", [bid, sid], (err) => {
              if (err) return rollback(err);

              // Step 5: delete offers involving this user
              db.query("DELETE FROM Offer WHERE BID = ? OR SID = ?", [bid, sid], (err) => {
                if (err) return rollback(err);

                // Step 6: get TIDs for transactions involving this user, then delete delivery + payment + transaction
                db.query(
                  "SELECT TID FROM Transaction WHERE BID = ? OR SID = ?",
                  [bid, sid],
                  (err, txRows) => {
                    if (err) return rollback(err);

                    const tids = txRows.map((r) => r.TID);

                    const deleteTransactions = () => {
                      db.query("DELETE FROM Transaction WHERE BID = ? OR SID = ?", [bid, sid], (err) => {
                        if (err) return rollback(err);

                        // Step 8: delete listings
                        db.query("DELETE FROM Item_Listing WHERE SID = ?", [sid], (err) => {
                          if (err) return rollback(err);

                          // Step 9: delete user (cascades Buyer + Seller)
                          db.query("DELETE FROM User WHERE UID = ?", [uid], (err) => {
                            if (err) return rollback(err);

                            db.commit((err) => {
                              if (err) return rollback(err);
                              res.json({ success: true });
                            });
                          });
                        });
                      });
                    };

                    if (!tids.length) {
                      deleteTransactions();
                    } else {
                      // Delete delivery methods and payments for those transactions
                      db.query("DELETE FROM Delivery_Method WHERE TID IN (?)", [tids], (err) => {
                        if (err) return rollback(err);
                        db.query("DELETE FROM Payment WHERE TID IN (?)", [tids], (err) => {
                          if (err) return rollback(err);
                          deleteTransactions();
                        });
                      });
                    }
                  }
                );
              });
            });
          });
        });
      }
    );
  });
});

module.exports = router;
