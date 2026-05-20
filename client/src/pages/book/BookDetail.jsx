import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Building2, Hash, Calendar, CheckCircle2, 
  XCircle, AlertCircle, Share2, Bookmark, ChevronRight, Loader2
} from "lucide-react";
import { StarRating } from "../../components/StarRating";
import bookService from "../../services/bookService";
import borrowService from "../../services/borrowService";
import { useAuth } from "../../context/AuthContext";

export default function BookDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [borrowSuccess, setBorrowSuccess] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await bookService.getBookById(id);
        if (response.success) {
          setBook(response.data);
        }
      } catch (error) {
        console.error("Lỗi tải chi tiết sách:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // Hàm xử lý Mượn Sách thật kết nối Backend
  const handleBorrow = async () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để mượn sách!");
      return;
    }
    try {
      setBorrowLoading(true);
      await borrowService.borrowBook(book.id);
      setBorrowSuccess(true);
      alert("Đã gửi yêu cầu mượn sách thành công! Vui lòng chờ thủ thư phê duyệt.");
    } catch (error) {
      alert(error.message || "Không thể mượn sách lúc này.");
    } finally {
      setBorrowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải thông tin sách...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Không tìm thấy sách</h2>
          <Link to="/books" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            ← Quay lại danh mục
          </Link>
        </div>
      </div>
    );
  }

  // Khớp tên trường từ Backend DB
  const availableCopies = book.available_copies || 0;
  const totalCopies = book.total_copies || 0;
  const availabilityPercentage = totalCopies > 0 ? (availableCopies / totalCopies) * 100 : 0;
  const isAvailable = availableCopies > 0;
  const categoriesList = book.categories ? book.categories.split(',') : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* ── Breadcrumb ── */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/books" className="hover:text-indigo-600 transition-colors">Thư viện</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 dark:text-gray-100 line-clamp-1 font-medium">{book.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/books" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" /> Quay lại thư viện
        </Link>

        {/* ── Main Content ── */}
        <div className="flex flex-col lg:flex-row gap-10 mb-12">
          
          {/* Left: Book Cover */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-24">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700 mb-4 bg-white">
                <img
                  src={book.cover_url || "https://via.placeholder.com/400x600?text=No+Cover"}
                  alt={book.title}
                  className="w-full h-auto lg:h-[460px] object-cover"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setBookmarked(!bookmarked)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm transition-all font-medium ${
                    bookmarked
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
                  {bookmarked ? "Đã lưu" : "Lưu sách"}
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 text-sm hover:border-indigo-400 hover:text-indigo-600 transition-all font-medium">
                  <Share2 className="w-4 h-4" /> Chia sẻ
                </button>
              </div>
            </div>
          </div>

          {/* Right: Book Details */}
          <div className="flex-1 min-w-0">
            {/* Category Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {categoriesList.map((cat, idx) => (
                <span key={idx} className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs px-3 py-1 rounded-full font-semibold border border-indigo-100 dark:border-indigo-800">
                  {cat.trim()}
                </span>
              ))}
            </div>

            <h1 className="text-gray-900 dark:text-white text-3xl sm:text-4xl mb-2 leading-tight font-extrabold">
              {book.title}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <StarRating rating={book.avg_rating || 5} size="md" showValue />
              <span className="text-sm text-gray-300 dark:text-gray-600">|</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{book.review_count || 0} Đánh giá</span>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-1.5 text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-4 h-4 text-indigo-500" /> <span className="text-xs font-semibold uppercase">Tác giả</span>
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-bold">{book.author || "Đang cập nhật"}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5 text-gray-500 dark:text-gray-400">
                  <Building2 className="w-4 h-4 text-indigo-500" /> <span className="text-xs font-semibold uppercase">NXB</span>
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-bold">{book.publisher || "Đang cập nhật"}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 text-indigo-500" /> <span className="text-xs font-semibold uppercase">Năm XB</span>
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-bold">{book.publish_year || "N/A"}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5 text-gray-500 dark:text-gray-400">
                  <Hash className="w-4 h-4 text-indigo-500" /> <span className="text-xs font-semibold uppercase">ISBN</span>
                </div>
                <p className="text-sm text-gray-900 dark:text-gray-100 font-mono font-bold">{book.isbn || "N/A"}</p>
              </div>
            </div>

            {/* Availability Status */}
            <div className={`flex items-center gap-4 p-5 rounded-2xl border shadow-sm mb-8 transition-colors ${
              isAvailable
                ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                : "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
            }`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isAvailable ? "bg-green-100 dark:bg-green-900/50 text-green-600" : "bg-red-100 dark:bg-red-900/50 text-red-600"}`}>
                {isAvailable ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <p className={`text-base font-bold ${isAvailable ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}`}>
                  {isAvailable ? "Sẵn sàng cho mượn" : "Tạm thời hết sách"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
                  Hiện còn <span className="font-bold">{availableCopies}</span> / {totalCopies} cuốn trong kho
                </p>
                {isAvailable && (
                  <div className="mt-3 bg-green-200/50 dark:bg-green-900/30 rounded-full h-2 overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${availabilityPercentage}%` }} />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <button
                onClick={handleBorrow}
                disabled={!isAvailable || borrowSuccess || borrowLoading}
                className={`flex-1 px-8 py-4 rounded-xl text-base font-bold transition-all shadow-lg ${
                  borrowSuccess
                    ? "bg-green-600 text-white cursor-not-allowed shadow-green-600/20"
                    : !isAvailable
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 text-white shadow-indigo-600/30"
                }`}
              >
                {borrowLoading ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</span>
                ) : borrowSuccess ? (
                  "✓ Đã gửi yêu cầu mượn"
                ) : (
                  "Đăng ký mượn sách"
                )}
              </button>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Giới thiệu nội dung</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[15px] whitespace-pre-line bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                {book.description || "Chưa có lời giới thiệu cho cuốn sách này."}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}