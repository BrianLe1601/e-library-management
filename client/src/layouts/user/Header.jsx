import { Link } from "react-router-dom";
import { Search, User, BookOpen, Sun, Moon, Bell, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext"; // GỌI AUTH CONTEXT
import ProfileDropdown from "./ProfileDropdown";
import { NotificationPopover, mockNotifications } from "../../components/NotificationPopover";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showNotifications, setShowNotifications] = useState(false);

  // 1. BIẾN GIẢ LẬP TRẠNG THÁI ĐĂNG NHẬP (Bật true để hiện Profile, false để hiện nút Login)
  // Sau này khi làm Backend, bạn sẽ lấy giá trị này từ AuthContext (ví dụ: const { isLoggedIn } = useAuth())
  const [isLoggedIn, setIsLoggedIn] = useState(true); 
  
// THAY THẾ BIẾN GIẢ BẰNG BIẾN THẬT TỪ HỆ THỐNG
  const { isAuthenticated } = useAuth(); 
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-blue-900 dark:bg-slate-950 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg text-white hidden sm:block font-bold tracking-tight">
              E<span className="text-blue-300">Library</span>
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
                <Bell className="w-5 h-5" />
                {notifications.some((n) => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {showNotifications && (
                <NotificationPopover
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                  onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                  viewAllPath="/notifications"
                />
              )}
            </div>

            <div className="hidden md:flex items-center gap-1 ml-1 mr-2">
              <Link to="/books" className="px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg">
                Tìm Sách
              </Link>
            </div>

            {/* KIỂM TRA ĐĂNG NHẬP ĐỂ RENDER DROPDOWN HOẶC NÚT LOGIN */}
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <Link to="/login" className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold bg-white text-blue-900 hover:bg-blue-50 transition-all shadow-sm">
                <User size={15} />
                <span>Đăng Nhập</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 pt-4 space-y-3">
            <div className="flex flex-col gap-2">
              <Link to="/books" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 text-sm text-white bg-white/10 rounded-lg hover:bg-white/20">
                Tìm Sách
              </Link>
              {!isAuthenticated && (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 text-sm font-bold text-blue-950 bg-white rounded-lg hover:bg-blue-50">
                  Đăng Nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}