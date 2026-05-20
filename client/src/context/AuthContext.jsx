/**
 * context/AuthContext.jsx — Quản lý Trạng thái Đăng nhập Toàn cục
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/authService";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // Bổ sung state Token để quản lý reactive nhất quán
  const [isLoading, setIsLoading] = useState(true);

  // ── Khởi động: Kiểm tra trạng thái phiên làm việc cũ ──
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser  = localStorage.getItem("user");

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Đặt token vào state trước để các API gọi trong quá trình init có thể sử dụng
        setToken(storedToken);
        
        // Gọi API xác thực thông tin profile trực tiếp từ Server Backend
        const response = await authService.getProfile(); 
        
        if (response && response.success) {
          setUser(response.data);
          localStorage.setItem("user", JSON.stringify(response.data));
        } else {
          // Nếu API trả về thất bại (ví dụ tài khoản bị khóa ở Backend)
          logout();
        }
      } catch (err) {
        console.error("Phiên đăng nhập hết hạn hoặc token không hợp lệ:", err);
        // Nếu có dữ liệu cũ trong máy thì dùng tạm để tránh mất giao diện khi rớt mạng, 
        // nhưng nếu lỗi 401 thì xóa sạch để yêu cầu đăng nhập lại
        if (err.response?.status === 401) {
          logout();
        } else if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // ── Hàm xử lý Đăng nhập thành công ──
  const login = useCallback((authData) => {
    // authData mong đợi cấu trúc: { token, user: { id, full_name, role, ... } }
    if (!authData?.token) return;

    localStorage.setItem("token", authData.token);
    localStorage.setItem("user", JSON.stringify(authData.user));
    
    setToken(authData.token);
    setUser(authData.user);
  }, []);

  // ── Hàm xử lý Đăng xuất / Xóa dấu vết ──
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    setToken(null);
    setUser(null);
    
    navigate("/login");
  }, [navigate]);

  // ── Đồng bộ cập nhật thông tin cá nhân (Khi sửa Profile) ──
  const updateUser = useCallback((newUserData) => {
    setUser((prevUser) => {
      const updated = { ...prevUser, ...newUserData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Các thuộc tính dẫn xuất (Computed Values) để code ngắn gọn ở các Page ──
  const isAuthenticated = !!user && !!token;
  const isAdmin         = user?.role === "admin";
  const isEmployee      = user?.role === "employee";
  const isAdminOrEmployee = isAdmin || isEmployee;

  const value = {
    user,
    token, // Cung cấp token trực tiếp để axios interceptor kết nối dễ dàng
    isLoading,
    isAuthenticated,
    isAdmin,
    isEmployee,
    isAdminOrEmployee,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children} {/* Chặn đứng việc render UI lỗi khi chưa xác thực xong xuôi */}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth bắt buộc phải được đặt bên trong mảng bọc AuthProvider");
  }
  return context;
}