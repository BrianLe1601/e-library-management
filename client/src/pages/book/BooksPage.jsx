import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, BookOpen, Loader2 } from "lucide-react";
import BookCard from "../../components/BookCard";
import FilterSidebar from "../../components/FilterSidebar";
import Pagination from "../../components/Pagination";
import bookService from "../../services/bookService";

const BOOKS_PER_PAGE = 9;

const sortOptions = [
  { value: "rating-desc", label: "Rating: High to Low" },
  { value: "rating-asc", label: "Rating: Low to High" },
  { value: "title-asc", label: "Title: A to Z" },
  { value: "title-desc", label: "Title: Z to A" },
  { value: "available", label: "Most Available" },
];

export default function BookListingPage() {
  const [searchParams] = useSearchParams();
  
  // States quản lý dữ liệu thật từ Backend
  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [loading, setLoading] = useState(true);

  // States bộ lọc
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("rating-desc");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState({
    categories: searchParams.get("category") ? [searchParams.get("category")] : [],
    authors: [],
    publishers: [],
    availability: "all"
  });

  // Gọi API lấy danh sách sách mỗi khi bộ lọc thay đổi
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const categoryId = filters.categories?.length > 0 ? filters.categories[0] : "";
        // 1. Gửi request lấy dữ liệu (Backend đã xử lý sẵn Limit, Page và Sort)
        const response = await bookService.getBooks({
          search: searchQuery,
          category: categoryId,
          author: filters.authors?.length > 0 ? filters.authors[0] : "",
          publisher: filters.publishers?.length > 0 ? filters.publishers[0] : "",
          availability: filters.availability,
          page: currentPage,
          limit: BOOKS_PER_PAGE,
          sort: sortBy 
        });

        if (response.success) {
          // Lấy danh sách sách an toàn
          let fetchedBooks = response.data;
          
          // Xử lý Client-side sort cục bộ cho trang hiện tại
          switch (sortBy) {
            case "rating-desc":
              fetchedBooks.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
              break;
            case "rating-asc":
              fetchedBooks.sort((a, b) => (a.avg_rating || 0) - (b.avg_rating || 0));
              break;
            case "title-asc":
              fetchedBooks.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
              break;
            case "title-desc":
              fetchedBooks.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
              break;
            case "available":
              fetchedBooks.sort((a, b) => (b.available_copies || 0) - (a.available_copies || 0));
              break;
            default:
              break;
          }

          setBooks(fetchedBooks);
          const totalRecords = response.pagination?.total || fetchedBooks.length;
          setTotalBooks(response.meta.total);
        }
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchQuery, filters, currentPage, sortBy]);
  const totalPages = Math.ceil(totalBooks / BOOKS_PER_PAGE) || 1;

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset về trang 1 khi đổi bộ lọc
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* ── Page Header ── */}
      <div className="bg-blue-900 dark:bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-300" />
            <span className="text-blue-300 text-sm font-medium uppercase tracking-wider">Book Catalog</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Explore Our Knowledge Base</h1>
          <p className="text-blue-200 text-sm max-w-xl mb-6">
            Thousands of academic books, literature, and research materials are waiting for you. Use the search bar to find your desired books.
          </p>
          <form onSubmit={handleSearch} className="flex max-w-lg bg-white/10 border border-white/20 rounded-xl overflow-hidden shadow-inner">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-white/50 outline-none"
            />
            <button type="submit" className="px-5 bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Filter Sidebar ── */}
          <div className="w-full lg:w-64 shrink-0">
            <FilterSidebar filters={filters} onChange={handleFilterChange} />
          </div>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 px-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Found <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalBooks}</span> books
                  {searchQuery && <span> for "{searchQuery}"</span>}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-gray-500 hidden sm:block">Sort by:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                  className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Books Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Loading books...</p>
              </div>
            ) : books.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
                  {books.map((book) => (
                    <BookCard key={book.id} book={book} variant="listing" />
                  ))}
                </div>
                
                {/* Pagination */}
                <div className="mt-8 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
                <BookOpen className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No books found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Please try adjusting your search keywords or filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}