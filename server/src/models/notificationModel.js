'use strict';
const db = require('../config/db');

// ─────────────────────────────────────────────────────────────
// Lấy danh sách thông báo theo bộ lọc + phân trang + tìm kiếm
// ─────────────────────────────────────────────────────────────
const findAll = async ({ receiver_role = null, user_id = null, filter = 'all', is_archived = 0, page = 1, limit = 10, search = '' }) => {
  let query = `
    SELECT n.*, u.full_name AS user_name 
    FROM notifications n 
    LEFT JOIN users u ON n.user_id = u.id 
    WHERE n.is_archived = ?
  `;
  const params = [is_archived];

  // [THÊM MỚI] Lọc theo vai trò người nhận nếu có truyền vào (Dành cho việc phân tách hộp thư)
  if (receiver_role) {
    query += ' AND n.receiver_role = ?';
    params.push(receiver_role);
  }

  // [THÊM MỚI] Lọc theo user_id nếu có truyền vào (Bắt buộc dùng cho phía Client/User thường để bảo mật)
  if (user_id) {
    query += ' AND n.user_id = ?';
    params.push(user_id);
  }

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

// Thêm hàm lấy chi tiết thông tin mượn sách để tạo thông báo
const getBorrowDetailsForNoti = async (borrowId) => {
  const [rows] = await db.query(`
    SELECT b.id as borrow_id, b.user_id, b.book_id, u.full_name as user_name, bk.title as book_title
    FROM borrows b
    JOIN users u ON b.user_id = u.id
    JOIN books bk ON b.book_id = bk.id
    WHERE b.id = ?
  `, [borrowId]);
  return rows[0];
};

// ─────────────────────────────────────────────────────────────
// Tạo thông báo mới
// [FIX] Đổi tên hàm thành `create` cho nhất quán với cách gọi trong controller
// [FIX] borrow_id / book_id truyền vào phải là số hoặc null — parse int để tránh lỗi FK
// ─────────────────────────────────────────────────────────────
const create = async ({ receiver_role = 'user', scope = null, user_id = null, borrow_id = null, book_id = null, type, title, message }) => {
  // Tự động đồng bộ: Nếu Admin dùng chức năng cũ gửi đi có 'scope === user' -> role là 'user'
  // Nếu hệ thống tự động bắn thông báo thì dùng 'receiver_role' chỉ định sẵn
  const finalRole = scope === 'user' ? 'user' : receiver_role;

  return db.query(
    'INSERT INTO notifications (receiver_role, user_id, borrow_id, book_id, title, message, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      finalRole,
      finalRole === 'user' ? (parseInt(user_id) || null) : null,
      borrow_id ? (parseInt(borrow_id) || null) : null,
      book_id   ? (parseInt(book_id)   || null) : null,
      title,
      message,
      type || 'system',
    ]
  );
};

// ─────────────────────────────────────────────────────────────
// Tạo thông báo cho TẤT CẢ users có role='user' (scope=users_only)
// Dùng batch INSERT để tối ưu — tránh gọi N lần query riêng lẻ
// ─────────────────────────────────────────────────────────────
const createForRoleUsers = async ({ scope, type, title, message, book_id }) => {
  const [users] = await db.query(
    "SELECT id FROM users WHERE role = 'user' AND status = 'active'"
  );
  const values = [];

  // 2. Thêm từng độc giả vào mảng values
  if (users && users.length > 0) {
    users.forEach((u) => {
      // Thứ tự: [receiver_role, user_id, borrow_id, book_id, title, message, type]
      values.push(['user', u.id, null, book_id ? parseInt(book_id) : null, title, message, type || 'system']);
    });
  }

  // 3. [QUAN TRỌNG] Nếu là "Toàn hệ thống", gửi thêm 1 bản copy cho hộp thư Admin/Employee
  if (scope === 'all') {
    values.push(['admin_employee', null, null, book_id ? parseInt(book_id) : null, title, message, type || 'system']);
  }

  // Nếu không có dữ liệu để insert thì ngưng
  if (values.length === 0) return;

  // 4. Batch INSERT (Đã bổ sung cột receiver_role cho chuẩn với Database)
  await db.query(
    'INSERT INTO notifications (receiver_role, user_id, borrow_id, book_id, title, message, type) VALUES ?',
    [values]
  );
};

  // Xóa mềm 1 thông báo
const softDelete = async (id, userId) => {
  const query = `
    UPDATE notifications 
    SET is_archived = 1 
    WHERE id = ? AND user_id = ?
  `;
  const [result] = await db.execute(query, [id, userId]);
  return result;
};

// Xóa mềm NHIỀU thông báo
const softDeleteMultiple = async (ids, userId) => {
  // Tạo chuỗi dấu hỏi tương ứng với số lượng ID (VD: "?, ?, ?")
  const placeholders = ids.map(() => '?').join(',');
  
  const query = `
    UPDATE notifications 
    SET is_archived = 1 
    WHERE id IN (${placeholders}) AND user_id = ?
  `;
  
  // Nối mảng ids với userId ở cuối để truyền tham số
  const params = [...ids, userId];
  const [result] = await db.query(query, params);
  return result;
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
  createForRoleUsers,
  softDelete,
  softDeleteMultiple
};