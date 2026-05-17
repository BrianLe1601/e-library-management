import { useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

function FilterSection({ title, items = [], selected = [], onToggle, maxVisible = 6 }) {
  const [expanded, setExpanded] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(true);
  
  // Đảm bảo items luôn là mảng để không bị lỗi .slice
  const safeItems = Array.isArray(items) ? items : [];
  const visible = expanded ? safeItems : safeItems.slice(0, maxVisible);

  if (safeItems.length === 0) return null; // Ẩn section nếu không có dữ liệu

  return (
    <div className="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
      <button
        onClick={() => setSectionOpen(!sectionOpen)}
        className="flex items-center justify-between w-full mb-3 text-gray-800 dark:text-gray-200 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
      >
        <span className="text-sm font-semibold">{title}</span>
        {sectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {sectionOpen && (
        <div className="space-y-2">
          {visible.map((item) => (
            <label key={item} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => onToggle(item)}
                className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                  selected.includes(item)
                    ? "bg-indigo-600 border-indigo-600"
                    : "border-gray-300 dark:border-slate-500 hover:border-indigo-500"
                }`}
              >
                {selected.includes(item) && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </div>
              <span
                onClick={() => onToggle(item)}
                className={`text-sm transition-colors ${
                  selected.includes(item)
                    ? "text-indigo-700 dark:text-indigo-400 font-medium"
                    : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
                }`}
              >
                {item}
              </span>
            </label>
          ))}
          {safeItems.length > maxVisible && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors mt-2"
            >
              {expanded ? "Thu gọn" : `+${safeItems.length - maxVisible} mục khác`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilterSidebar({ filters, onChange, categoriesList = [], authorsList = [], publishersList = [] }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Khởi tạo an toàn (chống lỗi undefined)
  const safeFilters = {
    categories: filters?.categories || [],
    authors: filters?.authors || [],
    publishers: filters?.publishers || [],
    availability: filters?.availability || "all"
  };

  const toggleCategory = (cat) => {
    const updated = safeFilters.categories.includes(cat)
      ? safeFilters.categories.filter((c) => c !== cat)
      : [...safeFilters.categories, cat];
    onChange({ ...safeFilters, categories: updated });
  };

  const toggleAuthor = (author) => {
    const updated = safeFilters.authors.includes(author)
      ? safeFilters.authors.filter((a) => a !== author)
      : [...safeFilters.authors, author];
    onChange({ ...safeFilters, authors: updated });
  };

  const togglePublisher = (pub) => {
    const updated = safeFilters.publishers.includes(pub)
      ? safeFilters.publishers.filter((p) => p !== pub)
      : [...safeFilters.publishers, pub];
    onChange({ ...safeFilters, publishers: updated });
  };

  const clearAll = () => {
    onChange({ categories: [], authors: [], publishers: [], availability: "all" });
  };

  const activeCount = safeFilters.categories.length + safeFilters.authors.length + safeFilters.publishers.length + (safeFilters.availability !== "all" ? 1 : 0);

  const sidebarContent = (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-gray-900 dark:text-gray-100 font-bold">Bộ lọc</span>
          {activeCount > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{activeCount}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
            Xóa lọc
          </button>
        )}
      </div>

      <FilterSection title="Danh mục" items={categoriesList} selected={safeFilters.categories} onToggle={toggleCategory} />
      <FilterSection title="Tác giả" items={authorsList} selected={safeFilters.authors} onToggle={toggleAuthor} maxVisible={5} />
      <FilterSection title="Nhà xuất bản" items={publishersList} selected={safeFilters.publishers} onToggle={togglePublisher} maxVisible={5} />

      {/* Availability */}
      <div>
        <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 font-semibold">Tình trạng sách</p>
        <div className="space-y-3">
          {[
            { value: "all", label: "Tất cả sách" },
            { value: "in-stock", label: "Đang có sẵn" },
            { value: "out-of-stock", label: "Tạm hết sách" },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => onChange({ ...safeFilters, availability: value })}
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                  safeFilters.availability === value ? "border-indigo-600" : "border-gray-300 dark:border-slate-500"
                }`}
              >
                {safeFilters.availability === value && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
              </div>
              <span
                onClick={() => onChange({ ...safeFilters, availability: value })}
                className={`text-sm transition-colors ${
                  safeFilters.availability === value ? "text-indigo-700 dark:text-indigo-400 font-medium" : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors w-full justify-center shadow-md"
        >
          <Filter className="w-4 h-4" /> Hiện bộ lọc {activeCount > 0 && `(${activeCount})`}
          <ChevronDown className={`w-4 h-4 transition-transform ml-auto ${mobileOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileOpen && <div className="mt-3 animate-in fade-in slide-in-from-top-2">{sidebarContent}</div>}
      </div>
      <div className="hidden lg:block w-64 shrink-0">{sidebarContent}</div>
    </>
  );
}