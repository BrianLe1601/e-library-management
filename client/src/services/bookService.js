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

  /** Thống kê công khai cho trang chủ (không cần đăng nhập) */
  getPublicStats: () => api.get("/books/stats"),

  // ── Saved books ────────────────────────────────────────────────────────────
  getSavedIds: ()       => api.get("/books/saved/ids"),
  getSaved:    ()       => api.get("/books/saved"),
  saveBook:    (bookId) => api.post(`/books/saved/${bookId}`),
  unsaveBook:  (bookId) => api.delete(`/books/saved/${bookId}`),
};

export default bookService;