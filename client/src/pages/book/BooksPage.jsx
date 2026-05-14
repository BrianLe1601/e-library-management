import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, BookOpen } from "lucide-react";
import { books } from "../data/mockData";
import BookCard  from "../../components/BookCard";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("rating-desc");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState({
    categories: searchParams.get("category") ? [searchParams.get("category")] : [],
    authors: [],
    publishers: [],
    availability: "all",
  });

  const filteredBooks = useMemo(() => {
    let result = [...books];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.tags.some((t) => t.includes(q))
      );
    }

    if (filters.categories.length > 0) {
      result = result.filter((b) => filters.categories.includes(b.category));
    }
    if (filters.authors.length > 0) {
      result = result.filter((b) => filters.authors.includes(b.author));
    }
    if (filters.publishers.length > 0) {
      result = result.filter((b) => filters.publishers.includes(b.publisher));
    }
    if (filters.availability === "in-stock") {
      result = result.filter((b) => b.availableCopies > 0);
    } else if (filters.availability === "out-of-stock") {
      result = result.filter((b) => b.availableCopies === 0);
    }

    switch (sortBy) {
      case "rating-desc":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "rating-asc":
        result.sort((a, b) => a.rating - b.rating);
        break;
      case "title-asc":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "available":
        result.sort((a, b) => b.availableCopies - a.availableCopies);
        break;
    }

    return result;
  }, [searchQuery, filters, sortBy]);

  const totalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * BOOKS_PER_PAGE,
    currentPage * BOOKS_PER_PAGE
  );

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Page Header */}
      <div className="bg-blue-900 dark:bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-300" />
            <span className="text-blue-300 text-sm">Catalog</span>
          </div>
          <h1 className="text-white mb-4">Book Catalog</h1>
          <p className="text-blue-200 text-sm max-w-xl mb-6">
            Browse our complete collection of academic and literary works. Use filters to find exactly what you need.
          </p>
          {/* Search in page header */}
          <form onSubmit={handleSearch} className="flex max-w-lg bg-white/10 border border-white/20 rounded-xl overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
        <div className="flex gap-8">
          {/* Sidebar */}
          <FilterSidebar filters={filters} onChange={handleFilterChange} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <span style={{ fontWeight: 600 }} className="text-gray-900 dark:text-gray-100">
                    {filteredBooks.length}
                  </span>{" "}
                  books found
                  {searchQuery && (
                    <span className="ml-1">
                      for "{searchQuery}"
                    </span>
                  )}
                </span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="text-sm border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Books Grid */}
            {paginatedBooks.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {paginatedBooks.map((book) => (
                    <BookCard key={book.id} book={book} variant="listing" />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                />
              </>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-gray-700 dark:text-gray-300 mb-2">No books found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
