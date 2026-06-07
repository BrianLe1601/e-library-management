import { useState, useMemo } from "react";
import useSWR from "swr"; // [THÊM] Import SWR
import { Link } from "react-router-dom"; 
import {
  Search, Bookmark, BookOpen, SortAsc, ArrowRight,
  Clock, CheckCircle, X, Loader2, AlertTriangle
} from "lucide-react";
// import BookCard from "../../components/BookCard";
import userService from "../../services/userService";
import borrowService from "../../services/borrowService";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatExpectedDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });
}

function parseSaved(dateStr) {
  return new Date(dateStr).getTime();
}

// ─── SWR Fetcher ──────────────────────────────────────────────────────────────
const fetchSavedBooks = async () => {
  const [savedRes, borrowRes] = await Promise.all([
    userService.getSavedBooks(),
    borrowService.getMyBooks()
  ]);

  const borrows = borrowRes.data?.data || [];

  return (savedRes.data?.data || []).map(b => {

    const borrow = borrows.find(
      x => String(x.book_id) === String(b.book_id)
    );
    return {
      id: b.book_id,
      title: b.title,
      author: b.author,
      category: b.category || "Uncategorized",
      coverUrl: b.cover_url || "https://via.placeholder.com/150x220?text=No+Cover",
      availableCopies: b.available_copies,
      savedDate: b.saved_at,
      expectedBackDate: b.expected_back_date || null,
      borrowStatus: borrow?.status || null,
    };
  });
};

const CATEGORY_COLORS = {
  IT: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  Science: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  Mathematics: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  Literature: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  Philosophy: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
};

