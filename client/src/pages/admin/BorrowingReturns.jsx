import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Bell, Clock, AlertTriangle, BookOpen,
  RotateCcw, Package, XCircle, Loader2,
} from 'lucide-react';
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

const calcDaysLeft    = (d) => { const t = new Date(); t.setHours(0,0,0,0); const due = new Date(d); due.setHours(0,0,0,0); return Math.floor((due-t)/86400000); };
const calcDaysOverdue = (d) => { const n = calcDaysLeft(d); return n < 0 ? Math.abs(n) : 0; };
const getAvatar       = (name = '') => { const p = name.trim().split(' '); return p.length >= 2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : name.slice(0,2).toUpperCase(); };
const formatMoney     = (amount) => amount > 0 ? new Intl.NumberFormat('vi-VN').format(amount) + 'đ' : '—';
const calcFine        = (d) => Math.min(calcDaysOverdue(d) * 1000, 50000);
const fmtDate         = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

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

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type = 'success' }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
    {type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
    {message}
  </div>
);

// ── User avatar cell ──────────────────────────────────────────────────────────
const UserCell = ({ name, email, colorIdx }) => (
  <div className="flex items-center gap-2">
    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[colorIdx % avatarColors.length]} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
      {getAvatar(name)}
    </div>
    <div>
      <p className="text-slate-700 dark:text-slate-200 text-sm">{name}</p>
      <p className="text-slate-400 text-xs">{email}</p>
    </div>
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, color, message, cols }) => (
  <tr>
    <td colSpan={cols} className="text-center py-12">
      <Icon size={32} className={`mx-auto mb-2 ${color} opacity-60`} />
      <p className="text-slate-400 text-sm">{message}</p>
    </td>
  </tr>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function BorrowingReturns() {
  const [allBorrows,  setAllBorrows]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [actionId,    setActionId]    = useState(null);
  const [notifiedIds, setNotifiedIds] = useState([]);
  const [toast,       setToast]       = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  // ── Filtered lists ──────────────────────────────────────────────────────────
  const pendingList   = allBorrows.filter(b => b.status === 'pending');
  const activeList    = allBorrows.filter(b => ['borrowing', 'renewed'].includes(b.status));
  const returningList = allBorrows.filter(b => b.status === 'returning');
  const overdueList   = allBorrows.filter(b => b.status === 'overdue');
  const returnedList  = allBorrows.filter(b => b.status === 'returned');
  const cancelledList = allBorrows.filter(b => b.status === 'cancelled');
  const lostList      = allBorrows.filter(b => b.status === 'lost');

  // ── Handlers ───────────────────────────────────────────────────────────────
  const withAction = (id, fn) => async () => {
    setActionId(id);
    try { await fn(); fetchData(); }
    catch (err) { showToast(err.response?.data?.message || 'Action failed', 'error'); }
    finally { setActionId(null); }
  };

  const handleApprove       = (id) => withAction(id, async () => { await borrowService.approveBorrow(id);  showToast('Borrow request approved'); })();
  const handleReject        = (id) => withAction(id, async () => { await borrowService.rejectBorrow(id);   showToast('Borrow request rejected'); })();
  const handleConfirmReturn = (id) => withAction(id, async () => { const r = await borrowService.returnBook(id); showToast(r.data?.message || 'Book returned successfully'); })();
  const handleMarkLost      = (id) => withAction(id, async () => { await borrowService.markLost(id);       showToast('Book marked as lost'); })();
  const handleNotify        = (id) => { setNotifiedIds(p => [...p, id]); showToast('Notification sent to user'); setTimeout(() => setNotifiedIds(p => p.filter(i => i !== id)), 3000); };

  // ── Tab config ──────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'pending',   label: 'Pending',         count: pendingList.length,   color: 'amber'  },
    { id: 'active',    label: 'Active',           count: activeList.length,    color: 'emerald'},
    { id: 'returning', label: 'Return Requests',  count: returningList.length, color: 'teal'  },
    { id: 'overdue',   label: 'Overdue',          count: overdueList.length,   color: 'red'   },
    { id: 'returned',  label: 'Returned',          count: returnedList.length,  color: 'green' },
    { id: 'cancelled', label: 'Cancelled',        count: cancelledList.length, color: 'slate' },
    { id: 'lost',      label: 'Lost',             count: lostList.length,      color: 'orange'},
  ];

  const tabBadgeColor = (color) => ({
    amber:   'bg-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    teal:    'bg-teal-500/20 text-teal-400',
    red:     'bg-red-500/20 text-red-400',
    green:   'bg-green-500/20 text-green-400',
    slate:   'bg-slate-500/20 text-slate-400',
    orange:  'bg-orange-500/20 text-orange-400',
  }[color]);

  // ── Shared table header renderer ────────────────────────────────────────────
  const Th = ({ headers }) => (
    <thead>
      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
        {headers.map(h => (
          <th key={h} className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
        ))}
      </tr>
    </thead>
  );

  return (
    <div className="p-6 space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <div>
        <h1 className="text-slate-900 dark:text-white text-xl font-semibold">Borrowing & Returns Management</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Approve requests, confirm returns, track overdue and lost books
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        {[
          { label: 'Pending',         count: pendingList.length,   icon: Clock,         bg: 'bg-amber-500/10',   color: 'text-amber-400',   border: 'border-amber-500/20'   },
          { label: 'Active',          count: activeList.length,    icon: BookOpen,      bg: 'bg-emerald-500/10', color: 'text-emerald-400', border: 'border-emerald-500/20' },
          { label: 'Return Requests', count: returningList.length, icon: RotateCcw,     bg: 'bg-teal-500/10',    color: 'text-teal-400',    border: 'border-teal-500/20'    },
          { label: 'Overdue',         count: overdueList.length,   icon: AlertTriangle, bg: 'bg-red-500/10',     color: 'text-red-400',     border: 'border-red-500/20'     },
          { label: 'Cancelled',       count: cancelledList.length, icon: XCircle,       bg: 'bg-slate-500/10',   color: 'text-slate-400',   border: 'border-slate-500/20'   },
          { label: 'Returned',        count: returnedList.length,  icon: CheckCircle,   bg: 'bg-green-500/10',   color: 'text-green-400',   border: 'border-green-500/20'   },
          { label: 'Lost',            count: lostList.length,      icon: Package,       bg: 'bg-orange-500/10',  color: 'text-orange-400',  border: 'border-orange-500/20'  },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`bg-white dark:bg-[#111827] rounded-xl border ${s.border} p-3 flex items-center gap-3`}>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                <Icon size={15} className={s.color} />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">{s.label}</p>
                <p className={`text-xl font-semibold ${s.color}`}>{loading ? '—' : s.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="pending">
        <Tabs.List className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <Tabs.Trigger key={tab.id} value={tab.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all
                data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827]
                data-[state=active]:text-slate-900 dark:data-[state=active]:text-white
                data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-slate-400">
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${tabBadgeColor(tab.color)}`}>
                {tab.count}
              </span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* ── Pending ───────────────────────────────────────────────────────── */}
        <Tabs.Content value="pending" className="mt-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-slate-900 dark:text-white font-medium">Pending Approval Requests</h3>
              <p className="text-slate-400 text-xs mt-0.5">Review and approve or reject borrow requests</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <Th headers={['ID', 'User', 'Book', 'Request Date', 'Due Date', 'Actions']} />
                {loading ? <TableSkeleton cols={6} /> : (
                  <tbody>
                    {pendingList.map((item, i) => (
                      <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5"><span className="font-mono text-xs text-amber-400">#{item.id}</span></td>
                        <td className="px-5 py-3.5"><UserCell name={item.user_name} email={item.email} colorIdx={i} /></td>
                        <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm">{item.book_title}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{fmtDate(item.borrow_date)}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{fmtDate(item.due_date)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(item.id)} disabled={actionId === item.id}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs disabled:opacity-50">
                              {actionId === item.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Approve
                            </button>
                            <button onClick={() => handleReject(item.id)} disabled={actionId === item.id}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs disabled:opacity-50">
                              <XCircle size={11} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingList.length === 0 && <EmptyState icon={CheckCircle} color="text-emerald-400" message="All caught up! No pending requests." cols={6} />}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </Tabs.Content>

        {/* ── Active ────────────────────────────────────────────────────────── */}
        <Tabs.Content value="active" className="mt-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-slate-900 dark:text-white font-medium">Currently Borrowed Books</h3>
              <p className="text-slate-400 text-xs mt-0.5">Books that have been approved and are currently with users</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <Th headers={['ID', 'User', 'Book', 'Borrow Date', 'Due Date', 'Days Left', 'Actions']} />
                {loading ? <TableSkeleton cols={7} /> : (
                  <tbody>
                    {activeList.map((item, i) => {
                      const daysLeft = calcDaysLeft(item.due_date);
                      return (
                        <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3.5"><span className="font-mono text-xs text-emerald-400">#{item.id}</span></td>
                          <td className="px-5 py-3.5"><UserCell name={item.user_name} email={item.email} colorIdx={i} /></td>
                          <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm">{item.book_title}</td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{fmtDate(item.borrow_date)}</td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{fmtDate(item.due_date)}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              daysLeft <= 2 ? 'bg-red-500/10 text-red-400'
                              : daysLeft <= 5 ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {daysLeft >= 0 ? `${daysLeft} days` : 'Overdue'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-2">
                              <button onClick={() => handleConfirmReturn(item.id)} disabled={actionId === item.id}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs disabled:opacity-50">
                                {actionId === item.id ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />} Confirm Return
                              </button>
                              <button onClick={() => handleMarkLost(item.id)} disabled={actionId === item.id}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs disabled:opacity-50">
                                <Package size={11} /> Mark Lost
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {activeList.length === 0 && <EmptyState icon={BookOpen} color="text-emerald-400" message="No books are currently borrowed." cols={7} />}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </Tabs.Content>

        {/* ── Return Requests ───────────────────────────────────────────────── */}
        <Tabs.Content value="returning" className="mt-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-teal-500/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-teal-500/10 bg-teal-500/5">
              <h3 className="text-teal-400 font-medium">Return Requests</h3>
              <p className="text-teal-400/70 text-xs mt-0.5">Users have requested to return — confirm or mark as lost</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <Th headers={['ID', 'User', 'Book', 'Borrow Date', 'Due Date', 'Fine', 'Actions']} />
                {loading ? <TableSkeleton cols={7} /> : (
                  <tbody>
                    {returningList.map((item, i) => {
                      const fine = item.fine_amount > 0 ? item.fine_amount : calcFine(item.due_date);
                      return (
                        <tr key={item.id} className="border-b border-teal-500/10 hover:bg-teal-500/5 transition-colors">
                          <td className="px-5 py-3.5"><span className="font-mono text-xs text-teal-400">#{item.id}</span></td>
                          <td className="px-5 py-3.5"><UserCell name={item.user_name} email={item.email} colorIdx={i} /></td>
                          <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm">{item.book_title}</td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{fmtDate(item.borrow_date)}</td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{fmtDate(item.due_date)}</td>
                          <td className="px-5 py-3.5">
                            {fine > 0
                              ? <span className="text-red-400 font-semibold text-sm">{formatMoney(fine)}</span>
                              : <span className="text-slate-400 text-sm">—</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-2">
                              <button onClick={() => handleConfirmReturn(item.id)} disabled={actionId === item.id}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs disabled:opacity-50">
                                {actionId === item.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Confirm Return
                              </button>
                              <button onClick={() => handleMarkLost(item.id)} disabled={actionId === item.id}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs disabled:opacity-50">
                                <Package size={11} /> Mark Lost
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {returningList.length === 0 && <EmptyState icon={RotateCcw} color="text-teal-400" message="No return requests at the moment." cols={7} />}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </Tabs.Content>

        {/* ── Overdue ───────────────────────────────────────────────────────── */}
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
              <p className="text-red-400/70 text-xs mt-0.5">Past due date — confirm return or mark as lost</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <Th headers={['ID', 'User', 'Book', 'Due Date', 'Days Overdue', 'Fine', 'Actions']} />
                {loading ? <TableSkeleton cols={7} /> : (
                  <tbody>
                    {overdueList.map((item, i) => {
                      const notified    = notifiedIds.includes(item.id);
                      const daysOverdue = calcDaysOverdue(item.due_date);
                      const fine        = item.fine_amount > 0 ? item.fine_amount : calcFine(item.due_date);
                      return (
                        <tr key={item.id} className="border-b border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                          <td className="px-5 py-3.5"><span className="font-mono text-xs text-red-400">#{item.id}</span></td>
                          <td className="px-5 py-3.5"><UserCell name={item.user_name} email={item.email} colorIdx={i} /></td>
                          <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm">{item.book_title}</td>
                          <td className="px-5 py-3.5 text-red-400 text-sm">{fmtDate(item.due_date)}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
                              {daysOverdue} days
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-red-400 font-semibold text-sm">{formatMoney(fine)}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => handleConfirmReturn(item.id)} disabled={actionId === item.id}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs disabled:opacity-50">
                                {actionId === item.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Return
                              </button>
                              <button onClick={() => handleMarkLost(item.id)} disabled={actionId === item.id}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs disabled:opacity-50">
                                <Package size={11} /> Mark Lost
                              </button>
                              <button onClick={() => handleNotify(item.id)} disabled={notified}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all ${
                                  notified ? 'bg-slate-500/10 text-slate-400 cursor-not-allowed' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                }`}>
                                <Bell size={11} /> {notified ? 'Sent!' : 'Notify'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {overdueList.length === 0 && <EmptyState icon={CheckCircle} color="text-emerald-400" message="No overdue books!" cols={7} />}
                  </tbody>
                )}
              </table>
            </div>
            {/* [BỎ] total fine footer đã xóa theo yêu cầu */}
          </div>
        </Tabs.Content>

        {/* ── Returned ──────────────────────────────────────────────────────── */}
        <Tabs.Content value="returned" className="mt-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-green-500/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-green-500/10 bg-green-500/5">
              <h3 className="text-green-400 font-medium">Returned Books</h3>
              <p className="text-green-400/70 text-xs mt-0.5">Successfully returned books — full transaction history</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <Th headers={['ID', 'User', 'Book', 'Borrow Date', 'Return Date', 'Fine', 'Handled By']} />
                {loading ? <TableSkeleton cols={7} /> : (
                  <tbody>
                    {returnedList.map((item, i) => (
                      <tr key={item.id} className="border-b border-green-500/10 hover:bg-green-500/5 transition-colors">
                        <td className="px-5 py-3.5"><span className="font-mono text-xs text-green-400">#{item.id}</span></td>
                        <td className="px-5 py-3.5"><UserCell name={item.user_name} email={item.email} colorIdx={i} /></td>
                        <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm">{item.book_title}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{fmtDate(item.borrow_date)}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{fmtDate(item.return_date)}</td>
                        <td className="px-5 py-3.5">
                          {item.fine_amount > 0
                            ? <span className="text-red-400 font-semibold text-sm">{formatMoney(item.fine_amount)}</span>
                            : <span className="text-slate-400 text-sm">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">
                          {item.handled_by_name || '—'}
                        </td>
                      </tr>
                    ))}
                    {returnedList.length === 0 && <EmptyState icon={CheckCircle} color="text-green-400" message="No returned books yet." cols={7} />}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </Tabs.Content>

        {/* ── Cancelled ─────────────────────────────────────────────────────── */}
        <Tabs.Content value="cancelled" className="mt-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-slate-900 dark:text-white font-medium">Cancelled Requests</h3>
              <p className="text-slate-400 text-xs mt-0.5">Borrow requests that were rejected by admin or cancelled</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <Th headers={['ID', 'User', 'Book', 'Request Date', 'Due Date', 'Handled By']} />
                {loading ? <TableSkeleton cols={6} /> : (
                  <tbody>
                    {cancelledList.map((item, i) => (
                      <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5"><span className="font-mono text-xs text-slate-400">#{item.id}</span></td>
                        <td className="px-5 py-3.5"><UserCell name={item.user_name} email={item.email} colorIdx={i} /></td>
                        <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm">{item.book_title}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{fmtDate(item.borrow_date)}</td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{fmtDate(item.due_date)}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-slate-500 dark:text-slate-400 text-sm">
                            {item.handled_by_name || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {cancelledList.length === 0 && <EmptyState icon={XCircle} color="text-slate-400" message="No cancelled requests." cols={6} />}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </Tabs.Content>

        {/* ── Lost ──────────────────────────────────────────────────────────── */}
        <Tabs.Content value="lost" className="mt-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-orange-500/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-orange-500/10 bg-orange-500/5">
              <h3 className="text-orange-400 font-medium">Lost Books</h3>
              <p className="text-orange-400/70 text-xs mt-0.5">Books reported as lost — user is liable for replacement cost</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <Th headers={['ID', 'User', 'Book', 'Borrow Date', 'Due Date', 'Handled By']} />
                {loading ? <TableSkeleton cols={6} /> : (
                  <tbody>
                    {lostList.map((item, i) => {
                      const fine = item.fine_amount > 0 ? item.fine_amount : 0;
                      return (
                        <tr key={item.id} className="border-b border-orange-500/10 bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
                          <td className="px-5 py-3.5"><span className="font-mono text-xs text-orange-400">#{item.id}</span></td>
                          <td className="px-5 py-3.5"><UserCell name={item.user_name} email={item.email} colorIdx={i} /></td>
                          <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm">{item.book_title}</td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{fmtDate(item.borrow_date)}</td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{fmtDate(item.due_date)}</td>
                          <td className="px-5 py-3.5">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">
                              {item.handled_by_name || '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {lostList.length === 0 && <EmptyState icon={Package} color="text-orange-400" message="No lost books recorded." cols={6} />}
                  </tbody>
                )}
              </table>
            </div>
            {!loading && lostList.length > 0 && (
              <div className="px-5 py-3 border-t border-orange-500/10 bg-orange-500/5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Total lost books</span>
                <span className="text-orange-400 font-semibold">{lostList.length} books</span>
              </div>
            )}
          </div>
        </Tabs.Content>

      </Tabs.Root>
    </div>
  );
}