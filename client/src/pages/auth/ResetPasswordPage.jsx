import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Đã thêm import
import { BookOpen, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, Check } from "lucide-react";
import authService from "../../services/authService"; // Đã thêm import

const REQUIREMENTS = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "At least 1 uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "At least 1 number", test: (pw) => /\d/.test(pw) },
];

function RequirementRow({ label, met }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`flex-shrink-0 flex items-center justify-center rounded-full transition-colors duration-200 ${
          met
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
            : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
        }`}
        style={{ width: 18, height: 18 }}
      >
        <Check size={11} strokeWidth={3} />
      </span>
      <span
        className={`text-xs transition-colors duration-200 ${
          met
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-slate-500 dark:text-slate-500"
        }`}
      >
        {label}
      </span>
    </li>
  );
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.resetToken;

  const allMet = REQUIREMENTS.every((r) => r.test(password));
  const passwordsMatch = password.length > 0 && confirm === password;
  const canSubmit = allMet && passwordsMatch && !loading;

  if (!resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-center p-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Phiên đổi mật khẩu không hợp lệ!</h2>
          <Link to="/login" className="text-indigo-600 hover:underline">Quay về Đăng nhập</Link>
        </div>
      </div>
    );
  }

  // ĐÃ GỘP 2 HÀM LÀM 1 VÀ XỬ LÝ API THẬT
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!allMet) {
        setError("Please meet all password requirements.");
      } else if (!passwordsMatch) {
        setError("Passwords do not match.");
      }
      return;
    }
    
    setError("");
    setLoading(true);
    try {
      // Gọi API gửi Token và mật khẩu mới
      const res = await authService.resetPassword(resetToken, password);
      
      if (res.data?.success) {
        setDone(true); // Hiển thị màn hình báo thành công màu xanh lá thay vì out ra ngay
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi hệ thống hoặc phiên hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg px-8 py-10"
          style={{ borderRadius: "12px" }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div
              className="bg-indigo-600 flex items-center justify-center"
              style={{ width: 52, height: 52, borderRadius: 12 }}
            >
              <BookOpen className="text-white" size={26} strokeWidth={2} />
            </div>
          </div>

          {done ? (
            /* ── Success state ── */
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle
                  className="text-indigo-600 dark:text-indigo-400"
                  size={48}
                  strokeWidth={1.5}
                />
              </div>
              <h1
                className="text-slate-900 dark:text-white mb-3"
                style={{ fontSize: "1.5rem" }}
              >
                Password reset!
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                Your password has been updated successfully. You can now log in
                with your new credentials.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                style={{ borderRadius: "8px", fontWeight: 600 }}
              >
                Go to login
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <h1
                className="text-slate-900 dark:text-white text-center mb-2"
                style={{ fontSize: "1.5rem" }}
              >
                Create New Password
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center leading-relaxed mb-8">
                Your OTP has been verified. Please enter your new, strong
                password below.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                {/* New Password */}
                <div className="mb-4">
                  <label
                    htmlFor="password"
                    className="block text-sm text-slate-700 dark:text-slate-300 mb-2"
                    style={{ fontWeight: 500 }}
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                      size={16}
                      strokeWidth={1.8}
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      style={{ borderRadius: "8px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-5">
                  <label
                    htmlFor="confirm"
                    className="block text-sm text-slate-700 dark:text-slate-300 mb-2"
                    style={{ fontWeight: 500 }}
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                      size={16}
                      strokeWidth={1.8}
                    />
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        setError("");
                      }}
                      placeholder="Re-enter new password"
                      className={`w-full pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 border focus:outline-none focus:ring-2 focus:border-transparent transition ${
                        confirm.length > 0 && !passwordsMatch
                          ? "border-red-400 dark:border-red-500 focus:ring-red-400"
                          : "border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                      }`}
                      style={{ borderRadius: "8px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirm.length > 0 && !passwordsMatch && (
                    <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                      Passwords do not match.
                    </p>
                  )}
                </div>

                {/* Password requirements */}
                <ul className="space-y-1.5 mb-6 px-1">
                  {REQUIREMENTS.map((req) => (
                    <RequirementRow
                      key={req.label}
                      label={req.label}
                      met={req.test(password)}
                    />
                  ))}
                </ul>

                {/* Global error */}
                {error && (
                  <p className="mb-4 text-sm font-semibold text-red-500 dark:text-red-400 text-center">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-2.5 px-4 text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors"
                  style={{ borderRadius: "8px", fontWeight: 600 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Resetting…
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>

              {/* Back to login */}
              <div className="mt-8 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  <ArrowLeft size={14} />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}