import { BrowserRouter, Routes, Route } from "react-router-dom";
// layouts
import UserLayout from "../layouts/UserLayout";
import AdminLayout from "../layouts/AdminLayout";

// auth pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

// core pages
import HomePage from "../pages/core/HomePage";

// book pages
import BooksPage from "../pages/book/BooksPage";
import BookDetail from "../components/BookDetail";

// admin pages
import AdminPage from "../pages/admin/AdminPage";
import BookManagement from "../pages/admin/BookManagement";
import UserManagement from "../pages/admin/UserManagement";
import CirculationManagement from "../pages/admin/CirculationManagement";

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

        {/* --- PRIVATE ROUTES (With AdminLayout) --- */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/books" element={<BookManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/circulation" element={<CirculationManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
