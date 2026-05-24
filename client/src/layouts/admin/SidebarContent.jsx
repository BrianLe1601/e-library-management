import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Settings, LogOut, BookLock } from "lucide-react";
import { navItems } from "./navItems";
import Profile from "./Profile";
import { useAuth } from "../../context/AuthContext";
export default function SidebarContent({ collapsed, setMobileOpen }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-slate-800 dark:border-slate-700 h-16 ${collapsed ? "justify-center" : ""}`}
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 shrink-0">
          <BookLock size={32} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              LibraryAdmin
            </p>
            <p className="text-slate-400 text-xs">Management System</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-sidebar-scroll">
        {/* Đoạn CSS để biến thanh cuộn thành dạng siêu mỏng ẩn/hiện hiện đại */}
        <style>{`
    .custom-sidebar-scroll::-webkit-scrollbar {
      width: 5px; /* Độ rộng thanh cuộn siêu nhỏ */
    }
    .custom-sidebar-scroll::-webkit-scrollbar-track {
      background: transparent; /* Nền thanh cuộn trong suốt */
    }
    .custom-sidebar-scroll::-webkit-scrollbar-thumb {
      background: rgba(100, 116, 139, 0.2); /* Màu xám nhẹ mặc định */
      border-radius: 9999px; /* Bo tròn tuyệt đối */
    }
    .custom-sidebar-scroll:hover::-webkit-scrollbar-thumb {
      background: rgba(99, 102, 241, 0.4); /* Đổi sang màu tím Indigo khi di chuột vào Sidebar */
    }
  `}</style>

        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:bg-slate-800/60 dark:hover:bg-slate-700/60 hover:text-slate-100"
              } ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-800 dark:border-slate-700 p-2 space-y-1">
        <button
          onClick={() => navigate("/admin/settings")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/60 dark:hover:bg-slate-700/60 hover:text-slate-100 transition-all ${collapsed ? "justify-center" : ""}`}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </button>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium
                                 text-red-600 dark:text-red-400 
                                 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left`}
        >
          <LogOut className="w-4 h-4" />{" "}{collapsed ? "Logout" : "Logout"}
        </button>

        {/* User Profile */}
        <Profile collapsed={collapsed} />
      </div>
    </div>
  );
}
