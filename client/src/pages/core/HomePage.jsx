import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Clock, Award } from "lucide-react";
import HeroCarousel from "../../components/HeroCarousel";
import BookCard from "../../components/BookCard";
import bookService from "../../services/bookService";

const stats = [
  { icon: BookOpen, label: "Sách có sẵn",   value: "50,000+" },
  { icon: Users,    label: "Thành viên",     value: "12,500+" },
  { icon: Clock,    label: "Lượt mượn",      value: "3,200+"  },
  { icon: Award,    label: "Sách nổi bật",   value: "850+"    },
];

function BookSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200 dark:bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [categoryBooks, setCategoryBooks] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, categoriesRes] = await Promise.all([
          bookService.getFeatured(6),
          bookService.getCategories(),
        ]);
        if (featuredRes.data.success)   setFeatured(featuredRes.data.data);
        if (categoriesRes.data.success) {
          setCategories(categoriesRes.data.data);
          // Lấy sách của thể loại đầu tiên có sách
          const firstCat = categoriesRes.data.data.find(c => c.book_count > 0);
          if (firstCat) {
            const catRes = await bookService.getBooks({ category: firstCat.id, limit: 6 });
            if (catRes.data.success) setCategoryBooks(catRes.data.data);
          }
        }
      } catch (err) {
        console.error('HomePage fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <HeroCarousel />
      </section>

      {/* Stats */}
      <section className="bg-blue-900 dark:bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
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

      {/* Featured / Trending */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <span className="text-sm text-blue-700 dark:text-blue-400 font-semibold">Được mượn nhiều nhất</span>
            </div>
            <h2 className="text-gray-900 dark:text-gray-100">Sách nổi bật</h2>
          </div>
          <Link to="/books" className="flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors font-medium">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <BookSkeleton key={i} />)
            : featured.length > 0
              ? featured.map((book) => <BookCard key={book.id} book={book} variant="trending" />)
              : <p className="col-span-6 text-center text-gray-400 py-8 text-sm">Chưa có dữ liệu sách</p>
          }
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="border-t border-gray-200 dark:border-slate-700" />
      </div>

      {/* Category Books */}
      {categoryBooks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1 h-6 bg-emerald-600 rounded-full" />
                <span className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold">
                  {categories.find(c => c.book_count > 0)?.name || 'Theo thể loại'}
                </span>
              </div>
              <h2 className="text-gray-900 dark:text-gray-100">Khám phá thêm</h2>
            </div>
            <Link to="/books" className="flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 transition-colors font-medium">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoryBooks.map((book) => <BookCard key={book.id} book={book} variant="trending" />)}
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 dark:from-blue-950 dark:to-slate-900 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">Khám phá toàn bộ thư viện</h2>
            <p className="text-blue-200 text-sm md:text-base max-w-md">
              Hàng nghìn đầu sách đa dạng — văn học, khoa học, công nghệ, triết học và nhiều hơn nữa.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/books"
              className="px-6 py-3 bg-white text-blue-900 rounded-xl text-sm hover:bg-blue-50 transition-colors font-semibold">
              Xem tất cả sách
            </Link>
            <Link to="/dashboard"
              className="px-6 py-3 bg-blue-700/50 text-white border border-blue-500 rounded-xl text-sm hover:bg-blue-700 transition-colors font-medium">
              Dashboard của tôi
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}