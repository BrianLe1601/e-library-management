'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 4 — Admin Dashboard & Reports           ║
 * ║  Model: reportModel.js                              ║
 * ╚══════════════════════════════════════════════════════╝
 */

const db = require('../config/db');

// ── Dashboard stats ───────────────────────────────────────────────────────────
const getStats = async () => {
  const [[{ totalBooks }]] = await db.query(
    'SELECT COALESCE(SUM(total_copies), 0) AS totalBooks FROM books'
  );
  const [[{ activeBorrows }]] = await db.query(
    `SELECT COUNT(*) AS activeBorrows FROM borrows WHERE status IN ('borrowing','renewed','overdue')`
  );
  const [[{ pendingBorrows }]] = await db.query(
    `SELECT COUNT(*) AS pendingBorrows FROM borrows WHERE status = 'pending'`
  );
  const [[{ overdueBorrows }]] = await db.query(
    `SELECT COUNT(*) AS overdueBorrows FROM borrows WHERE status = 'overdue'`
  );
  const [[{ newUsersThisMonth }]] = await db.query(
    `SELECT COUNT(*) AS newUsersThisMonth FROM users
     WHERE YEAR(created_at) = YEAR(CURRENT_DATE) AND MONTH(created_at) = MONTH(CURRENT_DATE) AND role = 'user'`
  );
  const [[{ totalFine, unpaidFine }]] = await db.query(
    `SELECT COALESCE(SUM(fine_amount), 0) AS totalFine,
            COALESCE(SUM(CASE WHEN fine_paid = 0 THEN fine_amount ELSE 0 END), 0) AS unpaidFine
     FROM borrows`
  );
  const [[{ totalUsers }]] = await db.query(
    `SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user' AND status = 'active'`
  );
  return {
    totalBooks:        Number(totalBooks),
    activeBorrows:     Number(activeBorrows),
    newUsersThisMonth: Number(newUsersThisMonth),
    totalUsers:        Number(totalUsers),
    totalFine:         Number(totalFine),
    unpaidFine:        Number(unpaidFine),
    pendingBorrows:    Number(pendingBorrows),
    overdueBorrows:    Number(overdueBorrows),
  };
};

// ── Báo cáo mượn trả (có filter ngày + status) ──────────────────────────────
const getReports = async ({ from, to, type, page = 1, limit = 20 }) => {
  const conds  = [];
  const params = [];
  if (from) { conds.push('b.borrow_date >= ?'); params.push(from); }
  if (to)   { conds.push('b.borrow_date <= ?'); params.push(to);   }
  if (type) { conds.push('b.status = ?');       params.push(type); }
  const where   = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const offset  = (Math.max(1, Number(page)) - 1) * Number(limit);
  const limitN  = Math.min(100, Number(limit));

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM borrows b ${where}`, params);
  const [rows] = await db.query(
    `SELECT b.id, u.full_name AS user_name, u.email,
            bk.title AS book_title, h.full_name AS handled_by,
            b.borrow_date, b.due_date, b.return_date,
            b.status, b.renewed_count, b.fine_amount, b.fine_paid
     FROM borrows b
     JOIN users u  ON u.id  = b.user_id
     JOIN books bk ON bk.id = b.book_id
     LEFT JOIN users h ON h.id = b.handled_by
     ${where}
     ORDER BY b.borrow_date DESC
     LIMIT ? OFFSET ?`,
    [...params, limitN, offset]
  );
  return { rows, total: Number(total) };
};

// ── Top sách được mượn nhiều ─────────────────────────────────────────────────
const getTopBooks = async (limit = 10) => {
  const [rows] = await db.query(
    `SELECT bk.id, bk.title, bk.cover_url,
            a.name AS author,
            COUNT(b.id)                AS borrow_count,
            COALESCE(AVG(r.rating), 0) AS avg_rating
     FROM books bk
     LEFT JOIN borrows b ON b.book_id = bk.id
     LEFT JOIN authors a ON a.id = bk.author_id
     LEFT JOIN reviews r ON r.book_id = bk.id AND r.is_visible = 1
     GROUP BY bk.id
     ORDER BY borrow_count DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
};

