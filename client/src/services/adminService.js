/**
 * adminService.js — Tất cả các hàm gọi API cho Admin
 *
 * CÁCH HOẠT ĐỘNG:
 *  - Mỗi hàm dùng axios để gọi đến backend Express (PORT 5000)
 *  - Token JWT được gắn tự động qua axios interceptor (TV1 sẽ setup)
 *  - Nếu TV1 chưa xong interceptor, dùng getAuthHeader() tạm thời
 */
import api from "./api";
// ── QUẢN LÝ SỐ LIỆU & BÁO CÁO ──
export const getStats = () => api.get("/admin/stats");
export const getReports = (params = {}) => api.get("/admin/reports", { params });
export const getTopBooks = (limit = 10) => api.get("/admin/reports/top-books", { params: { limit } });
export const exportReport = (params = {}) => api.get("/admin/reports/export", { params, responseType: "blob" });

// ── QUẢN LÝ PHIẾU MƯỢN TRẢ ──
export const getAllBorrows = (params = {}) => api.get("/admin/borrows", { params });
export const getOverdueBorrows = () => api.get("/admin/borrows/overdue");
export const approveBorrow = (borrowId) => api.put(`/admin/borrows/approve/${borrowId}`);
export const rejectBorrow = (borrowId) => api.put(`/admin/borrows/reject/${borrowId}`);

// ── QUẢN LÝ THÀNH VIÊN ──
export const getUsers = (params = {}) => api.get("/admin/users", { params });
export const toggleUserStatus = (userId) => api.patch(`/admin/users/${userId}/status`);
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);