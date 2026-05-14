import { BookOpen, BookMarked, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { borrowHistory } from "../data/mockData";

const statusConfig = {
  Borrowing: {
    label: "Borrowing",
    classes: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  },
  Overdue: {
    label: "Overdue",
    classes: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
  },
  Returned: {
    label: "Returned",
    classes: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
  },
};

export function BorrowingTab() {
  const totalBooks = borrowHistory.length;
  const currentlyBorrowing = borrowHistory.filter((r) => r.status === "Borrowing").length;
  const overdue = borrowHistory.filter((r) => r.status === "Overdue").length;
  const totalFines = borrowHistory.reduce((sum, r) => sum + r.fineAmount, 0);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: BookOpen, label: "Total Borrowed", value: totalBooks, color: "blue" },
          { icon: BookMarked, label: "Currently Borrowing", value: currentlyBorrowing, color: "indigo" },
          { icon: AlertTriangle, label: "Overdue", value: overdue, color: "red" },
          { icon: DollarSign, label: "Total Fines", value: `$${totalFines.toFixed(2)}`, color: "amber" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                stat.color === "blue"
                  ? "bg-blue-100 dark:bg-blue-900/40"
                  : stat.color === "indigo"
                  ? "bg-indigo-100 dark:bg-indigo-900/40"
                  : stat.color === "red"
                  ? "bg-red-100 dark:bg-red-900/40"
                  : "bg-amber-100 dark:bg-amber-900/40"
              }`}
            >
              <stat.icon
                className={`w-4 h-4 ${
                  stat.color === "blue"
                    ? "text-blue-700 dark:text-blue-400"
                    : stat.color === "indigo"
                    ? "text-indigo-700 dark:text-indigo-400"
                    : stat.color === "red"
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              />
            </div>
            <p className="text-2xl text-gray-900 dark:text-gray-100" style={{ fontWeight: 700 }}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-gray-900 dark:text-gray-100">Borrow Records</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            Last updated: May 10, 2026
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <th className="text-left px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                  Book Title
                </th>
                <th className="text-left px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                  Borrow Date
                </th>
                <th className="text-left px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                  Due Date
                </th>
                <th className="text-left px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                  Status
                </th>
                <th className="text-left px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                  Fine
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {borrowHistory.map((record) => {
                const status = statusConfig[record.status];
                return (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-gray-100" style={{ fontWeight: 500 }}>
                          {record.bookTitle}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{record.borrowDate}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{record.dueDate}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs ${status.classes}`} style={{ fontWeight: 600 }}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {record.fineAmount > 0 ? (
                        <span className="text-sm text-red-600 dark:text-red-400" style={{ fontWeight: 600 }}>
                          ${record.fineAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700">
          {borrowHistory.map((record) => {
            const status = statusConfig[record.status];
            return (
              <div key={record.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-gray-900 dark:text-gray-100" style={{ fontWeight: 500 }}>
                    {record.bookTitle}
                  </p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ml-2 shrink-0 ${status.classes}`} style={{ fontWeight: 600 }}>
                    {status.label}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>Borrowed: {record.borrowDate}</span>
                  <span>Due: {record.dueDate}</span>
                </div>
                {record.fineAmount > 0 && (
                  <span className="text-xs text-red-600 dark:text-red-400" style={{ fontWeight: 600 }}>
                    Fine: ${record.fineAmount.toFixed(2)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
