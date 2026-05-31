import { useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, CheckCircle, BookOpen, AlertTriangle, Info, Trash2,
  Check, Square, CheckSquare, X, Users, User, Search,
  Loader2, Bell, Calendar, Hash, ChevronRight, Plus, Globe,
  PenTool, FileText, ChevronDown
} from "lucide-react";
import InputField from "../InputField";

// ─── Config ───────────────────────────────────────────────────────────────────
const NOTIF_CONFIG = {
  overdue:  { icon: Clock,         color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/20",         border: "border-red-200 dark:border-red-900/50",     label: "Overdue" },
  approved: { icon: CheckCircle,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-900/50", label: "Approved" },
  returned: { icon: BookOpen,      color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-950/20",         border: "border-sky-200 dark:border-sky-900/50",     label: "Returned" },
  fine:     { icon: AlertTriangle, color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/20",     border: "border-amber-200 dark:border-amber-900/50", label: "Fine" },
  system:   { icon: Info,          color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950/20",   border: "border-indigo-200 dark:border-indigo-900/50", label: "System" },
};

const getSmartType = (type, title, message) => {
  if (["overdue", "approved", "returned", "fine"].includes(type)) return type;
  const text = ((title || "") + " " + (message || "")).toLowerCase();
  if (text.includes("extend") || text.includes("renew")) return "system";
  if (text.includes("overdue")) return "overdue";
  if (text.includes("return") || text.includes("returned")) return "returned";
  if (text.includes("approve") || text.includes("borrow") || text.includes("success")) return "approved";
  if (text.includes("fine") || text.includes("penalty")) return "fine";
  return "system";
};

const INITIAL_FORM = {
  scope:     "all",
  user_id:   "",
  type:      "system",
  title:     "",
  message:   "",
  borrow_id: "",
  book_id:   "",
};

// ─── 1. StatPill ──────────────────────────────────────────────────────────────
export const StatPill = memo(({ icon: Icon, value, label, color }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800/80 shadow-sm">
    <div className={`p-1.5 rounded-lg ${color}`}><Icon size={13} className="text-white" /></div>
    <div>
      <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
    </div>
  </div>
));

// ─── 2. NotiCard (Desktop) ────────────────────────────────────────────────────
export const NotiCard = memo(({ item, isChecked, isSelected, onTap, onToggleCheck }) => {
  const smartType = getSmartType(item.type, item.title, item.message);
  const cfg  = NOTIF_CONFIG[smartType] || NOTIF_CONFIG.system;
  const Icon = cfg.icon;

  return (
    <div
      onClick={() => onTap(item.id)}
      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all relative ${
        isSelected
          ? "bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-900/60 shadow-sm"
          : "bg-white dark:bg-[#090f1c] border-slate-100 dark:border-slate-900/60 hover:bg-slate-50 dark:hover:bg-[#0d1527]"
      }`}
    >
      <div
        onClick={e => { e.stopPropagation(); onToggleCheck(item.id); }}
        className="p-1 cursor-pointer transition-transform active:scale-90 mt-0.5 shrink-0"
      >
        {isChecked
          ? <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
          : <Square size={16} className="text-slate-300 dark:text-slate-600" />}
      </div>
      <div className={`p-2 rounded-xl shrink-0 ring-1 ring-slate-100 dark:ring-transparent ${cfg.bg}`}>
        <Icon size={14} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          <span className="text-[10px] text-slate-400 shrink-0">{new Date(item.created_at).toLocaleDateString("en-GB")}</span>
        </div>
        <h4 className={`text-xs leading-snug text-slate-900 dark:text-white truncate ${!item.is_read ? "font-black" : "font-medium"}`}>
          {item.title}
        </h4>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{item.message}</p>
      </div>
      {!item.is_read && (
        <div className="absolute top-4 right-3 h-2 w-2 rounded-full bg-indigo-600 shadow-sm shadow-indigo-600/50" />
      )}
    </div>
  );
});

// ─── 3. NotificationDetail (Desktop) ──────────────────────────────────────────
export const NotificationDetail = memo(({ selectedNotif, onDelete }) => {
  const navigate = useNavigate();

  if (!selectedNotif) {
    return (
      <div className="h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-600 bg-slate-50/30 dark:bg-[#070c16]/30">
        <Bell size={32} className="stroke-[1.5] mb-2 text-slate-300 dark:text-slate-700 animate-pulse" />
        <p className="text-xs font-medium">Select a notification to view its details</p>
      </div>
    );
  }

  const smartType = getSmartType(selectedNotif.type, selectedNotif.title, selectedNotif.message);
  const cfg       = NOTIF_CONFIG[smartType] || NOTIF_CONFIG.system;
  const isPublic  = !selectedNotif.user_id;

  const handleNavigate = () => {
    if (selectedNotif.borrow_id) navigate(`/admin/borrowing?search=${selectedNotif.borrow_id}`);
    else if (selectedNotif.book_id) navigate(`/admin/books?search=${selectedNotif.book_id}`);
  };

  return (
    <div className="h-full bg-white dark:bg-[#090f1c] border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="flex items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-900/60 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${cfg.bg}`}><cfg.icon size={16} className={cfg.color} /></div>
          <div>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">ID: #{selectedNotif.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* [FIX label] Nút này gọi handleSingleSoftDelete = archive, hiển thị "Xóa mềm" cho rõ */}
          <button
            onClick={() => onDelete(selectedNotif.id)}
            title="Soft delete (can be restored)"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-slate-400 font-semibold">
          Sent time: {new Date(selectedNotif.created_at).toLocaleString("en-GB")}
        </span>
        <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{selectedNotif.title}</h2>
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-[#0d1425] p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 whitespace-pre-wrap mt-2">
          {selectedNotif.message}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-50 dark:border-slate-900/60 flex flex-col gap-2.5 bg-slate-50/30 dark:bg-[#070c15]/30 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <span className="text-slate-400 font-medium w-20 shrink-0">Created at:</span>
          <span className="text-slate-700 dark:text-slate-300 font-bold">{new Date(selectedNotif.created_at).toLocaleDateString("en-GB")}</span>
        </div>
        <div className="flex items-center gap-2">
          <User size={14} className="text-slate-400" />
          <span className="text-slate-400 font-medium w-20 shrink-0">Recipient:</span>
          <span className="text-slate-700 dark:text-slate-300 font-bold">
            {isPublic
              ? "All users"
              : selectedNotif.user_name
                ? `${selectedNotif.user_name} (ID: ${selectedNotif.user_id})`
                : `User ID: ${selectedNotif.user_id}`}
          </span>
        </div>
        {selectedNotif.borrow_id && (
          <div className="flex items-center gap-2">
            <Hash size={14} className="text-slate-400" />
            <span className="text-slate-400 font-medium w-20 shrink-0">Borrow ID:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">#{selectedNotif.borrow_id}</span>
          </div>
        )}
        {selectedNotif.book_id && (
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-slate-400" />
            <span className="text-slate-400 font-medium w-20 shrink-0">Book ID:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">#{selectedNotif.book_id}</span>
          </div>
        )}
      </div>

      {(selectedNotif.borrow_id || selectedNotif.book_id) && (
        <button
          onClick={handleNavigate}
          className="flex items-center justify-between w-full gap-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 px-5 py-3 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition-all group mt-auto"
        >
          <span>{selectedNotif.borrow_id ? "Go to Borrow Management" : "Go to Book Inventory"}</span>
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
});

// ─── 4. ComposeModal ──────────────────────────────────────────────────────────
/**
 * [FIX] Các vấn đề cũ:
 * 1. Form không reset sau submit — form tưởng đóng nhưng state còn dữ liệu cũ
 * 2. onSubmit callback nhận resetForm nhưng không gọi đúng
 * 3. scope='all' cần gửi cho cả admin_employee (xử lý ở backend đã đúng, 
 * chỉ cần đảm bảo payload gửi đúng scope)
 * 4. scope='users_only' → user_id phải là null
 * 5. borrow_id / book_id bỏ trống → gửi null thay vì "" (tránh lỗi FK)
 */
export const ComposeModal = memo(({ isOpen, onClose, userList, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors,   setErrors]   = useState({});

  // Reset form khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM);
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (key, value) => {
    setFormData(p => ({ ...p, [key]: value }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: "" }));
  };

  // Validate nội bộ trước khi submit
  const validate = () => {
    const e = {};
    if (!formData.title.trim())   e.title   = "Please enter a title";
    if (!formData.message.trim()) e.message = "Please enter a message";
    if (formData.scope === "user" && !formData.user_id) e.user_id = "Please select a recipient";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // [FIX] Truyền đúng resetForm callback để page gọi sau khi API thành công
    onSubmit(formData, () => {
      setFormData(INITIAL_FORM);
      setErrors({});
    });
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    onClose();
  };

  // Lọc danh sách user: Kiểm tra an toàn xem userList có phải là mảng không trước khi filter
  const safeUserList = Array.isArray(userList) ? userList : [];
  const filteredUsers = safeUserList.filter(u => u.role === "user");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#090f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0b1222]">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Publish New Notification</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Create a notification for the entire system, a user group, or an individual</p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 max-h-[80vh]">

          {/* ── Scope ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recipient Scope</label>
            <div className="flex gap-2">
              {/* Toàn hệ thống */}
              <button
                type="button"
                onClick={() => set("scope", "all")}
                className={`flex-1 p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  formData.scope === "all"
                    ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <Globe size={15} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">
                  Entire System
                </span>
                <span className="text-[9px] text-slate-400 text-center leading-tight">Admin + User</span>
              </button>

              {/* Chỉ độc giả */}
              <button
                type="button"
                onClick={() => { set("scope", "users_only"); set("user_id", ""); }}
                className={`flex-1 p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  formData.scope === "users_only"
                    ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <Users size={15} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">
                  Users Only
                </span>
                <span className="text-[9px] text-slate-400 text-center leading-tight">role = user</span>
              </button>

              {/* Gửi cá nhân */}
              <button
                type="button"
                onClick={() => set("scope", "user")}
                className={`flex-1 p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  formData.scope === "user"
                    ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <User size={15} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center leading-tight">
                  Individual
                </span>
                <span className="text-[9px] text-slate-400 text-center leading-tight">1 user</span>
              </button>
            </div>
          </div>

          {/* ── Chọn người nhận cụ thể ── */}
          {formData.scope === "user" && (
            <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select recipient <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                <select
                  value={formData.user_id}
                  onChange={e => set("user_id", e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-[#0d1527] border rounded-xl text-xs outline-none text-slate-900 dark:text-white focus:border-indigo-500 appearance-none cursor-pointer transition ${
                    errors.user_id ? "border-red-400" : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <option value="">-- Select account --</option>
                  {filteredUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {errors.user_id && <p className="text-[11px] text-red-400">{errors.user_id}</p>}
            </div>
          )}

          {/* ── Loại thông báo ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(NOTIF_CONFIG).map(([key, opt]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => set("type", key)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    formData.type === key
                      ? "border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10"
                      : "border-slate-100 dark:border-slate-800/60 hover:border-slate-300"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${opt.bg} shrink-0`}>
                    <opt.icon size={12} className={opt.color} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Tiêu đề ── */}
          <InputField 
            name="title" 
            label="Title *" 
            placeholder="Enter notification title..." 
            icon={PenTool} 
            value={formData.title} 
            onChange={(e) => set("title", e.target.value)} 
            fieldErrors={{ title: errors.title }} 
          />

          {/* ── Nội dung ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Message <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <FileText size={15} className="absolute left-3.5 top-2.5 text-slate-400 z-10" />
              <textarea
                rows={4}
                placeholder="Message details..."
                value={formData.message}
                onChange={e => set("message", e.target.value)}
                maxLength={500}
                className={`w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0d1527] border rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white resize-none leading-relaxed transition ${
                  errors.message ? "border-red-400" : "border-slate-200 dark:border-slate-800"
                }`}
              />
            </div>
            <div className="flex justify-between items-center">
              {errors.message ? <p className="text-[11px] text-red-400">{errors.message}</p> : <span />}
              <span className="text-[10px] text-slate-400 tabular-nums">{formData.message.length}/500</span>
            </div>
          </div>

          {/* ── Liên kết tùy chọn ── */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-[#070c16]/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
            <InputField 
              name="borrow_id" 
              label="Borrow ID (Optional)" 
              type="text"
              placeholder="e.g., 201" 
              icon={Hash} 
              value={formData.borrow_id} 
              onChange={(e) =>{ 
                const val = e.target.value.replace(/\D/g, '');
                set("borrow_id", val ? Number(val) : "");
                }}
              fieldErrors={{}} 
            />
            <InputField 
              name="book_id" 
              label="Book ID (Optional)" 
              type="text"
              placeholder="e.g., 89" 
              icon={BookOpen} 
              value={formData.book_id} 
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                set("book_id", val ? Number(val) : "");
              }}
              fieldErrors={{}} 
            />
          </div>

          {/* ── Footer buttons ── */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080d1a] px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
            >
              {isSubmitting
                ? <><Loader2 size={13} className="animate-spin" /> Sending...</>
                : <><Bell size={13} /> Publish Now</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

// ─── 5. MobileNotificationHeader ─────────────────────────────────────────────
export const MobileNotificationHeader = memo(({
  totalCount, unreadCount, isSelectionMode, selectedCount, isAllDatabaseSelected,
  onOpenCompose, onEnterSelect, onCancelSelect, onSelectAll
}) => (
  <div className="md:hidden sticky top-0 z-40 bg-[#060a13]/95 backdrop-blur-xl border-b border-white/[0.06] safe-top">
    <div className="flex items-center justify-between h-14 px-4">
      {isSelectionMode ? (
        <div className="flex items-center gap-3">
          <button onClick={onCancelSelect} className="text-slate-400 active:text-white transition-colors">
            <X size={20} />
          </button>
          <span className="text-sm font-black text-white">{selectedCount} selected</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <h1 className="text-base font-black text-white">Notifications</h1>
          {/* Badge tổng số thông báo của admin */}
          {totalCount > 0 && (
            <span className="text-[10px] bg-slate-700 text-slate-300 font-black px-1.5 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
          {/* Badge chưa đọc */}
          {unreadCount > 0 && (
            <span className="text-[10px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        {isSelectionMode ? (
          <button onClick={onSelectAll} className="p-2 text-slate-400 active:text-white transition-colors">
            {isAllDatabaseSelected
              ? <CheckSquare size={18} className="text-indigo-500" />
              : <Square size={18} />}
          </button>
        ) : (
          <>
            <button onClick={onEnterSelect} className="p-2 text-slate-400 active:text-white transition-colors">
              <CheckSquare size={18} />
            </button>
            <button
              onClick={onOpenCompose}
              className="p-2 bg-indigo-600 text-white rounded-xl active:bg-indigo-500 transition-colors"
            >
              <Plus size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  </div>
));

// ─── 6. MobileNotificationFilters ────────────────────────────────────────────
export const MobileNotificationFilters = memo(({ searchQuery, filter, onSearch, onFilter, visible = true }) => {
  if (!visible) return null;
  return (
    <div className="md:hidden sticky top-[56px] z-30 bg-[#060a13]/95 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="px-4 pt-2 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search titles, messages..."
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button onClick={() => onSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              <X size={13} />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-2.5 overflow-x-auto scrollbar-none">
        {[
          { key: "all",    label: "All" },
          { key: "unread", label: "Unread" },
          { key: "overdue",label: "Alerts" },
          { key: "system", label: "Activity" },
        ].map(lbl => (
          <button
            key={lbl.key}
            onClick={() => onFilter(lbl.key)}
            className={`flex-shrink-0 px-3.5 py-1 rounded-full text-[12px] font-bold transition-all ${
              filter === lbl.key ? "bg-indigo-600 text-white" : "bg-white/[0.04] text-slate-400"
            }`}
          >
            {lbl.label}
          </button>
        ))}
      </div>
    </div>
  );
});

// ─── 7. NotificationCardMobile ────────────────────────────────────────────────
export const NotificationCardMobile = memo(({ item, isChecked, isSelectionMode, onTap, onToggleCheck }) => {
  const smartType = getSmartType(item.type, item.title, item.message);
  const cfg       = NOTIF_CONFIG[smartType] || NOTIF_CONFIG.system;
  const isUnread  = !item.is_read;

  return (
    <div
      onClick={() => isSelectionMode ? onToggleCheck(item.id) : onTap(item)}
      className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] transition-all ${
        isChecked ? "bg-indigo-500/10" : "active:bg-white/[0.02]"
      }`}
    >
      {isSelectionMode && (
        <div className="pt-0.5 shrink-0">
          {isChecked
            ? <CheckSquare size={18} className="text-indigo-500" />
            : <Square size={18} className="text-slate-600" />}
        </div>
      )}
      <div className={`p-2 rounded-xl shrink-0 ${cfg.bg} border border-white/[0.05] ${isChecked ? "ring-2 ring-indigo-500/50" : ""}`}>
        <cfg.icon size={18} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className={`text-[13px] leading-snug line-clamp-1 flex-1 ${isUnread ? "font-bold text-white" : "font-semibold text-slate-400"}`}>
            {item.title}
          </p>
          {isUnread && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-1 ring-2 ring-indigo-500/20" />}
        </div>
        <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2 mb-1.5">{item.message}</p>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-slate-600 tabular-nums">
            {new Date(item.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="text-slate-700">·</span>
          <span className={`font-bold px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>
    </div>
  );
});

// ─── 8. MobileNotificationList (Infinite scroll) ──────────────────────────────
export const MobileNotificationList = memo(({
  notifications, loading, loadingMore, hasMore, searchQuery,
  isSelectionMode, selectedIds, isAllDatabaseSelected,
  onTap, onToggleCheck, onLoadMore
}) => {
  const sentinelRef = useRef(null);

  // IntersectionObserver — trigger khi sentinel vào viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px 80px 0px" }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loadingMore, loading, onLoadMore]);

  // Loading lần đầu
  if (loading && notifications.length === 0) {
    return (
      <div className="md:hidden flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  // Empty state
  if (!loading && notifications.length === 0) {
    return (
      <div className="md:hidden flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-3">
          <Bell size={22} className="text-slate-600" />
        </div>
        <p className="text-sm font-bold text-slate-300"></p>
        <p className="text-[11px] text-slate-500 mt-1">
          {searchQuery ? `Cannot find any notifications matching "${searchQuery}"` : "You don't have any notifications yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="md:hidden flex flex-col pb-28">
      {notifications.map(item => (
        <NotificationCardMobile
          key={item.id}
          item={item}
          isChecked={isAllDatabaseSelected || selectedIds.includes(item.id)}
          isSelectionMode={isSelectionMode}
          onTap={onTap}
          onToggleCheck={onToggleCheck}
        />
      ))}

      {/* Sentinel: phần tử vô hình kích hoạt load more */}
      <div ref={sentinelRef} className="h-8" />

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex items-center justify-center py-4 gap-2">
          <Loader2 size={16} className="animate-spin text-indigo-500" />
          <span className="text-[11px] text-slate-500">Loading...</span>
        </div>
      )}

      {/* End of list */}
      {!hasMore && notifications.length > 0 && (
        <div className="text-center py-4 text-[10px] text-slate-600 font-medium">
          ✓ You've seen all {notifications.length} notifications
        </div>
      )}
    </div>
  );
});

// ─── 9. BulkActionBarMobile ───────────────────────────────────────────────────
export const BulkActionBarMobile = memo(({ selectedCount, visible, onMarkRead, onDelete }) => {
  if (!visible) return null;
  return (
    <>
      <div className="md:hidden fixed inset-0 z-40 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
      >
        <div className="mx-3 mb-3 bg-[#111827] border border-white/[0.08] shadow-2xl rounded-3xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <span className="text-[12px] font-black text-slate-300">Bulk Actions</span>
            <span className="text-[11px] text-indigo-400 font-black">{selectedCount} selected</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onMarkRead}
              className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl active:bg-white/[0.04] transition-all bg-white/[0.02] border border-white/[0.04]"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Check size={18} className="text-indigo-400" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 text-center">Mark as read</span>
            </button>
            
            <button
              onClick={onDelete}
              className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl active:bg-amber-500/[0.05] transition-all bg-white/[0.02] border border-white/[0.04]"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Trash2 size={18} className="text-amber-400" />
              </div>
              <span className="text-[11px] font-bold text-amber-400 text-center">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
});