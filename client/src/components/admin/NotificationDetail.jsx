import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, BookOpen, AlertTriangle, Info, User, Users, Archive, RotateCcw, Trash2, ChevronRight, ChevronLeft } from "lucide-react";

const notifIcon = {
  overdue: { icon: Clock, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20", label: "Overdue" },
  approved: { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", label: "Approved" },
  returned: { icon: BookOpen, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-950/20", label: "Returned" },
  fine: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", label: "Fine" },
  system: { icon: Info, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-950/20", label: "System" },
};

const NotificationDetail = ({ selectedNotif, viewMode, onArchive, onRestore, onDelete, onBack }) => {
  const navigate = useNavigate();

  if (!selectedNotif) {
    return (
      <div className="h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-12 text-slate-400 text-center bg-white/30 dark:bg-transparent m-4">
        <Info size={32} className="stroke-1 mb-2 text-slate-300" />
        <p className="text-xs font-medium">Select any system alert tile to inspect the exhaustive logs and dispatch payload.</p>
      </div>
    );
  }

  const Config = notifIcon[selectedNotif.type] || notifIcon.system;

  const handleNavigate = () => {
    if (selectedNotif.borrow_id) navigate(`/admin/borrowing`);
    else if (selectedNotif.book_id) navigate(`/admin/books`);
  };

  return (
    <div className="bg-white dark:bg-[#090f1c] rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 flex flex-col gap-6 sticky top-6">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full ${Config.bg} ${Config.color}`}>
            {Config.label}
          </span>
          {selectedNotif.user_id ? (
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <User size={10} /> User ID: {selectedNotif.user_id}
            </span>
          ) : (
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Users size={10} /> Public Broadcast
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {viewMode === "active" ? (
            <button onClick={() => onArchive(selectedNotif.id)} title="Archive alert" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
              <Archive size={16} />
            </button>
          ) : (
            <button onClick={() => onRestore(selectedNotif.id)} title="Restore to Inbox" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
              <RotateCcw size={16} />
            </button>
          )}
          <button onClick={() => onDelete(selectedNotif.id)} title="Delete permanently" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-slate-400 font-semibold">Dispatched on: {new Date(selectedNotif.created_at).toLocaleString()}</span>
        <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{selectedNotif.title}</h2>
        <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-[#0d1425] p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 whitespace-pre-wrap mt-2">
          {selectedNotif.message}
        </div>
      </div>
      {(selectedNotif.borrow_id || selectedNotif.book_id) && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-2">
          <button onClick={handleNavigate} className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5">
            <span>{selectedNotif.borrow_id ? "Go to Borrow Details" : "Go to Book Details"}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDetail;