import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, ChevronLeft, ChevronRight, Search, Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import ProfileDropdown from "./ProfileDropdown";
import { getAllBorrows } from "../../services/adminService";

export default function Header({ collapsed, setCollapsed, setMobileOpen }) {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Lấy danh sách đang chờ duyệt làm thông báo
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await getAllBorrows({ status: 'pending' });
        if (response.success && Array.isArray(response.data)) {
          setNotifications(response.data);
        }
      } catch (error) {
        console.error("Lỗi tự động lấy thông báo:", error);
      }
    };
    if (isAuthenticated) {
      fetchPendingCount();
      // Tự động làm mới mỗi 30 giây để cập nhật khi có độc giả mượn sách mới
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return (
    <header className="h-16 bg-white dark:bg-[#0d1526] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {/* Nút bật/tắt Sidebar (Desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* Nút bật/tắt Sidebar (Mobile) */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu size={18} />
        </button>

        {/* Thanh tìm kiếm */}
        <div className="hidden sm:flex items-center relative max-w-md w-full">
          <Search size={16} className="absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sách, tác giả hoặc độc giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        {/* Nút Đổi giao diện Sáng/Tối */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Nút Thông báo */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-[#0d1526]"></span>
            )}
          </button>
          {/* Popover xem nhanh số lượng yêu cầu mới */}
          {showNotifications && notifications.length > 0 && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Yêu cầu chờ duyệt</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-indigo-500">{notif.user_name}</span> muốn mượn cuốn <span className="italic">"{notif.book_title}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

        {/* Khối tài khoản */}
        {isAuthenticated ? (
          <ProfileDropdown />
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}