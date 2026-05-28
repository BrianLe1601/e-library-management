import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom"; 
import {
  Search,
  Bookmark,
  BookOpen,
  SortAsc,
  ArrowRight,
  Clock,
  CheckCircle,
  X,
} from "lucide-react";
import bookService from "../../services/bookService";

function formatExpectedDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function parseSaved(dateStr) {
  return new Date(dateStr).getTime();
}

const CATEGORY_COLORS = {
  IT: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  Science: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  Mathematics: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  Literature: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  Philosophy: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
};

function CategoryPill({ category }) {
  const cls =
    CATEGORY_COLORS[category] ??
    "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs ${cls}`}
      style={{ fontWeight: 600 }}
    >
      {category}
    </span>
  );
}

function AvailabilityBadge({ book }) {
  if (book.availableCopies > 0) {
    return (
      <span
        className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
        style={{ fontWeight: 500 }}
      >
        <CheckCircle size={11} />
        Available · {book.availableCopies}{" "}
        {book.availableCopies === 1 ? "copy" : "copies"} left
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-1 text-xs text-orange-500 dark:text-orange-400"
      style={{ fontWeight: 500 }}
    >
      <Clock size={11} />
      All borrowed
      {book.expectedBackDate && (
        <span
          className="text-slate-400 dark:text-slate-500"
          style={{ fontWeight: 400 }}
        >
          · back {formatExpectedDate(book.expectedBackDate)}
        </span>
      )}
    </span>
  );
}

function BookCard({
  book,
  onUnsave,
  onBorrow,
  onHold,
  borrowedId,
  holdIds,
}) {
  const available = book.availableCopies > 0;
  const isBorrowed = borrowedId === book.bookId;
  const isOnHold = holdIds.has(book.bookId);

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Cover area */}
      <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-700" style={{ paddingTop: "140%" }}>
        <img
          src={book.coverUrl}
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Unsave button */}
        <button
          onClick={() => onUnsave(book.bookId)}
          title="Remove from saved"
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-red-500 transition-colors duration-200 shadow-lg group/btn"
          aria-label="Remove from saved"
        >
          <Bookmark
            size={14}
            className="text-white fill-white group-hover/btn:hidden"
          />
          <X size={14} className="text-white hidden group-hover/btn:block" />
        </button>

        {/* Category pill on cover */}
        <div className="absolute bottom-2.5 left-2.5">
          <CategoryPill category={book.category} />
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title + author */}
        <div>
          <p
            className="text-slate-900 dark:text-slate-100 leading-snug line-clamp-2"
            style={{ fontWeight: 700 }}
            title={book.title}
          >
            {book.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{book.author}</p>
        </div>

        {/* Availability */}
        <div>
          <AvailabilityBadge book={book} />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto">
          {/* Primary action */}
          {isBorrowed ? (
            <div className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800" style={{ fontWeight: 600 }}>
              <CheckCircle size={13} />
              Borrowed!
            </div>
          ) : isOnHold && !available ? (
            <div className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800" style={{ fontWeight: 600 }}>
              <CheckCircle size={13} />
              Hold Placed
            </div>
          ) : available ? (
            <button
              onClick={() => onBorrow(book.bookId)}
              className="w-full py-2 rounded-xl text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              style={{ fontWeight: 600 }}
            >
              Borrow Now
            </button>
          ) : (
            <button
              onClick={() => onHold(book.bookId)}
              className="w-full py-2 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              style={{ fontWeight: 600 }}
            >
              Place Hold
            </button>
          )}

          {/* View Details link */}
          <Link
            to={`/books/${book.bookId}`}
            className="flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            style={{ fontWeight: 500 }}
          >
            View Details
            <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SavedBooksTab() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [savedList, setSavedList] = useState([]);
  useEffect(() => {
    bookService.getSaved()
      .then(res => { if (res.data?.success) setSavedList(res.data.data); })
      .catch(() => {});
  }, []);
  const [removingId, setRemovingId] = useState(null);
  const [borrowedId, setBorrowedId] = useState(null);
  const [holdIds, setHoldIds] = useState(new Set());

  const handleUnsave = async (bookId) => {
    setRemovingId(bookId);
    await bookService.unsaveBook(bookId).catch(() => {});
    setTimeout(() => {
      setSavedList(prev => prev.filter(b => b.bookId !== bookId));
      setRemovingId(null);
    }, 280);
  };

  const handleBorrow = (id) => {
    setBorrowedId(id);
  };

  const handleHold = (id) => {
    setHoldIds((prev) => new Set(prev).add(id));
  };

  const filtered = useMemo(() => {
    let list = savedList.filter((b) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
      );
    });

    if (sort === "recent") {
      list = [...list].sort(
        (a, b) => parseSaved(b.savedDate) - parseSaved(a.savedDate)
      );
    } else if (sort === "title") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "availability") {
      list = [...list].sort((a, b) => b.availableCopies - a.availableCopies);
    }

    return list;
  }, [savedList, search, sort]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-slate-900 dark:text-slate-100">Saved Books</h2>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
              style={{ fontWeight: 600 }}
            >
              <Bookmark size={13} className="fill-indigo-600 dark:fill-indigo-400" />
              {savedList.length}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Books you have saved for later.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search saved books…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div className="relative">
          <SortAsc
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
         <select
  value={sort}
  onChange={(e) => setSort(e.target.value)}
  className="pl-8 pr-8 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none cursor-pointer"
>
  <option value="recent">Recently Saved</option>
  <option value="title">Title A–Z</option>
  <option value="availability">Availability</option>
</select>

        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Bookmark
            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
            size={36}
          />
          <p className="text-slate-600 dark:text-slate-300 text-sm" style={{ fontWeight: 500 }}>
            {search ? "No saved books match your search." : "You haven't saved any books yet."}
          </p>
          {!search && (
            <Link
              to="/books"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <BookOpen size={14} />
              Browse the catalog
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((book) => (
            <div
              key={book.bookId}
              className="transition-all duration-300"
              style={{
                opacity: removingId === book.bookId ? 0 : 1,
                transform: removingId === book.bookId ? "scale(0.95)" : "scale(1)",
              }}
            >
              <BookCard
                book={book}
                onUnsave={() => handleUnsave(book.bookId)}
                onBorrow={handleBorrow}
                onHold={handleHold}
                borrowedId={borrowedId}
                holdIds={holdIds}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
