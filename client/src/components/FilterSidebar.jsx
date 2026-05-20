import { useState } from "react";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";

// ── Sub-component: Mỗi nhóm filter ────────────────────────────────────────────
function FilterSection({ title, items = [], selectedIds = [], onToggle, maxVisible = 6 }) {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen]         = useState(true);

  const safeItems = Array.isArray(items) ? items : [];
  const visible   = expanded ? safeItems : safeItems.slice(0, maxVisible);

  if (safeItems.length === 0) return null;

  return (
    <div className="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3 text-gray-800 dark:text-gray-200 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
      >
        <span className="text-sm font-semibold">{title}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="space-y-2">
          {visible.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <label key={item.id} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => onToggle(item.id)}
                  className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-gray-300 dark:border-slate-500 hover:border-indigo-500"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  )}
                </div>
                <span
                  onClick={() => onToggle(item.id)}
                  className={`text-sm transition-colors flex-1 min-w-0 ${
                    isSelected
                      ? "text-indigo-700 dark:text-indigo-400 font-medium"
                      : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
                  }`}
                >
                  <span className="truncate block">{item.name}</span>
                </span>
                {item.book_count !== undefined && (
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">
                    {item.book_count}
                  </span>
                )}
              </label>
            );
          })}

          {safeItems.length > maxVisible && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors mt-1"
            >
              {expanded ? "Thu gọn" : `+ ${safeItems.length - maxVisible} mục khác`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main FilterSidebar ────────────────────────────────────────────────────────
/**
 * Props:
 *  filters       — { categoryIds: number[], authorIds: number[], publisherIds: number[], availability: string }
 *  onChange      — (newFilters) => void
 *  categoriesList  — [{ id, name, book_count }]
 *  authorsList     — [{ id, name, book_count }]
 *  publishersList  — [{ id, name, book_count }]
 */
export default function FilterSidebar({
  filters,
  onChange,
  categoriesList  = [],
  authorsList     = [],
  publishersList  = [],
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const safe = {
    categoryIds:  filters?.categoryIds  || [],
    authorIds:    filters?.authorIds    || [],
    publisherIds: filters?.publisherIds || [],
    availability: filters?.availability || "all",
  };

  const activeCount =
    safe.categoryIds.length +
    safe.authorIds.length +
    safe.publisherIds.length +
    (safe.availability !== "all" ? 1 : 0);

  const toggleCategory  = (id) => onChange({ ...safe, categoryIds:  toggle(safe.categoryIds,  id) });
  const toggleAuthor    = (id) => onChange({ ...safe, authorIds:    toggle(safe.authorIds,    id) });
  const togglePublisher = (id) => onChange({ ...safe, publisherIds: toggle(safe.publisherIds, id) });
  const clearAll = () => onChange({ categoryIds: [], authorIds: [], publisherIds: [], availability: "all" });

  function toggle(arr, id) {
    return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
  }

  const content = (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-gray-900 dark:text-gray-100 font-bold text-sm">Bộ lọc</span>
          {activeCount > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{activeCount}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
            <X className="w-3 h-3" /> Xóa lọc
          </button>
        )}
      </div>

      {/* Active filters preview */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">
          {safe.categoryIds.map(id => {
            const c = categoriesList.find(x => x.id === id);
            return c ? (
              <span key={id} onClick={() => toggleCategory(id)} className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] rounded-full cursor-pointer hover:bg-indigo-200 transition-colors">
                {c.name} <X className="w-2.5 h-2.5" />
              </span>
            ) : null;
          })}
          {safe.authorIds.map(id => {
            const a = authorsList.find(x => x.id === id);
            return a ? (
              <span key={id} onClick={() => toggleAuthor(id)} className="flex items-center gap-1 px-2 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[10px] rounded-full cursor-pointer hover:bg-violet-200 transition-colors">
                {a.name} <X className="w-2.5 h-2.5" />
              </span>
            ) : null;
          })}
          {safe.publisherIds.map(id => {
            const p = publishersList.find(x => x.id === id);
            return p ? (
              <span key={id} onClick={() => togglePublisher(id)} className="flex items-center gap-1 px-2 py-1 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-[10px] rounded-full cursor-pointer hover:bg-cyan-200 transition-colors">
                {p.name} <X className="w-2.5 h-2.5" />
              </span>
            ) : null;
          })}
        </div>
      )}

      <FilterSection title="Danh mục"      items={categoriesList}  selectedIds={safe.categoryIds}  onToggle={toggleCategory}  />
      <FilterSection title="Tác giả"       items={authorsList}     selectedIds={safe.authorIds}    onToggle={toggleAuthor}    maxVisible={5} />
      <FilterSection title="Nhà xuất bản"  items={publishersList}  selectedIds={safe.publisherIds} onToggle={togglePublisher} maxVisible={5} />

      {/* Availability */}
      <div>
        <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 font-semibold">Tình trạng sách</p>
        <div className="space-y-2.5">
          {[
            { value: "all",          label: "Tất cả sách"    },
            { value: "in-stock",     label: "Đang có sẵn"    },
            { value: "out-of-stock", label: "Tạm hết sách"   },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer group" onClick={() => onChange({ ...safe, availability: value })}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                safe.availability === value ? "border-indigo-600" : "border-gray-300 dark:border-slate-500"
              }`}>
                {safe.availability === value && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
              </div>
              <span className={`text-sm transition-colors ${
                safe.availability === value ? "text-indigo-700 dark:text-indigo-400 font-medium" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
              }`}>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors w-full justify-center shadow-md"
        >
          <Filter className="w-4 h-4" />
          Bộ lọc {activeCount > 0 && `(${activeCount})`}
          <ChevronDown className={`w-4 h-4 transition-transform ml-auto ${mobileOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileOpen && <div className="mt-3">{content}</div>}
      </div>

      {/* Desktop */}
      <div className="hidden lg:block w-64 shrink-0">{content}</div>
    </>
  );
}
