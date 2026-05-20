import React from 'react';
import { NavLink } from 'react-router-dom';
import { Settings, LogOut, BookLock } from 'lucide-react';
import { navItems } from './navItems';
import Profile from './Profile';
import { useAuth } from '../../context/AuthContext';

export default function SidebarContent({ collapsed, setMobileOpen }) {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-slate-900 dark:bg-[#0d1526]">
      {/* Khối Logo */}
      <div className={`flex items-center gap-3 px-4 py-6 border-b border-slate-800/80 h-20 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shrink-0 shadow-lg shadow-indigo-500/20">
          <BookLock size={22} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-white font-bold text-[15px] leading-tight tracking-wide truncate">E-Library Admin</h1>
            <p className="text-indigo-300 text-[11px] font-medium tracking-wider uppercase mt-0.5 truncate">Management</p>
          </div>
        )}
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group font-medium ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Khu vực Footer Sidebar (Profile & Nút đăng xuất) */}
      <div className="border-t border-slate-800/80 p-3 space-y-2 pb-6">
        <button className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 transition-all font-medium ${collapsed ? 'justify-center px-0' : ''}`}>
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm">Cài đặt hệ thống</span>}
        </button>
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all font-medium ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span className="text-sm">Đăng xuất</span>}
        </button>
        
        {/* Component Profile cá nhân */}
        <Profile collapsed={collapsed} />
      </div>
    </div>
  );
}