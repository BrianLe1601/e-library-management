import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, BookOpen } from "lucide-react";
import bookService from "../../services/bookService";
import BookCard from "../../components/BookCard";
import FilterSidebar from "../../components/FilterSidebar";
import Pagination from "../../components/Pagination";

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

  const [booksList, setBooksList] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [sortBy, setSortBy] = useState("rating-desc");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  // filters.categories / authors / publishers now store arrays of IDs (numbers)
  const [filters, setFilters] = useState({
    categories: searchParams.get("category") ? [Number(searchParams.get("category"))] : [],
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

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const apiParams = {
          search: searchQuery || undefined,
          category: filters.categories.length ? filters.categories.join(",") : undefined,
          author: filters.authors.length ? filters.authors.join(",") : undefined,
          publisher: filters.publishers.length ? filters.publishers.join(",") : undefined,
          availability: filters.availability || 'all',
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
              1
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Page Header */}
      <div className="bg-blue-900 dark:bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-300" />
            <span className="text-blue-300 text-sm">Catalog</span>
          </div>
          <h1 className="text-white text-3xl font-bold mb-4">Book Catalog</h1>
          <p className="text-blue-200 text-sm max-w-xl mb-6">
            Browse our complete collection of academic and literary works. Use filters to find exactly what you need.
          </p>

          <form
            onSubmit={handleSearch}
            className="flex max-w-lg bg-white/10 border border-white/20 rounded-xl overflow-hidden"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, authors, topics..."
              className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-white/50 outline-none"
            />
            <button type="submit" className="px-5 bg-blue-600 hover:bg-blue-500 transition-colors">
              <Search className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar Filters */}
          <div className="w-full md:w-64 shrink-0">
            <FilterSidebar filters={filters} onChange={handleFilterChange} />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {totalBooks}
                  </span>{" "}
                  books found
                  {searchQuery && <span className="ml-1">for "{searchQuery}"</span>}
                </span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Books Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : booksList.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {booksList.map((book) => (
                    <BookCard key={book.id} book={book} variant="listing" />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8">
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
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <BookOpen className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-gray-700 dark:text-gray-300 mb-2 font-semibold">No books found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({ categories: [], authors: [], publishers: [], availability: "all" });
                    setCurrentPage(1);
                  }}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
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
