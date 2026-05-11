/**
 * StatsCard — Hiển thị một số liệu thống kê trên Dashboard
 *
 * Props:
 *  - title   : string  — Tên chỉ số (vd: "Tổng sách")
 *  - value   : number  — Giá trị (vd: 120)
 *  - icon    : string  — Emoji icon (vd: "📚")
 *  - color   : string  — "blue" | "green" | "orange" | "red"
 *  - subtitle: string  — Dòng phụ nhỏ phía dưới (tùy chọn, vd: "+5 hôm nay")
 *  - loading : boolean — Hiện skeleton khi đang fetch data
 *
 * Cách dùng:
 *  <StatsCard title="Tổng sách" value={120} icon="📚" color="blue" subtitle="+3 hôm nay" />
 */

const COLOR_MAP = {
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",  icon: "bg-blue-100",   text: "text-blue-700",   value: "text-blue-800"  },
  green:  { bg: "bg-green-50",  border: "border-green-200", icon: "bg-green-100",  text: "text-green-700",  value: "text-green-800" },
  orange: { bg: "bg-orange-50", border: "border-orange-200",icon: "bg-orange-100", text: "text-orange-700", value: "text-orange-800"},
  red:    { bg: "bg-red-50",    border: "border-red-200",   icon: "bg-red-100",    text: "text-red-700",    value: "text-red-800"   },
  purple: { bg: "bg-purple-50", border: "border-purple-200",icon: "bg-purple-100", text: "text-purple-700", value: "text-purple-800"},
};

export default function StatsCard({ title, value, icon, color = "blue", subtitle, loading = false }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;

  // Skeleton loading
  if (loading) {
    return (
      <div className={`rounded-xl border ${c.border} ${c.bg} p-5 animate-pulse`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm font-medium ${c.text}`}>{title}</p>
        <div className={`w-10 h-10 rounded-lg ${c.icon} flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold ${c.value}`}>
        {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
      </p>
      {subtitle && (
        <p className={`text-xs mt-1 ${c.text} opacity-75`}>{subtitle}</p>
      )}
    </div>
  );
}