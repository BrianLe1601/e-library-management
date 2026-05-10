/**
 * db.js — Kết nối MySQL dùng chung cho cả nhóm
 * File: server/src/config/db.js
 *
 * Dùng mysql2/promise để hỗ trợ async/await
 * Dùng pool thay vì single connection — hiệu quả hơn khi nhiều request đồng thời
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

// Tạo connection pool
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "Admin@123",
  database: process.env.DB_NAME     || "e_library",

  // Pool settings
  waitForConnections: true,   // Chờ nếu hết connection thay vì báo lỗi
  connectionLimit:    10,     // Tối đa 10 kết nối song song
  queueLimit:         0,      // Không giới hạn hàng chờ
  timezone:           "+07:00", // Múi giờ Việt Nam

  // Tự động chuyển đổi kiểu dữ liệu
  typeCast: true,
});

// Kiểm tra kết nối ngay khi server khởi động
pool.getConnection()
  .then((connection) => {
    console.log("✅ MySQL connected — database:", process.env.DB_NAME);
    connection.release(); // Trả connection về pool ngay sau khi test
  })
  .catch((err) => {
    console.error("❌ MySQL connection failed:", err.message);
    console.error("   Kiểm tra lại DB_HOST, DB_USER, DB_PASSWORD, DB_NAME trong file .env");
    process.exit(1); // Dừng server nếu không kết nối được DB
  });

module.exports = pool;