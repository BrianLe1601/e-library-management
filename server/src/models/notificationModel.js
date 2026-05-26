'use strict';
const db = require('../config/db');

// ─────────────────────────────────────────────────────────────
// Lấy danh sách thông báo theo bộ lọc + phân trang + tìm kiếm
// ─────────────────────────────────────────────────────────────
const findAll = async ({ filter = 'all', is_archived = 0, page = 1, limit = 10, search = '' }) => {
  let query = `
    SELECT n.*, u.full_name AS user_name 
    FROM notifications n 
    LEFT JOIN users u ON n.user_id = u.id 
    WHERE n.is_archived = ?
  `;
  const params = [is_archived];

  // Bộ lọc theo loại
  if (filter === 'unread') {
    query += ' AND n.is_read = 0';
  } else if (filter === 'overdue') {
    query += " AND (n.type = 'overdue' OR n.type = 'fine')";
  } else if (filter === 'system') {
    query += " AND n.type = 'system'";
  }

  // [FIX] Tìm kiếm theo title hoặc message
  if (search && search.trim()) {
    query += ' AND (n.title LIKE ? OR n.message LIKE ?)';
    const keyword = `%${search.trim()}%`;
    params.push(keyword, keyword);
  }

  // Đếm tổng để tính totalPages
  const countQuery = query.replace(
    'SELECT n.*, u.full_name AS user_name',
    'SELECT COUNT(*) AS total'
  );
  const [[countRow]] = await db.query(countQuery, params);
  const total = countRow.total || 0;

  // [FIX] Phân trang thực sự — trước đây model không hỗ trợ, frontend bị tính sai totalPages
  const offset = (Number(page) - 1) * Number(limit);
  query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  const [rows] = await db.query(query, params);
  return { rows, total };
};

// ─────────────────────────────────────────────────────────────
// Đếm số lượng để làm Badge
// ─────────────────────────────────────────────────────────────
const getStats = async () => {
  const [[unread]]   = await db.query('SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0 AND is_archived = 0');
  const [[active]]   = await db.query('SELECT COUNT(*) AS count FROM notifications WHERE is_archived = 0');
  const [[archived]] = await db.query('SELECT COUNT(*) AS count FROM notifications WHERE is_archived = 1');
  return {
    unreadCount:  unread.count   || 0,
    activeCount:  active.count   || 0,
    archivedCount: archived.count || 0,
  };
};

// ─────────────────────────────────────────────────────────────
// Thao tác đơn lẻ
// ─────────────────────────────────────────────────────────────
const markRead   = async (id) => db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
const markAllRead = async ()  => db.query('UPDATE notifications SET is_read = 1 WHERE is_archived = 0');
const archive    = async (id) => db.query('UPDATE notifications SET is_archived = 1, is_read = 1 WHERE id = ?', [id]);
const restore    = async (id) => db.query('UPDATE notifications SET is_archived = 0 WHERE id = ?', [id]);
const remove     = async (id) => db.query('DELETE FROM notifications WHERE id = ?', [id]);

// ─────────────────────────────────────────────────────────────
// Bulk actions
// [FIX] Thêm bulkRestore — trước đây thiếu, khiến route /bulk với action='restore' không hoạt động
// ─────────────────────────────────────────────────────────────
const bulkArchive = async (ids) =>
  db.query('UPDATE notifications SET is_archived = 1, is_read = 1 WHERE id IN (?)', [ids]);

const bulkRestore = async (ids) =>
  db.query('UPDATE notifications SET is_archived = 0 WHERE id IN (?)', [ids]);

const bulkDelete  = async (ids) =>
  db.query('DELETE FROM notifications WHERE id IN (?)', [ids]);

// ─────────────────────────────────────────────────────────────
// Tạo thông báo mới
// [FIX] Đổi tên hàm thành `create` cho nhất quán với cách gọi trong controller
// [FIX] borrow_id / book_id truyền vào phải là số hoặc null — parse int để tránh lỗi FK
// ─────────────────────────────────────────────────────────────
const create = async ({ scope, user_id, borrow_id, book_id, type, title, message }) => {
  return db.query(
    'INSERT INTO notifications (user_id, borrow_id, book_id, title, message, type) VALUES (?, ?, ?, ?, ?, ?)',
    [
      scope === 'user' ? (parseInt(user_id) || null) : null,
      borrow_id ? (parseInt(borrow_id) || null) : null,
      book_id   ? (parseInt(book_id)   || null) : null,
      title,
      message,
      type || 'system',
    ]
  );
};

module.exports = {
  findAll,
  getStats,
  markRead,
  markAllRead,
  archive,
  restore,
  remove,
  bulkArchive,
  bulkRestore,
  bulkDelete,
  create,
};