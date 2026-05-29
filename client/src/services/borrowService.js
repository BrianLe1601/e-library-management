/**
 * services/borrowService.js — Borrow & Return System
 *
 * All API calls related to borrowing/returning books.
 * Token is attached automatically via axios interceptor.
 */

import api from "./api";

const borrowService = {

  // ── User endpoints ──────────────────────────────────────────────────────────

  /**
   * Create a borrow request → status = 'pending'
   * @param {number} book_id
   */
  borrowBook: (book_id) => api.post("/borrows", { book_id }),

  /**
   * Get all active loans of current user
   * (status: pending / borrowing / renewed / overdue / returning)
   */
  getMyBooks: () => api.get("/borrows/my-books"),

  /**
   * Get borrow history of current user (returned / cancelled / lost)
   * @param {{ page?, limit? }} params
   */
  getHistory: (params = {}) => api.get("/borrows/history", { params }),

  /**
   * Request return — user side only, sets status = 'returning'
   * Admin must confirm to finalize as 'returned'
   * @param {number} borrowId
   */
  requestReturn: (borrowId) => api.patch(`/borrows/request-return/${borrowId}`),

  /**
   * Renew borrow (max 2 times, +14 days each)
   * Only allowed when status = borrowing/renewed and not overdue
   * @param {number} borrowId
   */
  extendBorrow: (borrowId) => api.post(`/borrows/extend/${borrowId}`),

  // ── Employee / Admin endpoints ──────────────────────────────────────────────

  /**
   * Get all borrow records (admin/employee)
   * @param {{ page?, limit?, status?, user_id? }} params
   */
  getAllBorrows: (params = {}) => api.get("/admin/borrows", { params }),

  /**
   * Get all overdue records
   */
  getOverdue: () => api.get("/admin/borrows/overdue"),

  /**
   * Approve a pending borrow request → status = 'borrowing'
   * @param {number} borrowId
   */
  approveBorrow: (borrowId) => api.put(`/admin/borrows/approve/${borrowId}`),

  /**
   * Reject a pending borrow request → status = 'cancelled'
   * available_copies + 1
   * @param {number} borrowId
   */
  rejectBorrow: (borrowId) => api.put(`/admin/borrows/reject/${borrowId}`),

  /**
   * Confirm return (admin/employee) → status = 'returned'
   * Calculates fine if overdue, available_copies + 1
   * @param {number} borrowId
   */
  returnBook: (borrowId) => api.patch(`/borrows/return/${borrowId}`),

  /**
   * Confirm fine has been paid
   * @param {number} borrowId
   */
  payFine: (borrowId) => api.patch(`/borrows/pay-fine/${borrowId}`),

  /**
   * Mark book as lost (admin/employee)
   * status = 'lost', available_copies + 1
   * @param {number} borrowId
   */
  markLost: (borrowId) => api.patch(`/borrows/lost/${borrowId}`),

};

export default borrowService;