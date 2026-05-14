import React, { useState } from "react";
import {
  Search,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldOff,
  UserPlus,
  MoreVertical,
  Mail,
  Hash,
} from "lucide-react";

const initialUsers = [
  {
    id: "USR-001",
    name: "Alice Johnson",
    email: "alice@email.com",
    role: "admin",
    status: "active",
    joined: "2024-01-15",
    borrows: 12,
  },
  {
    id: "USR-002",
    name: "Bob Martinez",
    email: "bob@email.com",
    role: "user",
    status: "active",
    joined: "2024-02-20",
    borrows: 7,
  },
  {
    id: "USR-003",
    name: "Chloe Davis",
    email: "chloe@email.com",
    role: "user",
    status: "locked",
    joined: "2024-03-05",
    borrows: 3,
  },
  {
    id: "USR-004",
    name: "David Kim",
    email: "david@email.com",
    role: "user",
    status: "active",
    joined: "2024-03-18",
    borrows: 21,
  },
  {
    id: "USR-005",
    name: "Emma Wilson",
    email: "emma@email.com",
    role: "admin",
    status: "active",
    joined: "2024-04-02",
    borrows: 5,
  },
  {
    id: "USR-006",
    name: "Frank Lee",
    email: "frank@email.com",
    role: "user",
    status: "locked",
    joined: "2024-04-11",
    borrows: 0,
  },
  {
    id: "USR-007",
    name: "Grace Nguyen",
    email: "grace@email.com",
    role: "user",
    status: "active",
    joined: "2024-05-22",
    borrows: 9,
  },
  {
    id: "USR-008",
    name: "Henry Brown",
    email: "henry@email.com",
    role: "user",
    status: "active",
    joined: "2024-06-01",
    borrows: 14,
  },
  {
    id: "USR-009",
    name: "Iris Chen",
    email: "iris@email.com",
    role: "admin",
    status: "active",
    joined: "2024-06-14",
    borrows: 2,
  },
  {
    id: "USR-010",
    name: "Jack Smith",
    email: "jack@email.com",
    role: "user",
    status: "active",
    joined: "2024-07-03",
    borrows: 18,
  },
];

const avatarColors = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-blue-500 to-cyan-600",
];

export default function UserManagement() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchRole =
      filterRole === "All" || u.role === filterRole.toLowerCase();
    const matchStatus =
      filterStatus === "All" || u.status === filterStatus.toLowerCase();
    return matchSearch && matchRole && matchStatus;
  });

  const handleChangeRole = (user) => {
    const currentUser =
      JSON.parse(localStorage.getItem("user") || "null") || {
        role: "admin",
        id: null,
      };

    // Logic: Chỉ Admin/Employee mới được chỉnh. Nếu không có người dùng đăng nhập,
    // ta sẽ giả định quyền admin cho mục đích demo / local testing.
    if (currentUser.role !== "admin" && currentUser.role !== "employee") {
      return;
    }

    // Không cho phép tự thay đổi quyền của chính mình trong quản lý người dùng.
    if (currentUser.id && currentUser.id === user.id) {
      window.alert("Bạn không thể thay đổi quyền của chính mình.");
      return;
    }

    const newRole = user.role === "admin" ? "user" : "admin";

    const confirmChange = window.confirm(
      `Bạn có chắc chắn muốn thay đổi quyền của ${user.name} từ ${user.role.toUpperCase()} thành ${newRole.toUpperCase()} không?`,
    );

    if (confirmChange) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
      );
      // Sau này tại đây bạn sẽ gọi API: axios.put(`/api/admin/users/${user.id}/role`, { role: newRole })
    }
  };

  const toggleLock = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "locked" ? "active" : "locked" }
          : u,
      ),
    );
  };

  const activeCount = users.filter((u) => u.status === "active").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const lockedCount = users.filter((u) => u.status === "locked").length;

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
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-colors shrink-0">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
            Active Users
          </p>
          <p className="text-slate-900 dark:text-white text-2xl mt-1 font-semibold">
            {activeCount}
          </p>
          <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-1 rounded-full bg-emerald-500"
              style={{ width: `${(activeCount / users.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
            Admins
          </p>
          <p className="text-slate-900 dark:text-white text-2xl mt-1 font-semibold">
            {adminCount}
          </p>
          <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-1 rounded-full bg-indigo-500"
              style={{ width: `${(adminCount / users.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
            Locked
          </p>
          <p className="text-slate-900 dark:text-white text-2xl mt-1 font-semibold">
            {lockedCount}
          </p>
          <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-1 rounded-full bg-red-500"
              style={{ width: `${(lockedCount / users.length) * 100}%` }}
            />
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
          {["All", "Admin", "User"].map((r) => (
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
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">
                  User
                </th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">
                  User ID
                </th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">
                  Email
                </th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">
                  Role
                </th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">
                  Borrows
                </th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr
                  key={user.id}
                  className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${user.status === "locked" ? "opacity-70" : ""}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-xs font-semibold shrink-0`}
                      >
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-slate-800 dark:text-slate-100 text-sm font-medium">
                          {user.name}
                        </p>
                        <p className="text-slate-400 text-xs">
                          Joined {user.joined}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-indigo-400">
                      {user.id}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                      <Mail size={12} />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleChangeRole(user)}
                      // Logic: Nếu không phải admin thì không cho bấm (cursor-not-allowed)
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${
                        user.role === "admin"
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-purple-500/30"
                      }`}
                      title="Click to change role"
                    >
                      {user.role === "admin" ? (
                        <ShieldCheck size={11} />
                      ) : (
                        <ShieldOff size={11} />
                      )}
                      {user.role === "admin" ? "Admin" : "User"}
                    </button>
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
                      {user.borrows}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleLock(user.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        user.status === "locked"
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      }`}
                    >
                      {user.status === "locked" ? (
                        <Unlock size={12} />
                      ) : (
                        <Lock size={12} />
                      )}
                      {user.status === "locked" ? "Unlock" : "Lock"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-slate-400 text-sm"
                  >
                    No users found matching your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing {filtered.length} of {users.length} users
          </p>
          <div className="flex gap-1">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className={`w-7 h-7 rounded-lg text-xs ${p === 1 ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
