'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 3 — Borrow & Return System              ║
 * ║  Model: borrowModel.js                              ║
 * ╚══════════════════════════════════════════════════════╝
 */

const db = require('../config/db');

const DEFAULT_BORROW_DAYS = 14;
const MAX_RENEWALS        = 2;
const FINE_PER_DAY        = 1000; // 1,000 VND/ngày
const MAX_FINE            = 50000; // tối đa 50,000 VND

const markOverdue = async () => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Tìm các phiếu mượn ĐÃ ĐẾN HẠN nhưng chưa trả
    const [overdueBorrows] = await conn.query(`
      SELECT id, user_id, book_id 
      FROM borrows 
      WHERE status IN ('borrowing', 'renewed') 
        AND due_date < CURRENT_DATE
    `);

    // 2. Nếu có sách quá hạn, tiến hành cập nhật trạng thái
    if (overdueBorrows.length > 0) {
      const borrowIds = overdueBorrows.map(b => b.id);
      await conn.query(`
        UPDATE borrows 
        SET status = 'overdue' 
        WHERE id IN (?)
      `, [borrowIds]);
    }

    await conn.commit();
    
    // 3. Trả về danh sách để hệ thống đi rải thông báo
    return overdueBorrows; 
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

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
    if (!book || book.available_copies < 1)
      throw Object.assign(new Error('Sách hiện không còn bản để mượn'), { statusCode: 409 });

    // Kiểm tra user đang mượn cuốn này chưa
    const [[existing]] = await conn.query(
      `SELECT id FROM borrows
       WHERE user_id = ? AND book_id = ?
         AND status IN ('borrowing','renewed','overdue')`,
      [user_id, book_id]
    );
    if (existing)
      throw Object.assign(new Error('Bạn đang mượn cuốn sách này rồi'), { statusCode: 409 });

    const due_date = new Date();
    due_date.setDate(due_date.getDate() + DEFAULT_BORROW_DAYS);
    const dueDateStr = due_date.toISOString().split('T')[0];

    const [result] = await conn.query(
      `INSERT INTO borrows (user_id, book_id, handled_by, due_date, status)
      VALUES (?, ?, ?, ?, 'pending')`,
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

// ── Lấy chi tiết 1 phiếu mượn theo id ────────────────────────────────────────
// [BỔ SUNG] Controller cần hàm này để kiểm tra quyền trước khi trả/gia hạn
const findById = async (id) => {
  await markOverdue();
  const [rows] = await db.query(
    `SELECT b.*,
            bk.title    AS book_title,
            bk.cover_url,
            u.full_name AS user_name,
            u.email     AS user_email
     FROM borrows b
     JOIN books bk ON bk.id = b.book_id
     JOIN users u  ON u.id  = b.user_id
     WHERE b.id = ?`,
    [id]
  );
  return rows[0] || null;
};

// ── Trả sách ──────────────────────────────────────────────────────────────────
// [SỬA] Bỏ AND user_id = ? để employee có thể xác nhận trả thay user
//       Việc kiểm tra quyền được xử lý ở controller
const returnBook = async (borrowId, handledBy = null) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[borrow]] = await conn.query(
      `SELECT * FROM borrows
       WHERE id = ? AND status IN ('borrowing','renewed','overdue','returning')
       FOR UPDATE`,
      [borrowId]
    );
    if (!borrow)
      throw Object.assign(new Error('Không tìm thấy lượt mượn hợp lệ'), { statusCode: 404 });

    // Tính tiền phạt nếu quá hạn
    const today   = new Date();
    const dueDate = new Date(borrow.due_date);
    let fine_amount = 0;
    if (today > dueDate) {
      const days  = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      fine_amount = Math.min(days * FINE_PER_DAY, MAX_FINE);
    }

    const todayStr = today.toISOString().split('T')[0];
    await conn.query(`
      UPDATE borrows
      SET status = 'returned', return_date = ?, fine_amount = ?, handled_by = ?
      WHERE id = ?
    `, [todayStr, fine_amount, handledBy, borrowId]);

    await conn.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [borrow.book_id]
    );

    await conn.commit();
    return { fine_amount, fine_paid: borrow.fine_paid };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── Gia hạn ───────────────────────────────────────────────────────────────────
