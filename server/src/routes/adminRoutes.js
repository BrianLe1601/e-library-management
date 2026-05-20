'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 4 — Admin Dashboard & Reports           ║
 * ║  Routes: adminRoutes.js                             ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Mount tại: /api/admin
 *
 * Phân quyền:
 *   admin + employee  → stats, reports, borrows (đọc)
 *   admin only        → users CRUD, approve/reject borrows
 */

const express = require('express');
const router  = express.Router();

const { authenticate, authorize } = require('../middlewares/authMiddleware');
const adminController             = require('../controllers/adminController');

// MỞ KHÓA API STATS CHO TRANG CHỦ PUBLIC (Ai cũng xem được số lượng sách)
router.get('/stats', adminController.getStats);
// Tất cả admin routes yêu cầu đăng nhập
router.use(authenticate);

// ── Nhóm Route Dashboard & Báo cáo (Cả Admin và Nhân viên thủ thư đều được xem) ──
router.get('/reports',              authorize('admin', 'employee'), adminController.getReports);
router.get('/reports/top-books',    authorize('admin', 'employee'), adminController.getTopBooks);
router.get('/reports/export',       authorize('admin', 'employee'), adminController.exportReport);

// ── Nhóm Route Tra cứu Phiếu mượn tổng thể (Admin và Nhân viên thủ thư phối hợp quản lý) ──
router.get('/borrows',              authorize('admin', 'employee'), adminController.getAllBorrows);
router.get('/borrows/overdue',      authorize('admin', 'employee'), adminController.getOverdue);

// ── Nhóm Quyền lực cao: Quản lý Thành viên (Chỉ Admin tối cao mới được quyền can thiệp) ──
router.get   ('/users',             authorize('admin', 'employee'), adminController.getUsers); // Thủ thư được phép xem danh sách để tra cứu độc giả tại quầy
router.patch ('/users/:id/status',  authorize('admin'),             adminController.toggleUserStatus);
router.delete('/users/:id',         authorize('admin'),             adminController.deleteUser);

module.exports = router;