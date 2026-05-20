'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 3 — Borrow & Return System              ║
 * ║  Controller: borrowController.js                    ║
 * ╚══════════════════════════════════════════════════════╝
 */

const db = require('../config/db');
const borrowModel = require('../models/borrowModel');
const { success, error, paginated } = require('../utils/response');

// ─── Độc giả endpoints ─────────────────────────────────────────────────────────

exports.createBorrow = async (req, res) => {
  try {
    const { book_id } = req.body;
    // TỰ ĐỘNG TÍNH TOÁN HẠN TRẢ (Hôm nay + 14 ngày)
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14);
    const formattedDueDate = dueDate.toISOString().split('T')[0]; // Định dạng chuẩn YYYY-MM-DD cho MySQL

    // TRUYỀN THÊM due_date VÀO MODEL
    const id = await borrowModel.create({ 
      user_id: req.user.id, 
      book_id, 
      due_date: formattedDueDate
    });

    return success(res, { borrow_id: id }, 'Gửi yêu cầu mượn sách lên hệ thống thành công, vui lòng chờ phê duyệt!', 201);
  } catch (err) {
    console.error('[createBorrow Error]', err);
    return error(res, err.message || 'Lỗi hệ thống khi tạo yêu cầu mượn sách', err.statusCode || 500);
  }
};

exports.getMyBooks = async (req, res) => {
  try {
    const rows = await borrowModel.findCurrentlyBorrowingByUser(req.user.id);
    return success(res, rows);
  } catch (err) {
    console.error('[getMyBooks Error]', err);
    return error(res, 'Không thể lấy danh sách sách đang mượn', 500);
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { rows, total } = await borrowModel.findHistoryByUser(req.user.id, { page, limit });
    return paginated(res, rows, total, Number(page), Number(limit));
  } catch (err) {
    console.error('[getHistory Error]', err);
    return error(res, 'Không thể lấy lịch sử mượn trả', 500);
  }
};

exports.extendBorrow = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Thực hiện gia hạn an toàn trong Transaction
    await borrowModel.extendInTransaction(connection, req.params.id, req.user.id);

    await connection.commit();
    return success(res, null, 'Gia hạn thời gian trả sách thành công thêm 14 ngày!');
  } catch (err) {
    await connection.rollback();
    console.error('[extendBorrow Error]', err);
    return error(res, err.message || 'Lỗi hệ thống khi gia hạn sách', err.statusCode || 500);
  } finally {
    connection.release();
  }
};

// ─── Quản trị viên / Thủ thư endpoints ──────────────────────────────────────────

exports.getAllBorrows = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', search = '' } = req.query;
    const { rows, total } = await borrowModel.findAll({ page, limit, status, search });
    return paginated(res, rows, total, Number(page), Number(limit));
  } catch (err) {
    console.error('[getAllBorrows Error]', err);
    return error(res, 'Lỗi hệ thống khi lấy toàn bộ danh sách phiếu mượn', 500);
  }
};

exports.getOverdue = async (_req, res) => {
  try {
    const rows = await borrowModel.findOverdue();
    return success(res, rows);
  } catch (err) {
    console.error('[getOverdue Error]', err);
    return error(res, 'Lỗi hệ thống khi thống kê danh sách quá hạn', 500);
  }
};

exports.approveBorrow = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await borrowModel.approveInTransaction(connection, req.params.id, req.user.id);

    await connection.commit();
    return success(res, null, 'Đã phê duyệt phiếu mượn sách và trừ kho thành công.');
  } catch (err) {
    await connection.rollback();
    console.error('[approveBorrow Error]', err);
    return error(res, err.message || 'Lỗi hệ thống khi phê duyệt yêu cầu mượn', err.statusCode || 500);
  } finally {
    connection.release();
  }
};

exports.rejectBorrow = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await borrowModel.rejectInTransaction(connection, req.params.id, req.user.id);

    await connection.commit();
    return success(res, null, 'Đã từ chối yêu cầu mượn sách thành công.');
  } catch (err) {
    await connection.rollback();
    console.error('[rejectBorrow Error]', err);
    return error(res, err.message || 'Lỗi hệ thống khi xử lý từ chối phiếu mượn', err.statusCode || 500);
  } finally {
    connection.release();
  }
};

exports.returnBook = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { fineAmount } = await borrowModel.returnInTransaction(connection, req.params.id);

    await connection.commit();
    
    const message = fineAmount > 0 
      ? `Làm thủ tục trả sách thành công! Độc giả trả quá hạn, yêu cầu thu phí phạt: ${fineAmount.toLocaleString('vi-VN')} VND.` 
      : 'Làm thủ tục nhận lại sách trả về kho thành công (Phiếu mượn đúng hạn)!';

    return success(res, { fine_amount: fineAmount }, message);
  } catch (err) {
    await connection.rollback();
    console.error('[returnBook Error]', err);
    return error(res, err.message || 'Lỗi hệ thống khi làm thủ tục nhận sách trả', err.statusCode || 500);
  } finally {
    connection.release();
  }
};