import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LayoutDashboard, BookMarked, User, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ProfileDropdown() {
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

  const initials = user.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'US';
  const shortName = user.full_name ? user.full_name.split(' ')[0] : 'User';

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-white/10 hover:bg-white/20 
                   rounded-xl transition-colors border border-white/20"
      >
        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center 
                        text-xs text-white font-semibold">
          {initials}
        </div>
        <span className="hidden sm:block text-sm text-white">{shortName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl 
                        shadow-xl border border-gray-200 dark:border-slate-700 py-2 w-56 z-50">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.full_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>

          <div className="p-1.5">
            {/* Nếu là Admin/Nhân viên thì cho phép vào thẳng trang Admin */}
            {isAdminOrEmployee ? (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 
                           hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" /> Quản Trị Hệ Thống
              </Link>
            ) : (
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 
                           hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" /> Bảng Điều Khiển
              </Link>
            )}

            <Link
              to="/dashboard?tab=borrowing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 
                         hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
            >
              <BookMarked className="w-4 h-4" /> Sách Đang Mượn
            </Link>

            <Link
              to="/dashboard?tab=settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 
                         hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-600 transition-colors"
            >
              <User className="w-4 h-4" /> Cài Đặt Hồ Sơ
            </Link>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-700 mt-1 p-1.5">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 
                         dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" /> Đăng Xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
