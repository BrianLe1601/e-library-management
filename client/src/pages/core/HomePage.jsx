import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Clock, Award, Star, Flame, Sparkles, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import HeroCarousel from "../../components/HeroCarousel";
import BookCard from "../../components/BookCard";
import bookService from "../../services/bookService";

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
function BookSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-pulse flex flex-col">
      <div className="w-full aspect-[3/4] bg-gray-200 dark:bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

/* ─── Scrollable row with arrow buttons ────────────────────────────────────── */
function BookRow({ books, loading, emptyMessage }) {
  const rowRef = useRef(null);
  const scroll = (dir) => {
    rowRef.current?.scrollBy({ left: dir * 260 * 2, behavior: "smooth" });
  };

  const items = loading
    ? Array.from({ length: 6 }).map((_, i) => <BookSkeleton key={i} />)
    : books.length > 0
      ? books.map((book) => (
          <div key={book.id} className="w-[170px] sm:w-[185px] flex-shrink-0">
            <BookCard book={book} variant="trending" />
          </div>
        ))
      : [
          <p key="empty" className="col-span-6 text-center text-gray-400 py-8 text-sm w-full">
            {emptyMessage}
          </p>,
        ];

  return (
    <div className="relative group/row">
      {/* Left arrow */}
      <button
        onClick={() => scroll(-1)}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-md rounded-full w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all opacity-0 group-hover/row:opacity-100"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Scrollable track */}
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
      >
        {items}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll(1)}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 shadow-md rounded-full w-9 h-9 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all opacity-0 group-hover/row:opacity-100"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Section Header ───────────────────────────────────────────────────────── */
function SectionHeader({ accentColor, badge, badgeIcon: Icon, title, viewAllLink }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-1 h-6 rounded-full ${accentColor}`} />
          <span className={`text-sm font-semibold flex items-center gap-1.5 ${badge}`}>
            {Icon && <Icon className="w-4 h-4" />} {badge}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      <Link
        to={viewAllLink}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
      >
        View All <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [newest, setNewest] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryBooks, setCategoryBooks] = useState([]);
  const [systemStats, setSystemStats] = useState({ totalBooks: 0, activeMembers: 0, checkedOutBooks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [featuredRes, topRatedRes, newestRes, categoriesRes, statsRes] = await Promise.all([
          bookService.getFeatured(10).catch(() => ({ data: { success: false } })),
          bookService.getTopRated(10).catch(() => ({ data: { success: false } })),
          bookService.getNewest(10).catch(() => ({ data: { success: false } })),
          bookService.getCategories().catch(() => ({ data: { success: false } })),
          bookService.getPublicStats().catch(() => ({ data: { success: false } })),
        ]);

        if (featuredRes.data?.success) setFeatured(featuredRes.data.data || []);
        if (topRatedRes.data?.success) setTopRated(topRatedRes.data.data || []);
        if (newestRes.data?.success) setNewest(newestRes.data.data || []);
        if (statsRes.data?.success) setSystemStats(statsRes.data.data || { totalBooks: 0, activeMembers: 0, checkedOutBooks: 0 });

        if (categoriesRes.data?.success) {
          const allCats = categoriesRes.data.data || [];
          setCategories(allCats.slice(0, 8));
          const firstCat = allCats.find((c) => c.book_count > 0);
          if (firstCat) {
            const catBooksRes = await bookService.getBooks({ category: firstCat.id, limit: 10 }).catch(() => ({ data: { success: false } }));
            if (catBooksRes.data?.success) setCategoryBooks(catBooksRes.data.data || []);
          }
        }
      } catch (err) {
        console.error("HomePage fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const dynamicStats = [
    { icon: BookOpen, label: "Total Books", value: loading ? "…" : (systemStats.totalBooks || 0).toLocaleString() },
    { icon: Users, label: "Active Members", value: loading ? "…" : (systemStats.activeMembers || 0).toLocaleString() },
    { icon: Clock, label: "Checked Out", value: loading ? "…" : (systemStats.checkedOutBooks || 0).toLocaleString() },
    { icon: Award, label: "Featured Titles", value: loading ? "…" : (featured.length || 0).toString() },
  ];

  const spotlightCat = categories.find((c) => c.book_count > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <HeroCarousel />
      </section>

      {/* Stats bar */}
      <section className="bg-blue-900 dark:bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {dynamicStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="bg-blue-800/60 p-2.5 rounded-xl flex-shrink-0">
                  <stat.icon className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white leading-none">{stat.value}</p>
                  <p className="text-xs text-blue-300 mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-6 bg-indigo-600 rounded-full" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-500" /> Explore Categories
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))
            : categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/books?category=${cat.id}`}
                  className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700/60 rounded-xl hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all text-center group"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {cat.name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{cat.book_count || 0} items</span>
                </Link>
              ))}
        </div>
      </section>

      {/* ── Featured Books ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Editor's Picks
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Featured Books</h2>
          </div>
          <Link to="/books?filter=featured" className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <BookRow books={featured} loading={loading} emptyMessage="No featured books found" />
      </section>

      {/* ── Trending — Top Rated ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-6 bg-amber-500 rounded-full" />
              <span className="text-sm text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-current" /> Most Popular
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Trending — Top Rated</h2>
          </div>
          <Link to="/books?sort=rating" className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-medium">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <BookRow books={topRated} loading={loading} emptyMessage="No highly-rated titles available" />
      </section>

      {/* ── Newest Books ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-6 bg-rose-500 rounded-full" />
              <span className="text-sm text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Just Added
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Newest Books</h2>
          </div>
          <Link to="/books?sort=newest" className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-medium">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <BookRow books={newest} loading={loading} emptyMessage="No newly added titles found" />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="border-t border-gray-200 dark:border-slate-700" />
      </div>

      {/* ── Discover More (category spotlight) ── */}
      {!loading && categoryBooks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                <span className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
                  Spotlight: {spotlightCat?.name || "Genre Collections"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Discover More</h2>
            </div>
            <Link to={`/books?category=${spotlightCat?.id}`} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {/* Grid layout for Discover More */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categoryBooks.map((book) => (
              <BookCard key={book.id} book={book} variant="trending" />
            ))}
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-14 pt-4">
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