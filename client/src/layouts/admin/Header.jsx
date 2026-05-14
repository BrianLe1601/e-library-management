import React, { useState } from "react";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "../../components/ThemeContext";
import ProfileDropdown from "./ProfileDropdown";
import { NotificationPopover, mockNotifications } from "../../components/NotificationPopover";

export default function Header({ collapsed, setCollapsed, setMobileOpen }) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 bg-white dark:bg-[#0f1629] border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3 shrink-0 top-0 z-50 h-16">
      {/* Mobile menu */}
      <button
        className="md:hidden text-slate-400 hover:text-slate-100"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Collapse toggle */}
      <button
        className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        onClick={() => setCollapsed((p) => !p)}
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <div className="ml-auto flex items-center gap-6">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-lg 
             text-slate-500 dark:text-slate-400 
             hover:text-indigo-500 dark:hover:text-indigo-400 
             hover:bg-slate-100 dark:hover:bg-slate-800 
             transition-colors duration-200 ease-in-out 
             focus:outline-none 
             hover:scale-105"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg 
               text-slate-500 dark:text-slate-400 
               hover:text-indigo-500 dark:hover:text-indigo-400 
               hover:bg-slate-100 dark:hover:bg-slate-800 
               transition-colors duration-200 ease-in-out 
               focus:outline-none
               hover:scale-105"
          >
            <Bell size={20} />
            {notifications.some((n) => !n.read) && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500"></span>
            )}
          </button>
          {showNotifications && (
            <NotificationPopover
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
              viewAllPath="/admin/notifications"
            />
          )}
        </div>

        {/* Avatar */}
        <div className="">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
