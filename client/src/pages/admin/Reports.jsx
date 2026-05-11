import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Calendar, Filter, TrendingUp, BookOpen, Users, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const reportData = [
  { month: 'Jan 2026', totalBorrows: 240, returns: 180, newUsers: 34, finesCollected: 45 },
  { month: 'Feb 2026', totalBorrows: 300, returns: 250, newUsers: 41, finesCollected: 62 },
  { month: 'Mar 2026', totalBorrows: 280, returns: 220, newUsers: 28, finesCollected: 38 },
  { month: 'Apr 2026', totalBorrows: 420, returns: 350, newUsers: 57, finesCollected: 91 },
  { month: 'May 2026', totalBorrows: 380, returns: 310, newUsers: 49, finesCollected: 74 },
];

const categoryReport = [
  { category: 'Fiction', borrowed: 1420, returned: 1280, overdue: 45 },
  { category: 'Science', borrowed: 820, returned: 790, overdue: 12 },
  { category: 'Technology', borrowed: 960, returned: 890, overdue: 28 },
  { category: 'History', borrowed: 640, returned: 590, overdue: 18 },
  { category: 'Philosophy', borrowed: 310, returned: 290, overdue: 8 },
  { category: 'Sci-Fi', borrowed: 580, returned: 520, overdue: 22 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-slate-300 text-xs mb-2">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-05-10');
  const [category, setCategory] = useState('All');
  const [exporting, setExporting] = useState(null);

  // Giả sử bạn có dữ liệu reportData và categoryReport được import từ file khác
  const totalBorrows = reportData.reduce((s, r) => s + r.totalBorrows, 0);
  const totalReturns = reportData.reduce((s, r) => s + r.returns, 0);
  const totalNewUsers = reportData.reduce((s, r) => s + r.newUsers, 0);
  const totalFines = reportData.reduce((s, r) => s + r.finesCollected, 0);

  const handleExport = (type) => {
    setExporting(type);
    setTimeout(() => setExporting(null), 2000);
  };

  const filteredCategory =
    category === 'All'
      ? categoryReport
      : categoryReport.filter((c) => c.category === category);
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Generate and export detailed library reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
              exporting === 'pdf'
                ? 'bg-red-500/20 text-red-400 cursor-wait'
                : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
            }`}
          >
            <FileText size={15} />
            {exporting === 'pdf' ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
              exporting === 'excel'
                ? 'bg-emerald-500/20 text-emerald-400 cursor-wait'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <FileSpreadsheet size={15} />
            {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-slate-400" />
          <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">Report Filters</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <span className="text-slate-400 text-sm">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="All">All Categories</option>
            {categoryReport.map(c => <option key={c.category}>{c.category}</option>)}
          </select>
          <button className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Borrows', value: totalBorrows.toLocaleString(), icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Total Returns', value: totalReturns.toLocaleString(), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'New Users', value: totalNewUsers.toLocaleString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Fines Collected', value: `$${totalFines}`, icon: BarChart2, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <Icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">{s.label}</p>
                <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bar Chart */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="mb-4">
          <h3 className="text-slate-900 dark:text-white">Monthly Activity Overview</h3>
          <p className="text-slate-400 text-xs mt-0.5">Borrows, returns and new user registrations</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={reportData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Bar dataKey="totalBorrows" name="Borrows" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="returns" name="Returns" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="newUsers" name="New Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Summary Table */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-slate-900 dark:text-white">Category Performance</h3>
            <p className="text-slate-400 text-xs mt-0.5">Summary by book category</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('pdf')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-colors">
              <Download size={12} /> PDF
            </button>
            <button onClick={() => handleExport('excel')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs transition-colors">
              <Download size={12} /> Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Category</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Total Borrowed</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Total Returned</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Overdue</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Return Rate</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Performance</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategory.map(row => {
                const returnRate = ((row.returned / row.borrowed) * 100).toFixed(1);
                const rate = parseFloat(returnRate);
                return (
                  <tr key={row.category} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs">{row.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm">{row.borrowed.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm">{row.returned.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-medium ${row.overdue > 20 ? 'text-red-400' : row.overdue > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {row.overdue}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-medium ${rate >= 90 ? 'text-emerald-400' : rate >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                        {returnRate}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700">
                          <div
                            className={`h-1.5 rounded-full ${rate >= 90 ? 'bg-emerald-500' : rate >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <p className="text-xs text-slate-400">
            Report generated for period: <span className="text-slate-600 dark:text-slate-300">{dateFrom} — {dateTo}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
