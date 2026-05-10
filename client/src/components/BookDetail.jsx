import { useParams } from "react-router-dom";
import { BookOpen, User, Calendar } from "lucide-react";

const bookDetails = {
  "1": {
    title: "The Midnight Library",
    author: "Matt Haig",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
    description:
      "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived...",
    availableCopies: 5,
    isbn: "978-0525559474",
    publishedDate: "August 13, 2020",
    pages: 304,
    genre: "Fiction",
  },
  "3": {
    title: "Project Hail Mary",
    author: "Andy Weir",
    cover: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400&h=600&fit=crop",
    description:
      "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish...",
    availableCopies: 0,
    isbn: "978-0593135204",
    publishedDate: "May 4, 2021",
    pages: 496,
    genre: "Science Fiction",
  },
};

export default function BookDetail() {
  const { id } = useParams();
  const book = bookDetails[id || "1"] || bookDetails["1"];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-12">
        <div className="grid grid-cols-[400px_1fr] gap-12">
          {/* Cover */}
          <div>
            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-lg">
              <img
                src={book.cover}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{book.title}</h1>
              <div className="mt-2 flex items-center gap-2 text-xl text-gray-600">
                <User className="h-5 w-5" />
                <span>by {book.author}</span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-gray-600">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span>{book.pages} pages</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>{book.publishedDate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">Genre:</span>
                <span className="text-gray-700">{book.genre}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">ISBN:</span>
                <span className="text-gray-700">{book.isbn}</span>
              </div>
            </div>

            {book.availableCopies > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-green-700 border border-green-200">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="font-semibold">
                  Available Copies: {book.availableCopies}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-red-700 border border-red-200">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="font-semibold">Out of Stock</span>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed">{book.description}</p>
            </div>

            {book.availableCopies > 0 ? (
              <button className="w-full max-w-md rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white hover:bg-blue-700 transition-colors">
                Borrow Book
              </button>
            ) : (
              <button
                disabled
                className="w-full max-w-md rounded-lg bg-gray-300 px-8 py-4 font-semibold text-gray-500 cursor-not-allowed"
              >
                Out of Stock
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
