import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import authService from "../services/authService";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

export default function OtpVerification() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(59);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const toast = useToast();

  const actionType = location.state?.action || "register";

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

  // ----- XỬ LÝ SỰ KIỆN PASTE (CTRL + V) -----
  const handlePaste = (e) => {
    e.preventDefault();
    // Lấy dữ liệu từ clipboard
    const pastedData = e.clipboardData.getData("text");

    // Chỉ lấy các ký tự là số và giới hạn độ dài tối đa là 6
    const numbers = pastedData.replace(/\D/g, "").slice(0, 6);

    if (numbers) {
      const newOtp = [...otp];
      // Rải đều từng số vào mảng newOtp
      for (let i = 0; i < 6; i++) {
        newOtp[i] = numbers[i] || "";
      }
      setOtp(newOtp);

      // Tự động nhảy con trỏ chuột đến ô chưa có số, hoặc ô cuối cùng nếu đã điền full 6 số
      const focusIndex = numbers.length < 6 ? numbers.length : 5;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const handleResend = async () => {
    if (resendLoading) return;
    setResendLoading(true);
    setResendMsg("");
    try {
      if (actionType === "register") {
        await authService.register({ email }); // backend tự gửi lại OTP mới
      } else if (actionType === "forgot_password") {
        await authService.forgotPassword(email);
      }
      setTimer(59);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setResendMsg("A new OTP has been sent to your email.");
      toast.success("Success", "A new OTP has been sent to your email.");
      inputRefs.current[0]?.focus();
    } catch {
      setResendMsg("Failed to resend. Please try again.");
      toast.error("Error", "Failed to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // ----- ĐÃ SỬA: ĐƯA KHỐI CODE BỊ LỖI VÀO TRONG HÀM handleSubmit -----
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6)
      return setError(
        "Please enter a 6-digit code.",
        toast.error("Error", "Please enter a 6-digit code."),
      );

    setLoading(true);
    try {
      if (actionType === "register") {
        // 1. Luồng của Đăng ký
        const res = await authService.verifyOtp(email, otpCode);
        if (res.data?.success)
          toast.success("Success", "OTP verified! Now you can log in.");
        navigate("/login");
      } else if (actionType === "forgot_password") {
        // 2. Luồng của Quên mật khẩu
        const res = await authService.verifyForgotOtp(email, otpCode);
        if (res.data?.success) {
          // Cầm Reset Token bay qua trang Đổi mật khẩu
          toast.success(
            "Success",
            "OTP verified! Now you can reset your password.",
          );
          navigate("/reset-password", {
            state: { resetToken: res.data.resetToken },
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
      toast.error(
        "Error",
        err.response?.data?.message || "Invalid or expired OTP.",
      );
    } finally {
      setLoading(false);
    }
  };
  // ----------------------------------------------------------------------

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070d1b] px-4 transition-colors">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Mail className="h-6 w-6" />
          </div>
        </div>
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
            Verify Email
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400">
            The 6-digit OTP code has been sent to your email:
            <br />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {email}
            </span>
          </p>
        </div>

        {error && (
          <div className="mb-4 text-center text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 py-2 rounded-xl border border-red-200 dark:border-red-500/20">
            {error}
          </div>
        )}

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
                onPaste={handlePaste}
                className="h-11 w-11 rounded-xl border text-center text-base font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-600/60 transition-colors mb-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Confirm Code"
            )}
          </button>
        </form>

        {debugOtp && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <p className="font-semibold">Temporary OTP (dev mode):</p>
            <p>{debugOtp}</p>
          </div>
        )}

        <div className="text-center text-xs text-slate-400">
          <p>
            {timer > 0 ? (
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
               bg-slate-100 dark:bg-slate-800 text-sm font-semibold 
               text-slate-700 dark:text-slate-200"
              >
                <span>Send again in</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  00:{timer.toString().padStart(2, "0")}
                </span>
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 
               rounded-lg bg-indigo-600 text-white text-base font-semibold 
               hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {resendLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  "Send OTP again now"
                )}
              </button>
            )}
          </p>
          {resendMsg && (
            <p
              className={`mt-2 text-xs font-medium ${resendMsg.startsWith("Failed") ? "text-red-400" : "text-emerald-500"}`}
            >
              {resendMsg}
            </p>
          )}
          <button
            onClick={() => navigate("/login")}
            className="mt-5 inline-flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={12} /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
