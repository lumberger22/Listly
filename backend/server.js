const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/status", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) return res.json({ status: "Disconnected", error: err.message });
    res.json({ status: "Connected to Listly DB" });
  });
});

app.listen(3001, () => console.log("Listly backend running on port 3001"));
