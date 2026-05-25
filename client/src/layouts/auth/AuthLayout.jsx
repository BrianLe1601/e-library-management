import React, { useState, useEffect, useMemo } from "react";
import { Link, Outlet } from "react-router-dom"; // Đã xóa useLocation
import { BookOpen, Users, Clock, CheckCircle2, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import bookService from "../../services/bookService";

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  const [systemStats, setSystemStats] = useState({ totalBooks: 0, activeMembers: 0, checkedOutBooks: 0 });

  useEffect(() => {
    let isMounted = true; 
    const fetchData = async () => {
      try {
        const statsRes = await bookService.getPublicStats().catch(() => ({ data: { success: false } }));
        if (isMounted && statsRes?.data?.success) {
          setSystemStats(statsRes.data.data || { totalBooks: 0, activeMembers: 0, checkedOutBooks: 0 });
        }
      } catch (err) { console.error("Lỗi tải thống kê:", err); }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const dynamicStats = useMemo(() => [
    { icon: BookOpen, label: "Total Available Books", value: (systemStats.totalBooks || 0).toLocaleString() },
    { icon: Users, label: "Active Members", value: (systemStats.activeMembers || 0).toLocaleString() },
    { icon: Clock, label: "Books Checked Out", value: (systemStats.checkedOutBooks || 0).toLocaleString() },
    { icon: CheckCircle2, label: "Free to Join", value: "100%" },
  ], [systemStats]);

  return (
    // Dùng flex chuẩn để chia đôi màn hình
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#070d1b]">
      
      {/* ----------------- NỬA TRÁI (BRANDING TRANG TRÍ) ----------------- */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-12 overflow-hidden">
        
        {/* Đồ họa nền */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-purple-500/10" />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        
        {/* LOGO */}
        <div className="relative z-10 w-full">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">E-Library</p>
              <p className="text-indigo-200 text-xs">Management System</p>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-10">
          {/* ----- PHẦN TIÊU ĐỀ ----- */}
          <div className="relative">
            {/* Vầng sáng nhẹ phía sau chữ */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur-2xl opacity-20"></div>
            
            <h2 className="relative text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
              Join our library <br />
              {/* Hiệu ứng chữ Gradient lung linh */}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                community today
              </span>
            </h2>
            <p className="relative text-indigo-100/80 mt-5 text-sm leading-relaxed max-w-md font-medium">
              Create your account to borrow books, track your reading history, and stay notified about due dates.
            </p>
          </div>

          {/* ----- PHẦN THỐNG KÊ (GLASSMORPHISM CARDS) ----- */}
          <div className="grid grid-cols-2 gap-5">
            {dynamicStats.map((stat, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.2] rounded-2xl p-4 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(79,70,229,0.15)]"
              >
                {/* Lớp nền gradient ẩn, chỉ hiện ra khi hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    {/* Bọc icon vào một ô vuông bo góc tinh tế */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 group-hover:text-indigo-200 group-hover:bg-indigo-500/30 transition-colors">
                      {stat.icon && <stat.icon size={16} strokeWidth={2.5} />}
                    </div>
                    <p className="text-indigo-200/80 text-xs font-semibold uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                  <p className="text-white text-2xl font-bold tracking-tight">
                    {stat.value === "0" && !systemStats.totalBooks ? "..." : stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="relative z-10 w-full">
          <p className="inline-block text-indigo-300 text-xs">
            © 2026 E-Library. All rights reserved.
          </p>
        </div>
      </div>

      {/* ----------------- NỬA PHẢI (CHỨA FORM) ----------------- */}
      <div className="w-full lg:w-1/2 relative flex flex-col items-center justify-center p-6 sm:p-12">
        
        {/* NÚT DARK MODE: Đặt góc tĩnh */}
        <button 
          onClick={toggleTheme} 
          className="absolute top-6 right-6 z-50 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-full max-w-sm">
          {/* Logo Mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="text-slate-900 dark:text-white font-semibold">E-Library</span>
          </div>

          {/* HIỂN THỊ FORM LOGIN/REGISTER TỰ ĐỘNG THAY ĐỔI */}
          <Outlet /> 

        </div>
      </div>
    </div>
  );
}