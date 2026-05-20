import React, { useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, EyeOff, Eye, X, Upload,
  BookOpen,
} from 'lucide-react';

const initialBooks = [
  {
    id: 1,
    cover: 'https://images.unsplash.com/photo-1760696473709-a7da66ee87a6?w=80&h=110&fit=crop',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    category: 'Fiction',
    stock: 5,
    status: 'available',
    hidden: false,
  },
  {
    id: 2,
    cover: 'https://images.unsplash.com/photo-1547056358-c0c75aca6c5b?w=80&h=110&fit=crop',
    title: 'Dune',
    author: 'Frank Herbert',
    category: 'Sci-Fi',
    stock: 3,
    status: 'low_stock',
    hidden: false,
  },
  {
    id: 3,
    cover: 'https://images.unsplash.com/photo-1764509422504-f9aee0a1dd76?w=80&h=110&fit=crop',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    category: 'Science',
    stock: 8,
    status: 'available',
    hidden: false,
  },
  {
    id: 4,
    cover: 'https://images.unsplash.com/photo-1697791173189-d56b15df4f33?w=80&h=110&fit=crop',
    title: 'The Art of War',
    author: 'Sun Tzu',
    category: 'History',
    stock: 12,
    status: 'available',
    hidden: false,
  },
  {
    id: 5,
    cover: 'https://images.unsplash.com/photo-1547056358-c0c75aca6c5b?w=80&h=110&fit=crop',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Technology',
    stock: 0,
    status: 'out_of_stock',
    hidden: false,
  },
  {
    id: 6,
    cover: 'https://images.unsplash.com/photo-1760696473709-a7da66ee87a6?w=80&h=110&fit=crop',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    category: 'Fiction',
    stock: 2,
    status: 'low_stock',
    hidden: false,
  },
  {
    id: 7,
    cover: 'https://images.unsplash.com/photo-1764509422504-f9aee0a1dd76?w=80&h=110&fit=crop',
    title: '1984',
    author: 'George Orwell',
    category: 'Fiction',
    stock: 7,
    status: 'available',
    hidden: false,
  },
  {
    id: 8,
    cover: 'https://images.unsplash.com/photo-1697791173189-d56b15df4f33?w=80&h=110&fit=crop',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    category: 'History',
    stock: 4,
    status: 'available',
    hidden: false,
  },
];

const statusConfig = {
  available: { label: 'Available', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  low_stock: { label: 'Low Stock', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  out_of_stock: { label: 'Out of Stock', className: 'bg-red-500/10 text-red-400 border border-red-500/20' },
};

const emptyForm = {
  title: '', author: '', genre: '', description: '', quantity: '', cover: '',
};

export default function BookInventory() {
  const [books, setBooks] = useState(initialBooks);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);

  const categories = ['All', 'Fiction', 'Sci-Fi', 'Science', 'History', 'Technology'];

  const filtered = books.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || b.category === filterCat;
    return matchSearch && matchCat;
  });

  const openAddModal = () => {
    setEditBook(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (book) => {
    setEditBook(book);
    setForm({
      title: book.title,
      author: book.author,
      genre: book.category,
      description: '',
      quantity: String(book.stock),
      cover: book.cover,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = parseInt(form.quantity) || 0;
    const status = qty === 0 ? 'out_of_stock' : qty <= 3 ? 'low_stock' : 'available';
    if (editBook) {
      setBooks(prev => prev.map(b => b.id === editBook.id
        ? { ...b, title: form.title, author: form.author, category: form.genre, stock: qty, status }
        : b
      ));
    } else {
      setBooks(prev => [...prev, {
        id: Date.now(),
        cover: form.cover || 'https://images.unsplash.com/photo-1547056358-c0c75aca6c5b?w=80&h=110&fit=crop',
        title: form.title,
        author: form.author,
        category: form.genre,
        stock: qty,
        status,
        hidden: false,
      }]);
    }
    setShowModal(false);
  };

  const toggleHide = (id) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, hidden: !b.hidden } : b));
  };

  const handleDelete = (id) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white">Book Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{books.length} total books in catalog</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-colors shrink-0"
        >
          <Plus size={16} /> Add New Book
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search books or authors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterCat === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Cover</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Title</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Author</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Category</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Stock</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(book => (
                <tr
                  key={book.id}
                  className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${book.hidden ? 'opacity-40' : ''}`}
                >
                  <td className="px-5 py-3">
                    <div className="w-10 h-14 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                      <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-800 dark:text-slate-100 text-sm font-medium">{book.title}</p>
                    {book.hidden && <span className="text-xs text-slate-400">(Hidden)</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-sm">{book.author}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs">{book.category}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">{book.stock}</span>
                    <span className="text-slate-400 text-xs ml-1">copies</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${statusConfig[book.status].className}`}>
                      {statusConfig[book.status].label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(book)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => toggleHide(book.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        title={book.hidden ? 'Show' : 'Hide'}
                      >
                        {book.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => setDeleteId(book.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                    No books found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-slate-900 dark:text-white">{editBook ? 'Edit Book' : 'Add New Book'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Book Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Enter book title"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Author *</label>
                  <input
                    required
                    value={form.author}
                    onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                    placeholder="Author name"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Genre *</label>
                  <select
                    required
                    value={form.genre}
                    onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="">Select genre</option>
                    {['Fiction', 'Sci-Fi', 'Science', 'History', 'Technology', 'Philosophy', 'Literature'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of the book..."
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Quantity *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Upload Cover</label>
                  <label className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 cursor-pointer hover:border-indigo-500/60 transition-colors">
                    <Upload size={14} />
                    <span>Choose file</span>
                    <input type="file" className="hidden" accept="image/*" />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-colors"
                >
                  {editBook ? 'Save Changes' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mx-auto mb-4">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="text-center text-slate-900 dark:text-white mb-1">Delete Book?</h3>
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-5">This action cannot be undone. The book will be permanently removed from inventory.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}