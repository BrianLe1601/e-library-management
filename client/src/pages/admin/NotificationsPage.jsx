import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useSWR from "swr";
import {
  Trash2, ChevronLeft, ChevronRight, X,
  Search, CheckSquare, Square, Plus, Check, Loader2
} from "lucide-react";
import {
  NotiCard, NotificationDetail, ComposeModal,
  MobileNotificationHeader, MobileNotificationFilters,
  MobileNotificationList, BulkActionBarMobile
} from "../../components/admin/NotificationComponents";
import adminService from "../../services/adminService";

// ─── SWR fetcher ─────────────────────────────────────────────
const fetcher = async ([, params]) => {
  const res = await adminService.getNotifications(params);
  return res.data;
};

const DESKTOP_LIMIT = 10;
const MOBILE_LIMIT  = 15; // load theo cụm 15 cho mobile infinite scroll

export default function NotificationsPage() {

  // ── Bộ lọc chung (Desktop + Mobile) ──────────────────────────────────────────
  const [filter,          setFilter]          = useState("all");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── Desktop pagination ────────────────────────────────────────────────────────
  const [desktopPage, setDesktopPage] = useState(1);

  // ── Desktop selection ─────────────────────────────────────────────────────────
  const [selectedIds,         setSelectedIds]         = useState([]);
  const [isSelectAllDatabase, setIsSelectAllDatabase] = useState(false);

  // ── Mobile state ──────────────────────────────────────────────────────────────
  const [isSelectionModeMobile, setIsSelectionModeMobile] = useState(false);
  const [mobileDetailItem,      setMobileDetailItem]      = useState(null);

  // Mobile infinite scroll: accumulate tất cả items đã tải qua các trang
  const [mobileItems,    setMobileItems]    = useState([]);
  const [mobilePage,     setMobilePage]     = useState(1);
  const [mobileHasMore,  setMobileHasMore]  = useState(true);
  const [mobileLoading,  setMobileLoading]  = useState(false);
  // Ref để tránh gọi trùng và tránh stale closure
  const mobileLoadingRef = useRef(false);
  const mobileHasMoreRef = useRef(true);   // mirror của mobileHasMore để dùng trong callback
  const mobilePageRef    = useRef(1);      // mirror của mobilePage để dùng trong callback

  // ── Detail & Modal ────────────────────────────────────────────────────────────
  const [selectedNotifId,  setSelectedNotifId]  = useState(null);
  const [isModalOpen,      setIsModalOpen]      = useState(false);
  const [userList,         setUserList]         = useState([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // ── Debounce search ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setDesktopPage(1);

      setSelectedIds([]);
      setIsSelectAllDatabase(false);
      
      resetMobile();
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset selection + page khi đổi filter
  useEffect(() => {
    setSelectedIds([]);
    setIsSelectAllDatabase(false);
    setDesktopPage(1);
    resetMobile();
  }, [filter]);

  // ── Helpers reset mobile ──────────────────────────────────────────────────────
  const resetMobile = () => {
    setMobileItems([]);
    setMobilePage(1);
    setMobileHasMore(true);
    mobileHasMoreRef.current  = true;
    mobilePageRef.current     = 1;
    mobileLoadingRef.current  = false;
  };

  // ── SWR (Desktop only) ────────────────────────────────────────────────────────
  const swrParams = useMemo(() => ({
    page:        desktopPage,
    limit:       DESKTOP_LIMIT,
    filter:      filter === "all" ? "" : filter,
    is_archived: 0,
    search:      debouncedSearch,
  }), [desktopPage, filter, debouncedSearch]);

  const { data: swrData, mutate, isLoading: swrLoading } = useSWR(
    ["/admin/notifications", swrParams],
    fetcher,
    { keepPreviousData: true }
  );

  const desktopNotifications = useMemo(() => swrData?.data?.data || [], [swrData]);
  const stats       = useMemo(() => swrData?.data?.stats || { unreadCount: 0, activeCount: 0 }, [swrData]);
  const totalPages  = swrData?.data?.totalPages || 1;
  const totalCount  = stats.activeCount || 0;

  // Auto-select đầu tiên trên desktop
  useEffect(() => {
    if (desktopNotifications.length > 0 && !selectedNotifId && window.innerWidth >= 768) {
      setSelectedNotifId(desktopNotifications[0].id);
    }
  }, [desktopNotifications, selectedNotifId]);

  // ── Mobile: load thêm (infinite scroll) ──────────────────────────────────────
  const loadMobilePage = useCallback(async (pageToLoad) => {
    // Dùng ref thay vì state để tránh stale closure
    if (mobileLoadingRef.current) return;
    if (pageToLoad > 1 && !mobileHasMoreRef.current) return;

    mobileLoadingRef.current = true;
    setMobileLoading(true);

    // Snapshot filter/search tại thời điểm gọi để tránh race condition
    const currentFilter = filter;
    const currentSearch = debouncedSearch;

    try {
      const res = await adminService.getNotifications({
        page:        pageToLoad,
        limit:       MOBILE_LIMIT,
        filter:      currentFilter === "all" ? "" : currentFilter,
        is_archived: 0,
        search:      currentSearch,
      });
      const arr   = res.data?.data?.data   || [];
      const pages = res.data?.data?.totalPages || 1;
      const hasMore = pageToLoad < pages;

      setMobileItems(prev => pageToLoad === 1 ? arr : [...prev, ...arr]);
      setMobileHasMore(hasMore);
      setMobilePage(pageToLoad);
      mobileHasMoreRef.current = hasMore;
      mobilePageRef.current    = pageToLoad;
    } catch (err) {
      console.error("[Mobile load]", err);
    } finally {
      setMobileLoading(false);
      mobileLoadingRef.current = false;
    }
  }, [filter, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load lần đầu mobile
  useEffect(() => {
    loadMobilePage(1);
  }, [filter, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Callback khi sentinel vào viewport
  const handleMobileLoadMore = useCallback(() => {
    if (!mobileLoadingRef.current && mobileHasMoreRef.current) {
      loadMobilePage(mobilePageRef.current + 1);
    }
  }, [loadMobilePage]);
  // ── User list cho modal ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUsersForModal = async () => {
      try {
        const res = await adminService.getUsers({ page: 1, limit: 500 });
        if (res.data?.success) {
          setUserList(res.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching users for modal", error);
      }
    };

    if (isModalOpen && userList.length === 0) {
      fetchUsersForModal();
    }
  }, [isModalOpen, userList.length]);

  // ── Computed ──────────────────────────────────────────────────────────────────
  const selectedNotifData  = useMemo(() =>
    desktopNotifications.find(n => n.id === selectedNotifId) || null,
    [desktopNotifications, selectedNotifId]
  );
  const isAllPageSelected  = useMemo(() =>
    desktopNotifications.length > 0 && selectedIds.length === desktopNotifications.length,
    [desktopNotifications, selectedIds]
  );

  // ── Mutate helper (refresh cả desktop SWR + reset mobile) ────────────────────
  const refreshAll = () => {
    mutate(); // SWR desktop
    // Reset trước, sau đó load page 1 (setTimeout đảm bảo state flush xong mới gọi)
    resetMobile();
    setTimeout(() => loadMobilePage(1), 0);
  };

  // ── HANDLERS ─────────────────────────────────────────────────────────────────

  // Đánh dấu đọc 1 (optimistic update cho desktop; mobile chỉ update local)
  const handleMarkRead = async (id) => {
    try {
      await adminService.markNotificationRead(id);
      // Desktop: optimistic
      mutate(cur => {
        const next = structuredClone(cur);
        const list = next?.data?.data || [];
        const idx  = list.findIndex(n => n.id === id);
        if (idx !== -1) list[idx].is_read = 1;
        if (next?.data?.stats) next.data.stats.unreadCount = Math.max(0, next.data.stats.unreadCount - 1);
        return next;
      }, false);
      // Mobile: update local array
      setMobileItems(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) { console.error(err); }
  };

  const handleTapItem = (id) => {
    setSelectedNotifId(id);
    const t = desktopNotifications.find(n => n.id === id);
    if (t && !t.is_read) handleMarkRead(id);
  };

  const handleTapItemMobile = (item) => {
    setMobileDetailItem(item);
    if (!item.is_read) handleMarkRead(item.id);
  };

  // ── [FIX] XÓA MỀM ĐƠN LẺ — gọi archive (is_archived=1), KHÔNG phải delete ──
  const handleSingleSoftDelete = async (id) => {
    if (!window.confirm("Xóa thông báo này? (Có thể khôi phục sau)")) return;
    try {
      // Gọi API archive thay vì delete — đây là xóa mềm
      await adminService.archiveNotificatiApi(id);
      setSelectedNotifId(null);
      setMobileDetailItem(null);
      refreshAll();
    } catch (err) { console.error(err); }
  };

  // ── Desktop selection ─────────────────────────────────────────────────────────
  const handleToggleSelectPage = () => {
    if (isAllPageSelected) { setSelectedIds([]); setIsSelectAllDatabase(false); }
    else setSelectedIds(desktopNotifications.map(n => n.id));
  };

  const handleToggleCheckSingle = (id) => {
    if (isSelectAllDatabase) {
      setSelectedIds(desktopNotifications.map(n => n.id).filter(i => i !== id));
      setIsSelectAllDatabase(false);
    } else {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  // ── [FIX] BULK ACTION — desktop ───────────────────────────────────────────────
  // action: "archive" (xóa mềm) | "delete" (xóa thật) | "mark_read"
  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0 && !isSelectAllDatabase) return;
    const label = action === "archive" ? "xóa mềm" : action === "delete" ? "xóa vĩnh viễn" : "đánh dấu đọc";
    if (action === "delete" && !window.confirm(`Bạn chắc chắn muốn ${label} ${isSelectAllDatabase ? "tất cả" : selectedIds.length} thông báo?`)) return;

    try {
      await adminService.bulkActionNotificatioApi(
        action,
        isSelectAllDatabase ? [] : selectedIds,
        isSelectAllDatabase
          ? {
              selectAll:   true,
              filter:      filter === "all" ? "" : filter,
              is_archived: 0,
              search:      debouncedSearch,
            }
          : {}
      );
      setSelectedIds([]);
      setIsSelectAllDatabase(false);
      refreshAll();
    } catch (err) { console.error(err); }
  };

  // ── [FIX] BULK ACTION — mobile ────────────────────────────────────────────────
  // Trên mobile, selectedIds chứa IDs từ mobileItems (tích lũy)
  const handleBulkActionMobile = async (action) => {
    if (selectedIds.length === 0) return;
    try {
      await adminService.bulkActionNotificatioApi(action, selectedIds);
      setSelectedIds([]);
      setIsSelectionModeMobile(false);
      refreshAll();
    } catch (err) { console.error(err); }
  };

  // Toggle select all (mobile — chọn tất cả items đã tải)
  const handleToggleSelectAllMobile = () => {
    if (selectedIds.length === mobileItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mobileItems.map(n => n.id));
    }
  };

  // ── [FIX] COMPOSE MODAL SUBMIT ────────────────────────────────────────────────
  const handleCreateNotification = async (formData, resetForm) => {
    if (!formData.title?.trim() || !formData.message?.trim()) return;
    try {
      setIsSubmittingForm(true);

      // Chuẩn hóa payload trước khi gửi
      const payload = {
        scope:     formData.scope,
        type:      formData.type || "system",
        title:     formData.title.trim(),
        message:   formData.message.trim(),
        // user_id chỉ gửi khi scope = "user"
        user_id:   formData.scope === "user" ? formData.user_id : null,
        // borrow_id / book_id: parse int hoặc null để tránh lỗi FK
        borrow_id: formData.borrow_id ? parseInt(formData.borrow_id) : null,
        book_id:   formData.book_id   ? parseInt(formData.book_id)   : null,
      };

      await adminService.createNotificatiApi(payload);

      // Reset form và đóng modal
      resetForm();
      setIsModalOpen(false);

      // Refresh data
      refreshAll();
    } catch (err) {
      console.error("[createNotification]", err);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full w-full flex flex-col md:bg-[#fafbfe] dark:md:bg-[#060a13] md:p-4 overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════
          📱 MOBILE VIEW (< 768px)
      ══════════════════════════════════════════════════════════════ */}
      <MobileNotificationHeader
        totalCount={totalCount}
        unreadCount={stats.unreadCount}
        isSelectionMode={isSelectionModeMobile}
        selectedCount={selectedIds.length}
        isAllDatabaseSelected={selectedIds.length === mobileItems.length && mobileItems.length > 0}
        onOpenCompose={() => setIsModalOpen(true)}
        onEnterSelect={() => { setIsSelectionModeMobile(true); setSelectedIds([]); }}
        onCancelSelect={() => { setIsSelectionModeMobile(false); setSelectedIds([]); }}
        onSelectAll={handleToggleSelectAllMobile}
      />

      <MobileNotificationFilters
        searchQuery={searchQuery}
        filter={filter}
        onSearch={setSearchQuery}
        onFilter={setFilter}
        visible={!isSelectionModeMobile}
      />

      {/* Mobile list — infinite scroll */}
      <div id="mobile-scroll-container" className="md:hidden flex-1 overflow-y-auto bg-white dark:bg-[#060a13]">
        <MobileNotificationList
          notifications={mobileItems}
          loading={mobileLoading && mobilePage === 1}
          loadingMore={mobileLoading && mobilePage > 1}
          hasMore={mobileHasMore}
          searchQuery={debouncedSearch}
          isSelectionMode={isSelectionModeMobile}
          selectedIds={selectedIds}
          isAllDatabaseSelected={false}
          onTap={handleTapItemMobile}
          onToggleCheck={(id) =>
            setSelectedIds(prev =>
              prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            )
          }
          onLoadMore={handleMobileLoadMore}
        />
      </div>

      {/* Mobile bulk action bar */}
      <BulkActionBarMobile
        selectedCount={selectedIds.length}
        visible={isSelectionModeMobile && selectedIds.length > 0}
        onMarkRead={() => handleBulkActionMobile("mark_read")}
        onDelete={() => handleBulkActionMobile("archive")}
      />

      {/* ══════════════════════════════════════════════════════════════
          💻 DESKTOP VIEW (>= 768px)
          - SWR pagination (10 mục/trang)
          - Gmail-style select: chọn trang → banner chọn toàn DB
          - Bulk: mark_read | archive (xóa mềm) | delete (xóa thật)
      ══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-col flex-1 bg-white dark:bg-[#070c16] rounded-2xl border border-slate-100 dark:border-slate-800/60 overflow-hidden shadow-sm">

        {/* Top bar */}
        <div className="p-4 border-b border-slate-50 dark:border-slate-900/60 flex items-center justify-between gap-4 flex-shrink-0 bg-slate-50/50 dark:bg-[#090f1d]/40">
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-xl text-xs font-black bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs flex items-center gap-2">
              Thông báo
              <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-1.5 py-0.5 rounded-md font-black">
                {stats.activeCount}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhanh..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/10 transition-all active:scale-95"
            >
              <Plus size={14} /> Phát hành
            </button>
          </div>
        </div>

        {/* Selection controls + filters + pagination */}
        <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-900/60 flex items-center justify-between flex-shrink-0 bg-white dark:bg-[#070c16]">
          <div className="flex items-center gap-4">
            <button onClick={handleToggleSelectPage} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
              {isAllPageSelected
                ? <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
                : <Square size={16} />}
            </button>
            <div className="flex items-center gap-1.5 border-l border-slate-100 dark:border-slate-800 pl-4">
              {[
                { key: "all",    label: "Tất cả" },
                { key: "unread", label: "Chưa đọc" },
                { key: "overdue",label: "Quá hạn" },
                { key: "system", label: "Hệ thống" },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    filter === t.key
                      ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk toolbar (desktop) */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-150 bg-indigo-500/5 dark:bg-indigo-400/5 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-950">
              <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">
                {isSelectAllDatabase ? totalCount : selectedIds.length} đã chọn
              </span>
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
              <button
                onClick={() => handleBulkAction("mark_read")}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-500"
              >
                <Check size={13} /> Đánh dấu đọc
              </button>
              {/* [FIX] Đổi từ "delete" thành "archive" — xóa mềm */}
              <button
                onClick={() => handleBulkAction("archive")}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <Trash2 size={13} /> Xóa mềm
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-400"
              >
                <Trash2 size={13} /> Xóa thật
              </button>
              <button
                onClick={() => { setSelectedIds([]); setIsSelectAllDatabase(false); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Trang {desktopPage} / {totalPages}</span>
            <button
              disabled={desktopPage === 1}
              onClick={() => setDesktopPage(p => p - 1)}
              className="p-1 rounded-lg border border-slate-100 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={desktopPage === totalPages || totalPages === 0}
              onClick={() => setDesktopPage(p => p + 1)}
              className="p-1 rounded-lg border border-slate-100 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Gmail-style "chọn toàn bộ DB" banner */}
        {isAllPageSelected && totalCount > desktopNotifications.length && (
          <div className="bg-indigo-50/80 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 px-4 py-2 text-center text-[11px] text-slate-700 dark:text-slate-300">
            {!isSelectAllDatabase ? (
              <>
                Đang chọn <span className="font-black text-indigo-600 dark:text-indigo-400">{selectedIds.length}</span> mục trên trang này.{" "}
                <button
                  onClick={() => setIsSelectAllDatabase(true)}
                  className="text-indigo-600 dark:text-indigo-400 font-extrabold underline"
                >
                  Chọn toàn bộ tất cả {totalCount} thông báo
                </button>
              </>
            ) : (
              <>
                ✨ Đã chọn <span className="font-black text-indigo-600 dark:text-indigo-400">tất cả {totalCount}</span> thông báo.{" "}
                <button
                  onClick={() => { setSelectedIds([]); setIsSelectAllDatabase(false); }}
                  className="text-red-500 font-black underline"
                >
                  Hủy chọn
                </button>
              </>
            )}
          </div>
        )}

        {/* Dual-split panel */}
        <div className="flex-1 flex overflow-hidden bg-slate-50/40 dark:bg-[#060a13]/30">
          {/* Left: list */}
          <div className="w-[420px] border-r border-slate-50 dark:border-slate-900/60 flex flex-col p-3 gap-2 overflow-y-auto bg-white dark:bg-[#070c16]">
            {swrLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
              </div>
            ) : desktopNotifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">Hộp thư rỗng</div>
            ) : (
              desktopNotifications.map(item => (
                <NotiCard
                  key={item.id}
                  item={item}
                  isChecked={isSelectAllDatabase || selectedIds.includes(item.id)}
                  isSelected={selectedNotifId === item.id}
                  onTap={handleTapItem}
                  onToggleCheck={handleToggleCheckSingle}
                />
              ))
            )}
          </div>

          {/* Right: detail */}
          <div className="flex-1 p-4 overflow-hidden">
            <NotificationDetail
              selectedNotif={selectedNotifData}
              onDelete={handleSingleSoftDelete}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile bottom sheet detail ──────────────────────────────────────────── */}
      {mobileDetailItem && (
        <div className="md:hidden fixed inset-0 z-[60] bg-white dark:bg-[#060a13] flex flex-col animate-in slide-in-from-right-2 duration-200">
          <div className="flex items-center gap-3 h-14 px-4 bg-white/95 dark:bg-[#060a13]/95 backdrop-blur-xl border-b border-slate-100 dark:border-white/[0.06] sticky top-0 z-10 safe-top">
            <button 
              onClick={() => setMobileDetailItem(null)} 
              className="p-1 -ml-1 text-slate-500 dark:text-slate-400 active:text-indigo-600 dark:active:text-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-[15px] font-black text-slate-800 dark:text-white">Chi tiết</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Truyền item vào NotificationDetail để tái sử dụng component hiện có của bạn */}
            <NotificationDetail 
              item={mobileDetailItem} 
              onClose={() => setMobileDetailItem(null)} 
              isMobile={true} 
            />
          </div>
        </div>
      )}

      {/* ── ComposeModal ────────────────────────────────────────────────────────── */}
      <ComposeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userList={userList}
        onSubmit={handleCreateNotification}
        isSubmitting={isSubmittingForm}
      />
    </div>
  );
}