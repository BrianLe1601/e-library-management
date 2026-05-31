import { useState } from "react";
import { Mail, BookOpen, CheckCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService"; 
import { useToast } from "../../context/ToastContext";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const toast = useToast();

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    
    try {
      const res = await authService.forgotPassword(email);
      if (res.data?.success) {
        onClose();
        toast.success("Success", "A 6-digit OTP has been sent to your email. Please check your email.");
        navigate("/verify-otp", { 
          state: { 
            email: email, 
            action: 'forgot_password', 
            debugOtp: res.data.debugOtp 
          } 
        });
      }
    } catch (error) {
      toast.error("Error", error.response?.data?.message || "Error sending to your email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Hàm reset trạng thái và đóng Modal
  const handleCloseModal = () => {
    onClose();
    // Đợi hiệu ứng đóng xong (tùy chọn) rồi reset form
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 300);
  };

  return (
    // Lớp phủ nền mờ đằng sau (Backdrop)
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      onClick={handleCloseModal} // Bấm ra ngoài để đóng
    >
      {/* Khối Modal chính */}
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 transform transition-all"
        onClick={(e) => e.stopPropagation()} // Ngăn chặn sự kiện click lan ra ngoài backdrop
      >
        {/* Nút X để đóng */}
        <button
          onClick={handleCloseModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 flex items-center justify-center w-12 h-12 rounded-xl shadow-md shadow-indigo-500/20">
            <BookOpen className="text-white" size={24} strokeWidth={2} />
          </div>
        </div>

        {submitted ? (
          /* Trạng thái thành công */
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-indigo-500 dark:text-indigo-400" size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Check your inbox
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
              We've sent password reset instructions to{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>. 
              Please check your spam folder if you don't see it.
            </p>
            <button
              onClick={handleCloseModal}
              className="w-full py-2.5 px-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl transition-colors"
            >
              Back to Login
            </button>
          </div>
        ) : (
          /* Trạng thái Form */
          <div className="animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
              Forgot password?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
              Enter your email address and we will send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}