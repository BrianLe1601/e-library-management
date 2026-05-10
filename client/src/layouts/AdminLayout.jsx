import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

// Icon component đơn giản dùng emoji — sau này thay bằng lucide-react nếu muốn
const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard",      icon: "📊" },
  { path: "/admin/books",     label: "Quản lý sách",   icon: "📚" },
  { path: "/admin/borrows",   label: "Quản lý mượn",   icon: "🔄" },
  { path: "/admin/users",     label: "Quản lý user",   icon: "👥" },
  { path: "/admin/reports",   label: "Báo cáo",        icon: "📈" },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Lấy thông tin admin từ localStorage (TV1 sẽ lưu vào đây khi login)
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ── OVERLAY cho mobile ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30
          flex flex-col bg-[#1e3a5f] text-white
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {!collapsed && (
            <span className="font-bold text-lg tracking-wide truncate">
              📖 E-Library
            </span>
          )}
          {/* Nút collapse — chỉ hiện trên desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition ml-auto"
            title={collapsed ? "Mở rộng" : "Thu gọn"}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-150 text-sm font-medium
                ${isActive
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
              title={collapsed ? item.label : ""}
              onClick={() => setMobileOpen(false)}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="border-t border-white/10 p-4">
          {!collapsed ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">
                {user.name ? user.name[0].toUpperCase() : "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name || "Admin"}</p>
                <p className="text-xs text-white/50 truncate">{user.email || ""}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                {user.name ? user.name[0].toUpperCase() : "A"}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-2 w-full rounded-lg px-3 py-2
              text-sm text-white/70 hover:bg-red-500/20 hover:text-red-300
              transition-all duration-150
              ${collapsed ? "justify-center" : ""}
            `}
          >
            <span>🚪</span>
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0">
          {/* Nút mở sidebar trên mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            ☰
          </button>
          <h1 className="text-base md:text-lg font-semibold text-gray-700">
            Admin Panel
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>👋</span>
            <span className="hidden sm:inline">Xin chào, {user.name || "Admin"}</span>
          </div>
        </header>

        {/* Page content — Outlet render trang con vào đây */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}