import { useState } from "react";
import {
  Clock,
  CheckCircle,
  BookOpen,
  AlertTriangle,
  Info,
  Trash2,
  Archive,
  BellOff,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
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
  overdue: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  approved: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  returned: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-slate-300",
  fine: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  system: "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400",
};

const extraNotifications = [
  {
    id: "6",
    type: "overdue",
    message: 'Book "Tắt Đèn" is overdue by 5 days. Fine accumulating at $0.50/day.',
    time: "3 days ago",
    read: false,
  },
  {
    id: "7",
    type: "approved",
    message: 'Borrow request for "Nhật Ký Trong Tù" approved for user Hà Linh.',
    time: "3 days ago",
    read: true,
  },
  {
    id: "8",
    type: "fine",
    message: 'Fine of $12.00 issued to user Văn Toàn.',
    time: "4 days ago",
    read: true,
  },
  {
    id: "9",
    type: "system",
    message: "Scheduled maintenance completed. Database reindexed successfully.",
    time: "5 days ago",
    read: true,
  },
  {
    id: "10",
    type: "returned",
    message: 'User Ngọc Bảo returned "Truyện Kiều" one day early.',
    time: "6 days ago",
    read: true,
  },
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

  const activeList = applyFilter(notifications, filter);
  const archivedList = applyFilter(archivedNotifications, filter);
  const currentList = viewMode === "archived" ? archivedList : activeList;
  const pageCount = Math.max(1, Math.ceil(currentList.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, pageCount);
  const pageItems = currentList.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const activeCount = notifications.length;
  const archivedCount = archivedNotifications.length;

  function showToast(message) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 2500);
  }

  function updatePage(page) {
    setCurrentPage(page);
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
      setArchivedNotifications((prevArchived) => [archivedItem, ...prevArchived]);
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
      showToast("Archived notification deleted.");
      return;
    }
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    showToast("Notification deleted.");
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {toastMessage && (
          <div className="fixed right-6 top-6 z-50 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <p className="text-sm font-medium">{toastMessage}</p>
          </div>
        )}

        <header className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-300">Admin notifications</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">Alerts and archive</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Active notifications are shown here. Archived items stay in the local archive state and can be reviewed in the archived tab.
              </p>
            </div>
            <div className="grid gap-3 sm:auto-cols-min sm:grid-flow-col">
              <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {unreadCount} unread
              </div>
              <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {activeCount} active
              </div>
              <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {archivedCount} archived
              </div>
            </div>
          </div>
        </header>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMode("active")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  viewMode === "active"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setMode("archived")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  viewMode === "archived"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                Archived
              </button>
            </div>
            <button
              onClick={markAllRead}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Mark all read
            </button>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap gap-2">
            {filterLabels.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setFilter(item.key);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === item.key
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {viewMode === "archived" ? "Archived notifications" : "Active notifications"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {currentList.length} items — page {activePage} of {pageCount}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updatePage(Math.max(1, activePage - 1))}
                disabled={activePage <= 1}
                className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => updatePage(Math.min(pageCount, activePage + 1))}
                disabled={activePage >= pageCount}
                className="rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {pageItems.length === 0 ? (
            <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              <BellOff className="mx-auto mb-4 h-10 w-10" />
              <p className="text-lg font-semibold">No notifications found</p>
              <p className="mt-2 text-sm">Try a different filter or switch to the other tab.</p>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              {pageItems.map((item) => {
                const meta = notifIcon[item.type] || notifIcon.system;
                return (
                  <div
                    key={item.id}
                    onClick={() => viewMode === "active" && markRead(item.id)}
                    className={`group flex items-start justify-between gap-4 rounded-[1.5rem] border px-5 py-4 transition cursor-pointer ${
                      item.read
                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        : "bg-indigo-50/70 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-700"
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-3xl border ${item.read ? "border-slate-200 dark:border-slate-700" : "border-indigo-200 dark:border-indigo-700"}`}>
                        <meta.icon className={meta.color} size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${typeBadge[item.type]}`}>
                            {meta.label}
                          </span>
                          {!item.read && viewMode === "active" && (
                            <span className="rounded-full bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white">New</span>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.message}</p>
                        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{item.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                      {viewMode === "archived" ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            restoreNotification(item.id);
                          }}
                          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
                          title="Restore"
                        >
                          <RotateCcw size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            archiveNotification(item.id);
                          }}
                          className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
                          title="Archive"
                        >
                          <Archive size={16} />
                        </button>
                      )}
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteNotification(item.id);
                        }}
                        className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:text-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-red-400"
                        title="Delete"
                      >
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
