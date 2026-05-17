'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 2 — Book Management System              ║
 * ║  Model: bookModel.js                                ║
 * ╚══════════════════════════════════════════════════════╝
 */

const db = require('../config/db');

// Helper định dạng chuỗi thành mảng sạch sẽ cho Frontend
const formatBookRows = (book) => {
  if (!book) return null;
  return {
    ...book,
    category_ids: book.category_ids ? book.category_ids.split(',').map(Number) : [],
    categories: book.categories ? book.categories.split(',') : [],
    avg_rating: Number(Number(book.avg_rating).toFixed(1)),
    review_count: Number(book.review_count || 0)
  };
};

// ── Danh sách sách (search, category, pagination) ─────────────────────────────
const findAll = async ({ search = '', category = '', author = '', publisher = '', page = 1, limit = 12, sort = 'latest' }) => {
  const offset = (Number(page) - 1) * Number(limit);
  const conditions = [];
  const params = [];
  let joinCategory = '';

  // Điều kiện tìm kiếm (Tìm qua tiêu đề, tác giả, isbn)
  if (search) {
    conditions.push('(b.title LIKE ? OR a.name LIKE ? OR b.isbn LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  // Lọc theo danh mục
  if (category) {
    joinCategory = 'JOIN book_categories bc ON b.id = bc.book_id';
    conditions.push('bc.category_id = ?');
    params.push(category);
  }

  // Lọc theo tác giả
  if (author) {
    conditions.push('b.author_id = ?');
    params.push(author);
  }

  // Lọc theo nhà xuất bản
  if (publisher) {
    conditions.push('b.publisher_id = ?');
    params.push(publisher);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Xử lý Logic Sắp Xếp từ Client truyền xuống
  let orderBy = 'b.created_at DESC'; // Mặc định là mới nhất (latest)
  switch (sort) {
    case 'rating-desc': orderBy = 'avg_rating DESC'; break;
    case 'rating-asc':  orderBy = 'avg_rating ASC'; break;
    case 'title-asc':   orderBy = 'b.title ASC'; break;
    case 'title-desc':  orderBy = 'b.title DESC'; break;
    case 'available':   orderBy = 'b.available_copies DESC'; break;
  }


  // Đếm tổng số sách (Để làm thanh Pagination)
  const [[{ total }]] = await db.query(
    `SELECT COUNT(DISTINCT b.id) AS total 
     FROM books b 
     LEFT JOIN authors a ON b.author_id = a.id 
     ${joinCategory} 
     ${whereClause}`,
    params
  );

  // Lấy danh sách sách + Gộp điểm trung bình từ bảng Reviews (avg_rating)
  const [rows] = await db.query(
    `SELECT 
       b.*, 
       a.name AS author_name,
       p.name AS publisher_name,
       COALESCE((SELECT AVG(rating) FROM reviews WHERE book_id = b.id), 0) AS avg_rating,
       (SELECT COUNT(*) FROM reviews WHERE book_id = b.id) AS review_count,
       (SELECT GROUP_CONCAT(c.name SEPARATOR ',') 
        FROM categories c 
        JOIN book_categories bcat ON c.id = bcat.category_id 
        WHERE bcat.book_id = b.id) AS categories
     FROM books b
     LEFT JOIN authors a ON b.author_id = a.id
     LEFT JOIN publishers p ON b.publisher_id = p.id
     ${joinCategory}
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return { rows: rows.map(formatBookRows), total: Number(total) };
};

// ── Lấy chi tiết một cuốn sách ──────────────────────────────────────────────
const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT 
       b.*, 
       a.name AS author_name,
       p.name AS publisher_name,
       COALESCE((SELECT AVG(rating) FROM reviews WHERE book_id = b.id), 0) AS avg_rating,
       (SELECT COUNT(*) FROM reviews WHERE book_id = b.id) AS review_count,
       (SELECT GROUP_CONCAT(c.name SEPARATOR ',') FROM categories c JOIN book_categories bcat ON c.id = bcat.category_id WHERE bcat.book_id = b.id) AS categories,
       (SELECT GROUP_CONCAT(category_id SEPARATOR ',') FROM book_categories WHERE book_id = b.id) AS category_ids
     FROM books b
     LEFT JOIN authors a ON b.author_id = a.id
     LEFT JOIN publishers p ON b.publisher_id = p.id
     WHERE b.id = ?`,
    [id]
  );
  return formatBookRows(rows[0]);
};

// ── Sách nổi bật (được mượn nhiều nhất, còn sách) ────────────────────────────
// ── Lấy Sách Nổi Bật hiển thị cho Trang chủ (Ưu tiên điểm số và lượt mượn) ──
const findFeatured = async (limit = 8) => {
  const [rows] = await db.query(
    `SELECT 
       b.*, 
       a.name AS author_name,
       p.name AS publisher_name,
       COALESCE((SELECT AVG(rating) FROM reviews WHERE book_id = b.id), 0) AS avg_rating,
       (SELECT COUNT(*) FROM reviews WHERE book_id = b.id) AS review_count,
       (SELECT GROUP_CONCAT(c.name SEPARATOR ',') FROM categories c JOIN book_categories bcat ON c.id = bcat.category_id WHERE bcat.book_id = b.id) AS categories
     FROM books b
     LEFT JOIN authors a ON b.author_id = a.id
     LEFT JOIN publishers p ON b.publisher_id = p.id
     ORDER BY avg_rating DESC, review_count DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows.map(formatBookRows);
};

// ── Danh mục ─────────────────────────────────────────────────────────────────
const findAllCategories = async () => {
  const [rows] = await db.query(
    `SELECT c.id, c.name, c.description, COUNT(bc.book_id) AS book_count
     FROM categories c
     LEFT JOIN book_categories bc ON bc.category_id = c.id
     GROUP BY c.id
     ORDER BY c.name`
  );
  return rows;
};

// ── CRUD (Admin) ──────────────────────────────────────────────────────────────
// --- Mở rộng các hàm CRUD nhận kết nối từ Transaction ---
const createInTransaction = async (connection, fields) => {
  const { title, author_id, publisher_id, isbn, publish_year, description, cover_url, total_copies } = fields;
  const copies = total_copies || 1;
  const [result] = await connection.query(
    `INSERT INTO books (title, author_id, publisher_id, isbn, publish_year, description, cover_url, total_copies, available_copies)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, author_id, publisher_id || null, isbn || null, publish_year || null, description || null, cover_url || null, copies, copies]
  );
  return result.insertId;
};

const updateInTransaction = async (connection, id, fields) => {
  // Lấy dữ liệu cũ để tính toán thay đổi số lượng sách tồn kho
  const [oldRows] = await connection.query('SELECT total_copies, available_copies FROM books WHERE id = ?', [id]);
  if (!oldRows.length) return false;
  const oldBook = oldRows[0];

  const cols = [];
  const values = [];
  const allowed = ['title', 'author_id', 'publisher_id', 'isbn', 'publish_year', 'description', 'cover_url', 'total_copies'];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      cols.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  // Thuật toán: Nếu thay đổi total_copies, tự động tính chênh lệch để cập nhật available_copies
  if (fields.total_copies !== undefined) {
    const diff = Number(fields.total_copies) - oldBook.total_copies;
    const newAvailable = oldBook.available_copies + diff;
    if (newAvailable < 0) {
      throw new Error('Không thể giảm tổng số lượng sách xuống thấp hơn số lượng sách đang được mượn thực tế.');
    }
    cols.push('available_copies = ?');
    values.push(newAvailable);
  }

  if (!cols.length) return true;

  values.push(id);
  const [result] = await connection.query(`UPDATE books SET ${cols.join(', ')} WHERE id = ?`, values);
  return result.affectedRows > 0;
};

const setCategoriesInTransaction = async (connection, bookId, categoryIds = []) => {
  await connection.query('DELETE FROM book_categories WHERE book_id = ?', [bookId]);
  if (!categoryIds.length) return;
  const values = categoryIds.map(cid => [bookId, cid]);
  await connection.query('INSERT INTO book_categories (book_id, category_id) VALUES ?', [values]);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM books WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = {
  findAll,
  findById,
  findFeatured,
  findAllCategories,
  createInTransaction,
  updateInTransaction,
  setCategoriesInTransaction,
  remove
};
