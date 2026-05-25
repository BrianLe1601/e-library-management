import { useState, useRef, useEffect } from "react";
import {
  Clock, CheckCircle, BookOpen, AlertTriangle, Info, Trash2, 
  Archive, BellOff, ChevronLeft, ChevronRight, RotateCcw, Check
} from "lucide-react";
import { mockNotifications } from "../../components/NotificationPopover";

const filterLabels = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "overdue", label: "Overdue" },
  { key: "system", label: "System" },
];

const notifIcon = {
  overdue: { icon: Clock, color: "text-red-500", label: "Overdue" },
  approved: { icon: CheckCircle, color: "text-emerald-500", label: "Approved" },
  returned: { icon: BookOpen, color: "text-sky-500", label: "Returned" },
  fine: { icon: AlertTriangle, color: "text-amber-500", label: "Fine" },
  system: { icon: Info, color: "text-slate-500", label: "System" },
};

const typeBadge = {
  overdue: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  approved: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  returned: "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400",
  fine: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  system: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
};

const extraNotifications = [
  { id: "6", type: "overdue", message: 'Book "Tắt Đèn" is overdue by 5 days. Fine accumulating at $0.50/day.', time: "3 days ago", read: false },
  { id: "7", type: "approved", message: 'Borrow request for "Nhật Ký Trong Tù" approved for user Hà Linh.', time: "3 days ago", read: true },
  { id: "8", type: "fine", message: 'Fine of $12.00 issued to user Văn Toàn.', time: "4 days ago", read: true },
  { id: "9", type: "system", message: "Scheduled maintenance completed. Database reindexed successfully.", time: "5 days ago", read: true },
  { id: "10", type: "returned", message: 'User Ngọc Bảo returned "Truyện Kiều" one day early.', time: "6 days ago", read: true },
];

const initialNotifications = [...mockNotifications, ...extraNotifications];
const ITEMS_PER_PAGE = 5;

function applyFilter(items, filter) {
  switch (filter) {
    case "unread":
      return items.filter((item) => !item.read);
    case "overdue":
      return items.filter((item) => item.type === "overdue" || item.type === "fine");
    case "system":
      return items.filter((item) => item.type === "system");
    default:
      return items;
  }
}

