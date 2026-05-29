'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 3 — Borrow & Return System              ║
 * ║  Controller: borrowController.js                    ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Endpoints (user):
 *   POST  /api/borrows
 *   GET   /api/borrows/my-books
 *   GET   /api/borrows/history
 *   POST  /api/borrows/extend/:id
 *
 * Endpoints (employee + admin):
 *   PUT   /api/borrows/return/:id
 *   PUT   /api/admin/borrows/approve/:id
 *   PUT   /api/admin/borrows/reject/:id
 *
 * Endpoints (admin):
 *   GET   /api/admin/borrows
 *   GET   /api/admin/borrows/overdue
 */

const borrowModel          = require('../models/borrowModel');
const notificationModel    = require('../models/notificationModel');
const { success, error, paginated } = require('../utils/response');

// ─── User endpoints ───────────────────────────────────────────────────────────

// POST /api/borrows — User gửi yêu cầu mượn
exports.createBorrow = async (req, res) => {
  try {
    const { book_id } = req.body;

    if (!book_id || isNaN(Number(book_id)))
      return error(res, 'book_id không hợp lệ', 400);

    const id = await borrowModel.create({
      user_id:    req.user.id,
      book_id:    Number(book_id),
      handled_by: req.user.role !== 'user' ? req.user.id : null,
    });

    // Lấy thông tin phiếu mượn để lấy tên sách, tên user cho thông báo
    const borrowDetail = await borrowModel.findById(id);

    // [THÊM MỚI] Gửi thông báo cho Admin/Employee
    await notificationModel.create({
      receiver_role: 'admin_employee',
      borrow_id: id,
      book_id: Number(book_id),
      type: 'system',
      title: 'Yêu cầu mượn sách mới',
      message: `Có user "${borrowDetail.user_name}" gửi yêu cầu mượn sách "${borrowDetail.book_title}".`
    });

    return success(res, { borrow_id: id }, 'Tạo yêu cầu mượn thành công', 201);
  } catch (err) {
    console.error('[createBorrow]', err);
    return error(res, err.message || 'Lỗi server', err.statusCode || 500);
  }
};

// PUT /api/borrows/return/:id  — chỉ employee và admin
// [SỬA] Kiểm tra phiếu tồn tại trước, employee/admin mới xác nhận trả được
exports.returnBook = async (req, res) => {
  try {
    const borrow = await borrowModel.findById(req.params.id);
    if (!borrow)
      return error(res, 'Không tìm thấy phiếu mượn', 404);

    const result = await borrowModel.returnBook(req.params.id, req.user.id);

    const msg = result.fine_amount > 0
      ? `Trả sách thành công. Tiền phạt: ${result.fine_amount.toLocaleString('vi-VN')}đ`
      : 'Trả sách thành công';
      
    if (result.fine_amount > 0) {
      await notificationModel.create({
        receiver_role: 'user',
        user_id: borrow.user_id,
        borrow_id: borrow.id,
        book_id: borrow.book_id,
        type: 'fine',
        title: 'Trả sách trễ hạn - Có phí phạt',
        message: `Bạn đã trả cuốn sách "${borrow.book_title}". Tuy nhiên bạn bị phạt ${result.fine_amount.toLocaleString('vi-VN')} VNĐ do trễ hạn. Vui lòng thanh toán cho thủ thư.`
      });
    } else {
      await notificationModel.create({
        receiver_role: 'user',
        user_id: borrow.user_id,
        borrow_id: borrow.id,
        book_id: borrow.book_id,
        type: 'returned',
        title: 'Trả sách thành công',
        message: `Yêu cầu trả cuốn sách "${borrow.book_title}" của bạn đã được xác nhận thành công. Cảm ơn bạn!`
      });
    }
    return success(res, result, msg);
  } catch (err) {
    console.error('[returnBook]', err);
    return error(res, err.message || 'Lỗi server', err.statusCode || 500);
  }
};

// POST /api/borrows/extend/:id
// [SỬA] Kiểm tra phiếu có thuộc về user không trước khi gia hạn
exports.extendBorrow = async (req, res) => {
  try {
    const borrow = await borrowModel.findById(req.params.id);
    if (!borrow)
      return error(res, 'Không tìm thấy phiếu mượn', 404);

    // User chỉ gia hạn phiếu của chính mình
    // Employee/Admin có thể gia hạn thay
    if (req.user.role === 'user' && borrow.user_id !== req.user.id)
      return error(res, 'Bạn không có quyền gia hạn phiếu này', 403);

    const result = await borrowModel.extendBorrow(req.params.id, req.user.id);
    return success(res, result, `Gia hạn thành công đến ${result.new_due_date}`);
  } catch (err) {
    console.error('[extendBorrow]', err);
    return error(res, err.message || 'Lỗi server', err.statusCode || 500);
  }
};

// GET /api/borrows/my-books — sách đang mượn
exports.getMyBooks = async (req, res) => {
  try {
    const books = await borrowModel.findActiveByUser(req.user.id);
    return success(res, books);
  } catch (err) {
    console.error('[getMyBooks]', err);
    return error(res);
  }
};

// GET /api/borrows/history — lịch sử mượn trả
exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { rows, total } = await borrowModel.findHistoryByUser(req.user.id, { page, limit });
    return paginated(res, rows, total, page, limit);
  } catch (err) {
    console.error('[getHistory]', err);
    return error(res);
  }
};

// ─── Employee + Admin endpoints ───────────────────────────────────────────────

