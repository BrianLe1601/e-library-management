import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Library, BookOpen, Eye, EyeOff, Mail, Lock, User, ChevronDown, ArrowRight, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Khối giao diện Trái (Giữ nguyên giao diện đẹp) */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-800 opacity-90" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000" />
        
        <div className="relative z-10 flex items-center gap-2.5 text-white font-bold text-xl">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
            <Library size={22} className="text-white" />
          </div>
          <span>E-Library</span>
        </div>

        <div className="relative z-10 max-w-md mb-20">
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Khám phá tri thức số tại thư viện thông minh
          </h1>
          <p className="text-indigo-100 text-sm leading-relaxed">
            Mượn sách trực tuyến, theo dõi hạn trả dễ dàng và tiếp cận hàng ngàn tựa sách hấp dẫn mọi lúc, mọi nơi.
          </p>
        </div>

        <div className="relative z-10 text-xs text-indigo-200">
          &copy; {new Date().getFullYear()} E-Library System. Tất cả các quyền được bảo lưu.
        </div>
      </div>

      {/* Khối Form Đăng Nhập */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-20 relative">
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="max-w-md w-full mx-auto">
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Library size={24} />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">E-Library</span>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              Chào mừng quay trở lại!
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              Vui lòng nhập thông tin tài khoản của bạn để tiếp tục
            </p>
          </div>

          {/* Hiển thị lỗi chuẩn xác */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Địa chỉ Email *
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Mật khẩu *
                </label>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white rounded-xl text-sm font-semibold transition-colors mt-6 shadow-md shadow-indigo-600/10"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 dark:text-slate-500 text-xs mt-8">
            Chưa có tài khoản thư viện?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
