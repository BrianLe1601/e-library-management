const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Kết nối Database ─────────────────────────────────────────
// Dùng mysql2/promise (hỗ trợ async/await) thay vì mysql2 callback
// db.js đọc config từ .env, log kết quả ra console khi khởi động
require('./config/db');

// ── Routes ───────────────────────────────────────────────────

// [TV1] Auth & User — thêm sau khi TV1 hoàn thành
// const authRoutes  = require('./routes/authRoutes');
// const userRoutes  = require('./routes/userRoutes');
// app.use('/api/auth',  authRoutes);
// app.use('/api/users', userRoutes);

// [TV2] Books — thêm sau khi TV2 hoàn thành
// const bookRoutes = require('./routes/bookRoutes');
// app.use('/api/books', bookRoutes);

// [TV3] Borrow & Return — thêm sau khi TV3 hoàn thành
// const borrowRoutes = require('./routes/borrowRoutes');
// app.use('/api/borrow', borrowRoutes);

// [TV4] Admin Dashboard & Reports — đã hoàn thành
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'E-Library Backend is Running...' });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} không tồn tại` });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Lỗi server không xác định',
  });
});

// ── Khởi động server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});