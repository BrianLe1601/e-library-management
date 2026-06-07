import { useState } from "react";
import useSWR from "swr";
import { AlertTriangle, Clock, CheckCircle, CheckCircle2, BookOpen, Info, Bell, Trash2, CheckSquare } from "lucide-react";
import userService from "../../services/userService";

// ── CẤU HÌNH CỦA BẠN ────────────────────────────────────────────────────────
const NOTIF_CONFIG = {
  overdue:        { icon: Clock,         color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/20",         border: "border-red-200 dark:border-red-900/50",          label: "Overdue" },
  approved:       { icon: CheckCircle,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-900/50",  label: "Approved" },
  returned:       { icon: BookOpen,      color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-950/20",         border: "border-sky-200 dark:border-sky-900/50",          label: "Returned" },
  fine:           { icon: AlertTriangle, color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/20",     border: "border-amber-200 dark:border-amber-900/50",      label: "Fine" },
  system:         { icon: Info,          color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950/20",   border: "border-indigo-200 dark:border-indigo-900/50",    label: "System" },
  borrow_request: { icon: Clock,         color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-950/20",   border: "border-violet-200 dark:border-violet-900/50",    label: "Borrow Request" },
  return_request: { icon: BookOpen,      color: "text-cyan-500",    bg: "bg-cyan-50 dark:bg-cyan-950/20",       border: "border-cyan-200 dark:border-cyan-900/50",        label: "Return Request" },
  renew:          { icon: Clock,         color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-950/20",       border: "border-blue-200 dark:border-blue-900/50",        label: "Renewed" },
  rejected:       { icon: AlertTriangle, color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/20",         border: "border-red-200 dark:border-red-900/50",          label: "Rejected" },
};

const getSmartType = (type) => {
  return NOTIF_CONFIG[type]
    ? type
    : "system";
};

const Skeleton = () => (
  <div className="h-24 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
);

const fetcher = async ([url, filter]) => {
  const res = await userService.getMyNotifications({ page: 1, limit: 50, filter });
  const payload = res.data?.data?.rows || res.data?.data || [];
  
  return payload.map((n) => ({
    id:      n.id,
    type:    n.type    || "system",
    title:   n.title   || "",
    message: n.message || "",
    date:    new Date(n.created_at).toLocaleString("vi-VN", {
      hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",
    }),
    read: Boolean(n.is_read),
  }));
};

export default function NotificationsTab() {
  const [filter, setFilter] = useState("all"); 
  const [selectedIds, setSelectedIds] = useState([]); // State lưu các thông báo được chọn

  const { data: notifList = [], isLoading, mutate } = useSWR(
    ['/api/users/notifications', filter], 
    fetcher,
    { revalidateOnFocus: true } 
  );

  const markAllRead = async () => {
    const updatedList = notifList.map((n) => ({ ...n, read: true }));
    mutate(updatedList, false); 
    try {
      await userService.markAllNotificationsRead();
      mutate();
      window.dispatchEvent(new Event("notifications_updated"));
    } catch (err) {
      mutate(); 
    }
  };

  const markOneRead = async (id) => {
    if (notifList.find((n) => n.id === id)?.read) return;
    const updatedList = notifList.map((n) => (n.id === id ? { ...n, read: true } : n));
    mutate(updatedList, false);
    try {
      await userService.markNotificationRead(id);
      mutate(); 
      window.dispatchEvent(new Event("notifications_updated")); 
    } catch (err) {
      mutate(); 
    }
  };

  // ── XÓA 1 THÔNG BÁO ───────────────────────────────────────────────────────
  const deleteOne = async (e, id) => {
    e.stopPropagation(); 
    const updatedList = notifList.filter((n) => n.id !== id);
    mutate(updatedList, false);
    try {
      await userService.deleteNotification(id);
      mutate(); 
      window.dispatchEvent(new Event("notifications_updated"));
    } catch (err) {
      mutate(); 
    }
  };

  // ── XÓA NHIỀU THÔNG BÁO ───────────────────────────────────────────────────
  const deleteMultiple = async () => {
    if (selectedIds.length === 0) return;
    
    // 1. Cập nhật UI trước (Optimistic UI)
    const updatedList = notifList.filter((n) => !selectedIds.includes(n.id));
    mutate(updatedList, false);
    
    // Lưu lại danh sách ID để xóa và reset state
    const idsToDelete = [...selectedIds];
    setSelectedIds([]);

    try {
      // 2. Gọi API xóa nhiều
      await userService.deleteMultipleNotifications({ ids: idsToDelete });
      mutate(); 
      window.dispatchEvent(new Event("notifications_updated"));
    } catch (err) {
      console.error("Lỗi xóa nhiều:", err);
      mutate(); 
    }
  };

  // Hàm xử lý chọn/bỏ chọn checkbox
  const toggleSelect = (e, id) => {
    e.stopPropagation(); // Ngăn click vào thẻ cha
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Hàm chọn tất cả / Bỏ chọn tất cả
  const toggleSelectAll = () => {
    if (selectedIds.length === notifList.length) {
      setSelectedIds([]); // Bỏ chọn hết
    } else {
      setSelectedIds(notifList.map(n => n.id)); // Chọn hết
    }
  };

  const unreadCount = notifList.filter((n) => !n.read).length;

  return (
    <div>
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
        
        {/* Nút tác vụ góc phải */}
        <div className="flex items-center gap-4">
          {selectedIds.length > 0 && (
            <button 
              onClick={deleteMultiple}
              className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-800 transition-colors bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg"
            >
              <Trash2 size={16} />
              Xóa ({selectedIds.length})
            </button>
          )}
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors">
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {[{ key: "all", label: "All" }, { key: "unread", label: "Unread" }].map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setSelectedIds([]); }}
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
        
        {/* Nút Chọn tất cả */}
        {notifList.length > 0 && (
          <button 
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <CheckSquare size={16} />
            {selectedIds.length === notifList.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>
        )}
      </div>

      {isLoading ? (
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
            const smartType = getSmartType(notif.type, notif.title, notif.message);
            const cfg  = NOTIF_CONFIG[smartType] || NOTIF_CONFIG.system;
            const Icon = cfg.icon;
            const isSelected = selectedIds.includes(notif.id);

            return (
              <div
                key={notif.id}
                onClick={() => markOneRead(notif.id)}
                className={`group relative flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected ? "border-red-400 bg-red-50/30 dark:bg-red-900/10" :
                  notif.read
                    ? "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                    : "bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50"
                }`}
              >
                {/* ── Checkbox ───────────────────────────────────────────── */}
                <div className="pt-2">
                  <input 
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => toggleSelect(e, notif.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 cursor-pointer text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                  />
                </div>

                <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg}`}>
                  <Icon size={18} className={cfg.color} />
                </div>
                
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {notif.title && (
                    <p className={`text-sm font-semibold mb-0.5 ${notif.read ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>
                      {notif.title}
                    </p>
                  )}
                  <p className={`text-sm leading-relaxed ${notif.read ? "text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"}`} style={{ fontWeight: notif.read ? 400 : 500 }}>
                    {notif.message}
                  </p>
                  {notif.date && (
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1.5">{notif.date}</p>
                  )}
                </div>
                
                {!notif.read && (
                  <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full shrink-0 mt-1.5" />
                )}

                <button
                  onClick={(e) => deleteOne(e, notif.id)}
                  title="Xóa thông báo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}