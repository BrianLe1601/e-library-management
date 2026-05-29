import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, AlertTriangle, Clock, CheckCircle2,
  RotateCcw, XCircle, ChevronRight, Loader2,
  TrendingUp, Package,
} from "lucide-react";
import borrowService from "../../services/borrowService";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
function daysLeft(dueDateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(dueDateStr); due.setHours(0,0,0,0);
  return Math.ceil((due - today) / 86400000);
}
function fmtMoney(amount) {
  if (!amount || amount === 0) return null;
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7)  return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff/7)} weeks ago`;
  return `${Math.floor(diff/30)} months ago`;
}

// ─── Status icon map ──────────────────────────────────────────────────────────
const ACTIVITY_CONFIG = {
  pending:   { icon: Clock,        color: "text-amber-400",   bg: "bg-amber-500/10",   label: "Awaiting Approval"    },
  borrowing: { icon: BookOpen,     color: "text-blue-400",    bg: "bg-blue-500/10",    label: "Approved"             },
  renewed:   { icon: RotateCcw,    color: "text-purple-400",  bg: "bg-purple-500/10",  label: "Renewed"              },
  returning: { icon: RotateCcw,    color: "text-teal-400",    bg: "bg-teal-500/10",    label: "Return Requested"     },
  returned:  { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Returned"             },
  overdue:   { icon: AlertTriangle,color: "text-red-400",     bg: "bg-red-500/10",     label: "Overdue"              },
  cancelled: { icon: XCircle,      color: "text-slate-400",   bg: "bg-slate-500/10",   label: "Cancelled"            },
  lost:      { icon: Package,      color: "text-orange-400",  bg: "bg-orange-500/10",  label: "Lost"                 },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${className}`} />
);

// ─── Main Component ───────────────────────────────────────────────────────────
export function DashboardTab() {
  const [active,  setActive]  = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [activeRes, historyRes] = await Promise.all([
          borrowService.getMyBooks(),
          borrowService.getHistory(),
        ]);
        setActive(activeRes.data.data   || []);
        setHistory(historyRes.data.data || []);
      } catch (err) {
        console.error("[DashboardTab]", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Computed stats ──────────────────────────────────────────────────────────
  const activeCount   = active.filter(b => ['borrowing','renewed'].includes(b.status)).length;
  const pendingCount  = active.filter(b => b.status === 'pending').length;
  const overdueCount  = active.filter(b => b.status === 'overdue').length;
  const totalFines    = active.reduce((sum, b) => sum + (Number(b.fine_amount) || 0), 0);

  // Due soon — sắp hết hạn trong 5 ngày (chỉ borrowing/renewed)
  const dueSoon = active
    .filter(b => ['borrowing','renewed'].includes(b.status) && b.due_date)
    .map(b => ({ ...b, days: daysLeft(b.due_date) }))
    .filter(b => b.days >= 0 && b.days <= 5)
    .sort((a, b) => a.days - b.days);

  // Recent activity — 5 records gần nhất từ history
  const recentActivity = history.slice(0, 5);

  // ── Stats config ────────────────────────────────────────────────────────────
  const stats = [
    { label: "Active Loans",  value: activeCount,              icon: BookOpen,      bg: "bg-blue-500/10",    color: "text-blue-400"    },
    { label: "Pending",       value: pendingCount,             icon: Clock,         bg: "bg-amber-500/10",   color: "text-amber-400"   },
    { label: "Overdue",       value: overdueCount,             icon: AlertTriangle, bg: "bg-red-500/10",     color: "text-red-400"     },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-semibold">Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Overview of your library activity
        </p>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <Skeleton className="w-9 h-9 rounded-xl mb-3" />
              <Skeleton className="h-7 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))
        ) : stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.bg}`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Due Soon ───────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-slate-900 dark:text-slate-100 font-semibold text-sm">Due Soon</h3>
              <p className="text-slate-400 text-xs mt-0.5">Books due within 5 days</p>
            </div>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-10 h-14 rounded-lg shrink-0" />
                  <div className="flex-1"><Skeleton className="h-3 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : dueSoon.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-60 mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No books due soon.</p>
              <p className="text-slate-400 text-xs mt-1">You're all good!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {dueSoon.map(book => (
                <div key={book.id} className={`flex items-center gap-3 px-5 py-3.5
                  ${book.days <= 1 ? 'bg-red-50/50 dark:bg-red-900/10' : book.days <= 3 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                  <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 shadow-sm">
                    <img src={book.cover_url || "https://via.placeholder.com/40x56?text=📖"}
                      alt={book.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{book.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Due {fmtDate(book.due_date)}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    book.days === 0 ? 'bg-red-500/20 text-red-500'
                    : book.days <= 2 ? 'bg-orange-500/20 text-orange-500'
                    : 'bg-amber-500/20 text-amber-600'
                  }`}>
                    {book.days === 0 ? 'Due today!' : `${book.days}d left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent Activity ────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-slate-900 dark:text-slate-100 font-semibold text-sm">Recent Activity</h3>
              <p className="text-slate-400 text-xs mt-0.5">Your latest borrow actions</p>
            </div>
          </div>

          {loading ? (
            <div className="p-5 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                  <div className="flex-1"><Skeleton className="h-3 w-3/4 mb-2" /><Skeleton className="h-3 w-1/2" /></div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No activity yet.</p>
              <p className="text-slate-400 text-xs mt-1">Start borrowing books!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {recentActivity.map(record => {
                const cfg = ACTIVITY_CONFIG[record.status] || ACTIVITY_CONFIG.borrowing;
                const Icon = cfg.icon;
                return (
                  <div key={record.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <Icon size={14} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {record.book_title || record.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{cfg.label}</p>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                      {timeAgo(record.borrow_date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Overdue Warning ────────────────────────────────────────────────────── */}
      {!loading && overdueCount > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              You have {overdueCount} overdue {overdueCount === 1 ? 'book' : 'books'}
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
              Fines are accumulating daily. Please return your books as soon as possible.
            </p>
          </div>
        </div>
      )}

      {/* ── Pending notice ──────────────────────────────────────────────────── */}
      {!loading && pendingCount > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {pendingCount} borrow {pendingCount === 1 ? 'request' : 'requests'} awaiting approval
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              An admin will review and approve your request shortly.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}