import { Link, Outlet } from "react-router-dom";
import { Search, User, BookOpen } from "lucide-react";

export default function Navigation() {
  return (
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-semibold text-gray-900">
                LibraryHub
              </span>
            </Link>

            <div className="flex-1 mx-8 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books, authors, genres..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Link to="/" className="text-gray-700 hover:text-blue-600">
                Home
              </Link>
              <Link to="/catalog" className="text-gray-700 hover:text-blue-600">
                Catalog
              </Link>
              <Link to="/profile" className="text-gray-700 hover:text-blue-600">
                My Books
              </Link>
              <Link to="/admin" className="text-gray-700 hover:text-blue-600">
                Admin
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
  );
}
