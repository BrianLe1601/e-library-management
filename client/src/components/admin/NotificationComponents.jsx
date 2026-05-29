import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, CheckCircle, BookOpen, AlertTriangle, Info, Trash2,
  Archive, RotateCcw, Check, Square, CheckSquare, X, Users, 
  User, Search, Loader2, Bell, Calendar, Hash, ChevronRight,
  Plus, Globe
} from "lucide-react";

// Cấu hình giao diện chuẩn đồng bộ cho cả Mobile & Desktop
const NOTIF_CONFIG = {
  overdue:  { icon: Clock,         color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/20",         border: "border-red-200 dark:border-red-900/50",     label: "Quá hạn" },
  approved: { icon: CheckCircle,   color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-900/50", label: "Duyệt mượn" },
  returned: { icon: BookOpen,      color: "text-sky-500",     bg: "bg-sky-50 dark:bg-sky-950/20",         border: "border-sky-200 dark:border-sky-900/50",     label: "Trả sách" },
  fine:     { icon: AlertTriangle, color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/20",     border: "border-amber-200 dark:border-amber-900/50", label: "Phạt" },
  system:   { icon: Info,          color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950/20",   border: "border-indigo-200 dark:border-indigo-900/50", label: "Hệ thống" },
};

// [THÊM MỚI] THUẬT TOÁN NHẬN DIỆN LOẠI THÔNG BÁO TỪ TEXT
const getSmartType = (type, title, message) => {
  if (["overdue", "approved", "returned", "fine"].includes(type)) return type;
  const text = ((title || "") + " " + (message || "")).toLowerCase();
  if (text.includes("quá hạn")) return "overdue";
  if (text.includes("trả") || text.includes("hoàn trả")) return "returned";
  if (text.includes("duyệt") || text.includes("mượn") || text.includes("thành công")) return "approved";
  if (text.includes("phạt")) return "fine";
  return "system";
};

// 1. StatPill Component
export const StatPill = memo(({ icon: Icon, value, label, color }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800/80 shadow-sm">
    <div className={`p-1.5 rounded-lg ${color}`}><Icon size={13} className="text-white" /></div>
    <div>
      <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
    </div>
  </div>
));

// 2. NotiCard Component (Desktop List Item)
export const NotiCard = memo(({ item, isChecked, isSelected, onTap, onToggleCheck }) => {
  // SỬ DỤNG SMART PARSER Ở ĐÂY
  const smartType = getSmartType(item.type, item.title, item.message);
  const cfg = NOTIF_CONFIG[smartType] || NOTIF_CONFIG.system;
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
      <div onClick={(e) => { e.stopPropagation(); onToggleCheck(item.id); }} className="p-1 cursor-pointer transition-transform active:scale-90 mt-0.5">
        {isChecked ? <CheckSquare size={16} className="text-indigo-600 dark:text-indigo-400" /> : <Square size={16} className="text-slate-300 dark:text-slate-600" />}
      </div>
      <div className={`p-2 rounded-xl shrink-0 ring-1 ring-slate-100 dark:ring-transparent ${cfg.bg}`}><Icon size={14} className={cfg.color} /></div>
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          <span className="text-[10px] text-slate-400 shrink-0">{new Date(item.created_at).toLocaleDateString("vi-VN")}</span>
        </div>
        <h4 className={`text-xs leading-snug text-slate-900 dark:text-white truncate ${!item.is_read ? "font-black" : "font-medium"}`}>{item.title}</h4>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{item.message}</p>
      </div>

      {!item.is_read && (
        <div className="absolute top-4 right-3 h-2 w-2 rounded-full bg-indigo-600 shadow-sm shadow-indigo-600/50"></div>
      )}
    </div>
  );
});

// 3. NotificationDetail Component (Desktop View Panel)
export const NotificationDetail = memo(({ selectedNotif, viewMode, onArchive, onRestore, onDelete }) => {
  const navigate = useNavigate();
  if (!selectedNotif) {
    return (
      <div className="h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-600 bg-slate-50/30 dark:bg-[#070c16]/30">
        <Bell size={32} className="stroke-[1.5] mb-2 text-slate-300 dark:text-slate-700 animate-pulse" />
        <p className="text-xs font-medium">Chọn một thông báo để hiển thị nội dung chi tiết</p>
      </div>
    );
  }
  
  // SỬ DỤNG SMART PARSER Ở ĐÂY
  const smartType = getSmartType(selectedNotif.type, selectedNotif.title, selectedNotif.message);
  const cfg = NOTIF_CONFIG[smartType] || NOTIF_CONFIG.system;
  const isPublic = selectedNotif.scope === "public" || !selectedNotif.user_id;

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
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            <p className="text-[10px] text-slate-400 mt-0.5">ID: #{selectedNotif.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {viewMode === "active" ? (
            <button onClick={() => onArchive(selectedNotif.id)} title="Lưu trữ" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all"><Archive size={16} /></button>
          ) : (
            <button onClick={() => onRestore(selectedNotif.id)} title="Khôi phục" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition-all"><RotateCcw size={16} /></button>
          )}
          <button onClick={() => onDelete(selectedNotif.id)} title="Xóa vĩnh viễn" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-slate-400 font-semibold">Thời gian gửi: {new Date(selectedNotif.created_at).toLocaleString("vi-VN")}</span>
        <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{selectedNotif.title}</h2>
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-[#0d1425] p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 whitespace-pre-wrap mt-2">{selectedNotif.message}</div>
      </div>
      <div className="pt-4 border-t border-slate-50 dark:border-slate-900/60 flex flex-col gap-2.5 bg-slate-50/30 dark:bg-[#070c15]/30 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" /><span className="text-slate-400 font-medium w-20 shrink-0">Ngày tạo:</span><span className="text-slate-700 dark:text-slate-300 font-bold">{new Date(selectedNotif.created_at).toLocaleDateString("vi-VN")}</span></div>
        <div className="flex items-center gap-2"><User size={14} className="text-slate-400" /><span className="text-slate-400 font-medium w-20 shrink-0">Đối tượng:</span><span className="text-slate-700 dark:text-slate-300 font-bold">{isPublic ? "Tất cả người dùng (Broadcast)" : selectedNotif.user_name ? `${selectedNotif.user_name} (ID: ${selectedNotif.user_id})` : `User ID: ${selectedNotif.user_id}`}</span></div>
        {selectedNotif.borrow_id && <div className="flex items-center gap-2"><Hash size={14} className="text-slate-400" /><span className="text-slate-400 font-medium w-20 shrink-0">Phiếu mượn:</span><span className="text-indigo-600 dark:text-indigo-400 font-bold">#{selectedNotif.borrow_id}</span></div>}
        {selectedNotif.book_id && <div className="flex items-center gap-2"><BookOpen size={14} className="text-slate-400" /><span className="text-slate-400 font-medium w-20 shrink-0">Mã sách:</span><span className="text-indigo-600 dark:text-indigo-400 font-bold">#{selectedNotif.book_id}</span></div>}
      </div>
      {(selectedNotif.borrow_id || selectedNotif.book_id) && (
        <button onClick={handleNavigate} className="flex items-center justify-between w-full gap-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 px-5 py-3 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition-all group mt-auto">
          <span>{selectedNotif.borrow_id ? "Move to Borrowing & Return" : "Move to Book Inventory"}</span>
          <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
});

/* CÁC COMPONENT TỪ SỐ 4 ĐẾN SỐ 7 GIỮ NGUYÊN (ComposeModal, Header, Filters, TabBar) */
// 4. ComposeModal Component (Shared Creation Modal)
export const ComposeModal = memo(({ isOpen, onClose, userList, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({ scope: "all", user_id: "", type: "system", title: "", message: "", borrow_id: "", book_id: "" });
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#090f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0b1222]">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Phát hành thông báo mới</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Tạo thông báo quảng bá toàn hệ thống, nhóm độc giả hoặc gửi đích danh</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={16} className="text-slate-400" /></button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData, () => onClose()); }} className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 max-h-[80vh]">
          
          {/* VÙNG CHỌN ĐỐI TƯỢNG (3 NÚT) */}
          <div className="flex gap-2">
            <button type="button" onClick={() => setFormData(p => ({ ...p, scope: "all", user_id: "" }))} className={`flex-1 p-2.5 rounded-xl border flex justify-center transition-all ${formData.scope === "all" ? "border-indigo-500 bg-indigo-500/5" : "border-slate-200 dark:border-slate-800"}`}>
              <div className="flex flex-col items-center gap-1.5"><Globe size={16} className="text-indigo-500" /><span className="text-[10px] sm:text-[11px] font-bold text-slate-900 dark:text-white text-center">Toàn hệ thống</span></div>
            </button>
            <button type="button" onClick={() => setFormData(p => ({ ...p, scope: "users_only", user_id: "" }))} className={`flex-1 p-2.5 rounded-xl border flex justify-center transition-all ${formData.scope === "users_only" ? "border-indigo-500 bg-indigo-500/5" : "border-slate-200 dark:border-slate-800"}`}>
              <div className="flex flex-col items-center gap-1.5"><Users size={16} className="text-indigo-500" /><span className="text-[10px] sm:text-[11px] font-bold text-slate-900 dark:text-white text-center">Chỉ độc giả</span></div>
            </button>
            <button type="button" onClick={() => setFormData(p => ({ ...p, scope: "user" }))} className={`flex-1 p-2.5 rounded-xl border flex justify-center transition-all ${formData.scope === "user" ? "border-indigo-500 bg-indigo-500/5" : "border-slate-200 dark:border-slate-800"}`}>
              <div className="flex flex-col items-center gap-1.5"><User size={16} className="text-indigo-500" /><span className="text-[10px] sm:text-[11px] font-bold text-slate-900 dark:text-white text-center">Gửi cá nhân</span></div>
            </button>
          </div>

          {/* CHỌN NGƯỜI NHẬN NẾU LÀ CÁ NHÂN */}
          {formData.scope === "user" && (
            <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Chọn người nhận</label>
              <select required value={formData.user_id} onChange={(e) => setFormData(p => ({ ...p, user_id: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none text-slate-900 dark:text-white focus:border-indigo-500">
                <option value="">Chọn tài khoản...</option>
                {userList.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
              </select>
            </div>
          )}

          {/* LOẠI THÔNG BÁO */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Phân loại thông báo</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.keys(NOTIF_CONFIG).map((key) => {
                const isSel = formData.type === key;
                const opt = NOTIF_CONFIG[key];
                return (
                  <button type="button" key={key} onClick={() => setFormData(p => ({ ...p, type: key }))} className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${isSel ? "border-indigo-500 bg-indigo-500/5" : "border-slate-100 dark:border-slate-800/60"}`}>
                    <div className={`p-1.5 rounded-lg ${opt.bg}`}><opt.icon size={12} className={opt.color} /></div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Tiêu đề</label>
            <input required type="text" placeholder="Nhập tiêu đề ngắn..." value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Nội dung thông báo</label>
            <textarea required rows={4} placeholder="Chi tiết thông điệp..." value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-[#070c16]/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Mã phiếu mượn (Opt)</label>
              <input type="number" placeholder="Ví dụ: 201" value={formData.borrow_id} onChange={(e) => setFormData(p => ({ ...p, borrow_id: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Mã cuốn sách (Opt)</label>
              <input type="number" placeholder="Ví dụ: 89" value={formData.book_id} onChange={(e) => setFormData(p => ({ ...p, book_id: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-slate-900 dark:text-white" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
            <button type="button" disabled={isSubmitting} onClick={onClose} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080d1a] px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50">
              {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Đang gửi...</> : "Phát hành ngay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export const MobileNotificationHeader = memo(({ viewMode, unreadCount, isSelectionMode, selectedCount, onOpenCompose, onEnterSelect, onCancelSelect, onSelectAll, isAllDatabaseSelected }) => (
  <div className="md:hidden sticky top-0 z-40 bg-[#060a13]/95 backdrop-blur-xl border-b border-white/[0.06] safe-top">
    <div className="flex items-center justify-between h-14 px-4">
      {isSelectionMode ? (
        <div className="flex items-center gap-3">
          <button onClick={onCancelSelect} className="text-slate-400 active:text-white transition-colors"><X size={20} /></button>
          <span className="text-sm font-black text-white">{selectedCount} đã chọn</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <h1 className="text-base font-black text-white">Thông báo</h1>
          {unreadCount > 0 && <span className="text-[10px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded-full">{unreadCount} mới</span>}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        {isSelectionMode ? (
          <button onClick={onSelectAll} className="p-2 text-slate-400 active:text-white transition-colors">
            {isAllDatabaseSelected ? <CheckSquare size={18} className="text-indigo-500" /> : <Square size={18} />}
          </button>
        ) : (
          <>
            <button onClick={onEnterSelect} className="p-2 text-slate-400 active:text-white transition-colors"><CheckSquare size={18} /></button>
            <button onClick={onOpenCompose} className="p-2 bg-indigo-600 text-white rounded-xl active:bg-indigo-500 transition-colors"><Plus size={16} /></button>
          </>
        )}
      </div>
    </div>
  </div>
));

export const MobileNotificationFilters = memo(({ searchQuery, filter, onSearch, onFilter, visible = true }) => {
  if (!visible) return null;
  return (
    <div className="md:hidden sticky top-[56px] z-30 bg-[#060a13]/95 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="px-4 pt-2 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Tìm kiếm tiêu đề, nội dung..." value={searchQuery} onChange={(e) => onSearch(e.target.value)} className="w-full pl-9 pr-9 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all" />
          {searchQuery && <button onClick={() => onSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"><X size={13} /></button>}
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-2.5 overflow-x-auto scrollbar-none">
        {[
          { key: "all",     label: "Tất cả" },
          { key: "unread",  label: "Chưa đọc" },
          { key: "overdue", label: "Quá hạn" },
          { key: "system",  label: "Hệ thống" }
        ].map((lbl) => (
          <button key={lbl.key} onClick={() => onFilter(lbl.key)} className={`flex-shrink-0 px-3.5 py-1 rounded-full text-[12px] font-bold transition-all ${filter === lbl.key ? "bg-indigo-600 text-white" : "bg-white/[0.04] text-slate-400"}`}>{lbl.label}</button>
        ))}
      </div>
    </div>
  );
});

export const MobileTabBar = memo(({ viewMode, activeCount, archivedCount, onChange, visible = true }) => {
  if (!visible) return null;
  return (
    <div className="md:hidden px-4 pt-3 pb-0">
      <div className="flex bg-white/[0.04] rounded-2xl p-1 gap-1">
        {[
          { key: "active",   label: "Hộp thư",  count: activeCount },
          { key: "archived", label: "Lưu trữ",  count: archivedCount }
        ].map((tab) => (
          <button key={tab.key} onClick={() => onChange(tab.key)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-bold transition-all ${viewMode === tab.key ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-500 active:bg-white/[0.04]"}`}>
            {tab.label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${viewMode === tab.key ? "bg-white/20 text-white" : "bg-white/[0.06] text-slate-400"}`}>{tab.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

// 8. Mobile Card + List + BulkBar Components
export const NotificationCardMobile = memo(({ item, isChecked, isSelectionMode, onTap, onToggleCheck }) => {
  // SỬ DỤNG SMART PARSER Ở ĐÂY
  const smartType = getSmartType(item.type, item.title, item.message);
  const cfg = NOTIF_CONFIG[smartType] || NOTIF_CONFIG.system;
  const isUnread = !item.is_read;
  
  return (
    <div onClick={() => isSelectionMode ? onToggleCheck(item.id) : onTap(item)} className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] transition-all ${isChecked ? "bg-indigo-500/10" : "active:bg-white/[0.02]"}`}>
      {isSelectionMode && <div className="pt-0.5 shrink-0">{isChecked ? <CheckSquare size={18} className="text-indigo-500" /> : <Square size={18} className="text-slate-600" />}</div>}
      <div className={`p-2 rounded-xl shrink-0 ${cfg.bg} border border-white/[0.05] ${isChecked ? "ring-2 ring-indigo-500/50" : ""}`}><cfg.icon size={18} className={cfg.color} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p className={`text-[13px] leading-snug line-clamp-1 flex-1 ${isUnread ? "font-bold text-white" : "font-semibold text-slate-400"}`}>{item.title}</p>
          {isUnread && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-1 ring-2 ring-indigo-500/20" />}
        </div>
        <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2 mb-1.5">{item.message}</p>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-slate-600 tabular-nums">{new Date(item.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
          <span className="text-slate-700">·</span>
          <span className={`font-bold px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>
    </div>
  );
});

export const MobileNotificationList = memo(({ notifications, loading, loadingMore, hasMore, searchQuery, isSelectionMode, selectedIds, isAllDatabaseSelected, onTap, onToggleCheck, onLoadMore }) => {
  const sentinelRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore && !loading) onLoadMore();
    }, { threshold: 0.1 });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, onLoadMore]);

  if (!loading && notifications.length === 0) {
    return (
      <div className="md:hidden flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-3"><Bell size={22} className="text-slate-600" /></div>
        <p className="text-sm font-bold text-slate-300">Không có thông báo</p>
        <p className="text-[11px] text-slate-500 mt-1">{searchQuery ? `Không tìm thấy từ khóa "${searchQuery}"` : "Hộp thư rỗng"}</p>
      </div>
    );
  }
  return (
    <div className="md:hidden flex flex-col pb-24">
      {notifications.map(item => (
        <NotificationCardMobile 
          key={item.id} item={item} 
          isChecked={isAllDatabaseSelected || selectedIds.includes(item.id)} 
          isSelectionMode={isSelectionMode} onTap={onTap} onToggleCheck={onToggleCheck} 
        />
      ))}
      <div ref={sentinelRef} className="h-4" />
      {loadingMore && <div className="flex items-center justify-center py-4"><Loader2 size={18} className="animate-spin text-indigo-500" /></div>}
    </div>
  );
});

export const BulkActionBarMobile = memo(({ selectedCount, viewMode, visible, onMarkRead, onArchive, onRestore, onDelete }) => {
  if (!visible) return null;
  return (
    <>
      <div className="md:hidden fixed inset-0 z-40 pointer-events-none"><div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/60 to-transparent" /></div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300" style={{ paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
        <div className="mx-3 mb-3 bg-[#111827] border border-white/[0.08] shadow-2xl rounded-3xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-1"><span className="text-[12px] font-black text-slate-300">Thao tác hàng loạt ({selectedCount} mục)</span></div>
          <div className="grid grid-cols-3 gap-1">
            <button onClick={onMarkRead} className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl active:bg-white/[0.04] transition-all">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"><Check size={18} className="text-indigo-400" /></div>
              <span className="text-[11px] font-bold text-slate-400 text-center">Đọc/Chưa đọc</span>
            </button>
            {viewMode === "active" ? (
              <button onClick={onArchive} className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl active:bg-white/[0.04] transition-all">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><Archive size={18} className="text-amber-400" /></div>
                <span className="text-[11px] font-bold text-slate-400 text-center">Lưu trữ</span>
              </button>
            ) : (
              <button onClick={onRestore} className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl active:bg-white/[0.04] transition-all">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><RotateCcw size={18} className="text-emerald-400" /></div>
                <span className="text-[11px] font-bold text-slate-400 text-center">Khôi phục</span>
              </button>
            )}
            <button onClick={onDelete} className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl active:bg-red-500/[0.05] transition-all">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"><Trash2 size={18} className="text-red-400" /></div>
              <span className="text-[11px] font-bold text-red-400 text-center">Xóa vĩnh viễn</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
});