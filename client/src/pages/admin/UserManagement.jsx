import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { 
  Search, Lock, Unlock, ShieldCheck, ShieldOff, UserPlus, 
  Mail, X, Eye, EyeOff, User, Users, UserCheck, UserX, Shield, Phone, Layers
} from "lucide-react";
import adminService from "../../services/adminService";
import InputField from "../../components/InputField";
import Pagination from "../../components/Pagination";
import { useToast } from "../../context/ToastContext";

const avatarColors = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-blue-500 to-cyan-600",
];

const statusConfig = {
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' },
  banned: { label: 'Locked', className: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20' },
};

export default function UserManagement() {
  const {addToast} = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // 1. Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // 2. Gom tham số gửi lên API (Đồng bộ format chữ để Backend dễ map)
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch,
    role: filterRole === "All" ? "" : filterRole.toLowerCase(),
    status: filterStatus === "All" ? "" : filterStatus === "Locked" ? "banned" : "active"
  }), [currentPage, debouncedSearch, filterRole, filterStatus]);

  // 3. Gọi API với useSWR
  const fetcher = async ([, params]) => {
    const response = await adminService.getUsers(params);
    return response.data.data; // Bóc tách dữ liệu { data: [...], pagination: {...} }
  };

  const { data: payload, isValidating, mutate } = useSWR(
    ['/admin/users', queryParams], 
    fetcher, 
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  const usersData = payload?.data || [];
  const totalItems = payload?.pagination?.totalItems || 0;
  const totalPages = payload?.pagination?.totalPages || 1;
  const isInitialLoading = !payload && isValidating;

  // 4. Quay về trang 1 khi lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterRole, filterStatus]);

  const handleChangeRole = async (user, newRole) => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null") || { role: "admin", id: null };
    
    // Check quyền hạn bằng Toast
    if (currentUser.role !== "admin") {
      return addToast({ type: "error", title: "Access Denied", description: "Only admins can change roles." });
    }
    if (currentUser.id && currentUser.id === user.id) {
      return addToast({ type: "warning", title: "Action Blocked", description: "You cannot change your own role." });
    }

    // CHECK ĐIỀU KIỆN SỐ LƯỢNG (Sử dụng biến đếm thật từ DB: adminCount, employeeCount)
    if (newRole === "admin" && adminCount >= 1) {
      return addToast({ type: "error", title: "Limit Exceeded", description: "The system only allows a maximum of 1 active Admin!" });
    }

    if (newRole === "employee" && employeeCount >= 2) {
      return addToast({ type: "error", title: "Limit Exceeded", description: "The system only allows a maximum of 2 active Employees!" });
    }

    const confirmChange = window.confirm(
      `Are you sure you want to change the role of ${user.full_name || "user"} to ${newRole.toUpperCase()}?`
    );
    if (!confirmChange) return;

    try {
      const response = await adminService.updateUserRole(user.id, newRole);
      if (response.data && response.data.success) {
        addToast({ type: "success", title: "Success", description: "User role updated successfully!" });
        mutate();
      } else {
        addToast({ type: "error", title: "Update Failed", description: response.data.message || "Failed to update user role. Please try again." });
      }
    } catch (err) {
      console.error("Error updating user role:", err);
      const serverErrorMessage = err.response?.data?.message || "Cannot connect to server. Please try again later.";
      addToast({ type: "error", title: "Server Error", description: serverErrorMessage });
    }
  };

  const toggleLock = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      mutate(); // Reload trạng thái
    } catch (err) {
      console.error("Error toggling user lock status:", err);
    }
  };

  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.full_name.trim())      errs.full_name = 'Please enter full name';
    if (!formData.email.trim())          errs.email     = 'Please enter email';
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

    // CHECK ĐIỀU KIỆN SỐ LƯỢNG (Sử dụng biến đếm thật từ DB: adminCount, employeeCount)
    if (formData.role === "admin" && adminCount >= 1) {
      return addToast({ type: "error", title: "Limit Exceeded", description: "System has reached the limit of 1 Admin!" });
    }
    if (formData.role === "employee" && employeeCount >= 2) {
      return addToast({ type: "error", title: "Limit Exceeded", description: "System has reached the limit of 2 Employees!" });
    }

    try {
      setIsSubmitting(true);
      const { confirm_password, ...submitData } = formData;
      const response = await adminService.addUser(submitData);
      
      if (response.data && response.data.success) {
        addToast({ type: "success", title: "Success", description: "User added successfully!" });
        setIsAddModalOpen(false); 
        setFormData({ full_name: "", email: "", password: "", confirm_password: "", phone: "", role: "user" }); 
        mutate(); 
      }
    } catch (error) {
      addToast({ type: "error", title: "Error", description: error.response?.data?.message || "Cannot add user. Please try again later." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe Stats Calculation
  const {
    activeCount = 0,
    adminCount = 0,
    employeeCount = 0,
    lockedCount = 0
  } = payload?.stats || {};

  // =========================================================================
  // 2. GIAO DIỆN PREMIUM (CHỐNG LAG VÀ HIỂN THỊ MOBILE HOÀN HẢO)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 px-4 py-6 sm:px-6 lg:px-8 font-sans antialiased transition-colors duration-200 pb-24">
      <div className="mx-auto max-w-[1400px] space-y-6">
        
        {/* PREMIUM HEADER */}
        <header className="rounded-3xl border border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-[#0d1527]/80 backdrop-blur-md p-5 sm:p-6 shadow-xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between transition-colors">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Access Control</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">User Management</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex items-center gap-2">
              <Users size={14} className="text-indigo-500" />
              {totalItems} registered accounts in the system.
            </p>
          </div>
          
          <button 
            onClick={() => { setFieldErrors({}); setIsAddModalOpen(true); }}
            className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
          >
            <UserPlus size={18} strokeWidth={3} /> Add New User
          </button>
        </header>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0d1527]/60 border border-slate-200 dark:border-slate-800/60 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><UserCheck size={20} /></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Users</p>
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{activeCount}</p>
          </div>
          
          <div className="bg-white dark:bg-[#0d1527]/60 border border-slate-200 dark:border-slate-800/60 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><ShieldCheck size={20} /></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admins</p>
            </div>
            <div className="flex items-end gap-1">
              <p className="text-3xl font-black text-slate-800 dark:text-white">{adminCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0d1527]/60 border border-slate-200 dark:border-slate-800/60 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400"><Shield size={20} /></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Employees</p>
            </div>
            <div className="flex items-end gap-1">
              <p className="text-3xl font-black text-slate-800 dark:text-white">{employeeCount}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0d1527]/60 border border-slate-200 dark:border-slate-800/60 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"><UserX size={20} /></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Locked</p>
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{lockedCount}</p>
          </div>
        </div>

        {/* BỘ LỌC VÀ TÌM KIẾM */}
        <div className="flex flex-col gap-3">
          <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0d1527]/50 p-2 sm:p-3 shadow-sm transition-colors">
            <span className="absolute inset-y-0 left-4 sm:left-5 flex items-center text-slate-400">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..." 
              className="w-full pl-10 sm:pl-12 pr-4 py-2 bg-transparent text-sm font-medium focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none snap-x touch-pan-x w-full sm:w-auto">
              {["All", "Admin", "Employee", "User"].map((r) => (
                <button key={r} onClick={() => setFilterRole(r)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start ${
                    filterRole === r 
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" 
                      : "bg-white dark:bg-[#0d1527]/50 border border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {r === "All" ? "All Roles" : r}
                </button>
              ))}
            </div>

            <div className="w-full h-px sm:w-px sm:h-6 bg-slate-200 dark:bg-slate-800 hidden sm:block shrink-0" />

            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none snap-x touch-pan-x w-full sm:w-auto">
              {["All", "Active", "Locked"].map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start ${
                    filterStatus === s 
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                      : "bg-white dark:bg-[#0d1527]/50 border border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {s === "All" ? "All Status" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LOADING & EMPTY STATE */}
        {isInitialLoading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#0d1527]/40 rounded-3xl border border-slate-200 dark:border-slate-800/60">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4" />
            <p className="text-slate-500 font-medium text-sm">Loading users data...</p>
          </div>
        ) : usersData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-[#0d1527]/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <UserX size={48} strokeWidth={1} className="text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-slate-900 dark:text-white font-bold mb-1">No Users Found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">No accounts match your filters or search keywords.</p>
          </div>
        ) : (
          <div className={`transition-opacity duration-200 ${isValidating ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {/* VIEW MOBILE */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
              {usersData.map((user, idx) => {
                const colorGradient = avatarColors[idx % avatarColors.length];
                const isBanned = user.status === "banned";
                const statusData = statusConfig[isBanned ? 'banned' : 'active'];

                return (
                  <div key={user.id} className={`bg-white dark:bg-[#0d1527] rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col gap-3 transition-opacity ${isBanned ? 'opacity-60 grayscale-[20%]' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center text-white text-sm font-black shrink-0 shadow-md`}>
                        {user.full_name ? user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : <User size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{user.full_name || "Unknown User"}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <Mail size={12} className="shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {user.id}</p>
                      </div>
                    </div>

                    <div className="h-px w-full bg-slate-100 dark:bg-slate-800/80" />

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col gap-1.5">
                        <select 
                          value={user.role || "user"} 
                          onChange={(e) => handleChangeRole(user, e.target.value)}
                          disabled={isBanned}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold focus:outline-none cursor-pointer border ${
                            user.role === "admin" 
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400" 
                              : user.role === "employee"
                              ? "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-400"
                              : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-[#0a101f] dark:border-slate-700 dark:text-slate-300"
                          } disabled:opacity-50 appearance-none`}
                        >
                          <option value="admin">Admin</option>
                          <option value="employee">Employee</option>
                          <option value="user">User</option>
                        </select>

                        <span className={`inline-flex w-fit items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${statusData.className}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isBanned ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                          {statusData.label}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Borrows: {user.total_borrows || 0}</span>
                        <button 
                          onClick={() => toggleLock(user.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            isBanned 
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                              : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                          }`}
                        >
                          {isBanned ? <Unlock size={12} /> : <Lock size={12} />}
                          {isBanned ? 'Unlock' : 'Lock'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VIEW DESKTOP */}
            <div className="hidden sm:block bg-white dark:bg-[#0d1527]/60 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px] table-fixed">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0a101f]/50 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6 w-[23%]">User Info</th>
                      <th className="py-4 px-6 w-[23%]">Contact</th>
                      <th className="py-4 px-6 w-[15%]">Access Role</th>
                      <th className="py-4 px-6 w-[13%] text-center">Status</th>
                      <th className="py-4 px-6 w-[13%] text-center">Borrows</th>
                      <th className="py-4 px-6 w-[13%] text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                    {usersData.map((user, idx) => {
                      const colorGradient = avatarColors[idx % avatarColors.length];
                      const isBanned = user.status === "banned";
                      const statusData = statusConfig[isBanned ? 'banned' : 'active'];
                      
                      return (
                        <tr key={user.id} className={`group hover:bg-slate-50/50 dark:hover:bg-[#10192e]/40 transition-colors ${isBanned ? 'opacity-60 grayscale-[20%]' : ''}`}>
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorGradient} flex items-center justify-center font-black text-white text-xs shadow-md shrink-0`}>
                                {user.full_name ? user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : <User size={14} />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.full_name || "Unknown User"}</p>
                                <p className="text-[11px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">ID: {user.id}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-6 text-slate-600 dark:text-slate-300">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Mail size={13} className="shrink-0" /> <span className="truncate max-w-[180px]">{user.email}</span></div>
                              {user.phone && <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500"><Phone size={13} className="shrink-0" /> <span>{user.phone}</span></div>}
                            </div>
                          </td>

                          <td className="py-3 px-6">
                            <select 
                              value={user.role || "user"} 
                              onChange={(e) => handleChangeRole(user, e.target.value)}
                              disabled={isBanned}
                              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold focus:outline-none cursor-pointer transition-all ${
                                user.role === "admin" 
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400" 
                                  : user.role === "employee"
                                  ? "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-400"
                                  : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-[#0a101f] dark:border-slate-700 dark:text-slate-300"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <option value="admin">Admin</option>
                              <option value="employee">Employee</option>
                              <option value="user">User</option>
                            </select>
                          </td>

                          <td className="py-3 px-6 text-center">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${statusData.className}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${isBanned ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} /> 
                              {statusData.label}
                            </span>
                          </td>
                          
                          <td className="py-3 px-6 text-center">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {user.total_borrows || 0}
                            </span>
                          </td>

                          <td className="py-3 px-6 text-right">
                            <button 
                              onClick={() => toggleLock(user.id)}
                              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all active:scale-95 ${
                                user.status === "active" 
                                  ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100/70"
                                  : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/70"
                              }`}
                            >
                              {user.status === "active" ? (
                                <><Lock size={13} /> Lock Access</>
                              ) : (
                                <><Unlock size={13} /> Unlock Access</>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* COMPONENT PHÂN TRANG */}
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />

          </div>
        )}

        {/* MODAL THÊM USER */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
            <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"><UserPlus size={20} /></div>
                  <div>
                    <h2 className="text-slate-900 dark:text-white font-black text-lg">Add New User</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Create a new account manually</p>
                  </div>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={18} /></button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <InputField name="full_name" label="Full Name *" placeholder="e.g. John Doe" icon={User} value={formData.full_name} onChange={handleFormChange} fieldErrors={fieldErrors} />
                <InputField name="email" type="email" label="Email Address *" placeholder="john@example.com" icon={Mail} value={formData.email} onChange={handleFormChange} fieldErrors={fieldErrors} />
                <InputField name="phone" type="tel" label="Phone Number" placeholder="+1 234 567 890" icon={Phone} value={formData.phone} onChange={handleFormChange} fieldErrors={{}} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField name="password" type={showPass ? 'text' : 'password'} label="Password *" placeholder="••••••••" icon={Lock} value={formData.password} onChange={handleFormChange} fieldErrors={fieldErrors} onToggleVisibility={() => setShowPass(!showPass)} showVisibilityToggle={true} isVisible={showPass} />
                  <InputField name="confirm_password" type={showConfirmPass ? 'text' : 'password'} label="Confirm Password *" placeholder="••••••••" icon={Lock} value={formData.confirm_password} onChange={handleFormChange} fieldErrors={fieldErrors} onToggleVisibility={() => setShowConfirmPass(!showConfirmPass)} showVisibilityToggle={true} isVisible={showConfirmPass} />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Access Role *</label>
                  <div className="relative">
                    <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <select name="role" value={formData.role} onChange={handleFormChange}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0a101f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="user">User</option>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </form>

              <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080d1a] text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  onClick={handleAddSubmit}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-black shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 flex justify-center items-center"
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}