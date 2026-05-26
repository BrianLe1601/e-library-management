/**
 * adminService.js — Tất cả các hàm gọi API cho Admin
 *
 * CÁCH HOẠT ĐỘNG:
 *  - Mỗi hàm dùng axios để gọi đến backend Express (PORT 5000)
 *  - Token JWT được gắn tự động qua axios interceptor (TV1 sẽ setup)
 *  - Nếu TV1 chưa xong interceptor, dùng getAuthHeader() tạm thời
 */

import axios from "axios";

// Base URL — đọc từ biến môi trường Vite
// Khi dev: http://localhost:5000
// Khi deploy: URL của Render/Railway
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Gắn token vào mọi request (dùng tạm khi TV1 chưa xong interceptor)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────────────────────
//  STATS — Số liệu tổng quan Dashboard
// ─────────────────────────────────────────────────────────────
export const getStats = () => API.get("/admin/stats");


// ─────────────────────────────────────────────────────────────
//  BOOK MANAGEMENT
// ─────────────────────────────────────────────────────────────
export const getBooks         = (params = {}) => API.get("/admin/books", { params });
export const deleteBook       = (bookId)      => API.delete(`/admin/books/${bookId}`);
export const createBook       = (bookData)    => API.post("/admin/books", bookData, { headers: { "Content-Type": "multipart/form-data" } });
export const updateBook       = (bookId, bookData) => API.put(`/admin/books/${bookId}`, bookData, { headers: { "Content-Type": "multipart/form-data" } });
export const getAuthors       = ()            => API.get("/books/authors");
export const getCategories    = ()            => API.get("/books/categories");
export const getPublishers    = ()            => API.get("/admin/books/publishers");
export const toggleHideBook   = (id)          => API.patch(`/admin/books/${id}/toggle-hide`);
export const createAuthor     = (data)        => API.post('/admin/authors', data);
export const createPublisher  = (data)        => API.post('/admin/publishers', data);


// ─────────────────────────────────────────────────────────────
//  USER MANAGEMENT — Quản lý người dùng
// ─────────────────────────────────────────────────────────────

export const getUsers          = (params = {}) => API.get("/admin/users", { params });
export const toggleUserStatus  = (userId, isActive) => API.patch(`/admin/users/${userId}/status`, { is_active: isActive });
export const updateUserRole    = (userId, role)     => API.put(`/admin/users/${userId}/role`, { role });
export const addUser           = (data)             => API.post("/admin/users", data);


// ─────────────────────────────────────────────────────────────
//  REPORTS — Báo cáo
// ─────────────────────────────────────────────────────────────

export const getReports         = (from, to, type = "borrows") => API.get(`/admin/reports?from=${from}&to=${to}&type=${type}`);
export const exportReport       = (format = "pdf", from, to)   => API.get(`/admin/reports/export?format=${format}&from=${from}&to=${to}`, { responseType: "blob" });
export const getTopBooks        = (limit = 10)                  => API.get(`/admin/reports/top-books?limit=${limit}`);
export const getBorrowChartData = (year = new Date().getFullYear()) => API.get(`/admin/reports/borrow-chart?year=${year}`);
export const getCategoryChartData = () => API.get("/admin/reports/category-chart");


// ─────────────────────────────────────────────────────────────
//  NOTIFICATIONS — Thông báo
// [FIX] getNotifications: nhận object params thay vì 2 tham số rời,
//       để truyền đủ page, limit, search, filter, is_archived lên backend
//       — trước đây chỉ gửi filter và viewMode nên phân trang và search không hoạt động
// ─────────────────────────────────────────────────────────────
export const getNotifications = (params = {}) =>
  API.get('/admin/notifications', { params });
 
export const markNotificationRead    = (id)            => API.patch(`/admin/notifications/${id}/read`);
export const markAllNotificationsRead = ()             => API.patch('/admin/notifications/mark-all');
export const archiveNotificationApi  = (id)            => API.patch(`/admin/notifications/${id}/archive`);
export const restoreNotificationApi  = (id)            => API.patch(`/admin/notifications/${id}/restore`);
export const deleteNotificationApi   = (id)            => API.delete(`/admin/notifications/${id}`);
export const bulkActionNotificationsApi = (action, ids) => API.post('/admin/notifications/bulk', { action, ids });
export const createNotificationApi   = (data)          => API.post('/admin/notifications', data);
 
export default API;