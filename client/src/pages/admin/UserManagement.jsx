import { useState, useEffect } from "react";
import { getUsers, toggleUserStatus, deleteUser } from "../../services/adminService";

// Badge trạng thái tài khoản
const StatusBadge = ({ isActive }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
    ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
    {isActive ? "Hoạt động" : "Bị khóa"}
  </span>
);

// Avatar chữ cái đầu
const Avatar = ({ name }) => (
  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
    {name ? name[0].toUpperCase() : "?"}
  </div>
);

export default function UserManagement() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter]   = useState("");
  const [reload, setReload] = useState(0);
  // Modal xác nhận
  const [confirmModal, setConfirmModal] = useState(null);
  // { type: "lock"|"unlock"|"delete", userId, userName }

  // ── Fetch users ──────────────────────────────────────────
useEffect(() => {
  let cancelled = false; // tránh set state khi component unmount

  const load = async () => {
    try {
      setLoading(true);
      const res = await getUsers({ page, limit: 10, search, role: roleFilter });
      if (!cancelled) {
        setUsers(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error("fetchUsers error:", err);
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  load();
  return () => { cancelled = true; }; // cleanup
}, [page, search, roleFilter, reload]);


  // ── Xử lý tìm kiếm (nhấn Enter hoặc nút Search) ─────────
  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  // ── Xử lý action trong modal ─────────────────────────────
  const handleConfirm = async () => {
    const { type, userId } = confirmModal;
    try {
      if (type === "lock")   await toggleUserStatus(userId, false);
      if (type === "unlock") await toggleUserStatus(userId, true);
      if (type === "delete") await deleteUser(userId);
      setConfirmModal(null);
      setReload(r => r + 1); // trigger reload user list
    } catch (err) {
      console.error("Action error:", err);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Tiêu đề ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng cộng {total} thành viên</p>
        </div>
      </div>

      {/* ── Thanh filter + search ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc email..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        >
          <option value="">Tất cả role</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          🔍 Tìm kiếm
        </button>
      </div>

      {/* ── Bảng user ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Người dùng</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Ngày tham gia</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                        <div className="h-4 bg-gray-200 rounded w-32" />
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-40" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-5 bg-gray-200 rounded w-20 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><div className="h-7 bg-gray-200 rounded w-24 mx-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} />
                        <span className="font-medium text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{user.email}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge isActive={user.is_active} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* Nút khóa / mở khóa */}
                        <button
                          onClick={() => setConfirmModal({
                            type: user.is_active ? "lock" : "unlock",
                            userId: user.id,
                            userName: user.name,
                          })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition
                            ${user.is_active
                              ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                              : "bg-green-100 text-green-600 hover:bg-green-200"
                            }`}
                        >
                          {user.is_active ? "🔒 Khóa" : "🔓 Mở"}
                        </button>
                        {/* Nút xóa */}
                        <button
                          onClick={() => setConfirmModal({
                            type: "delete",
                            userId: user.id,
                            userName: user.name,
                          })}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 transition"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>Trang {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                ← Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-semibold text-gray-800 mb-2">
              {confirmModal.type === "delete" ? "⚠️ Xác nhận xóa" :
               confirmModal.type === "lock"   ? "🔒 Xác nhận khóa" : "🔓 Xác nhận mở khóa"}
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {confirmModal.type === "delete"
                ? `Bạn chắc chắn muốn xóa tài khoản của "${confirmModal.userName}"? Hành động này không thể hoàn tác.`
                : confirmModal.type === "lock"
                ? `Khóa tài khoản "${confirmModal.userName}"? Người dùng sẽ không thể đăng nhập.`
                : `Mở khóa tài khoản "${confirmModal.userName}"?`
              }
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg text-sm text-white font-medium transition
                  ${confirmModal.type === "delete" ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}