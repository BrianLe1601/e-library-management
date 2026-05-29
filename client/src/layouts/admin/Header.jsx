// layouts/admin/Header.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Menu, ChevronLeft, ChevronRight, Bell, Moon, Sun, User } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import ProfileDropdown from "../../components/ProfileDropdown";
import { NotificationPopover } from "../../components/NotificationPopover";
import adminService from "../../services/adminService";

// ── Chuẩn hoá payload ─────────────────────────────────────────────────────────
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

export default function Header({ collapsed, setCollapsed, setMobileOpen }) {
  const [notifications,     setNotifications]     = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const { theme, toggleTheme }  = useTheme();
  const { isAuthenticated, user } = useAuth();

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res     = await adminService.getNotifications({ page: 1, limit: 5, filter: "", is_archived: 0 });
      const payload = res.data?.data?.data || res.data?.data || [];
      setNotifications(payload.map(normalise));
    } catch (err) {
      if (![401, 403].includes(err?.response?.status)) {
        console.error("[AdminHeader] fetchNotifications:", err);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) { setNotifications([]); return; }
    fetchNotifications();
    const t = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(t);
  }, [user?.id, fetchNotifications]);

  // ── Mark all read ─────────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    try {
      await adminService.markAllNotificationsRead();
      setNotifications((p) => p.map((n) => ({ ...n, read: true })));
    } catch (err) { console.error("[AdminHeader] markAllRead:", err); }
  };

  // ── Mark one read ─────────────────────────────────────────────────────────
  const handleMarkOneRead = async (id) => {
    try {
      await adminService.markNotificationRead(id);
      setNotifications((p) => p.map((n) => (String(n.id) === String(id) ? { ...n, read: true } : n)));
    } catch (err) { console.error("[AdminHeader] markOneRead:", err); }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-white dark:bg-[#0f1629] border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3 shrink-0 top-0 z-50 h-16 w-full">

      {/* Mobile sidebar trigger */}
      <button className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-100"
        onClick={() => setMobileOpen(true)}>
        <Menu size={20} />
      </button>

      {/* Collapse toggle */}
      <button
        className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg
          text-slate-400 hover:text-slate-600 dark:hover:text-slate-100
          hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        onClick={() => setCollapsed((p) => !p)}
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <div className="ml-auto flex items-center gap-6">

        {/* Theme Toggle */}
        <button onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-lg
            text-slate-500 dark:text-slate-400
            hover:text-indigo-500 dark:hover:text-indigo-400
            hover:bg-slate-100 dark:hover:bg-slate-800
            transition-colors hover:scale-105">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Bell */}
        {user?.id && (
          <div className="relative">
            <button type="button"
              onClick={() => { setShowNotifications((p) => !p); if (!showNotifications) fetchNotifications(); }}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg
                text-slate-500 dark:text-slate-400
                hover:text-indigo-500 dark:hover:text-indigo-400
                hover:bg-slate-100 dark:hover:bg-slate-800
                transition-colors hover:scale-105"
            >
              <Bell size={20} />
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
                viewAllPath="/admin/notifications"
              />
            )}
          </div>
        )}

        {/* Profile / Login */}
        <div className="flex items-center">
          {isAuthenticated ? (
            <ProfileDropdown variant="admin" />
          ) : (
            <Link to="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold
                bg-indigo-600 text-white hover:bg-indigo-700
                dark:bg-indigo-500 dark:hover:bg-indigo-600
                transition-all shadow-sm active:scale-95">
              <User size={15} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}