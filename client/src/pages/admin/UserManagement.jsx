import React, { useState, useEffect } from "react";
import { Search,Lock,Unlock,ShieldCheck,ShieldOff,UserPlus,
  Mail,X,Eye,EyeOff,User } from "lucide-react";
import { getUsers, toggleUserStatus, updateUserRole, addUser } from "../../services/adminService";
import InputField from "../../components/InputField";

const avatarColors = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-blue-500 to-cyan-600",
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    full_name: "", email: "", password: "", confirm_password: "", phone: "", role: "user"
  });

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      console.log("Fetched users:", response.data);
      const serverData = response.data.data;
      console.log("Server data:", serverData);
      if(Array.isArray(serverData)){
        setUsers(serverData);
      } else{
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  },[]);

  useEffect(() =>{
    const searchLower = search.toLowerCase();
    const result = users.filter((u) => {
      const matchSearch = 
        (u.full_name || "").toLowerCase().includes(searchLower) ||
        (u.email || "").toLowerCase().includes(searchLower) ||
        String(u.id || "").toLowerCase().includes(searchLower);
      
      const matchRole = filterRole === "All" || (u.role || "").toLowerCase() === filterRole.toLowerCase();
      const targetStatus = filterStatus === "Locked" ? "banned" : filterStatus.toLowerCase();
      const matchStatus = filterStatus === "All" || (u.status || "").toLowerCase() === targetStatus;
      
      return matchSearch && matchRole && matchStatus;
    });

    setFilteredUsers(result);
  }, [search, filterRole, filterStatus, users]);

  const handleChangeRole = async (user, newRole) => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null") || { role: "admin", id: null };
    if (currentUser.role !== "admin") return window.alert("Only admins can change roles.");
    if (currentUser.id && currentUser.id === user.id) return window.alert("You cannot change your own role.");

    if (newRole === "admin") {
      const currentAdmins = users.filter(u => u.role === "admin" && u.id !== user.id).length;
      if (currentAdmins >= 1) {
        window.alert("The system only allows a maximum of 1 active Admin!");
        return;
      }
    }

    if (newRole === "employee") {
      const currentEmployees = users.filter(u => u.role === "employee" && u.id !== user.id).length;
      if (currentEmployees >= 2) {
        window.alert("The system only allows a maximum of 2 active Employees!");
        return;
      }
    }

    const confirmChange = window.confirm(
      `Are you sure you want to change the role of ${user.full_name || "user"} to ${newRole.toUpperCase()}?`
    );

    if(!confirmChange) return;

    try{
      const response = await updateUserRole(user.id, newRole);
      if(response.data && response.data.success){
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
        );
      } else{
        window.alert(response.data.message || "Failed to update user role. Please try again."); 
      }
    } catch (err) {
      console.error("Error updating user role:", err);

      // Đọc thông điệp lỗi chi tiết trả về từ Backend thông qua Axios (nếu có)
      const serverErrorMessage = error.response?.data?.message || "Cannot connect to server. Please try again later.";
      window.alert(`Error: ${serverErrorMessage}`);
    }
  };

  const toggleLock = async (userId) => {
    try {
      await toggleUserStatus(userId);

      setUsers(prevUsers => prevUsers.map(user => {
        if (user.id === userId){
          const nextStatus = user.status === "active" ? "banned" : "active";
          return { ...user, status: nextStatus };
        }
        return user;
      }));
    } catch (err) {
      console.error("Error toggling user lock status:", err);
    }
  };

  // ─── XỬ LÝ SUBMIT MODAL ADD USER ────────────────────────────────
  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.full_name.trim())      errs.full_name = 'Please enter your full name';
    if (!formData.email.trim())          errs.email     = 'Please enter your email';
    if (formData.password.length < 8)   errs.password  = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(formData.password)) errs.password = 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(formData.password)) errs.password = 'Password must contain at least one digit';
    if (formData.password !== formData.confirm_password) errs.confirm_password = 'Password confirmation does not match';
    return errs;
  };
  
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { 
      setFieldErrors(errs); 
      return; 
    }

    if (formData.role === "admin" && users.filter(u => u.role === "admin").length >= 1) {
      return alert("System has reached the limit of 1 Admin!");
    }
    if (formData.role === "employee" && users.filter(u => u.role === "employee").length >= 2) {
      return alert("System has reached the limit of 2 Employees!");
    }

    try {
      setIsSubmitting(true);
      // Loại bỏ trường confirm_password trước khi gửi lên API
      const { confirm_password, ...submitData } = formData;
      const response = await addUser(submitData);
      
      if (response.data && response.data.success) {
        alert("User added successfully!");
        setIsAddModalOpen(false); 
        setFormData({ full_name: "", email: "", password: "", confirm_password: "", phone: "", role: "user" }); 
        fetchUsersData(); 
      }
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || "Cannot add user. Please try again later."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = users.filter((u) => u.status === "active").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const employeeCount = users.filter((u) => u.role === "employee").length;
  const lockedCount = users.filter((u) => u.status === "banned").length;

  if (loading) {return <div className="text-center p-10 text-slate-400">Loading users...</div>}
  if (error) {return <div className="text-center p-10 text-red-500">{error}</div>}

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {users.length} registered users
          </p>
        </div>
        <button
          onClick={() => {
            setFieldErrors({});
            setIsAddModalOpen(true)}}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-colors shrink-0">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Active Users</p>
          <p className="text-slate-900 dark:text-white text-2xl mt-1 font-semibold">{activeCount}</p>
          <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-slate-700">
            <div className="h-1 rounded-full bg-emerald-500" style={{ width: `${(activeCount / Math.max(users.length, 1)) * 100}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Admins</p>
          <p className="text-slate-900 dark:text-white text-2xl mt-1 font-semibold">{adminCount}/1</p>
          <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-slate-700">
            <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${(adminCount / 1) * 100}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Employees</p>
          <p className="text-slate-900 dark:text-white text-2xl mt-1 font-semibold">{employeeCount}/2</p>
          <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-slate-700">
            <div className="h-1 rounded-full bg-blue-500" style={{ width: `${(employeeCount / 2) * 100}%` }} />
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Locked</p>
          <p className="text-slate-900 dark:text-white text-2xl mt-1 font-semibold">{lockedCount}</p>
          <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-slate-700">
            <div className="h-1 rounded-full bg-red-500" style={{ width: `${(lockedCount / Math.max(users.length, 1)) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Admin", "Employee", "User"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterRole === r
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {r}
            </button>
          ))}
          <div className="w-px bg-slate-200 dark:bg-slate-700" />
          {["All", "Active", "Locked"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterStatus === s
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">User</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">User ID</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Email</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Role</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Borrows</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <tr
                  key={user.id}
                  className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${user.status === "banned" ? "opacity-70" : ""}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-semibold shrink-0`}
                      >
                        {user.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-100 text-sm font-medium">
                          {user.full_name}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {user.created_at ? `Joined ${new Date(user.created_at).toLocaleDateString("vi-VN")}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-indigo-400">{user.id}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                      <Mail size={12} />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={user.role || "user"}
                      onChange={(e) => handleChangeRole(user, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold outline-none cursor-pointer border ${
                        user.role === "admin"
                          ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400"
                          : user.role === "employee"
                          ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
                          : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <option value="admin">Admin</option>
                      <option value="employee">Employee</option>
                      <option value="user">User</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs ${
                        user.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-emerald-400" : "bg-red-400"}`}
                      />
                      {user.status === "active" ? "Active" : "Locked"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-slate-600 dark:text-slate-300 text-sm">
                      {user.total_borrows || 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleLock(user.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        user.status === "banned"
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      }`}
                    >
                      {user.status === "banned" ? <Unlock size={12} /> : <Lock size={12} />}
                      {user.status === "banned" ? "Unlock" : "Lock"}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">No users found matching your search</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </div>
      {/* ─── MODAL ADD USER ───────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New User</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <InputField name="full_name" label="Full Name *" placeholder="Ex: John Doe" icon={User} value={formData.full_name} onChange={handleFormChange} fieldErrors={fieldErrors} />
              <InputField name="email" label="Email *" placeholder="email@example.com" icon={Mail} type="email" value={formData.email} onChange={handleFormChange} fieldErrors={fieldErrors} />

              <InputField 
                name="password" label="Initial Password *" placeholder="At least 8 characters, 1 uppercase, 1 number" icon={Lock} type="password" 
                value={formData.password} onChange={handleFormChange} fieldErrors={fieldErrors} showPass={showPass} setShowPass={setShowPass} 
              />
              
              <InputField 
                name="confirm_password" label="Confirm Password *" placeholder="Re-enter password" icon={Lock} type="password" 
                value={formData.confirm_password} onChange={handleFormChange} fieldErrors={fieldErrors} showPass={showConfirmPass} setShowPass={setShowConfirmPass} 
              />

              <div className="grid grid-cols-2 gap-4">
                <InputField name="phone" label="Phone Number" placeholder="09xxxx..." value={formData.phone} onChange={handleFormChange} fieldErrors={fieldErrors} />
                
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Role</label>
                  <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 cursor-pointer">
                    <option value="user">User</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                {isSubmitting ? "Processing..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
