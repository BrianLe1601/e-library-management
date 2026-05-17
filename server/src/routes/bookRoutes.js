'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 2 — Book Management System              ║
 * ║  Routes: bookRoutes.js                              ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Mount tại: /api/books
 */

const express    = require('express');
const router     = express.Router();
const { body }   = require('express-validator');

const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { validate }                = require('../middlewares/validateMiddleware');
const bookController              = require('../controllers/bookController');

// ── Validation rules (Admin) ──────────────────────────────────────────────────
const bookRules = [
  body('title').trim().notEmpty().withMessage('Tên sách không được để trống'),
  body('author_id').isInt({ min: 1 }).withMessage('author_id không hợp lệ'),
  body('total_copies').optional().isInt({ min: 1 }).withMessage('Số lượng phải ≥ 1'),
  body('publish_year').optional().isInt({ min: 1000, max: new Date().getFullYear() }),
  body('cover_url').optional({ nullable: true }).isURL().withMessage('URL ảnh không hợp lệ'),
];

// ── Public routes ─────────────────────────────────────────────────────────────
// Lưu ý: các route tĩnh phải đặt TRƯỚC /:id
router.get('/featured',    bookController.getFeatured);
router.get('/top-rated',   bookController.getTopRated);   // [MỚI] Top 10 rating cao nhất
router.get('/newest',      bookController.getNewest);     // [MỚI] Top 10 mới thêm nhất
router.get('/categories',  bookController.getCategories);
router.get('/',            bookController.getBooks);
router.get('/:id',         bookController.getBookById);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.post  ('/',     authenticate, authorize('admin'), bookRules, validate, bookController.createBook);
router.put   ('/:id',  authenticate, authorize('admin'), bookRules, validate, bookController.updateBook);
router.delete('/:id',  authenticate, authorize('admin'), bookController.deleteBook);

module.exports = router;