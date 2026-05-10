import { BookOpen, Users, RefreshCw, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const monthlyData = [
  { month: "Jan", borrows: 245 },
  { month: "Feb", borrows: 312 },
  { month: "Mar", borrows: 289 },
  { month: "Apr", borrows: 356 },
  { month: "May", borrows: 298 },
  { month: "Jun", borrows: 401 },
];

const genreData = [
  { name: "Fiction", value: 35, color: "#3B82F6" },
  { name: "Non-Fiction", value: 25, color: "#10B981" },
  { name: "Science Fiction", value: 15, color: "#F59E0B" },
  { name: "Biography", value: 12, color: "#EF4444" },
  { name: "Other", value: 13, color: "#8B5CF6" },
];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (

      <div className="flex-1 overflow-auto">
        <div className="border-b border-gray-200 bg-white px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, Admin</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={BookOpen}
              label="Total Books"
              value="2,847"
              color="bg-blue-500"
            />
            <StatCard
              icon={Users}
              label="Total Readers"
              value="1,234"
              color="bg-green-500"
            />
            <StatCard
              icon={RefreshCw}
              label="Active Borrows"
              value="356"
              color="bg-orange-500"
            />
            <StatCard
              icon={AlertCircle}
              label="Overdue Books"
              value="23"
              color="bg-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Borrowing Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="borrows" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Book Genres Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
  );
}
