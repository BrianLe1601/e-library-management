'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 3 — Borrow & Return System              ║
 * ║  Model: borrowModel.js                              ║
 * ╚══════════════════════════════════════════════════════╝
 */

const db = require('../config/db');

const DEFAULT_BORROW_DAYS  = 14;
const MAX_RENEWALS         = 2;

// ── Tạo yêu cầu mượn ─────────────────────────────────────────────────────────
const create = async ({ user_id, book_id, handled_by = null }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Kiểm tra sách còn hay không
    const [[book]] = await conn.query(
      'SELECT id, available_copies FROM books WHERE id = ? FOR UPDATE',
      [book_id]
    );
    if (!book || book.available_copies < 1) {
      throw Object.assign(new Error('Sách hiện không còn bản để mượn'), { statusCode: 409 });
    }

    // Kiểm tra user đang mượn cuốn này chưa
    const [[existing]] = await conn.query(
      `SELECT id FROM borrows WHERE user_id = ? AND book_id = ? AND status IN ('borrowing','renewed','overdue')`,
      [user_id, book_id]
    );
    if (existing) {
      throw Object.assign(new Error('Bạn đang mượn cuốn sách này rồi'), { statusCode: 409 });
    }

    const due_date = new Date();
    due_date.setDate(due_date.getDate() + DEFAULT_BORROW_DAYS);
    const dueDateStr = due_date.toISOString().split('T')[0];

    const [result] = await conn.query(
      `INSERT INTO borrows (user_id, book_id, handled_by, due_date, status)
       VALUES (?, ?, ?, ?, 'borrowing')`,
      [user_id, book_id, handled_by, dueDateStr]
    );

    await conn.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
      [book_id]
    );

    await conn.commit();
    return result.insertId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── Trả sách ──────────────────────────────────────────────────────────────────
const returnBook = async (borrowId, userId) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[borrow]] = await conn.query(
      `SELECT * FROM borrows WHERE id = ? AND user_id = ? AND status IN ('borrowing','renewed','overdue')`,
      [borrowId, userId]
    );
    if (!borrow) throw Object.assign(new Error('Không tìm thấy lượt mượn hợp lệ'), { statusCode: 404 });

    // Tính tiền phạt nếu quá hạn (1000đ/ngày)
    const today      = new Date();
    const dueDate    = new Date(borrow.due_date);
    let fine_amount  = 0;
    if (today > dueDate) {
      const days  = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      fine_amount = days * 1000;
    }

    const todayStr = today.toISOString().split('T')[0];
    await conn.query(
      `UPDATE borrows SET status = 'returned', return_date = ?, fine_amount = ? WHERE id = ?`,
      [todayStr, fine_amount, borrowId]
    );
    await conn.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [borrow.book_id]
    );

    await conn.commit();
    return { fine_amount };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── Gia hạn ───────────────────────────────────────────────────────────────────
const extendBorrow = async (borrowId, userId) => {
  const [[borrow]] = await db.query(
    `SELECT * FROM borrows WHERE id = ? AND user_id = ? AND status IN ('borrowing','renewed')`,
    [borrowId, userId]
  );
  if (!borrow) throw Object.assign(new Error('Không tìm thấy lượt mượn hợp lệ'), { statusCode: 404 });
  if (borrow.renewed_count >= MAX_RENEWALS)
    throw Object.assign(new Error(`Đã đạt giới hạn gia hạn (${MAX_RENEWALS} lần)`), { statusCode: 409 });

  const oldDue = new Date(borrow.due_date);
  const newDue = new Date(oldDue);
  newDue.setDate(newDue.getDate() + DEFAULT_BORROW_DAYS);
  const newDueStr = newDue.toISOString().split('T')[0];
  const oldDueStr = oldDue.toISOString().split('T')[0];

  await db.query(
    `UPDATE borrows SET due_date = ?, renewed_count = renewed_count + 1, status = 'renewed' WHERE id = ?`,
    [newDueStr, borrowId]
  );
  await db.query(
    `INSERT INTO borrow_renewals (borrow_id, renewed_by, old_due_date, new_due_date)
     VALUES (?, ?, ?, ?)`,
    [borrowId, userId, oldDueStr, newDueStr]
  );
  return { new_due_date: newDueStr };
};

