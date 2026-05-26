import { useState, useRef, useEffect, useCallback } from "react";
import {
  Clock, CheckCircle, BookOpen, AlertTriangle, Info, Trash2,
  Archive, BellOff, ChevronLeft, ChevronRight, RotateCcw, Check,
  Plus, X, Search, CheckSquare, Square, Loader2
} from "lucide-react";
import ComposeModal from "../../components/admin/ComposeModal";
import NotificationDetail from "../../components/admin/NotificationDetail";
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  archiveNotificationApi, restoreNotificationApi, deleteNotificationApi,
  bulkActionNotificationsApi, createNotificationApi, getUsers
} from "../../services/adminService";

const filterLabels = [
  { key: "all",     label: "All" },
  { key: "unread",  label: "Unread" },
  { key: "overdue", label: "Overdue" },
  { key: "system",  label: "System" },
];

const notifIcon = {
  overdue:  { icon: Clock,         color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/20",       label: "Overdue" },
  approved: { icon: CheckCircle,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", label: "Approved" },
  returned: { icon: BookOpen,      color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-950/20",       label: "Returned" },
  fine:     { icon: AlertTriangle, color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/20",   label: "Fine" },
  system:   { icon: Info,          color: "text-slate-500",   bg: "bg-slate-50 dark:bg-slate-950/20",   label: "System" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications]   = useState([]);
  const [stats, setStats]                   = useState({ unreadCount: 0, activeCount: 0, archivedCount: 0 });
  const [loading, setLoading]               = useState(true);

  const [filter, setFilter]                 = useState("all");
  const [viewMode, setViewMode]             = useState("active");
  const [searchQuery, setSearchQuery]       = useState("");

  const [page, setPage]                     = useState(1);
  const [totalPages, setTotalPages]         = useState(1);
  const limit                               = 10;

  const [selectedNotifId, setSelectedNotifId] = useState(null);
  const [selectedIds, setSelectedIds]         = useState([]);

  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [userList, setUserList]             = useState([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const [toastMessage, setToastMessage]     = useState("");
  const toastTimeoutRef                     = useRef(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  // [FIX] useCallback để tránh tạo lại hàm mỗi render và dùng được trong useEffect
  const fetchNotifications = useCallback(async (overridePage) => {
    try {
      setLoading(true);
      const res = await getNotifications({
        page:        overridePage ?? page,
        limit,
        filter:      filter === "all" ? "" : filter,
        is_archived: viewMode === "archived" ? 1 : 0,
        // [FIX] search: trước đây dùng tên field "search" nhưng không truyền vào hàm
        search:      searchQuery,
        viewMode,   // giữ lại để backend nhận viewMode
      });

      if (res.data?.success) {
        const notifArray = res.data.data.data       || [];
        const newStats   = res.data.data.stats      || { unreadCount: 0, activeCount: 0, archivedCount: 0 };
        const newTotal   = res.data.data.totalPages || 1;

        setNotifications(notifArray);
        setStats(newStats);
        setTotalPages(newTotal);

        // [FIX] Chọn item đầu tiên nếu item đang chọn không còn trong danh sách mới
        setSelectedNotifId((prev) => {
          const stillExists = notifArray.some((n) => n.id === prev);
          if (notifArray.length === 0) return null;
          if (!prev || !stillExists) return notifArray[0].id;
          return prev;
        });
      }
    } catch (err) {
      console.error('[fetchNotifications]', err);
    } finally {
      setLoading(false);
    }
  }, [page, filter, viewMode, searchQuery]);

  // Chạy lại khi đổi tab/filter/trang
  useEffect(() => {
    fetchNotifications();
    setSelectedIds([]);
  }, [page, filter, viewMode]);

  // Debounce search — reset về trang 1 khi search thay đổi
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchNotifications(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Lazy load danh sách user khi mở modal
  useEffect(() => {
    if (isModalOpen && userList.length === 0) {
      getUsers({ page: 1, limit: 100 })
        .then((res) => {
          if (res.data?.success) setUserList(res.data.data.users || []);
        })
        .catch(console.error);
    }
  }, [isModalOpen]);

  // ─── Toast ────────────────────────────────────────────────────────────────
  const showToast = (message) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(""), 2500);
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectNotif = async (id) => {
    setSelectedNotifId(id);
    const target = notifications.find((n) => n.id === id);
    if (target && !target.is_read) {
      try {
        await markNotificationRead(id);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
        setStats((prev) => ({ ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setStats((prev) => ({ ...prev, unreadCount: 0 }));
      showToast("Tất cả thông báo đã được đánh dấu đã đọc");
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (id) => {
    try {
      await archiveNotificationApi(id);
      showToast("Đã lưu trữ thông báo");
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreNotificationApi(id);
      showToast("Đã khôi phục thông báo");
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotificationApi(id);
      showToast("Đã xóa vĩnh viễn");
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkActionNotificationsApi(action, selectedIds);
      showToast(`Đã xử lý ${selectedIds.length} mục`);
      setSelectedIds([]);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispatchAlert = async (formData, resetForm) => {
    if (!formData.title || !formData.message) return;
    try {
      setIsSubmittingForm(true);
      const payload = { ...formData };
      if (payload.scope === "all") payload.user_id = null;
      if (!payload.borrow_id) payload.borrow_id = null;
      if (!payload.book_id)   payload.book_id   = null;

      await createNotificationApi(payload);
      showToast("Gửi thông báo thành công!");
      setIsModalOpen(false);
      resetForm();
      // [FIX] Sau khi tạo thông báo mới, quay về trang 1 của Inbox để thấy ngay
      setViewMode("active");
      setFilter("all");
      setPage(1);
      fetchNotifications(1);
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi gửi thông báo");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Chọn/bỏ tất cả
  const handleToggleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === notifications.length && notifications.length > 0
        ? []
        : notifications.map((n) => n.id)
    );
  };

  const allSelected = selectedIds.length === notifications.length && notifications.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 bg-slate-50/50 dark:bg-[#060a13] min-h-screen text-slate-900 dark:text-slate-100">

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-2xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 ${toastMessage ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"}`}>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          <Check size={14} strokeWidth={3} />
        </div>
        <p className="text-sm font-medium">{toastMessage}</p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            System Alerts & Notifications
            {stats.unreadCount > 0 && (
              <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                {stats.unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Broadcast system alerts or manage library user notifications.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus size={16} /> <span>Dispatch Alert</span>
        </button>
      </div>

      {/* Tabs: Inbox / Archived */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { key: "active",   label: "Inbox",    count: stats.activeCount },
          { key: "archived", label: "Archived", count: stats.archivedCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setViewMode(tab.key); setPage(1); setSelectedIds([]); }}
            className={`pb-3 text-xs font-black transition-all relative px-2 ${
              viewMode === tab.key
                ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            {tab.label} ({tab.count || 0})
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left panel — danh sách */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* Search + Filter */}
          <div className="flex flex-col gap-3 p-4 bg-white dark:bg-[#090f1c] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search alert topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {filterLabels.map((lbl) => (
                <button
                  key={lbl.key}
                  onClick={() => { setFilter(lbl.key); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    filter === lbl.key
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {lbl.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="bg-white dark:bg-[#090f1c] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">

            {/* Toolbar: Select All + Mark All Read */}
            <div className="hidden md:flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#0b1222]">
              <button
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                {allSelected
                  ? <CheckSquare size={16} className="text-indigo-600" />
                  : <Square size={16} />}
                <span>Select All</span>
              </button>
              {viewMode === "active" && stats.unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 px-2 py-1 rounded-md transition-colors"
                >
                  <Check size={14} /> Mark all read
                </button>
              )}
            </div>

            {/* Items */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="py-20 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <BellOff size={28} className="stroke-1 text-slate-300 dark:text-slate-700" />
                  <span className="text-xs font-medium">No notifications found</span>
                </div>
              ) : (
                notifications.map((item) => {
                  const Config     = notifIcon[item.type] || notifIcon.system;
                  const isSelected = selectedNotifId === item.id;
                  const isChecked  = selectedIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectNotif(item.id)}
                      className={`flex items-start gap-3 p-3.5 cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-[#0d1629] ${
                        isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/10 border-l-4 border-indigo-600" : "border-l-4 border-transparent"
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className="hidden md:block mt-0.5 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIds((p) =>
                            p.includes(item.id) ? p.filter((i) => i !== item.id) : [...p, item.id]
                          );
                        }}
                      >
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                          {isChecked
                            ? <CheckSquare size={16} className="text-indigo-600" />
                            : <Square size={16} />}
                        </button>
                      </div>

                      {/* Icon */}
                      <div className={`p-2 rounded-xl shrink-0 ${Config.bg} ${Config.color}`}>
                        <Config.icon size={16} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-400 font-medium">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                          {/* [FIX] Unread dot: dùng !! để tránh lỗi khi is_read là số 0/1 từ MySQL */}
                          {!item.is_read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                          )}
                        </div>
                        <h4 className={`text-xs truncate text-slate-900 dark:text-white ${!item.is_read ? "font-black" : "font-medium"}`}>
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mark all read — mobile */}
            {viewMode === "active" && stats.unreadCount > 0 && (
              <div className="md:hidden p-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-[#0a1120]">
                <button
                  onClick={handleMarkAllRead}
                  className="w-full py-2 px-3 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20"
                >
                  <Check size={14} /> Mark all read
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#0b1222]">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] font-bold text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — chi tiết */}
        <div className="lg:col-span-7">
          <NotificationDetail
            selectedNotif={notifications.find((n) => n.id === selectedNotifId)}
            viewMode={viewMode}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Bulk toolbar (desktop) */}
      {selectedIds.length > 0 && (
        <div className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2 z-50 items-center gap-4 rounded-full bg-slate-900 dark:bg-white px-6 py-3.5 text-white dark:text-slate-900 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
          <span className="text-xs font-black bg-white/20 dark:bg-slate-950/10 px-3 py-1 rounded-full">
            {selectedIds.length} selected
          </span>
          <div className="h-5 w-[1px] bg-slate-700 dark:bg-slate-300" />
          {viewMode === "active" ? (
            <button
              onClick={() => handleBulkAction("archive")}
              className="flex items-center gap-1.5 text-xs font-bold hover:text-indigo-400 transition-colors"
            >
              <Archive size={14} /> Archive
            </button>
          ) : (
            // [FIX] action='restore' — trước đây không được xử lý ở backend
            <button
              onClick={() => handleBulkAction("restore")}
              className="flex items-center gap-1.5 text-xs font-bold hover:text-indigo-400 transition-colors"
            >
              <RotateCcw size={14} /> Restore
            </button>
          )}
          <button
            onClick={() => handleBulkAction("delete")}
            className="flex items-center gap-1.5 text-xs font-bold hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="p-1 rounded-full hover:bg-slate-800 dark:hover:bg-slate-200 ml-2"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <ComposeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userList={userList}
        onSubmit={handleDispatchAlert}
        isSubmitting={isSubmittingForm}
      />
    </div>
  );
}