// GET /api/admin/borrows — toàn bộ phiếu mượn (có filter)
// [BỔ SUNG] Thêm filter user_id từ query
exports.getAllBorrows = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', user_id = '' } = req.query;
    const { rows, total } = await borrowModel.findAll({ page, limit, status, user_id });
    return paginated(res, rows, total, page, limit);
  } catch (err) {
    console.error('[getAllBorrows]', err);
    return error(res);
  }
};

// GET /api/admin/borrows/overdue — danh sách quá hạn
exports.getOverdue = async (_req, res) => {
  try {
    const rows = await borrowModel.findOverdue();
    return success(res, rows);
  } catch (err) {
    console.error('[getOverdue]', err);
    return error(res);
  }
};

// PUT /api/admin/borrows/approve/:id — Admin duyệt mượn
exports.approveBorrow = async (req, res) => {
  try {
    const borrow = await borrowModel.findById(req.params.id);
    if (!borrow)
      return error(res, 'Không tìm thấy phiếu mượn', 404);

    await borrowModel.updateStatus(req.params.id, 'borrowing', req.user.id);
    
    // Bắn thông báo về cho User
    await notificationModel.create({
      receiver_role: 'user',  // Khai báo rõ gửi cho user
      user_id: borrow.user_id,
      borrow_id: borrow.id,
      book_id: borrow.book_id,
      type: 'approved',
      title: 'Yêu cầu mượn sách được duyệt',
      message: `Thủ thư đã duyệt phiếu mượn #${borrow.id}. Vui lòng đến thư viện nhận sách "${borrow.book_title}" của bạn.`
    });
    return success(res, null, 'Đã duyệt yêu cầu mượn');
  } catch (err) {
    console.error('[approveBorrow]', err);
    return error(res);
  }
};

// PUT /api/admin/borrows/reject/:id — Admin từ chối mượn
exports.rejectBorrow = async (req, res) => {
  try {
    const borrow = await borrowModel.findById(req.params.id);
    if (!borrow)
      return error(res, 'Không tìm thấy phiếu mượn', 404);
      
    await borrowModel.rejectBorrow(req.params.id, req.user.id);
    
    // Gửi báo cho User
    await notificationModel.create({
      receiver_role: 'user',
      user_id: borrow.user_id,
      borrow_id: borrow.id,
      book_id: borrow.book_id,
      type: 'system',
      title: 'Yêu cầu mượn sách bị từ chối',
      message: `Rất tiếc, yêu cầu mượn sách "${borrow.book_title}" (phiếu #${borrow.id}) của bạn đã bị từ chối.`
    });

    // Thông báo nội bộ cho Admin/Employee (Ghi nhận log hệ thống)
    await notificationModel.create({
      receiver_role: 'admin_employee', // Sửa lại để nhảy vào hộp thư chung Admin
      borrow_id: borrow.id,
      book_id: borrow.book_id,
      type: 'system',
      title: 'Đã từ chối yêu cầu',
      message: `Quản trị viên đã từ chối mượn sách '${borrow.book_title}' của user '${borrow.user_name}'.`
    });
    
    return success(res, null, 'Đã từ chối yêu cầu mượn');
  } catch (err) {
    console.error('[rejectBorrow]', err);
    return error(res);
  }
};

// PATCH /api/borrows/request-return/:id — User xin trả sách
exports.requestReturn = async (req, res) => {
  try {
    const borrow = await borrowModel.findById(req.params.id);
    if (!borrow)
      return error(res, 'Borrow record not found', 404);

    if (req.user.role === 'user' && borrow.user_id !== req.user.id)
      return error(res, 'Access denied', 403);

    if (!['borrowing','renewed','overdue'].includes(borrow.status))
      return error(res, 'This borrow cannot be returned at this stage', 400);

    await borrowModel.updateStatus(req.params.id, 'returning', req.user.id);
    
    // [THÊM MỚI] Bắn thông báo cho Admin/Employee duyệt trả
    await notificationModel.create({
      receiver_role: 'admin_employee',
      borrow_id: borrow.id,
      book_id: borrow.book_id,
      type: 'system',
      title: 'Yêu cầu trả sách mới',
      message: `User "${borrow.user_name}" vừa gửi yêu cầu trả cuốn sách "${borrow.book_title}". Vui lòng kiểm tra và xác nhận.`
    });

    return success(res, null, 'Return request sent. Awaiting admin confirmation.');
  } catch (err) {
    console.error('[requestReturn]', err);
    return error(res);
  }
};

// PATCH /api/borrows/lost/:id — Admin/Employee đánh dấu mất sách
exports.markLost = async (req, res) => {
  try {
    const borrow = await borrowModel.findById(req.params.id);
    if (!borrow)
      return error(res, 'Borrow record not found', 404);

    if (borrow.status === 'returned' || borrow.status === 'lost')
      return error(res, 'Book is already returned or marked as lost', 400);

    await borrowModel.markLost(req.params.id, req.user.id);
    return success(res, null, 'Book marked as lost. Copy count updated.');
  } catch (err) {
    console.error('[markLost]', err);
    return error(res);
  }
};

// GET /api/borrows/:id — chi tiết phiếu mượn
exports.getBorrowById = async (req, res) => {
  try {
    const borrow = await borrowModel.findById(req.params.id);
    if (!borrow)
      return error(res, 'Borrow record not found', 404);
    return success(res, borrow);
  } catch (err) {
    console.error('[getBorrowById]', err);
    return error(res);
  }
};