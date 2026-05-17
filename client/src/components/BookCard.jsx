import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";

export default function BookCard({ book, variant = "trending" }) {
  // Lấy dữ liệu chuẩn từ DB (Xử lý fallback an toàn)
  const coverImg = book.cover_url || "https://placehold.co/300x450/e2e8f0/475569?text=No+Cover";
  const availableCopies = book.available_copies || 0;
  const rating = Number(book.avg_rating) || Number(book.rating) || 0;
  let categoryName = "Unknown";
  if (Array.isArray(book.categories) && book.categories.length > 0) {
    categoryName = book.categories[0]; // Nếu đã là mảng -> Lấy phần tử đầu tiên
  } else if (typeof book.categories === 'string' && book.categories.trim() !== '') {
    categoryName = book.categories.split(',')[0]; // Nếu là chuỗi -> Cắt và lấy phần tử đầu
  } else if (book.category) {
    categoryName = book.category;
  }

  if (variant === "listing") {
    return (
      <Link to={`/books/${book.id}`} className="group block h-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
          <div className="relative overflow-hidden">
            <img
              src={coverImg}
              alt={book.title}
              className="w-full h-56 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3">
              <span className="bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                {categoryName}
              </span>
            </div>
            {availableCopies === 0 && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                  Temporarily Out of Books
                </span>
              </div>
            )}
          </div>
          <div className="p-4 sm:p-5 flex flex-col flex-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1.5">
              {book.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1 flex-1">{book.author}</p>
            <div className="mb-3">
              <StarRating rating={rating} size="sm" />
            </div>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-slate-700/50">
              <span className={`text-xs font-semibold ${availableCopies > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                {availableCopies > 0 ? `${availableCopies} copies available` : "Out of stock"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/books/${book.id}`} className="group block">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5">
        <div className="relative overflow-hidden">
          <img
            src={coverImg}
            alt={book.title}
            className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {availableCopies === 0 && (
            <div className="absolute top-2 right-2">
              <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
            {book.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate">{book.author}</p>
          <StarRating rating={rating} size="sm" showValue />
        </div>
      </div>
    </Link>
  );
}