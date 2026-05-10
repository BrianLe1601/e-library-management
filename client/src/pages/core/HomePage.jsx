import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const newArrivals = [
  { id: 1, title: "The Midnight Library", author: "Matt Haig", cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop" },
  { id: 2, title: "Atomic Habits", author: "James Clear", cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300&h=400&fit=crop" },
  { id: 3, title: "Project Hail Mary", author: "Andy Weir", cover: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=300&h=400&fit=crop" },
  { id: 4, title: "The Silent Patient", author: "Alex Michaelides", cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop" },
];

const popularBooks = [
  { id: 5, title: "1984", author: "George Orwell", cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop" },
  { id: 6, title: "To Kill a Mockingbird", author: "Harper Lee", cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop" },
  { id: 7, title: "Pride and Prejudice", author: "Jane Austen", cover: "https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=300&h=400&fit=crop" },
  { id: 8, title: "The Great Gatsby", author: "F. Scott Fitzgerald", cover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=400&fit=crop" },
];

function BookCard({ book }) {
  return (
    <Link
      to={`/book/${book.id}`}
      className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
    >
      <div className="aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={book.cover}
          alt={book.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{book.title}</h3>
        <p className="mt-1 text-gray-600">{book.author}</p>
      </div>
    </Link>
  );
}

export default function Homepage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Discover Your Next Great Read</h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Explore thousands of books, from timeless classics to contemporary bestsellers. Your next adventure starts here.
            </p>
            <Link
              to="/books"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Browse Catalog
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">New Arrivals</h2>
          <div className="grid grid-cols-4 gap-6">
            {newArrivals.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Most Popular Books</h2>
          <div className="grid grid-cols-4 gap-6">
            {popularBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
