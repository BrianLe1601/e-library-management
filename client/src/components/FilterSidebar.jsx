import { useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { categories, authors, publishers } from "../pages/data/mockData";

function FilterSection({ title, items, selected, onToggle, maxVisible = 6 }) {
  const [expanded, setExpanded] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(true);
  const visible = expanded ? items : items.slice(0, maxVisible);

  return (
    <div className="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
      <button
        onClick={() => setSectionOpen(!sectionOpen)}
        className="flex items-center justify-between w-full mb-3 text-gray-800 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
      >
        <span className="text-sm" style={{ fontWeight: 600 }}>{title}</span>
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
                    ? "bg-blue-700 border-blue-700"
                    : "border-gray-300 dark:border-slate-500 hover:border-blue-500"
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
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
                }`}
              >
                {item}
              </span>
            </label>
          ))}
          {items.length > maxVisible && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mt-1"
            >
              {expanded ? "Show less" : `+${items.length - maxVisible} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilterSidebar({ filters, onChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCategory = (cat) => {
    const updated = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onChange({ ...filters, categories: updated });
  };

  const toggleAuthor = (author) => {
    const updated = filters.authors.includes(author)
      ? filters.authors.filter((a) => a !== author)
      : [...filters.authors, author];
    onChange({ ...filters, authors: updated });
  };

  const togglePublisher = (pub) => {
    const updated = filters.publishers.includes(pub)
      ? filters.publishers.filter((p) => p !== pub)
      : [...filters.publishers, pub];
    onChange({ ...filters, publishers: updated });
  };

  const clearAll = () => {
    onChange({ categories: [], authors: [], publishers: [], availability: "all" });
  };

  const activeCount =
    filters.categories.length +
    filters.authors.length +
    filters.publishers.length +
    (filters.availability !== "all" ? 1 : 0);

  const sidebarContent = (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <span className="text-gray-900 dark:text-gray-100" style={{ fontWeight: 700 }}>Filters</span>
          {activeCount > 0 && (
            <span className="bg-blue-700 text-white text-xs px-1.5 py-0.5 rounded-full">{activeCount}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 transition-colors">
            Clear all
          </button>
        )}
      </div>

      <FilterSection
        title="Category"
        items={categories}
        selected={filters.categories}
        onToggle={toggleCategory}
        maxVisible={8}
      />

      <FilterSection
        title="Author"
        items={authors}
        selected={filters.authors}
        onToggle={toggleAuthor}
        maxVisible={5}
      />

      <FilterSection
        title="Publisher"
        items={publishers}
        selected={filters.publishers}
        onToggle={togglePublisher}
        maxVisible={5}
      />

      {/* Availability */}
      <div>
        <p className="text-sm text-gray-800 dark:text-gray-200 mb-3" style={{ fontWeight: 600 }}>Availability</p>
        <div className="space-y-2">
          {[
            { value: "all", label: "All Books" },
            { value: "in-stock", label: "In Stock" },
            { value: "out-of-stock", label: "Out of Stock" },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => onChange({ ...filters, availability: value })}
                className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                  filters.availability === value
                    ? "border-blue-700"
                    : "border-gray-300 dark:border-slate-500"
                }`}
              >
                {filters.availability === value && (
                  <div className="w-2 h-2 bg-blue-700 rounded-full" />
                )}
              </div>
              <span
                onClick={() => onChange({ ...filters, availability: value })}
                className={`text-sm transition-colors ${
                  filters.availability === value
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
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
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 text-white rounded-xl text-sm hover:bg-blue-800 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters {activeCount > 0 && `(${activeCount})`}
          <ChevronDown className={`w-4 h-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileOpen && <div className="mt-3">{sidebarContent}</div>}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 shrink-0">{sidebarContent}</div>
    </>
  );
}
