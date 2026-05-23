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
  };
};

// ── Báo cáo mượn trả ─────────────────────────────────────────────────────────
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

// ── Top sách được mượn nhiều ──────────────────────────────────────────────────
const getTopBooks = async (limit = 10) => {
  const [rows] = await db.query(
    `SELECT bk.id, bk.title, bk.cover_url,
            a.name AS author,
            COUNT(b.id)           AS borrow_count,
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

module.exports = { getStats, getReports, getTopBooks };
