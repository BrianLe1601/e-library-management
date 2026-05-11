import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// layouts
import UserLayout from "../layouts/user/UserLayout";
import { Layout as AdminLayout } from "../layouts/admin/Layout"; 

// auth pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

// core pages
import HomePage from "../pages/core/HomePage";

// book pages
import BooksPage from "../pages/book/BooksPage";
import BookDetail from "../components/BookDetail";

// admin pages
import Dashboard from "../pages/admin/Dashboard";
import BookInventory from "../pages/admin/BookInventory";
import UserManagement from "../pages/admin/UserManagement";
import BorrowingReturns from "../pages/admin/BorrowingReturns";
import Reports from "../pages/admin/Reports";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- PUBLIC ROUTES (No Layout) --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* --- PRIVATE ROUTES (With UserLayout) --- */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/book/:id" element={<BookDetail />} />
        </Route>

        {/* --- PRIVATE ROUTES (With AdminLayout mới) --- */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/books" element={<BookInventory />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/borrowing" element={<BorrowingReturns />} />
          <Route path="/admin/reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
