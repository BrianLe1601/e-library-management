'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 2 — Book Management System              ║
 * ║  Controller: bookController.js                      ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Endpoints:
 *   GET    /api/books
 *   GET    /api/books/featured
 *   GET    /api/books/categories
 *   GET    /api/books/:id
 *   POST   /api/books          (admin)
 *   PUT    /api/books/:id      (admin)
 *   DELETE /api/books/:id      (admin)
 */

const bookModel = require('../models/bookModel');
const { success, error, paginated } = require('../utils/response');

// ── GET /api/books ────────────────────────────────────────────────────────────
exports.getBooks = async (req, res) => {
  try {
    const { search = '', category = '', page = 1, limit = 12 } = req.query;
    const { rows, total } = await bookModel.findAll({ search, category, page, limit });
    return paginated(res, rows, total, page, limit);
  } catch (err) {
    console.error('[getBooks]', err);
    return error(res);
  }
};

// ── GET /api/books/featured ───────────────────────────────────────────────────
exports.getFeatured = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    const books = await bookModel.findFeatured(limit);
    return success(res, books);
  } catch (err) {
    console.error('[getFeatured]', err);
    return error(res);
  }
};

// ── GET /api/books/categories ─────────────────────────────────────────────────
exports.getCategories = async (_req, res) => {
  try {
    const categories = await bookModel.findAllCategories();
    return success(res, categories);
  } catch (err) {
    console.error('[getCategories]', err);
    return error(res);
  }
};

// ── GET /api/books/:id ────────────────────────────────────────────────────────
exports.getBookById = async (req, res) => {
  try {
    const book = await bookModel.findById(req.params.id);
    if (!book) return error(res, 'Không tìm thấy sách', 404);
    return success(res, book);
  } catch (err) {
    console.error('[getBookById]', err);
    return error(res);
  }
};

// ── POST /api/books (admin) ───────────────────────────────────────────────────
exports.createBook = async (req, res) => {
  try {
    const { category_ids, ...fields } = req.body;
    const id = await bookModel.create(fields);
    if (category_ids?.length) await bookModel.setCategories(id, category_ids);
    const book = await bookModel.findById(id);
    return success(res, book, 'Tạo sách thành công', 201);
  } catch (err) {
    console.error('[createBook]', err);
    return error(res);
  }
};

// ── PUT /api/books/:id (admin) ────────────────────────────────────────────────
exports.updateBook = async (req, res) => {
  try {
    const { category_ids, ...fields } = req.body;
    const updated = await bookModel.update(req.params.id, fields);
    if (!updated) return error(res, 'Không tìm thấy sách', 404);
    if (category_ids !== undefined) await bookModel.setCategories(req.params.id, category_ids);
    const book = await bookModel.findById(req.params.id);
    return success(res, book, 'Cập nhật sách thành công');
  } catch (err) {
    console.error('[updateBook]', err);
    return error(res);
  }
};

// ── DELETE /api/books/:id (admin) ─────────────────────────────────────────────
exports.deleteBook = async (req, res) => {
  try {
    const deleted = await bookModel.remove(req.params.id);
    if (!deleted) return error(res, 'Không tìm thấy sách', 404);
    return success(res, null, 'Xóa sách thành công');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return error(res, 'Không thể xóa: sách đang có lượt mượn', 409);
    console.error('[deleteBook]', err);
    return error(res);
  }
};
