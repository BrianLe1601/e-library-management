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

// ── 1. Tạo yêu cầu mượn sách (User gửi yêu cầu, trạng thái 'pending') ──────────
const create = async ({ user_id, book_id }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Khóa dòng và kiểm tra số lượng sách còn sẵn trong kho không
    const [[book]] = await conn.query(
      'SELECT id, title, available_copies FROM books WHERE id = ? FOR UPDATE',
      [book_id]
    );
    if (!book) {
      throw Object.assign(new Error('Cuốn sách yêu cầu không tồn tại trên hệ thống'), { statusCode: 404 });
    }
    if (book.available_copies < 1) {
      throw Object.assign(new Error(`Sách "${book.title}" hiện tại đã hết bản có sẵn trong kho`), { statusCode: 409 });
    }

    // Kiểm tra độc giả có đang giữ cuốn này ở trạng thái chưa trả hay không
    const [[existing]] = await conn.query(
      `SELECT id FROM borrows WHERE user_id = ? AND book_id = ? AND status IN ('pending', 'borrowing', 'renewed', 'overdue')`,
      [user_id, book_id]
    );
    if (existing) {
      throw Object.assign(new Error('Bạn đã đăng ký mượn cuốn sách này và chưa hoàn trả'), { statusCode: 400 });
    }

    // Tạo phiếu mượn ở trạng thái chờ duyệt 'pending'
    // Lưu ý: Sách chỉ thực sự trừ kho KHI ĐƯỢC THỦ THƯ DUYỆT (approve) để tránh giữ chỗ ảo
    const [result] = await conn.query(
      `INSERT INTO borrows (user_id, book_id, status) VALUES (?, ?, 'pending')`,
      [user_id, book_id]
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

// ── 2. Xử lý Duyệt chấp nhận cho mượn sách (Transaction) ────────────────────────
const approveInTransaction = async (connection, borrowId, adminId) => {
  // Lấy thông tin phiếu mượn để xử lý kho sách
  const [[borrow]] = await connection.query(
    'SELECT book_id, status FROM borrows WHERE id = ? FOR UPDATE',
    [borrowId]
  );
  if (!borrow) throw Object.assign(new Error('Không tìm thấy yêu cầu mượn sách'), { statusCode: 404 });
  if (borrow.status !== 'pending') throw Object.assign(new Error('Yêu cầu này đã được xử lý trước đó'), { statusCode: 400 });

  // Kiểm tra lại kho sách một lần nữa tại thời điểm duyệt
  const [[book]] = await connection.query(
    'SELECT available_copies FROM books WHERE id = ? FOR UPDATE',
    [borrow.book_id]
  );
  if (book.available_copies < 1) throw Object.assign(new Error('Sách trong kho đã vừa hết, không thể duyệt'), { statusCode: 409 });

  // 1. Trừ số lượng sách khả dụng trong kho
  await connection.query(
    'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
    [borrow.book_id]
  );

  // 2. Chuyển trạng thái phiếu mượn sang 'borrowing' và áp ngày hẹn trả
  const borrowDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(borrowDate.getDate() + DEFAULT_BORROW_DAYS);

  await connection.query(
    `UPDATE borrows 
     SET status = 'borrowing', borrow_date = ?, due_date = ?, handled_by = ? 
     WHERE id = ?`,
    [borrowDate, dueDate, adminId, borrowId]
  );
};

// ── 3. Xử lý Từ chối yêu cầu mượn sách ──────────────────────────────────────────
const rejectInTransaction = async (connection, borrowId, adminId) => {
  const [[borrow]] = await connection.query('SELECT status FROM borrows WHERE id = ? FOR UPDATE', [borrowId]);
  if (!borrow) throw Object.assign(new Error('Không tìm thấy yêu cầu mượn'), { statusCode: 404 });
  if (borrow.status !== 'pending') throw Object.assign(new Error('Yêu cầu này đã được xử lý từ trước'), { statusCode: 400 });

  await connection.query(
    "UPDATE borrows SET status = 'rejected', handled_by = ? WHERE id = ?",
    [adminId, borrowId]
  );
};

// ── 4. Nghiệp vụ Trả Sách (Thủ thư thực hiện tại quầy) ──────────────────────────
const returnInTransaction = async (connection, borrowId) => {
  const [[borrow]] = await connection.query(
    'SELECT book_id, status, due_date FROM borrows WHERE id = ? FOR UPDATE',
    [borrowId]
  );
  if (!borrow) throw Object.assign(new Error('Không tìm thấy thông tin phiếu mượn'), { statusCode: 404 });
  if (['returned', 'rejected', 'pending'].includes(borrow.status)) {
    throw Object.assign(new Error('Phiếu mượn này đang ở trạng thái không thể làm thủ tục trả sách'), { statusCode: 400 });
  }

  // 1. Cộng trả lại số lượng sách vào kho
  await connection.query(
    'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
    [borrow.book_id]
  );

  // 2. Tính toán tiền phạt nếu trả quá hạn (Ví dụ: 5,000 VND / 1 ngày quá hạn)
  const currentDate = new Date();
  const dueDate = new Date(borrow.due_date);
  let fineAmount = 0;

  if (currentDate > dueDate) {
    const diffTime = Math.abs(currentDate - dueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    fineAmount = diffDays * 5000; // Đơn vị tính tiền phạt
  }

  // 3. Cập nhật phiếu mượn sang trạng thái 'returned'
  await connection.query(
    `UPDATE borrows 
     SET status = 'returned', return_date = CURRENT_TIMESTAMP, fine_amount = ? 
     WHERE id = ?`,
    [fineAmount, borrowId]
  );

  return { fineAmount };
};

// ── 5. Nghiệp vụ Gia Hạn Sách (Độc giả hoặc thủ thư thực hiện) ─────────────────────
const extendInTransaction = async (connection, borrowId, userId) => {
  const [[borrow]] = await connection.query(
    'SELECT user_id, status, due_date, renewed_count FROM borrows WHERE id = ? FOR UPDATE',
    [borrowId]
  );

  if (!borrow) throw Object.assign(new Error('Không tìm thấy phiếu mượn'), { statusCode: 404 });
  
  // Chặn trường hợp tài khoản user khác hack API để gia hạn phiếu mượn của người khác
  if (userId && borrow.user_id !== userId) {
    throw Object.assign(new Error('Hành động bất hợp pháp: Bạn không sở hữu phiếu mượn này'), { statusCode: 403 });
  }

  if (!['borrowing', 'renewed'].includes(borrow.status)) {
    throw Object.assign(new Error('Sách chưa được duyệt mượn hoặc đã trả, không thể gia hạn'), { statusCode: 400 });
  }

  if (borrow.renewed_count >= MAX_RENEWALS) {
    throw Object.assign(new Error(`Cuốn sách này đã đạt giới hạn gia hạn tối đa (${MAX_RENEWALS} lần)`), { statusCode: 400 });
  }

  // Kiểm tra nếu phiếu mượn đã quá hạn thì bắt buộc phải ra quầy trả phạt, không được tự gia hạn online
  const oldDueDate = new Date(borrow.due_date);
  if (new Date() > oldDueDate) {
    throw Object.assign(new Error('Sách đã quá hạn hoàn trả, vui lòng tới thư viện nộp phạt và gia hạn trực tiếp tại quầy'), { statusCode: 400 });
  }

  // Tính toán ngày hẹn trả mới
  const newDueDate = new Date(oldDueDate);
  newDueDate.setDate(newDueDate.getDate() + DEFAULT_BORROW_DAYS);

  // 1. Cập nhật bảng chính borrows
  await connection.query(
    `UPDATE borrows 
     SET status = 'renewed', due_date = ?, renewed_count = renewed_count + 1 
     WHERE id = ?`,
    [newDueDate, borrowId]
  );

  // 2. Ghi lịch sử chi tiết vào bảng borrow_renewals (Vá lỗi đồng bộ DB)
  await connection.query(
    `INSERT INTO borrow_renewals (borrow_id, renewed_by, old_due_date, new_due_date) 
     VALUES (?, ?, ?, ?)`,
    [borrowId, userId, oldDueDate, newDueDate]
  );
};

// ── 6. Các hàm Query hiển thị danh sách dữ liệu (Read-only) ────────────────────────

const findCurrentlyBorrowingByUser = async (userId) => {
  const [rows] = await db.query(
    `SELECT b.id AS borrow_id, b.borrow_date, b.due_date, b.status, b.renewed_count,
            bk.id AS book_id, bk.title, bk.cover_url,
            a.name AS author
     FROM borrows b
     JOIN books bk ON bk.id = b.book_id
     JOIN authors a ON a.id = bk.author_id
     WHERE b.user_id = ? AND b.status IN ('borrowing', 'renewed', 'overdue')
     ORDER BY b.due_date ASC`,
    [userId]
  );
  return rows;
};

const findHistoryByUser = async (userId, { page = 1, limit = 10 }) => {
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [[{ total }]] = await db.query(
    "SELECT COUNT(*) AS total FROM borrows WHERE user_id = ? AND status IN ('returned', 'rejected')",
    [userId]
  );

  const [rows] = await db.query(
    `SELECT b.id AS borrow_id, b.borrow_date, b.due_date, b.return_date, b.status, b.fine_amount,
            bk.title, bk.cover_url
     FROM borrows b
     JOIN books bk ON bk.id = b.book_id
     WHERE b.user_id = ? AND b.status IN ('returned', 'rejected')
     ORDER BY b.return_date DESC
     LIMIT ? OFFSET ?`,
    [userId, Number(limit), offset]
  );
  return { rows, total: Number(total) };
};

const findAll = async ({ page = 1, limit = 20, status = '', search = '' }) => {
  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('b.status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR bk.title LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total 
     FROM borrows b 
     JOIN users u ON u.id = b.user_id
     JOIN books bk ON bk.id = b.book_id 
     ${where}`,
    params
  );

  const [rows] = await db.query(
    `SELECT b.*,
            u.full_name AS user_name, u.email AS user_email,
            bk.title AS book_title, bk.cover_url,
            h.full_name AS handled_by_name
     FROM borrows b
     JOIN users u  ON u.id  = b.user_id
     JOIN books bk ON bk.id = b.book_id
     LEFT JOIN users h ON h.id = b.handled_by
     ${where}
     ORDER BY b.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );
  return { rows, total: Number(total) };
};

const findOverdue = async () => {
  const [rows] = await db.query(
    `SELECT b.id, b.due_date, b.borrow_date, b.status,
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

module.exports = {
  create,
  approveInTransaction,
  rejectInTransaction,
  returnInTransaction,
  extendInTransaction,
  findCurrentlyBorrowingByUser,
  findHistoryByUser,
  findAll,
  findOverdue
};
