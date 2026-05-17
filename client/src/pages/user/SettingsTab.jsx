/**
 * pages/user/SettingsTab.jsx
 * Kết nối:
 *   authService.updateProfile() → PUT /api/users/profile
 *   authService.changePassword() → PUT /api/users/change-password
 */

import { useState } from "react";
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";

export function SettingsTab() {
  const { user, updateUser } = useAuth();

  const [showPassword,    setShowPassword]    = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name:  user?.full_name  || "",
    phone:      user?.phone      || "",
    avatar_url: user?.avatar_url || "",
  });
  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "", confirm: "" });

  const [profileLoading,  setProfileLoading]  = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMsg,  setProfileMsg]  = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const payload = {};
      if (profileForm.full_name  !== (user?.full_name  || "")) payload.full_name  = profileForm.full_name;
      if (profileForm.phone      !== (user?.phone      || "")) payload.phone      = profileForm.phone;
      if (profileForm.avatar_url !== (user?.avatar_url || "")) payload.avatar_url = profileForm.avatar_url;

      if (!Object.keys(payload).length) {
        setProfileMsg({ type: "info", text: "Không có thay đổi nào để lưu." });
        return;
      }
      const { data } = await authService.updateProfile(payload);
      if (data.success) {
        updateUser(data.data);
        setProfileMsg({ type: "success", text: "Cập nhật thông tin thành công!" });
      }
    } catch (err) {
      setProfileMsg({ type: "error", text: err.response?.data?.message || "Cập nhật thất bại." });
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileMsg(null), 4000);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm) {
      setPasswordMsg({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      const { data } = await authService.changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      if (data.success) {
        setPasswordMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
        setPasswordForm({ old_password: "", new_password: "", confirm: "" });
      }
    } catch (err) {
      setPasswordMsg({ type: "error", text: err.response?.data?.message || "Đổi mật khẩu thất bại." });
    } finally {
      setPasswordLoading(false);
      setTimeout(() => setPasswordMsg(null), 4000);
    }
  };

  const pwStrength = passwordForm.new_password.length;
  const pwColor    = pwStrength >= 12 ? "bg-green-500" : pwStrength >= 8 ? "bg-amber-400" : "bg-red-400";

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : 'U';

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
          <div>
            <p className="text-gray-900 dark:text-gray-100 font-semibold">{user?.full_name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className="inline-block mt-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full capitalize">
              {user?.role}
            </span>
          </div>
        </div>

        <h3 className="text-gray-900 dark:text-gray-100 mb-5 font-semibold">Thông tin cá nhân</h3>

        {profileMsg && (
          <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
            profileMsg.type === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" :
            profileMsg.type === "error"   ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800" :
                                            "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
          }`}>
            {profileMsg.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 font-medium">
                <User className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />Họ và tên
              </label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400 text-sm outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />Số điện thoại
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="0901234567"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 font-medium">URL ảnh đại diện</label>
              <input
                type="url"
                value={profileForm.avatar_url}
                onChange={e => setProfileForm(p => ({ ...p, avatar_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={profileLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm rounded-xl transition-colors shadow-sm font-semibold">
              {profileLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2 font-semibold">
          <Lock className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          Đổi mật khẩu
        </h3>

        {passwordMsg && (
          <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
            passwordMsg.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
          }`}>
            {passwordMsg.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordSave} className="space-y-4 max-w-md">
          {/* Old password */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 font-medium">Mật khẩu hiện tại</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passwordForm.old_password}
                onChange={e => setPasswordForm(p => ({ ...p, old_password: e.target.value }))}
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 font-medium">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.new_password}
                onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                placeholder="Tối thiểu 8 ký tự, 1 chữ hoa, 1 số"
                autoComplete="new-password"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordForm.new_password && (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${pwStrength >= i * 3 ? pwColor : "bg-gray-200 dark:bg-slate-600"}`} />
                ))}
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5 font-medium">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 ${
                passwordForm.confirm && passwordForm.confirm !== passwordForm.new_password
                  ? "border-red-300 dark:border-red-700"
                  : "border-gray-200 dark:border-slate-600 focus:border-blue-500"
              }`}
            />
            {passwordForm.confirm && passwordForm.confirm !== passwordForm.new_password && (
              <p className="text-xs text-red-500 mt-1">Mật khẩu không khớp</p>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordLoading || !passwordForm.old_password || !passwordForm.new_password || passwordForm.new_password !== passwordForm.confirm}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-colors font-semibold"
            >
              {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Cập nhật mật khẩu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}