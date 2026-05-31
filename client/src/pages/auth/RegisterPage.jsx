import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import InputField from "../../components/InputField";
import AuthLayout from "../../layouts/auth/AuthLayout"; 
import { useToast } from "../../context/ToastContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useAuth();
  const toast = useToast();

  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm_password: "", phone: "", role: "user",
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/", { replace: true });
  }, [isLoading, isAuthenticated, navigate]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.full_name.trim()) errs.full_name = "Please enter your full name";
    if (!form.email.trim()) errs.email = "Please enter your email";
    else if (!emailRegex.test(form.email)) errs.email = "Invalid email format";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    else if (!/[A-Z]/.test(form.password)) errs.password = "Password must contain at least one uppercase letter";
    else if (!/[0-9]/.test(form.password)) errs.password = "Password must contain at least one number";
    if (form.password !== form.confirm_password) errs.confirm_password = "Confirm password does not match";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) return setFieldErrors(errs), toast.error("Validation Error", "Please fix the errors in the form.");

    setLoading(true);
    setError("");
    try {
      const response = await authService.register({
        full_name: form.full_name, email: form.email, password: form.password, phone: form.phone || undefined, role: "user",
      });
      toast.success("Success", "Account created successfully! Please check your email for the OTP.");
      navigate("/verify-otp", { state: { email: form.email, debugOtp: response.data?.debugOtp } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      toast.error("Error", err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-slate-900 dark:text-white font-bold text-2xl">Create account</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Register to join the system</p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField name="full_name" label="Full Name *" placeholder="Tony Win" icon={User} value={form.full_name} onChange={handleChange} fieldErrors={fieldErrors} />
        <InputField name="email" label="Email *" placeholder="example@email.com" icon={Mail} type="text" value={form.email} onChange={handleChange} fieldErrors={fieldErrors} />
        <InputField name="phone" label="Phone Number (Optional)" placeholder="0901234567" value={form.phone} onChange={handleChange} fieldErrors={fieldErrors} />
        <InputField name="password" label="Password *" placeholder="Min 8 chars, 1 uppercase, 1 number" icon={Lock} type="password" value={form.password} onChange={handleChange} fieldErrors={fieldErrors} showPass={showPass} setShowPass={setShowPass} />
        <InputField name="confirm_password" label="Confirm Password *" placeholder="Re-enter password" icon={Lock} type="password" value={form.confirm_password} onChange={handleChange} fieldErrors={fieldErrors} showPass={showConfirmPass} setShowPass={setShowConfirmPass} />

        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white rounded-xl text-sm transition-colors mt-2 font-medium shadow-md">
          {loading ? "Creating account..." : <><ArrowRight size={18} /> Create Account</>}
        </button>
      </form>

      <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-6">
        Already have an account?{" "}
        <button type="button" onClick={() => navigate("/login")} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors">
          Sign in
        </button>
      </p>
    </>
  );
}