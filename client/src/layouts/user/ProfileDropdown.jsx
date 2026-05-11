import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LayoutDashboard, BookMarked, User, LogOut } from "lucide-react";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-white/10 hover:bg-white/20 
                   rounded-xl transition-colors border border-white/20"
      >
        <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center 
                        text-xs text-white font-semibold">
          JD
        </div>
        <span className="hidden sm:block text-sm text-white">John D.</span>
        <ChevronDown className="w-3.5 h-3.5 text-white/70" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-xl 
                        shadow-xl border border-gray-200 dark:border-slate-700 py-2 w-52 z-50">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">John Doe</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">john.doe@university.edu</p>
          </div>
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 
                       hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-blue-600" /> My Dashboard
          </Link>
          <Link
            to="/dashboard?tab=borrowing"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 
                       hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <BookMarked className="w-4 h-4 text-blue-600" /> My Borrowings
          </Link>
          <Link
            to="/dashboard?tab=settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 
                       hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <User className="w-4 h-4 text-blue-600" /> Profile Settings
          </Link>
          <div className="border-t border-gray-100 dark:border-slate-700 mt-1 pt-1">
            <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 
                               dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Click-away overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
