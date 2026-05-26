import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Users, User } from "lucide-react";

const ComposeModal = ({ isOpen, onClose, userList, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    scope: "all", user_id: "", type: "system", title: "", message: "", borrow_id: "", book_id: ""
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, () => setFormData({ scope: "all", user_id: "", type: "system", title: "", message: "", borrow_id: "", book_id: "" }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#090f1c] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0b1222]">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Broadcast System Notification</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Send a push banner message to users instantly.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Scope Target</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setFormData(p => ({ ...p, scope: "all", user_id: "" }))} className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${formData.scope === "all" ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-800 dark:text-indigo-400" : "bg-slate-50 border-slate-200 dark:bg-[#0d1527] dark:border-slate-800/80 text-slate-600 dark:text-slate-400"}`}>
                <Users size={14} /> Public Global
              </button>
              <button type="button" onClick={() => setFormData(p => ({ ...p, scope: "user" }))} className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${formData.scope === "user" ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-800 dark:text-indigo-400" : "bg-slate-50 border-slate-200 dark:bg-[#0d1527] dark:border-slate-800/80 text-slate-600 dark:text-slate-400"}`}>
                <User size={14} /> Specific User
              </button>
            </div>
          </div>

          {formData.scope === "user" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Recipient User</label>
              <select required value={formData.user_id} onChange={(e) => setFormData(p => ({ ...p, user_id: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white">
                <option value="">-- Choose library member --</option>
                {userList.map(u => (<option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Borrow ID (Optional)</label>
              <input type="number" placeholder="e.g. 1" value={formData.borrow_id} onChange={(e) => setFormData(p => ({ ...p, borrow_id: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 text-slate-900 dark:text-white" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Book ID (Optional)</label>
              <input type="number" placeholder="e.g. 5" value={formData.book_id} onChange={(e) => setFormData(p => ({ ...p, book_id: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 text-slate-900 dark:text-white" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Classification Group</label>
            <select value={formData.type} onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 text-slate-900 dark:text-white">
              <option value="system">System Broadcast</option>
              <option value="overdue">Overdue Reminder</option>
              <option value="approved">Borrow Approval</option>
              <option value="returned">Return Confirmation</option>
              <option value="fine">Fine Notice</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notification Title</label>
            <input type="text" required placeholder="e.g. System Maintenance Window" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 text-slate-900 dark:text-white" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Detailed Message Payload</label>
            <textarea required rows={4} placeholder="Type the message body details here..." value={formData.message} onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 resize-none leading-relaxed" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button type="button" disabled={isSubmitting} onClick={onClose} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080d1a] px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50">
              {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : "Dispatch Alert"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeModal;