import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Trash2, Archive, ChevronLeft, ChevronRight, RotateCcw, X, 
  Search, CheckSquare, Square, Plus, Bell, TrendingUp, Users, Check,
  Loader2
} from "lucide-react";

// Import cụm component sạch vừa gộp
import {
  StatPill, NotiCard, NotificationDetail, ComposeModal,
  MobileNotificationHeader, MobileNotificationFilters, MobileTabBar, MobileNotificationList, BulkActionBarMobile
} from "../../components/admin/NotificationComponents";

// API services kết nối trực tiếp cơ sở dữ liệu
import adminService from "../../services/adminService";

export default function NotificationsPage() {
  // ── States điều phối dữ liệu ─────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ unreadCount: 0, activeCount: 0, archivedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── States bộ lọc phân trang ──────────────────────────────────────────────
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("active"); // "active" | "archived"
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // ── States Chọn hàng loạt hàng đầu (Select All DB) ───────────────────────
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectAllDatabase, setIsSelectAllDatabase] = useState(false);
  const [isSelectionModeMobile, setIsSelectionModeMobile] = useState(false);

  // ── Detail & Modals States ────────────────────────────────────────────────
  const [selectedNotifId, setSelectedNotifId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userList, setUserList] = useState([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [mobileDetailItem, setMobileDetailItem] = useState(null);

  // Tổng số lượng bản ghi thực tế lấy từ stats dựa theo viewMode
  const totalRecordsCount = useMemo(() => {
    return viewMode === "archived" ? stats.archivedCount : stats.activeCount;
  }, [viewMode, stats]);

  // Kiểm tra trạng thái tích chọn trên trang hiện tại
  const isAllPageSelected = useMemo(() => {
    return notifications.length > 0 && selectedIds.length === notifications.length;
  }, [notifications, selectedIds]);

  // Tự động giải phóng bộ chọn khi thay đổi trang, tab hoặc từ khóa kiếm tìm
  useEffect(() => {
    setSelectedIds([]);
    setIsSelectAllDatabase(false);
  }, [page, filter, viewMode, searchQuery]);

  // ── FETCH DATA API COORD ──────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (resetMobileList = false) => {
    try {
      if (resetMobileList) {
        setLoading(true);
        setPage(1);
      }
      
      const currentPage = resetMobileList ? 1 : page;
      const res = await adminService.getNotifications({
        page: currentPage,
        limit: 10,
        filter: filter === "all" ? "" : filter,
        is_archived: viewMode === "archived" ? 1 : 0,
        search: searchQuery
      });

      if (res.data?.success) {
        const payload = res.data.data.data || res.data.data || [];
        const statsPayload = res.data.data.stats || res.data.stats || { unreadCount: 0, activeCount: 0, archivedCount: 0 };
        const serverTotalPages = res.data.data.totalPages || 1;

        setStats(statsPayload);
        setTotalPages(serverTotalPages);

        if (window.innerWidth < 768 && !resetMobileList && currentPage > 1) {
          // Mobile Infinite Append
          setNotifications(prev => [...prev, ...payload]);
        } else {
          // Desktop Overwrite
          setNotifications(payload);
          if (payload.length > 0 && !selectedNotifId) setSelectedNotifId(payload[0].id);
          else if (payload.length === 0) setSelectedNotifId(null);
        }
        setHasMore(currentPage < serverTotalPages);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách thông báo:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [page, filter, viewMode, searchQuery, selectedNotifId]);

  useEffect(() => {
    fetchNotifications(true);
  }, [filter, viewMode, searchQuery]);

  useEffect(() => {
    if (page > 1) fetchNotifications(false);
  }, [page]);

  useEffect(() => {
    const fetchUsersList = async () => {
      try {
        const res = await adminService.getUsers({ page: 1, limit: 500 });
        if (res.data?.success) {
          const users = res.data.data.users || res.data.data.rows || res.data.data.data || res.data.data || [];
          setUserList(users);
        }
      } catch (error) { 
        console.error("Lỗi tải danh sách người dùng:", error); 
      }
    };

    if (isModalOpen && userList.length === 0) {
      fetchUsersList();
    }
  }, [isModalOpen, userList.length]);

  const handleLoadMoreMobile = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      setLoadingMore(true);
      setPage(prev => prev + 1);
    }
  }, [hasMore, loadingMore, loading]);

  // ── CORE ACTIONS XỬ LÝ ĐƠN LẺ ─────────────────────────────────────────────
  const selectedNotifData = useMemo(() => {
    return notifications.find(n => n.id === selectedNotifId) || null;
  }, [notifications, selectedNotifId]);

  const handleTapItem = useCallback(async (id) => {
    setSelectedNotifId(id);
    const target = notifications.find(n => n.id === id);
    if (target && !target.is_read) {
      try {
        await adminService.markNotificationRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        setStats(prev => ({ ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }));
      } catch (err) { console.error(err); }
    }
  }, [notifications]);

  const handleTapItemMobile = useCallback(async (item) => {
    setMobileDetailItem(item);
    if (!item.is_read) {
      try {
        await adminService.markNotificationRead(item.id);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: 1 } : n));
        setStats(prev => ({ ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }));
      } catch (err) { console.error(err); }
    }
  }, []);

  const handleSingleArchive = useCallback(async (id) => {
    try {
      await adminService.archiveNotificationApi(id);
      fetchNotifications(true);
    } catch (err) { console.error(err); }
  }, [fetchNotifications]);

  const handleSingleRestore = useCallback(async (id) => {
    try {
      await adminService.restoreNotificationApi(id);
      fetchNotifications(true);
    } catch (err) { console.error(err); }
  }, [fetchNotifications]);

  const handleSingleDelete = useCallback(async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn thông báo này?")) return;
    try {
      await adminService.deleteNotificationApi(id);
      fetchNotifications(true);
    } catch (err) { console.error(err); }
  }, [fetchNotifications]);

  // ── BULK ACTIONS XỬ LÝ HÀNG LOẠT (Tích hợp Select All DB) ────────────────
  const handleToggleSelectPage = useCallback(() => {
    if (isAllPageSelected) {
      setSelectedIds([]);
      setIsSelectAllDatabase(false);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  }, [isAllPageSelected, notifications]);

  const handleToggleCheckSingle = useCallback((id) => {
    if (isSelectAllDatabase) {
      const currentPageIds = notifications.map(n => n.id);
      setSelectedIds(currentPageIds.filter(i => i !== id));
      setIsSelectAllDatabase(false);
    } else {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  }, [isSelectAllDatabase, notifications]);

  const handleToggleSelectAllMobile = useCallback(() => {
    if (isSelectAllDatabase || selectedIds.length === notifications.length) {
      setSelectedIds([]);
      setIsSelectAllDatabase(false);
    } else {
      setIsSelectAllDatabase(true);
      setSelectedIds(notifications.map(n => n.id));
    }
  }, [isSelectAllDatabase, selectedIds, notifications]);

  const handleBulkAction = useCallback(async (action) => {
    if (selectedIds.length === 0 && !isSelectAllDatabase) return;

    let confirmMsg = `Bạn có muốn thực hiện hành động này không?`;
    if (action === "delete") {
      confirmMsg = isSelectAllDatabase
        ? `🚨 CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN TẤT CẢ ${totalRecordsCount} thông báo trong hệ thống thỏa mãn bộ lọc hiện tại?`
        : `Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} mục đã chọn?`;
    } else if (action === "archive" && isSelectAllDatabase) {
      confirmMsg = `Bạn muốn lưu trữ toàn bộ ${totalRecordsCount} mục trong database chứ?`;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      // Đóng gói Payload cao cấp gửi lên Backend
      const payload = {
        action,
        isSelectAllDatabase: isSelectAllDatabase,
        filter: filter === "all" ? "" : filter,
        is_archived: viewMode === "archived" ? 1 : 0,
        search: searchQuery
      };

      // Nếu không kích hoạt chọn toàn bộ DB, gửi danh sách IDs trang hiện tại
      if (!isSelectAllDatabase) {
        payload.ids = selectedIds;
      }

      await adminService.bulkActionNotificationsApi(payload);

      // Giải phóng toàn bộ State chọn hàng loạt
      setSelectedIds([]);
      setIsSelectAllDatabase(false);
      setIsSelectionModeMobile(false);
      fetchNotifications(true);
    } catch (err) {
      console.error("Lỗi xử lý hàng loạt:", err);
    }
  }, [selectedIds, isSelectAllDatabase, filter, viewMode, searchQuery, totalRecordsCount, fetchNotifications]);

  const handleCreateNotification = useCallback(async (formData, callback) => {
    try {
      setIsSubmittingForm(true);
      const res = await adminService.createNotificationApi(formData);
      if (res.data?.success) {
        if (callback) callback();
        setIsModalOpen(false);
        fetchNotifications(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingForm(false);
    }
  }, [fetchNotifications]);

  return (
    <div className="h-full w-full flex flex-col md:bg-[#fafbfe] dark:md:bg-[#060a13] md:p-4 overflow-hidden">
      
      {/* VIEW LAYOUT CHO THIẾT BỊ DI ĐỘNG (< 768px) */}
      <MobileNotificationHeader
        viewMode={viewMode} unreadCount={stats.unreadCount} 
        isSelectionMode={isSelectionModeMobile} 
        selectedCount={isSelectAllDatabase ? totalRecordsCount : selectedIds.length}
        isAllDatabaseSelected={isSelectAllDatabase}
        onOpenCompose={() => setIsModalOpen(true)}
        onEnterSelect={() => { setIsSelectionModeMobile(true); setSelectedIds([]); }}
        onCancelSelect={() => { setIsSelectionModeMobile(false); setSelectedIds([]); setIsSelectAllDatabase(false); }}
        onSelectAll={handleToggleSelectAllMobile}
      />
      <MobileNotificationFilters searchQuery={searchQuery} filter={filter} onSearch={setSearchQuery} onFilter={setFilter} visible={!isSelectionModeMobile} />
      <MobileTabBar viewMode={viewMode} activeCount={stats.activeCount} archivedCount={stats.archivedCount} onChange={setViewMode} visible={!isSelectionModeMobile} />
      
      <div className="md:hidden flex-1 overflow-y-auto bg-[#060a13]">
        <MobileNotificationList
          notifications={notifications} loading={loading} loadingMore={loadingMore} hasMore={hasMore}
          searchQuery={searchQuery} isSelectionMode={isSelectionModeMobile} selectedIds={selectedIds}
          isAllDatabaseSelected={isSelectAllDatabase} // Ép Tick mọi Checkbox
          onTap={handleTapItemMobile} onToggleCheck={handleToggleCheckSingle} onLoadMore={handleLoadMoreMobile}
        />
      </div>
      <BulkActionBarMobile
        selectedCount={isSelectAllDatabase ? totalRecordsCount : selectedIds.length} viewMode={viewMode}
        visible={isSelectionModeMobile && selectedIds.length > 0}
        onMarkRead={() => handleBulkAction("read")} onArchive={() => handleBulkAction("archive")}
        onRestore={() => handleBulkAction("restore")} onDelete={() => handleBulkAction("delete")}
      />

      {/* VIEW LAYOUT CHO THIẾT BỊ DESKTOP (>= 768px) */}
      <div className="hidden md:flex flex-col flex-1 bg-white dark:bg-[#070c16] rounded-2xl border border-slate-100 dark:border-slate-800/60 overflow-hidden shadow-sm">
        
        {/* Top Desktop Filter Panel */}
        <div className="p-4 border-b border-slate-50 dark:border-slate-900/60 flex items-center justify-between gap-4 flex-shrink-0 bg-slate-50/50 dark:bg-[#090f1d]/40">
          <div className="flex items-center gap-2">
            {[{ key: "active", label: "Hộp thư đến", count: stats.activeCount, color: "bg-indigo-600" },
              { key: "archived", label: "Kho lưu trữ", count: stats.archivedCount, color: "bg-slate-500" }
            ].map(t => (
              <button key={t.key} onClick={() => setViewMode(t.key)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${viewMode === t.key ? "bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}>
                {t.label} <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.5 rounded-md font-black">{t.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Tìm kiếm nhanh tiêu đề..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all" />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/10 transition-all active:scale-95"><Plus size={14} /> Gửi thông báo</button>
          </div>
        </div>

        {/* Master Selection Controls (Gmail Bar) */}
        <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-900/60 flex items-center justify-between flex-shrink-0 bg-white dark:bg-[#070c16]">
          <div className="flex items-center gap-4">
            <button onClick={handleToggleSelectPage} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
              {isAllPageSelected ? <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" /> : <Square size={16} />}
            </button>
            
            {/* Filter chips horizontal */}
            <div className="flex items-center gap-1.5 border-l border-slate-100 dark:border-slate-800 pl-4">
              {[{ key: "all", label: "Tất cả" }, { key: "unread", label: "Chưa đọc" }, { key: "overdue", label: "Quá hạn" }, { key: "system", label: "Hệ thống" }].map(t => (
                <button key={t.key} onClick={() => setFilter(t.key)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${filter === t.key ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"}`}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Desktop Floating Actions Toolbar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-150 bg-indigo-500/5 dark:bg-indigo-400/5 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-950">
              <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">{isSelectAllDatabase ? totalRecordsCount : selectedIds.length} đã chọn</span>
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
              <button onClick={() => handleBulkAction("read")} className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-500"><Check size={13} /> Đánh dấu đọc</button>
              {viewMode === "active" ? (
                <button onClick={() => handleBulkAction("archive")} className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-amber-500"><Archive size={13} /> Lưu trữ</button>
              ) : (
                <button onClick={() => handleBulkAction("restore")} className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-500"><RotateCcw size={13} /> Khôi phục</button>
              )}
              <button onClick={() => handleBulkAction("delete")} className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-400"><Trash2 size={13} /> Xóa vĩnh viễn</button>
              <button onClick={() => { setSelectedIds([]); setIsSelectAllDatabase(false); }} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Trang {page} / {totalPages}</span>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1 rounded-lg border border-slate-100 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-900"><ChevronLeft size={14} /></button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1 rounded-lg border border-slate-100 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-900"><ChevronRight size={14} /></button>
          </div>
        </div>

        {/* GMAIL STYLE INTERACTIVE SELECT ALL DATABASE BANNER */}
        {isAllPageSelected && totalRecordsCount > notifications.length && (
          <div className="bg-indigo-50/80 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 px-4 py-2 text-center text-[11px] text-slate-700 dark:text-slate-300 transition-all duration-200">
            {!isSelectAllDatabase ? (
              <>
                Đang chọn <span className="font-black text-indigo-600 dark:text-indigo-400">{selectedIds.length}</span> mục trên trang này.{" "}
                <button onClick={() => setIsSelectAllDatabase(true)} className="text-indigo-600 dark:text-indigo-400 font-extrabold underline hover:text-indigo-500 ml-1">Chọn toàn bộ tất cả {totalRecordsCount} thông báo trong hệ thống</button>
              </>
            ) : (
              <>
                ✨ Tuyệt vời! Đã chọn <span className="font-black text-indigo-600 dark:text-indigo-400">tất cả {totalRecordsCount}</span> thông báo thỏa mãn bộ lọc hiện tại trong Database.{" "}
                <button onClick={() => { setSelectedIds([]); setIsSelectAllDatabase(false); }} className="text-red-500 font-black underline hover:text-red-400 ml-1">Hủy chọn</button>
              </>
            )}
          </div>
        )}

        {/* Workspace Dual-Split Panel */}
        <div className="flex-1 flex overflow-hidden bg-slate-50/40 dark:bg-[#060a13]/30">
          {/* Left Column — Notification List */}
          <div className="w-[420px] border-r border-slate-50 dark:border-slate-900/60 flex flex-col p-3 gap-2 overflow-y-auto bg-white dark:bg-[#070c16]">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-indigo-600" /></div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">Hộp thư trống không có dữ liệu thỏa mãn</div>
            ) : (
              notifications.map(item => (
                <NotiCard
                  key={item.id} item={item}
                  isChecked={isSelectAllDatabase || selectedIds.includes(item.id)}
                  isSelected={selectedNotifId === item.id} onTap={handleTapItem} onToggleCheck={handleToggleCheckSingle}
                />
              ))
            )}
          </div>
          {/* Right Column — Content Detail Panel */}
          <div className="flex-1 p-4 overflow-hidden">
            <NotificationDetail selectedNotif={selectedNotifData} viewMode={viewMode} onArchive={handleSingleArchive} onRestore={handleSingleRestore} onDelete={handleSingleDelete} />
          </div>
        </div>

      </div>

      {/* 🔮 MOBILE BOTTOM SHEET DETAIL PANEL MODAL */}
      {mobileDetailItem && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-[#090f1c] border-t border-white/[0.08] rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <span className="text-xs font-bold text-slate-400">Chi tiết thông báo</span>
              <button onClick={() => setMobileDetailItem(null)} className="p-1 rounded-full bg-white/[0.05] text-white"><X size={16} /></button>
            </div>
            <h2 className="text-base font-black text-white leading-tight">{mobileDetailItem.title}</h2>
            <p className="text-[11px] text-slate-500 font-medium">Gửi vào: {new Date(mobileDetailItem.created_at).toLocaleString("vi-VN")}</p>
            <div className="text-sm text-slate-300 leading-relaxed bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl whitespace-pre-wrap">{mobileDetailItem.message}</div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {viewMode === "active" ? (
                <button onClick={() => { handleSingleArchive(mobileDetailItem.id); setMobileDetailItem(null); }} className="py-2.5 rounded-xl border border-white/[0.06] text-xs font-bold text-slate-300 bg-white/[0.02]">Lưu trữ</button>
              ) : (
                <button onClick={() => { handleSingleRestore(mobileDetailItem.id); setMobileDetailItem(null); }} className="py-2.5 rounded-xl border border-white/[0.06] text-xs font-bold text-slate-300 bg-white/[0.02]">Khôi phục</button>
              )}
              <button onClick={() => { handleSingleDelete(mobileDetailItem.id); setMobileDetailItem(null); }} className="py-2.5 rounded-xl bg-red-600 text-xs font-black text-white">Xóa vĩnh viễn</button>
            </div>
          </div>
        </div>
      )}

      {/* ╔═══ COMPOSE MODAL DIALOG (Shared Layout) ══════════════════════════╗ */}
      <ComposeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userList={userList} onSubmit={handleCreateNotification} isSubmitting={isSubmittingForm} />
    </div>
  );
}