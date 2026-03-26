const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /conversations — start a conversation (protected)
router.post("/conversations", auth, (req, res) => {
  const { uid2 } = req.body;
  if (!uid2) return res.status(400).json({ error: "uid2 is required" });

  const uid1 = req.user.uid;
  if (uid1 === uid2) return res.status(400).json({ error: "Cannot start conversation with yourself" });

  // Check if conversation already exists
  db.query(
    `SELECT CID FROM Conversation
     WHERE (UID_1 = ? AND UID_2 = ?) OR (UID_1 = ? AND UID_2 = ?)`,
    [uid1, uid2, uid2, uid1],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length) return res.json({ cid: rows[0].CID });

      db.query(
        "INSERT INTO Conversation (UID_1, UID_2) VALUES (?, ?)",
        [uid1, uid2],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.status(201).json({ cid: result.insertId });
        }
      );
    }
  );
});

// GET /conversations/:uid — all conversations for a user (protected)
router.get("/conversations/:uid", auth, (req, res) => {
  if (parseInt(req.params.uid) !== req.user.uid) {
    return res.status(403).json({ error: "Not authorized" });
  }

  db.query(
    `SELECT c.CID,
            u1.UID AS UID_1, u1.Username AS Username_1,
            u2.UID AS UID_2, u2.Username AS Username_2,
            (SELECT Content FROM Message WHERE CID = c.CID ORDER BY Time DESC LIMIT 1) AS LastMessage,
            (SELECT Time FROM Message WHERE CID = c.CID ORDER BY Time DESC LIMIT 1) AS LastTime
     FROM Conversation c
     JOIN User u1 ON u1.UID = c.UID_1
     JOIN User u2 ON u2.UID = c.UID_2
     WHERE c.UID_1 = ? OR c.UID_2 = ?
     ORDER BY LastTime DESC`,
    [req.user.uid, req.user.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// POST /messages — send a message (protected)
router.post("/messages", auth, (req, res) => {
  const { cid, uid_receiver, content } = req.body;
  if (!cid || !uid_receiver || !content) {
    return res.status(400).json({ error: "cid, uid_receiver, and content are required" });
  }

  // Verify sender is part of this conversation
  db.query(
    "SELECT CID FROM Conversation WHERE CID = ? AND (UID_1 = ? OR UID_2 = ?)",
    [cid, req.user.uid, req.user.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(403).json({ error: "Not part of this conversation" });

      db.query(
        "INSERT INTO Message (UID_Sender, UID_Receiver, CID, Content) VALUES (?, ?, ?, ?)",
        [req.user.uid, uid_receiver, cid, content],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.status(201).json({ mid: result.insertId });
        }
      );
    }
  );
});

// GET /messages/:cid — all messages in a conversation (protected)
router.get("/messages/:cid", auth, (req, res) => {
  // Verify user is part of this conversation
  db.query(
    "SELECT CID FROM Conversation WHERE CID = ? AND (UID_1 = ? OR UID_2 = ?)",
    [req.params.cid, req.user.uid, req.user.uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(403).json({ error: "Not authorized" });

      db.query(
        `SELECT m.*, u.Username AS SenderName
         FROM Message m
         JOIN User u ON u.UID = m.UID_Sender
         WHERE m.CID = ?
         ORDER BY m.Time ASC`,
        [req.params.cid],
        (err2, messages) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json(messages);
        }
      );
    }
  );
});

module.exports = router;
