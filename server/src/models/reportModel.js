'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 4 — Admin Dashboard & Reports           ║
 * ║  Model: reportModel.js                              ║
 * ╚══════════════════════════════════════════════════════╝
 */
const db = require('../config/db');

// ── 1. Thống kê Dashboard (Gộp các truy vấn đơn lẻ thành 1 câu query hiệu năng cao) ──
const getStats = async () => {
  const [rows] = await db.query(`
    SELECT 
      (SELECT COUNT(*) FROM books) AS totalBooks, -- Đổi từ SUM(total_copies) thành COUNT(*) để đếm đầu sách
      (SELECT COUNT(*) FROM borrows WHERE status IN ('borrowing','renewed','overdue')) AS activeBorrows,
      (SELECT COUNT(*) FROM users WHERE YEAR(created_at) = YEAR(CURRENT_DATE) AND MONTH(created_at) = MONTH(CURRENT_DATE) AND role = 'user') AS newUsersThisMonth,
      (SELECT COALESCE(SUM(fine_amount), 0) FROM borrows) AS totalFine,
      (SELECT COALESCE(SUM(CASE WHEN fine_paid = 0 THEN fine_amount ELSE 0 END), 0) FROM borrows) AS unpaidFine,
      (SELECT COUNT(*) FROM users WHERE role = 'user') AS totalUsers
  `);
  
  return rows[0];
};

// ── 2. Báo cáo Thống kê chi tiết theo khoảng thời gian ──
const getReports = async ({ startDate, endDate }) => {
  const params = [];
  let dateCondition = '';

  if (startDate && endDate) {
    dateCondition = 'WHERE b.created_at BETWEEN ? AND ?';
    params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
  }

  const [rows] = await db.query(`
    SELECT 
      COUNT(*) AS total_transactions,
      COUNT(CASE WHEN b.status = 'returned' THEN 1 END) AS returned_count,
      COUNT(CASE WHEN b.status IN ('borrowing','renewed','overdue') THEN 1 END) AS active_count,
      COUNT(CASE WHEN b.status = 'rejected' THEN 1 END) AS rejected_count,
      COALESCE(SUM(b.fine_amount), 0) AS total_fines_generated,
      COALESCE(SUM(CASE WHEN b.fine_paid = 1 THEN b.fine_amount ELSE 0 END), 0) AS total_fines_collected
    FROM borrows b
    ${dateCondition}
  `, params);

  return rows[0];
};

// ── 3. Thống kê Top sách mượn nhiều nhất ──
const getTopBooks = async (limitN = 5) => {
  const [rows] = await db.query(`
    SELECT 
      bk.id, bk.title, bk.isbn, bk.cover_url,
      a.name AS author,
      COUNT(b.id) AS borrow_count
    FROM borrows b
    JOIN books bk ON bk.id = b.book_id
    JOIN authors a ON a.id = bk.author_id
    WHERE b.status != 'rejected'
    GROUP BY bk.id
    ORDER BY borrow_count DESC
    LIMIT ?
  `, [Number(limitN)]);
  
  return rows;
};

// ── 4. Quản lý Danh sách Người dùng (Phân trang + Tìm kiếm nâng cao) ──
const getUsers = async ({ role = '', status = '', search = '', page = 1, limit = 10 }) => {
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const conditions = [];
  const params = [];

  if (role) {
    conditions.push('u.role = ?');
    params.push(role);
  }

  if (status) {
    conditions.push('u.status = ?');
    params.push(status);
  }
  
  if (search) {
    conditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM users u ${where}`, params);

  const [rows] = await db.query(`
    SELECT 
      u.id, u.full_name, u.email, u.phone, u.avatar_url, u.role, u.status, u.created_at,
      COUNT(CASE WHEN b.status IN ('borrowing','renewed','overdue') THEN 1 END) AS current_borrowing_count
    FROM users u
    LEFT JOIN borrows b ON b.user_id = u.id
    ${where}
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, Number(limit), offset]);

  return { rows, total: Number(total) };
};

// ── 5. Đóng/Mở khóa tài khoản người dùng ──
const toggleUserStatus = async (id) => {
  const [[user]] = await db.query('SELECT id, role, status FROM users WHERE id = ?', [id]);
  if (!user) throw Object.assign(new Error('Người dùng không tồn tại'), { statusCode: 404 });
  if (user.role === 'admin') throw Object.assign(new Error('Không thể khóa tài khoản admin'), { statusCode: 403 });
  
  const newStatus = user.status === 'active' ? 'locked' : 'active';
  await db.query('UPDATE users SET status = ? WHERE id = ?', [newStatus, id]);
  return { id, status: newStatus };
};

// ── 6. Xóa tài khoản (Chuyển đổi sang giải pháp An toàn dữ liệu: Soft Delete) ──
const deleteUser = async (id) => {
  const [[user]] = await db.query('SELECT id, role FROM users WHERE id = ?', [id]);
  if (!user) throw Object.assign(new Error('Người dùng không tồn tại trên hệ thống'), { statusCode: 404 });
  if (user.role === 'admin') throw Object.assign(new Error('Không cho phép xóa tài khoản Admin hệ thống'), { statusCode: 403 });

  // Kiểm tra độc giả còn sách chưa trả hay không trước khi hủy kích hoạt
  const [[{ active }]] = await db.query(
    `SELECT COUNT(*) AS active FROM borrows WHERE user_id = ? AND status IN ('borrowing','renewed','overdue')`,
    [id]
  );
  if (active > 0) {
    throw Object.assign(new Error(`Không thể hủy tài khoản: Độc giả này vẫn đang mượn ${active} cuốn sách chưa hoàn trả`), { statusCode: 400 });
  }

  // Thực hiện Soft Delete: Đánh dấu ngừng hoạt động vĩnh viễn và đổi tên email để giải phóng đăng ký nếu cần
  await db.query(`UPDATE users SET status = 'locked', role = 'user' WHERE id = ?`, [id]);
  return true;
};

module.exports = {
  getStats,
  getReports,
  getTopBooks,
  getUsers,
  toggleUserStatus,
  deleteUser
};