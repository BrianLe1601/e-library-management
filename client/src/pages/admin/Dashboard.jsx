/**
 * pages/admin/Dashboard.jsx
 * Kết nối:
 *   GET /api/admin/stats
 *   GET /api/admin/stats/top-books?limit=5
 *   GET /api/admin/stats/borrow-chart?year=2026
 *   GET /api/admin/borrows?status=pending&limit=5
 */

import { useState, useEffect } from 'react';
import {
  BookOpen, Users, Clock, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, XCircle, Eye, Loader2,
  RotateCcw, Package,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, Sector,
} from 'recharts';
import adminService  from '../../services/adminService';
import borrowService from '../../services/borrowService';

// ── Colors ────────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6'];

// ── Recharts custom components ────────────────────────────────────────────────
const renderActiveShape = ({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value }) => (
  <g>
    <text x={cx} y={cy - 10} textAnchor="middle" fill="#f1f5f9" fontSize={13}>{payload.name}</text>
    <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize={11}>{value.toLocaleString()}</text>
    <text x={cx} y={cy + 28} textAnchor="middle" fill="#6366f1" fontSize={11}>{(percent*100).toFixed(1)}%</text>
    <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius+8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    <Sector cx={cx} cy={cy} innerRadius={innerRadius-4} outerRadius={innerRadius-2} startAngle={startAngle} endAngle={endAngle} fill={fill} />
  </g>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-300 mb-2">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }}>{e.name}: <span className="font-semibold">{e.value}</span></p>
      ))}
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ className }) => <div className={`bg-slate-200 dark:bg-slate-700 rounded animate-pulse ${className}`} />;

