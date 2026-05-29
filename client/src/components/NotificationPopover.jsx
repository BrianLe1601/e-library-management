import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, CheckCircle, BookOpen, AlertTriangle, Info, X, Bell,
} from "lucide-react";

const NOTIF_CONFIG = {
  overdue:  { icon: Clock,         color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/20",     label: "Quá hạn" },
  approved: { icon: CheckCircle,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", label: "Duyệt mượn" },
  returned: { icon: BookOpen,      color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-950/20",     label: "Trả sách" },
  fine:     { icon: AlertTriangle, color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/20", label: "Phạt" },
  system:   { icon: Info,          color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950/20",label: "Hệ thống" },
};

const getSmartType = (type, title, message) => {
  if (["overdue", "approved", "returned", "fine"].includes(type)) return type;
  const text = ((title || "") + " " + (message || "")).toLowerCase();
  if (text.includes("quá hạn")) return "overdue";
  if (text.includes("trả") || text.includes("hoàn trả")) return "returned";
  if (text.includes("duyệt") || text.includes("mượn") || text.includes("thành công")) return "approved";
  if (text.includes("phạt")) return "fine";
  return "system";
};

export function NotificationPopover({
  notifications = [],
  onClose,
  onMarkAllRead,
  onMarkOneRead,
  viewAllPath = "/notifications",
}) {
  const ref         = useRef(null);
  const navigate    = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const handleItemClick = (n) => {
    if (!n.read && onMarkOneRead) onMarkOneRead(n.id);
    navigate(viewAllPath);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-3 w-[350px] z-50 rounded-2xl shadow-2xl
        bg-white dark:bg-[#0f1629] border border-slate-200 dark:border-slate-700/60
        animate-in fade-in slide-in-from-top-2 duration-150"
      style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.18))" }}
    >
      <div className="absolute -top-[7px] right-[18px] w-3.5 h-3.5 rotate-45 rounded-sm bg-white dark:bg-[#0f1629] border-l border-t border-slate-200 dark:border-slate-700/60" />

      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-indigo-500" />
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold leading-none min-w-[18px]">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors">
              Mark all as read
            </button>
          )}
          <button onClick={onClose} className="flex items-center justify-center w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all">
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <Bell size={28} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-400 dark:text-slate-500 text-xs">No notifications</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {notifications.slice(0, 5).map((n) => {
              const smartType = getSmartType(n.type, n.title, n.message);
              const cfg  = NOTIF_CONFIG[smartType] || NOTIF_CONFIG.system;
              const Icon = cfg.icon;
              return (
                <li
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                    ${!n.read ? "bg-indigo-50/60 dark:bg-indigo-900/10 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"}`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}>
                    <Icon size={14} className={cfg.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {n.title && (
                      <p className={`text-[11px] font-bold leading-snug truncate ${!n.read ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
                        {n.title}
                      </p>
                    )}
                    <p className={`text-xs leading-snug ${!n.read ? "text-slate-700 dark:text-slate-200 font-medium" : "text-slate-500 dark:text-slate-400"} ${n.title ? "mt-0.5" : ""}`}>
                      {n.message}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">{n.time}</p>
                  </div>

                  {!n.read && <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/60">
        <button onClick={() => { navigate(viewAllPath); onClose(); }} className="w-full py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
          View All Notifications
        </button>
      </div>
    </div>
  );
}