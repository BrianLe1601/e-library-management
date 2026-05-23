import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import bookService from "../services/bookService";

function FilterSection({ title, items, selectedIds, onToggle, maxVisible = 6 }) {
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
            <label key={item.id} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => onToggle(item)}
                className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                  selectedIds.includes(item.id)
                    ? "bg-blue-700 border-blue-700"
                    : "border-gray-300 dark:border-slate-500 hover:border-blue-500"
                }`}
              >
                {selectedIds.includes(item.id) && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </div>
              <span
                onClick={() => onToggle(item)}
                className={`text-sm transition-colors ${
                  selectedIds.includes(item.id)
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
                }`}
              >
                {item.name}
                {item.book_count !== undefined && (
                  <span className="ml-1 text-gray-400 dark:text-gray-500 text-xs">({item.book_count})</span>
                )}
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

  // Store objects {id, name, book_count}
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [publishers, setPublishers] = useState([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, authRes, pubRes] = await Promise.all([
          bookService.getCategories(),
          bookService.getAuthors(),
          bookService.getPublishers(),
        ]);

        if (catRes.data?.success) {
          setCategories(catRes.data.data);
        }
        if (authRes.data?.success) {
          setAuthors(authRes.data.data);
        }
        if (pubRes.data?.success) {
          setPublishers(pubRes.data.data);
        }
      } catch (err) {
        console.error("FilterSidebar fetch error:", err);
      }
    };

    fetchFilters();
  }, []);

  const toggleCategory = (item) => {
    const updated = filters.categories.includes(item.id)
      ? filters.categories.filter((id) => id !== item.id)
      : [...filters.categories, item.id];
    onChange({ ...filters, categories: updated });
  };

  const toggleAuthor = (item) => {
    const updated = filters.authors.includes(item.id)
      ? filters.authors.filter((id) => id !== item.id)
      : [...filters.authors, item.id];
    onChange({ ...filters, authors: updated });
  };

  const togglePublisher = (item) => {
    const updated = filters.publishers.includes(item.id)
      ? filters.publishers.filter((id) => id !== item.id)
      : [...filters.publishers, item.id];
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
        selectedIds={filters.categories}
        onToggle={toggleCategory}
        maxVisible={8}
      />

      <FilterSection
        title="Author"
        items={authors}
        selectedIds={filters.authors}
        onToggle={toggleAuthor}
        maxVisible={5}
      />

      <FilterSection
        title="Publisher"
        items={publishers}
        selectedIds={filters.publishers}
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
      <div className="md:hidden mb-4">
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
      <div className="hidden md:block w-64 shrink-0">{sidebarContent}</div>
    </>
  );
}