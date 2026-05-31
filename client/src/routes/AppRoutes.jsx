import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import HomeLayout from "../layouts/home/HomeLayout";
import AdminLayout from "../layouts/admin/AdminLayout";
import AuthLayout from "../layouts/auth/AuthLayout";
import UserLayout from "../layouts/user/UserLayout";

// Components
import ProtectedRoute from "../components/ProtectedRoute";
import OtpVerification from "../components/OTP-Verification";

// Auth pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";

// Core / Book pages
import HomePage from "../pages/core/HomePage";
import BooksPage from "../pages/book/BooksPage";
import BookDetail from "../pages/book/BookDetail";
import NotFound from "../pages/core/NotFound";

// User pages
// import DashboardPage from "../pages/user/DashboardPage";
import  DashboardTab from "../pages/user/DashboardTab";
import  BorrowedTab  from "../pages/user/BorrowedTab";
import  SavedBooksTab  from "../pages/user/SavedBooksTab";
import  NotificationsTab  from "../pages/user/NotificationsTab";
import  SettingsTab  from "../pages/user/SettingsTab";

// Admin pages
import Dashboard from "../pages/admin/Dashboard";
import BookInventory from "../pages/admin/BookInventory";
import UserManagement from "../pages/admin/UserManagement";
import BorrowingReturns from "../pages/admin/BorrowingReturns";
import Reports from "../pages/admin/Reports";
import NotificationsPage from "../pages/admin/NotificationsPage";
import SettingsPage from "../pages/admin/SettingsPage";

// Context Providers
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";

function AppRoutes() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {/* MỞ THẺ TOASTPROVIDER Ở ĐÂY ĐỂ BỌC TOÀN BỘ ROUTE */}
          <ToastProvider>
            <Routes>
              {/* ── Tuyến công khai (Public) ── */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>
              <Route path="/verify-otp" element={<OtpVerification />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* PUBLIC / USER: Giao diện độc giả */}
            <Route element={<HomeLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/books/:id" element={<BookDetail />} />

              {/* Chỉ user đã đăng nhập mới vào được Dashboard cá nhân */}
              <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
                <Route element={<UserLayout />}>
                  <Route index path="/user"                  element={<DashboardTab />} />
                  <Route path="/user/borrowed"               element={<BorrowedTab />} />
                  <Route path="/user/saved-books"                  element={<SavedBooksTab />} />
                  <Route path="/user/notifications"          element={<NotificationsTab />} />
                  <Route path="/user/settings"               element={<SettingsTab />} />
                </Route>
              </Route>
            </Route>

            {/* --- PRIVATE ROUTES (Admin & Employee) --- */}
            <Route element={<ProtectedRoute allowedRoles={["admin", "employee"]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/books" element={<BookInventory />} />
                <Route path="/admin/borrowing" element={<BorrowingReturns />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/notifications" element={<NotificationsPage />} />

                  {/* --- PRIVATE ROUTES (Admin only) --- */}
                  <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/settings" element={<SettingsPage />} />
                  </Route>
                </Route>
              </Route>

              {/* ── Xử lý các tuyến đường không tồn tại ── */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </ToastProvider> 
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;