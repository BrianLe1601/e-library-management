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

/**
 * Lấy tất cả số liệu cho 4 StatsCard + topBooks
 * Response mong đợi từ BE:
 * {
 *   totalBooks: 25,
 *   totalBookCopies: 80,
 *   totalUsers: 15,
 *   newUsersThisMonth: 3,
 *   activeBorrows: 8,
 *   borrowsToday: 2,
 *   overdueBorrows: 1,
 *   topBooks: [{ title, borrow_count }, ...]
 * }
 */
export const getStats = () => API.get("/admin/stats");


// ─────────────────────────────────────────────────────────────
//  BOOK MANAGEMENT — Quản lý sách
// ─────────────────────────────────────────────────────────────
/** * Lấy danh sách toàn bộ sách 
 * @param {object} params — Truyền vào các bộ lọc như { page, limit, search, category }
 */
export const getBooks = (params = {}) => 
  API.get("/admin/books", { params });

/** * Xóa một cuốn sách khỏi hệ thống
 * @param {number|string} bookId — ID của sách cần xóa
 */
export const deleteBook = (bookId) => 
  API.delete(`/admin/books/${bookId}`);

/** Thêm mới sách */
export const createBook = (bookData) => 
  API.post("/admin/books", bookData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

/** Cập nhật sách */
export const updateBook = (bookId, bookData) => 
  API.put(`/admin/books/${bookId}`, bookData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getAuthors = () => API.get("/books/authors");
export const getCategories = () => API.get("/books/categories");
export const getPublishers = () => API.get("/admin/books/publishers");
export const toggleHideBook = (id) => API.patch(`/admin/books/${id}/toggle-hide`);
/**
 * Thêm nhanh một tác giả mới từ form Book
 * @param {Object} data — { name: "Tên tác giả" }
 */
export const createAuthor = (data) => API.post('/admin/authors', data);

/**
 * Thêm nhanh một nhà xuất bản mới từ form Book
 * @param {Object} data — { name: "Tên nhà xuất bản" }
 */
export const createPublisher = (data) => API.post('/admin/publishers', data);


// ─────────────────────────────────────────────────────────────
//  USER MANAGEMENT — Quản lý người dùng
// ─────────────────────────────────────────────────────────────

/**
 * Lấy danh sách toàn bộ user
 * @param {object} params — { page, limit, role, search }
 */
export const getUsers = (params = {}) =>
  API.get("/admin/users", { params });

/**
 * Khóa hoặc mở khóa tài khoản user
 * @param {number} userId
 * @param {boolean} isActive — true = mở khóa, false = khóa
 */
export const toggleUserStatus = (userId, isActive) =>
  API.patch(`/admin/users/${userId}/status`, { is_active: isActive });

/**
 * Cập nhật vai trò (role) của người dùng
 * @param {number|string} userId
 * @param {string} role — "admin" | "employee" | "user"
 */
export const updateUserRole = (userId, role) =>
  API.put(`/admin/users/${userId}/role`, { role });

/**
 * Thêm người dùng mới trực tiếp (Chỉ Admin)
 * @param {object} data - { full_name, email, password, phone, role }
 */
export const addUser = (data) =>
  API.post("/admin/users", data);


// ─────────────────────────────────────────────────────────────
//  REPORTS — Báo cáo
// ─────────────────────────────────────────────────────────────

/**
 * Lấy báo cáo mượn trả theo khoảng ngày
 * @param {string} from  — "2025-01-01"
 * @param {string} to    — "2025-12-31"
 * @param {string} type  — "borrows" | "returns" | "overdue"
 */
export const getReports = (from, to, type = "borrows") =>
  API.get(`/admin/reports?from=${from}&to=${to}&type=${type}`);

/**
 * Xuất báo cáo ra file PDF hoặc Excel
 * @param {string} format — "pdf" | "excel"
 */
export const exportReport = (format = "pdf", from, to) =>
  API.get(`/admin/reports/export?format=${format}&from=${from}&to=${to}`, {
    responseType: "blob", // Quan trọng! Để nhận file binary
  });

/**
 * Lấy top sách được mượn nhiều nhất
 * @param {number} limit — Số lượng sách (mặc định 10)
 */
export const getTopBooks = (limit = 10) =>
  API.get(`/admin/reports/top-books?limit=${limit}`);

//  CHARTS — Dữ liệu cho biểu đồ
/**
 * Lấy dữ liệu lượt mượn/trả theo từng tháng trong năm
 * Response mong đợi:
 * [
 *   { month: 1, borrows: 12, returned: 10 },
 *   { month: 2, borrows: 18, returned: 15 },
 *   ...
 * ]
 */
export const getBorrowChartData = (year = new Date().getFullYear()) =>
  API.get(`/admin/reports/borrow-chart?year=${year}`);

/**
 * Lấy số lượng sách theo thể loại cho PieChart
 * Response mong đợi:
 * [
 *   { name: "Công nghệ", value: 12 },
 *   { name: "Văn học",   value: 8  },
 *   ...
 * ]
 */
export const getCategoryChartData = () =>
  API.get("/admin/reports/category-chart");


export default API;