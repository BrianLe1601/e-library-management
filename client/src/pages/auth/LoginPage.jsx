import React, { useState , useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Mail, Lock, User, ChevronDown, ArrowRight, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";


export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  // Điều hướng bảo vệ: Nếu đã đăng nhập thành công, không cho quay lại trang login
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formData.email || !formData.password) {
    setError('Please enter both email and password');
    return;
  }
  try {
    setLoading(true);
    setError('');
    
    const response = await authService.login(formData);
    const { token, user } = response.data.data; // Đọc thông tin user & token từ backend trả về
    
    // Lưu session đăng nhập vào Context toàn cục của hệ thống
    login(token, user);
    
    // LOGIC ĐIỀU HƯỚNG CHUYÊN SÂU THEO VAI TRÒ (ROLE-BASED REDIRECTION)
    if (user && (user.role === 'admin' || user.role === 'employee')) {
      // Đưa Admin và Nhân viên thư viện thẳng vào Dashboard trang quản trị hệ thống
      navigate('/admin', { replace: true });
    } else {
      // Đưa độc giả thông thường về trang chủ của UserLayout để tìm và mượn sách
      navigate('/', { replace: true });
    }
    
  } catch (error) {
    const message = error.response?.data?.message || 'Login failed';
    setError(message);
    console.error('Login failed:', error.response?.data || error.message);
  } finally {
    setLoading(false);
  }
};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070d1b] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d1b] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-purple-500/10" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">ELibrary</p>
              <p className="text-indigo-200 text-xs">Management System</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl text-white leading-tight">
              Manage your library<br />
              <span className="text-indigo-300">smarter & faster</span>
            </h2>
            <p className="text-indigo-200 mt-4 text-sm leading-relaxed">
              A complete library management system with real-time analytics, borrowing workflows, and intelligent reporting.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Books Managed', value: '12,847' },
              { label: 'Active Members', value: '3,420' },
              { label: 'Monthly Borrows', value: '1,234' },
              { label: 'System Uptime', value: '99.9%' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-indigo-200 text-xs">{stat.label}</p>
                <p className="text-white text-xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-indigo-300 text-xs">© 2026 ELibrary. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="text-slate-900 dark:text-white font-semibold">ELibrary</span>
          </div>

          <div className="mb-6">
            <h1 className="text-slate-900 dark:text-white">Welcome back</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Sign in to access your dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="admin@library.com"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-500 dark:text-slate-400">Password</label>
                <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white rounded-xl text-sm transition-colors mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-slate-400 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3">
            {['Google', 'Facebook'].map(p => (
              <button
                key={p}
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          <p className="text-center text-slate-400 text-xs mt-6">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-indigo-400 hover:text-indigo-300"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
