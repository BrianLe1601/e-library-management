import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const finalBaseURL = rawBaseURL.endsWith("/api") ? rawBaseURL : `${rawBaseURL}/api`;

const api = axios.create({
  baseURL: finalBaseURL,
  timeout: 60000, 
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
    }

    return Promise.reject(error);
  }
);

export default api;