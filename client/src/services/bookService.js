/**
 * services/bookService.js — Book Management System
 * Tất cả hàm gọi API liên quan đến sách.
 */
import api from "./api";

const bookService = {
  // ── Public ────────────────────────────────────────────────────────────────
  /** Danh sách sách (search, filter, sort, page) */
  getBooks: (params = {}) => api.get("/books", { params }),

  /** Chi tiết một cuốn sách */
  getBookById: (id) => api.get(`/books/${id}`),

  /** Sách nổi bật (trang chủ) */
  getFeatured: (limit = 8) => api.get("/books/featured", { params: { limit } }),

  /** Top 10 sách đánh giá cao nhất */
  getTopRated: (limit = 10) => api.get("/books/top-rated", { params: { limit } }),

  /** Top 10 sách mới thêm gần đây */
  getNewest: (limit = 10) => api.get("/books/newest", { params: { limit } }),

  /** Tất cả danh mục (kèm book_count) */
  getCategories: () => api.get("/books/categories"),

  /** Tất cả tác giả (kèm book_count) — cho FilterSidebar */
  getAuthors: () => api.get("/books/authors"),

  /** Tất cả nhà xuất bản (kèm book_count) — cho FilterSidebar */
  getPublishers: () => api.get("/books/publishers"),

  // ── Admin ─────────────────────────────────────────────────────────────────
  /** Thêm mới sách */
  createBook: (data) => api.post("/books", data),

  /** Cập nhật sách */
  updateBook: (id, data) => api.put(`/books/${id}`, data),

  /** Xóa sách */
  deleteBook: (id) => api.delete(`/books/${id}`),
};

export default bookService;