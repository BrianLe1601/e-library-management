import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, User, LogOut } from "lucide-react";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 
             bg-slate-100 dark:bg-slate-800 
             hover:bg-slate-200 dark:hover:bg-slate-700 
             rounded-xl border border-slate-300 dark:border-slate-600 
             text-slate-700 dark:text-slate-200 
             transition-colors duration-300 ease-in-out"
      >
        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 
                        rounded-full flex items-center justify-center 
                        text-xs text-white font-semibold">
          JD
        </div>
        <span className="hidden sm:block text-sm">John D.</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 
                        rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 
                        py-2 w-52 z-50">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">John Doe</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">john.doe@university.edu</p>
          </div>
          <Link
            to="/admin/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm 
                       text-gray-700 dark:text-gray-300 
                       hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <User className="w-4 h-4 text-blue-600" /> Profile Settings
          </Link>
          <div className="border-t border-gray-100 dark:border-slate-700 mt-1 pt-1">
            <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm 
                               text-red-600 dark:text-red-400 
                               hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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
