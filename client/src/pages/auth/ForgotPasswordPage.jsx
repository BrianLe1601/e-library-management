import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, BookOpen, ArrowLeft, CheckCircle } from "lucide-react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div
          className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 px-8 py-10"
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

          {submitted ? (
            /* Success state */
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="text-indigo-600 dark:text-indigo-400" size={48} strokeWidth={1.5} />
              </div>
              <h1 className="text-slate-900 dark:text-white mb-3" style={{ fontSize: "1.5rem" }}>
                Check your inbox
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                We've sent password reset instructions to{" "}
                <span className="text-slate-700 dark:text-slate-300" style={{ fontWeight: 600 }}>
                  {email}
                </span>
                . Please check your spam folder if you don't see it within a
                few minutes.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                style={{ fontWeight: 500 }}
              >
                <ArrowLeft size={15} />
                Back to login
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <h1
                className="text-slate-900 dark:text-white text-center mb-2"
                style={{ fontSize: "1.5rem" }}
              >
                Forgot your password?
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center leading-relaxed mb-8">
                Enter your email address and we will send you instructions to
                reset your password.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                {/* Email field */}
                <div className="mb-6">
                  <label
                    htmlFor="email"
                    className="block text-sm text-slate-700 dark:text-slate-300 mb-2"
                    style={{ fontWeight: 500 }}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                      size={17}
                      strokeWidth={1.8}
                    />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500 focus:border-transparent transition"
                      style={{ borderRadius: "8px" }}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2.5 px-4 text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors"
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
                      Sending…
                    </span>
                  ) : (
                    "Send Reset Link"
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
