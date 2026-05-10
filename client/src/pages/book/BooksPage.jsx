import { Link } from "react-router-dom";
import { useState } from "react";

const books = [
  {
    id: 1,
    title: "The Midnight Library",
    author: "Matt Haig",
    genre: "Fiction",
    available: true,
    cover:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Help",
    available: true,
    cover:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=400&fit=crop",
  },
  {
    id: 3,
    title: "Project Hail Mary",
    author: "Andy Weir",
    genre: "Science Fiction",
    available: false,
    cover:
      "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=300&h=400&fit=crop",
  },
  {
    id: 4,
    title: "The Silent Patient",
    author: "Alex Michaelides",
    genre: "Thriller",
    available: true,
    cover:
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop",
  },
  {
    id: 5,
    title: "1984",
    author: "George Orwell",
    genre: "Fiction",
    available: true,
    cover:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop",
  },
  {
    id: 6,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Fiction",
    available: false,
    cover:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop",
  },
  {
    id: 7,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Romance",
    available: true,
    cover:
      "https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=300&h=400&fit=crop",
  },
  {
    id: 8,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Fiction",
    available: true,
    cover:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=400&fit=crop",
  },
  {
    id: 9,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    genre: "Non-Fiction",
    available: true,
    cover:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&h=400&fit=crop",
  },
  {
    id: 10,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    available: true,
    cover:
      "https://images.unsplash.com/photo-1621944190310-e3cca1564bd7?w=300&h=400&fit=crop",
  },
  {
    id: 11,
    title: "Becoming",
    author: "Michelle Obama",
    genre: "Biography",
    available: false,
    cover:
      "https://images.unsplash.com/photo-1553729784-e91953dec042?w=300&h=400&fit=crop",
  },
  {
    id: 12,
    title: "Educated",
    author: "Tara Westover",
    genre: "Biography",
    available: true,
    cover:
      "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=300&h=400&fit=crop",
  },
];

const genres = [
  "Fiction",
  "Non-Fiction",
  "Science Fiction",
  "Fantasy",
  "Romance",
  "Thriller",
  "Self-Help",
  "Biography",
];
const authors = [
  "Matt Haig",
  "James Clear",
  "Andy Weir",
  "Alex Michaelides",
  "George Orwell",
  "Harper Lee",
];

export default function BooksPage() {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const toggleAuthor = (author) => {
    setSelectedAuthors((prev) =>
      prev.includes(author)
        ? prev.filter((a) => a !== author)
        : [...prev, author],
    );
  };

  const filteredBooks = books.filter((book) => {
    if (selectedGenres.length > 0 && !selectedGenres.includes(book.genre))
      return false;
    if (selectedAuthors.length > 0 && !selectedAuthors.includes(book.author))
      return false;
    if (availabilityFilter === "available" && !book.available) return false;
    if (availabilityFilter === "unavailable" && book.available) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Book Catalog</h1>

        <div className="grid grid-cols-[280px_1fr] gap-8">
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Genre</h3>
              <div className="space-y-3">
                {genres.map((genre) => (
                  <label
                    key={genre}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre)}
                      onChange={() => toggleGenre(genre)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{genre}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Author</h3>
              <div className="space-y-3">
                {authors.map((author) => (
                  <label
                    key={author}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAuthors.includes(author)}
                      onChange={() => toggleAuthor(author)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{author}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                Availability Status
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={availabilityFilter === "all"}
                    onChange={() => setAvailabilityFilter("all")}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">All Books</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={availabilityFilter === "available"}
                    onChange={() => setAvailabilityFilter("available")}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={availabilityFilter === "unavailable"}
                    onChange={() => setAvailabilityFilter("unavailable")}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Unavailable</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 text-gray-600">
              Showing {filteredBooks.length}{" "}
              {filteredBooks.length === 1 ? "book" : "books"}
            </div>
            <div className="grid grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="mt-1 text-gray-600">{book.author}</p>
                    <Link
                      to={`/book/${book.id}`}
                      className="mt-3 block w-full rounded-lg bg-blue-600 py-2 text-center font-medium text-white hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
