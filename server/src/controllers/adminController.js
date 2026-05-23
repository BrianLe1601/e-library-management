'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 4 — Admin Dashboard & Reports           ║
 * ║  Controller: adminController.js                     ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Endpoints:
 *   GET    /api/admin/stats
 *   GET    /api/admin/reports
 *   GET    /api/admin/reports/top-books
 *   GET    /api/admin/reports/export
 *   GET    /api/admin/users
 *   PATCH  /api/admin/users/:id/status
 *   DELETE /api/admin/users/:id
 *   GET    /api/admin/borrows          (từ TV3)
 *   GET    /api/admin/borrows/overdue  (từ TV3)
 *   PUT    /api/admin/borrows/approve/:id
 *   PUT    /api/admin/borrows/reject/:id
 */

const reportModel  = require('../models/reportModel');
const userModel    = require('../models/userModel');
const borrowCtrl   = require('./borrowController');
const bcrypt = require('bcrypt');
const { success, error, paginated } = require('../utils/response');

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
exports.getStats = async (_req, res) => {
  try {
    const stats = await reportModel.getStats();
    return success(res, stats);
  } catch (err) {
    console.error('[getStats]', err);
    return error(res);
  }
};

// ── GET /api/admin/reports ────────────────────────────────────────────────────
exports.getReports = async (req, res) => {
  try {
    const { from, to, type, page = 1, limit = 20 } = req.query;
    const { rows, total } = await reportModel.getReports({ from, to, type, page, limit });
    return paginated(res, rows, total, page, limit);
  } catch (err) {
    console.error('[getReports]', err);
    return error(res);
  }
};

// ── GET /api/admin/reports/top-books ─────────────────────────────────────────
exports.getTopBooks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const books = await reportModel.getTopBooks(limit);
    return success(res, books);
  } catch (err) {
    console.error('[getTopBooks]', err);
    return error(res);
  }
};

// ── GET /api/admin/reports/export ────────────────────────────────────────────
exports.exportReport = async (req, res) => {
  try {
    const { from, to, type = 'all', format = 'json' } = req.query;
    const { rows } = await reportModel.getReports({ from, to, type: type === 'all' ? '' : type, page: 1, limit: 1000 });

    /*
     * TODO (TV4): Tích hợp thư viện xuất file thật sự:
     *   PDF   → pdfkit / puppeteer
     *   Excel → exceljs
     *
     * Hiện tại trả JSON mockup kèm preview 5 dòng đầu.
     */
    return res.json({
      success:     true,
      message:     `[Mockup] Sẽ xuất ${format.toUpperCase()} trong production`,
      export_info: { format, total_records: rows.length, filter: { from, to, type }, generated_at: new Date().toISOString() },
      preview:     rows.slice(0, 5),
    });
  } catch (err) {
    console.error('[exportReport]', err);
    return error(res);
  }
};

// ── GET /api/admin/users ──────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const { rows, total } = await userModel.getUsers({ role, status, search, page, limit });
    return paginated(res, rows, total, page, limit);
  } catch (err) {
    console.error('[getUsers]', err);
    return error(res);
  }
};

// ── PATCH /api/admin/users/:id/status ────────────────────────────────────────
exports.toggleUserStatus = async (req, res) => {
  try {
    const result = await userModel.toggleUserStatus(req.params.id);
    const msg = result.status === 'active' ? 'User account unlocked successfully' : 'User account locked successfully';
    return success(res, result, msg);
  } catch (err) {
    console.error('[toggleUserStatus]', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    await userModel.deleteUser(req.params.id);
    return success(res, null, 'User deleted successfully');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2')
      return error(res, 'Cannot delete: related data exists', 409);
    console.error('[deleteUser]', err);
    return error(res, err.message, err.statusCode || 500);
  }
};

// ── PUT /api/admin/users/:id/role ───────────────────────────────────────────
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const id = req.params.id;

    const validRoles = ['user', 'employee', 'admin'];
    if (!validRoles.includes(role)) {
      return error(res, 'Role is invalid', 400);
    }

    const isUpdated = await userModel.updateUserRole(id, role);
    if (!isUpdated) {
      return error(res, 'User not found', 404);
    }
    return success(res, { id: id, role }, 'Role updated successfully');
  } catch (err) {
    console.error('[updateUserRole] Error:', err);
    return error(res, 'Internal server error', 500);
  }
};

// ── POST /api/admin/users ───────────────────────────────────────────────
exports.createUser = async (req, res) => {
  try {
    const { full_name, email, password, phone, role } = req.body;

    // 1. Kiểm tra role hợp lệ (bảo mật thêm 1 lớp)
    const validRoles = ['user', 'employee', 'admin'];
    if (!validRoles.includes(role)) {
      return error(res, 'Role is invalid', 400);
    }

    // 2. Mã hóa mật khẩu do Admin nhập vào
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Đẩy xuống Model để lưu vào Database
    const newUserId = await userModel.createUserByAdmin({
      full_name,
      email,
      password: hashedPassword,
      phone,
      role
    });

    return success(res, { id: newUserId }, 'User created successfully', 201);
    
  } catch (err) {
    // Bắt lỗi trùng Email (Mã lỗi của MySQL khi vi phạm UNIQUE constraint)
    if (err.code === 'ER_DUP_ENTRY') {
      return error(res, 'Email already exists', 409);
    }
    
    console.error('[createUser]', err);
    return error(res, 'Internal server error', 500);
  }
};

// ── Borrow admin endpoints (re-export từ borrowController – TV3) ──────────────
exports.getAllBorrows  = borrowCtrl.getAllBorrows;
exports.getOverdue    = borrowCtrl.getOverdue;
exports.approveBorrow = borrowCtrl.approveBorrow;
exports.rejectBorrow  = borrowCtrl.rejectBorrow;
