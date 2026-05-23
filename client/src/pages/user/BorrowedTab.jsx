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
  Star,
  ChevronLeft,
  ChevronRight,
  History,
  Layers,
} from "lucide-react";
import { currentlyBorrowed, historyRecords } from "../data/mockData";

// ─── shared helpers ──────────────────────────────────────────────────────────

const TODAY = new Date("2026-05-21");
const PAGE_SIZE = 5;

function parseDateLocal(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function diffDays(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}
function fmtDate(str) {
  return parseDateLocal(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const CATEGORY_COLORS = {
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

// ─── Active Loans view ───────────────────────────────────────────────────────

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

function RenewalButton({ book, status, onRenew }) {
  const maxedOut = book.renewalCount >= book.maxRenewals;
  const overdue = status.label === "Overdue";
  const disabled = overdue || maxedOut;
  return (
    <button
      onClick={() => !disabled && onRenew(book.id)}
      disabled={disabled}
      title={
        overdue
          ? "Cannot renew overdue books"
          : maxedOut
            ? "Maximum renewals reached"
            : `Renew (${book.renewalCount}/${book.maxRenewals} used)`
      }
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${disabled ? "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50" : "border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 bg-white dark:bg-transparent"}`}
      style={{ fontWeight: 500 }}
    >
      <RefreshCw size={12} />
      Request Renewal
    </button>
  );
}

function ActiveLoansView() {
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

  const enriched = useMemo(
    () =>
      currentlyBorrowed.map((b) => ({
        ...b,
        renewalCount: renewedIds.has(b.id)
          ? b.renewalCount + 1
          : b.renewalCount,
        status: getStatus(b),
      })),
    [renewedIds],
  );

  const filtered = useMemo(
    () =>
      enriched.filter((b) => {
        const q = search.trim().toLowerCase();
        const matchSearch =
          !q ||
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q);
        const matchStatus =
          statusFilter === "All" || b.status.label === statusFilter;
        return matchSearch && matchStatus;
      }),
    [enriched, search, statusFilter],
  );

  const overdueCount = enriched.filter(
    (b) => b.status.label === "Overdue",
  ).length;

  return (
    <div>
      {/* Summary badges */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
          style={{ fontWeight: 600 }}
        >
          <BookOpen size={14} />
          {currentlyBorrowed.length} Active{" "}
          {currentlyBorrowed.length === 1 ? "Loan" : "Loans"}
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

      {/* Filter bar */}
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

      {/* Cards */}
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
                className={`bg-white dark:bg-slate-800 rounded-2xl border transition-shadow hover:shadow-md ${book.status.label === "Overdue" ? "border-red-200 dark:border-red-900/60" : "border-slate-200 dark:border-slate-700"}`}
              >
                <div className="p-5">
                  <div className="flex gap-4">
                    {/* Cover */}
                    <div
                      className="w-16 rounded-lg overflow-hidden shrink-0 shadow-sm bg-slate-200 dark:bg-slate-700"
                      style={{ minHeight: 88 }}
                    >
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
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
                        <CategoryPill category={book.category} />
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          Borrowed:{" "}
                          <span
                            className="text-slate-700 dark:text-slate-300 ml-0.5"
                            style={{ fontWeight: 500 }}
                          >
                            {fmtDate(book.borrowDate)}
                          </span>
                        </span>
                        <span
                          className={`flex items-center gap-1.5 ${book.status.label === "Overdue" ? "text-red-500 dark:text-red-400" : book.status.daysLeft <= 3 ? "text-orange-500 dark:text-orange-400" : ""}`}
                        >
                          <Clock size={12} />
                          Due:{" "}
                          <span className="ml-0.5" style={{ fontWeight: 500 }}>
                            {fmtDate(book.dueDate)}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <RefreshCw size={12} className="text-slate-400" />
                          Renewals:{" "}
                          <span className="ml-0.5" style={{ fontWeight: 500 }}>
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
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${book.status.barColor}`}
                            style={{ width: `${book.status.progress}%` }}
                          />
                        </div>
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

// ─── History view ─────────────────────────────────────────────────────────────

function StarRatingInput({ rating, onChange }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? rating ?? 0;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          className="focus:outline-none"
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            size={13}
            className={`transition-colors ${
              n <= display
                ? "text-amber-400 fill-amber-400"
                : "text-slate-300 dark:text-slate-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ConditionBadge({ record }) {
  if (record.condition === "on-time") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 whitespace-nowrap"
        style={{ fontWeight: 600 }}
      >
        <CheckCircle size={10} />
        Returned on time
      </span>
    );
  }
  return (
    <span
      className="inline-flex flex-col items-start px-2.5 py-1 rounded-xl text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
      style={{ fontWeight: 600 }}
    >
      <span className="flex items-center gap-1">
        <AlertTriangle size={10} />
        Returned late
      </span>
      {record.finePaid > 0 && (
        <span
          className="mt-0.5 text-red-500 dark:text-red-400"
          style={{ fontWeight: 500 }}
        >
          Fine ${record.finePaid.toFixed(2)} paid
        </span>
      )}
    </span>
  );
}

function HistoryView() {
  const [page, setPage] = useState(1);
  const [ratings, setRatings] = useState(() => {
    const init = {};
    historyRecords.forEach((r) => {
      if (r.userRating) init[r.id] = r.userRating;
    });
    return init;
  });
  const [ratingTarget, setRatingTarget] = useState(null);

  const total = historyRecords.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const slice = historyRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              {["Book", "Borrowed", "Returned", "Status", "Your Rating"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                    style={{ fontWeight: 600 }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {slice.map((record) => {
              const currentRating = ratings[record.id];
              const isRating = ratingTarget === record.id;
              return (
                <tr
                  key={record.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  {/* Book */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 shadow-sm">
                        <img
                          src={record.coverUrl}
                          alt={record.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p
                          className="text-sm text-slate-900 dark:text-slate-100 leading-snug"
                          style={{ fontWeight: 600 }}
                        >
                          {record.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {record.author}
                        </p>
                        <div className="mt-1">
                          <CategoryPill category={record.category} />
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Borrowed */}
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {fmtDate(record.borrowDate)}
                  </td>
                  {/* Returned */}
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {fmtDate(record.returnedDate)}
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4">
                    <ConditionBadge record={record} />
                  </td>
                  {/* Rating */}
                  <td className="px-5 py-4">
                    {isRating ? (
                      <div className="flex flex-col gap-1">
                        <StarRatingInput
                          rating={currentRating}
                          onChange={(r) => {
                            setRatings((prev) => ({ ...prev, [record.id]: r }));
                            setRatingTarget(null);
                          }}
                        />
                        <button
                          onClick={() => setRatingTarget(null)}
                          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : currentRating ? (
                      <button
                        onClick={() => setRatingTarget(record.id)}
                        className="flex items-center gap-1 group"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={13}
                            className={
                              n <= currentRating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200 dark:text-slate-700"
                            }
                          />
                        ))}
                        <span className="ml-1 text-xs text-slate-400 group-hover:text-indigo-500 transition-colors">
                          Edit
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setRatingTarget(record.id)}
                        className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        <Star size={12} />
                        Rate Book
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {slice.map((record) => {
          const currentRating = ratings[record.id];
          const isRating = ratingTarget === record.id;
          return (
            <div
              key={record.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 shadow-sm">
                  <img
                    src={record.coverUrl}
                    alt={record.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p
                    className="text-sm text-slate-900 dark:text-slate-100"
                    style={{ fontWeight: 600 }}
                  >
                    {record.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {record.author}
                  </p>
                  <div className="mt-1">
                    <CategoryPill category={record.category} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                <div>
                  <p
                    className="uppercase tracking-wider mb-0.5"
                    style={{ fontWeight: 600, fontSize: "0.65rem" }}
                  >
                    Borrowed
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    {fmtDate(record.borrowDate)}
                  </p>
                </div>
                <div>
                  <p
                    className="uppercase tracking-wider mb-0.5"
                    style={{ fontWeight: 600, fontSize: "0.65rem" }}
                  >
                    Returned
                  </p>
                  <p className="text-slate-700 dark:text-slate-300">
                    {fmtDate(record.returnedDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <ConditionBadge record={record} />
                {isRating ? (
                  <div className="flex items-center gap-2">
                    <StarRatingInput
                      rating={currentRating}
                      onChange={(r) => {
                        setRatings((prev) => ({ ...prev, [record.id]: r }));
                        setRatingTarget(null);
                      }}
                    />
                    <button
                      onClick={() => setRatingTarget(null)}
                      className="text-xs text-slate-400"
                    >
                      ✕
                    </button>
                  </div>
                ) : currentRating ? (
                  <button
                    onClick={() => setRatingTarget(record.id)}
                    className="flex items-center gap-1"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={12}
                        className={
                          n <= currentRating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200 dark:text-slate-700"
                        }
                      />
                    ))}
                  </button>
                ) : (
                  <button
                    onClick={() => setRatingTarget(record.id)}
                    className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400"
                    style={{ fontWeight: 500 }}
                  >
                    <Star size={12} />
                    Rate Book
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing{" "}
          <span
            className="text-slate-700 dark:text-slate-300"
            style={{ fontWeight: 600 }}
          >
            {start}–{end}
          </span>{" "}
          of{" "}
          <span
            className="text-slate-700 dark:text-slate-300"
            style={{ fontWeight: 600 }}
          >
            {total}
          </span>{" "}
          books
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`w-8 h-8 rounded-lg text-sm transition-colors ${n === page ? "bg-indigo-600 text-white" : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
              style={{ fontWeight: n === page ? 600 : 400 }}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export function BorrowedTab() {
  const [subTab, setSubTab] = useState("active");

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-slate-900 dark:text-slate-100">
          My Borrowed Books
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your active loans and view your borrowing history.
        </p>
      </div>

      {/* Sub-tab toggle */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setSubTab("active")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
            subTab === "active"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
          style={{ fontWeight: subTab === "active" ? 600 : 400 }}
        >
          <Layers size={14} />
          Active Loans
          <span
            className={`px-1.5 py-0.5 rounded-full text-xs ${
              subTab === "active"
                ? "bg-white/20 text-white"
                : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
            }`}
            style={{ fontWeight: 600 }}
          >
            {currentlyBorrowed.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
            subTab === "history"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
          style={{ fontWeight: subTab === "history" ? 600 : 400 }}
        >
          <History size={14} />
          History
          <span
            className={`px-1.5 py-0.5 rounded-full text-xs ${
              subTab === "history"
                ? "bg-white/20 text-white"
                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
            }`}
            style={{ fontWeight: 600 }}
          >
            {historyRecords.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {subTab === "active" && <ActiveLoansView />}
      {subTab === "history" && <HistoryView />}
    </div>
  );
}
