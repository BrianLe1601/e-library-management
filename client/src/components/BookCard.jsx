import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";

/* Badge hiển thị category mượt mà, đồng điệu màu sắc */
function CategoryBadge({ category }) {
  if (!category) return null;
  return (
    <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shadow-sm">
      {category}
    </span>
  );
}

/* Badge hiển thị tình trạng còn sách gọn gàng */
function AvailabilityBadge({ availableCopies }) {
  const available = Number(availableCopies) > 0;
  return (
    <span
      className={`text-[11px] font-bold uppercase tracking-wide ${
        available
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-500 dark:text-rose-400"
      }`}
    >
      {available ? `● In Stock (${availableCopies})` : "○ Out of stock"}
    </span>
  );
}

export default function BookCard({ book, variant = "trending" }) {
  /* ─── LISTING VARIANT (Dành riêng cho trang /books - Đã sửa lỗi) ─── */
  if (variant === "listing") {
    return (
      <Link to={`/books/${book.id}`} className="group block h-full">
        {/* Thêm h-full flex flex-col để các card luôn cao bằng nhau tăm tắp */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1.5 h-full flex flex-col">
          
          {/* Thay h-52 bằng aspect-[3/4] để giữ nguyên tỷ lệ bìa sách chuẩn chỉnh */}
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/300x400?text=No+Cover";
              }}
            />
            <div className="absolute top-2.5 left-2.5 z-10">
              <CategoryBadge category={book.category} />
            </div>
            
            {Number(book.availableCopies) === 0 && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                <span className="bg-rose-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-md">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Nội dung chữ bên dưới */}
          <div className="p-3.5 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1 leading-snug">
              {book.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1 font-medium">
              {book.author}
            </p>
            
            {/* Chân card: Đưa thanh ngang ngăn cách vào, thêm StarRating cân xứng với Availability */}
            <div className="mt-auto pt-2.5 border-t border-gray-100 dark:border-slate-700/40 flex items-center justify-between gap-1">
              <AvailabilityBadge availableCopies={book.availableCopies} />
              <div className="flex items-center gap-1.5">
                {Number(book.reviewCount) > 0 && (
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    ({Number(book.reviewCount).toLocaleString()})
                  </span>
                )}
                <StarRating rating={book.rating} size="sm" />
              </div>
            </div>
          </div>

        </div>
      </Link>
    );
  }

  /* ─── TRENDING / DEFAULT VARIANT (Dành cho trang chủ HomePage) ─── */
  return (
    <Link to={`/books/${book.id}`} className="group block h-full">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        
        {/* Đồng bộ tỷ lệ aspect-[3/4] cho cả trang chủ */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/300x400?text=No+Cover";
            }}
          />
          {Number(book.availableCopies) === 0 && (
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
                Unavailable
              </span>
            </div>
          )}
        </div>

        <div className="p-3 flex-1 flex flex-col">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1 leading-snug">
            {book.title}
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
            {book.author}
          </p>
          <div className="mt-auto pt-1 flex items-center gap-2">
            <StarRating rating={book.rating} size="sm" />
            {Number(book.reviewCount) > 0 && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                ({Number(book.reviewCount).toLocaleString()} reviews)
              </span>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
}