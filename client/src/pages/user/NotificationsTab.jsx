import { useState } from "react";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { notifications } from "../data/mockData";

const notifTypeConfig = {
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

export function NotificationsTab() {
  const [notifList, setNotifList] = useState(notifications);

  const markAllRead = () => {
    setNotifList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifList.filter((n) => !n.read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-gray-900 dark:text-gray-100">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-blue-700 text-white text-xs px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
              {unreadCount} new
            </span>
          )}
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

      <div className="space-y-3">
        {notifList.map((notif) => {
          const config = notifTypeConfig[notif.type];
          const Icon = config.icon;
          return (
            <div
              key={notif.id}
              onClick={() => setNotifList((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)))}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                notif.read
                  ? "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-70"
                  : `${config.classes}`
              }`}
            >
              <div className={`mt-0.5 shrink-0 ${config.iconClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm leading-relaxed ${
                    notif.read ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
                  }`}
                  style={{ fontWeight: notif.read ? 400 : 500 }}
                >
                  {notif.message}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notif.date}</p>
              </div>
              {!notif.read && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 mt-1.5" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
