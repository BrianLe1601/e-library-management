import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle, BookOpen, AlertTriangle, Info,
  X, Bell,
} from 'lucide-react';

export const mockNotifications = [
  {
    id: '1',
    type: 'overdue',
    message: 'Book "Chí Phèo" is overdue by 2 days',
    time: '5 minutes ago',
    read: false,
  },
  {
    id: '2',
    type: 'approved',
    message: 'Borrow request for "Dế Mèn" has been approved',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'returned',
    message: 'User Minh Tuấn returned "Số Đỏ" successfully',
    time: '3 hours ago',
    read: true,
  },
  {
    id: '4',
    type: 'fine',
    message: 'Fine of $4.50 issued to user Lan Anh for late return',
    time: 'Yesterday',
    read: true,
  },
  {
    id: '5',
    type: 'system',
    message: 'System backup completed successfully',
    time: '2 days ago',
    read: true,
  },
];

const notifIcon = {
  overdue:  { icon: Clock,         bg: 'bg-red-100 dark:bg-red-900/30',    color: 'text-red-500' },
  approved: { icon: CheckCircle,   bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-500' },
  returned: { icon: BookOpen,      bg: 'bg-blue-100 dark:bg-blue-900/30',  color: 'text-blue-500' },
  fine:     { icon: AlertTriangle, bg: 'bg-amber-100 dark:bg-amber-900/30',color: 'text-amber-500' },
  system:   { icon: Info,          bg: 'bg-slate-100 dark:bg-slate-700/60',color: 'text-slate-500 dark:text-slate-400' },
};

export function NotificationPopover({ onClose, onMarkAllRead, notifications, viewAllPath = '/notifications' }) {
  const ref = useRef(null);
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-3 w-[350px] z-50 rounded-2xl shadow-2xl
        bg-white dark:bg-[#0f1629]
        border border-slate-200 dark:border-slate-700/60
        animate-in fade-in slide-in-from-top-2 duration-150"
      style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.18))' }}
    >
      {/* Tail */}
      <div
        className="absolute -top-[7px] right-[18px] w-3.5 h-3.5 rotate-45 rounded-sm
          bg-white dark:bg-[#0f1629]
          border-l border-t border-slate-200 dark:border-slate-700/60"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-indigo-500" />
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold leading-none min-w-[18px]">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-[320px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
            No notifications
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {notifications.slice(0, 5).map(n => {
              const { icon: Icon, bg, color } = notifIcon[n.type];
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-default
                    ${!n.read ? 'bg-indigo-50/60 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${bg}`}>
                    <Icon size={14} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.read ? 'text-slate-800 dark:text-slate-100 font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{n.time}</p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/60">
        <button
          onClick={() => { navigate(viewAllPath); onClose(); }}
          className="w-full py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400
            bg-indigo-50 dark:bg-indigo-900/20
            hover:bg-indigo-100 dark:hover:bg-indigo-900/40
            transition-colors"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
}
