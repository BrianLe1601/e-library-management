'use strict';
/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  THÀNH VIÊN 4 — Admin Dashboard & Reports           ║
 * ║  Controller: adminController.js                     ║
 * ╚══════════════════════════════════════════════════════╝
 */

const reportModel = require('../models/reportModel');
const borrowModel = require('../models/borrowModel');
const { success, error, paginated } = require('../utils/response');

// ─── Dashboard & Reports ──────────────────────────────────────────────────────

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
exports.getStats = async (_req, res) => {
  try {
    const stats = await reportModel.getStats();
    return success(res, stats);
  } catch (err) {
    console.error('[Admin getStats Error]', err);
    return error(res, 'Lỗi hệ thống khi lấy số liệu thống kê Dashboard', 500);
  }
};

// ── GET /api/admin/reports ────────────────────────────────────────────────────
exports.getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const reportData = await reportModel.getReports({ startDate, endDate });
    return success(res, reportData);
  } catch (err) {
    console.error('[Admin getReports Error]', err);
    return error(res, 'Lỗi hệ thống khi thiết lập báo cáo doanh thu', 500);
  }
};

// ── GET /api/admin/reports/top-books ─────────────────────────────────────────
exports.getTopBooks = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const books = await reportModel.getTopBooks(limit);
    return success(res, books);
  } catch (err) {
    console.error('[Admin getTopBooks Error]', err);
    return error(res, 'Lỗi hệ thống khi lấy danh sách sách thịnh hành', 500);
  }
};

// ── GET /api/admin/reports/export ────────────────────────────────────────────
exports.exportReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportModel.getReports({ startDate, endDate });
    const topBooks = await reportModel.getTopBooks(5);

    // Chuẩn bị cấu trúc dữ liệu thô sạch sẽ, sẵn sàng để Frontend tự động parse ra định dạng CSV/Excel
    return success(res, {
      summary: data,
      top_performing_books: topBooks,
      exported_at: new Date().toISOString()
    }, 'Xuất dữ liệu báo cáo thành công');
  } catch (err) {
    console.error('[Admin exportReport Error]', err);
    return error(res, 'Gặp lỗi trong quá trình đóng gói tệp tin báo cáo', 500);
  }
};

// ─── User Management ──────────────────────────────────────────────────────────

// ── GET /api/admin/users ──────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { role = '', is_active = '', search = '', page = 1, limit = 10 } = req.query;
    const { rows, total } = await reportModel.getUsers({ role, is_active, search, page, limit });
    return paginated(res, rows, total, Number(page), Number(limit));
  } catch (err) {
    console.error('[Admin getUsers Error]', err);
    return error(res, 'Không thể truy xuất danh sách thành viên', 500);
  }
};

// ── PATCH /api/admin/users/:id/status ────────────────────────────────────────
exports.toggleUserStatus = async (req, res) => {
  try {
    const result = await reportModel.toggleUserStatus(req.params.id);
    const msg = result.is_active ? 'Đã mở khóa quyền hoạt động tài khoản thành công.' : 'Đã thực hiện đóng khóa tài khoản người dùng.';
    return success(res, result, msg);
  } catch (err) {
    console.error('[Admin toggleUserStatus Error]', err);
    return error(res, err.message || 'Lỗi xử lý đổi trạng thái tài khoản', err.statusCode || 500);
  }
};

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    await reportModel.deleteUser(req.params.id);
    return success(res, null, 'Hủy kích hoạt tài khoản độc giả vĩnh viễn (Soft-delete) thành công, toàn vẹn lịch sử mượn trả được giữ nguyên.');
  } catch (err) {
    console.error('[Admin deleteUser Error]', err);
    return error(res, err.message || 'Lỗi server khi xóa tài khoản', err.statusCode || 500);
  }
};

// ─── Borrow Management (Ánh xạ đồng bộ logic của bước trước) ──────────────────────

exports.getAllBorrows = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', search = '' } = req.query;
    const { rows, total } = await borrowModel.findAll({ page, limit, status, search });
    return paginated(res, rows, total, Number(page), Number(limit));
  } catch (err) {
    console.error('[Admin getAllBorrows Error]', err);
    return error(res, 'Lỗi hệ thống khi lấy hồ sơ mượn sách', 500);
  }
};

exports.getOverdue = async (_req, res) => {
  try {
    const rows = await borrowModel.findOverdue();
    return success(res, rows);
  } catch (err) {
    console.error('[Admin getOverdue Error]', err);
    return error(res, 'Lỗi hệ thống khi thống kê danh sách quá hạn', 500);
  }
};