import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Profile({ collapsed }) {
  const { user } = useAuth();
  
  if (collapsed || !user) return null;

  // Lấy 2 chữ cái đầu của tên để làm Avatar mặc định
  const initials = user.full_name 
    ? user.full_name.substring(0, 2).toUpperCase() 
    : 'AD';

  return (
    <div className="flex items-center gap-3 px-3 py-2 mt-2 rounded-xl bg-slate-800/50 dark:bg-slate-700/30 border border-slate-700/50">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-semibold truncate">{user.full_name}</p>
        <p className="text-slate-400 text-xs truncate">{user.email}</p>
      </div>
    </div>
  );
}