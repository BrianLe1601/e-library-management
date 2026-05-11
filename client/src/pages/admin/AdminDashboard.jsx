import { useState, useEffect } from "react";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

import StatsCard from "../../components/admin/StatsCard";
import { getStats, getBorrowChartData, getCategoryChartData } from "../../services/adminService";

// ─── Màu cho PieChart ───────────────────────────────────────
const PIE_COLORS = ["#2e75b6", "#1abc9c", "#e67e22", "#9b59b6", "#e74c3c", "#f39c12"];

// ─── Format tháng hiển thị trên trục X ──────────────────────
const formatMonth = (value) => `T${value}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium text-gray-700 mb-1">Tháng {label}</p>
          {payload.map((entry) => (
            <p key={entry.name} style={{ color: entry.color }}>
              {entry.name}: <strong>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

export default function AdminDashboard() {
  // State cho số liệu thống kê
  const [stats, setStats] = useState(null);
  const [borrowData, setBorrowData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);

        // Gọi 3 API cùng lúc cho nhanh (Promise.all)
        const [statsRes, borrowRes, categoryRes] = await Promise.all([
          getStats(),
          getBorrowChartData(),
          getCategoryChartData(),
        ]);

        setStats(statsRes.data);
        setBorrowData(borrowRes.data);
        setCategoryData(categoryRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // ── Custom Tooltip cho Recharts ──────────────────────────


  // ── Error state ──────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Tiêu đề trang ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tổng quan hệ thống E-Library
        </p>
      </div>

      {/* ── 4 Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Tổng số sách"
          value={stats?.totalBooks}
          icon="📚"
          color="blue"
          subtitle={`${stats?.totalBookCopies || 0} bản sách`}
          loading={loading}
        />
        <StatsCard
          title="Tổng thành viên"
          value={stats?.totalUsers}
          icon="👥"
          color="green"
          subtitle={`${stats?.newUsersThisMonth || 0} mới tháng này`}
          loading={loading}
        />
        <StatsCard
          title="Đang mượn"
          value={stats?.activeBorrows}
          icon="🔄"
          color="orange"
          subtitle={`${stats?.borrowsToday || 0} lượt hôm nay`}
          loading={loading}
        />
        <StatsCard
          title="Quá hạn"
          value={stats?.overdueBorrows}
          icon="⚠️"
          color="red"
          subtitle="Cần xử lý"
          loading={loading}
        />
      </div>

      {/* ── 2 Charts hàng trên ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Line Chart — lượt mượn theo tháng (chiếm 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            📈 Lượt mượn sách theo tháng
          </h2>
          {loading ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={borrowData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="borrows"
                  name="Lượt mượn"
                  stroke="#2e75b6"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="returned"
                  name="Đã trả"
                  stroke="#1abc9c"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart — phân bố thể loại (chiếm 1/3) */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            🍕 Phân bố thể loại sách
          </h2>
          {loading ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} sách`, name]} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend tự vẽ cho đẹp */}
              <div className="space-y-1 mt-2">
                {categoryData.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-gray-600 truncate max-w-[100px]">{item.name}</span>
                    </div>
                    <span className="text-gray-500 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bar Chart — Top sách mượn nhiều ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          🏆 Top 5 sách được mượn nhiều nhất
        </h2>
        {loading ? (
          <div className="h-48 bg-gray-100 rounded animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={stats?.topBooks || []}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis
                dataKey="title"
                type="category"
                width={140}
                tick={{ fontSize: 11, fill: "#374151" }}
                tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + "…" : v}
              />
              <Tooltip
                formatter={(value) => [`${value} lượt`, "Lượt mượn"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="borrow_count" name="Lượt mượn" fill="#2e75b6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}