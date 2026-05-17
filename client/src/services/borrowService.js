/**
 * services/borrowService.js — TV3: Borrow & Return System
 *
 * Tất cả hàm gọi API liên quan đến mượn/trả sách.
 * Mọi endpoint đều cần token (gắn tự động).
 */
import api from "./api";

const borrowService = {
  /**
   * Độc giả gửi yêu cầu mượn một cuốn sách
   * @param {number} bookId
   */
  borrowBook: (bookId) => api.post("/borrow", { book_id: bookId }),

  /**
   * Độc giả thực hiện trả sách (Hoặc thủ thư quét trả)
   */
  returnBook: (borrowId) => api.put(`/borrow/return/${borrowId}`),

  /**
   * Độc giả tự yêu cầu gia hạn thời gian mượn sách (+14 ngày, tối đa 2 lần)
   */
  extendBorrow: (borrowId) => api.put(`/borrow/extend/${borrowId}`),

  /**
   * Lấy danh sách các cuốn sách Độc giả hiện tại đang mượn (Chưa trả)
   */
  getMyBooks: () => api.get("/borrow/my-books"),

  /**
   * Xem lịch sử mượn trả toàn bộ của Độc giả hiện tại
   * @param {{ page, limit }} params
   */
  getHistory: (params = {}) => api.get("/borrow/history", { params }),
};

export default borrowService;