// [SỬA 1] Thêm transaction để đảm bảo UPDATE + INSERT chạy cùng nhau
// [SỬA 2] Thêm kiểm tra sách đã quá hạn chưa
const extendBorrow = async (borrowId, renewedBy = null) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[borrow]] = await conn.query(
      `SELECT * FROM borrows WHERE id = ? AND status IN ('borrowing','renewed')
      FOR UPDATE`,
      [borrowId]
    );
    if (!borrow)
      throw Object.assign(new Error('Không tìm thấy lượt mượn hợp lệ'), { statusCode: 404 });

    if (borrow.renewed_count >= MAX_RENEWALS)
      throw Object.assign(
        new Error(`Đã đạt giới hạn gia hạn (${MAX_RENEWALS} lần)`),
        { statusCode: 409 }
      );

    // [SỬA 2] Kiểm tra chưa quá hạn mới cho gia hạn
    const today = new Date().toISOString().split('T')[0];
    if (borrow.due_date < today)
      throw Object.assign(
        new Error('Sách đã quá hạn, vui lòng trả sách trước'),
        { statusCode: 409 }
      );

    const oldDue = new Date(borrow.due_date);
    const newDue = new Date(oldDue);
    newDue.setDate(newDue.getDate() + DEFAULT_BORROW_DAYS);
    const newDueStr = newDue.toISOString().split('T')[0];
    const oldDueStr = oldDue.toISOString().split('T')[0];

    await conn.query(
      `UPDATE borrows
       SET due_date = ?, renewed_count = renewed_count + 1, status = 'renewed'
       WHERE id = ?`,
      [newDueStr, borrowId]
    );

    await conn.query(
      `INSERT INTO borrow_renewals (borrow_id, renewed_by, old_due_date, new_due_date)
       VALUES (?, ?, ?, ?)`,
      [borrowId, renewedBy, oldDueStr, newDueStr]
    );

    await conn.commit();
    return {
      old_due_date:  oldDueStr,
      new_due_date:  newDueStr,
      renewed_count: borrow.renewed_count + 1,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── Sách đang mượn của user ───────────────────────────────────────────────────
const findActiveByUser = async (userId) => {
  const [rows] = await db.query(`
  SELECT
    b.id, b.book_id,
    b.due_date, b.borrow_date, b.status, b.renewed_count, b.fine_amount,
    bk.title, bk.cover_url,
    a.name AS author,
    (SELECT c.name FROM book_categories bc
     JOIN categories c ON c.id = bc.category_id
     WHERE bc.book_id = bk.id LIMIT 1) AS category
    FROM borrows b
    JOIN books bk ON bk.id = b.book_id
    JOIN authors a ON a.id = bk.author_id
    WHERE b.user_id = ?
      AND b.status IN ('pending','borrowing','renewed','overdue','returning')
    ORDER BY b.borrow_date DESC
  `, [userId]);
  return rows;
};

// ── Lịch sử mượn trả của user ────────────────────────────────────────────────
const findHistoryByUser = async (userId, { page = 1, limit = 10 }) => {
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM borrows
     WHERE user_id = ? AND status IN ('returned','cancelled','lost')`,
    [userId]
  );

  const [rows] = await db.query(`
    SELECT
      b.id, b.book_id,
      b.borrow_date, b.due_date, b.return_date, b.status,
      b.fine_amount, b.fine_paid, b.renewed_count,
      bk.title, bk.cover_url,
      a.name AS author,
      -- Lấy 1 category đầu tiên (tránh duplicate rows)
      (SELECT c.name FROM book_categories bc
       JOIN categories c ON c.id = bc.category_id
       WHERE bc.book_id = bk.id LIMIT 1) AS category,
      -- Lấy rating của user cho cuốn sách này
      (SELECT r.rating FROM reviews r
        WHERE r.borrow_id = b.id
          AND r.user_id = b.user_id
        LIMIT 1) AS user_rating
    FROM borrows b
    JOIN books bk ON bk.id = b.book_id
    JOIN authors a ON a.id = bk.author_id
    WHERE b.user_id = ?
      AND b.status IN ('returned', 'cancelled', 'lost')
    ORDER BY b.borrow_date DESC   -- ← thứ tự thời gian mới nhất trước
    LIMIT ? OFFSET ?
  `, [userId, Number(limit), offset]);

  return { rows, total: Number(total) };
};

// ── Admin/Employee: toàn bộ lượt mượn ────────────────────────────────────────
// [BỔ SUNG] Thêm filter theo user_id
const findAll = async ({ page = 1, limit = 20, status = '', user_id = '' }) => {
  const offset     = (Math.max(1, Number(page)) - 1) * Number(limit);
  const conditions = [];
  const params     = [];

  if (status)  { conditions.push('b.status = ?');  params.push(status); }
  if (user_id) { conditions.push('b.user_id = ?'); params.push(user_id); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM borrows b ${where}`,
    params
  );
  const [rows] = await db.query(
    `SELECT b.id, b.borrow_date, b.due_date, b.return_date, b.status,
            b.fine_amount, b.fine_paid, b.renewed_count,
            u.full_name  AS user_name,
            u.email,
            bk.title     AS book_title,
            c.name       AS category,
            h.full_name  AS handled_by_name
     FROM borrows b
     JOIN  users u  ON u.id  = b.user_id
     JOIN  books bk ON bk.id = b.book_id
     LEFT JOIN book_categories bc ON bc.book_id = bk.id
     LEFT JOIN categories c ON c.id = bc.category_id
     LEFT JOIN users h ON h.id = b.handled_by
     ${where}
     ORDER BY b.borrow_date DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );
  return { rows, total: Number(total) };
};

// ── Admin/Employee: danh sách quá hạn ────────────────────────────────────────
const findOverdue = async () => {
  const [rows] = await db.query(
    `SELECT b.id, b.due_date, b.borrow_date,
            u.full_name, u.email,
            bk.title, c.name AS category,
            DATEDIFF(CURRENT_DATE, b.due_date) AS days_overdue
     FROM borrows b
     JOIN users u  ON u.id  = b.user_id
     JOIN books bk ON bk.id = b.book_id
     LEFT JOIN book_categories bc ON bc.book_id = bk.id
     LEFT JOIN categories c ON c.id = bc.category_id
     WHERE b.status IN ('borrowing','renewed') AND b.due_date < CURRENT_DATE
     ORDER BY days_overdue DESC`
  );
  return rows;
};

// ── Admin: cập nhật status thủ công ──────────────────────────────────────────
const updateStatus = async (borrowId, status, handledBy) => {
  await db.query(
    'UPDATE borrows SET status = ?, handled_by = ? WHERE id = ?',
    [status, handledBy, borrowId]
  );
};

const approveBorrow = async (borrowId, handledBy) => {
  const [[borrow]] = await db.query(
    `SELECT * FROM borrows WHERE id = ? AND status = 'pending'`,
    [borrowId]
  );
  if (!borrow)
    throw Object.assign(new Error('Borrow request not found or already processed'), { statusCode: 404 });

  await db.query(
    `UPDATE borrows SET status = 'borrowing', handled_by = ? WHERE id = ?`,
    [handledBy, borrowId]
  );
};

const rejectBorrow = async (borrowId, handledBy) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[borrow]] = await conn.query(
      `SELECT * FROM borrows WHERE id = ? AND status = 'pending' FOR UPDATE`,
      [borrowId]
    );
    if (!borrow)
      throw Object.assign(new Error('Borrow request not found'), { statusCode: 404 });

    await conn.query(
      `UPDATE borrows SET status = 'cancelled', handled_by = ? WHERE id = ?`,
      [handledBy, borrowId]
    );

    // Hoàn lại available_copies vì lúc pending đã giảm rồi
    await conn.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [borrow.book_id]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const markLost = async (borrowId, handledBy) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[borrow]] = await conn.query(
      'SELECT * FROM borrows WHERE id = ? FOR UPDATE', [borrowId]
    );
    if (!borrow) throw Object.assign(new Error('Not found'), { statusCode: 404 });

    await conn.query(
      `UPDATE borrows SET status = 'lost', handled_by = ? WHERE id = ?`,
      [handledBy, borrowId]
    );

    // Hoàn lại available_copies vì sách không còn
    // await conn.query(
    //   'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
    //   [borrow.book_id]
    // );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// const requestReturn = async (borrowId) => {
//   const [[borrow]] = await db.query(
//     `SELECT * FROM borrows
//       WHERE id = ? AND status IN ('borrowing','renewed')
//       FOR UPDATE`,
//     [borrowId]
//   );
//   if (!borrow)    throw Object.assign(new Error('Không tìm thấy lượt mượn hợp lệ'), { statusCode: 404 });

//   await db.query(
//     `UPDATE borrows SET status = 'returning' WHERE id = ?`,
//     [borrowId]
//   );
// };

module.exports = {
  create,
  findById,
  returnBook,
  extendBorrow,
  findActiveByUser,
  findHistoryByUser,
  findAll,
  findOverdue,
  updateStatus,
  approveBorrow,
  rejectBorrow,
  markOverdue,
  markLost,
};