/**
 * services/authService.js — TV1: Authentication & User System
 *
 * Tất cả hàm gọi API liên quan đến auth và profile.
 * Import api từ ./api.js — token đã được gắn tự động.
 */
import api from "./api";

const authService = {
  /**
   * Đăng ký tài khoản mới
   * @param {{ full_name, email, password, phone }} data
   */
  register: (data) => api.post("/auth/register", data),

  /**
   * Đăng nhập hệ thống
   * @param {{ email, password }} data
   */
  login: (data) => api.post("/auth/login", data),

  /**
   * Lấy thông tin chi tiết tài khoản hiện tại (Dựa theo token tự động gắn ở api.js)
   */
  getProfile: () => api.get("/users/profile"),

  /**
   * Cập nhật thông tin tài khoản cá nhân
   * @param {{ full_name, phone, avatar_url }} data
   */
  updateProfile: (data) => api.put("/users/profile", data),

  /**
   * Đổi mật khẩu người dùng
   * @param {{ old_password, new_password }} data
   */
  changePassword: (data) => api.put("/users/change-password", data),
  
  /**
   * Verify OTP sent to email after registration
   * @param {{ email, otpCode }} data
   */
  verifyOtp: (data) => api.post("/auth/verify-otp", data),
};

export default authService;