import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Clock, Award } from "lucide-react";
import HeroCarousel  from "../../components/HeroCarousel";
import BookCard from "../../components/BookCard";
import { books } from "../data/mockData";

const trendingBooks = books.filter((b) => b.rating >= 4.5).slice(0, 6);
const newestTech = books.filter((b) => b.category === "IT").slice(0, 6);

const stats = [
  { icon: BookOpen, label: "Books Available", value: "50,000+" },
  { icon: Users, label: "Active Members", value: "12,500+" },
  { icon: Clock, label: "Books Borrowed", value: "3,200+" },
  { icon: Award, label: "Award-winning Titles", value: "850+" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <HeroCarousel />
      </section>

      {/* Stats */}
      <section className="bg-blue-900 dark:bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center text-center">
                <div className="bg-blue-800/50 dark:bg-blue-900/50 p-3 rounded-xl mb-3">
                  <stat.icon className="w-5 h-5 text-blue-300" />
                </div>
                <p className="text-2xl text-white" style={{ fontWeight: 700 }}>{stat.value}</p>
                <p className="text-sm text-blue-200 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Books */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-6 bg-blue-700 rounded-full" />
              <span className="text-sm text-blue-700 dark:text-blue-400" style={{ fontWeight: 600 }}>
                Most Popular
              </span>
            </div>
            <h2 className="text-gray-900 dark:text-gray-100">Trending Books</h2>
          </div>
          <Link
            to="/books"
            className="flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
            style={{ fontWeight: 500 }}
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {trendingBooks.map((book) => (
            <BookCard key={book.id} book={book} variant="trending" />
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="border-t border-gray-200 dark:border-slate-700" />
      </div>

      {/* Newest in Tech */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1 h-6 bg-emerald-600 rounded-full" />
              <span className="text-sm text-emerald-700 dark:text-emerald-400" style={{ fontWeight: 600 }}>
                Technology & Computing
              </span>
            </div>
            <h2 className="text-gray-900 dark:text-gray-100">Newest in Tech</h2>
          </div>
          <Link
            to="/books?category=IT"
            className="flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
            style={{ fontWeight: 500 }}
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {newestTech.map((book) => (
            <BookCard key={book.id} book={book} variant="trending" />
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 dark:from-blue-950 dark:to-slate-900 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-white text-2xl md:text-3xl mb-2">
              Explore Our Full Collection
            </h2>
            <p className="text-blue-200 text-sm md:text-base max-w-md">
              Browse thousands of titles across literature, science, technology, mathematics, philosophy, and more.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/books"
              className="px-6 py-3 bg-white text-blue-900 rounded-xl text-sm hover:bg-blue-50 transition-colors"
              style={{ fontWeight: 600 }}
            >
              Browse All Books
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-blue-700/50 text-white border border-blue-500 rounded-xl text-sm hover:bg-blue-700 transition-colors"
              style={{ fontWeight: 500 }}
            >
              My Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
