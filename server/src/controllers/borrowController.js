'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 3 — Borrow & Return System              ║
 * ║  Controller: borrowController.js                    ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Endpoints (user):
 *   POST /api/borrow
 *   PUT  /api/borrow/return/:id
 *   PUT  /api/borrow/extend/:id
 *   GET  /api/borrow/my-books
 *   GET  /api/borrow/history
 *
 * Endpoints (admin):
 *   GET  /api/admin/borrows
 *   GET  /api/admin/borrows/overdue
 *   PUT  /api/admin/borrows/approve/:id
 *   PUT  /api/admin/borrows/reject/:id
 */

const borrowModel = require('../models/borrowModel');
const { success, error, paginated } = require('../utils/response');

// ─── User endpoints ───────────────────────────────────────────────────────────

exports.createBorrow = async (req, res) => {
  try {
    const { book_id } = req.body;
    const id = await borrowModel.create({ user_id: req.user.id, book_id });
    return success(res, { borrow_id: id }, 'Tạo yêu cầu mượn thành công', 201);
  } catch (err) {
    console.error('[createBorrow]', err);
    return error(res, err.message || 'Lỗi server', err.statusCode || 500);
  }
};

exports.returnBook = async (req, res) => {
  try {
    const result = await borrowModel.returnBook(req.params.id, req.user.id);
    const msg = result.fine_amount > 0
      ? `Trả sách thành công. Tiền phạt: ${result.fine_amount.toLocaleString('vi-VN')}đ`
      : 'Trả sách thành công';
    return success(res, result, msg);
  } catch (err) {
    console.error('[returnBook]', err);
    return error(res, err.message || 'Lỗi server', err.statusCode || 500);
  }
};

exports.extendBorrow = async (req, res) => {
  try {
    const result = await borrowModel.extendBorrow(req.params.id, req.user.id);
    return success(res, result, `Gia hạn thành công đến ${result.new_due_date}`);
  } catch (err) {
    console.error('[extendBorrow]', err);
    return error(res, err.message || 'Lỗi server', err.statusCode || 500);
  }
};

exports.getMyBooks = async (req, res) => {
  try {
    const books = await borrowModel.findActiveByUser(req.user.id);
    return success(res, books);
  } catch (err) {
    console.error('[getMyBooks]', err);
    return error(res);
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { rows, total } = await borrowModel.findHistoryByUser(req.user.id, { page, limit });
    return paginated(res, rows, total, page, limit);
  } catch (err) {
    console.error('[getHistory]', err);
    return error(res);
  }
};

// ─── Admin endpoints ──────────────────────────────────────────────────────────

exports.getAllBorrows = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const { rows, total } = await borrowModel.findAll({ page, limit, status });
    return paginated(res, rows, total, page, limit);
  } catch (err) {
    console.error('[getAllBorrows]', err);
    return error(res);
  }
};

exports.getOverdue = async (_req, res) => {
  try {
    const rows = await borrowModel.findOverdue();
    return success(res, rows);
  } catch (err) {
    console.error('[getOverdue]', err);
    return error(res);
  }
};

exports.approveBorrow = async (req, res) => {
  try {
    await borrowModel.updateStatus(req.params.id, 'borrowing', req.user.id);
    return success(res, null, 'Đã duyệt yêu cầu mượn');
  } catch (err) {
    console.error('[approveBorrow]', err);
    return error(res);
  }
};

exports.rejectBorrow = async (req, res) => {
  try {
    await borrowModel.updateStatus(req.params.id, 'cancelled', req.user.id);
    return success(res, null, 'Đã từ chối yêu cầu mượn');
  } catch (err) {
    console.error('[rejectBorrow]', err);
    return error(res);
  }
};
