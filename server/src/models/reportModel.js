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

// ── Export toàn bộ báo cáo ──────────────────────────────
const getAllReports = async ({ from, to, type }) => {
  const conds = [];
  const params = [];

  if (from) {
    conds.push('b.borrow_date >= ?');
    params.push(from);
  }

  if (to) {
    conds.push('b.borrow_date <= ?');
    params.push(`${to} 23:59:59`);
  }

  if (type) {
    conds.push('b.status = ?');
    params.push(type);
  }

  const where =
    conds.length
      ? `WHERE ${conds.join(' AND ')}`
      : '';

  const [rows] = await db.query(
    `
    SELECT
      b.id,
      u.full_name AS user_name,
      u.email,
      bk.title AS book_title,
      h.full_name AS handled_by,
      b.borrow_date,
      b.due_date,
      b.return_date,
      b.status,
      b.renewed_count,
      b.fine_amount,
      b.fine_paid
    FROM borrows b
    JOIN users u
      ON u.id = b.user_id
    JOIN books bk
      ON bk.id = b.book_id
    LEFT JOIN users h
      ON h.id = b.handled_by
    ${where}
    ORDER BY b.borrow_date DESC
    `,
    params
  );

  return rows;
};

// ── Báo cáo mượn trả (có filter ngày + status) ──────────────────────────────
const getReports = async ({ from, to, type, page = 1, limit = 20 }) => {
  const conds  = [];
  const params = [];
  if (from) { conds.push('b.borrow_date >= ?'); params.push(from); }
  if (to)   { conds.push('b.borrow_date <= ?'); params.push(`${to} 23:59:59`); }
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
const getReportSummary = async (from, to) => {
  // Cực kỳ quan trọng: Ép thời gian đến cuối ngày để không sót dữ liệu
  const fromDate = `${from} 00:00:00`;
  const toDate = `${to} 23:59:59`;

  // 1. Total Borrows: Tổng số lượt mượn (Lọc theo borrow_date)
  const [[{ totalBorrows }]] = await db.query(
    `SELECT COUNT(*) AS totalBorrows FROM borrows WHERE borrow_date BETWEEN ? AND ?`,
    [from, to] // Cột DATE chỉ cần YYYY-MM-DD
  );

  // 2. Total Returns: Tổng sách đã trả (Lọc theo return_date)
  const [[{ totalReturns }]] = await db.query(
    `SELECT COUNT(*) AS totalReturns FROM borrows WHERE status = 'returned' AND return_date BETWEEN ? AND ?`,
    [from, to] // Cột DATE chỉ cần YYYY-MM-DD
  );

  // 3. New Members: Tổng độc giả mới (Lọc theo created_at là DATETIME)
  const [[{ totalNewUsers }]] = await db.query(
    `SELECT COUNT(*) AS totalNewUsers FROM users WHERE role = 'user' AND created_at BETWEEN ? AND ?`,
    [fromDate, toDate] // Phải dùng toDate có 23:59:59
  );

  // 4. Fines Collected: Tổng tiền phạt ĐÃ THU (fine_paid = 1) (Lọc theo return_date)
  const [[{ totalFinesCollected }]] = await db.query(
    `SELECT COALESCE(SUM(fine_amount), 0) AS totalFinesCollected 
     FROM borrows 
     WHERE fine_paid = 1 AND return_date BETWEEN ? AND ?`,
    [from, to]
  );

  return {
    totalBorrows: totalBorrows || 0,
    totalReturns: totalReturns || 0,
    totalNewUsers: totalNewUsers || 0,
    totalFinesCollected: totalFinesCollected || 0
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
  const joinConds  = ['b.book_id = bk.id'];
  const dateParams = [];
  if (from) { joinConds.push('b.borrow_date >= ?'); dateParams.push(from); }
  if (to)   { joinConds.push('b.borrow_date <= ?'); dateParams.push(`${to} 23:59:59`); }

  const [rows] = await db.query(
    `SELECT
   c.name AS category,
   COUNT(b.id) AS borrowed,
   COALESCE(SUM(CASE WHEN b.status = 'returned' THEN 1 ELSE 0 END), 0) AS returned,
   COALESCE(SUM(CASE WHEN b.status = 'overdue'  THEN 1 ELSE 0 END), 0) AS overdue
 FROM categories c
 LEFT JOIN book_categories bc ON bc.category_id = c.id
 LEFT JOIN books bk           ON bk.id = bc.book_id
 LEFT JOIN borrows b          ON ${joinConds.join(' AND ')}
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
  getAllReports,
  getReports,
  getTopBooks,
  getReportSummary,
  getBorrowChart,
  getCategoryReport,
};