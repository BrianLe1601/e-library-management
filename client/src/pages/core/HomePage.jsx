import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Clock, Award, Star, Flame, Sparkles, Tag } from "lucide-react";
import HeroCarousel from "../../components/HeroCarousel";
import BookCard from "../../components/BookCard";
import bookService from "../../services/bookService";
import { getStats } from "../../services/adminService";

function BookSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [newest, setNewest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryBooks, setCategoryBooks] = useState([]);
  const [systemStats, setSystemStats] = useState({ totalBooks: 0, totalUsers: 0, activeBorrows: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all primary landing page components simultaneously
        const [featuredRes, topRatedRes, newestRes, categoriesRes, statsRes] = await Promise.all([
          bookService.getFeatured(6).catch(() => ({ data: { success: false } })),
          bookService.getTopRated(6).catch(() => ({ data: { success: false } })),
          bookService.getNewest(6).catch(() => ({ data: { success: false } })),
          bookService.getCategories().catch(() => ({ data: { success: false } })),
          getStats().catch(() => ({ data: { success: false } }))
        ]);

        // Map responses based on the established axis server structure (.data.data)
        if (featuredRes.data?.success) setFeatured(featuredRes.data.data || []);
        if (topRatedRes.data?.success) setTopRated(topRatedRes.data.data || []);
        if (newestRes.data?.success) setNewest(newestRes.data.data || []);
        if (statsRes.data?.success) setSystemStats(statsRes.data.data || { totalBooks: 0, totalUsers: 0, activeBorrows: 0 });

        if (categoriesRes.data?.success) {
          const allCats = categoriesRes.data.data || [];
          setCategories(allCats.slice(0, 8)); // Top 8 genres grid for design consistency

          // 2. Discover the first non-empty category to map the dynamic spotlight footer
          const firstCat = allCats.find(c => c.book_count > 0);
          if (firstCat) {
            const catBooksRes = await bookService.getBooks({ category: firstCat.id, limit: 6 }).catch(() => ({ data: { success: false } }));
            if (catBooksRes.data?.success) {
              setCategoryBooks(catBooksRes.data.data || []);
            }
          }
        }
      } catch (err) {
        console.error('HomePage structural payload fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Structural dynamic dashboard indicators compiled from internal metrics
  const dynamicStats = [
    { icon: BookOpen, label: "Total Books Available", value: loading ? "..." : (systemStats.totalBooks || 0).toLocaleString() },
    { icon: Users,    label: "Active Members",       value: loading ? "..." : (systemStats.totalUsers || 0).toLocaleString() },
    { icon: Clock,    label: "Books Checked Out",    value: loading ? "..." : (systemStats.activeBorrows || 0).toLocaleString() },
    { icon: Award,    label: "Featured Titles",      value: loading ? "..." : (featured.length || 0).toString() },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero Interactive Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <HeroCarousel />
      </section>

      {/* 1. SECTION: SYSTEM METRICS (DYNAMIC STATS) */}
      <section className="bg-blue-900 dark:bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {dynamicStats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center">
                <div className="bg-blue-800/50 dark:bg-blue-900/50 p-3 rounded-xl mb-3">
                  <stat.icon className="w-5 h-5 text-blue-300" />
                </div>
                <p className="text-2xl text-white font-bold">{stat.value}</p>
                <p className="text-sm text-blue-200 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. SECTION: GENRES & CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-6 bg-indigo-600 rounded-full" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-500" /> Explore Categories
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />)
            : categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/books?category=${cat.id}`}
                  className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/60 rounded-xl hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-400 transition-all text-center group"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {cat.name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    {cat.book_count || 0} items
                  </span>
                </Link>
              ))}
        </div>
      </section>

      {/* 3. SECTION: FEATURED BOOKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <span className="text-sm text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Editor's Picks
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Featured Books</h2>
          </div>
          <Link to="/books?filter=featured" className="flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors font-medium">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <BookSkeleton key={i} />)
            : featured.length > 0
              ? featured.map((book) => <BookCard key={book.id} book={book} variant="trending" />)
              : <p className="col-span-6 text-center text-gray-400 py-8 text-sm">No featured books found</p>
          }
        </div>
      </section>

      {/* 4. SECTION: TRENDING & TOP RATED */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-6 bg-amber-500 rounded-full" />
              <span className="text-sm text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" /> Most Popular Demands
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trending — Top Rated</h2>
          </div>
          <Link to="/books?sort=rating" className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 transition-colors font-medium">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <BookSkeleton key={i} />)
            : topRated.length > 0
              ? topRated.map((book) => <BookCard key={book.id} book={book} variant="trending" />)
              : <p className="col-span-6 text-center text-gray-400 py-8 text-sm">No highly-rated titles available</p>
          }
        </div>
      </section>

      {/* 5. SECTION: NEWEST ACQUISITIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-6 bg-rose-500 rounded-full" />
              <span className="text-sm text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <Flame className="w-4 h-4" /> Just Added to Catalog
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Newest Books</h2>
          </div>
          <Link to="/books?sort=newest" className="flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-800 transition-colors font-medium">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <BookSkeleton key={i} />)
            : newest.length > 0
              ? newest.map((book) => <BookCard key={book.id} book={book} variant="trending" />)
              : <p className="col-span-6 text-center text-gray-400 py-8 text-sm">No newly added titles found</p>
          }
        </div>
      </section>

      {/* Interface Boundary Rule Line */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        <div className="border-t border-gray-200 dark:border-slate-700" />
      </div>

      {/* 6. SECTION: DYNAMIC DISCOVERY CORNER BY GENRE */}
      {!loading && categoryBooks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1 h-6 bg-emerald-600 rounded-full" />
                <span className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
                  Spotlight Category: {categories.find(c => c.book_count > 0)?.name || 'Genre Collections'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Discover More</h2>
            </div>
            <Link to={`/books?category=${categories.find(c => c.book_count > 0)?.id}`} className="flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 transition-colors font-medium">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoryBooks.map((book) => <BookCard key={book.id} book={book} variant="trending" />)}
          </div>
        </section>
      )}

      {/* CTA Conversion Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 dark:from-blue-950 dark:to-slate-900 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">Explore the Entire Library</h2>
            <p className="text-blue-200 text-sm md:text-base max-w-md">
              Access thousands of diverse titles — Literature, Science, Technology, Philosophy, and much more.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/books" className="px-6 py-3 bg-white text-blue-900 rounded-xl text-sm hover:bg-blue-50 transition-colors font-semibold">
              Browse Catalog
            </Link>
            <Link to="/dashboard" className="px-6 py-3 bg-blue-700/50 text-white border border-blue-500 rounded-xl text-sm hover:bg-blue-700 transition-colors font-medium">
              My Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}