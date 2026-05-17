/**
 * services/bookService.js — TV2: Book Management System
 *
 * Tất cả hàm gọi API liên quan đến sách.
 * Public routes không cần token. Admin routes cần token (tự động).
 */

import api from "./api";

const bookService = {
  // ── Public ──────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách sách có filter + phân trang
   * @param {{ search?, category?, page?, limit? }} params
   */
  getBooks: (params = {}) => api.get("/books", { params }),

  /**
   * Lấy chi tiết một cuốn sách kèm reviews, avg_rating
   * @param {number|string} id
   */
  getBookById: (id) => api.get(`/books/${id}`),

  /**
   * Lấy sách nổi bật cho trang Home (mượn nhiều nhất + còn sách)
   * @param {number} limit
   */
  getFeatured: (limit = 8) => api.get("/books/featured", { params: { limit } }),

  /**
   * [MỚI] Lấy top 10 sách được đánh giá sao cao nhất
   * Dùng cho section "Trending Books" trang Home
   * @param {number} limit
   */
  getTopRated: (limit = 10) => api.get("/books/top-rated", { params: { limit } }),

  /**
   * [MỚI] Lấy top 10 sách được thêm mới nhất (ORDER BY created_at DESC)
   * Dùng cho section "Sách Mới Nhất" trang Home
   * @param {number} limit
   */
  getNewest: (limit = 10) => api.get("/books/newest", { params: { limit } }),

  /**
   * Lấy danh sách thể loại kèm book_count
   */
  getCategories: () => api.get("/books/categories"),

  // ── Admin only ───────────────────────────────────────────────────────────────

  /**
   * Tạo sách mới
   * @param {{ title, author_id, publisher_id?, isbn?, publish_year?,
   *           description?, cover_url?, total_copies?, category_ids? }} data
   */
  createBook: (data) => api.post("/books", data),

  /**
   * Cập nhật thông tin sách
   * @param {number} id
   * @param {object} data — các trường cần cập nhật
   */
  updateBook: (id, data) => api.put(`/books/${id}`, data),

  /**
   * Xóa sách (kiểm tra FK trước — sách đang mượn sẽ báo lỗi)
   * @param {number} id
   */
  deleteBook: (id) => api.delete(`/books/${id}`),
};

export default bookService;