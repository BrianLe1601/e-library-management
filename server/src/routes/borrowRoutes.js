'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 3 — Borrow & Return System              ║
 * ║  Routes: borrowRoutes.js                            ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Mount tại: /api/borrow
 * (Admin borrow routes nằm trong adminRoutes.js)
 */

const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');

const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate }       = require('../middlewares/validateMiddleware');
const borrowController   = require('../controllers/borrowController');

// Tất cả các route liên quan đến mượn trả bắt buộc phải đăng nhập
router.use(authenticate);

// ── Định tuyến dành cho Độc giả (User) ───────────────────────────────────────
router.post('/',       body('book_id').isInt({ min: 1 }).withMessage('ID sách mượn không hợp lệ'), validate, borrowController.createBorrow);
router.get('/my-books', borrowController.getMyBooks);
router.get('/history',  borrowController.getHistory);
router.put('/extend/:id(\\d+)', borrowController.extendBorrow); // Độc giả tự gia hạn trong hạn mức cho phép

// ── Định tuyến nghiệp vụ của Thủ thư (Employee / Admin) ──────────────────────
// Bảo mật: Chuyển quyền trả sách về cho nhân viên quản lý, độc giả không được tự bấm trả
router.put('/return/:id(\\d+)', authorize('employee', 'admin'), borrowController.returnBook);

module.exports = router;
