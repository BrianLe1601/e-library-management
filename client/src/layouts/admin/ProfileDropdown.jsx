import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, User, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();

  // Đóng dropdown khi click ra ngoài vùng hiển thị
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'AD';
  const shortName = user.full_name ? user.full_name.split(' ')[0] : 'Admin';

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 
             bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700
             rounded-full border border-slate-200 dark:border-slate-700
             text-slate-700 dark:text-slate-200 shadow-sm
             transition-all duration-200 ease-in-out"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 
                        rounded-full flex items-center justify-center 
                        text-xs text-white font-bold shadow-inner">
          {initials}
        </div>
        <span className="hidden sm:block text-sm font-medium">{shortName}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Box Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 bg-white dark:bg-slate-800 
                        rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-black/40 border border-slate-100 dark:border-slate-700 
                        py-2 w-56 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/80">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.full_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
              {user.role}
            </span>
          </div>
          
          <div className="p-1.5">
            <Link
              to="/admin/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl
                         text-slate-600 dark:text-slate-300 
                         hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <User className="w-4 h-4" /> Hồ sơ cá nhân
            </Link>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700/80 p-1.5">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-xl
                         text-red-600 dark:text-red-400 
                         hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
