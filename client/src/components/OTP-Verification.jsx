import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import authService from "../services/authService";
import { useTheme } from "../context/ThemeContext";

export default function OtpVerification() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(59);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  // Đọc email động được chuyển tiếp từ màn hình RegisterPage
  const email = location.state?.email || "your-email@example.com";
  const debugOtp = location.state?.debugOtp;

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) return setError("Vui lòng nhập đủ 6 chữ số.");

    try {
      setLoading(true);
      setError("");
      
      // Gọi API verify OTP lên Backend
      await authService.verifyOtp({ email, otpCode });
      
      // Thành công điều hướng về Login kèm state thông báo
      navigate("/login", { state: { registrationConfirmed: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070d1b] px-4 transition-colors">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Mail className="h-6 w-6" />
          </div>
        </div>
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">Xác thực Email</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400">
            Mã OTP kích hoạt gồm 6 chữ số đã gửi tới hòm thư:<br />
            <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>
          </p>
        </div>

        {error && <div className="mb-4 text-center text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 py-2 rounded-xl border border-red-200 dark:border-red-500/20">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-6 flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-11 w-11 rounded-xl border text-center text-base font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
              />
            ))}
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-600/60 transition-colors mb-4 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Xác nhận mã"}
          </button>
        </form>
        {debugOtp && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <p className="font-semibold">Mã OTP tạm thời (dev mode):</p>
            <p>{debugOtp}</p>
          </div>
        )}

        <div className="text-center text-xs text-slate-400">
          <p>{timer > 0 ? `Gửi lại mã sau 00:${timer.toString().padStart(2, "0")}` : <button className="text-indigo-500 hover:underline">Gửi lại mã ngay</button>}</p>
          <button onClick={() => navigate("/login")} className="mt-5 inline-flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><ArrowLeft size={12} /> Quay về đăng nhập</button>
        </div>
      </div>
    </div>
  );
}