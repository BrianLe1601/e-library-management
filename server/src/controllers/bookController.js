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

const db = require('../config/db'); // Import pool gốc để tạo kết nối transaction
const bookModel = require('../models/bookModel');
const { success, error, paginated } = require('../utils/response');

// ── GET /api/books ────────────────────────────────────────────────────────────
exports.getBooks = async (req, res) => {
  try {
    const { 
      search = '', 
      category = '', 
      author = '', 
      publisher = '', 
      sort = 'latest',
      page = 1, 
      limit = 12 
    } = req.query;
    const { rows, total } = await bookModel.findAll({ search, category, page, limit });
    return paginated(res, rows, total, Number(page), Number(limit));
  } catch (err) {
    console.error('[getBooks]', err);
    return error(res, 'Lỗi khi lấy danh sách sách', 500);
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
    return error(res, 'Lỗi khi lấy danh sách sách nổi bật', 500);
  }
};

// ── GET /api/books/categories ─────────────────────────────────────────────────
exports.getCategories = async (_req, res) => {
  try {
    const categories = await bookModel.findAllCategories();
    return success(res, categories);
  } catch (err) {
    console.error('[getCategories]', err);
    return error(res, 'Lỗi khi lấy danh sách thể loại', 500);
  }
};

// ── GET /api/books/:id ────────────────────────────────────────────────────────
exports.getBookById = async (req, res) => {
  try {
    const book = await bookModel.findById(req.params.id);
    if (!book) return error(res, 'Không tìm thấy cuốn sách này trên hệ thống', 404);
    return success(res, book);
  } catch (err) {
    console.error('[getBookById]', err);
    return error(res, 'Lỗi hệ thống khi tìm chi tiết sách', 500);
  }
};

// ── POST /api/books (admin) ───────────────────────────────────────────────────
exports.createBook = async (req, res) => {
  const connection = await db.getConnection(); // Khởi tạo kết nối đơn từ Pool
  try {
    await connection.beginTransaction(); // BẮT ĐẦU TRANSACTION

    const { category_ids, ...fields } = req.body;
    
    // Ghi vào bảng books trong môi trường transaction cách ly
    const id = await bookModel.createInTransaction(connection, fields);
    
    // Nếu có mảng thể loại, ghi tiếp vào bảng liên kết trung gian
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      await bookModel.setCategoriesInTransaction(connection, id, category_ids);
    }

    await connection.commit(); // Hoàn thành toàn vẹn - Lưu dữ liệu vĩnh viễn vào DB
    
    const book = await bookModel.findById(id);
    return success(res, book, 'Tạo thông tin sách mới thành công', 201);
  } catch (err) {
    await connection.rollback(); // Có bất kỳ lỗi gì xảy ra -> ROLLBACK lại toàn bộ
    console.error('[createBook Transaction Error]', err);
    return error(res, err.message || 'Lỗi hệ thống, không thể thêm sách mới', 500);
  } finally {
    connection.release(); // Giải phóng kết nối trả lại cho Pool
  }
};

// ── PUT /api/books/:id (admin) ────────────────────────────────────────────────
exports.updateBook = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { category_ids, ...fields } = req.body;
    const bookId = req.params.id;

    const updated = await bookModel.updateInTransaction(connection, bookId, fields);
    if (!updated) {
      await connection.rollback();
      return error(res, 'Không tìm thấy sách để cập nhật hồ sơ', 404);
    }

    if (category_ids !== undefined) {
      await bookModel.setCategoriesInTransaction(connection, bookId, category_ids);
    }

    await connection.commit();
    
    const book = await bookModel.findById(bookId);
    return success(res, book, 'Cập nhật thông tin sách thành công');
  } catch (err) {
    await connection.rollback();
    console.error('[updateBook Transaction Error]', err);
    return error(res, err.message || 'Lỗi hệ thống khi cập nhật sách', 500);
  } finally {
    connection.release();
  }
};

// ── DELETE /api/books/:id (admin) ─────────────────────────────────────────────
exports.deleteBook = async (req, res) => {
  try {
    const deleted = await bookModel.remove(req.params.id);
    if (!deleted) return error(res, 'Không tìm thấy cuốn sách yêu cầu xóa', 404);
    return success(res, null, 'Xóa sách ra khỏi kho thành công');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return error(res, 'Hành động bị từ chối: Cuốn sách này hiện đang có độc giả mượn hoặc nằm trong lịch sử phiếu mượn', 409);
    }
    console.error('[deleteBook]', err);
    return error(res, 'Lỗi hệ thống khi thực hiện xóa sách', 500);
  }
};
