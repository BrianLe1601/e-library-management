import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import UserLayout from "../layouts/user/UserLayout";
import AdminLayout from "../layouts/admin/AdminLayout";

// Components
import ProtectedRoute from "../components/ProtectedRoute";

// Auth pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

// Core / Book pages
import HomePage from "../pages/core/HomePage";
import BooksPage from "../pages/book/BooksPage";
import BookDetail from "../pages/book/BookDetail";

// User pages
import { DashboardPage as UserDashboard } from "../pages/user/Dashboard";

// Admin pages
import Dashboard from "../pages/admin/Dashboard";
import BookInventory from "../pages/admin/BookInventory";
import UserManagement from "../pages/admin/UserManagement";
import BorrowingReturns from "../pages/admin/BorrowingReturns";
import Reports from "../pages/admin/Reports";
import NotificationsPage from "../pages/admin/NotificationsPage";
import NotFound from "../pages/admin/NotFound";

import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";

function AppRoutes() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* ── Tuyến công khai (Public) ── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* PUBLIC / USER: Giao diện độc giả */}
            <Route element={<UserLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/books/:id" element={<BookDetail />} />
              
              {/* Chỉ user đã đăng nhập mới vào được Dashboard cá nhân */}
              <Route element={<ProtectedRoute allowedRoles={["user", "employee", "admin"]} />}>
                <Route path="/dashboard" element={<UserDashboard />} />
              </Route>
            </Route>

            {/* ── Phân hệ Quản trị tối cao (Chỉ dành cho admin và nhân viên thủ thư) ── */}
            <Route element={<ProtectedRoute allowedRoles={["admin", "employee"]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/books" element={<BookInventory />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/borrowing" element={<BorrowingReturns />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/notifications" element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* ── Xử lý các tuyến đường không tồn tại ── */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;