'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 2 — Book Management System              ║
 * ║  Model: bookModel.js                                ║
 * ╚══════════════════════════════════════════════════════╝
 */

const db = require('../config/db');

// ── Danh sách sách (search, category, pagination) ─────────────────────────────
const findAll = async ({ search = '', category = '', page = 1, limit = 12 }) => {
  const conditions = [];
  const params     = [];

  if (search) {
    conditions.push('(b.title LIKE ? OR a.name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    conditions.push('c.id = ?');
    params.push(category);
  }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [[{ total }]] = await db.query(
    `SELECT COUNT(DISTINCT b.id) AS total
     FROM books b
     JOIN authors a ON a.id = b.author_id
     LEFT JOIN book_categories bc ON bc.book_id = b.id
     LEFT JOIN categories c ON c.id = bc.category_id
     ${where}`,
    params
  );

  const [rows] = await db.query(
    `SELECT b.id, b.title, b.isbn, b.publish_year, b.cover_url,
            b.total_copies, b.available_copies,
            a.name AS author,
            p.name AS publisher,
            GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS categories
     FROM books b
     JOIN authors a ON a.id = b.author_id
     LEFT JOIN publishers p ON p.id = b.publisher_id
     LEFT JOIN book_categories bc ON bc.book_id = b.id
     LEFT JOIN categories c ON c.id = bc.category_id
     ${where}
     GROUP BY b.id
     ORDER BY b.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );

  return { rows, total: Number(total) };
};

// ── Chi tiết sách ─────────────────────────────────────────────────────────────
const findById = async (id) => {
  const [rows] = await db.query(
    `SELECT b.*,
            a.name AS author, a.bio AS author_bio,
            p.name AS publisher,
            GROUP_CONCAT(DISTINCT c.id   ORDER BY c.name SEPARATOR ',') AS category_ids,
            GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ',') AS categories,
            COALESCE(AVG(r.rating), 0) AS avg_rating,
            COUNT(DISTINCT r.id)       AS review_count
     FROM books b
     JOIN authors a ON a.id = b.author_id
     LEFT JOIN publishers p ON p.id = b.publisher_id
     LEFT JOIN book_categories bc ON bc.book_id = b.id
     LEFT JOIN categories c ON c.id = bc.category_id
     LEFT JOIN reviews r ON r.book_id = b.id AND r.is_visible = 1
     WHERE b.id = ?
     GROUP BY b.id`,
    [id]
  );
  return rows[0] || null;
};

// ── Sách nổi bật (được mượn nhiều nhất, còn sách) ────────────────────────────
const findFeatured = async (limit = 8) => {
  const [rows] = await db.query(
    `SELECT b.id, b.title, b.cover_url, b.available_copies,
            a.name AS author,
            COUNT(br.id) AS borrow_count,
            COALESCE(AVG(r.rating), 0) AS avg_rating
     FROM books b
     JOIN authors a ON a.id = b.author_id
     LEFT JOIN borrows br ON br.book_id = b.id
     LEFT JOIN reviews r  ON r.book_id  = b.id AND r.is_visible = 1
     WHERE b.available_copies > 0
     GROUP BY b.id
     ORDER BY borrow_count DESC, avg_rating DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
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
  const cols   = [];
  const values = [];
  const allowed = ['title','author_id','publisher_id','isbn','publish_year','description','cover_url','total_copies'];
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

module.exports = { findAll, findById, findFeatured, findAllCategories, create, update, remove, setCategories };
