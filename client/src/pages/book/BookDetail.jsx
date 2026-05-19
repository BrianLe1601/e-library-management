import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Building2, Hash, Calendar,
  CheckCircle2, XCircle, Share2, Bookmark, ChevronRight,
  Loader2, Star, Users, BookMarked, AlertTriangle,
} from "lucide-react";
import { StarRating } from "../../components/StarRating";
import bookService from "../../services/bookService";
import borrowService from "../../services/borrowService";
import { useAuth } from "../../context/AuthContext";

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium animate-in slide-in-from-bottom-4
      ${type === 'success' ? 'bg-emerald-900/95 border-emerald-700 text-emerald-100' : 'bg-red-900/95 border-red-700 text-red-100'}`}>
      {type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
      {msg}
    </div>
  );
}

// ── InfoPill ──────────────────────────────────────────────────────────────────
function InfoPill({ icon: Icon, label, value }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{value || "—"}</p>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function BookDetail() {
  const { id }              = useParams();
  const navigate            = useNavigate();
  const { isAuthenticated } = useAuth();

  const [book,          setBook]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [borrowDone,    setBorrowDone]    = useState(false);
  const [bookmarked,    setBookmarked]    = useState(false);
  const [toast,         setToast]         = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await bookService.getBookById(id);
        if (res.success) setBook(res.data);
      } catch {
        // book stays null → error state renders
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const handleBorrow = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setBorrowLoading(true);
    try {
      await borrowService.borrowBook(book.id);
      setBorrowDone(true);
      showToast("Đã gửi yêu cầu mượn sách! Vui lòng chờ thủ thư phê duyệt.");
    } catch (e) {
      showToast(e?.message || "Không thể mượn sách lúc này.", "error");
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: book.title, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Đã sao chép đường dẫn vào clipboard!");
    }
  };

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <Loader2 className="absolute -top-1 -right-1 w-6 h-6 text-indigo-600 animate-spin" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Đang tải thông tin sách...</p>
      </div>
    );
  }

  // ── Not Found State ───────────────────────────────────────────────────────
  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-gray-400 dark:text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Không tìm thấy sách</h2>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">Cuốn sách bạn tìm không tồn tại hoặc đã bị xóa khỏi hệ thống.</p>
          <Link to="/books" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh mục
          </Link>
        </div>
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const availCopies  = book.available_copies || 0;
  const totalCopies  = book.total_copies || 0;
  const isAvailable  = availCopies > 0;
  const availPct     = totalCopies > 0 ? Math.round((availCopies / totalCopies) * 100) : 0;
  const categoriesArr = Array.isArray(book.categories)
    ? book.categories
    : (book.categories ? String(book.categories).split(',').map(s => s.trim()).filter(Boolean) : []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Breadcrumb ── */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600" />
            <Link to="/books" className="hover:text-indigo-600 transition-colors">Thư viện</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-slate-600" />
            <span className="text-gray-900 dark:text-gray-100 font-medium line-clamp-1">{book.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/books" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" /> Quay lại thư viện
        </Link>

        {/* ── Main Layout ── */}
        <div className="flex flex-col lg:flex-row gap-10 mb-12">

          {/* ── LEFT: Cover + Actions ── */}
          <div className="lg:w-72 xl:w-80 shrink-0">
            <div className="sticky top-24 space-y-4">

              {/* Cover */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-[2/3]">
                <img
                  src={book.cover_url || "https://placehold.co/400x600/1e293b/475569?text=No+Cover"}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                {/* Availability badge */}
                <div className={`absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg backdrop-blur-sm border ${
                  isAvailable
                    ? "bg-emerald-900/80 border-emerald-700 text-emerald-200"
                    : "bg-red-900/80 border-red-700 text-red-200"
                }`}>
                  {isAvailable ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {isAvailable ? "Có sẵn" : "Hết sách"}
                </div>
              </div>

              {/* CTA Buttons */}
              <button
                onClick={handleBorrow}
                disabled={!isAvailable || borrowDone || borrowLoading}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                  borrowDone
                    ? "bg-emerald-600 text-white cursor-not-allowed"
                    : !isAvailable
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 text-white shadow-indigo-600/30"
                }`}
              >
                {borrowLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                ) : borrowDone ? (
                  <><CheckCircle2 className="w-4 h-4" /> Đã gửi yêu cầu mượn</>
                ) : !isAuthenticated ? (
                  <><BookMarked className="w-4 h-4" /> Đăng nhập để mượn sách</>
                ) : (
                  <><BookMarked className="w-4 h-4" /> Đăng ký mượn sách</>
                )}
              </button>

              {/* Secondary buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setBookmarked(!bookmarked)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm transition-all font-medium ${
                    bookmarked
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`} />
                  {bookmarked ? "Đã lưu" : "Lưu"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 text-sm hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-medium"
                >
                  <Share2 className="w-4 h-4" /> Chia sẻ
                </button>
              </div>

              {/* Stock info card */}
              <div className={`p-4 rounded-xl border text-sm ${
                isAvailable
                  ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className={`w-3.5 h-3.5 ${isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`} />
                    <span className={`font-semibold text-xs ${isAvailable ? "text-emerald-800 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                      {isAvailable ? "Sẵn sàng cho mượn" : "Tạm thời hết sách"}
                    </span>
                  </div>
                  <span className={`font-bold text-sm ${isAvailable ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}>
                    {availCopies}/{totalCopies}
                  </span>
                </div>
                <div className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isAvailable ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${availPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 text-right">{availPct}% còn sẵn</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Book Details ── */}
          <div className="flex-1 min-w-0">
            {/* Category tags */}
            {categoriesArr.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {categoriesArr.map((cat, i) => (
                  <Link
                    key={i}
                    to={`/books?category=${encodeURIComponent(cat)}`}
                    className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-3 py-1.5 rounded-full font-semibold border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-gray-900 dark:text-white text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-3">
              {book.title}
            </h1>

            {/* Rating row */}
            <div className="flex items-center gap-3 mb-8 flex-wrap">
              <StarRating rating={book.avg_rating || 0} size="md" showValue />
              <span className="text-gray-300 dark:text-slate-600">|</span>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{Number(book.avg_rating || 0).toFixed(1)}</span>
              </div>
              <span className="text-gray-300 dark:text-slate-600">|</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{book.review_count || 0} đánh giá</span>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <InfoPill icon={BookOpen}   label="Tác giả"     value={book.author_name     || book.author} />
              <InfoPill icon={Building2}  label="NXB"         value={book.publisher_name  || book.publisher} />
              <InfoPill icon={Calendar}   label="Năm XB"      value={book.publish_year} />
              <InfoPill icon={Hash}       label="ISBN"        value={book.isbn} />
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Giới thiệu nội dung</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[15px] whitespace-pre-line">
                {book.description || "Chưa có lời giới thiệu cho cuốn sách này."}
              </p>
            </div>

            {/* CTA (Mobile duplicate — hiện ở cuối khi không thấy nút trái) */}
            <div className="lg:hidden">
              <button
                onClick={handleBorrow}
                disabled={!isAvailable || borrowDone || borrowLoading}
                className={`w-full py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                  borrowDone
                    ? "bg-emerald-600 text-white cursor-not-allowed"
                    : !isAvailable
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30"
                }`}
              >
                {borrowLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
                ) : borrowDone ? (
                  "✓ Đã gửi yêu cầu mượn"
                ) : !isAuthenticated ? (
                  "Đăng nhập để mượn sách"
                ) : (
                  "Đăng ký mượn sách"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
