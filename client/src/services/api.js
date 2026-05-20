/**
 * services/api.js — Axios instance dùng chung toàn app
 *
 * - Tự động gắn Bearer token vào mọi request
 * - Tự động redirect về /login khi 401
 * - Mọi service file (authService, bookService...) đều import từ đây
 */

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: tự động gắn token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: xử lý lỗi tập trung ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 1. Token hết hạn hoặc không hợp lệ (401) → tự động logout
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Chỉ redirect nếu không đang ở trang login/register
      if (!window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/register")) {
        window.location.href = "/login";
      }
    }

    // 2. Không đủ quyền truy cập (403 Forbidden)
    if (status === 403) {
      console.error("Quyền truy cập bị từ chối (403 Forbidden).");
      // Bạn có thể redirect tới trang 403 hoặc ném lỗi ra ngoài component để Toast cảnh báo
      // window.location.href = "/403"; 
    }

    return Promise.reject(error);
  }
);

export default api;