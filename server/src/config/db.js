/**
 * db.js — Kết nối MySQL dùng chung cho cả nhóm
 * File: server/src/config/db.js
 *
 * Dùng mysql2/promise để hỗ trợ async/await
 * Dùng pool thay vì single connection — hiệu quả hơn khi nhiều request đồng thời
 */
'use strict';

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'e_library',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+07:00',
  charset:            'utf8mb4',

  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  }
})();

module.exports = pool;
