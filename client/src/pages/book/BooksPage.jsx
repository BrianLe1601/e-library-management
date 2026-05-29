import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, BookOpen, X, Star } from "lucide-react";
import bookService from "../../services/bookService";
import BookCard from "../../components/BookCard";
import FilterSidebar from "../../components/FilterSidebar";
import Pagination from "../../components/Pagination";

const BOOKS_PER_PAGE = 12;

const sortOptions = [
  { value: "default",  label: " Default" },
  { value: "featured", label: " Featured Books" },
  { value: "trending", label: " Trending — Top Rated" },
  { value: "newest",   label: " Newest Books" },
];

export default function BookListingPage() {
  const [searchParams] = useSearchParams();

  // ── Data states ─────────────────────────────────────────────────────────────
  const [booksList, setBooksList]     = useState([]);
  const [totalBooks, setTotalBooks]   = useState(0);
  const [systemStats, setSystemStats] = useState({ totalBooks: 0 });
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  // ── Sort / Filter ────────────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState(() => {
    const filter = searchParams.get("filter");
    const sort   = searchParams.get("sort");
    if (filter === "featured") return "featured";
    if (sort === "trending")   return "trending"; 
    if (sort === "newest")     return "newest";
    return "default";
  });
  const [filters, setFilters] = useState({
    // Luôn lưu dưới dạng Number để nhất quán với API và FilterSidebar
    categories: searchParams.get("category")
      ? [Number(searchParams.get("category"))]
      : [],
    authors:      [],   // number[]
    publishers:   [],   // number[]
    availability: "all",
  });

  // ── Search ───────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState(searchParams.get("search") || "");
  const [inputValue,  setInputValue]          = useState(searchParams.get("search") || "");
  const [suggestions, setSuggestions]         = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggLoading, setSuggLoading]         = useState(false);
  const searchWrapRef = useRef(null);
  const debounceRef   = useRef(null);

//------------------------------------------------------------------------------

// ── Sync sortBy khi URL thay đổi ─────────────────────────────────────────────
useEffect(() => {
  const filter = searchParams.get("filter");
  const sort   = searchParams.get("sort");
  if (filter === "featured")    setSortBy("featured");
  else if (sort === "trending") setSortBy("trending");
  else if (sort === "newest")   setSortBy("newest");
  else                          setSortBy("default");
  setCurrentPage(1);
}, [searchParams]);

