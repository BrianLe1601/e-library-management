import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import BooksPage from "../pages/BooksPage";
// Admin layout + các trang con
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import UserManagement from "../pages/admin/UserManagement";
function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/books" element={<BooksPage />} />
                {/* ── Admin routes — AdminLayout bọc ngoài, trang con render vào <Outlet /> ── */}
                <Route path="/admin" element={<AdminLayout />}>
                    {/* /admin → tự redirect sang /admin/dashboard */}
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users"     element={<UserManagement />} />
                    {/* TV2 thêm sau: <Route path="books"   element={<BookManagement />} /> */}
                    {/* TV3 thêm sau: <Route path="borrows" element={<BorrowManagement />} /> */}
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;