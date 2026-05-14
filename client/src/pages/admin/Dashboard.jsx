import React, { useState } from 'react';
import {
  BookOpen, Users, Clock, TrendingUp, TrendingDown, CheckCircle, XCircle, Eye,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, Sector,
} from 'recharts';

const borrowingTrend = [
  { month: 'Jan', borrows: 240, returns: 180 },
  { month: 'Feb', borrows: 300, returns: 250 },
  { month: 'Mar', borrows: 280, returns: 220 },
  { month: 'Apr', borrows: 420, returns: 350 },
  { month: 'May', borrows: 380, returns: 310 },
  { month: 'Jun', borrows: 460, returns: 400 },
  { month: 'Jul', borrows: 350, returns: 290 },
  { month: 'Aug', borrows: 410, returns: 340 },
  { month: 'Sep', borrows: 490, returns: 420 },
  { month: 'Oct', borrows: 520, returns: 460 },
  { month: 'Nov', borrows: 480, returns: 410 },
  { month: 'Dec', borrows: 390, returns: 330 },
];

const categoryData = [
  { name: 'Fiction', value: 3420, color: '#6366f1' },
  { name: 'Science', value: 2180, color: '#10b981' },
  { name: 'History', value: 1560, color: '#f59e0b' },
  { name: 'Technology', value: 2840, color: '#3b82f6' },
  { name: 'Literature', value: 1290, color: '#ec4899' },
  { name: 'Philosophy', value: 1557, color: '#8b5cf6' },
];

const recentRequests = [
  { id: 'REQ-001', user: 'Alice Johnson', book: 'Dune', category: 'Sci-Fi', date: '2026-05-10', status: 'pending' },
  { id: 'REQ-002', user: 'Bob Martinez', book: 'Clean Code', category: 'Technology', date: '2026-05-10', status: 'pending' },
  { id: 'REQ-003', user: 'Chloe Davis', book: 'Sapiens', category: 'History', date: '2026-05-09', status: 'pending' },
  { id: 'REQ-004', user: 'David Kim', book: '1984', category: 'Fiction', date: '2026-05-09', status: 'pending' },
  { id: 'REQ-005', user: 'Emma Wilson', book: 'A Brief History of Time', category: 'Science', date: '2026-05-08', status: 'pending' },
];

const stats = [
  {
    label: 'Total Books', value: '12,847', change: '+234', up: true,
    icon: BookOpen, color: 'indigo', bg: 'bg-indigo-500/10', iconColor: 'text-indigo-400',
    border: 'border-indigo-500/20',
  },
  {
    label: 'Active Borrows', value: '1,234', change: '+89', up: true,
    icon: Users, color: 'emerald', bg: 'bg-emerald-500/10', iconColor: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  {
    label: 'Pending Requests', value: '47', change: '+12', up: false,
    icon: Clock, color: 'amber', bg: 'bg-amber-500/10', iconColor: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  {
    label: 'Overdue Books', value: '28', change: '-5', up: true,
    icon: TrendingDown, color: 'red', bg: 'bg-red-500/10', iconColor: 'text-red-400',
    border: 'border-red-500/20',
  },
];

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#f1f5f9" className="text-sm">
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" className="text-xs">
        {value.toLocaleString()}
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#6366f1" className="text-xs">
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={innerRadius - 2}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

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

export default function Dashboard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [requestList, setRequestList] = useState(recentRequests);

  const handleApprove = (id) => {
    setRequestList(prev => prev.filter(r => r.id !== id));
  };

  const handleReject = (id) => {
    setRequestList(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            System Online
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-500/30 transition-all duration-200`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">{stat.label}</p>
                  <p className="text-slate-900 dark:text-white text-2xl mt-1.5 font-semibold">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon size={20} className={stat.iconColor} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                {stat.up ? (
                  <TrendingUp size={13} className="text-emerald-400" />
                ) : (
                  <TrendingDown size={13} className="text-red-400" />
                )}
                <span className={`text-xs ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.change} this week
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Borrowing Trends */}
        <div className="xl:col-span-3 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-slate-900 dark:text-white">Borrowing Trends</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Monthly borrows vs returns — 2026</p>
            </div>
            <select className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={borrowingTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Line type="monotone" dataKey="borrows" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
              <Line type="monotone" dataKey="returns" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Books by Category */}
        <div className="xl:col-span-2 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="mb-4">
            <h3 className="text-slate-900 dark:text-white">Books by Category</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Distribution across genres</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                <span className="text-slate-500 dark:text-slate-400 text-xs truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-slate-900 dark:text-white">Recent Borrow Requests</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{requestList.length} pending approval</p>
          </div>
          <button className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1">
            <Eye size={13} /> View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Request ID</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">User</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Book</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Category</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requestList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
                    No pending requests
                  </td>
                </tr>
              ) : (
                requestList.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-indigo-400">{req.id}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {req.user.charAt(0)}
                        </div>
                        <span className="text-slate-700 dark:text-slate-200 text-sm">{req.user}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 text-sm">{req.book}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs">{req.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">{req.date}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs transition-colors"
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-colors"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
