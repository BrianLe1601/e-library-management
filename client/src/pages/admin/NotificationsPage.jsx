import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useSWR, { mutate } from "swr";
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

// ─── SWR fetcher (Desktop only) ──────────────────────────────
const fetcher = async ([, params]) => {
  const res = await adminService.getNotifications(params);
  return res.data;
};

const PAGE_LIMIT = 10;

export default function NotificationsPage() {

  // ── Bộ lọc chung ─────────────────────────────────────────────────────────────
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

  // Mobile infinite scroll: items tích lũy + trạng thái
  const [mobileItems,     setMobileItems]     = useState([]);
  const [mobilePage,      setMobilePage]      = useState(1);
  const [mobileTotalPages,setMobileTotalPages]= useState(1);
  const [mobileLoading,   setMobileLoading]   = useState(false);   // loading trang đầu
  const [mobileLoadingMore,setMobileLoadingMore]=useState(false);  // loading trang tiếp

  // Ref giữ AbortController để cancel request khi cần
  const abortRef = useRef(null);
  // Ref ngăn trigger load more trùng
  const loadingRef = useRef(false);

  // ── Detail & Modal ────────────────────────────────────────────────────────────
  const [selectedNotifId,  setSelectedNotifId]  = useState(null);
  const [isModalOpen,      setIsModalOpen]      = useState(false);
  const [userList,         setUserList]         = useState([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // ── Debounce search ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);
  
  // ─── Listen filter from Header ──────────────────────────────
  useEffect(() => {
    const handleSyncFromHeader = () => {
      mutate();
    };
    window.addEventListener("sync_notifications", handleSyncFromHeader);
    return () => window.removeEventListener("sync_notifications", handleSyncFromHeader);
  }, [mutate]);

  // ── Reset desktop + mobile khi filter / search thay đổi ──────────────────────
  useEffect(() => {
    setSelectedIds([]);
    setIsSelectAllDatabase(false);
    setDesktopPage(1);
  }, [filter, debouncedSearch]);

  // ── SWR Desktop ───────────────────────────────────────────────────────────────
  const swrParams = useMemo(() => ({
    page:        desktopPage,
    limit:       PAGE_LIMIT,
    filter:      filter === "all" ? "" : filter,
    is_archived: 0,
    search:      debouncedSearch,
  }), [desktopPage, filter, debouncedSearch]);

  const { data: desktopData, mutate: desktopMutate, isLoading: desktopLoading } = useSWR(
    ["/admin/notifications", swrParams],
    fetcher,
    { keepPreviousData: true }
  );

  const desktopNotifications = useMemo(() => desktopData?.data?.data || [], [desktopData]);
  const stats      = useMemo(() => desktopData?.data?.stats || { unreadCount: 0, activeCount: 0 }, [desktopData]);
  const totalPages = desktopData?.data?.totalPages || 1;
  const totalCount = stats.activeCount || 0;

  // Auto-select đầu tiên trên desktop
  useEffect(() => {
    if (desktopNotifications.length > 0 && !selectedNotifId && window.innerWidth >= 768) {
      setSelectedNotifId(desktopNotifications[0].id);
    }
  }, [desktopNotifications, selectedNotifId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ── Mobile: fetch trực tiếp (không qua SWR để tránh cache stale) ─────────────
  // ─────────────────────────────────────────────────────────────────────────────
  const fetchMobilePage = useCallback(async (pageToLoad, currentFilter, currentSearch, isReset) => {
    // Nếu đang loading thì bỏ qua (trừ khi là reset)
    if (loadingRef.current && !isReset) return;

    // Cancel request cũ nếu có (chỉ khi reset)
    if (isReset && abortRef.current) {
      abortRef.current.abort();
    }

    loadingRef.current = true;

    if (pageToLoad === 1) {
      setMobileLoading(true);
      setMobileLoadingMore(false);
    } else {
      setMobileLoadingMore(true);
    }

    try {
      const res = await adminService.getNotifications({
        page:        pageToLoad,
        limit:       PAGE_LIMIT,
        filter:      currentFilter === "all" ? "" : currentFilter,
        is_archived: 0,
        search:      currentSearch,
      });

      const payload    = res.data?.data;
      const newItems   = payload?.data        || [];
      const totalPgs   = payload?.totalPages  || 1;

      setMobileTotalPages(totalPgs);
      setMobilePage(pageToLoad);

      if (pageToLoad === 1) {
        // Reset hoàn toàn
        setMobileItems(newItems);
      } else {
        // Append + dedup theo id
        setMobileItems(prev => {
          const seen = new Set(prev.map(n => n.id));
          return [...prev, ...newItems.filter(n => !seen.has(n.id))];
        });
      }
    } catch (err) {
      // Ignore AbortError
      if (err.name !== "AbortError") {
        console.error("[Mobile fetch]", err);
      }
    } finally {
      setMobileLoading(false);
      setMobileLoadingMore(false);
      loadingRef.current = false;
    }
  }, []); // không deps vì nhận filter/search qua tham số

  // Reset và load trang 1 khi filter/search thay đổi
  useEffect(() => {
    setMobileItems([]);
    setMobilePage(1);
    setMobileTotalPages(1);
    loadingRef.current = false;
    fetchMobilePage(1, filter, debouncedSearch, true);
  }, [filter, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Callback từ IntersectionObserver
  const handleMobileLoadMore = useCallback(() => {
    const hasMore = mobilePage < mobileTotalPages;
    if (!loadingRef.current && hasMore) {
      fetchMobilePage(mobilePage + 1, filter, debouncedSearch, false);
    }
  }, [mobilePage, mobileTotalPages, filter, debouncedSearch, fetchMobilePage]);

  // ── User list cho modal ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isModalOpen || userList.length > 0) return;
    adminService.getUsers({ page: 1, limit: 500 })
      .then(res => { if (res.data?.success) { const raw = res.data.data; setUserList(Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])); } })
      .catch(err => console.error("Error fetching users", err));
  }, [isModalOpen, userList.length]);

  // ── Computed ──────────────────────────────────────────────────────────────────
  const selectedNotifData = useMemo(() =>
    desktopNotifications.find(n => n.id === selectedNotifId) || null,
    [desktopNotifications, selectedNotifId]
  );
  const isAllPageSelected = useMemo(() =>
    desktopNotifications.length > 0 && selectedIds.length === desktopNotifications.length,
    [desktopNotifications, selectedIds]
  );
  const mobileHasMore = mobilePage < mobileTotalPages;

  // ── Refresh all ───────────────────────────────────────────────────────────────
  const refreshAll = useCallback(() => {
    desktopMutate();
    // Reset mobile về trang 1 với filter/search hiện tại
    setMobileItems([]);
    setMobilePage(1);
    setMobileTotalPages(1);
    loadingRef.current = false;
    fetchMobilePage(1, filter, debouncedSearch, true);
  }, [desktopMutate, filter, debouncedSearch, fetchMobilePage]);

  // ── HANDLERS ─────────────────────────────────────────────────────────────────

  const handleMarkRead = async (id) => {
    try {
      await adminService.markNotificationRead(id);
      // Desktop optimistic
      desktopMutate(cur => {
        const next = structuredClone(cur);
        const list = next?.data?.data || [];
        const idx  = list.findIndex(n => n.id === id);
        if (idx !== -1) list[idx].is_read = 1;
        if (next?.data?.stats) next.data.stats.unreadCount = Math.max(0, next.data.stats.unreadCount - 1);
        return next;
      }, false);
      // Mobile optimistic — update local array + detail item
      setMobileItems(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setMobileDetailItem(prev => prev?.id === id ? { ...prev, is_read: 1 } : prev);
      window.dispatchEvent(new Event("sync_notifications"));
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

  const handleSingleSoftDelete = async (id) => {
    if (!window.confirm("Delete this notification? (Can be restored later)")) return;
    try {
      await adminService.archiveNotificatiApi(id);
      setSelectedNotifId(null);
      setMobileDetailItem(null);
      refreshAll();
      window.dispatchEvent(new Event("sync_notifications"));
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

  // ── Bulk action ───────────────────────────────────────────────────────────────
  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0 && !isSelectAllDatabase) return;
    const label = action === "archive" ? "soft delete" : action === "delete" ? "permanently delete" : "mark as read";
    if (action === "delete" && !window.confirm(`Are you sure you want to ${label} ${isSelectAllDatabase ? "all" : selectedIds.length} notifications?`)) return;
    try {
      await adminService.bulkActionNotificatioApi(
        action,
        isSelectAllDatabase ? [] : selectedIds,
        isSelectAllDatabase ? { selectAll: true, filter: filter === "all" ? "" : filter, is_archived: 0, search: debouncedSearch } : {}
      );
      setSelectedIds([]);
      setIsSelectAllDatabase(false);
      refreshAll();
      window.dispatchEvent(new Event("sync_notifications"));
    } catch (err) { console.error(err); }
  };

  const handleBulkActionMobile = async (action) => {
    if (selectedIds.length === 0) return;
    try {
      await adminService.bulkActionNotificatioApi(action, selectedIds);
      setSelectedIds([]);
      setIsSelectionModeMobile(false);
      refreshAll();
      window.dispatchEvent(new Event("sync_notifications"));
    } catch (err) { console.error(err); }
  };

  const handleToggleSelectAllMobile = () => {
    if (selectedIds.length === mobileItems.length) setSelectedIds([]);
    else setSelectedIds(mobileItems.map(n => n.id));
  };

  // ── Compose submit ────────────────────────────────────────────────────────────
  const handleCreateNotification = async (formData, resetForm) => {
    if (!formData.title?.trim() || !formData.message?.trim()) return;
    try {
      setIsSubmittingForm(true);
      const payload = {
        scope:     formData.scope,
        type:      formData.type || "system",
        title:     formData.title.trim(),
        message:   formData.message.trim(),
        user_id:   formData.scope === "user" ? formData.user_id : null,
        borrow_id: formData.borrow_id ? parseInt(formData.borrow_id) : null,
        book_id:   formData.book_id   ? parseInt(formData.book_id)   : null,
      };
      await adminService.createNotificatiApi(payload);
      resetForm();
      setIsModalOpen(false);
      refreshAll();
      window.dispatchEvent(new Event("sync_notifications"));
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
      <div className="md:hidden flex-1 overflow-y-auto bg-white dark:bg-[#060a13]">
        <MobileNotificationList
          notifications={mobileItems}
          loading={mobileLoading}
          loadingMore={mobileLoadingMore}
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
      ══════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-col flex-1 bg-white dark:bg-[#070c16] rounded-2xl border border-slate-100 dark:border-slate-800/60 overflow-hidden shadow-sm">

        {/* Top bar */}
        <div className="p-4 border-b border-slate-50 dark:border-slate-900/60 flex items-center justify-between gap-4 flex-shrink-0 bg-slate-50/50 dark:bg-[#090f1d]/40">
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-xl text-xs font-black bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs flex items-center gap-2">
              Notifications
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
                placeholder="Quick search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/10 transition-all active:scale-95"
            >
              <Plus size={14} /> Publish
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
                { key: "all",    label: "All" },
                { key: "unread", label: "Unread" },
                { key: "overdue",label: "Alerts" },
                { key: "system", label: "Activity" },
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
                {isSelectAllDatabase ? totalCount : selectedIds.length} selected
              </span>
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
              <button
                onClick={() => handleBulkAction("mark_read")}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-500"
              >
                <Check size={13} /> Mark read
              </button>
              <button
                onClick={() => handleBulkAction("archive")}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <Trash2 size={13} /> Soft delete
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-400"
              >
                <Trash2 size={13} /> Delete forever
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
            <span>Page {desktopPage} of {totalPages}</span>
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
                Selecting <span className="font-black text-indigo-600 dark:text-indigo-400">{selectedIds.length}</span> items on this page.{" "}
                <button
                  onClick={() => setIsSelectAllDatabase(true)}
                  className="text-indigo-600 dark:text-indigo-400 font-extrabold underline"
                >
                  Select all {totalCount} notifications
                </button>
              </>
            ) : (
              <>
                ✨ Selected <span className="font-black text-indigo-600 dark:text-indigo-400">all {totalCount}</span> notifications.{" "}
                <button
                  onClick={() => { setSelectedIds([]); setIsSelectAllDatabase(false); }}
                  className="text-red-500 font-black underline"
                >
                  Clear selection
                </button>
              </>
            )}
          </div>
        )}

        {/* Dual-split panel */}
        <div className="flex-1 flex overflow-hidden bg-slate-50/40 dark:bg-[#060a13]/30">
          {/* Left: list */}
          <div className="w-[420px] border-r border-slate-50 dark:border-slate-900/60 flex flex-col p-3 gap-2 overflow-y-auto bg-white dark:bg-[#070c16]">
            {desktopLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
              </div>
            ) : desktopNotifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">Empty inbox</div>
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
            <h2 className="text-[15px] font-black text-slate-800 dark:text-white">Details</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NotificationDetail
              selectedNotif={mobileDetailItem}
              onDelete={handleSingleSoftDelete}
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