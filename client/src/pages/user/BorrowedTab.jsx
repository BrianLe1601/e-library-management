import { useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  Calendar,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
} from "lucide-react";
import { currentlyBorrowed } from "../data/mockData";

const TODAY = new Date("2026-05-21");

function parseDateLocal(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function diffDays(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function formatDate(str) {
  return parseDateLocal(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatus(book) {
  const borrow = parseDateLocal(book.borrowDate);
  const due = parseDateLocal(book.dueDate);
  const totalDays = diffDays(borrow, due);
  const elapsed = diffDays(borrow, TODAY);
  const daysLeft = diffDays(TODAY, due);
  const progress = Math.min(100, Math.round((elapsed / totalDays) * 100));

  if (daysLeft < 0) {
    return {
      label: "Overdue",
      daysOverdue: -daysLeft,
      daysLeft,
      progress: 100,
      barColor: "bg-red-500",
    };
  }

  const pctLeft = 1 - progress / 100;
  const barColor =
    pctLeft <= 0.2
      ? "bg-orange-400"
      : pctLeft <= 0.35
        ? "bg-amber-400"
        : "bg-indigo-500";

  return { label: "On Time", daysOverdue: 0, daysLeft, progress, barColor };
}

function CategoryBadge({ category }) {
  const colorMap = {
    IT: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    Science:
      "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    Mathematics:
      "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
    Literature:
      "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    Philosophy:
      "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
  };
  const cls =
    colorMap[category] ||
    "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${cls}`}
      style={{ fontWeight: 600 }}
    >
      {category}
    </span>
  );
}

function StatusBadge({ status }) {
  if (status.label === "Overdue") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
        style={{ fontWeight: 600 }}
      >
        <AlertTriangle size={10} />
        Overdue · {status.daysOverdue}d
      </span>
    );
  }
  const isNear = status.daysLeft <= 3;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${isNear ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"}`}
      style={{ fontWeight: 600 }}
    >
      <CheckCircle size={10} />
      On Time · {status.daysLeft}d left
    </span>
  );
}

function BookCoverPlaceholder({ coverUrl, title }) {
  return (
    <div
      className="w-16 h-22 rounded-lg overflow-hidden shrink-0 shadow-sm bg-slate-200 dark:bg-slate-700"
      style={{ minHeight: 88 }}
    >
      <img
        src={coverUrl}
        alt={title}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

function RenewalButton({ book, status, onRenew }) {
  const maxedOut = book.renewalCount >= book.maxRenewals;
  const overdue = status.label === "Overdue";
  const disabled = overdue || maxedOut;

  const title = overdue
    ? "Cannot renew overdue books"
    : maxedOut
      ? "Maximum renewals reached"
      : `Renew (${book.renewalCount}/${book.maxRenewals} used)`;

  return (
    <button
      onClick={() => !disabled && onRenew(book.id)}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
        disabled
          ? "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50"
          : "border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 bg-white dark:bg-transparent"
      }`}
      style={{ fontWeight: 500 }}
    >
      <RefreshCw size={12} />
      Request Renewal
    </button>
  );
}

function ProgressBar({ progress, barColor }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function BorrowedTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [renewedIds, setRenewedIds] = useState(new Set());
  const [renewingId, setRenewingId] = useState(null);

  const handleRenew = (id) => {
    setRenewingId(id);
    setTimeout(() => {
      setRenewedIds((prev) => new Set(prev).add(id));
      setRenewingId(null);
    }, 900);
  };

  const enriched = useMemo(() => {
    return currentlyBorrowed.map((b) => ({
      ...b,
      renewalCount: renewedIds.has(b.id) ? b.renewalCount + 1 : b.renewalCount,
      status: getStatus(b),
    }));
  }, [renewedIds]);

  const filtered = useMemo(() => {
    return enriched.filter((b) => {
      const matchesSearch =
        search.trim() === "" ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || b.status.label === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enriched, search, statusFilter]);

  const totalCount = currentlyBorrowed.length;
  const overdueCount = enriched.filter(
    (b) => b.status.label === "Overdue",
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-slate-900 dark:text-slate-100">
              My Borrowed Books
            </h2>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
              style={{ fontWeight: 600 }}
            >
              <BookOpen size={14} />
              {totalCount} {totalCount === 1 ? "Book" : "Books"}
            </span>
            {overdueCount > 0 && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                style={{ fontWeight: 600 }}
              >
                <AlertTriangle size={13} />
                {overdueCount} Overdue
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your active loans and manage renewals.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div className="relative">
          <Filter
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-8 pr-8 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="On Time">On Time</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Book Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <BookOpen
            className="mx-auto mb-3 text-slate-300 dark:text-slate-600"
            size={36}
          />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No books match your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((book) => {
            const isRenewing = renewingId === book.id;
            const justRenewed = renewedIds.has(book.id);
            return (
              <div
                key={book.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border transition-shadow hover:shadow-md ${
                  book.status.label === "Overdue"
                    ? "border-red-200 dark:border-red-900/60"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="p-5">
                  <div className="flex gap-4">
                    {/* Cover */}
                    <BookCoverPlaceholder
                      coverUrl={book.coverUrl}
                      title={book.title}
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <p
                            className="text-slate-900 dark:text-slate-100 truncate"
                            style={{ fontWeight: 700 }}
                          >
                            {book.title}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {book.author}
                          </p>
                        </div>
                        <StatusBadge status={book.status} />
                      </div>

                      <div className="mt-2 mb-1">
                        <CategoryBadge category={book.category} />
                      </div>

                      {/* Dates */}
                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          Borrowed:{" "}
                          <span
                            className="text-slate-700 dark:text-slate-300"
                            style={{ fontWeight: 500 }}
                          >
                            {formatDate(book.borrowDate)}
                          </span>
                        </span>
                        <span
                          className={`flex items-center gap-1.5 ${
                            book.status.label === "Overdue"
                              ? "text-red-500 dark:text-red-400"
                              : book.status.daysLeft <= 3
                                ? "text-orange-500 dark:text-orange-400"
                                : ""
                          }`}
                        >
                          <Clock size={12} />
                          Due:{" "}
                          <span style={{ fontWeight: 500 }}>
                            {formatDate(book.dueDate)}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <RefreshCw size={12} className="text-slate-400" />
                          Renewals:{" "}
                          <span style={{ fontWeight: 500 }}>
                            {book.renewalCount}/{book.maxRenewals}
                          </span>
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 mb-3">
                        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-1">
                          <span>
                            {book.status.label === "Overdue"
                              ? `${book.status.daysOverdue} days past due`
                              : `${book.status.daysLeft} days remaining`}
                          </span>
                          <span>{book.status.progress}%</span>
                        </div>
                        <ProgressBar
                          progress={book.status.progress}
                          barColor={book.status.barColor}
                        />
                      </div>

                      {/* Action */}
                      <div className="flex items-center gap-3">
                        {isRenewing ? (
                          <span className="flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400">
                            <svg
                              className="animate-spin h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                            Submitting…
                          </span>
                        ) : justRenewed ? (
                          <span
                            className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"
                            style={{ fontWeight: 500 }}
                          >
                            <CheckCircle size={13} />
                            Renewal requested!
                          </span>
                        ) : (
                          <RenewalButton
                            book={book}
                            status={book.status}
                            onRenew={handleRenew}
                          />
                        )}
                        {book.status.label === "Overdue" && (
                          <span className="text-xs text-red-500 dark:text-red-400">
                            Fine accruing daily
                          </span>
                        )}
                        {book.renewalCount >= book.maxRenewals &&
                          book.status.label !== "Overdue" && (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              Max renewals reached
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