// ── Sync category filter khi URL thay đổi ────────────────────────────────────
useEffect(() => {
  const cat = searchParams.get("category");
  setFilters(prev => ({
    ...prev,
    categories: cat ? [Number(cat)] : [],
  }));
  setCurrentPage(1);
}, [searchParams]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setSearchQuery(inputValue.trim());
    setSuggestions([]);
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setShowSuggestions(true);
    clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setSuggestions([]);
      setSuggLoading(false);
      return;
    }

    setSuggLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await bookService.getSuggestions(val.trim());
        if (res.data?.success) setSuggestions(res.data.data || []);
      } catch (_) {
        setSuggestions([]);
      } finally {
        setSuggLoading(false);
      }
    }, 280);
  };

  const handleSelectSuggestion = (book) => {
    setInputValue(book.title);
    setSearchQuery(book.title);
    setSuggestions([]);
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setInputValue("");
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch stats (1 lần) ──────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    bookService.getPublicStats()
      .then((res) => { if (alive && res.data?.success) setSystemStats(res.data.data || { totalBooks: 0 }); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // ── Fetch books ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const response = await bookService.getBooks({
          search:       searchQuery   || undefined,
          category:     filters.categories.length  ? filters.categories.join(",")  : undefined,
          author:       filters.authors.length      ? filters.authors.join(",")      : undefined,
          publisher:    filters.publishers.length   ? filters.publishers.join(",")   : undefined,
          availability: filters.availability || "all",
          sort:         sortBy,
          page:         currentPage,
          limit:        BOOKS_PER_PAGE,
        });

        if (response.data?.success) {
          setBooksList(response.data.data || []);
          const total = response.data.meta?.total || 0;
          setTotalBooks(total);
          setTotalPages(response.data.meta?.totalPages || Math.ceil(total / BOOKS_PER_PAGE) || 1);
        }
      } catch (err) {
        console.error("Error fetching books:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [searchQuery, filters, sortBy, currentPage]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-16 transition-colors duration-200">

      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 border-b border-slate-200/50 dark:border-slate-800/60 py-7">
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-30 select-none mix-blend-multiply dark:mix-blend-screen">
          <div className="absolute -top-28 -left-12 w-[450px] h-[280px] bg-gradient-to-tr from-sky-400/20 via-blue-300/15 to-transparent rounded-full blur-[90px] animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute -bottom-36 right-12 w-[450px] h-[280px] bg-gradient-to-bl from-indigo-300/15 via-blue-200/10 to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "12s" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            {/* Title */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700/50 rounded-md">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600 dark:bg-blue-400" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Catalog</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Explore</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-300">
                  Library Books
                </span>
              </h1>
            </div>

            {/* Stats pill */}
            <div className="flex items-center gap-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 px-5 py-3 rounded-2xl shadow-sm">
              <div className="text-left">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Books</p>
                <p className="text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
                  {systemStats.totalBooks ? systemStats.totalBooks.toLocaleString() : "0"}
                </p>
              </div>
              <div className="w-px h-8 bg-slate-200/80 dark:bg-slate-700/80" />
              <div className="text-left">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Engine Status</p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Optimal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">

          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <FilterSidebar filters={filters} onChange={handleFilterChange} />
          </div>

          {/* Books column */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

              {/* Search wrapper */}
              <div ref={searchWrapRef} className="relative w-full lg:max-w-md">
                <form onSubmit={handleSearch} className="relative group">
                  {/* Search icon */}
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>

                  {/* Input */}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Search titles, authors, keywords..."
                    className="w-full pl-10 pr-24 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />

                  {/* Clear button */}
                  {inputValue && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute inset-y-0 right-[72px] px-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    className="absolute inset-y-1.5 right-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm active:scale-[0.97]"
                  >
                    Search
                  </button>
                </form>

                {/* Suggestions dropdown */}
                {showSuggestions && inputValue.trim().length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {suggLoading ? (
                      <div className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-400">
                        <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        Đang tìm kiếm...
                      </div>
                    ) : suggestions.length > 0 ? (
                      <ul>
                        {suggestions.map((book) => (
                          <li key={book.id} className="border-b border-gray-100 dark:border-slate-700/60 last:border-0">
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSelectSuggestion(book)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700/60 transition-colors text-left"
                            >
                              {/* Book cover */}
                              <img
                                src={book.coverUrl}
                                alt={book.title}
                                className="w-8 h-11 object-cover rounded flex-shrink-0 border border-gray-100 dark:border-slate-600"
                              />
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {book.title}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-slate-400 truncate mt-0.5">
                                  {book.author}
                                  {book.category && (
                                    <span className="ml-1.5 text-blue-500 dark:text-blue-400">· {book.category}</span>
                                  )}
                                </p>
                              </div>
                              {/* Rating + availability */}
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {Number(book.rating).toFixed(1)}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                  book.availableCopies > 0
                                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                                    : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                                }`}>
                                  {book.availableCopies > 0 ? "Available" : "Out"}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}

                        {/* Search all results */}
                        <li>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setShowSuggestions(false); handleSearch({ preventDefault: () => {} }); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 font-medium transition-colors"
                          >
                            <Search className="w-3.5 h-3.5" />
                            Tìm tất cả kết quả cho &ldquo;{inputValue}&rdquo;
                          </button>
                        </li>
                      </ul>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-400 dark:text-slate-500">
                        Không tìm thấy gợi ý nào cho &ldquo;{inputValue}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* end search wrapper */}

              {/* Stats + Sort */}
              <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto">
                {/* Result count */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                  <span>
                    Found <span className="font-bold text-gray-900 dark:text-white">{totalBooks}</span> books
                  </span>
                </div>

                {/* Sort select */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">Sort:</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                      className="appearance-none text-sm font-medium border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-1.5 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-all"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            {/* end toolbar */}

            {/* Books grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: BOOKS_PER_PAGE }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/80 overflow-hidden shadow-sm flex flex-col h-full">
                    <div className="w-full aspect-[3/4] bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="p-3.5 flex-1 flex flex-col gap-3">
                      <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-700/40 flex justify-between">
                        <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : booksList.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {booksList.map((book) => (
                    <BookCard key={book.id} book={book} variant="listing" />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <BookOpen className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-gray-700 dark:text-gray-300 mb-2 font-semibold">No books found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Try adjusting your search or filters to find what you&apos;re looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setInputValue("");
                    setSuggestions([]);
                    setFilters({ categories: [], authors: [], publishers: [], availability: "all" });
                    setCurrentPage(1);
                  }}
                  className="mt-5 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-slate-900 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}

          </div>
          {/* end books column */}
        </div>
      </div>

    </div>
  );
}
