import { useState } from "react";
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export function SettingsTab() {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "John Doe",
    email: "john.doe@university.edu",
    phone: "+1 (555) 234-5678",
    studentId: "STU-2024-001",
  });
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    dueDateReminders: true,
    newArrivals: true,
    fineAlerts: true,
    emailNotifications: false,
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    setPasswordSaved(true);
    setPasswordForm({ current: "", new: "", confirm: "" });
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center text-white text-xl" style={{ fontWeight: 700 }}>
            JD
          </div>
          <div>
            <p className="text-gray-900 dark:text-gray-100" style={{ fontWeight: 600 }}>John Doe</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">john.doe@university.edu</p>
            <span className="inline-block mt-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              Student Member
            </span>
          </div>
          <button className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-lg transition-colors">
            Change Photo
          </button>
        </div>

        <h3 className="text-gray-900 dark:text-gray-100 mb-5">Personal Information</h3>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5" style={{ fontWeight: 500 }}>
                <User className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5" style={{ fontWeight: 500 }}>
                <Mail className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
                Email Address
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5" style={{ fontWeight: 500 }}>
                <Phone className="w-3.5 h-3.5 inline mr-1.5 text-gray-400" />
                Phone Number
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5" style={{ fontWeight: 500 }}>
                ID
              </label>
              <input
                type="text"
                value={profileForm.studentId}
                readOnly
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400 text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            {profileSaved && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Profile updated successfully!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded-xl transition-colors shadow-sm"
                style={{ fontWeight: 600 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          Change Password
        </h3>
        <form onSubmit={handlePasswordSave} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5" style={{ fontWeight: 500 }}>
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5" style={{ fontWeight: 500 }}>
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordForm.new && (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      passwordForm.new.length >= i * 3
                        ? passwordForm.new.length >= 12
                          ? "bg-green-500"
                          : passwordForm.new.length >= 8
                          ? "bg-amber-400"
                          : "bg-red-400"
                        : "bg-gray-200 dark:bg-slate-600"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5" style={{ fontWeight: 500 }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              placeholder="Confirm new password"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 ${
                passwordForm.confirm && passwordForm.confirm !== passwordForm.new
                  ? "border-red-300 dark:border-red-700"
                  : "border-gray-200 dark:border-slate-600 focus:border-blue-500"
              }`}
            />
            {passwordForm.confirm && passwordForm.confirm !== passwordForm.new && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            {passwordSaved && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Password changed successfully!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={!passwordForm.current || !passwordForm.new || passwordForm.new !== passwordForm.confirm}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-colors"
                style={{ fontWeight: 600 }}
              >
                Update Password
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-gray-900 dark:text-gray-100 mb-5">Notification Preferences</h3>
        <div className="space-y-4">
          {[
            { key: "dueDateReminders", label: "Due date reminders", desc: "Get reminded when books are due soon" },
            { key: "newArrivals", label: "New arrivals in my categories", desc: "Notifications when new books are added" },
            { key: "fineAlerts", label: "Fine alerts", desc: "Alerts when fines are charged" },
            { key: "emailNotifications", label: "Email notifications", desc: "Receive notifications via email" },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
              <div>
                <p className="text-sm text-gray-900 dark:text-gray-100" style={{ fontWeight: 500 }}>
                  {pref.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{pref.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifPrefs((prev) => ({ ...prev, [pref.key]: !prev[pref.key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notifPrefs[pref.key] ? "bg-blue-700" : "bg-gray-200 dark:bg-slate-600"
                }`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifPrefs[pref.key] ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
