import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import AuthLayout from "../../layouts/auth/AuthLayout";
import ForgotPasswordModal from "./ForgotPasswordPage";
import { useToast } from "../../context/ToastContext";

// --- THÊM IMPORT NÀY CHO GOOGLE AUTH ---
import { useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      toast.warning("Please enter both email and password");
      return;
    }
    try {
      setLoading(true);
      setError("");

      const response = await authService.login(formData);
      const { token, user } = response.data.data;

      login(token, user);
      toast.success("Login successful!", 'Welcome back, ' + user.full_name);

      if (user && (user.role === "admin" || user.role === "employee")) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      setError(message);
      toast.error("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  // ── HOOK KÍCH HOẠT POPUP VÀ XỬ LÝ ĐĂNG NHẬP GOOGLE ──────────────────────────
  const handleGoogleLoginSuccess = async (tokenResponse) => {
    try {
      setLoading(true);
      setError("");

      // Bắn access_token nhận từ popup Google lên Backend của bạn
      const response = await authService.loginWithGoogle(tokenResponse.access_token);
      const { token, user } = response.data.data;

      // Lưu trạng thái đăng nhập vào ứng dụng
      login(token, user);
      toast.success("Google Login successful!", 'Welcome back, ' + user.full_name);

      // Điều hướng theo vai trò chuẩn xác tương tự form thường
      if (user && (user.role === "admin" || user.role === "employee")) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      const message = error.response?.data?.message || "Google Authentication failed";
      setError(message);
      toast.error("Google Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => {
      toast.error("Google Authentication error", "Could not authorize via Google account.");
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070d1b] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-slate-900 dark:text-white font-bold text-2xl">
          Welcome back
        </h1>
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
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            Email Address
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="name@example.com"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Password
            </label>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPass ? "text" : "password"}
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
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
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white rounded-xl text-sm transition-colors mt-2 font-medium shadow-md shadow-indigo-200 dark:shadow-none"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            <>
              Sign In
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <ForgotPasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        <span className="text-slate-400 text-xs font-medium">or continue with</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Social Buttons - BẺ VÒNG LẶP ĐỂ GẮN SỰ KIỆN CLICK RIÊNG BIỆT */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => triggerGoogleLogin()}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
        >
          Google
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
        >
          Facebook
        </button>
      </div>

      <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-6">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/register")}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
        >
          Register here
        </button>
      </p>
    </>
  );
}