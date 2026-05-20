/**
 * pages/user/BorrowingTab.jsx
 * Kết nối:
 *   borrowService.getHistory() → GET /api/borrow/history
 *   borrowService.returnBook() → PUT /api/borrow/return/:id
 *   borrowService.extendBorrow() → PUT /api/borrow/extend/:id
 */

import { useState, useEffect, useCallback } from "react";
import { BookOpen, BookMarked, AlertTriangle, Clock, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import borrowService from "../../services/borrowService";

const STATUS_MAP = {
  borrowing:  { label: "Đang mượn",  classes: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  returned:   { label: "Đã trả",     classes: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" },
  overdue:    { label: "Quá hạn",    classes: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" },
  renewed:    { label: "Đã gia hạn", classes: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300" },
  cancelled:  { label: "Đã hủy",     classes: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400" },
  lost:       { label: "Mất sách",   classes: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400" },
};

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysLeft(dueDateStr) {
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr); dueDate.setHours(0, 0, 0, 0);
  return Math.ceil((dueDate - today) / 86400000);
}

export function BorrowingTab() {
  const [borrows, setBorrows]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [meta, setMeta]         = useState({ total: 0, totalPages: 1 });
  const [actionId, setActionId] = useState(null);
  const [toast, setToast]       = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await borrowService.getHistory({ page, limit: 10 });
      if (data.success) { setBorrows(data.data); setMeta(data.meta); }
    } catch { showToast("Không thể tải lịch sử mượn", "error"); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Aggregated stats từ dữ liệu hiện tại (server nên trả tổng, ta tính gần đúng)
  const totalBorrowed    = meta.total;
  const currentBorrowing = borrows.filter(b => ['borrowing','renewed','overdue'].includes(b.status)).length;
  const overdueCount     = borrows.filter(b => b.status === 'overdue' || (b.due_date && daysLeft(b.due_date) < 0 && b.status !== 'returned')).length;
  const totalFines       = borrows.reduce((sum, b) => sum + (Number(b.fine_amount) || 0), 0);

  const handleReturn = async (borrowId) => {
    if (!window.confirm("Xác nhận trả sách này?")) return;
    setActionId(borrowId);
    try {
      const { data } = await borrowService.returnBook(borrowId);
      const fine = data.data?.fine_amount;
      showToast(fine > 0 ? `Trả sách thành công! Tiền phạt: ${Number(fine).toLocaleString("vi-VN")}đ` : "Trả sách thành công!");
      fetchHistory();
    } catch (err) {
      showToast(err.response?.data?.message || "Trả sách thất bại", "error");
    } finally { setActionId(null); }
  };

  const handleExtend = async (borrow) => {
    if (borrow.renewed_count >= 2) { showToast("Đã đạt giới hạn gia hạn (2 lần)", "error"); return; }
    setActionId(borrow.id);
    try {
      const { data } = await borrowService.extendBorrow(borrow.id);
      showToast(`Gia hạn thành công! Hạn mới: ${fmt(data.data?.new_due_date)}`);
      fetchHistory();
    } catch (err) {
      showToast(err.response?.data?.message || "Gia hạn thất bại", "error");
    } finally { setActionId(null); }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: BookOpen,      label: "Tổng mượn",      value: totalBorrowed,        color: "blue"   },
          { icon: BookMarked,    label: "Đang mượn",      value: currentBorrowing,     color: "indigo" },
          { icon: AlertTriangle, label: "Quá hạn",        value: overdueCount,         color: "red"    },
          { icon: Clock,         label: "Tổng phạt (đ)",  value: totalFines.toLocaleString("vi-VN"), color: "amber" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
              stat.color === "blue"   ? "bg-blue-100 dark:bg-blue-900/40"   :
              stat.color === "indigo" ? "bg-indigo-100 dark:bg-indigo-900/40":
              stat.color === "red"    ? "bg-red-100 dark:bg-red-900/40"     :
                                        "bg-amber-100 dark:bg-amber-900/40"
            }`}>
              <stat.icon className={`w-4 h-4 ${
                stat.color === "blue"   ? "text-blue-700 dark:text-blue-400"    :
                stat.color === "indigo" ? "text-indigo-700 dark:text-indigo-400":
                stat.color === "red"    ? "text-red-600 dark:text-red-400"      :
                                          "text-amber-600 dark:text-amber-400"
              }`} />
            </div>
            <p className="text-2xl text-gray-900 dark:text-gray-100 font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-gray-900 dark:text-gray-100">Lịch sử mượn trả</h3>
          <span className="text-xs text-gray-400">Tổng {meta.total} lượt</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : borrows.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có lịch sử mượn</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                    {["Tên sách", "Ngày mượn", "Hạn trả", "Trả ngày", "Trạng thái", "Phạt (đ)", "Thao tác"].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {borrows.map((record) => {
                    const st       = STATUS_MAP[record.status] || STATUS_MAP.borrowing;
                    const isActive = ['borrowing','renewed','overdue'].includes(record.status);
                    const days     = record.due_date ? daysLeft(record.due_date) : null;
                    const isActing = actionId === record.id;
                    return (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                            </div>
                            <span className="text-sm text-gray-900 dark:text-gray-100 font-medium line-clamp-1">{record.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{fmt(record.borrow_date)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-sm ${days !== null && days < 0 ? 'text-red-500 font-medium' : days !== null && days <= 3 ? 'text-amber-500 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                            {fmt(record.due_date)}
                            {days !== null && isActive && (
                              <span className="block text-xs">
                                {days < 0 ? `Quá ${Math.abs(days)} ngày` : days === 0 ? 'Hôm nay!' : `Còn ${days} ngày`}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{fmt(record.return_date)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.classes}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {Number(record.fine_amount) > 0 ? (
                            <span className={`text-sm font-semibold ${record.fine_paid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {Number(record.fine_amount).toLocaleString("vi-VN")}
                              {record.fine_paid ? ' ✓' : ''}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {isActive && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReturn(record.id)}
                                disabled={isActing}
                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 disabled:opacity-50"
                              >
                                {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                Trả
                              </button>
                              {record.status !== 'overdue' && record.renewed_count < 2 && (
                                <button
                                  onClick={() => handleExtend(record)}
                                  disabled={isActing}
                                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
                                >
                                  {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                  Gia hạn
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700">
              {borrows.map((record) => {
                const st       = STATUS_MAP[record.status] || STATUS_MAP.borrowing;
                const isActive = ['borrowing','renewed','overdue'].includes(record.status);
                const isActing = actionId === record.id;
                return (
                  <div key={record.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium line-clamp-2">{record.title}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ml-2 shrink-0 font-semibold ${st.classes}`}>{st.label}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Mượn: {fmt(record.borrow_date)}</span>
                      <span>Hạn: {fmt(record.due_date)}</span>
                    </div>
                    {Number(record.fine_amount) > 0 && (
                      <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
                        Phạt: {Number(record.fine_amount).toLocaleString("vi-VN")}đ
                      </span>
                    )}
                    {isActive && (
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleReturn(record.id)} disabled={isActing}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 disabled:opacity-50">
                          Trả sách
                        </button>
                        {record.status !== 'overdue' && record.renewed_count < 2 && (
                          <button onClick={() => handleExtend(record)} disabled={isActing}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 disabled:opacity-50">
                            Gia hạn
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 p-4 border-t border-gray-200 dark:border-slate-700">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">
                  ← Trước
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">Trang {page}/{meta.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(meta.totalPages, p+1))} disabled={page === meta.totalPages}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}