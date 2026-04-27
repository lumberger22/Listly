const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection(
  process.env.MYSQL_URL || {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  }
);

db.connect((err) => {
  if (err) {
    console.error("DB connection failed:", err.message);
  } else {
    console.log("Connected to Listly MySQL database");
  }
});

module.exports = db;
