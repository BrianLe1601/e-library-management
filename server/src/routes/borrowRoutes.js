'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 3 — Borrow & Return System              ║
 * ║  Routes: borrowRoutes.js                            ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Mount tại: /api/borrows
 * (Admin borrow routes nằm trong adminRoutes.js)
 */

const express  = require('express');
const router   = express.Router();
const { body, param } = require('express-validator');

const { authenticate, authorize } = require('../middlewares/authMiddleware');
<<<<<<< HEAD
const { validate }                = require('../middlewares/validateMiddleware');
const borrowController            = require('../controllers/borrowController');
=======
const { validate }       = require('../middlewares/validateMiddleware');
const borrowController   = require('../controllers/borrowController');
>>>>>>> main

// Tất cả các route liên quan đến mượn trả bắt buộc phải đăng nhập
router.use(authenticate);

<<<<<<< HEAD
// ── Validate id trên URL dùng chung ──────────────────────────────────────────
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('id phải là số nguyên dương'),
  validate,
];
=======
// ── Định tuyến dành cho Độc giả (User) ───────────────────────────────────────
router.post('/',       body('book_id').isInt({ min: 1 }).withMessage('ID sách mượn không hợp lệ'), validate, borrowController.createBorrow);
router.get('/my-books', borrowController.getMyBooks);
router.get('/history',  borrowController.getHistory);
router.put('/extend/:id(\\d+)', borrowController.extendBorrow); // Độc giả tự gia hạn trong hạn mức cho phép

// ── Định tuyến nghiệp vụ của Thủ thư (Employee / Admin) ──────────────────────
// Bảo mật: Chuyển quyền trả sách về cho nhân viên quản lý, độc giả không được tự bấm trả
router.put('/return/:id(\\d+)', authorize('employee', 'admin'), borrowController.returnBook);
>>>>>>> main

// ── User / Employee / Admin ───────────────────────────────────────────────────

// POST /api/borrows — tạo phiếu mượn
router.post(
  '/',
  [
    body('book_id')
      .isInt({ min: 1 })
      .withMessage('book_id phải là số nguyên dương'),
    validate,
  ],
  borrowController.createBorrow
);

// GET /api/borrows/my-books — sách đang mượn của user hiện tại
// [LƯU Ý] Đặt TRƯỚC /:id để Express không nhầm 'my-books' là :id
router.get('/my-books', borrowController.getMyBooks);

// GET /api/borrows/history — lịch sử mượn trả
router.get('/history',  borrowController.getHistory);

// POST /api/borrows/extend/:id — gia hạn sách
// [SỬA] Đổi PUT → POST vì tạo mới bản ghi borrow_renewals
router.post(
  '/extend/:id',
  validateId,
  borrowController.extendBorrow
);

// ── Employee + Admin only ─────────────────────────────────────────────────────

// PUT /api/borrows/return/:id — xác nhận trả sách
// [SỬA] Thêm authorize — chỉ employee và admin mới xác nhận trả được
router.put(
  '/return/:id',
  authorize('employee', 'admin'),
  validateId,
  borrowController.returnBook
);

module.exports = router;