// ── [MỚI] Thống kê tổng hợp cho trang Reports ───────────────────────────────
// Trả về: totalBorrows, totalReturns, totalNewUsers, totalFinesCollected
// Có thể lọc theo khoảng ngày
const getReportSummary = async ({ from, to }) => {
  const dateConds  = [];
  const dateParams = [];
  if (from) { dateConds.push('borrow_date >= ?'); dateParams.push(from); }
  if (to)   { dateConds.push('borrow_date <= ?'); dateParams.push(to);   }
  const whereDate = dateConds.length ? `WHERE ${dateConds.join(' AND ')}` : '';

  const [[borrowStats]] = await db.query(
    `SELECT
       COUNT(*) AS totalBorrows,
       SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS totalReturns,
       COALESCE(SUM(CASE WHEN fine_paid = 1 THEN fine_amount ELSE 0 END), 0) AS totalFinesCollected
     FROM borrows
     ${whereDate}`,
    dateParams
  );

  // New users: lọc theo ngày tạo (dùng created_at) trong cùng khoảng
  const userConds  = ["role = 'user'"];
  const userParams = [];
  if (from) { userConds.push('created_at >= ?'); userParams.push(from); }
  if (to)   { userConds.push('created_at <= ?'); userParams.push(to + ' 23:59:59'); }

  const [[{ totalNewUsers }]] = await db.query(
    `SELECT COUNT(*) AS totalNewUsers FROM users WHERE ${userConds.join(' AND ')}`,
    userParams
  );

  return {
    totalBorrows:        Number(borrowStats.totalBorrows)        || 0,
    totalReturns:        Number(borrowStats.totalReturns)        || 0,
    totalFinesCollected: Number(borrowStats.totalFinesCollected) || 0,
    totalNewUsers:       Number(totalNewUsers)                   || 0,
  };
};

// ── [MỚI] Biểu đồ lượt mượn/trả theo tháng ─────────────────────────────────
// Trả về 12 tháng của năm, điền 0 cho tháng không có dữ liệu
const getBorrowChart = async (year) => {
  const [rows] = await db.query(
    `SELECT
       MONTH(borrow_date) AS month,
       COUNT(*) AS borrows,
       SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returns,
       COUNT(DISTINCT user_id) AS uniqueUsers
     FROM borrows
     WHERE YEAR(borrow_date) = ?
     GROUP BY MONTH(borrow_date)
     ORDER BY month ASC`,
    [Number(year)]
  );

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return MONTHS.map((name, i) => {
    const found = rows.find(r => Number(r.month) === i + 1);
    return {
      month:       `${name} ${year}`,
      borrows:     Number(found?.borrows)     || 0,
      returns:     Number(found?.returns)     || 0,
      uniqueUsers: Number(found?.uniqueUsers) || 0,
    };
  });
};

// ── [MỚI] Thống kê theo danh mục sách ───────────────────────────────────────
// Trả về mỗi category: tổng mượn, tổng trả, tổng quá hạn
const getCategoryReport = async ({ from, to }) => {
  const dateConds  = [];
  const dateParams = [];
  if (from) { dateConds.push('b.borrow_date >= ?'); dateParams.push(from); }
  if (to)   { dateConds.push('b.borrow_date <= ?'); dateParams.push(to);   }
  const whereDate = dateConds.length ? `AND ${dateConds.join(' AND ')}` : '';

  const [rows] = await db.query(
    `SELECT
       c.name AS category,
       COUNT(b.id) AS borrowed,
       SUM(CASE WHEN b.status = 'returned' THEN 1 ELSE 0 END) AS returned,
       SUM(CASE WHEN b.status IN ('overdue') THEN 1 ELSE 0 END) AS overdue
     FROM categories c
     LEFT JOIN book_categories bc ON bc.category_id = c.id
     LEFT JOIN books bk            ON bk.id = bc.book_id
     LEFT JOIN borrows b            ON b.book_id = bk.id ${whereDate}
     GROUP BY c.id, c.name
     ORDER BY borrowed DESC`,
    dateParams
  );

  return rows.map(r => ({
    category: r.category,
    borrowed: Number(r.borrowed) || 0,
    returned: Number(r.returned) || 0,
    overdue:  Number(r.overdue)  || 0,
  }));
};

module.exports = {
  getStats,
  getReports,
  getTopBooks,
  getReportSummary,
  getBorrowChart,
  getCategoryReport,
};