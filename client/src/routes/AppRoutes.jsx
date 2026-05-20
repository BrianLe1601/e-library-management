import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// layouts
import UserLayout from "../layouts/user/UserLayout";
import AdminLayout from "../layouts/admin/AdminLayout";

// auth pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import OtpVerification from "../components/OTP-Verification";

// core pages
import HomePage from "../pages/core/HomePage";

// book pages
import BooksPage from "../pages/book/BooksPage";
import BookDetail from "../pages/book/BookDetail";

// user pages
import { DashboardPage as UserDashboard } from "../pages/user/Dashboard";

// admin pages
import Dashboard from "../pages/admin/Dashboard";
import BookInventory from "../pages/admin/BookInventory";
import UserManagement from "../pages/admin/UserManagement";
import BorrowingReturns from "../pages/admin/BorrowingReturns";
import Reports from "../pages/admin/Reports";
import NotificationsPage from "../pages/admin/NotificationsPage";
import SettingsPage from "../pages/admin/SettingsPage";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

import NotFound from "../pages/admin/NotFound";
function AppRoutes() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* --- PUBLIC ROUTES (No Layout) --- */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<OtpVerification />} />

            {/* --- PRIVATE ROUTES (With UserLayout) --- */}
            <Route element={<UserLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/dashboard" element={<UserDashboard />} />
            </Route>

            {/* --- PRIVATE ROUTES (Admin only) --- */}
            <Route element={<ProtectedRoute allowedRoles={["admin", "employee"]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/books" element={<BookInventory />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/borrowing" element={<BorrowingReturns />} />
                <Route path="/admin/reports" element={<Reports />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route
                  path="/admin/notifications"
                  element={<NotificationsPage />}
                />
              </Route>
            </Route>

            <Route path="/*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;