export default function NotificationsPage() {
  const [viewMode, setViewMode] = useState("active");
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [archivedNotifications, setArchivedNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState("");

  const toastTimeoutRef = useRef(null);

  const activeList = applyFilter(notifications, filter);
  const archivedList = applyFilter(archivedNotifications, filter);
  const currentList = viewMode === "archived" ? archivedList : activeList;
  const pageCount = Math.max(1, Math.ceil(currentList.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, pageCount);
  const pageItems = currentList.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    return () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); };
  }, []);

  function showToast(message) {
    setToastMessage(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(""), 2500);
  }

  function setMode(mode) {
    setViewMode(mode);
    setFilter("all");
    setCurrentPage(1);
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    showToast("All notifications marked as read.");
  }

  function markRead(id) {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }

  function archiveNotification(id) {
    setNotifications((prev) => {
      const archivedItem = prev.find((item) => item.id === id);
      if (!archivedItem) return prev;
      setArchivedNotifications((prevArchived) => [{ ...archivedItem, read: true }, ...prevArchived]); // Tự động đánh dấu đã đọc khi lưu trữ
      return prev.filter((item) => item.id !== id);
    });
    showToast("Notification archived.");
  }

  function restoreNotification(id) {
    setArchivedNotifications((prev) => {
      const restoredItem = prev.find((item) => item.id === id);
      if (!restoredItem) return prev;
      setNotifications((prevNotifications) => [restoredItem, ...prevNotifications]);
      return prev.filter((item) => item.id !== id);
    });
    showToast("Notification restored.");
  }

  function deleteNotification(id) {
    if (viewMode === "archived") {
      setArchivedNotifications((prev) => prev.filter((item) => item.id !== id));
    } else {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }
    showToast("Notification deleted permanently.");
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#0B1120] px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Toast (Thêm hiệu ứng animate mượt) */}
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-2xl shadow-slate-900/10 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Check size={14} strokeWidth={3} />
          </div>
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>

        {/* HEADER */}
        <header className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Admin center</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 tracking-tight dark:text-white">Notifications</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Manage all library alerts, user requests, and system updates here.
              </p>
            </div>
            
            {/* Cải thiện Stats Box */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-2.5 dark:bg-indigo-900/20">
                <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{unreadCount} Unread</span>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {notifications.length} Active
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {archivedNotifications.length} Archived
              </div>
            </div>
          </div>
        </header>

        {/* TABS & ACTIONS */}
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            
            <div className="flex gap-2">
              <button onClick={() => setMode("active")} className={`flex-1 sm:flex-none rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all ${viewMode === "active" ? "bg-slate-900 text-white dark:bg-indigo-600" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}>
                Active Inbox
              </button>
              <button onClick={() => setMode("archived")} className={`flex-1 sm:flex-none rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all ${viewMode === "archived" ? "bg-slate-900 text-white dark:bg-indigo-600" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}>
                Archive
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pl-2 lg:pl-0">
               {/* Lọc Tag */}
               <div className="flex gap-1 border-r border-slate-200 dark:border-slate-700 pr-3 mr-1">
                  {filterLabels.map((item) => (
                    <button key={item.key} onClick={() => { setFilter(item.key); setCurrentPage(1); }}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${filter === item.key ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}
                    >
                      {item.label}
                    </button>
                  ))}
               </div>

              {viewMode === "active" && unreadCount > 0 && (
                <button onClick={markAllRead} className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20">
                  Mark all read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LIST & PAGINATION */}
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between px-2 mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Showing {pageItems.length} of {currentList.length} notifications
              </p>
            </div>
            
            {/* Pagination Box */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={activePage <= 1} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-400">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-12 text-center">
                {activePage} / {pageCount}
              </span>
              <button onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} disabled={activePage >= pageCount} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-400">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {pageItems.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="rounded-full bg-white p-4 shadow-sm dark:bg-slate-900 mb-4">
                <BellOff className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">All caught up!</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No notifications in this section.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pageItems.map((item) => {
                const meta = notifIcon[item.type] || notifIcon.system;
                const isUnread = !item.read && viewMode === "active";
                
                return (
                  <div key={item.id} onClick={() => viewMode === "active" && markRead(item.id)}
                    className={`group relative flex items-start justify-between gap-4 rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${
                      isUnread
                        ? "bg-indigo-50/40 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800/50 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300 dark:bg-transparent dark:border-slate-800 dark:hover:border-slate-700"
                    }`}
                  >
                    {/* Dấu chấm xanh unread báo hiệu tinh tế thay vì nhãn "New" to */}
                    {isUnread && (
                      <div className="absolute top-4 left-4 h-2.5 w-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
                    )}

                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${isUnread ? "border-indigo-200 dark:border-indigo-700/50 bg-white dark:bg-slate-900" : "border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"}`}>
                        <meta.icon className={meta.color} size={18} />
                      </div>
                      <div className="min-w-0 pr-8">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${typeBadge[item.type]}`}>
                            {meta.label}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">• {item.time}</span>
                        </div>
                        <p className={`text-sm leading-6 ${isUnread ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                          {item.message}
                        </p>
                      </div>
                    </div>

                    {/* Nút Action: Sửa hiển thị trên Mobile */}
                    <div className="absolute right-4 top-4 flex flex-col sm:flex-row items-center gap-1 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100">
                      {viewMode === "archived" ? (
                        <button onClick={(e) => { e.stopPropagation(); restoreNotification(item.id); }} className="rounded-xl bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200 hover:text-indigo-600 dark:bg-slate-800 dark:ring-slate-700 dark:hover:text-indigo-400 transition" title="Restore">
                          <RotateCcw size={16} />
                        </button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); archiveNotification(item.id); }} className="rounded-xl bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:ring-slate-700 dark:hover:text-white transition" title="Archive">
                          <Archive size={16} />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(item.id); }} className="rounded-xl bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200 hover:text-red-500 dark:bg-slate-800 dark:ring-slate-700 dark:hover:text-red-400 transition" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
