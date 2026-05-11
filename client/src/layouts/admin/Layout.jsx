import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SidebarContent from './SidebarContent';
import Header from './Header';

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#070d1b] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col shrink-0 bg-slate-900 dark:bg-[#0d1526] border-r border-slate-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent collapsed={collapsed} setMobileOpen={setMobileOpen} />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-slate-900 dark:bg-[#0d1526] border-r border-slate-800 flex flex-col">
            <SidebarContent collapsed={false} setMobileOpen={setMobileOpen} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header collapsed={collapsed} setCollapsed={setCollapsed} setMobileOpen={setMobileOpen} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
