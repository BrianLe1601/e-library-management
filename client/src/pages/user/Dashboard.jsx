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
import { BorrowingTab }    from "./BorrowingTab";
import { NotificationsTab } from "./NotificationsTab";
import { SettingsTab }     from "./SettingsTab";

const TABS = [
  { id: "borrowing",      label: "Lịch sử mượn",   icon: BookMarked },
  { id: "notifications",  label: "Thông báo",       icon: Bell       },
  { id: "settings",       label: "Cài đặt",         icon: Settings   },
];

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    TABS.map(t => t.id).includes(tabParam) ? tabParam : "borrowing"
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
      {/* Header */}
      <div className="bg-blue-900 dark:bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {initials}
            </div>
            <div>
              <h1 className="text-white">Dashboard</h1>
              <p className="text-blue-200 text-sm">
                Xin chào, {user?.full_name || 'Bạn'}
              </p>
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider font-semibold">Thông tin</p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Email</span>
                  <span className="text-gray-900 dark:text-gray-100 text-xs truncate max-w-[200px]">{user?.email || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Vai trò</span>
                  <span className="text-gray-900 dark:text-gray-100 capitalize font-semibold">{user?.role || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Trạng thái</span>
                  <span className={`text-xs font-semibold ${user?.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                    {user?.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {activeTab === "borrowing"     && <BorrowingTab />}
            {activeTab === "notifications" && <NotificationsTab onUnreadChange={setUnreadCount} />}
            {activeTab === "settings"      && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}