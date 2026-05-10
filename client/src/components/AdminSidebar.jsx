import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Users, RefreshCw, LogOut, User } from "lucide-react";

export default function AdminSidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/books", label: "Books", icon: BookOpen },
    { path: "/admin/users", label: "Readers", icon: Users },
    { path: "/admin/circulation", label: "Circulation", icon: RefreshCw },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-semibold text-gray-900">LibraryHub</span>
        </div>
        <p className="mt-1 text-sm text-gray-600">Admin Panel</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Admin User</p>
            <p className="text-sm text-gray-600">admin@library.com</p>
          </div>
        </div>
        <button className="flex w-full items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 font-medium text-gray-700 hover:bg-gray-200">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
