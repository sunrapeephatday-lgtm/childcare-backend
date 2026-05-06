// backend/db.js
const mysql = require('mysql2/promise');

// ❗ ไม่ต้อง require dotenv ตรงนี้
// ให้โหลดที่ server.js ที่เดียวพอ

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

module.exports = pool;
