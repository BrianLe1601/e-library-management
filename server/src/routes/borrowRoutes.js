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

const { authenticate }   = require('../middlewares/authMiddleware');
const { validate }       = require('../middlewares/validateMiddleware');
const borrowController   = require('../controllers/borrowController');

// Tất cả borrow routes yêu cầu đăng nhập
router.use(authenticate);

router.post  ('/',            body('book_id').isInt({ min: 1 }).withMessage('book_id không hợp lệ'), validate, borrowController.createBorrow);
router.put   ('/return/:id',  borrowController.returnBook);
router.put   ('/extend/:id',  borrowController.extendBorrow);
router.get   ('/my-books',    borrowController.getMyBooks);
router.get   ('/history',     borrowController.getHistory);

module.exports = router;
