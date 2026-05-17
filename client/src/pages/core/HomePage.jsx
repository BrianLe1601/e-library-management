import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Clock, Award, Star, Sparkles } from "lucide-react";
import HeroCarousel from "../../components/HeroCarousel";
import BookCard from "../../components/BookCard";
import bookService from "../../services/bookService";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../components/ui/carousel";

const stats = [
  { icon: BookOpen, label: "Sách có sẵn",   value: "50,000+" },
  { icon: Users,    label: "Thành viên",     value: "12,500+" },
  { icon: Clock,    label: "Lượt mượn",      value: "3,200+"  },
  { icon: Award,    label: "Sách nổi bật",   value: "850+"    },
];

function BookSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="h-56 bg-gray-200 dark:bg-slate-700" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [topRated, setTopRated] = useState([]);
  const [newest, setNewest]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topRatedRes, newestRes] = await Promise.all([
          bookService.getTopRated(10),
          bookService.getNewest(10),
        ]);
        if (topRatedRes.data.success) setTopRated(topRatedRes.data.data);
        if (newestRes.data.success)   setNewest(newestRes.data.data);
      } catch (err) {
        console.error("HomePage fetch error:", err);
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
            <h2 className="text-gray-900 dark:text-gray-100">Trending Books</h2>
          </div>
          <Link
            to="/books"
            className="flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors font-medium"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          /* Skeleton khi loading */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <BookSkeleton key={i} />
            ))}
          </div>
        ) : topRated.length > 0 ? (
          /* Carousel */
          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {topRated.map((book) => (
                <CarouselItem
                  key={book.id}
                  className="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                >
                  <BookCard book={book} variant="trending" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 hidden sm:flex" />
            <CarouselNext className="-right-4 hidden sm:flex" />
          </Carousel>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">Chưa có dữ liệu sách</p>
        )}
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="border-t border-gray-200 dark:border-slate-700" />
      </div>

      {/* ── Sách Mới Nhất — Top 10 thêm gần đây nhất ── */}
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
            <h2 className="text-gray-900 dark:text-gray-100">Sách Mới Nhất</h2>
          </div>
          <Link
            to="/books"
            className="flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors font-medium"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          /* Skeleton khi loading */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <BookSkeleton key={i} />
            ))}
          </div>
        ) : newest.length > 0 ? (
          /* Carousel */
          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent className="-ml-3">
              {newest.map((book) => (
                <CarouselItem
                  key={book.id}
                  className="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                >
                  <BookCard book={book} variant="trending" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4 hidden sm:flex" />
            <CarouselNext className="-right-4 hidden sm:flex" />
          </Carousel>
        ) : (
          <p className="text-center text-gray-400 py-8 text-sm">Chưa có dữ liệu sách</p>
        )}
      </section>

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
            <Link
              to="/books"
              className="px-6 py-3 bg-white text-blue-900 rounded-xl text-sm hover:bg-blue-50 transition-colors font-semibold"
            >
              Xem tất cả sách
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-blue-700/50 text-white border border-blue-500 rounded-xl text-sm hover:bg-blue-700 transition-colors font-medium"
            >
              Dashboard của tôi
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
