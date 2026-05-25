import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, BookOpen } from "lucide-react"; // Đã thêm BookOpen bị thiếu ở import cũ
import bookService from "../../services/bookService";
import BookCard from "../../components/BookCard";
import FilterSidebar from "../../components/FilterSidebar";
import Pagination from "../../components/Pagination";

const BOOKS_PER_PAGE = 12; // 12 để chia đều cho lưới 2, 3, 4 cột

const sortOptions = [
  { value: "rating-desc", label: "Rating: High to Low" },
  { value: "rating-asc", label: "Rating: Low to High" },
  { value: "title-asc", label: "Title: A to Z" },
  { value: "title-desc", label: "Title: Z to A" },
  { value: "available", label: "Most Available" },
];

export default function BookListingPage() {
  const [searchParams] = useSearchParams();

  const [booksList, setBooksList] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0); // 🌟 FIX 1: Đã thêm khai báo State lưu số sách tìm thấy
  const [systemStats, setSystemStats] = useState({ totalBooks: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [sortBy, setSortBy] = useState("rating-desc");
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );

  const [filters, setFilters] = useState({
    categories: searchParams.get("category")
      ? [Number(searchParams.get("category"))]
      : [],
    authors: [],
    publishers: [],
    availability: "all",
  });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // 🌟 FIX 2: Sửa lỗi viết sai chính tả từ 'seEffect' thành 'useEffect'
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const statsRes = await bookService
          .getPublicStats()
          .catch(() => ({ data: { success: false } }));
        if (isMounted && statsRes?.data?.success) {
          setSystemStats(statsRes.data.data || { totalBooks: 0 });
        }
      } catch (err) {
        console.error("Lỗi tải thống kê:", err);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const apiParams = {
          search: searchQuery || undefined,
          category: filters.categories.length
            ? filters.categories.join(",")
            : undefined,
          author: filters.authors.length
            ? filters.authors.join(",")
            : undefined,
          publisher: filters.publishers.length
            ? filters.publishers.join(",")
            : undefined,
          availability: filters.availability || "all",
          sort: sortBy,
          page: currentPage,
          limit: BOOKS_PER_PAGE,
        };

        const response = await bookService.getBooks(apiParams);

        if (response.data?.success) {
          setBooksList(response.data.data || []);
          const totalItems = response.data.pagination?.totalItems || 0;
          setTotalBooks(totalItems);
          setTotalPages(
            response.data.pagination?.totalPages ||
              Math.ceil(totalItems / BOOKS_PER_PAGE) ||
              1,
          );
        }
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [searchQuery, filters, sortBy, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-16 transition-colors duration-200">
      {/* ─── Page Title Area ─── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 border-b border-slate-200/50 dark:border-slate-800/60 py-7 transition-all duration-500">
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-30 select-none mix-blend-multiply dark:mix-blend-screen">
          <div
            className="absolute -top-28 -left-12 w-[450px] h-[280px] bg-gradient-to-tr from-sky-400/20 via-blue-300/15 to-transparent dark:from-blue-500/20 dark:via-slate-500/10 dark:to-transparent rounded-full blur-[90px] animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          <div
            className="absolute -bottom-36 right-12 w-[450px] h-[280px] bg-gradient-to-bl from-indigo-300/15 via-blue-200/10 to-transparent dark:from-indigo-500/15 dark:via-slate-600/10 dark:to-transparent rounded-full blur-[100px] animate-pulse"
            style={{ animationDuration: "12s" }}
          />
        </div>

        {/* NỘI DUNG CHÍNH */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            {/* Cụm Tiêu Đề */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700/50 rounded-md transition-colors">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600 dark:bg-blue-400"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Catalog
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Explore</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 dark:from-blue-400 dark:via-indigo-400 dark:to-blue-300 drop-shadow-[0_2px_10px_rgba(59,130,246,0.05)] dark:drop-shadow-[0_2px_10px_rgba(59,130,246,0.15)]">
                  Library Books
                </span>
              </h1>
            </div>

            {/* Khối Thống Kê (Hòa nhập tông Slate Dark) */}
            <div className="flex items-center gap-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] transition-all duration-500">
              <div className="text-left">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                  Total Books
                </p>
                <p className="text-base font-black text-slate-800 dark:text-slate-100 mt-0.5 tracking-wide">
                  {/* 🌟 FIX 3: Chuyển sang hiển thị tổng sách của toàn hệ thống thư viện */}
                  {systemStats.totalBooks
                    ? systemStats.totalBooks.toLocaleString()
                    : "0"}
                </p>
              </div>

              <div className="w-px h-8 bg-slate-200/80 dark:bg-slate-700/80 transition-colors" />

              <div className="text-left">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                  Engine Status
                </p>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Optimal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 shrink-0">
            <FilterSidebar filters={filters} onChange={handleFilterChange} />
          </div>

          {/* Cột hiển thị sách & Toolbar thông minh */}
          <div className="flex-1 min-w-0">
            {/* 🌟 TOOLBAR TÍCH HỢP: Kết hợp Search, Thống kê và Sắp xếp làm một khối */}
            {/* Đã sửa thành lg:justify-between để trên web căn đều 2 bên */}
            <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 transition-colors">
              
              {/* Form Tìm Kiếm Nhỏ Gọn (Inline Search) */}
              <form
                onSubmit={handleSearch}
                className="relative w-full lg:max-w-md group"
              >
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, authors, keywords..."
                  className="w-full pl-10 pr-24 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <button
                  type="submit"
                  className="absolute inset-y-1.5 right-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm active:scale-[0.97]"
                >
                  Search
                </button>
              </form>

              {/* Khu vực Thống kê và Sắp xếp */}
              <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto pt-0 border-0">
                
                {/* Thống kê số lượng kết quả */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                  <span>
                    Found <span className="font-bold text-gray-900 dark:text-white">{totalBooks}</span> books
                  </span>
                </div>

                {/* Dropdown Sắp Xếp */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">
                    Sort:
                  </span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="appearance-none text-sm font-medium border border-gray-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-1.5 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer transition-all"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Books Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: BOOKS_PER_PAGE }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/80 overflow-hidden shadow-sm flex flex-col h-full"
                  >
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
                <h3 className="text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                  No books found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Try adjusting your search or filters to find what you're
                  looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({
                      categories: [],
                      authors: [],
                      publishers: [],
                      availability: "all",
                    });
                    setCurrentPage(1);
                  }}
                  className="mt-5 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-slate-900 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