function CategoryPill({ category }) {
  const cls = CATEGORY_COLORS[category] ?? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${cls}`} style={{ fontWeight: 600 }}>
      {category}
    </span>
  );
}

function AvailabilityBadge({ book }) {
  if (book.availableCopies > 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400" style={{ fontWeight: 500 }}>
        <CheckCircle size={11} />
        Available · {book.availableCopies} {book.availableCopies === 1 ? "copy" : "copies"} left
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-orange-500 dark:text-orange-400" style={{ fontWeight: 500 }}>
      <Clock size={11} /> All borrowed
      {book.expectedBackDate && (
        <span className="text-slate-400 dark:text-slate-500" style={{ fontWeight: 400 }}>
          · back {formatExpectedDate(book.expectedBackDate)}
        </span>
      )}
    </span>
  );
}

function Toast({ message, type = "success" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
      ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      {message}
    </div>
  );
}

function BookCard({ book, onUnsave, onBorrow, onHold, isActionLoading }) {
  const available = book.availableCopies > 0;
  const isPending = book.borrowStatus === "pending";
  const isBorrowing = ["borrowing", "renewed"].includes(book.borrowStatus);
  const isOverdue = book.borrowStatus === "overdue";
  const isReturning = book.borrowStatus === "returning";

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
      {/* Cover area */}
      <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-700" style={{ paddingTop: "140%" }}>
        <img src={book.coverUrl} alt={book.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <button
          onClick={() => onUnsave(book.id)}
          disabled={isActionLoading}
          title="Remove from saved"
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-red-500 transition-colors duration-200 shadow-lg group/btn disabled:opacity-50"
        >
          <Bookmark size={14} className="text-white fill-white group-hover/btn:hidden" />
          <X size={14} className="text-white hidden group-hover/btn:block" />
        </button>

        <div className="absolute bottom-2.5 left-2.5">
          <CategoryPill category={book.category} />
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <p className="text-slate-900 dark:text-slate-100 leading-snug line-clamp-2" style={{ fontWeight: 700 }} title={book.title}>
            {book.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{book.author}</p>
        </div>

        <div>
          <AvailabilityBadge book={book} />
        </div>

        <div className="flex flex-col gap-2 mt-auto">
          {isPending ? (
            <div className="
              flex justify-center items-center
              gap-1.5
              w-full py-2
              rounded-xl
              text-xs
              bg-amber-50
              text-amber-700
              border border-amber-200
            ">
              <Clock size={14}/>
              Awaiting Approval
            </div>
          ) : isBorrowing ? (
            <div className="
              flex justify-center items-center
              gap-1.5
              w-full py-2
              rounded-xl
              text-xs
              bg-green-50
              text-green-700
              border border-green-200
            ">
              <CheckCircle size={14}/>
              Currently Borrowing
            </div>
          ) : isOverdue ? (
            <div className="
              flex justify-center items-center
              gap-1.5
              w-full py-2
              rounded-xl
              text-xs
              bg-red-50
              text-red-700
              border border-red-200
            ">
              <AlertTriangle size={14}/>
              Overdue
            </div>
          ) : isReturning ? (
            <div className="
              flex justify-center items-center
              gap-1.5
              w-full py-2
              rounded-xl
              text-xs
              bg-teal-50
              text-teal-700
              border border-teal-200
            ">
              <Loader2 size={14}/>
              Return Requested
            </div>
          ) : available ? (
            <button
              onClick={() => onBorrow(book.id)}
              disabled={isActionLoading}
              className="flex justify-center items-center gap-1.5 w-full py-2 rounded-xl text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isActionLoading
                ? <Loader2 size={14} className="animate-spin" />
                : "Borrow Now"}
            </button>
          ) : (
            <button
              onClick={() => onHold(book.id)}
              disabled={isActionLoading}
              className="flex justify-center items-center gap-1.5 w-full py-2 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-700"
            >
              Place Hold
            </button>
          )}

          <Link to={`/books/${book.id}`} className="flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" style={{ fontWeight: 500 }}>
            View Details <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SavedBooksTab() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  
  const [removingId, setRemovingId] = useState(null);
  const [actionId, setActionId]     = useState(null);
  const [toast, setToast]           = useState(null);

  // [SỬ DỤNG SWR]
  const { data: savedList = [], isLoading, mutate } = useSWR('saved_books', fetchSavedBooks);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Bỏ lưu sách (Optimistic UI cực mượt)
  const handleUnsave = async (id) => {
    setRemovingId(id);
    
    // Xóa khỏi giao diện lập tức
    mutate(prev => prev.filter(b => b.id !== id), false);
    
    try {
      await userService.unsaveBook(id);
      mutate(); // Sync lại với server
      showToast("Removed from saved books.");
    } catch (err) {
      mutate(); // Hoàn tác nếu lỗi
      showToast("Failed to remove book.", "error");
    } finally {
      setRemovingId(null);
    }
  };

  // Mượn sách trực tiếp từ tab
  const handleBorrow = async (id) => {
    setActionId(id);
    try {
      await borrowService.borrowBook(id);
      showToast("Borrow request submitted successfully!");
      mutate( prev => prev.map(book => book.id === id
              ? { ...book, borrowStatus: "pending",} : book),false
      );

      await mutate();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to borrow book.", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleHold = (id) => {
    showToast("Hold placed! We will notify you when available.");
  };

  const filtered = useMemo(() => {
    let list = savedList.filter((b) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    });

    if (sort === "recent") {
      list = [...list].sort((a, b) => parseSaved(b.savedDate) - parseSaved(a.savedDate));
    } else if (sort === "title") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "availability") {
      list = [...list].sort((a, b) => b.availableCopies - a.availableCopies);
    }
    return list;
  }, [savedList, search, sort]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl text-slate-900 dark:text-slate-100 font-semibold">Saved Books</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" style={{ fontWeight: 600 }}>
              <Bookmark size={13} className="fill-indigo-600 dark:fill-indigo-400" />
              {savedList.length}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Books you have saved for later.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search saved books…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div className="relative">
          <SortAsc size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
          <Bookmark className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={36} />
          <p className="text-slate-600 dark:text-slate-300 text-sm" style={{ fontWeight: 500 }}>
            {search ? "No saved books match your search." : "You haven't saved any books yet."}
          </p>
          {!search && (
            <Link to="/books" className="inline-flex items-center gap-1.5 mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors" style={{ fontWeight: 500 }}>
              <BookOpen size={14} /> Browse the catalog
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((book) => (
            <div
              key={book.id}
              className="transition-all duration-300 h-full"
              style={{
                opacity: removingId === book.id ? 0 : 1,
                transform: removingId === book.id ? "scale(0.95)" : "scale(1)",
              }}
            >
              <BookCard
                book={book}
                onUnsave={() => handleUnsave(book.id)}
                onBorrow={handleBorrow}
                onHold={handleHold}
                isActionLoading={actionId === book.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}