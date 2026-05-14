import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { BookMarked, Bell, Settings, ChevronRight } from "lucide-react";
import { StarRating } from "../../components/StarRating";
import { notifications } from "../data/mockData";
import { BorrowingTab } from "./BorrowingTab";
import { NotificationsTab } from "./NotificationsTab";
import { SettingsTab } from "./SettingsTab";

const tabs = [
  { id: "borrowing", label: "Borrowing History", icon: BookMarked },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "borrowing");

  useEffect(() => {
    if (tabParam && ["borrowing", "notifications", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="bg-blue-900 dark:bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white" style={{ fontWeight: 700 }}>
              JD
            </div>
            <div>
              <h1 className="text-white">My Dashboard</h1>
              <p className="text-blue-200 text-sm">Welcome back, John Doe</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-56 shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
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
                      {tab.id === "notifications" && unreadNotifications > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}>
                          {unreadNotifications}
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-white/70" : "text-gray-400"}`} />
                    </div>
                  </button>
                );
              })}
            </div>

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
                  <div className="flex items-center gap-1">
                    <StarRating rating={4.5} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {activeTab === "borrowing" && <BorrowingTab />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "settings" && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
