const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");

const authRoutes = require("./routes/auth");
const listingRoutes = require("./routes/listings");
const offerRoutes = require("./routes/offers");
const messageRoutes = require("./routes/messages");
const reviewRoutes = require("./routes/reviews");
const transactionRoutes = require("./routes/transactions");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/status", (req, res) => {
  db.query("SELECT 1", (err) => {
    if (err) return res.json({ status: "Disconnected", error: err.message });
    res.json({ status: "Connected to Listly DB" });
  });
});

app.use("/auth", authRoutes);
app.use("/listings", listingRoutes);
app.use("/offers", offerRoutes);
app.use("/", messageRoutes);   // /conversations and /messages
app.use("/reviews", reviewRoutes);
app.use("/transactions", transactionRoutes);

app.listen(3001, () => console.log("Listly backend running on port 3001"));
