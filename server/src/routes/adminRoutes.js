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
const upload                      = require('../middlewares/uploadMiddleware'); // Cấu hình Multer để xử lý upload ảnh bìa sách
// Tất cả admin routes yêu cầu đăng nhập
router.use(authenticate);

// ── Book Inventory management (admin & employee) ──────────────────────────────
// upload.single('cover') có nghĩa là API này sẽ đón 1 file ảnh có tên trường là 'cover'
router.get   ('/books/publishers',      authorize('admin', 'employee'),                         adminController.getPublishers);
router.get   ('/books',                 authorize('admin', 'employee'),                         adminController.getBooks);
router.post  ('/books',                 authorize('admin', 'employee'), upload.single('cover'), adminController.createBook);
router.put   ('/books/:id',             authorize('admin', 'employee'), upload.single('cover'), adminController.updateBook);
router.delete('/books/:id',             authorize('admin', 'employee'),                         adminController.deleteBook);
router.patch ('/books/:id/toggle-hide', authorize('admin', 'employee'),                         adminController.toggleHide);
router.post  ('/authors',               authorize('admin', 'employee'),                         adminController.createAuthor);
router.post  ('/publishers',            authorize('admin', 'employee'),                         adminController.createPublisher);
router.post  ('/categories',            authorize('admin', 'employee'),                         adminController.createCategory);
// ── Dashboard & Reports (admin + employee) ────────────────────────────────────
router.get('/stats',                authorize('admin', 'employee'), adminController.getStats);
router.get('/reports',              authorize('admin', 'employee'), adminController.getReports);
router.get('/reports/top-books',    authorize('admin', 'employee'), adminController.getTopBooks);
router.get('/reports/export',       authorize('admin', 'employee'), adminController.exportReport);
router.get('/reports/borrow-chart', authorize('admin', 'employee'), adminController.getBorrowChart);

// ── User management (admin only) ──────────────────────────────────────────────
router.get   ('/users',             authorize('admin', 'employee'), adminController.getUsers);
router.post  ('/users',             authorize('admin'),             adminController.createUser);
router.patch ('/users/:id/status',  authorize('admin'),             adminController.toggleUserStatus);
router.delete('/users/:id',         authorize('admin'),             adminController.deleteUser);
router.put   ('/users/:id/role',    authorize('admin'),             adminController.updateUserRole);

// ── Borrow management ─────────────────────────────────────────────────────────
router.get('/borrows',              authorize('admin', 'employee'), adminController.getAllBorrows);
router.get('/borrows/overdue',      authorize('admin', 'employee'), adminController.getOverdue);
router.put('/borrows/approve/:id',  authorize('admin', 'employee'), adminController.approveBorrow);
router.put('/borrows/reject/:id',   authorize('admin', 'employee'), adminController.rejectBorrow);

// ── Notifications (admin + employee) ─────────────────────────────────────────────
router.get   ('/notifications',                 authorize('admin', 'employee'), adminController.getNotifications);
router.patch ('/notifications/mark-all',        authorize('admin', 'employee'), adminController.markAllNotificationsRead);
router.post  ('/notifications/bulk',            authorize('admin', 'employee'), adminController.bulkActionNotifications);
router.patch ('/notifications/:id/read',        authorize('admin', 'employee'), adminController.markNotificationRead);
router.patch ('/notifications/:id/archive',     authorize('admin', 'employee'), adminController.archiveNotification);
router.patch ('/notifications/:id/restore',     authorize('admin', 'employee'), adminController.restoreNotification);
router.delete('/notifications/:id',             authorize('admin', 'employee'), adminController.deleteNotification);
router.post('/notifications',                   authorize('admin', 'employee'), adminController.createNotificationApi);
module.exports = router;
