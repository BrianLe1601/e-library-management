/**
 * services/authService.js — TV1: Authentication & User System
 *
 * Tất cả hàm gọi API liên quan đến auth và profile.
 * Import api từ ./api.js — token đã được gắn tự động.
 */

import api from "./api";

const authService = {
  // ── Auth ────────────────────────────────────────────────────────────────────

  /**
   * Đăng ký tài khoản mới
   * @param {{ full_name, email, password, phone? }} data
   * @returns {{ success, message, data: { id, full_name, email, role } }}
   */
  register: (data) => api.post("/auth/register", data),

  /**
   * Đăng nhập — trả về JWT token + thông tin user
   * @param {{ email, password }} data
   * @returns {{ success, data: { token, user } }}
   */
  login: (data) => api.post("/auth/login", data),

  // ── User Profile ────────────────────────────────────────────────────────────

  /**
   * Lấy thông tin profile của user đang đăng nhập
   * Cần token (gắn tự động qua interceptor)
   */
  getProfile: () => api.get("/users/profile"),

  /**
   * Cập nhật thông tin profile
   * @param {{ full_name?, phone?, avatar_url? }} data
   */
  updateProfile: (data) => api.put("/users/profile", data),

  /**
   * Đổi mật khẩu
   * @param {{ old_password, new_password }} data
   */
  changePassword: (data) => api.put("/users/change-password", data),
};

export default authService;