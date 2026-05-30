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

// ── SAVED BOOKS (SÁCH ĐÃ LƯU) ─────────────────────────────────────
exports.getSavedBooks = async (req, res) => {
  try {
    const userId = req.user.id;
    const books = await bookModel.getSavedBooksByUser(userId);
    return success(res, books, 'Lấy danh sách sách đã lưu thành công');
  } catch (err) {
    console.error('[getSavedBooks Error]:', err);
    return error(res, 'Lỗi hệ thống khi lấy sách đã lưu', 500);
  }
};

exports.saveBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.body;
    
    if (!bookId) return error(res, 'Vui lòng cung cấp bookId', 400);

    await bookModel.saveBook(userId, bookId);
    return success(res, null, 'Đã lưu sách thành công');
  } catch (err) {
    console.error('[saveBook Error]:', err);
    return error(res, 'Lỗi hệ thống khi lưu sách', 500);
  }
};

exports.unsaveBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;

    await bookModel.unsaveBook(userId, bookId);
    return success(res, null, 'Đã bỏ lưu sách thành công');
  } catch (err) {
    console.error('[unsaveBook Error]:', err);
    return error(res, 'Lỗi hệ thống khi bỏ lưu sách', 500);
  }
};