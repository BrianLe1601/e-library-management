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
      LEFT JOIN books b ON b.author_id = a.id AND b.is_hidden = 0
      GROUP BY a.id
      HAVING book_count > 0
      ORDER BY a.name`
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
      LEFT JOIN books b ON b.publisher_id = p.id AND b.is_hidden = 0
      GROUP BY p.id
      HAVING book_count > 0
      ORDER BY p.name`
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

// GET /api/books/suggest?q=...
exports.getSuggestions = async (req, res) => {
  try {
    const { q = '' } = req.query;
    if (q.trim().length < 2) return success(res, []);
    const results = await bookModel.searchSuggestions(q, 6);
    return success(res, results);
  } catch (err) {
    console.error('[getSuggestions]', err);
    return error(res, 'Lỗi gợi ý tìm kiếm');
  }
};

// ── SAVED BOOKS ────────────────────────────────────────────────────────────
 
// GET /api/books/saved/ids  — trả về mảng bookId đã lưu (để check trạng thái bookmark)
exports.getSavedIds = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      'SELECT book_id FROM saved_books WHERE user_id = ?',
      [userId]
    );
    return success(res, rows.map(r => r.book_id));
  } catch (err) {
    console.error('[getSavedIds]', err);
    return error(res, 'Lỗi khi lấy danh sách sách đã lưu', 500);
  }
};
 
// GET /api/books/saved  — trả về danh sách sách đầy đủ đã lưu
exports.getSaved = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT
         sb.id,
         sb.book_id         AS bookId,
         sb.saved_at        AS savedDate,
         bk.title,
         bk.cover_url       AS coverUrl,
         bk.available_copies AS availableCopies,
         bk.total_copies    AS totalCopies,
         a.name             AS author,
         c.name             AS category
       FROM saved_books sb
       JOIN books      bk ON bk.id = sb.book_id
       JOIN authors    a  ON a.id  = bk.author_id
       LEFT JOIN book_categories bc ON bc.book_id = bk.id
       LEFT JOIN categories      c  ON c.id = bc.category_id
       WHERE sb.user_id = ?
       ORDER BY sb.saved_at DESC`,
      [userId]
    );
    return success(res, rows);
  } catch (err) {
    console.error('[getSaved]', err);
    return error(res, 'Lỗi khi lấy danh sách sách đã lưu', 500);
  }
};
 
// POST /api/books/saved/:bookId  — lưu sách
exports.saveBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = Number(req.params.bookId);
    // Kiểm tra sách tồn tại
    const [[book]] = await db.query('SELECT id FROM books WHERE id = ? AND is_hidden = 0', [bookId]);
    if (!book) return error(res, 'Không tìm thấy sách', 404);
    // INSERT IGNORE để tránh lỗi duplicate
    await db.query(
      'INSERT IGNORE INTO saved_books (user_id, book_id) VALUES (?, ?)',
      [userId, bookId]
    );
    return success(res, { bookId }, 'Đã lưu sách thành công');
  } catch (err) {
    console.error('[saveBook]', err);
    return error(res, 'Lỗi khi lưu sách', 500);
  }
};
 
// DELETE /api/books/saved/:bookId  — bỏ lưu sách
exports.unsaveBook = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = Number(req.params.bookId);
    await db.query(
      'DELETE FROM saved_books WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );
    return success(res, { bookId }, 'Đã bỏ lưu sách');
  } catch (err) {
    console.error('[unsaveBook]', err);
    return error(res, 'Lỗi khi bỏ lưu sách', 500);
  }
};
