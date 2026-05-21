import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Bell, Clock, AlertTriangle, BookOpen, RotateCcw } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import borrowService from '../../services/borrowService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const avatarColors = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-cyan-600',
];

// Calculate days remaining (positive) or days overdue (negative)
const calcDaysLeft = (dueDateStr) => {
  const today = new Date(); 
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return Math.floor((due - today) / (1000 * 60 * 60 * 24));
};

// Calculate days overdue (always positive)
const calcDaysOverdue = (dueDateStr) => {
  const days = calcDaysLeft(dueDateStr);
  return days < 0 ? Math.abs(days) : 0;
};

// Get initials for avatar
const getAvatar = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// Format currency (VND)
const formatMoney = (amount) =>
  amount > 0
    ? new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
    : '—';

// Calculate fine from due_date (1,000đ/day, max 50,000đ)
const calcFine = (dueDateStr) => {
  const days = calcDaysOverdue(dueDateStr);
  return Math.min(days * 1000, 50000);
};

// ── Loading skeleton ──────────────────────────────────────────────────────────
const TableSkeleton = ({ cols = 6 }) => (
  <tbody>
    {[...Array(4)].map((_, i) => (
      <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
        {[...Array(cols)].map((_, j) => (
          <td key={j} className="px-5 py-4">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// ── Toast notification ────────────────────────────────────────────────────────
const Toast = ({ message, type = 'success' }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
    {type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
    {message}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function BorrowingReturns() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [allBorrows,  setAllBorrows]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [notifiedIds, setNotifiedIds] = useState([]);
  const [toast,       setToast]       = useState(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch data ─────────────────────────────────────────────────────────────
  // [SỬA] Bỏ getOverdue() riêng — dùng getAllBorrows() duy nhất, nhất quán hơn
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await borrowService.getAllBorrows({ limit: 100 });
      setAllBorrows(res.data.data || []);
    } catch (err) {
      console.error('[fetchData]', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filter by status ────────────────────────────────────────────────────────
  const pendingList  = allBorrows.filter(b => b.status === 'pending');
  const activeList   = allBorrows.filter(b => ['borrowing', 'renewed'].includes(b.status));
  // [SỬA] overdueList giờ filter từ allBorrows — cùng source, cùng field names
  const overdueList  = allBorrows.filter(b => b.status === 'overdue');

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await borrowService.approveBorrow(id);
      showToast('Borrow request approved');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Approval failed', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await borrowService.rejectBorrow(id);
      showToast('Borrow request rejected');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Rejection failed', 'error');
    }
  };

  const handleConfirmReturn = async (id) => {
    try {
      const res = await borrowService.returnBook(id);
      showToast(res.data?.message || 'Book returned successfully');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Return failed', 'error');
    }
  };

  // Notify is UI only — no email API yet
  const handleNotify = (id) => {
    setNotifiedIds(prev => [...prev, id]);
    showToast('Notification sent to user');
    setTimeout(() => setNotifiedIds(prev => prev.filter(i => i !== id)), 3000);
  };

  // ── Tab config ─────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'pending', label: 'Pending',       count: pendingList.length, color: 'amber'   },
    { id: 'active',  label: 'Active Borrows', count: activeList.length,  color: 'emerald' },
    { id: 'overdue', label: 'Overdue',        count: overdueList.length, color: 'red'     },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <div>
        <h1 className="text-slate-900 dark:text-white text-xl font-semibold">Borrowing & Returns Management</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Approve borrow requests, confirm returns and track overdue books
        </p>
      </div>

      {/* Summary cards — tất cả dùng cùng source */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending',       count: pendingList.length,  icon: Clock,         bg: 'bg-amber-500/10',   color: 'text-amber-400',   border: 'border-amber-500/20'   },
          { label: 'Active Borrows', count: activeList.length,  icon: BookOpen,      bg: 'bg-emerald-500/10', color: 'text-emerald-400', border: 'border-emerald-500/20' },
          { label: 'Overdue',       count: overdueList.length,  icon: AlertTriangle, bg: 'bg-red-500/10',     color: 'text-red-400',     border: 'border-red-500/20'     },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`bg-white dark:bg-[#111827] rounded-xl border ${s.border} p-4 flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">{s.label}</p>
                <p className={`text-2xl font-semibold ${s.color}`}>{loading ? '—' : s.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="pending">
        <Tabs.List className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <Tabs.Trigger key={tab.id} value={tab.id}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all
                data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827]
                data-[state=active]:text-slate-900 dark:data-[state=active]:text-white
                data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-slate-400">
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                tab.color === 'amber'   ? 'bg-amber-500/20 text-amber-400'     :
                tab.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                                          'bg-red-500/20 text-red-400'
              }`}>{tab.count}</span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* ── Tab: Pending ──────────────────────────────────────────────────── */}
        <Tabs.Content value="pending" className="mt-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-slate-900 dark:text-white font-medium">Pending Approval Requests</h3>
              <p className="text-slate-400 text-xs mt-0.5">Review and approve or reject borrow requests</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    {['ID', 'User', 'Book', 'Request Date', 'Due Date', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                {loading ? <TableSkeleton cols={6} /> : (
                  <tbody>
                    {pendingList.map((item, i) => (
                      <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs text-amber-400">#{item.id}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                              {getAvatar(item.user_name)}
                            </div>
                            <div>
                              <p className="text-slate-700 dark:text-slate-200 text-sm">{item.user_name}</p>
                              <p className="text-slate-400 text-xs">{item.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm">{item.book_title}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{item.borrow_date}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{item.due_date}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(item.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs">
                              <CheckCircle size={11} /> Approve
                            </button>
                            <button onClick={() => handleReject(item.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs">
                              ✕ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingList.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-12">
                        <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                        <p className="text-slate-400 text-sm">All caught up! No pending requests.</p>
                      </td></tr>
                    )}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </Tabs.Content>

        {/* ── Tab: Active Borrows ───────────────────────────────────────────── */}
        <Tabs.Content value="active" className="mt-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-slate-900 dark:text-white font-medium">Currently Borrowed Books</h3>
              <p className="text-slate-400 text-xs mt-0.5">List of books that have not been returned</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    {['ID', 'User', 'Book', 'Borrow Date', 'Due Date', 'Days Left', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                {loading ? <TableSkeleton cols={7} /> : (
                  <tbody>
                    {activeList.map((item, i) => {
                      const daysLeft = calcDaysLeft(item.due_date);
                      return (
                        <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs text-emerald-400">#{item.id}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                                {getAvatar(item.user_name)}
                              </div>
                              <div>
                                <p className="text-slate-700 dark:text-slate-200 text-sm">{item.user_name}</p>
                                <p className="text-slate-400 text-xs">{item.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm">{item.book_title}</td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{item.borrow_date}</td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{item.due_date}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              daysLeft <= 2 ? 'bg-red-500/10 text-red-400'     :
                              daysLeft <= 5 ? 'bg-amber-500/10 text-amber-400' :
                                              'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {daysLeft >= 0 ? `${daysLeft} days` : 'Overdue'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <button onClick={() => handleConfirmReturn(item.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs">
                              <RotateCcw size={11} /> Confirm Return
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {activeList.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-12">
                        <p className="text-slate-400 text-sm">No books are currently borrowed</p>
                      </td></tr>
                    )}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </Tabs.Content>

        {/* ── Tab: Overdue ──────────────────────────────────────────────────── */}
        <Tabs.Content value="overdue" className="mt-4">
          {!loading && overdueList.length > 0 && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 w-fit">
              <AlertTriangle size={14} className="text-red-400" />
              <p className="text-red-400 text-xs">
                {overdueList.length} books are overdue — fines are accumulating daily
              </p>
            </div>
          )}
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-red-500/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-red-500/10 bg-red-500/5">
              <h3 className="text-red-400 font-medium">Overdue Records</h3>
              <p className="text-red-400/70 text-xs mt-0.5">These books are past their due date with accumulated fines</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-red-500/5">
                    {['ID', 'User', 'Book', 'Due Date', 'Days Overdue', 'Fine', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                {loading ? <TableSkeleton cols={7} /> : (
                  <tbody>
                    {overdueList.map((item, i) => {
                      const notified    = notifiedIds.includes(item.id);
                      const daysOverdue = calcDaysOverdue(item.due_date);
                      // [SỬA] Ưu tiên fine_amount từ DB, fallback tính lại nếu chưa có
                      const fine        = item.fine_amount > 0
                        ? item.fine_amount
                        : calcFine(item.due_date);
                      return (
                        <tr key={item.id} className="border-b border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs text-red-400">#{item.id}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                                {getAvatar(item.user_name)}
                              </div>
                              <div>
                                {/* [SỬA] Dùng user_name thay vì full_name — đúng với allBorrows response */}
                                <p className="text-slate-700 dark:text-slate-200 text-sm">{item.user_name}</p>
                                <p className="text-slate-400 text-xs">{item.email}</p>
                              </div>
                            </div>
                          </td>
                          {/* [SỬA] Dùng book_title thay vì title — đúng với allBorrows response */}
                          <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm">{item.book_title}</td>
                          <td className="px-5 py-3.5 text-red-400 text-sm">{item.due_date}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
                              {daysOverdue} days
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-red-400 font-semibold text-sm">
                              {formatMoney(fine)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-2">
                              <button onClick={() => handleConfirmReturn(item.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs">
                                <CheckCircle size={11} /> Return
                              </button>
                              <button onClick={() => handleNotify(item.id)} disabled={notified}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all ${
                                  notified
                                    ? 'bg-slate-500/10 text-slate-400 cursor-not-allowed'
                                    : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                }`}>
                                <Bell size={11} /> {notified ? 'Sent!' : 'Notify'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {overdueList.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-12">
                        <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                        <p className="text-slate-400 text-sm">No overdue books!</p>
                      </td></tr>
                    )}
                  </tbody>
                )}
              </table>
            </div>
            {!loading && overdueList.length > 0 && (
              <div className="px-5 py-3 border-t border-red-500/10 bg-red-500/5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Total accumulated fines</span>
                <span className="text-red-400 font-semibold">
                  {/* [SỬA] Tính tổng từ fine_amount trong DB, fallback calcFine */}
                  {formatMoney(overdueList.reduce((sum, item) => {
                    const fine = item.fine_amount > 0 ? item.fine_amount : calcFine(item.due_date);
                    return sum + fine;
                  }, 0))}
                </span>
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}