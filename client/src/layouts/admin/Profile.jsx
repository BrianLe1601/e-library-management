import React from "react";
import { useAuth } from "../../context/AuthContext";
export default function UserProfile({ collapsed }) {
  const { user } = useAuth();
  if (collapsed) return null;
  const initials = user.full_name
    ? user.full_name.substring(0, 2).toUpperCase()
    : "US";
  const shortName = user.full_name ? user.full_name.split(" ")[0] : "User";
  const avatarStyles = "w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-xs text-white font-bold shadow-inner";

  return (
    <div className="flex items-center gap-3 px-3 py-2 mt-2 rounded-lg bg-slate-800/50 dark:bg-slate-700/30">
      <div className={avatarStyles}>
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-white text-xs font-medium truncate">
          {user.full_name}
        </p>
        <p className="text-slate-400 text-xs truncate">{user.email}</p>
      </div>
    </div>
  );
}
