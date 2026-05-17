/**
 * context/AuthContext.jsx — TV1: Global Authentication State
 *
 * Cung cấp: user, token, isLoading, login(), logout()
 * Dùng: useAuth() hook ở bất kỳ component nào
 *
 * Cách hoạt động:
 *  1. Khi app khởi động → đọc token từ localStorage → gọi /users/profile để verify
 *  2. login() → lưu token + user vào state + localStorage
 *  3. logout() → xóa token + reset state → redirect /login
 *  4. Mọi component cần biết user đang là ai → useAuth()
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authService from "../services/authService";
import { useNavigate } from "react-router-dom";
// ── Context creation ──────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser]         = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true khi đang check token lúc reload

  // ── Khởi động: đọc token từ localStorage và verify với server ────────────────
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        // Gọi /users/profile để kiểm tra token còn hợp lệ không
        const { data } = await authService.getProfile();
        if (data.success) {
          setUser(data.data);
        } else {
          // Token không hợp lệ → xóa đi
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch {
        // Token hết hạn hoặc server lỗi → clear
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  // ── Đồng bộ hóa Logout giữa các Tabs (Multi-tab Sync) ────────────────────────
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Nếu một tab khác xóa token (tức là vừa ẩn nút logout), tab này cũng tự reset state
      if (e.key === "token" && !e.newValue) {
        setUser(null);
        navigate("/login");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [navigate]);

  // ── login(): gọi sau khi server trả về token ─────────────────────────────────
  const login = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ── logout(): xóa state + localStorage ───────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // Redirect về trang login
    navigate("/login");
  }, [navigate]);

  // ── updateUser(): dùng sau khi cập nhật profile ───────────────────────────────
  const updateUser = useCallback((newUserData) => {
    const updated = { ...user, ...newUserData };
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
  }, [user]);

  // ── Computed values ───────────────────────────────────────────────────────────
  const isAuthenticated = !!user;
  const isAdmin         = user?.role === "admin";
  const isEmployee      = user?.role === "employee";
  const isAdminOrEmployee = isAdmin || isEmployee;

  const value = {
    user,
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
      {children}
    </AuthContext.Provider>
  );
}

// ── Custom hook: useAuth() ────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth() phải được dùng bên trong <AuthProvider>");
  }
  return context;
}

export default AuthContext;