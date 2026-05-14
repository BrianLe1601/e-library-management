import { Link } from "react-router-dom";
import {
  Search, User, BookOpen, Sun, Moon, Bell, ChevronDown,
  Menu, X, LayoutDashboard, LogOut, BookMarked
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../components/ThemeContext";
import ProfileDropdown from "./ProfileDropdown";
import { NotificationPopover, mockNotifications } from "../../components/NotificationPopover";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [showNotifications, setShowNotifications] = useState(false);

  const { theme, toggleTheme } = useTheme();

  const searchFilters = ["All", "Title", "Author", "Category"];

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching:", searchQuery, "Filter:", searchFilter);
  };

return (
    <nav className="bg-blue-900 dark:bg-slate-950 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg text-white hidden sm:block" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
              E<span className="text-blue-300">Library</span>
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              >
                <Bell className="w-5 h-5" />
                {notifications.some((n) => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {showNotifications && (
                <NotificationPopover
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                  onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                  viewAllPath="/notifications"
                />
              )}
            </div>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-1 ml-1">
              <Link to="/books" className="px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                Browse
              </Link>
            </div>

            {/* Profile Dropdown */}
            <ProfileDropdown />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 pt-4 space-y-3">
            <div className="flex gap-2">
              <Link
                to="/books"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 text-sm text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                Browse Books
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 text-sm text-white bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Click-away overlay */}
      {(filterOpen || profileOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setFilterOpen(false); setProfileOpen(false); }}
        />
      )}
    </nav>
  );
}

