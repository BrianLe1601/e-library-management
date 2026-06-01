/**
 * adminService.js — Tất cả các hàm gọi API cho Admin
 *
 * CÁCH HOẠT ĐỘNG:
 *  - Mỗi hàm dùng axios để gọi đến backend Express (PORT 5000)
 *  - Token JWT được gắn tự động qua axios interceptor (TV1 sẽ setup)
 *  - Nếu TV1 chưa xong interceptor, dùng getAuthHeader() tạm thời
 */

import { create } from 'axios';
import api from './api';

const adminService = {
// ─────────────────────────────────────────────────────────────
//  STATS — Số liệu tổng quan Dashboard
// ─────────────────────────────────────────────────────────────
  getStats: () => api.get("/admin/stats"),


// ─────────────────────────────────────────────────────────────
//  BOOK MANAGEMENT
// ─────────────────────────────────────────────────────────────
  getBooks         : (params = {}) => api.get("/admin/books", { params }),
  deleteBook       : (bookId)      => api.delete(`/admin/books/${bookId}`),
  createBook       : (bookData)    => api.post("/admin/books", bookData, { headers: { "Content-Type": "multipart/form-data" } }),
  updateBook       : (bookId, bookData) => api.put(`/admin/books/${bookId}`, bookData, { headers: { "Content-Type": "multipart/form-data" } }),
  getAuthors       : ()            => api.get("/books/authors"),
  getCategories    : ()            => api.get("/books/categories"),
  getPublishers    : ()            => api.get("/admin/books/publishers"),
  toggleHideBook   : (id)          => api.patch(`/admin/books/${id}/toggle-hide`),
  createAuthor     : (data)        => api.post('/admin/authors', data),
  createPublisher  : (data)        => api.post('/admin/publishers', data),
  createCategory   : (data)        => api.post('/admin/categories', data),

// ─────────────────────────────────────────────────────────────
//  USER MANAGEMENT — Quản lý người dùng
// ─────────────────────────────────────────────────────────────

  getUsers          : (params = {}) => api.get("/admin/users", { params }),
  toggleUserStatus  : (userId, isActive) => api.patch(`/admin/users/${userId}/status`, { is_active: isActive }),
  updateUserRole    : (userId, role)     => api.put(`/admin/users/${userId}/role`, { role }),
  addUser           : (data)             => api.post("/admin/users", data),


// ─────────────────────────────────────────────────────────────
//  REPORTS — Báo cáo
// ─────────────────────────────────────────────────────────────

  getReports         : (from, to, type = '') => api.get(`/admin/reports?from=${from}&to=${to}&type=${type}`),
  exportReport       : (format = 'pdf', from, to) => api.get(`/admin/reports/export?format=${format}&from=${from}&to=${to}`, { responseType: 'blob' }),
  getTopBooks        : (limit = 10) => api.get(`/admin/reports/top-books?limit=${limit}`),
  getBorrowChart     : (year = new Date().getFullYear()) => api.get(`/admin/reports/borrow-chart?year=${year}`),
  getCategoryChartData: () => api.get('/admin/reports/category-chart'),
  getReportSummary : (from, to) => api.get(`/admin/reports/summary?from=${from}&to=${to}`),
  getCategoryReport: (from, to) => api.get(`/admin/reports/category?from=${from}&to=${to}`),

// ─────────────────────────────────────────────────────────────
//  NOTIFICATIONS — Thông báo
// [FIX] getNotifications: nhận object params thay vì 2 tham số rời,
//       để truyền đủ page, limit, search, filter, is_archived lên backend
//       — trước đây chỉ gửi filter và viewMode nên phân trang và search không hoạt động
// ─────────────────────────────────────────────────────────────
  getNotifications : (params = {}) => api.get('/admin/notifications', { params }),
  
  markNotificationRead    : (id)            => api.patch(`/admin/notifications/${id}/read`),
  markAllNotificationsRead : ()             =>api.patch('/admin/notifications/mark-all'),
  archiveNotificatiApi  : (id)            => api.patch(`/admin/notifications/${id}/archive`),
  restoreNotificatiApi  : (id)            => api.patch(`/admin/notifications/${id}/restore`),
  deleteNotificatiApi   : (id)            => api.delete(`/admin/notifications/${id}`),
  bulkActionNotificatioApi : (action, ids, extraParams = {}) => api.post('/admin/notifications/bulk', { action, ids, ...extraParams }),
  createNotificatiApi   : (data)          => api.post('/admin/notifications', data),
  
}

export default adminService;