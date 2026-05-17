/**
 * pages/user/NotificationsTab.jsx
 * Database hiện tại CHƯA có bảng notifications.
 * File này dùng local state + tạo thông báo động từ dữ liệu mượn sách.
 * Khi backend bổ sung bảng notifications → đổi fetchNotifications() để gọi API.
 *
 * Cách cải thiện sau: thêm bảng notifications vào DB và API GET /api/notifications
 */

import { useState, useEffect } from "react";
import { AlertTriangle, Info, CheckCircle2, XCircle, Bell } from "lucide-react";
import borrowService from "../../services/borrowService";

const TYPE_CONFIG = {
  warning: {
    icon: AlertTriangle,
    classes: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    iconClass: "text-amber-500",
  },
  info: {
    icon: Info,
    classes: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    iconClass: "text-blue-500",
  },
  success: {
    icon: CheckCircle2,
    classes: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    iconClass: "text-green-500",
  },
  error: {
    icon: XCircle,
    classes: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    iconClass: "text-red-500",
  },
};

function daysLeft(d) {
  if (!d) return Infinity;
  const today   = new Date(); today.setHours(0,0,0,0);
  const due     = new Date(d); due.setHours(0,0,0,0);
  return Math.ceil((due - today) / 86400000);
}

function fmt(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Tạo thông báo động từ danh sách mượn sách */
function buildNotifications(myBooks) {
  const notifications = [];
  myBooks.forEach((b) => {
    const days = daysLeft(b.due_date);
    if (b.status === "overdue" || days < 0) {
      notifications.push({
        id:      `overdue-${b.id}`,
        type:    "error",
        message: `Sách "${b.title}" đã quá hạn ${Math.abs(days)} ngày (hạn: ${fmt(b.due_date)}). Vui lòng trả sớm để tránh phạt thêm.`,
        date:    fmt(b.due_date),
        read:    false,
      });
    } else if (days >= 0 && days <= 3) {
      notifications.push({
        id:      `warning-${b.id}`,
        type:    "warning",
        message: `Sách "${b.title}" sắp đến hạn trả (${fmt(b.due_date)}). Còn ${days} ngày — nhớ trả hoặc gia hạn nhé!`,
        date:    fmt(b.due_date),
        read:    false,
      });
    } else if (b.status === "returned") {
      notifications.push({
        id:      `returned-${b.id}`,
        type:    "success",
        message: `Bạn đã trả thành công sách "${b.title}" vào ngày ${fmt(b.return_date)}.`,
        date:    fmt(b.return_date),
        read:    true,
      });
    } else if (days > 3 && days <= 7) {
      notifications.push({
        id:      `info-${b.id}`,
        type:    "info",
        message: `Sách "${b.title}" còn ${days} ngày đến hạn trả (${fmt(b.due_date)}).`,
        date:    fmt(b.due_date),
        read:    true,
      });
    }
  });
  return notifications.sort((a, b) => a.read ? 1 : -1);
}

export function NotificationsTab({ onUnreadChange }) {
  const [notifList, setNotifList] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchAndBuild = async () => {
      try {
        const { data } = await borrowService.getMyBooks();
        if (data.success) {
          const built = buildNotifications(data.data);
          setNotifList(built);
          const unread = built.filter(n => !n.read).length;
          onUnreadChange?.(unread);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetchAndBuild();
  }, []);

  const markAllRead = () => {
    setNotifList(prev => prev.map(n => ({ ...n, read: true })));
    onUnreadChange?.(0);
  };

  const markOneRead = (id) => {
    setNotifList(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      onUnreadChange?.(updated.filter(n => !n.read).length);
      return updated;
    });
  };

  const unreadCount = notifList.filter(n => !n.read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-gray-900 dark:text-gray-100">Thông báo</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-700 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              {unreadCount} mới
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifList.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <Bell className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Không có thông báo nào</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Mọi thứ đều ổn với tài khoản của bạn!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifList.map((notif) => {
            const config = TYPE_CONFIG[notif.type];
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
                <div className="flex-1">
                  <p className={`text-sm leading-relaxed ${notif.read ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"}`}
                    style={{ fontWeight: notif.read ? 400 : 500 }}>
                    {notif.message}
                  </p>
                  {notif.date && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notif.date}</p>}
                </div>
                {!notif.read && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 mt-1.5" />}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 text-center">
        💡 Thông báo được tạo tự động từ dữ liệu mượn sách của bạn
      </p>
    </div>
  );
}