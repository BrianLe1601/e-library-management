/**
 * pages/user/Dashboard.jsx — User Dashboard
 * Tabs: Borrowing History | Notifications | Settings
 * Kết nối: borrowService + authService
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { BookMarked, Bell, Settings, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// ── Sub-tabs ──────────────────────────────────────────────────────────────────
import { DashboardTab }    from "./DashboardTab";
import { BorrowedTab } from "./BorrowedTab";
import { SavedBooksTab }   from "./SavedBooksTab";
import { NotificationsTab } from "./NotificationsTab";
import { SettingsTab }     from "./SettingsTab";

const TABS = [
  { id: "dashboard",      label: "Dashboard",   icon: BookMarked },
  { id: "borrowed",        label: "Borrowed",        icon: BookMarked },
  { id: "saved",          label: "Saved Books",     icon: BookMarked },
  { id: "notifications",  label: "Notifications",       icon: Bell       },
  { id: "settings",       label: "Settings",         icon: Settings   },
];

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    TABS.map(t => t.id).includes(tabParam) ? tabParam : "dashboard"
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (TABS.map(t => t.id).includes(tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
{/* ─── Dashboard Header - Phong cách Liquid Aura Premium ─── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 border-b border-slate-200/50 dark:border-slate-800/60 py-8 sm:py-10 transition-all duration-500">
        
        {/* Vầng sáng hữu cơ mờ ảo (Tones màu đồng nhất với hệ thống) */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-30 select-none mix-blend-multiply dark:mix-blend-screen">
          <div className="absolute -top-28 -left-12 w-[450px] h-[280px] bg-gradient-to-tr from-sky-400/20 via-blue-300/15 to-transparent dark:from-blue-500/20 dark:via-slate-500/10 dark:to-transparent rounded-full blur-[90px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute -bottom-36 right-12 w-[450px] h-[280px] bg-gradient-to-bl from-indigo-300/15 via-blue-200/10 to-transparent dark:from-indigo-500/15 dark:via-slate-600/10 dark:to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>

        {/* NỘI DUNG CHÍNH */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            
            {/* Vùng Thông Tin User */}
            <div className="flex items-center gap-5">
              {/* Lời chào & Tên */}
              <div className="space-y-1">      
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome back,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 dark:from-blue-400 dark:to-cyan-300 drop-shadow-sm">
                    {user?.full_name || 'You'}
                  </span>
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Here is what's happening with your library account today.
                </p>
              </div>
            </div>

            {/* Widget Glassmorphism Nhỏ Ở Góc Phải (Thêm vào để cân bằng không gian) */}
            <div className="hidden lg:flex items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] transition-all duration-500">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-slate-700/50">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overview</p>
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  Personal Dashboard
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar nav */}
          <div className="md:w-65 shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              {TABS.map((tab) => {
                const Icon     = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-between w-full px-4 py-3.5 text-sm transition-colors border-b border-gray-100 dark:border-slate-700 last:border-0 ${
                      isActive
                        ? "bg-blue-700 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                    style={{ fontWeight: isActive ? 600 : 400 }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {tab.id === "notifications" && unreadCount > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}>
                          {unreadCount}
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-white/70" : "text-gray-400"}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider font-semibold">Information</p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Email</span>
                  <span className="text-gray-900 dark:text-gray-100 text-xs truncate max-w-[200px]">{user?.email || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Role</span>
                  <span className="text-gray-900 dark:text-gray-100 capitalize font-semibold">{user?.role || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`text-xs font-semibold ${user?.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                    {user?.status === 'active' ? 'Active' : 'Locked'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                Quick Stats
              </p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Books read</span>
                  <span className="text-gray-900 dark:text-gray-100" style={{ fontWeight: 600 }}>24</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">This month</span>
                  <span className="text-gray-900 dark:text-gray-100" style={{ fontWeight: 600 }}>4</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Rating given</span>
                  <span className="text-gray-900 dark:text-gray-100" style={{ fontWeight: 600 }}>4</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "dashboard"     && <DashboardTab />}
            {activeTab === "borrowed" && <BorrowedTab />}
            {activeTab === "saved" && <SavedBooksTab />}
            {activeTab === "notifications" && <NotificationsTab onUnreadChange={setUnreadCount} />}
            {activeTab === "settings"      && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}