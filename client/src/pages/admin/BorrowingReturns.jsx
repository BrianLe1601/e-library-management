import React, { useState } from 'react';
import { CheckCircle, Bell, Clock, AlertTriangle, BookOpen, RotateCcw, Filter } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';

const pendingBorrows = [
  { id: 'BRW-001', user: 'Alice Johnson', book: 'Dune', category: 'Sci-Fi', requestDate: '2026-05-10', dueDate: '2026-05-24', avatar: 'AJ' },
  { id: 'BRW-002', user: 'Bob Martinez', book: 'Clean Code', category: 'Technology', requestDate: '2026-05-10', dueDate: '2026-05-24', avatar: 'BM' },
  { id: 'BRW-003', user: 'Chloe Davis', book: 'Sapiens', category: 'History', requestDate: '2026-05-09', dueDate: '2026-05-23', avatar: 'CD' },
  { id: 'BRW-004', user: 'David Kim', book: '1984', category: 'Fiction', requestDate: '2026-05-09', dueDate: '2026-05-23', avatar: 'DK' },
  { id: 'BRW-005', user: 'Emma Wilson', book: 'A Brief History of Time', category: 'Science', requestDate: '2026-05-08', dueDate: '2026-05-22', avatar: 'EW' },
];

const activeBorrows = [
  { id: 'ACT-001', user: 'Frank Lee', book: 'The Great Gatsby', category: 'Fiction', borrowDate: '2026-04-25', dueDate: '2026-05-16', daysLeft: 6, avatar: 'FL' },
  { id: 'ACT-002', user: 'Grace Nguyen', book: 'The Art of War', category: 'History', borrowDate: '2026-04-28', dueDate: '2026-05-19', daysLeft: 9, avatar: 'GN' },
  { id: 'ACT-003', user: 'Henry Brown', book: 'To Kill a Mockingbird', category: 'Fiction', borrowDate: '2026-05-01', dueDate: '2026-05-22', daysLeft: 12, avatar: 'HB' },
  { id: 'ACT-004', user: 'Iris Chen', book: 'Philosophy of Mind', category: 'Philosophy', borrowDate: '2026-05-03', dueDate: '2026-05-24', daysLeft: 14, avatar: 'IC' },
  { id: 'ACT-005', user: 'Jack Smith', book: 'Cosmos', category: 'Science', borrowDate: '2026-04-20', dueDate: '2026-05-11', daysLeft: 1, avatar: 'JS' },
];

const overdueBooks = [
  { id: 'OVD-001', user: 'Kevin Park', book: 'The Alchemist', category: 'Fiction', borrowDate: '2026-04-01', dueDate: '2026-04-22', daysOverdue: 18, finePerDay: 0.5, avatar: 'KP' },
  { id: 'OVD-002', user: 'Linda Torres', book: 'Brave New World', category: 'Fiction', borrowDate: '2026-03-28', dueDate: '2026-04-18', daysOverdue: 22, finePerDay: 0.5, avatar: 'LT' },
  { id: 'OVD-003', user: 'Mike Johnson', book: 'Quantum Physics', category: 'Science', borrowDate: '2026-04-05', dueDate: '2026-04-26', daysOverdue: 14, finePerDay: 0.75, avatar: 'MJ' },
  { id: 'OVD-004', user: 'Nora Kim', book: 'The Republic', category: 'Philosophy', borrowDate: '2026-03-20', dueDate: '2026-04-10', daysOverdue: 30, finePerDay: 0.5, avatar: 'NK' },
  { id: 'OVD-005', user: 'Oscar Lee', book: 'Data Structures', category: 'Technology', borrowDate: '2026-04-08', dueDate: '2026-04-29', daysOverdue: 11, finePerDay: 0.75, avatar: 'OL' },
];

const avatarColors = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-blue-500 to-cyan-600',
];

