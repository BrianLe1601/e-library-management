'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 2 — Book Management System              ║
 * ║  Model: bookModel.js                                ║
 * ╚══════════════════════════════════════════════════════╝
 */

const db = require('../config/db');

// ── Danh sách sách (search, category, pagination) ─────────────────────────────
const findAll = async ({ search = '', category = '', author = '', publisher = '', availability = 'all', sort = 'latest', page = 1, limit = 12, includeHidden = false }) => {
  const conditions = [];
  const params = [];

  // 1. Tìm kiếm từ khóa (Tiêu đề hoặc Tác giả hoac Nhà xuất bản)
  if (search) {
    conditions.push('(b.title LIKE ? OR a.name LIKE ? OR p.name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  // 2. Lọc theo danh mục (Có thể là chuỗi "1,2,3" hoặc ID đơn lẻ)
  if (category) {
    const catIds = String(category).split(',').map(Number).filter(Boolean);
    if (catIds.length > 0) {
      conditions.push(`b.id IN (SELECT book_id FROM book_categories WHERE category_id IN (${catIds.map(() => '?').join(',')}))`);
      params.push(...catIds);
    }
  }

  // 3. Lọc theo nhiều tác giả (Chuỗi ngăn cách bởi dấu phẩy từ FilterSidebar)
  if (author) {
    const authorIds = String(author).split(',').map(Number).filter(Boolean);
    if (authorIds.length > 0) {
      conditions.push(`b.author_id IN (${authorIds.map(() => '?').join(',')})`);
      params.push(...authorIds);
    }
  }

  // 4. Lọc theo nhiều nhà xuất bản
  if (publisher) {
    const pubIds = String(publisher).split(',').map(Number).filter(Boolean);
    if (pubIds.length > 0) {
      conditions.push(`b.publisher_id IN (${pubIds.map(() => '?').join(',')})`);
      params.push(...pubIds);
    }
  }

  // 5. Lọc theo tình trạng sách
  if (availability === 'in-stock') {
    conditions.push('b.available_copies > 0');
  } else if (availability === 'out-of-stock') {
    conditions.push('b.available_copies = 0');
  }

  if (!includeHidden) {
    conditions.push('b.is_hidden = 0');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Tính toán phân trang
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

  // Lấy tổng số dòng để phân trang
  const countSql = `
    SELECT COUNT(DISTINCT b.id) AS total
    FROM books b
    JOIN authors a ON a.id = b.author_id
    ${where}
  `;
  const [[{ total }]] = await db.query(countSql, params);

  // Xử lý sắp xếp (Khớp với value của sortOptions trong BooksPage.jsx)
  let orderBy = 'ORDER BY b.id DESC'; // mặc định là latest
  if (sort === 'rating-desc') orderBy = 'ORDER BY rating DESC';
  if (sort === 'rating-asc') orderBy = 'ORDER BY rating ASC';
  if (sort === 'title-asc') orderBy = 'ORDER BY b.title ASC';
  if (sort === 'title-desc') orderBy = 'ORDER BY b.title DESC';
  if (sort === 'available') orderBy = 'ORDER BY b.available_copies DESC';

  // Câu lệnh SQL chính thức - Ép ALIAS thành CamelCase cho React đọc trực tiếp
  const mainSql = `
    SELECT 
      b.id, b.title, b.isbn, b.publish_year AS year, b.description,
      b.cover_url AS coverUrl, b.total_copies AS totalCopies, 
      b.available_copies AS availableCopies,
      b.author_id,
      b.publisher_id,
      b.is_hidden,
      (SELECT bc.category_id FROM book_categories bc WHERE bc.book_id = b.id LIMIT 1) AS category_id, -- Bổ sung ID thể loại
      a.name AS author, p.name AS publisher,
      (SELECT c.name FROM categories c JOIN book_categories bc ON bc.category_id = c.id WHERE bc.book_id = b.id LIMIT 1) AS category,
      COALESCE((SELECT AVG(rating) FROM reviews WHERE book_id = b.id), 0) AS rating,
      (SELECT COUNT(*) FROM reviews WHERE book_id = b.id) AS reviewCount
    FROM books b
    JOIN authors a ON a.id = b.author_id
    LEFT JOIN publishers p ON p.id = b.publisher_id
    ${where}
    GROUP BY b.id
    ${orderBy}
    LIMIT ? OFFSET ?
  `;

  // Đẩy tham số limit và offset vào mảng dữ liệu an toàn
  const [rows] = await db.query(mainSql, [...params, Number(limit), offset]);

  // Giả lập mảng trường tags mà Frontend yêu cầu bóc tách
  const formattedRows = rows.map(row => ({
    ...row,
    tags: [row.author, row.publisher].filter(Boolean)
  }));

  return { rows: formattedRows, total: Number(total) };
};

// ── Tìm kiếm chi tiết một cuốn sách ──
const findById = async (id) => {
  const sql = `
    SELECT 
      b.id, b.title, b.isbn, b.publish_year AS year, b.description,
      b.cover_url AS coverUrl, b.total_copies AS totalCopies, 
      b.available_copies AS availableCopies,
      a.name AS author, p.name AS publisher,
      (SELECT c.name FROM categories c 
       JOIN book_categories bc ON bc.category_id = c.id 
       WHERE bc.book_id = b.id LIMIT 1) AS category,
      COALESCE((SELECT AVG(rating) FROM reviews WHERE book_id = b.id), 0) AS rating
    FROM books b
    JOIN authors a ON a.id = b.author_id
    LEFT JOIN publishers p ON p.id = b.publisher_id
    WHERE b.id = ?
  `;
  const [rows] = await db.query(sql, [id]);
  return rows[0] || null;
};

// ── Sách nổi bật (được mượn nhiều nhất, còn sách) ────────────────────────────
const findFeatured = async (limit = 10) => {
  const [rows] = await db.query(
    `SELECT 
       b.id, b.title,
       b.cover_url        AS coverUrl,
       b.available_copies AS availableCopies,
       a.name             AS author,
       COUNT(br.id)       AS borrow_count,
       COALESCE(AVG(r.rating), 0) AS rating
     FROM books b
     JOIN authors a ON a.id = b.author_id
     LEFT JOIN borrows br ON br.book_id = b.id
     LEFT JOIN reviews r  ON r.book_id  = b.id AND r.is_visible = 1
     WHERE b.available_copies > 0 AND b.is_hidden = 0
     GROUP BY b.id
     ORDER BY borrow_count DESC, rating DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
};
// ── THÊM findTopRated ─────────────────────────────────────────────────────────
const findTopRated = async (limit = 10) => {
  const [rows] = await db.query(
    `SELECT
       b.id, b.title,
       b.cover_url        AS coverUrl,
       b.available_copies AS availableCopies,
       a.name             AS author,
       COALESCE(AVG(r.rating), 0)      AS rating,
       COUNT(DISTINCT r.id)            AS reviewCount
     FROM books b
     JOIN authors a ON a.id = b.author_id
     LEFT JOIN reviews r ON r.book_id = b.id AND r.is_visible = 1
     WHERE b.is_hidden = 0
     GROUP BY b.id
     HAVING rating > 0
     ORDER BY rating DESC, reviewCount DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
};

// ── THÊM findNewest ───────────────────────────────────────────────────────────
const findNewest = async (limit = 10) => {
  const [rows] = await db.query(
    `SELECT
       b.id, b.title,
       b.cover_url        AS coverUrl,
       b.available_copies AS availableCopies,
       a.name             AS author,
       COALESCE(AVG(r.rating), 0) AS rating,
       b.created_at
     FROM books b
     JOIN authors a ON a.id = b.author_id
     LEFT JOIN reviews r ON r.book_id = b.id AND r.is_visible = 1
     WHERE b.is_hidden = 0
     GROUP BY b.id
     ORDER BY b.created_at DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
};

// ── Danh mục ─────────────────────────────────────────────────────────────────
const findAllCategories = async () => {
  const [rows] = await db.query(
    `SELECT 
    c.id, 
    c.name, 
    c.description, 
    COUNT(bc.book_id) AS book_count
    FROM categories c
    LEFT JOIN book_categories bc 
       ON bc.category_id = c.id
    GROUP BY c.id, c.name, c.description
    ORDER BY book_count DESC`
  );
  return rows;
};

// 1. Lấy danh sách sách đã lưu của User
const getSavedBooksByUser = async (userId) => {
    const query = `
      SELECT 
          sb.book_id, 
          sb.saved_at,
          b.title, 
          b.cover_url, 
          b.available_copies,
          a.name AS author,
          -- Gom các tên thể loại lại thành 1 chuỗi, cách nhau bằng dấu phẩy
          GROUP_CONCAT(c.name SEPARATOR ', ') AS category
      FROM saved_books sb
      JOIN books b ON sb.book_id = b.id
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN book_categories bc ON b.id = bc.book_id
      LEFT JOIN categories c ON bc.category_id = c.id
      WHERE sb.user_id = ?
      -- BẮT BUỘC có GROUP BY để nhóm các kết quả trùng lặp lại thành 1 dòng
      GROUP BY 
          sb.book_id, 
          sb.saved_at, 
          b.title, 
          b.cover_url, 
          b.available_copies, 
          a.name
      ORDER BY sb.saved_at DESC
    `;
    const [rows] = await db.query(query, [userId]);
    return rows;
};

// 2. Thêm sách vào danh sách lưu (Dùng INSERT IGNORE để tránh lỗi trùng lặp nếu user click đúp)
const saveBook = async (userId, bookId) => {
  const query = 'INSERT IGNORE INTO saved_books (user_id, book_id) VALUES (?, ?)';
  const [result] = await db.query(query, [userId, bookId]);
  return result;
};

// 3. Xóa sách khỏi danh sách lưu
const unsaveBook = async (userId, bookId) => {
  const query = 'DELETE FROM saved_books WHERE user_id = ? AND book_id = ?';
  const [result] = await db.query(query, [userId, bookId]);
  return result;
};

// ── CRUD (Admin) ──────────────────────────────────────────────────────────────
const create = async (fields) => {
  const { title, author_id, publisher_id, isbn, publish_year, description, cover_url, total_copies } = fields;
  const copies = total_copies || 1;
  const [result] = await db.query(
    `INSERT INTO books (title, author_id, publisher_id, isbn, publish_year, description, cover_url, total_copies, available_copies)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, author_id, publisher_id || null, isbn || null, publish_year || null, description || null, cover_url || null, copies, copies]
  );
  return result.insertId;
};

const update = async (id, fields) => {
  const cols = [];
  const values = [];
  const allowed = ['title', 'author_id', 'publisher_id', 'isbn', 'publish_year', 'description', 'cover_url', 'total_copies'];
  for (const key of allowed) {
    if (fields[key] !== undefined) { cols.push(`${key} = ?`); values.push(fields[key]); }
  }
  if (!cols.length) return false;
  values.push(id);
  await db.query(`UPDATE books SET ${cols.join(', ')} WHERE id = ?`, values);
  return true;
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM books WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// Gắn/cập nhật danh mục cho sách
const setCategories = async (bookId, categoryIds = []) => {
  await db.query('DELETE FROM book_categories WHERE book_id = ?', [bookId]);
  if (!categoryIds.length) return;
  const values = categoryIds.map(cid => [bookId, cid]);
  await db.query('INSERT INTO book_categories (book_id, category_id) VALUES ?', [values]);
};

// ── Đảo ngược trạng thái ẩn/hiện của sách ────────────────────────────────────
const toggleHide = async (id) => {
  // 1. Kiểm tra xem sách có tồn tại không
  const [[book]] = await db.query('SELECT is_hidden FROM books WHERE id = ?', [id]);
  if (!book) return null; // Trả về null nếu không tìm thấy sách

  // 2. Đảo ngược trạng thái (Nếu đang 1 thì thành 0, đang 0 thì thành 1)
  const newHiddenState = book.is_hidden ? 0 : 1;
  
  // 3. Cập nhật xuống Database
  await db.query('UPDATE books SET is_hidden = ? WHERE id = ?', [newHiddenState, id]);
  
  // 4. Trả về trạng thái mới cho Controller
  return newHiddenState;
};

// Lấy danh sách toàn bộ nhà xuất bản
const findAllPublishers = async () => {
  // Truy vấn lấy id và name (hoặc publisher_name tùy theo tên cột trong DB của bạn)
  const [rows] = await db.query('SELECT id, name FROM publishers ORDER BY name ASC');
  return rows;
};

// ── Thêm nhanh tác giả mới ──────────────────────────────────────────────────
const createAuthor = async (name, bio) => {
  const [result] = await db.query('INSERT INTO authors (name, bio) VALUES (?, ?)', [name, bio || null]);
  return { id: result.insertId, name };
};

// ── Thêm nhanh nhà xuất bản mới ──────────────────────────────────────────────
const createPublisher = async (name, country) => {
  const [result] = await db.query('INSERT INTO publishers (name, country) VALUES (?, ?)', [name, country]);
  return { id: result.insertId, name };
};


// ── Dashboard Statistics ─────────────────────────────────────
const getDashboardStats = async () => {
  // Tổng số bản sao hiện có của toàn bộ sách
  const [[books]] = await db.query(`
    SELECT COALESCE(SUM(total_copies), 0) AS totalBooks
    FROM books
  `);

  // Thành viên có role = 'user' và status = 'active'
  const [[members]] = await db.query(`
    SELECT COUNT(*) AS activeMembers
    FROM users
    WHERE role = 'user' AND status = 'active'
  `);

  // Số lượt mượn đang diễn ra (status = 'borrowing')
  const [[borrowed]] = await db.query(`
    SELECT COUNT(*) AS checkedOutBooks
    FROM borrows
    WHERE status = 'borrowing'
  `);

  return {
    totalBooks: Number(books.totalBooks) || 0,
    activeMembers: Number(members.activeMembers) || 0,
    checkedOutBooks: Number(borrowed.checkedOutBooks) || 0
  };
};

module.exports = { findAll, findById, findFeatured, findTopRated, findNewest, findAllCategories, create, update, remove, setCategories, getDashboardStats, toggleHide, findAllPublishers, createAuthor, createPublisher, getSavedBooksByUser, saveBook, unsaveBook };