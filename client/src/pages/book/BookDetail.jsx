import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Hash,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Share2,
  Bookmark,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import bookService from "../../services/bookService";
import { StarRating } from "../../components/StarRating";

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  // ── Data state ─────────────────────────────────────────────────────────────
  const [book, setBook] = useState(null);
  const [bookReviews, setBookReviews] = useState([]);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── UI interaction state ───────────────────────────────────────────────────
  const [borrowSuccess, setBorrowSuccess] = useState(false);
  const [extensionSent, setExtensionSent] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [savingBook, setSavingBook] = useState(false);

  // ── Fetch book details + saved status ─────────────────────────────────────
  useEffect(() => {
    const fetchBookDetails = async () => {
      setLoading(true);
      window.scrollTo({ top: 0, behavior: "smooth" });

      try {
        const response = await bookService.getBookById(id);

        if (response.data?.success) {
          setBook(response.data.data.book);
          setBookReviews(response.data.data.reviews || []);
          setRelatedBooks(response.data.data.relatedBooks || []);

          // Kiểm tra sách đã được lưu chưa (chỉ khi đã đăng nhập)
          if (user) {
            bookService
              .getSavedIds()
              .then((res) => {
                if (res.data?.success) {
                  setBookmarked(res.data.data.includes(Number(id)));
                }
              })
              .catch(() => {});
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu chi tiết sách:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBookDetails();

    // Reset notification states khi đổi sách
    setBorrowSuccess(false);
    setExtensionSent(false);
    setBookmarked(false);
  }, [id]);

  // ── Toggle save/unsave ─────────────────────────────────────────────────────
  const handleToggleSave = async () => {
    if (!user) return;
    setSavingBook(true);
    try {
      if (bookmarked) {
        await bookService.unsaveBook(id);
      } else {
        await bookService.saveBook(id);
      }
      setBookmarked((prev) => !prev);
    } catch (err) {
      console.error("Lỗi lưu sách:", err);
    } finally {
      setSavingBook(false);
    }
  };

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500">Đang tải thông tin sách...</p>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-gray-700 dark:text-gray-300 mb-2">
            Không tìm thấy sách
          </h2>
          <Link
            to="/books"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Quay lại thư viện
          </Link>
        </div>
      </div>
    );
  }

  const availabilityPercentage =
    book.totalCopies > 0
      ? (book.availableCopies / book.totalCopies) * 100
      : 0;
  const isAvailable = book.availableCopies > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              to="/books"
              className="hover:text-blue-600 transition-colors"
            >
              Catalog
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 dark:text-gray-100 line-clamp-1">
              {book.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/books"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-10 mb-12">
          {/* Left: Book Cover */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-24">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-slate-700 mb-4">
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-96 lg:h-[420px] object-cover"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                {/* Save button */}
                <button
                  onClick={handleToggleSave}
                  disabled={savingBook || !user}
                  title={!user ? "Đăng nhập để lưu sách" : undefined}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    bookmarked
                      ? "bg-blue-700 border-blue-700 text-white"
                      : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600"
                  }`}
                >
                  {savingBook ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bookmark
                      className={`w-4 h-4 ${bookmarked ? "fill-current" : ""}`}
                    />
                  )}
                  {savingBook ? "Saving..." : bookmarked ? "Saved" : "Save"}
                </button>

                {/* Share button */}
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 text-sm hover:border-blue-400 hover:text-blue-600 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Right: Book Details */}
          <div className="flex-1 min-w-0">
            {/* Category Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs px-3 py-1 rounded-full"
                style={{ fontWeight: 600 }}
              >
                {book.category || "Uncategorized"}
              </span>
              {(book.tags || []).slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-xs px-2.5 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1
              className="text-gray-900 dark:text-gray-100 text-3xl mb-2 leading-tight"
              style={{ fontWeight: 700 }}
            >
              {book.title}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <StarRating rating={book.rating} size="md" showValue />
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {bookReviews.length} reviews
              </span>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-5 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
                  <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">
                    Author
                  </p>
                  <p
                    className="text-sm text-gray-900 dark:text-gray-100"
                    style={{ fontWeight: 500 }}
                  >
                    {book.author}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Building2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">
                    Publisher
                  </p>
                  <p
                    className="text-sm text-gray-900 dark:text-gray-100"
                    style={{ fontWeight: 500 }}
                  >
                    {book.publisher || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Hash className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">
                    ISBN
                  </p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                    {book.isbn || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">
                    Year
                  </p>
                  <p
                    className="text-sm text-gray-900 dark:text-gray-100"
                    style={{ fontWeight: 500 }}
                  >
                    {book.year
                      ? book.year < 0
                        ? `${Math.abs(book.year)} BC`
                        : book.year
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Availability Status */}
            <div
              className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${
                isAvailable
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}
            >
              {isAvailable ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    isAvailable
                      ? "text-green-800 dark:text-green-300"
                      : "text-red-700 dark:text-red-400"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {isAvailable
                    ? `${book.availableCopies}/${book.totalCopies} copies available`
                    : `0/${book.totalCopies} copies available — Currently unavailable`}
                </p>
                {isAvailable && (
                  <div className="mt-2 bg-green-200 dark:bg-green-800/50 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${availabilityPercentage}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-gray-900 dark:text-gray-100 mb-3">
                Description
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm whitespace-pre-wrap">
                {book.description || "No description available."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isAvailable ? (
                <button
                  onClick={() => setBorrowSuccess(true)}
                  disabled={borrowSuccess}
                  className={`flex-1 sm:flex-none px-8 py-3.5 rounded-xl text-sm transition-all shadow-md ${
                    borrowSuccess
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : "bg-blue-800 hover:bg-blue-900 active:scale-95 text-white shadow-blue-900/30"
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  {borrowSuccess ? "✓ Borrowed Successfully!" : "Borrow Now"}
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl text-sm bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-gray-500 cursor-not-allowed"
                  style={{ fontWeight: 700 }}
                >
                  Not Available
                </button>
              )}

              <button
                onClick={() => setExtensionSent(true)}
                className={`text-sm transition-colors px-4 py-2 rounded-xl border ${
                  extensionSent
                    ? "text-green-600 dark:text-green-400 border-green-300 dark:border-green-700"
                    : "text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}
              >
                {extensionSent ? "✓ Extension Requested" : "Request Extension"}
              </button>
            </div>

            {borrowSuccess && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-200 dark:border-green-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Due date is 14 days from today. Please return or renew before
                the due date.
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-blue-700 rounded-full" />
            <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl">
              Customer Reviews
            </h2>
          </div>

          {bookReviews.length > 0 ? (
            <div className="space-y-4">
              {bookReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white text-sm shrink-0"
                      style={{ fontWeight: 600 }}
                    >
                      {review.userInitials || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                        <span
                          className="text-gray-900 dark:text-gray-100 text-sm"
                          style={{ fontWeight: 600 }}
                        >
                          {review.userName}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mb-2">
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No reviews yet. Be the first to review this book!
              </p>
            </div>
          )}
        </div>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <h2 className="text-gray-900 dark:text-gray-100 font-bold text-xl">
                More in {book.category}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedBooks.map((b) => (
                <Link
                  key={b.id}
                  to={`/books/${b.id}`}
                  className="group bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <img
                    src={b.coverUrl}
                    alt={b.title}
                    className="w-full h-48 sm:h-56 object-cover"
                  />
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors mb-1">
                      {b.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {b.author}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