export default function BorrowingReturns() {
  const [pendingList, setPendingList] = useState(pendingBorrows);
  const [activeList, setActiveList] = useState(activeBorrows);
  const [overdueList, setOverdueList] = useState(overdueBooks);
  const [notifiedIds, setNotifiedIds] = useState([]);

  const handleApprove = (id) => {
    const item = pendingList.find(p => p.id === id);
    if (item) {
      setPendingList(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleReject = (id) => {
    setPendingList(prev => prev.filter(p => p.id !== id));
  };

  const handleConfirmReturn = (id, list) => {
    if (list === 'active') setActiveList(prev => prev.filter(a => a.id !== id));
    else setOverdueList(prev => prev.filter(o => o.id !== id));
  };

  const handleNotify = (id) => {
    setNotifiedIds(prev => [...prev, id]);
    setTimeout(() => setNotifiedIds(prev => prev.filter(i => i !== id)), 3000);
  };

  const tabs = [
    { id: 'pending', label: 'Pending Approval', count: pendingList.length, color: 'amber' },
    { id: 'active', label: 'Active Borrows', count: activeList.length, color: 'emerald' },
    { id: 'overdue', label: 'Overdue', count: overdueList.length, color: 'red' },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 dark:text-white">Borrowing & Returns</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage all borrow requests and track returns</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: pendingList.length, icon: Clock, bg: 'bg-amber-500/10', color: 'text-amber-400', border: 'border-amber-500/20' },
          { label: 'Active Borrows', count: activeList.length, icon: BookOpen, bg: 'bg-emerald-500/10', color: 'text-emerald-400', border: 'border-emerald-500/20' },
          { label: 'Overdue', count: overdueList.length, icon: AlertTriangle, bg: 'bg-red-500/10', color: 'text-red-400', border: 'border-red-500/20' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`bg-white dark:bg-[#111827] rounded-xl border ${s.border} p-4 flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">{s.label}</p>
                <p className={`text-2xl font-semibold ${s.color}`}>{s.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="pending">
        <Tabs.List className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit">
          {tabs.map(tab => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-slate-400`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                tab.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                tab.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {tab.count}
              </span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Pending Approval */}
        <Tabs.Content value="pending" className="mt-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-slate-900 dark:text-white">Pending Approval Requests</h3>
              <p className="text-slate-400 text-xs mt-0.5">Review and approve or reject borrow requests</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Request ID</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">User</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Book</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Requested</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Due Date</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((item, i) => (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-amber-400">{item.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                            {item.avatar}
                          </div>
                          <span className="text-slate-700 dark:text-slate-200 text-sm">{item.user}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-700 dark:text-slate-200 text-sm">{item.book}</p>
                        <p className="text-slate-400 text-xs">{item.category}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{item.requestDate}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{item.dueDate}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(item.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs">
                            <CheckCircle size={11} /> Approve
                          </button>
                          <button onClick={() => handleReject(item.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs">
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                        <p className="text-slate-400 text-sm">All caught up! No pending requests.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Tabs.Content>

        {/* Active Borrows */}
        <Tabs.Content value="active" className="mt-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-slate-900 dark:text-white">Active Borrows</h3>
              <p className="text-slate-400 text-xs mt-0.5">Currently borrowed books awaiting return</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Borrow ID</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">User</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Book</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Borrowed</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Due Date</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Days Left</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeList.map((item, i) => (
                    <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-emerald-400">{item.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                            {item.avatar}
                          </div>
                          <span className="text-slate-700 dark:text-slate-200 text-sm">{item.user}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-700 dark:text-slate-200 text-sm">{item.book}</p>
                        <p className="text-slate-400 text-xs">{item.category}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{item.borrowDate}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{item.dueDate}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          item.daysLeft <= 2
                            ? 'bg-red-500/10 text-red-400'
                            : item.daysLeft <= 5
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {item.daysLeft}d left
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => handleConfirmReturn(item.id, 'active')} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs">
                          <RotateCcw size={11} /> Confirm Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Tabs.Content>

        {/* Overdue */}
        <Tabs.Content value="overdue" className="mt-4">
          <div className="mb-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 w-fit">
            <AlertTriangle size={14} className="text-red-400" />
            <p className="text-red-400 text-xs">{overdueList.length} books are overdue — fines are accumulating daily</p>
          </div>
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-red-500/20 overflow-hidden">
            <div className="px-5 py-4 border-b border-red-500/10 bg-red-500/5">
              <h3 className="text-red-400">Overdue Records</h3>
              <p className="text-red-400/70 text-xs mt-0.5">These books are past their due date with accumulated fines</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-red-500/5">
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Borrow ID</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">User</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Book</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Due Date</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Days Overdue</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Calculated Fine</th>
                    <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueList.map((item, i) => {
                    const fine = (item.daysOverdue * item.finePerDay).toFixed(2);
                    const notified = notifiedIds.includes(item.id);
                    return (
                      <tr key={item.id} className="border-b border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs text-red-400">{item.id}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                              {item.avatar}
                            </div>
                            <span className="text-slate-700 dark:text-slate-200 text-sm">{item.user}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-slate-700 dark:text-slate-200 text-sm">{item.book}</p>
                          <p className="text-slate-400 text-xs">{item.category}</p>
                        </td>
                        <td className="px-5 py-3.5 text-red-400 text-sm">{item.dueDate}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
                            {item.daysOverdue} days
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-red-400 font-semibold text-sm">${fine}</span>
                          <span className="text-slate-400 text-xs ml-1">(${item.finePerDay}/day)</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConfirmReturn(item.id, 'overdue')}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs"
                            >
                              <CheckCircle size={11} /> Return
                            </button>
                            <button
                              onClick={() => handleNotify(item.id)}
                              disabled={notified}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all ${
                                notified
                                  ? 'bg-slate-500/10 text-slate-400 cursor-not-allowed'
                                  : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                              }`}
                            >
                              <Bell size={11} /> {notified ? 'Sent!' : 'Notify'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {overdueList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                        <p className="text-slate-400 text-sm">No overdue books!</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {overdueList.length > 0 && (
              <div className="px-5 py-3 border-t border-red-500/10 bg-red-500/5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Total collected fines</span>
                <span className="text-red-400 font-semibold">
                  ${overdueList.reduce((sum, i) => sum + i.daysOverdue * i.finePerDay, 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
