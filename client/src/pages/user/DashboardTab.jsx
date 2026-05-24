import { useState, useEffect, useCallback } from "react";
import {
  BookOpen, BookMarked, AlertTriangle, Clock, Loader2,
  RefreshCw, CheckCircle2, RotateCcw, Package, XCircle,
} from "lucide-react";
import borrowService from "../../services/borrowService";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: "Pending Approval",   classes: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"     },
  borrowing: { label: "Borrowing",          classes: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"         },
  renewed:   { label: "Renewed",            classes: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  overdue:   { label: "Overdue",            classes: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"             },
  returning: { label: "Return Requested",   classes: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400"         },
  returned:  { label: "Returned",           classes: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"     },
  cancelled: { label: "Cancelled",          classes: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"        },
  lost:      { label: "Lost",               classes: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function fmtMoney(amount) {
  if (!amount || amount === 0) return null;
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}
function daysLeft(dueDateStr) {
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr); dueDate.setHours(0, 0, 0, 0);
  return Math.ceil((dueDate - today) / 86400000);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = "success" }) {
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white
      ${type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
      {type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {message}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DashboardTab() {
  const [borrows,  setBorrows]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [meta,     setMeta]     = useState({ total: 0, totalPages: 1 });
  const [actionId, setActionId] = useState(null);
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await borrowService.getHistory({ page, limit: 10 });
      if (data.success) {
        setBorrows(data.data);
        setMeta(data.pagination || { total: 0, totalPages: 1 });
      }
    } catch {
      showToast("Failed to load borrow history", "error");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalBorrowed    = meta.total;
  const activeBorrows    = borrows.filter(b =>
    ['pending','borrowing','renewed','overdue','returning'].includes(b.status)
  ).length;
  const overdueCount     = borrows.filter(b => b.status === 'overdue').length;
  const totalFines       = borrows.reduce((sum, b) => sum + (Number(b.fine_amount) || 0), 0);

  // ── Handlers ───────────────────────────────────────────────────────────────

  // User request return → status = 'returning', chờ admin confirm
  const handleRequestReturn = async (borrowId) => {
    setActionId(borrowId);
    try {
      await borrowService.requestReturn(borrowId);
      showToast("Return request sent! Awaiting admin confirmation.");
      setBorrows(prev => prev.map(b =>
        b.id === borrowId ? { ...b, status: 'returning' } : b
      ));
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to request return", "error");
    } finally {
      setActionId(null); }
  };

  // Renew
  const handleRenew = async (borrow) => {
    if (borrow.renewed_count >= 2) {
      showToast("Maximum renewals reached (2 times)", "error");
      return;
    }
    setActionId(borrow.id);
    try {
      const { data } = await borrowService.extendBorrow(borrow.id);
      const newDue = data.data?.new_due_date;
      showToast(`Renewed! New due date: ${fmtDate(newDue)}`);
      setBorrows(prev => prev.map(b =>
        b.id === borrow.id
          ? { ...b, due_date: newDue || b.due_date, renewed_count: (b.renewed_count || 0) + 1, status: 'renewed' }
          : b
      ));
    } catch (err) {
      showToast(err.response?.data?.message || "Renewal failed", "error");
    } finally {
      setActionId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: BookOpen,      label: "Total Borrows",   value: totalBorrowed,               color: "blue"   },
          { icon: BookMarked,    label: "Active Loans",    value: activeBorrows,               color: "indigo" },
          { icon: AlertTriangle, label: "Overdue",         value: overdueCount,                color: "red"    },
          { icon: Clock,         label: "Total Fines",     value: fmtMoney(totalFines) || "—", color: "amber"  },
        ].map(stat => {
          const colorMap = {
            blue:   { bg: "bg-blue-100 dark:bg-blue-900/40",     text: "text-blue-700 dark:text-blue-400"    },
            indigo: { bg: "bg-indigo-100 dark:bg-indigo-900/40", text: "text-indigo-700 dark:text-indigo-400"},
            red:    { bg: "bg-red-100 dark:bg-red-900/40",       text: "text-red-600 dark:text-red-400"      },
            amber:  { bg: "bg-amber-100 dark:bg-amber-900/40",   text: "text-amber-600 dark:text-amber-400"  },
          };
          const c = colorMap[stat.color];
          return (
            <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>
                <stat.icon className={`w-4 h-4 ${c.text}`} />
              </div>
              <p className="text-2xl text-gray-900 dark:text-gray-100 font-bold">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-gray-900 dark:text-gray-100 font-semibold">Borrow History</h3>
          <span className="text-xs text-gray-400">{meta.total} total records</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : borrows.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No borrow history yet.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                    {["Book", "Borrow Date", "Due Date", "Return Date", "Status", "Fine", "Actions"].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {borrows.map(record => {
                    const st       = STATUS_CONFIG[record.status] || STATUS_CONFIG.borrowing;
                    const isActive = ['borrowing','renewed','overdue'].includes(record.status);
                    const canReturn= isActive;
                    const canRenew = ['borrowing','renewed'].includes(record.status)
                      && (record.renewed_count || 0) < 2
                      && record.due_date && daysLeft(record.due_date) >= 0;
                    const isReturning = record.status === 'returning';
                    const days     = record.due_date ? daysLeft(record.due_date) : null;
                    const isActing = actionId === record.id;

                    return (
                      <tr key={record.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors
                        ${record.status === 'overdue' ? 'bg-red-50/30 dark:bg-red-900/5' : ''}
                        ${record.status === 'lost' ? 'bg-orange-50/30 dark:bg-orange-900/5' : ''}`}>

                        {/* Book */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                            </div>
                            <span className="text-sm text-gray-900 dark:text-gray-100 font-medium line-clamp-1">
                              {record.book_title || record.title}
                            </span>
                          </div>
                        </td>

                        {/* Borrow Date */}
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {fmtDate(record.borrow_date)}
                        </td>

                        {/* Due Date */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`text-sm ${
                            days !== null && days < 0 && isActive  ? 'text-red-500 dark:text-red-400 font-semibold'
                            : days !== null && days <= 3 && isActive ? 'text-amber-500 dark:text-amber-400 font-semibold'
                            : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {fmtDate(record.due_date)}
                            {days !== null && isActive && (
                              <span className="block text-xs font-normal mt-0.5">
                                {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today!' : `${days} days left`}
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Return Date */}
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {fmtDate(record.return_date)}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.classes}`}>
                            {st.label}
                          </span>
                        </td>

                        {/* Fine */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {Number(record.fine_amount) > 0 ? (
                            <div>
                              <span className={`text-sm font-semibold ${record.fine_paid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {fmtMoney(Number(record.fine_amount))}
                              </span>
                              {record.fine_paid && (
                                <span className="block text-xs text-green-600 dark:text-green-400">Paid ✓</span>
                              )}
                              {!record.fine_paid && record.status === 'overdue' && (
                                <span className="block text-xs text-red-500">Unpaid</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          {isReturning ? (
                            <span className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 font-medium">
                              <RotateCcw size={12} /> Awaiting confirmation
                            </span>
                          ) : record.status === 'lost' ? (
                            <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                              <Package size={12} /> Reported lost
                            </span>
                          ) : record.status === 'returned' || record.status === 'cancelled' ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              {canReturn && (
                                <button onClick={() => handleRequestReturn(record.id)} disabled={isActing}
                                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 font-medium disabled:opacity-50 transition-colors">
                                  {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                                  Return
                                </button>
                              )}
                              {canRenew && (
                                <button onClick={() => handleRenew(record)} disabled={isActing}
                                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 font-medium disabled:opacity-50 transition-colors">
                                  {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                  Renew ({record.renewed_count || 0}/2)
                                </button>
                              )}
                              {record.status === 'pending' && (
                                <span className="text-xs text-amber-600 dark:text-amber-400">Awaiting approval</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700">
              {borrows.map(record => {
                const st       = STATUS_CONFIG[record.status] || STATUS_CONFIG.borrowing;
                const isActive = ['borrowing','renewed','overdue'].includes(record.status);
                const canReturn= isActive;
                const canRenew = ['borrowing','renewed'].includes(record.status)
                  && (record.renewed_count || 0) < 2
                  && record.due_date && daysLeft(record.due_date) >= 0;
                const isActing    = actionId === record.id;
                const isReturning = record.status === 'returning';

                return (
                  <div key={record.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium line-clamp-2">
                        {record.book_title || record.title}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs shrink-0 font-semibold ${st.classes}`}>
                        {st.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>Borrowed: {fmtDate(record.borrow_date)}</span>
                      <span className={record.status === 'overdue' ? 'text-red-500 font-semibold' : ''}>
                        Due: {fmtDate(record.due_date)}
                      </span>
                      {record.return_date && <span>Returned: {fmtDate(record.return_date)}</span>}
                    </div>

                    {Number(record.fine_amount) > 0 && (
                      <p className={`text-xs font-semibold ${record.fine_paid ? 'text-green-600' : 'text-red-500'}`}>
                        Fine: {fmtMoney(Number(record.fine_amount))}{record.fine_paid ? ' (Paid)' : ' (Unpaid)'}
                      </p>
                    )}

                    {isReturning ? (
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1">
                        <RotateCcw size={11} /> Return awaiting admin confirmation
                      </p>
                    ) : record.status === 'lost' ? (
                      <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <Package size={11} /> Reported lost
                      </p>
                    ) : (
                      <div className="flex gap-2 pt-1 flex-wrap">
                        {canReturn && (
                          <button onClick={() => handleRequestReturn(record.id)} disabled={isActing}
                            className="text-xs px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 font-medium disabled:opacity-50">
                            Request Return
                          </button>
                        )}
                        {canRenew && (
                          <button onClick={() => handleRenew(record)} disabled={isActing}
                            className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 font-medium disabled:opacity-50">
                            Renew ({record.renewed_count || 0}/2)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 p-4 border-t border-gray-200 dark:border-slate-700">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  ← Previous
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Page {page} / {meta.totalPages}
                </span>
                <button onClick={() => setPage(p => Math.min(meta.totalPages, p+1))} disabled={page === meta.totalPages}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}