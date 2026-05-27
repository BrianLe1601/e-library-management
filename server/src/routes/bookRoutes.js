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

// Validation rules (Admin)
const bookRules = [
  body('title').trim().notEmpty().withMessage('Tên sách không được để trống'),
  body('author_id').isInt({ min: 1 }).withMessage('ID tác giả phải là số nguyên hợp lệ'),
  body('total_copies').optional().isInt({ min: 1 }).withMessage('Tổng số bản sao phải lớn hơn hoặc bằng 1'),
  body('publish_year').optional().isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('Năm xuất bản không hợp lệ'),
  body('cover_url').optional({ nullable: true }).isURL().withMessage('Địa chỉ URL ảnh bìa không hợp lệ'),
];
 
// Public routes — route tĩnh PHẢI đặt TRƯỚC /:id
router.get('/featured',    bookController.getFeatured);
router.get('/top-rated',   bookController.getTopRated);
router.get('/newest',      bookController.getNewest);
router.get('/categories',  bookController.getCategories);
router.get('/authors',     bookController.getAuthors);      // [MỚI] cho FilterSidebar
router.get('/publishers',  bookController.getPublishers);   // [MỚI] cho FilterSidebar
router.get('/stats',       bookController.dashboardStats);
router.get('/',            bookController.getBooks);
router.get('/:id(\\d+)',   bookController.getBookById);

module.exports = router;