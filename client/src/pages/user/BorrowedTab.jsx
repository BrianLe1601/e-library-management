import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, BookOpen, Calendar, RefreshCw, Clock,
  AlertTriangle, CheckCircle, Filter, Star,
  ChevronLeft, ChevronRight, History, Layers, Loader2,
  RotateCcw, Package,
} from "lucide-react";
import borrowService from "../../services/borrowService";
import reviewService from "../../services/reviewService";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_RENEWALS = 2;
const PAGE_SIZE    = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDateLocal(str) {
  if (!str) return new Date();
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function diffDays(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
function fmtDate(str) {
  if (!str) return "—";
  return parseDateLocal(str).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
function fmtMoney(amount) {
  if (!amount || amount === 0) return null;
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

// Map API → UI shape cho Active Loans
function mapActiveBorrow(b) {
  return {
    id:           b.id,
    book_id:      b.book_id,
    title:        b.title || b.book_title,
    author:       b.author,
    category:     b.category || "Uncategorized",
    coverUrl:     b.cover_url || "https://via.placeholder.com/64x88?text=No+Cover",
    borrowDate:   b.borrow_date?.slice(0, 10),
    dueDate:      b.due_date?.slice(0, 10),
    renewalCount: b.renewed_count ?? 0,
    maxRenewals:  MAX_RENEWALS,
    status:       b.status,
    fineAmount:   b.fine_amount || 0,
  };
}

// Map API → UI shape cho History
function mapHistoryRecord(b) {
  const returnedDate = b.return_date?.slice(0, 10);
  const dueDate      = b.due_date?.slice(0, 10);
  const isLate       = returnedDate && dueDate && returnedDate > dueDate;
  return {
    id:           b.id,
    book_id:      b.book_id,
    title:        b.book_title || b.title,
    author:       b.author,
    category:     b.category || "Uncategorized",
    coverUrl:     b.cover_url || "https://via.placeholder.com/64x88?text=No+Cover",
    borrowDate:   b.borrow_date?.slice(0, 10),
    dueDate,
    returnedDate,
    status:       b.status,
    condition:    b.status === 'lost' ? 'lost' : isLate ? "late" : "on-time",
    finePaid:     b.fine_amount || 0,
    userRating:   b.user_rating || null,
  };
}

// ─── Category pills ───────────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  IT:          "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  Science:     "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  Mathematics: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  Literature:  "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  Philosophy:  "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
};
function CategoryPill({ category }) {
  const cls = CATEGORY_COLORS[category] ?? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{category}</span>;
}

// ─── Status badge cho active loans ───────────────────────────────────────────
const ACTIVE_STATUS_CONFIG = {
  pending:    { label: "Pending Approval", bg: "bg-amber-100 dark:bg-amber-900/40",   text: "text-amber-700 dark:text-amber-400",   icon: Clock },
  borrowing:  { label: "Borrowing",        bg: "bg-indigo-100 dark:bg-indigo-900/40", text: "text-indigo-700 dark:text-indigo-400", icon: BookOpen },
  renewed:    { label: "Renewed",          bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-400", icon: RefreshCw },
  overdue:    { label: "Overdue",          bg: "bg-red-100 dark:bg-red-900/40",       text: "text-red-700 dark:text-red-400",       icon: AlertTriangle },
  returning:  { label: "Return Requested", bg: "bg-teal-100 dark:bg-teal-900/40",     text: "text-teal-700 dark:text-teal-400",     icon: RotateCcw },
};
function ActiveStatusBadge({ status }) {
  const cfg = ACTIVE_STATUS_CONFIG[status] ?? ACTIVE_STATUS_CONFIG.borrowing;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

// ─── Timeline progress ────────────────────────────────────────────────────────
function getProgress(book) {
  if (!book.borrowDate || !book.dueDate) return { daysLeft: 0, progress: 0, barColor: "bg-slate-300" };
  const today  = new Date(); today.setHours(0,0,0,0);
  const borrow = parseDateLocal(book.borrowDate);
  const due    = parseDateLocal(book.dueDate);
  const total  = diffDays(borrow, due);
  const elapsed = diffDays(borrow, today);
  const daysLeft = diffDays(today, due);
  const progress = Math.min(100, Math.round((elapsed / total) * 100));
  const pctLeft  = 1 - progress / 100;
  const barColor = daysLeft < 0 ? "bg-red-500"
    : pctLeft <= 0.2 ? "bg-orange-400"
    : pctLeft <= 0.35 ? "bg-amber-400"
    : "bg-indigo-500";
  return { daysLeft, progress, barColor };
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
      ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      {message}
    </div>
  );
}

// ─── Active Loans View ────────────────────────────────────────────────────────
function ActiveLoansView() {
  const [books,        setBooks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionId,     setActionId]     = useState(null);
  const [toast,        setToast]        = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchActive = useCallback(async () => {
    setLoading(true);
    try {
      const res = await borrowService.getMyBooks();
      setBooks((res.data.data || []).map(mapActiveBorrow));
    } catch (err) {
      console.error("[ActiveLoans]", err);
      showToast("Failed to load active loans", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActive(); }, [fetchActive]);

  // Gia hạn
  const handleRenew = async (borrowId) => {
    setActionId(borrowId);
    try {
      const res = await borrowService.extendBorrow(borrowId);
      showToast(res.data?.message || "Renewal requested!");
      const newDue = res.data?.data?.new_due_date;
      setBooks(prev => prev.map(b =>
        b.id === borrowId
          ? { ...b, dueDate: newDue || b.dueDate, renewalCount: b.renewalCount + 1, status: 'renewed' }
          : b
      ));
    } catch (err) {
      showToast(err.response?.data?.message || "Renewal failed", "error");
    } finally {
      setActionId(null);
    }
  };

  // User yêu cầu trả sách → chuyển sang 'returning', chờ admin confirm
  const handleRequestReturn = async (borrowId) => {
    setActionId(borrowId);
    try {
      await borrowService.requestReturn(borrowId);
      showToast("Return request sent! Awaiting admin confirmation.");
      setBooks(prev => prev.map(b =>
        b.id === borrowId ? { ...b, status: 'returning' } : b
      ));
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to request return", "error");
    } finally {
      setActionId(null);
    }
  };

  const filtered = useMemo(() => books.filter(b => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || b.status === statusFilter;
    return matchSearch && matchStatus;
  }), [books, search, statusFilter]);

  const overdueCount   = books.filter(b => b.status === "overdue").length;
  const pendingCount   = books.filter(b => b.status === "pending").length;
  const returningCount = books.filter(b => b.status === "returning").length;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-indigo-500" size={28} />
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Summary badges */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
          <BookOpen size={14} /> {books.length} Active {books.length === 1 ? "Loan" : "Loans"}
        </span>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
            <Clock size={13} /> {pendingCount} Pending
          </span>
        )}
        {overdueCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
            <AlertTriangle size={13} /> {overdueCount} Overdue
          </span>
        )}
        {returningCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400">
            <RotateCcw size={13} /> {returningCount} Awaiting Confirmation
          </span>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="Search by title or author…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="pl-8 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition appearance-none cursor-pointer">
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="borrowing">Borrowing</option>
            <option value="renewed">Renewed</option>
            <option value="overdue">Overdue</option>
            <option value="returning">Return Requested</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <BookOpen className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={36} />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {books.length === 0 ? "You have no active loans." : "No books match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map(book => {
            const { daysLeft, progress, barColor } = getProgress(book);
            const isActing = actionId === book.id;
            const canRenew = ['borrowing','renewed'].includes(book.status)
              && book.renewalCount < book.maxRenewals
              && daysLeft >= 0;
            const canReturn = ['borrowing','renewed','overdue'].includes(book.status);

            return (
              <div key={book.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border transition-shadow hover:shadow-md
                  ${book.status === "overdue" ? "border-red-200 dark:border-red-900/60"
                  : book.status === "returning" ? "border-teal-200 dark:border-teal-900/60"
                  : "border-slate-200 dark:border-slate-700"}`}>
                <div className="p-5">
                  <div className="flex gap-4">
                    <div className="w-16 rounded-lg overflow-hidden shrink-0 shadow-sm bg-slate-200 dark:bg-slate-700" style={{ minHeight: 88 }}>
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <p className="text-slate-900 dark:text-slate-100 font-bold truncate">{book.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{book.author}</p>
                        </div>
                        <ActiveStatusBadge status={book.status} />
                      </div>

                      <div className="mt-2 mb-1"><CategoryPill category={book.category} /></div>

                      {/* Pending — no dates needed */}
                      {book.status === 'pending' ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                          Waiting for admin to approve and ship your book.
                        </p>
                      ) : book.status === 'returning' ? (
                        <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">
                          Return request sent. Awaiting admin confirmation.
                          {book.fineAmount > 0 && ` Fine: ${fmtMoney(book.fineAmount)}`}
                        </p>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-slate-400" />
                              Borrowed: <span className="text-slate-700 dark:text-slate-300 ml-0.5 font-medium">{fmtDate(book.borrowDate)}</span>
                            </span>
                            <span className={`flex items-center gap-1.5 ${book.status === "overdue" ? "text-red-500 dark:text-red-400" : daysLeft <= 3 ? "text-orange-500" : ""}`}>
                              <Clock size={12} />
                              Due: <span className="ml-0.5 font-medium">{fmtDate(book.dueDate)}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <RefreshCw size={12} className="text-slate-400" />
                              Renewals: <span className="ml-0.5 font-medium">{book.renewalCount}/{book.maxRenewals}</span>
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-3 mb-3">
                            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-1">
                              <span>{daysLeft < 0 ? `${Math.abs(daysLeft)} days past due` : `${daysLeft} days remaining`}</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${progress}%` }} />
                            </div>
                          </div>

                          {/* Fine notice */}
                          {book.status === 'overdue' && book.fineAmount > 0 && (
                            <p className="text-xs text-red-500 dark:text-red-400 mb-2">
                              Accumulated fine: {fmtMoney(book.fineAmount)} — fine accruing daily
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {canReturn && (
                              <button onClick={() => handleRequestReturn(book.id)} disabled={isActing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border font-medium transition-colors border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 bg-white dark:bg-transparent disabled:opacity-50">
                                {isActing ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                Request Return
                              </button>
                            )}
                            {canRenew && (
                              <button onClick={() => handleRenew(book.id)} disabled={isActing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border font-medium transition-colors border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 bg-white dark:bg-transparent disabled:opacity-50">
                                {isActing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                Renew ({book.renewalCount}/{book.maxRenewals})
                              </button>
                            )}
                            {book.renewalCount >= book.maxRenewals && !['overdue','returning'].includes(book.status) && (
                              <span className="text-xs text-slate-400 dark:text-slate-500">Max renewals reached</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Star Rating Input ────────────────────────────────────────────────────────
function StarRatingInput({ rating, onChange }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? rating ?? 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)}
          className="focus:outline-none">
          <Star size={13} className={`transition-colors ${n <= display ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
        </button>
      ))}
    </div>
  );
}

// ─── History condition badge ──────────────────────────────────────────────────
function ConditionBadge({ record }) {
  if (record.status === 'lost') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400">
      <Package size={10} /> Lost
      {record.finePaid > 0 && <span className="ml-1">· {fmtMoney(record.finePaid)}</span>}
    </span>
  );
  if (record.status === 'cancelled') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
      Cancelled
    </span>
  );
  if (record.condition === "on-time") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
      <CheckCircle size={10} /> Returned on time
    </span>
  );
  return (
    <span className="inline-flex flex-col items-start px-2.5 py-1 rounded-xl text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
      <span className="flex items-center gap-1"><AlertTriangle size={10} /> Returned late</span>
      {record.finePaid > 0 && <span className="mt-0.5 font-medium">Fine {fmtMoney(record.finePaid)} paid</span>}
    </span>
  );
}

// ─── History View ─────────────────────────────────────────────────────────────
function HistoryView() {
  const [records,      setRecords]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [ratings,      setRatings]      = useState({});
  const [ratingTarget, setRatingTarget] = useState(null);
  const [toast,        setToast]        = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await borrowService.getHistory({ page, limit: PAGE_SIZE });
      const mapped = (res.data.data || []).map(mapHistoryRecord);
      setRecords(mapped);
      setTotal(res.data.pagination?.total || 0);
      const initRatings = {};
      mapped.forEach(r => { if (r.userRating) initRatings[r.id] = r.userRating; });
      setRatings(prev => ({ ...initRatings, ...prev }));
    } catch (err) {
      console.error("[History]", err);
      showToast("Failed to load history", "error");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleRating = async (borrowId, bookId, newRating) => {
    setRatings(prev => ({ ...prev, [borrowId]: newRating }));
    setRatingTarget(null);
    try {
      await reviewService.submitRating({ book_id: bookId, rating: newRating });
      showToast("Rating saved!");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save rating", "error");
      setRatings(prev => ({ ...prev, [borrowId]: ratings[borrowId] }));
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, total);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-indigo-500" size={28} />
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {records.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <History className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={36} />
          <p className="text-slate-500 dark:text-slate-400 text-sm">No borrowing history yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  {["Book", "Borrowed", "Returned", "Status", "Your Rating"].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {records.map(record => {
                  const currentRating = ratings[record.id];
                  const isRating      = ratingTarget === record.id;
                  const canRate       = record.status === 'returned'; // chỉ rate khi đã returned hẳn
                  return (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 shadow-sm">
                            <img src={record.coverUrl} alt={record.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-900 dark:text-slate-100 font-semibold leading-snug">{record.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{record.author}</p>
                            <div className="mt-1"><CategoryPill category={record.category} /></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{fmtDate(record.borrowDate)}</td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{fmtDate(record.returnedDate)}</td>
                      <td className="px-5 py-4"><ConditionBadge record={record} /></td>
                      <td className="px-5 py-4">
                        {!canRate ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : isRating ? (
                          <div className="flex flex-col gap-1">
                            <StarRatingInput rating={currentRating} onChange={r => handleRating(record.id, record.book_id, r)} />
                            <button onClick={() => setRatingTarget(null)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                          </div>
                        ) : currentRating ? (
                          <button onClick={() => setRatingTarget(record.id)} className="flex items-center gap-1 group">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} size={13} className={n <= currentRating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"} />
                            ))}
                            <span className="ml-1 text-xs text-slate-400 group-hover:text-indigo-500">Edit</span>
                          </button>
                        ) : (
                          <button onClick={() => setRatingTarget(record.id)}
                            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium">
                            <Star size={12} /> Rate Book
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {records.map(record => {
              const currentRating = ratings[record.id];
              const isRating      = ratingTarget === record.id;
              const canRate       = record.status === 'returned';
              return (
                <div key={record.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 shadow-sm">
                      <img src={record.coverUrl} alt={record.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900 dark:text-slate-100 font-semibold">{record.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{record.author}</p>
                      <div className="mt-1"><CategoryPill category={record.category} /></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <div>
                      <p className="uppercase tracking-wider mb-0.5 font-semibold" style={{fontSize:"0.65rem"}}>Borrowed</p>
                      <p className="text-slate-700 dark:text-slate-300">{fmtDate(record.borrowDate)}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wider mb-0.5 font-semibold" style={{fontSize:"0.65rem"}}>Returned</p>
                      <p className="text-slate-700 dark:text-slate-300">{fmtDate(record.returnedDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <ConditionBadge record={record} />
                    {canRate && (isRating ? (
                      <div className="flex items-center gap-2">
                        <StarRatingInput rating={currentRating} onChange={r => handleRating(record.id, record.book_id, r)} />
                        <button onClick={() => setRatingTarget(null)} className="text-xs text-slate-400">✕</button>
                      </div>
                    ) : currentRating ? (
                      <button onClick={() => setRatingTarget(record.id)} className="flex items-center gap-1">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={12} className={n <= currentRating ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"} />
                        ))}
                      </button>
                    ) : (
                      <button onClick={() => setRatingTarget(record.id)}
                        className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        <Star size={12} /> Rate Book
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{start}–{end}</span> of{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{total}</span> books
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={14} /> Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i+1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${n === page ? "bg-indigo-600 text-white font-semibold" : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────
export function BorrowedTab() {
  const [subTab,      setSubTab]      = useState("active");
  const [activeCnt,   setActiveCnt]   = useState(0);
  const [historyCnt,  setHistoryCnt]  = useState(0);

  useEffect(() => {
    borrowService.getMyBooks()
      .then(r => setActiveCnt((r.data.data || []).length))
      .catch(() => {});
    borrowService.getHistory({ page: 1, limit: 1 })
      .then(r => setHistoryCnt(r.data.pagination?.total || 0))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-semibold">My Borrowed Books</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your active loans and view your borrowing history.
        </p>
      </div>

      <div className="flex items-center gap-1 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit border border-slate-200 dark:border-slate-700">
        {[
          { key: "active",  label: "Active Loans", icon: Layers,  count: activeCnt  },
          { key: "history", label: "History",       icon: History, count: historyCnt },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setSubTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all
                ${isActive ? "bg-indigo-600 text-white shadow-sm font-semibold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"}`}>
              <Icon size={14} />
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold
                ${isActive ? "bg-white/20 text-white"
                : tab.key === "active" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {subTab === "active"  && <ActiveLoansView />}
      {subTab === "history" && <HistoryView />}
    </div>
  );
}