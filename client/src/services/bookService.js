/**
 * services/bookService.js — TV2: Book Management System
 *
 * Tất cả hàm gọi API liên quan đến sách.
 * Public routes không cần token. Admin routes cần token (tự động).
 */
import api from "./api";

const bookService = {
  // ── Phân hệ Độc giả (Public / Thao tác xem) ───────────────────────────────────

  /**
   * Lấy danh sách sách kèm bộ lọc, tìm kiếm và phân trang
   * @param {{ search, category, page, limit }} params
   */
  getBooks: (params = {}) => api.get("/books", { params }),

  /**
   * Xem chi tiết thông tin một cuốn sách
   * @param {number|string} id
   */
  getBookById: (id) => api.get(`/books/${id}`),

  /**
   * Lấy danh sách sách nổi bật/mượn nhiều hiển thị ở trang chủ
   */
  getFeatured: (limit = 8) => api.get("/books/featured", { params: { limit } }),

  /**
   * Lấy danh sách toàn bộ danh mục/thể loại sách kèm số lượng
   */
  getCategories: () => api.get("/books/categories"),

  // ── Phân hệ Quản lý Kho Sách (Admin / Employee Only) ─────────────────────────

  /**
   * Thêm mới một đầu sách vào kho dữ liệu
   */
  createBook: (data) => api.post("/books", data),

  /**
   * Cập nhật thông tin chi tiết của một đầu sách
   */
  updateBook: (id, data) => api.put(`/books/${id}`, data),

  /**
   * Xóa một đầu sách khỏi hệ thống thư viện
   */
  deleteBook: (id) => api.delete(`/books/${id}`),
};

export default bookService;