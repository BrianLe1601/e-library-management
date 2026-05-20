import React, { useState } from "react";
// 1. Thêm Link từ react-router-dom và icon User từ lucide-react
import { Link } from "react-router-dom";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Moon,
  Sun,
  User, // Thêm icon User để làm nút Login
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import ProfileDropdown from "../../components/ProfileDropdown";
import { NotificationPopover, mockNotifications } from "../../components/NotificationPopover";

// 2. Bổ sung các props nhận từ AdminLayout để các nút bấm Sidebar hoạt động được
export default function Header({ collapsed, setCollapsed, setMobileOpen }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showNotifications, setShowNotifications] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  const searchFilters = ["All", "Title", "Author", "Category"];

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching:", searchQuery, "Filter:", searchFilter);
  };

  return (
    <header className="bg-white dark:bg-[#0f1629] border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3 shrink-0 top-0 z-50 h-16 w-full">
      {/* Mobile menu */}
      <button
        className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-100"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Collapse toggle */}
      <button
        className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        onClick={() => setCollapsed((p) => !p)}
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <div className="ml-auto flex items-center gap-6">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-lg 
             text-slate-500 dark:text-slate-400 
             hover:text-indigo-500 dark:hover:text-indigo-400 
             hover:bg-slate-100 dark:hover:bg-slate-800 
             transition-colors duration-200 ease-in-out 
             focus:outline-none 
             hover:scale-105"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg 
               text-slate-500 dark:text-slate-400 
               hover:text-indigo-500 dark:hover:text-indigo-400 
               hover:bg-slate-100 dark:hover:bg-slate-800 
               transition-colors duration-200 ease-in-out 
               focus:outline-none
               hover:scale-105"
          >
            <Bell size={20} />
            {notifications.some((n) => !n.read) && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500"></span>
            )}
          </button>
          {showNotifications && (
            <NotificationPopover
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
              viewAllPath="/admin/notifications"
            />
          )}
        </div>

        {/* 4. THAY THẾ KHU VỰC AVATAR BẰNG ĐIỀU KIỆN ĐĂNG NHẬP */}
        <div className="flex items-center">
          {isAuthenticated ? (
            // Đã đăng nhập: Hiện danh mục cá nhân của Admin
            <ProfileDropdown variant="admin" />
          ) : (
            // Chưa đăng nhập: Hiện nút Login màu Indigo đồng bộ với Dashboard Admin
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold 
                bg-indigo-600 text-white hover:bg-indigo-700 
                dark:bg-indigo-500 dark:hover:bg-indigo-600 
                transition-all shadow-sm active:scale-95"
            >
              <User size={15} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}