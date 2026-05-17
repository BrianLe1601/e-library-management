/**
 * services/api.js — Axios Instance bọc Interceptor thông minh
 */
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000,
});

// ── Request Interceptor: Gắn token tự động từ máy ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response Interceptor: Bóc tách dữ liệu sạch & Bẫy lỗi bảo mật ──
api.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp object { success, data, message } từ Backend để Frontend dùng luôn
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.message || "Đã xảy ra lỗi hệ thống!";

    if (status === 401) {
      // Token hết hạn hoặc bất hợp pháp -> Xóa sạch dấu vết
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Chuyển hướng an toàn mà không làm sập State ứng dụng
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
    }

    if (status === 403) {
      console.warn("Cảnh báo bảo mật: Bạn không có quyền can thiệp vào tài nguyên này!");
    }

    // Trả về một Rejected Promise mang theo cấu trúc lỗi chuẩn để tầng Page bắt được qua catch()
    return Promise.reject(error.response?.data || { success: false, message: errorMessage });
  }
);

export default api;