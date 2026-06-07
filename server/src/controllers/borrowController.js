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
      return error(res, 'book_id not valid', 400);

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
      type: 'borrow_request',
      title: 'Borrow book request',
      message: `User "${borrowDetail.user_name}" send borrow request for "${borrowDetail.book_title}".`
    });

    return success(res, { borrow_id: id }, 'Borrow request created', 201);
  } catch (err) {
    console.error('[createBorrow]', err);
    return error(res, err.message || 'Server error', err.statusCode || 500);
  }
};

// PUT /api/borrows/return/:id  — chỉ employee và admin
// [SỬA] Kiểm tra phiếu tồn tại trước, employee/admin mới xác nhận trả được
exports.returnBook = async (req, res) => {
  try {
    const borrow = await borrowModel.findById(req.params.id);
    if (!borrow)
      return error(res, 'Borrow record not found', 404);

    const result = await borrowModel.returnBook(req.params.id, req.user.id);

    const msg = result.fine_amount > 0
      ? `Returned successfully. You have to pay ${result.fine_amount.toLocaleString('vi-VN')}đ`
      : 'Returned successfully';
      
    if (result.fine_amount > 0) {
      await notificationModel.create({
        receiver_role: 'user',
        user_id: borrow.user_id,
        borrow_id: borrow.id,
        book_id: borrow.book_id,
        type: 'fine',
        title: 'Returned with fine',
        message: `You have returned "${borrow.book_title}". However, you need to pay ${result.fine_amount.toLocaleString('vi-VN')} VNĐ due to late. Please come to the library to pay the fine.`
      });
    } else {
      await notificationModel.create({
        receiver_role: 'user',
        user_id: borrow.user_id,
        borrow_id: borrow.id,
        book_id: borrow.book_id,
        type: 'returned',
        title: 'Returned successfully',
        message: `You have returned "${borrow.book_title}" successfully. Thanks for using our services!`
      });
    }
    return success(res, result, msg);
  } catch (err) {
    console.error('[returnBook]', err);
    return error(res, err.message || 'Server error', err.statusCode || 500);
  }
};

// POST /api/borrows/extend/:id
// [SỬA] Kiểm tra phiếu có thuộc về user không trước khi gia hạn
exports.extendBorrow = async (req, res) => {
  try {
    // 1. Lấy thông tin phiếu mượn
    const borrow = await borrowModel.findById(req.params.id);
    if (!borrow) {
      return error(res, 'Cannot find borrow', 404);
    }

    // 2. Kiểm tra quyền: User chỉ được gia hạn phiếu của mình, Admin/Employee có quyền gia hạn thay
    if (req.user.role === 'user' && borrow.user_id !== req.user.id) {
      return error(res, 'You are not allowed to extend this borrow', 403);
    }

    // 3. Xử lý logic DB (cập nhật ngày, cộng số lượt gia hạn)
    const result = await borrowModel.extendBorrow(req.params.id, req.user.id);

    // 4. Bắn thông báo nội bộ cho Admin/Employee
    await notificationModel.create({
      receiver_role: 'admin_employee',
      borrow_id: borrow.id,
      book_id: borrow.book_id,
      type: 'renew',
      title: 'Book have been renewed',
      message: `"${borrow.book_title}" of "${borrow.user_name || 'User'}" have been renewed ( ${result.renewed_count} times). New due date: ${result.new_due_date}.`
    });

    // 5. Bắn thông báo xác nhận cho User
    await notificationModel.create({
      receiver_role: 'user',
      user_id: borrow.user_id,
      borrow_id: borrow.id,
      book_id: borrow.book_id,
      type: 'renew',
      title: 'Book have been renewed successfully',
      message: `Book "${borrow.book_title}" renewed successfully. New due date: ${result.new_due_date}.`
    });

    // 6. Trả về Response chuẩn theo format dự án của bạn
    return success(res, result, `Renewed successfully. New due date: ${result.new_due_date}`);

  } catch (err) {
    console.error('[extendBorrow Error]', err);
    // Bắt đúng statusCode từ dưới Model ném lên (VD: 409 khi quá 2 lần hoặc quá hạn)
    return error(res, err.message || 'Server error occurred while extending', err.statusCode || 500);
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
    const { rows, total } = await borrowModel.findHistoryByUser(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return res.json({
      success: true,
      data: rows,
      pagination: {
        page:       parseInt(page),
        limit:      parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('[getHistory]', err);
    return error(res, 'Server error', 500);
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
      return error(res, 'Borrow record not found', 404);

    await borrowModel.updateStatus(req.params.id, 'borrowing', req.user.id);
    
    // Bắn thông báo về cho User
    await notificationModel.create({
      receiver_role: 'user',  // Khai báo rõ gửi cho user
      user_id: borrow.user_id,
      borrow_id: borrow.id,
      book_id: borrow.book_id,
      type: 'approved',
      title: 'Request your book has been approved',
      message: `Your request to borrow #${borrow.id} has been approved by ELibrary. Please come to the library to pick up "${borrow.book_title}".`
    });
    return success(res, null, 'Borrow approved');
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
      return error(res, 'Can not find borrow', 404);
      
    await borrowModel.rejectBorrow(req.params.id, req.user.id);
    
    // Gửi báo cho User
    await notificationModel.create({
      receiver_role: 'user',
      user_id: borrow.user_id,
      borrow_id: borrow.id,
      book_id: borrow.book_id,
      type: 'rejected',
      title: 'Request your book has been rejected',
      message: `Sorry, your borrow request for "${borrow.book_title}" (Borrow #${borrow.id}) has been rejected.`
    });

    // Thông báo nội bộ cho Admin/Employee (Ghi nhận log hệ thống)
    await notificationModel.create({
      receiver_role: 'admin_employee',
      borrow_id: borrow.id,
      book_id: borrow.book_id,
      type: 'rejected',
      title: 'Rejected borrow request',
      message: `ELibrary rejected borrow request #${borrow.id} for '${borrow.book_title}' of '${borrow.user_name}'.`
    });
    
    return success(res, null, 'Borrow request rejected');
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
      type: 'return_request',
      title: 'Return book request',
      message: `User "${borrow.user_name}" request to return "${borrow.book_title}". Please check and confirm.`
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