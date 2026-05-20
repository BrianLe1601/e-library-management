import React from 'react';

export default function UserProfile({ collapsed }) {
  if (collapsed) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-2 mt-2 rounded-lg bg-slate-800/50 dark:bg-slate-700/30">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
        SA
      </div>
      <div className="min-w-0">
        <p className="text-white text-xs font-medium truncate">Super Admin</p>
        <p className="text-slate-400 text-xs truncate">admin@library.com</p>
      </div>
    </div>
  );
}
