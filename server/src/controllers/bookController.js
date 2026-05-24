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
 *   GET    /api/books/top-rated    ← [MỚI]
 *   GET    /api/books/newest       ← [MỚI]
 *   GET    /api/books/categories
 *   GET    /api/books/:id
 *   POST   /api/books          (admin)
 *   PUT    /api/books/:id      (admin)
 *   DELETE /api/books/:id      (admin)
 */

const db          = require('../config/db');
const bookModel   = require('../models/bookModel');
const { success, error, paginated } = require('../utils/response');
 
// GET /api/books
exports.getBooks = async (req, res) => {
  try {
    const { search = '', category = '', author = '', publisher = '', availability = 'all', sort = 'latest', page = 1, limit = 9 } = req.query;
    
    const { rows, total } = await bookModel.findAll({ 
      search, category, author, publisher, availability, sort, 
      page: Number(page), limit: Number(limit) 
    });
    
    return paginated(res, rows, total, Number(page), Number(limit));
  } catch (err) {
    console.error('[getBooks error]', err);
    return error(res, 'Lỗi khi lấy danh sách sách');
  }
};

// GET /api/books/:id
exports.getBookById = async (req, res) => {
  try {
    const bookId = req.params.id;
    const book = await bookModel.findById(bookId);
    
    if (!book) return res.status(404).json({ success: false, message: 'Không tìm thấy cuốn sách yêu cầu' });

    // Thêm trường tags cho giao diện hiển thị
    book.tags = [book.category, book.publisher].filter(Boolean);

    // 1. Lấy danh sách đánh giá của cuốn sách này
    const [reviews] = await db.query(`
      SELECT 
        r.id, r.rating, r.comment, r.created_at AS date,
        u.full_name AS userName
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.book_id = ? AND r.is_visible = 1
      ORDER BY r.created_at DESC
    `, [bookId]);

    // Định dạng lại cấu trúc Initials chữ cái đầu tên cho avatar
    const formattedReviews = reviews.map(rev => ({
      ...rev,
      userInitials: rev.userName ? rev.userName.split(' ').pop().charAt(0).toUpperCase() : 'U'
    }));

    // 2. Lấy danh sách 4 cuốn sách liên quan cùng thể loại
    const [relatedBooks] = await db.query(`
      SELECT 
        b.id, b.title, b.cover_url AS coverUrl, a.name AS author
      FROM books b
      JOIN authors a ON a.id = b.author_id
      JOIN book_categories bc ON b.id = bc.book_id
      WHERE bc.category_id IN (
        SELECT category_id FROM book_categories WHERE book_id = ?
      ) AND b.id != ?
      LIMIT 4
    `, [bookId, bookId]);

    // CHỖ ĐÃ SỬA LỖI: Chỉ gọi đúng biến formattedReviews
    return res.status(200).json({
      success: true,
      data: {
        book,
        reviews: formattedReviews, 
        relatedBooks
      }
    });
  } catch (err) {
    console.error('[getBookById error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi tải chi tiết sách' });
  }
};
 
// GET /api/books/featured
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
 
// GET /api/books/top-rated
exports.getTopRated = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const books = await bookModel.findTopRated(limit);
    return success(res, books);
  } catch (err) {
    console.error('[getTopRated]', err);
    return error(res);
  }
};
 
// GET /api/books/newest
exports.getNewest = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const books = await bookModel.findNewest(limit);
    return success(res, books);
  } catch (err) {
    console.error('[getNewest]', err);
    return error(res);
  }
};
 
// GET /api/books/categories
exports.getCategories = async (_req, res) => {
  try {
    const categories = await bookModel.findAllCategories();
    return success(res, categories);
  } catch (err) {
    console.error('[getCategories]', err);
    return error(res, 'Lỗi khi lấy danh sách thể loại', 500);
  }
};
 
// GET /api/books/authors — Dùng cho FilterSidebar
exports.getAuthors = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.name, COUNT(b.id) AS book_count
       FROM authors a
       LEFT JOIN books b ON b.author_id = a.id
       GROUP BY a.id ORDER BY a.name`
    );
    return success(res, rows);
  } catch (err) {
    console.error('[getAuthors]', err);
    return error(res, 'Lỗi khi lấy danh sách tác giả', 500);
  }
};
 
// GET /api/books/publishers — Dùng cho FilterSidebar
exports.getPublishers = async (_req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.name, COUNT(b.id) AS book_count
       FROM publishers p
       LEFT JOIN books b ON b.publisher_id = p.id
       GROUP BY p.id ORDER BY p.name`
    );
    return success(res, rows);
  } catch (err) {
    console.error('[getPublishers]', err);
    return error(res, 'Lỗi khi lấy danh sách nhà xuất bản', 500);
  }
};
 
 
// POST /api/books (admin)
exports.createBook = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { category_ids, ...fields } = req.body;
    const id = await bookModel.createInTransaction(connection, fields);
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      await bookModel.setCategoriesInTransaction(connection, id, category_ids);
    }
    await connection.commit();
    const book = await bookModel.findById(id);
    return success(res, book, 'Tạo thông tin sách mới thành công', 201);
  } catch (err) {
    await connection.rollback();
    console.error('[createBook]', err);
    return error(res, err.message || 'Lỗi hệ thống, không thể thêm sách mới', 500);
  } finally {
    connection.release();
  }
};
 
// PUT /api/books/:id (admin)
exports.updateBook = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { category_ids, ...fields } = req.body;
    const bookId = req.params.id;
    const updated = await bookModel.updateInTransaction(connection, bookId, fields);
    if (!updated) { await connection.rollback(); return error(res, 'Không tìm thấy sách để cập nhật', 404); }
    if (category_ids !== undefined) await bookModel.setCategoriesInTransaction(connection, bookId, category_ids);
    await connection.commit();
    const book = await bookModel.findById(bookId);
    return success(res, book, 'Cập nhật thông tin sách thành công');
  } catch (err) {
    await connection.rollback();
    console.error('[updateBook]', err);
    return error(res, err.message || 'Lỗi hệ thống khi cập nhật sách', 500);
  } finally {
    connection.release();
  }
};
 
// DELETE /api/books/:id (admin)
exports.deleteBook = async (req, res) => {
  try {
    const deleted = await bookModel.remove(req.params.id);
    if (!deleted) return error(res, 'Không tìm thấy cuốn sách yêu cầu xóa', 404);
    return success(res, null, 'Xóa sách ra khỏi kho thành công');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return error(res, 'Sách này đang được mượn hoặc có lịch sử mượn, không thể xóa', 409);
    }
    console.error('[deleteBook]', err);
    return error(res, 'Lỗi hệ thống khi thực hiện xóa sách', 500);
  }
};


exports.dashboardStats = async (req, res) => {
  try {
    const stats = await bookModel.getDashboardStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};