import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Đang trong quá trình thẩm định token từ bộ nhớ máy -> Hiển thị màn hình chờ mượt
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // 1. Nếu chưa đăng nhập -> Ép quay về trang Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Đã đăng nhập nhưng Role hiện tại không nằm trong danh sách được cấp phép -> Đẩy về trang tương ứng
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={user?.role === "admin" || user?.role === "employee" ? "/admin" : "/"} replace />;
  }

  // Hợp lệ -> Cho phép đi sâu vào các trang con bên trong
  return <Outlet />;
}