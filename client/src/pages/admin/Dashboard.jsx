/**
 * pages/admin/Dashboard.jsx — TV4
 * Kết nối:
 *   adminService.getStats()           → GET /api/admin/stats
 *   adminService.getTopBooks(5)       → GET /api/admin/reports/top-books
 *   adminService.getBorrowChartData() → GET /api/admin/reports/borrow-chart (cần thêm backend)
 *   borrowService.getAllBorrows()      → GET /api/admin/borrows (pending list)
 */

import { useState, useEffect } from 'react';
import {
  BookOpen, Users, Clock, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Eye, Loader2,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, Sector,
} from 'recharts';
import { getStats, getTopBooks } from '../../services/adminService';
import borrowService from '../../services/borrowService';

// ── Recharts helpers ──────────────────────────────────────────────────────────
const CATEGORY_COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6'];

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#f1f5f9" fontSize={13}>{payload.name}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize={11}>{value.toLocaleString()}</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="#6366f1" fontSize={11}>{(percent * 100).toFixed(1)}%</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={innerRadius - 2} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
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
};

// ── Placeholder chart data (replace với API khi backend có endpoint) ──────────
const PLACEHOLDER_CHART = [
  { month:'T1', borrows:120, returns:90  },
  { month:'T2', borrows:180, returns:150 },
  { month:'T3', borrows:140, returns:110 },
  { month:'T4', borrows:220, returns:180 },
  { month:'T5', borrows:200, returns:160 },
  { month:'T6', borrows:260, returns:220 },
];

export default function Dashboard() {
  const [stats,    setStats]    = useState(null);
  const [topBooks, setTopBooks] = useState([]);
  const [pending,  setPending]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, topRes, borrowsRes] = await Promise.all([
          getStats(),
          getTopBooks(5),
          borrowService.getAllBorrows({ status: 'borrowing', limit: 5 }),
        ]);
        if (statsRes.data.success)   setStats(statsRes.data.data);
        if (topRes.data.success)     setTopBooks(topRes.data.data);
        if (borrowsRes.data.success) setPending(borrowsRes.data.data.slice(0, 5));
      } catch (err) { console.error('Dashboard fetch:', err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleApprove = async (id) => {
    try {
      await borrowService.approveBorrow(id);
      setPending(prev => prev.filter(r => r.id !== id));
    } catch { /* silent */ }
  };

  const handleReject = async (id) => {
    try {
      await borrowService.rejectBorrow(id);
      setPending(prev => prev.filter(r => r.id !== id));
    } catch { /* silent */ }
  };

  // Build pie data từ topBooks
  const pieData = topBooks.map((b, i) => ({
    name:  b.title.length > 15 ? b.title.slice(0, 15) + '…' : b.title,
    value: Number(b.borrow_count) || 1,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const statCards = stats ? [
    { label:'Tổng sách',       value: stats.totalBooks.toLocaleString(),    change:'+234', up:true,  icon:BookOpen,     color:'indigo', bg:'bg-indigo-500/10', iconColor:'text-indigo-400' },
    { label:'Đang mượn',       value: stats.activeBorrows.toLocaleString(), change:'+89',  up:true,  icon:Users,        color:'emerald',bg:'bg-emerald-500/10',iconColor:'text-emerald-400'},
    { label:'User mới tháng',  value: stats.newUsersThisMonth.toLocaleString(), change:'+12', up:true, icon:Clock,     color:'amber',  bg:'bg-amber-500/10',  iconColor:'text-amber-400'  },
    { label:'Tiền phạt chưa thu', value:`${Number(stats.unpaidFine||0).toLocaleString()}đ`, change:'', up:false, icon:TrendingDown, color:'red', bg:'bg-red-500/10', iconColor:'text-red-400' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Tổng quan hệ thống thư viện</p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          System Online
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">{s.label}</p>
                  <p className="text-slate-900 dark:text-white text-2xl mt-1.5 font-semibold">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon size={20} className={s.iconColor} />
                </div>
              </div>
              {s.change && (
                <div className="flex items-center gap-1.5 mt-3">
                  {s.up ? <TrendingUp size={13} className="text-emerald-400" /> : <TrendingDown size={13} className="text-red-400" />}
                  <span className={`text-xs ${s.up ? 'text-emerald-400' : 'text-red-400'}`}>{s.change} this week</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Line chart */}
        <div className="xl:col-span-3 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-slate-900 dark:text-white">Xu hướng mượn sách</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Lượt mượn vs trả theo tháng</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={PLACEHOLDER_CHART} margin={{ top:5, right:10, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:'11px', color:'#94a3b8' }} />
              <Line type="monotone" dataKey="borrows" name="Mượn" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r:4, fill:'#6366f1' }} />
              <Line type="monotone" dataKey="returns" name="Trả"  stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r:4, fill:'#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 mt-2 text-center">Dữ liệu mẫu — tích hợp API /admin/reports/borrow-chart sau</p>
        </div>

        {/* Pie chart: top books */}
        <div className="xl:col-span-2 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="mb-4">
            <h3 className="text-slate-900 dark:text-white">Top sách nổi bật</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Theo lượt mượn</p>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={70}
                    dataKey="value"
                    onMouseEnter={(_, i) => setActiveIndex(i)}
                  >
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 gap-1 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-400 text-xs truncate">{d.name}</span>
                    <span className="text-slate-500 text-xs ml-auto">{d.value} lượt</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Pending requests */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-slate-900 dark:text-white">Yêu cầu mượn gần đây</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{pending.length} lượt đang mượn</p>
          </div>
          <a href="/admin/borrows" className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1">
            <Eye size={13} /> Xem tất cả
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['ID', 'Người mượn', 'Sách', 'Ngày mượn', 'Hạn trả', 'Thao tác'].map(h => (
                  <th key={h} className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">Không có dữ liệu</td></tr>
              ) : (
                pending.map((req) => (
                  <tr key={req.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-indigo-400">#{req.id}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {(req.user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-700 dark:text-slate-200 text-sm">{req.user_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 text-sm">{req.book_title || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">
                      {req.borrow_date ? new Date(req.borrow_date).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-sm">
                      {req.due_date ? new Date(req.due_date).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleApprove(req.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs transition-colors">
                          <CheckCircle size={12} /> Duyệt
                        </button>
                        <button onClick={() => handleReject(req.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-colors">
                          <XCircle size={12} /> Từ chối
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