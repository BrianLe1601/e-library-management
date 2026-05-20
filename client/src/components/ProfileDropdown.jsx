import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, User, LogOut, LayoutDashboard, BookMarked } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * Unified ProfileDropdown Component
 * 
 * @param {string} variant - "user" (blue theme) or "admin" (indigo theme)
 * Shows different menu items based on user role and variant
 */
export default function ProfileDropdown({ variant = "user" }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout, isAdminOrEmployee } = useAuth();

  // Tự động đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.full_name ? user.full_name.substring(0, 2).toUpperCase() : (variant === "admin" ? 'AD' : 'US');
  const shortName = user.full_name ? user.full_name.split(' ')[0] : (variant === "admin" ? 'Admin' : 'User');

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  // Styling based on variant
  const triggerStyles = variant === "admin"
    ? "pl-1.5 pr-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-200 ease-in-out"
    : "pl-2 pr-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-white transition-colors";

  const avatarStyles = variant === "admin"
    ? "w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-inner"
    : "w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-xs text-white font-semibold";

  const dropdownBoxStyles = variant === "admin"
    ? "rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-100 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
    : "rounded-xl shadow-xl border border-gray-200 dark:border-slate-700";

  const menuItemHoverStyles = variant === "admin"
    ? "hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400"
    : "hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 pr-3 py-1.5 
                   focus:outline-none ${triggerStyles}`}
      >
        <div className={avatarStyles}>
          {initials}
        </div>
        <span className="hidden sm:block text-sm font-medium">{shortName}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''} ${variant === "user" ? 'text-white/70' : 'text-slate-500'}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className={`absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 
                        py-2 w-56 z-50 ${dropdownBoxStyles}`}>
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.full_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            {variant === "admin" && (
              <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                {user.role}
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div className="p-1.5">
            {variant === "admin" ? (
              // Admin variant: chỉ hiện Dashboard + Settings Profile
              <>
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 
                             ${menuItemHoverStyles} transition-colors`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>

                <Link
                  to="/admin/settings"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 
                             ${menuItemHoverStyles} transition-colors`}
                >
                  <User className="w-4 h-4" /> Hồ sơ cá nhân
                </Link>
              </>
            ) : (
              // User variant: hiện các items của user
              <>
                {/* Nếu là Admin/Nhân viên thì cho phép vào thẳng trang Admin */}
                {isAdminOrEmployee ? (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 
                               ${menuItemHoverStyles} transition-colors`}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Quản Trị Hệ Thống
                  </Link>
                ) : null}

                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 
                             ${menuItemHoverStyles} transition-colors`}
                >
                  <LayoutDashboard className="w-4 h-4" /> Bảng Điều Khiển
                </Link>

                <Link
                  to="/dashboard?tab=borrowing"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 
                             ${menuItemHoverStyles} transition-colors`}
                >
                  <BookMarked className="w-4 h-4" /> Sách Đang Mượn
                </Link>

                <Link
                  to="/dashboard?tab=settings"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 
                             ${menuItemHoverStyles} transition-colors`}
                >
                  <User className="w-4 h-4" /> Cài Đặt Hồ Sơ
                </Link>
              </>
            )}
          </div>

          {/* Logout Button */}
          <div className="border-t border-gray-100 dark:border-slate-700 mt-1 p-1.5">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium
                         text-red-600 dark:text-red-400 
                         hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left`}
            >
              <LogOut className="w-4 h-4" /> {variant === "admin" ? "Đăng xuất" : "Đăng Xuất"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
