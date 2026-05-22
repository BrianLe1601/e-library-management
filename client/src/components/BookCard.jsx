import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";

/* Rút gọn tên category thành label ngắn + màu */
const CATEGORY_MAP = {
  // Tiếng Việt
  "Văn học Việt Nam":     { label: "VH",   bg: "bg-purple-600" },
  "Văn học Nước Ngoài":   { label: "VHN",  bg: "bg-violet-600" },
  "Tâm lý - Kỹ năng sống":{ label: "TL",  bg: "bg-pink-600" },
  "Công nghệ thông tin":  { label: "IT",   bg: "bg-blue-600" },
  "Khoa học - Công nghệ": { label: "KH",   bg: "bg-cyan-600" },
  "Toán học":             { label: "MATH", bg: "bg-indigo-600" },
  "Lịch sử":              { label: "LS",   bg: "bg-amber-600" },
  "Kinh tế - Kinh doanh": { label: "KT",   bg: "bg-emerald-600" },
  "Triết học":            { label: "TH",   bg: "bg-rose-600" },
  "Tâm lý học":           { label: "TL",   bg: "bg-pink-600" },
  // Tiếng Anh
  "IT":                   { label: "IT",   bg: "bg-blue-600" },
  "Technology":           { label: "TECH", bg: "bg-cyan-600" },
  "Science":              { label: "SCI",  bg: "bg-emerald-600" },
  "Literature":           { label: "LIT",  bg: "bg-purple-600" },
  "History":              { label: "HIST", bg: "bg-amber-600" },
  "Philosophy":           { label: "PHI",  bg: "bg-rose-600" },
  "Economics":            { label: "ECO",  bg: "bg-green-600" },
  "Psychology":           { label: "PSY",  bg: "bg-pink-600" },
  "Mathematics":          { label: "MATH", bg: "bg-indigo-600" },
};

const BG_COLORS = [
  "bg-blue-600","bg-purple-600","bg-cyan-600","bg-emerald-600",
  "bg-amber-600","bg-rose-600","bg-indigo-600","bg-pink-600","bg-teal-600",
];

function getCategoryStyle(category) {
  if (!category) return null;
  if (CATEGORY_MAP[category]) return CATEGORY_MAP[category];
  // Fallback: tạo label từ chữ cái đầu mỗi từ, màu theo hash
  const words = category.trim().split(/\s+/);
  const label = words.length === 1
    ? category.slice(0, 3).toUpperCase()
    : words.map(w => w[0]).join("").toUpperCase().slice(0, 4);
  const colorIdx = category.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % BG_COLORS.length;
  return { label, bg: BG_COLORS[colorIdx] };
}

function CategoryBadge({ category }) {
  const style = getCategoryStyle(category);
  if (!style) return null;
  return (
    <span className={`absolute top-2.5 left-2.5 z-10 ${style.bg} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-tight tracking-wide shadow`}>
      {style.label}
    </span>
  );
}

function AvailabilityBadge({ availableCopies }) {
  const copies = Number(availableCopies);
  const available = !isNaN(copies) && copies > 0;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span
        className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
          available ? "bg-green-500" : "bg-red-400"
        }`}
      />
      <span
        className={`text-xs font-medium ${
          available ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
        }`}
      >
        {available ? `Available: ${copies} copies` : "Out of stock"}
      </span>
    </div>
  );
}

export default function BookCard({ book, variant = "trending" }) {
  /* ─── LISTING VARIANT (trang /books) ─────────────────────────────── */
  if (variant === "listing") {
    return (
      <Link to={`/books/${book.id}`} className="group block">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col h-full">
          {/* Cover */}
          <div className="relative w-full h-52 bg-gray-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
            <CategoryBadge category={book.category} />
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {Number(book.availableCopies) === 0 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3 flex flex-col flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug mb-0.5">
              {book.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{book.author}</p>
            <div className="mt-auto flex flex-col gap-1">
              <AvailabilityBadge availableCopies={book.availableCopies} />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  /* ─── TRENDING / DEFAULT VARIANT (HomePage) ──────────────────────── */
  return (
    <Link to={`/books/${book.id}`} className="group block">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
        {/* Cover */}
        <div className="relative w-full aspect-[3/4] bg-gray-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
          <CategoryBadge category={book.category} />
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          {Number(book.availableCopies) === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-red-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-0.5 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
            {book.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{book.author}</p>
          <div className="mt-auto pt-1.5">
            <AvailabilityBadge availableCopies={book.availableCopies} />
          </div>
        </div>
      </div>
    </Link>
  );
}
