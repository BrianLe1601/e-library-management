/**
 * services/borrowService.js — TV3: Borrow & Return System
 *
 * Tất cả hàm gọi API liên quan đến mượn/trả sách.
 * Mọi endpoint đều cần token (gắn tự động).
 */

import api from "./api";

const borrowService = {
  // ── User endpoints ───────────────────────────────────────────────────────────

  /**
   * Tạo yêu cầu mượn sách
   * @param {number} book_id
   * @returns {{ success, data: { borrow_id } }}
   */
  borrowBook: (book_id) => api.post("/borrow", { book_id }),

  /**
   * Trả sách
   * @param {number} borrowId — ID của bản ghi borrow
   * @returns {{ success, data: { fine_amount }, message }}
   */
  returnBook: (borrowId) => api.put(`/borrow/return/${borrowId}`),

  /**
   * Gia hạn mượn (tối đa 2 lần, +14 ngày mỗi lần)
   * @param {number} borrowId
   * @returns {{ success, data: { new_due_date }, message }}
   */
  extendBorrow: (borrowId) => api.put(`/borrow/extend/${borrowId}`),

  /**
   * Lấy danh sách sách đang mượn của user hiện tại
   * (status: borrowing / renewed / overdue)
   */
  getMyBooks: () => api.get("/borrow/my-books"),

  /**
   * Lấy lịch sử mượn trả của user hiện tại
   * @param {{ page?, limit? }} params
   */
  getHistory: (params = {}) => api.get("/borrow/history", { params }),

  // ── Admin / Employee endpoints ───────────────────────────────────────────────

  /**
   * Lấy toàn bộ danh sách lượt mượn (admin/employee)
   * @param {{ page?, limit?, status? }} params
   */
  getAllBorrows: (params = {}) => api.get("/admin/borrows", { params }),

  /**
   * Lấy danh sách sách đang quá hạn
   */
  getOverdue: () => api.get("/admin/borrows/overdue"),

  /**
   * Duyệt yêu cầu mượn
   * @param {number} borrowId
   */
  approveBorrow: (borrowId) => api.put(`/admin/borrows/approve/${borrowId}`),

  /**
   * Từ chối yêu cầu mượn
   * @param {number} borrowId
   */
  rejectBorrow: (borrowId) => api.put(`/admin/borrows/reject/${borrowId}`),
};

export default borrowService;