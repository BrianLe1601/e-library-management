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

// Tất cả admin routes yêu cầu đăng nhập
router.use(authenticate);

// ── Dashboard & Reports (admin + employee) ────────────────────────────────────
router.get('/stats',                authorize('admin', 'employee'), adminController.getStats);
router.get('/reports',              authorize('admin', 'employee'), adminController.getReports);
router.get('/reports/top-books',    authorize('admin', 'employee'), adminController.getTopBooks);
router.get('/reports/export',       authorize('admin', 'employee'), adminController.exportReport);

// ── User management (admin only) ──────────────────────────────────────────────
router.get   ('/users',             authorize('admin', 'employee'), adminController.getUsers);
router.patch ('/users/:id/status',  authorize('admin'),             adminController.toggleUserStatus);
router.delete('/users/:id',         authorize('admin'),             adminController.deleteUser);

// ── Borrow management ─────────────────────────────────────────────────────────
router.get('/borrows',              authorize('admin', 'employee'), adminController.getAllBorrows);
router.get('/borrows/overdue',      authorize('admin', 'employee'), adminController.getOverdue);
router.put('/borrows/approve/:id',  authorize('admin', 'employee'), adminController.approveBorrow);
router.put('/borrows/reject/:id',   authorize('admin', 'employee'), adminController.rejectBorrow);

module.exports = router;
