/**
 * pages/user/NotificationsTab.jsx
 * Kết nối thật với GET /api/users/notifications
 */

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Clock, CheckCircle2, BookOpen, Info, Bell } from "lucide-react";
import userService from "../../services/userService";

// ── TYPE_CONFIG — đồng bộ NOTIF_CONFIG trong NotificationComponents.jsx ───────
const TYPE_CONFIG = {
  overdue:  {
    icon: Clock,
    classes: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50",
    iconClass: "text-red-500",
  },
  approved: {
    icon: CheckCircle2,
    classes: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50",
    iconClass: "text-emerald-500",
  },
  returned: {
    icon: BookOpen,
    classes: "bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/50",
    iconClass: "text-sky-500",
  },
  fine: {
    icon: AlertTriangle,
    classes: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50",
    iconClass: "text-amber-500",
  },
  system: {
    icon: Info,
    classes: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50",
    iconClass: "text-indigo-500",
  },
};

const Skeleton = () => (
  <div className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
);

export default function NotificationsTab() {
  const [notifList, setNotifList] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("all");   // "all" | "unread"

  // ── Fetch từ API ────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res     = await userService.getMyNotifications({ page: 1, limit: 50, filter });
      const payload = res.data?.data?.rows || res.data?.data || [];
      setNotifList(
        payload.map((n) => ({
          id:      n.id,
          type:    n.type    || "system",
          title:   n.title   || "",
          message: n.message || "",
          date:    new Date(n.created_at).toLocaleString("vi-VN", {
            hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",
          }),
          read: Boolean(n.is_read),
        }))
      );
    } catch (err) {
      console.error("[NotificationsTab] fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── Mark all read ──────────────────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await userService.markAllNotificationsRead();
      setNotifList((p) => p.map((n) => ({ ...n, read: true })));
    } catch (err) { console.error("[NotificationsTab] markAllRead:", err); }
  };

  // ── Mark one read ──────────────────────────────────────────────────────────
  const markOneRead = async (id) => {
    if (notifList.find((n) => n.id === id)?.read) return;   // đã đọc rồi thì bỏ qua
    try {
      await userService.markNotificationRead(id);
      setNotifList((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) { console.error("[NotificationsTab] markOneRead:", err); }
  };

  const unreadCount = notifList.filter((n) => !n.read).length;

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-blue-700 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Your borrow & library activity updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* ── Filter pills ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-5">
        {[{ key: "all", label: "All" }, { key: "unread", label: "Unread" }].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === f.key
                ? "bg-blue-700 text-white"
                : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} />)}
        </div>

      ) : notifList.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <Bell className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Everything looks good!</p>
        </div>

      ) : (
        <div className="space-y-3">
          {notifList.map((notif) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
            const Icon   = config.icon;
            return (
              <div
                key={notif.id}
                onClick={() => markOneRead(notif.id)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  notif.read
                    ? "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-70"
                    : config.classes
                }`}
              >
                <div className={`mt-0.5 shrink-0 ${config.iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  {notif.title && (
                    <p className={`text-sm font-semibold mb-0.5 ${
                      notif.read ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
                    }`}>
                      {notif.title}
                    </p>
                  )}
                  <p className={`text-sm leading-relaxed ${
                    notif.read ? "text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"
                  }`} style={{ fontWeight: notif.read ? 400 : 500 }}>
                    {notif.message}
                  </p>
                  {notif.date && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notif.date}</p>
                  )}
                </div>
                {!notif.read && (
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}