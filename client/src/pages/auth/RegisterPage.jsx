import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Mail, Lock, User, ArrowRight, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

// Tách InputField ra ngoài để tránh Re-render mất focus khi gõ phím
const InputField = ({ name, label, type = 'text', placeholder, icon: Icon, value, onChange, error, showPass, setShowPass }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
      <input
        type={type === 'password' ? (showPass ? 'text' : 'password') : type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'new-password' : name}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${type === 'password' ? 'pr-10' : 'pr-4'} py-2.5 rounded-xl border ${
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
        } bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
      />
      {type === 'password' && setShowPass && (
        <button
          type="button"
          onClick={() => setShowPass(!showPass)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
        >
          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
    {error && <p className="text-red-500 text-[11px] mt-1 font-medium">{error}</p>}
  </div>
);

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  
  // Quản lý lỗi chi tiết cho từng trường (Đồng bộ cấu trúc trả về từ express-validator)
  const [fieldErrors, setFieldErrors] = useState({});

  // Form Đăng ký tích hợp đầy đủ các trường khớp cơ sở dữ liệu (gồm cả trường phone)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '', phone: '', role: 'user'
  });

  // Điều hướng bảo vệ: Không cho phép truy cập trang đăng ký khi đã đăng nhập
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim())      errs.full_name = 'Please enter your full name';
    if (!form.email.trim())          errs.email     = 'Please enter your email';
    if (form.password.length < 8)   errs.password  = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) errs.password = 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(form.password)) errs.password = 'Password must contain at least one digit';
    if (form.password !== form.confirm_password) errs.confirm_password = 'Password confirmation does not match';
    return errs;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const errs = validate();
  if (Object.keys(errs).length) { setFieldErrors(errs); return; }

  setLoading(true);
  setError('');
  try {
    // Gọi API thông qua authService hiện tại của bạn
    const response = await authService.register({
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      role: 'user' // Luôn đăng ký với role user, không cho phép chọn role khi đăng ký để tránh lỗ hổng bảo mật
    });

    // Chuyển hướng sang trang OTP và truyền Email cũng như mã OTP debug nếu có
    navigate('/verify-otp', {
      state: {
        email: form.email,
        debugOtp: response.data?.debugOtp,
      },
    });
  } catch (err) {
    const msg = err.response?.data?.message || 'Đăng ký không thành công. Vui lòng thử lại.';
    setError(msg);
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Cột trái - Khối trang trí */}
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
            Tham gia cộng đồng đọc giả thông thái
          </h1>
          <p className="text-indigo-100 text-sm leading-relaxed">
            Chỉ với một tài khoản duy nhất, mở ra cánh cửa kết nối kho sách học thuật đồ sộ và quản lý mượn trả tiện ích.
          </p>
        </div>

        <div className="relative z-10 text-xs text-indigo-200">
          &copy; {new Date().getFullYear()} E-Library System. Tất cả các quyền được bảo lưu.
        </div>
      </div>

      {/* Cột phải - Khối Form Đăng Ký */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-10 px-6 sm:px-12 lg:px-20 relative overflow-y-auto">
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="max-w-md w-full mx-auto">
          <div className="flex lg:hidden items-center gap-2 mb-6 justify-center">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Library size={24} />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">E-Library</span>
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              Tạo tài khoản mới
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              Điền các thông tin dưới đây để đăng ký thẻ thành viên điện tử
            </p>
          </div>

          {generalError && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-medium">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Họ và tên */}
            <InputField
              name="full_name"
              label="Họ và tên *"
              placeholder="Nguyễn Văn A"
              icon={User}
              value={form.full_name}
              onChange={handleChange}
              error={fieldErrors.full_name}
            />

            {/* Email */}
            <InputField
              name="email"
              label="Địa chỉ Email *"
              placeholder="example@gmail.com"
              icon={Mail}
              type="email"
              value={form.email}
              onChange={handleChange}
              error={fieldErrors.email}
            />

            {/* Số điện thoại */}
            <InputField
              name="phone"
              label="Số điện thoại (Tùy chọn)"
              placeholder="0912345678"
              icon={Phone}
              type="text"
              value={form.phone}
              onChange={handleChange}
              error={fieldErrors.phone}
            />

            {/* Mật khẩu */}
            <InputField
              name="password"
              label="Mật khẩu *"
              placeholder="Tối thiểu 8 ký tự, có chữ hoa, chữ số"
              icon={Lock}
              type="password"
              value={form.password}
              onChange={handleChange}
              error={fieldErrors.password}
              showPass={showPass}
              setShowPass={setShowPass}
            />

            {/* Xác nhận mật khẩu */}
            <InputField
              name="confirm_password"
              label="Xác nhận mật khẩu *"
              placeholder="Nhập lại mật khẩu giống phía trên"
              icon={Lock}
              type="password"
              value={form.confirm_password}
              onChange={handleChange}
              error={fieldErrors.confirm_password}
              showPass={showConfirmPass}
              setShowPass={setShowConfirmPass}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white rounded-xl text-sm font-semibold transition-colors mt-6 shadow-md shadow-indigo-600/10"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <><ArrowRight size={15} /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-6">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-indigo-400 hover:text-indigo-300">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}