import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, ArrowRight, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import InputField from '../../components/InputField';

export default function RegisterPage() {
  const [showPass, setShowPass]             = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false); // State ẩn/hiện cho confirm password
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [fieldErrors, setFieldErrors]       = useState({});
  const navigate                            = useNavigate();
  const { theme, toggleTheme }              = useTheme();
  const { isLoading, isAuthenticated }      = useAuth(); // Bảo vệ route

  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '', phone: '', role: 'user'
  });

  // Chặn không cho user đã đăng nhập cố tình vào lại trang Register
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070d1b] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d1b] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-purple-500/10" />
        </div>
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
              <p className="text-white font-semibold">E-Library</p>
              <p className="text-indigo-200 text-xs">Management System</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl text-white leading-tight">
              Join our library<br />
              <span className="text-indigo-300">community today</span>
            </h2>
            <p className="text-indigo-200 mt-4 text-sm leading-relaxed">
              Create your account to borrow books, track your reading history, and stay notified about due dates.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Books Available', value: '50,000+' },
              { label: 'Active Members', value: '12,500+' },
              { label: 'Daily Borrows', value: '300+' },
              { label: 'Free to Join', value: '100%' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-indigo-200 text-xs">{stat.label}</p>
                <p className="text-white text-xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-indigo-300 text-xs">© 2026 E-Library. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <button onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="text-slate-900 dark:text-white font-semibold">E-Library</span>
          </div>

          <div className="mb-6">
            <h1 className="text-slate-900 dark:text-white">Create account</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Register to join the system</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField name="full_name" label="Họ và tên *" placeholder="Nguyễn Văn A" icon={User} value={form.full_name} onChange={handleChange} fieldErrors={fieldErrors} />
            <InputField name="email" label="Email *" placeholder="example@email.com" icon={Mail} type="email" value={form.email} onChange={handleChange} fieldErrors={fieldErrors} />
            <InputField name="phone" label="Số điện thoại (tùy chọn)" placeholder="0901234567" value={form.phone} onChange={handleChange} fieldErrors={fieldErrors} />
            
            {/* Password */}
            <InputField 
              name="password" 
              label="Mật khẩu *" 
              placeholder="Tối thiểu 8 ký tự, 1 chữ hoa, 1 số" 
              icon={Lock} 
              type="password" 
              value={form.password} 
              onChange={handleChange} 
              fieldErrors={fieldErrors}
              showPass={showPass}
              setShowPass={setShowPass}
            />

            {/* Confirm Password - Giờ cũng có nút Mắt ẩn/hiện xịn sò */}
            <InputField 
              name="confirm_password" 
              label="Xác nhận mật khẩu *" 
              placeholder="Nhập lại mật khẩu" 
              icon={Lock} 
              type="password" 
              value={form.confirm_password} 
              onChange={handleChange} 
              fieldErrors={fieldErrors}
              showPass={showConfirmPass}
              setShowPass={setShowConfirmPass}
            />

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white rounded-xl text-sm transition-colors mt-2">
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