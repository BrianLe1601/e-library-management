import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Clock, Award, Star, Sparkles } from "lucide-react";
import BookCard from "../../components/BookCard";
import bookService from "../../services/bookService";
import { getStats } from "../../services/adminService";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../components/ui/carousel";

// Hiệu ứng tải trang khung xương (Skeleton)
function BookSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse shadow-sm">
      <div className="h-56 bg-slate-200 dark:bg-slate-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [newest, setNewest] = useState([]);
  const [systemStats, setSystemStats] = useState({ totalBooks: 0, totalUsers: 0, activeBorrows: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Gọi ĐỒNG THỜI 4 API để tăng tốc độ tải trang
        const [booksRes, statsRes, topRatedRes, newestRes] = await Promise.all([
          bookService.getFeatured(6).catch(() => ({ success: false })),
          getStats().catch(() => ({ success: false })),
          bookService.getTopRated(10).catch(() => ({ success: false })),
          bookService.getNewest(10).catch(() => ({ success: false }))
        ]);

        if (booksRes.success) setFeaturedBooks(booksRes.data || []);
        if (statsRes.success) setSystemStats(statsRes.data || { totalBooks: 0, totalUsers: 0, activeBorrows: 0 });
        if (topRatedRes.success) setTopRated(topRatedRes.data || []);
        if (newestRes.success) setNewest(newestRes.data || []);
        
      } catch (error) {
        console.error("Lỗi tải trang chủ:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Map dữ liệu thật từ DB vào mảng thẻ hiển thị
  const statsUI = [
    { icon: BookOpen, label: "Tổng số sách",   value: `${systemStats.totalBooks.toLocaleString()}+` },
    { icon: Users,    label: "Thành viên",     value: `${systemStats.totalUsers.toLocaleString()}+` },
    { icon: Clock,    label: "Sách đang mượn", value: `${systemStats.activeBorrows.toLocaleString()}`  },
    { icon: Award,    label: "Đánh giá tốt",   value: "99%+" }, 
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* ── HERO BANNER ── */}
      <section className="relative overflow-hidden bg-indigo-600 dark:bg-indigo-900 py-20 px-6 sm:px-12 rounded-b-[3rem] shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-90" />
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
            Khơi Nguồn Tri Thức Mới
          </h1>
          <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto">
            Khám phá hàng ngàn tựa sách chất lượng cao. Mượn sách dễ dàng, quản lý thông minh ngay trên mọi thiết bị của bạn.
          </p>
          <div className="pt-4">
            <Link to="/books" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-600 rounded-full font-bold shadow-lg hover:bg-slate-100 hover:scale-105 transition-all">
              Khám phá ngay <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATISTICS CARDS ── */}
      <section className="max-w-6xl mx-auto px-6 -mt-10 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsUI.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center transform hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                <Icon size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{item.value}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{item.label}</p>
            </div>
          );
        })}
      </section>

      {/* ── FEATURED BOOKS ── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Sách Đang Thịnh Hành</h2>
            <p className="text-slate-500 mt-2">Những tựa sách được cộng đồng mượn đọc nhiều nhất tuần qua.</p>
          </div>
          <Link to="/books" className="hidden sm:flex items-center gap-2 text-indigo-600 font-semibold hover:underline">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {loading 
            ? Array(6).fill(0).map((_, i) => <BookSkeleton key={i} />)
            : featuredBooks.map((book) => <BookCard key={book.id} book={book} />)
          }
        </div>
      </section>

      {/* ── Trending Books — Top 10 đánh giá sao cao nhất ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-6 bg-amber-500 rounded-full" />
              <span className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Được đánh giá cao nhất
              </span>
            </div>
            <h2 className="text-gray-900 dark:text-gray-100 text-2xl font-bold">Trending Books</h2>
          </div>
          <Link to="/books?sort=rating-desc" className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <BookSkeleton key={i} />)}
          </div>
        ) : topRated.length > 0 ? (
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-3">
              {topRated.map((book) => (
                <CarouselItem key={book.id} className="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <BookCard book={book} variant="trending" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 hidden sm:flex" />
            <CarouselNext className="-right-4 hidden sm:flex" />
          </Carousel>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">Chưa có dữ liệu đánh giá sách</p>
        )}
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="border-t border-gray-200 dark:border-slate-700" />
      </div>

      {/* ── Sách Mới Nhất ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-6 bg-emerald-500 rounded-full" />
              <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Vừa được thêm vào thư viện
              </span>
            </div>
            <h2 className="text-gray-900 dark:text-gray-100 text-2xl font-bold">Sách Mới Nhất</h2>
          </div>
          <Link to="/books" className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <BookSkeleton key={i} />)}
          </div>
        ) : newest.length > 0 ? (
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-3">
              {newest.map((book) => (
                <CarouselItem key={book.id} className="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <BookCard book={book} variant="trending" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 hidden sm:flex" />
            <CarouselNext className="-right-4 hidden sm:flex" />
          </Carousel>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">Chưa có dữ liệu sách mới</p>
        )}
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 dark:from-blue-950 dark:to-slate-900 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">Khám phá toàn bộ thư viện</h2>
            <p className="text-blue-200 text-sm md:text-base max-w-md">
              Hàng nghìn đầu sách đa dạng — văn học, khoa học, công nghệ, triết học và nhiều hơn nữa.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/books" className="px-6 py-3 bg-white text-blue-900 rounded-xl text-sm hover:bg-blue-50 transition-colors font-semibold">
              Xem tất cả sách
            </Link>
            <Link to="/dashboard" className="px-6 py-3 bg-blue-700/50 text-white border border-blue-500 rounded-xl text-sm hover:bg-blue-700 transition-colors font-medium">
              Dashboard của tôi
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}