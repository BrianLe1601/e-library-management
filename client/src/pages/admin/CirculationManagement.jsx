import { Check, AlertCircle } from "lucide-react";

const circulationRecords = [
  {
    id: 1,
    userName: "John Doe",
    bookTitle: "The Midnight Library",
    requestDate: "2026-04-15",
    dueDate: "2026-05-15",
    status: "pending",
  },
  {
    id: 2,
    userName: "Jane Smith",
    bookTitle: "Atomic Habits",
    requestDate: "2026-03-20",
    dueDate: "2026-04-20",
    status: "borrowed",
  },
  {
    id: 3,
    userName: "Michael Johnson",
    bookTitle: "1984",
    requestDate: "2026-02-10",
    dueDate: "2026-03-10",
    status: "overdue",
  },
  {
    id: 4,
    userName: "Emily Brown",
    bookTitle: "Pride and Prejudice",
    requestDate: "2026-01-05",
    dueDate: "2026-02-05",
    status: "returned",
  },
  {
    id: 5,
    userName: "David Wilson",
    bookTitle: "The Great Gatsby",
    requestDate: "2026-04-25",
    dueDate: "2026-05-25",
    status: "pending",
  },
  {
    id: 6,
    userName: "Sarah Davis",
    bookTitle: "Sapiens",
    requestDate: "2026-03-15",
    dueDate: "2026-04-15",
    status: "borrowed",
  },
  {
    id: 7,
    userName: "Robert Miller",
    bookTitle: "To Kill a Mockingbird",
    requestDate: "2026-04-10",
    dueDate: "2026-04-25",
    status: "overdue",
  },
];

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    borrowed: "bg-blue-50 text-blue-700 border-blue-200",
    returned: "bg-gray-50 text-gray-700 border-gray-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
  };

  const labels = {
    pending: "Pending",
    borrowed: "Borrowed",
    returned: "Returned",
    overdue: "Overdue",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function CirculationManagement() {
  return (
    <div className="flex h-screen bg-gray-50">

      <div className="flex-1 overflow-auto">
        <div className="border-b border-gray-200 bg-white px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Circulation Management</h1>
          <p className="text-gray-600">Manage borrowing requests and returns</p>
        </div>

        <div className="p-8">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">User Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Book Title</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Request Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Due Date</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {circulationRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{record.userName}</td>
                    <td className="px-6 py-4 text-gray-900">{record.bookTitle}</td>
                    <td className="px-6 py-4 text-gray-600">{record.requestDate}</td>
                    <td className="px-6 py-4 text-gray-600">{record.dueDate}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {record.status === "pending" && (
                          <button className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700">
                            <Check className="h-4 w-4" />
                            Approve Borrow
                          </button>
                        )}
                        {record.status === "borrowed" && (
                          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
                            <Check className="h-4 w-4" />
                            Confirm Return
                          </button>
                        )}
                        {record.status === "overdue" && (
                          <>
                            <button className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">
                              <AlertCircle className="h-4 w-4" />
                              Mark Overdue
                            </button>
                            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
                              <Check className="h-4 w-4" />
                              Confirm Return
                            </button>
                          </>
                        )}
                        {record.status === "returned" && (
                          <span className="text-gray-500">No actions available</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