// ── Avatar initials ───────────────────────────────────────────────────────────
const Avatar = ({ name = '' }) => {
  const initials = name.trim().split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
      {initials || 'U'}
    </div>
  );
};

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:   { label: 'Pending',   cls: 'bg-amber-500/10 text-amber-400'   },
  borrowing: { label: 'Borrowing', cls: 'bg-blue-500/10 text-blue-400'     },
  renewed:   { label: 'Renewed',   cls: 'bg-purple-500/10 text-purple-400' },
  overdue:   { label: 'Overdue',   cls: 'bg-red-500/10 text-red-400'       },
  returning: { label: 'Returning', cls: 'bg-teal-500/10 text-teal-400'     },
  returned:  { label: 'Returned',  cls: 'bg-green-500/10 text-green-400'   },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-500/10 text-slate-400'   },
  lost:      { label: 'Lost',      cls: 'bg-orange-500/10 text-orange-400' },
};
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>;
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats,       setStats]       = useState(null);
  const [topBooks,    setTopBooks]    = useState([]);
  const [chart,       setChart]       = useState([]);
  const [recentBorrows, setRecentBorrows] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [actionId,    setActionId]    = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const year = new Date().getFullYear();
        const [statsRes, topRes, chartRes, borrowsRes] = await Promise.all([
          adminService.getStats(),
          adminService.getTopBooks(5),
          adminService.getBorrowChart(year),
          borrowService.getAllBorrows({ limit: 6 }),
        ]);
        if (statsRes.data.success)   setStats(statsRes.data.data);
        if (topRes.data.success)     setTopBooks(topRes.data.data || []);
        if (chartRes.data.success)   setChart(chartRes.data.data || []);
        if (borrowsRes.data.success) setRecentBorrows(borrowsRes.data.data || []);
      } catch (err) {
        console.error('[Dashboard]', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await borrowService.approveBorrow(id);
      setRecentBorrows(prev => prev.map(r => r.id === id ? { ...r, status: 'borrowing' } : r));
    } catch (err) {
      console.error(err);
    } finally { setActionId(null); }
  };

  const handleReject = async (id) => {
    setActionId(id);
    try {
      await borrowService.rejectBorrow(id);
      setRecentBorrows(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    } catch (err) {
      console.error(err);
    } finally { setActionId(null); }
  };

  // ── Stat cards config ────────────────────────────────────────────────────────
  const statCards = stats ? [
    {
      label: 'Total Books',
      value: stats.totalBooks?.toLocaleString() ?? '—',
      sub:   `${stats.totalUsers?.toLocaleString()} users`,
      icon:  BookOpen, bg: 'bg-indigo-500/10', color: 'text-indigo-400', border: 'border-indigo-500/20',
    },
    {
      label: 'Active Borrows',
      value: stats.activeBorrows?.toLocaleString() ?? '—',
      sub:   `${stats.pendingBorrows ?? 0} pending approval`,
      icon:  Users, bg: 'bg-emerald-500/10', color: 'text-emerald-400', border: 'border-emerald-500/20',
    },
    {
      label: 'Overdue',
      value: stats.overdueBorrows?.toLocaleString() ?? '—',
      sub:   'Needs attention',
      icon:  AlertTriangle, bg: 'bg-red-500/10', color: 'text-red-400', border: 'border-red-500/20',
    },
    {
      label: 'Unpaid Fines',
      value: stats.unpaidFine > 0
        ? new Intl.NumberFormat('vi-VN').format(stats.unpaidFine) + 'đ'
        : '—',
      sub:   'Total outstanding',
      icon:  TrendingDown, bg: 'bg-amber-500/10', color: 'text-amber-400', border: 'border-amber-500/20',
    },
  ] : [];

  const pieData = topBooks.map((b, i) => ({
    name:  b.title.length > 14 ? b.title.slice(0, 14) + '…' : b.title,
    value: Number(b.borrow_count) || 0,
    color: PIE_COLORS[i % PIE_COLORS.length],
    cover: b.cover_url,
  }));

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-white text-xl font-semibold">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Library system overview</p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          System Online
        </span>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? [...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1"><Sk className="h-3 w-24 mb-3" /><Sk className="h-7 w-16" /></div>
              <Sk className="w-10 h-10 rounded-xl" />
            </div>
            <Sk className="h-3 w-32 mt-3" />
          </div>
        )) : statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`bg-white dark:bg-[#111827] rounded-xl border ${s.border} p-5 hover:shadow-sm transition-all`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1.5 ${s.color}`}>{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={20} className={s.color} />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Line chart — borrow trend */}
        <div className="xl:col-span-3 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="mb-5">
            <h3 className="text-slate-900 dark:text-white font-semibold">Borrow Trend</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Monthly borrows vs returns — {new Date().getFullYear()}</p>
          </div>
          {loading ? <Sk className="h-52 w-full rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chart} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize:'11px', color:'#94a3b8' }} />
                <Line type="monotone" dataKey="borrows" name="Borrows" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r:4 }} />
                <Line type="monotone" dataKey="returns" name="Returns" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r:4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart — top books */}
        <div className="xl:col-span-2 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="mb-4">
            <h3 className="text-slate-900 dark:text-white font-semibold">Top Borrowed Books</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Most popular titles</p>
          </div>
          {loading ? <Sk className="h-52 w-full rounded-xl" /> : pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie activeIndex={activeIdx} activeShape={renderActiveShape}
                    data={pieData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={70} dataKey="value"
                    onMouseEnter={(_, i) => setActiveIdx(i)}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-400 dark:text-slate-500 text-xs truncate flex-1">{d.name}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* ── Recent borrows table ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold">Recent history</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Latest activity across all users</p>
          </div>
          <a href="/admin/borrowing"
            className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 font-medium transition-colors">
            <Eye size={13} /> View all
          </a>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Sk className="w-7 h-7 rounded-full shrink-0" />
                <div className="flex-1"><Sk className="h-3 w-1/2 mb-1.5" /><Sk className="h-3 w-1/3" /></div>
                <Sk className="h-6 w-20 rounded-full" />
                <Sk className="h-6 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        ) : recentBorrows.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No borrow records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  {['ID', 'User', 'Book', 'Borrow Date', 'Due Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBorrows.map(req => {
                  const isPending  = req.status === 'pending';
                  const isActing   = actionId === req.id;
                  return (
                    <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-indigo-400">#{req.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={req.user_name} />
                          <span className="text-slate-700 dark:text-slate-200 text-sm">{req.user_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 text-sm max-w-[160px] truncate">
                        {req.book_title || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">
                        {req.borrow_date ? new Date(req.borrow_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">
                        {req.due_date ? new Date(req.due_date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleApprove(req.id)} disabled={isActing}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs disabled:opacity-50">
                              {isActing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />} Approve
                            </button>
                            <button onClick={() => handleReject(req.id)} disabled={isActing}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs disabled:opacity-50">
                              <XCircle size={11} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}