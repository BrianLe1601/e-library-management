import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Clock, Award } from "lucide-react";
import BookCard from "../../components/BookCard";
import bookService from "../../services/bookService";
import { getStats } from "../../services/adminService";

// Hiệu ứng tải trang khung xương (Skeleton)
function BookSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse shadow-sm">
      <div className="h-48 bg-slate-200 dark:bg-slate-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [systemStats, setSystemStats] = useState({ totalBooks: 0, totalUsers: 0, activeBorrows: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Gọi đồng thời 2 API để lấy sách nổi bật và số liệu hệ thống
        const [booksRes, statsRes] = await Promise.all([
          bookService.getFeatured(6),
          getStats().catch(() => ({ success: false })) // Bẫy lỗi nếu backend chưa mở khóa
        ]);

        if (booksRes.success) setFeaturedBooks(booksRes.data || []);
        if (statsRes.success) setSystemStats(statsRes.data);
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
    { icon: Award,    label: "Đánh giá tốt",   value: "99%+" }, // Đánh giá hiện để tĩnh vì DB chưa thống kê rating sâu
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
    </div>
  );
}