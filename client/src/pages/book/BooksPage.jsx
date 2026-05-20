import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, BookOpen, Loader2 } from "lucide-react";
import BookCard from "../../components/BookCard";
import FilterSidebar from "../../components/FilterSidebar";
import Pagination from "../../components/Pagination";
import bookService from "../../services/bookService";

const BOOKS_PER_PAGE = 9;

const SORT_OPTIONS = [
  { value: "rating-desc", label: "Đánh giá: Cao → Thấp" },
  { value: "rating-asc",  label: "Đánh giá: Thấp → Cao" },
  { value: "title-asc",   label: "Tên: A → Z"           },
  { value: "title-desc",  label: "Tên: Z → A"           },
  { value: "available",   label: "Còn nhiều nhất"        },
  { value: "latest",      label: "Mới thêm gần đây"     },
];

export default function BooksPage() {
  const [searchParams] = useSearchParams();

  // Dữ liệu sách
  const [books,      setBooks]      = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [loading,    setLoading]    = useState(true);

  // Lookup lists cho FilterSidebar (load một lần)
  const [categoriesList,  setCategoriesList]  = useState([]);
  const [authorsList,     setAuthorsList]     = useState([]);
  const [publishersList,  setPublishersList]  = useState([]);
  const [lookupLoading,   setLookupLoading]   = useState(true);

  // Filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy,      setSortBy]      = useState(searchParams.get("sort") || "rating-desc");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [draftSearch, setDraftSearch] = useState(searchParams.get("search") || "");

  const initCategoryId = searchParams.get("category") ? Number(searchParams.get("category")) : null;
  const [filters, setFilters] = useState({
    categoryIds:  initCategoryId ? [initCategoryId] : [],
    authorIds:    [],
    publisherIds: [],
    availability: "all",
  });

  // ── Load lookup data một lần ──────────────────────────────────────────────
  useEffect(() => {
    setLookupLoading(true);
    Promise.all([
      bookService.getCategories().catch(() => ({ success: false })),
      bookService.getAuthors().catch(() => ({ success: false })),
      bookService.getPublishers().catch(() => ({ success: false })),
    ]).then(([cats, auths, pubs]) => {
      if (cats.success)  setCategoriesList(cats.data   || []);
      if (auths.success) setAuthorsList(auths.data     || []);
      if (pubs.success)  setPublishersList(pubs.data   || []);
    }).finally(() => setLookupLoading(false));
  }, []);

  // ── Fetch sách mỗi khi filter thay đổi ───────────────────────────────────
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search:    searchQuery,
        category:  filters.categoryIds.length  > 0 ? filters.categoryIds[0]  : "",
        author:    filters.authorIds.length    > 0 ? filters.authorIds[0]    : "",
        publisher: filters.publisherIds.length > 0 ? filters.publisherIds[0] : "",
        sort:      sortBy,
        page:      currentPage,
        limit:     BOOKS_PER_PAGE,
      };

      const res = await bookService.getBooks(params);
      if (res.success) {
        let data = res.data || [];

        // Client-side filter availability (backend không có field này trực tiếp)
        if (filters.availability === "in-stock") {
          data = data.filter(b => (b.available_copies || 0) > 0);
        } else if (filters.availability === "out-of-stock") {
          data = data.filter(b => (b.available_copies || 0) === 0);
        }

        setBooks(data);
        setTotalBooks(res.meta?.total || data.length);
      }
    } catch (err) {
      console.error("[BooksPage] fetchBooks:", err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, currentPage, sortBy]);

  useEffect(() => {
    fetchBooks();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchBooks]);

  const totalPages = Math.ceil(totalBooks / BOOKS_PER_PAGE) || 1;

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(draftSearch);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSort = (val) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* ── Page Header ── */}
      <div className="bg-blue-900 dark:bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-300" />
            <span className="text-blue-300 text-sm font-medium uppercase tracking-wider">Danh Mục Sách</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Khám phá Kho Tri Thức</h1>
          <p className="text-blue-200 text-sm max-w-xl mb-6">
            Hàng nghìn đầu sách học thuật, văn học và nghiên cứu đang chờ bạn. Dùng thanh tìm kiếm để tìm sách yêu thích.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex max-w-lg bg-white/10 border border-white/20 rounded-xl overflow-hidden shadow-inner">
            <input
              type="text"
              value={draftSearch}
              onChange={e => setDraftSearch(e.target.value)}
              placeholder="Tìm theo tên sách, tác giả, ISBN..."
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-white/50 outline-none"
            />
            <button type="submit" className="px-5 bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </button>
          </form>

          {/* Active search indicator */}
          {searchQuery && (
            <p className="text-blue-300 text-xs mt-2">
              Đang tìm kiếm: <span className="font-semibold text-white">"{searchQuery}"</span>
              <button onClick={() => { setSearchQuery(''); setDraftSearch(''); setCurrentPage(1); }} className="ml-2 text-blue-400 hover:text-white underline">Xóa</button>
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Filter Sidebar ── */}
          <FilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            categoriesList={categoriesList}
            authorsList={authorsList}
            publishersList={publishersList}
          />

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 px-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {loading ? (
                    <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Đang tìm...</span>
                  ) : (
                    <>
                      Tìm thấy <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalBooks}</span> sách
                      {searchQuery && <span className="text-gray-400"> cho "{searchQuery}"</span>}
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-gray-500 hidden sm:block whitespace-nowrap">Sắp xếp:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={e => handleSort(e.target.value)}
                  className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Books Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Đang tải danh sách sách...</p>
              </div>
            ) : books.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
                  {books.map(book => (
                    <BookCard key={book.id} book={book} variant="listing" />
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
                <BookOpen className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Không tìm thấy sách</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs mx-auto">
                  Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc để tìm kết quả phù hợp hơn.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery(''); setDraftSearch('');
                    setFilters({ categoryIds: [], authorIds: [], publisherIds: [], availability: 'all' });
                    setCurrentPage(1);
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
