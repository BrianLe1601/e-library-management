/**
 * adminRoutes.js — Định nghĩa tất cả routes cho Admin
 * File: server/src/routes/adminRoutes.js
 *
 * TẤT CẢ route ở đây đều yêu cầu:
 *  1. verifyToken  — đã đăng nhập (TV1 viết)
 *  2. isAdmin      — phải có role = 'admin' (TV4 viết)
 */

const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

// ── Import middleware từ TV1 (sau khi TV1 tạo xong) ──────────
// const { verifyToken } = require("../middlewares/authMiddleware");

// ── isAdmin middleware — TV4 tự viết ────────────────────────
const isAdmin = (req, res, next) => {
  // req.user được gắn vào bởi verifyToken của TV1
  if (!req.user) {
    return res.status(401).json({ message: "Chưa đăng nhập" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Không có quyền truy cập" });
  }
  next();
};

// Tạm thời comment verifyToken cho đến khi TV1 xong
// Sau này uncomment: router.use(verifyToken, isAdmin);
//router.use(isAdmin); // <-- Thay bằng dòng trên khi TV1 xong

// ─────────────────────────────────────────────────────────────
//  STATS
// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats
router.get("/stats", adminController.getStats);

// ─────────────────────────────────────────────────────────────
//  REPORTS & CHARTS
// ─────────────────────────────────────────────────────────────
// GET /api/admin/reports?from=&to=&type=
router.get("/reports", adminController.getReports);

// GET /api/admin/reports/top-books?limit=10
router.get("/reports/top-books", adminController.getTopBooks);

// GET /api/admin/reports/borrow-chart?year=2025
router.get("/reports/borrow-chart", adminController.getBorrowChartData);

// GET /api/admin/reports/category-chart
router.get("/reports/category-chart", adminController.getCategoryChartData);

// GET /api/admin/reports/export?format=pdf&from=&to=
router.get("/reports/export", adminController.exportReport);

// ─────────────────────────────────────────────────────────────
//  USER MANAGEMENT
// ─────────────────────────────────────────────────────────────
// GET    /api/admin/users
router.get("/users", adminController.getUsers);

// PATCH  /api/admin/users/:id/status
router.patch("/users/:id/status", adminController.toggleUserStatus);

// DELETE /api/admin/users/:id
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;