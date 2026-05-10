import { Search, Plus, Edit2, Trash2, X } from "lucide-react";
import { useState } from "react";

const books = [
  {
    id: 1,
    title: "The Midnight Library",
    author: "Matt Haig",
    category: "Fiction",
    stock: 5,
    thumbnail: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&h=140&fit=crop"
  },
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Help",
    stock: 8,
    thumbnail: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=100&h=140&fit=crop"
  },
  {
    id: 3,
    title: "Project Hail Mary",
    author: "Andy Weir",
    category: "Science Fiction",
    stock: 3,
    thumbnail: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=100&h=140&fit=crop"
  },
  {
    id: 4,
    title: "1984",
    author: "George Orwell",
    category: "Fiction",
    stock: 12,
    thumbnail: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=100&h=140&fit=crop"
  },
  {
    id: 5,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    category: "Non-Fiction",
    stock: 6,
    thumbnail: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=100&h=140&fit=crop"
  },
];

export default function BookManagement() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 overflow-auto">
        <div className="border-b border-gray-200 bg-white px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Book Management</h1>
          <p className="text-gray-600">Manage your library collection</p>
        </div>

        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search books by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Add New Book
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Cover</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Book Title</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Author</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Stock Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBooks.map(book => (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{book.id}</td>
                    <td className="px-6 py-4">
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="h-14 w-10 rounded border border-gray-200 object-cover"
                      />
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{book.title}</td>
                    <td className="px-6 py-4 text-gray-600">{book.author}</td>
                    <td className="px-6 py-4 text-gray-600">{book.category}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 font-medium ${
                        book.stock > 5
                          ? "bg-green-50 text-green-700"
                          : book.stock > 0
                          ? "bg-orange-50 text-orange-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {book.stock} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add New Book</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Book Title</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter book title"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Author</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter author name"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Category</label>
                <select className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>Fiction</option>
                  <option>Non-Fiction</option>
                  <option>Science Fiction</option>
                  <option>Biography</option>
                  <option>Self-Help</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-gray-900 mb-2">Stock Quantity</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-900 mb-2">ISBN</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter ISBN"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Add Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
