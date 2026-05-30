// layouts/home/Header.jsx
import { Link } from "react-router-dom";
import { User, BookOpen, Sun, Moon, Bell, Menu, X, LayoutDashboard } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import ProfileDropdown from "../../components/ProfileDropdown";
import { NotificationPopover } from "../../components/NotificationPopover";
import userService from "../../services/userService";
import adminService from "../../services/adminService";

// ── Chuẩn hoá payload API → shape dùng trong Popover ─────────────────────────
const normalise = (n) => ({
  id:      String(n.id),
  type:    n.type    || "system",
  title:   n.title   || "",
  message: n.message || "",
  time:    new Date(n.created_at).toLocaleString("vi-VN", {
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit",
  }),
  read: Boolean(n.is_read),
});

export default function Header() {
  const [mobileMenuOpen,    setMobileMenuOpen]    = useState(false);
  const [notifications,     setNotifications]     = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { theme, toggleTheme }                       = useTheme();
  const { isAuthenticated, isAdminOrEmployee, user } = useAuth();

  // ── Fetch từ API ──────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (pageNum = 1, isPolling = false) => {
    if (!user?.id) return;
    if (pageNum > 1) setLoadingMore(true); // Bật loading nếu đang tải trang 2, 3...

    try {
      const limit = 10; // Mỗi lần tải 10 thông báo
      let payload = [];

      if (isAdminOrEmployee) {
        const res = await adminService.getNotifications({ page: pageNum, limit, filter: "", is_archived: 0 });
        payload   = res.data?.data?.data || res.data?.data || [];
      } else {
        const res = await userService.getMyNotifications({ page: pageNum, limit, filter: "all" });
        payload   = res.data?.data?.rows || res.data?.data || [];
      }

      const newItems = payload.map(normalise);

      // Nếu tải trang 1 (hoặc đang polling ngầm) thì ghi đè. Nếu cuộn tải thêm thì NỐI mảng
      if (pageNum === 1) {
        setNotifications(newItems);
      } else {
        setNotifications(prev => [...prev, ...newItems]);
      }

      // Nếu số lượng tải về ít hơn limit -> Đã hết dữ liệu trong DB
      if (!isPolling) {
        setHasMore(newItems.length === limit);
      }
    } catch (err) {
      if (![401, 403].includes(err?.response?.status)) {
        console.error("[HomeHeader] fetchNotifications:", err);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [user?.id, isAdminOrEmployee]);

  // Fetch khi user thay đổi + polling 60s
  useEffect(() => {
    if (!user?.id) { setNotifications([]); return; }
    fetchNotifications(1);
    const t = setInterval(() => fetchNotifications(1, true), 60_000);
    return () => clearInterval(t);
  }, [user?.id, fetchNotifications]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  // ── Mark all read ─────────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    try {
      if (isAdminOrEmployee) await adminService.markAllNotificationsRead();
      else                   await userService.markAllNotificationsRead();
      setNotifications((p) => p.map((n) => ({ ...n, read: true })));
    } catch (err) { console.error("[HomeHeader] markAllRead:", err); }
  };

  // ── Mark one read ─────────────────────────────────────────────────────────
  const handleMarkOneRead = async (id) => {
    try {
      if (isAdminOrEmployee) await adminService.markNotificationRead(id);
      else                   await userService.markNotificationRead(id);
      setNotifications((p) => p.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n)));
    } catch (err) { console.error("[HomeHeader] markOneRead:", err); }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const viewAllPath = isAdminOrEmployee ? "/admin/notifications" : "/user/notifications";

  return (
    <nav className="bg-blue-900 dark:bg-slate-950 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg text-white hidden sm:block" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
              E<span className="text-blue-300">Library</span>
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">

            {/* Dark Mode */}
            <button onClick={toggleTheme} type="button"
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white">
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Bell — chỉ render khi đã có user */}
            {user?.id && (
              <div className="relative">
                <button type="button"
                  onClick={() => { setShowNotifications((p) => !p); if (!showNotifications) fetchNotifications(); }}
                  className="relative p-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
                      flex items-center justify-center
                      bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationPopover
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                    onMarkAllRead={handleMarkAllRead}
                    onMarkOneRead={handleMarkOneRead}
                    viewAllPath={viewAllPath}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={handleLoadMore}
                  />
                )}
              </div>
            )}

            {/* Browse */}
            <div className="hidden md:flex items-center gap-1 ml-1">
              <Link to="/books"
                className="px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                Browse
              </Link>
            </div>

            {/* Profile / Login */}
            {isAuthenticated ? (
              isAdminOrEmployee ? (
                <Link to="/admin"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold
                    bg-indigo-600 text-white hover:bg-indigo-700
                    dark:bg-indigo-500 dark:hover:bg-indigo-600
                    transition-all shadow-sm active:scale-95">
                  <LayoutDashboard size={15} />
                  <span>Admin Panel</span>
                </Link>
              ) : (
                <ProfileDropdown variant="user" />
              )
            ) : (
              <Link to="/login"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold
                  bg-white text-blue-900 hover:bg-blue-50
                  dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700
                  transition-all shadow-sm active:scale-95">
                <User size={15} />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 pt-4">
            <div className="flex gap-2">
              <Link to="/books" onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 text-sm text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                Browse Books
              </Link>
              {isAuthenticated && (
                isAdminOrEmployee ? (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                    Admin Panel
                  </Link>
                ) : (
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 text-sm text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    Dashboard
                  </Link>
                )
              )}
              {!isAuthenticated && (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 text-sm font-bold text-blue-950 bg-white rounded-lg hover:bg-blue-50 transition-colors">
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}