// ── Sách đang mượn của user ───────────────────────────────────────────────────
const findActiveByUser = async (userId) => {
  const [rows] = await db.query(
    `SELECT b.id, b.due_date, b.borrow_date, b.status, b.renewed_count,
            bk.title, bk.cover_url, a.name AS author
     FROM borrows b
     JOIN books bk ON bk.id = b.book_id
     JOIN authors a ON a.id = bk.author_id
     WHERE b.user_id = ? AND b.status IN ('borrowing','renewed','overdue')
     ORDER BY b.due_date ASC`,
    [userId]
  );
  return rows;
};

// ── Lịch sử mượn trả của user ────────────────────────────────────────────────
const findHistoryByUser = async (userId, { page = 1, limit = 10 }) => {
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [[{ total }]] = await db.query(
    'SELECT COUNT(*) AS total FROM borrows WHERE user_id = ?',
    [userId]
  );
  const [rows] = await db.query(
    `SELECT b.id, b.borrow_date, b.due_date, b.return_date, b.status,
            b.fine_amount, b.fine_paid, b.renewed_count,
            bk.title, bk.cover_url, a.name AS author
     FROM borrows b
     JOIN books bk ON bk.id = b.book_id
     JOIN authors a ON a.id = bk.author_id
     WHERE b.user_id = ?
     ORDER BY b.borrow_date DESC
     LIMIT ? OFFSET ?`,
    [userId, Number(limit), offset]
  );
  return { rows, total: Number(total) };
};

// ── Admin: toàn bộ lượt mượn ─────────────────────────────────────────────────
const findAll = async ({ page = 1, limit = 20, status = '' }) => {
  const offset  = (Math.max(1, Number(page)) - 1) * Number(limit);
  const where   = status ? 'WHERE b.status = ?' : '';
  const params  = status ? [status] : [];

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM borrows b ${where}`, params);
  const [rows] = await db.query(
    `SELECT b.id, b.borrow_date, b.due_date, b.return_date, b.status,
            b.fine_amount, b.fine_paid, b.renewed_count,
            u.full_name AS user_name, u.email,
            bk.title AS book_title,
            h.full_name AS handled_by_name
     FROM borrows b
     JOIN users u  ON u.id  = b.user_id
     JOIN books bk ON bk.id = b.book_id
     LEFT JOIN users h ON h.id = b.handled_by
     ${where}
     ORDER BY b.borrow_date DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );
  return { rows, total: Number(total) };
};

// ── Admin: quá hạn ────────────────────────────────────────────────────────────
const findOverdue = async () => {
  const [rows] = await db.query(
    `SELECT b.id, b.due_date, b.borrow_date,
            u.full_name, u.email,
            bk.title,
            DATEDIFF(CURRENT_DATE, b.due_date) AS days_overdue
     FROM borrows b
     JOIN users u  ON u.id  = b.user_id
     JOIN books bk ON bk.id = b.book_id
     WHERE b.status IN ('borrowing','renewed') AND b.due_date < CURRENT_DATE
     ORDER BY days_overdue DESC`
  );
  return rows;
};

// ── Admin: duyệt / từ chối ────────────────────────────────────────────────────
const updateStatus = async (borrowId, status, handledBy) => {
  await db.query(
    'UPDATE borrows SET status = ?, handled_by = ? WHERE id = ?',
    [status, handledBy, borrowId]
  );
};

module.exports = { create, returnBook, extendBorrow, findActiveByUser, findHistoryByUser, findAll, findOverdue, updateStatus };
