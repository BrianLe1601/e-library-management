import { User } from "lucide-react";

const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    role: "user",
    status: "active",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "admin",
    status: "active",
  },
  {
    id: 3,
    name: "Michael Johnson",
    email: "michael.j@example.com",
    role: "user",
    status: "active",
  },
  {
    id: 4,
    name: "Emily Brown",
    email: "emily.brown@example.com",
    role: "user",
    status: "blocked",
  },
  {
    id: 5,
    name: "David Wilson",
    email: "david.w@example.com",
    role: "user",
    status: "active",
  },
  {
    id: 6,
    name: "Sarah Davis",
    email: "sarah.davis@example.com",
    role: "admin",
    status: "active",
  },
];

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-medium ${
        role === "admin"
          ? "bg-purple-50 text-purple-700 border-purple-200"
          : "bg-blue-50 text-blue-700 border-blue-200"
      }`}
    >
      {role === "admin" ? "Admin" : "User"}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-medium ${
        status === "active"
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      {status === "active" ? "Active" : "Blocked"}
    </span>
  );
}

export default function UserManagement() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 overflow-auto">
        <div className="border-b border-gray-200 bg-white px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage registered users and permissions</p>
        </div>

        <div className="p-8">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">User Avatar</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Account Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4">
                      {user.status === "active" ? (
                        <button className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">
                          Block User
                        </button>
                      ) : (
                        <button className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700">
                          Unblock User
                        </button>
                      )}
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
