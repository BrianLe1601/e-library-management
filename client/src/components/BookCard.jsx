import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";

export default function BookCard({ book, variant = "trending" }) {
  if (variant === "listing") {
    return (
      <Link to={`/books/${book.id}`} className="group block">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="relative">
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-52 object-cover"
            />
            <div className="absolute top-3 left-3">
              <span className="bg-blue-800 dark:bg-blue-700 text-white text-xs px-2 py-1 rounded-full">
                {book.category}
              </span>
            </div>
            {book.availableCopies === 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-red-600 text-white text-sm px-3 py-1.5 rounded-full">Out of Stock</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors mb-1">
              {book.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{book.author}</p>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${book.availableCopies > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                {book.availableCopies > 0
                  ? `Available: ${book.availableCopies} copies`
                  : "Out of stock"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/books/${book.id}`} className="group block">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
        <div className="relative">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-56 object-cover"
          />
          {book.availableCopies === 0 && (
            <div className="absolute top-2 right-2">
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">Unavailable</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors mb-1">
            {book.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{book.author}</p>
          <StarRating rating={book.rating} size="sm" showValue />
        </div>
      </div>
    </Link>
  );
}
