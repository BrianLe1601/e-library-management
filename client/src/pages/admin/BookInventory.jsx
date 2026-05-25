import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, EyeOff, Eye, X, Upload,
  BookOpen, Hash, Package, PenTool, Building, Tag, FileText, ChevronDown} from 'lucide-react';
import { 
  getPublishers, getBooks, createBook, updateBook, deleteBook,
  getAuthors, getCategories, createAuthor, createPublisher, toggleHideBook } from '../../services/adminService';

import InputField from '../../components/InputField';

const statusConfig = {
  available: { label: 'Available', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  low_stock: { label: 'Low Stock', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  out_of_stock: { label: 'Out of Stock', className: 'bg-red-500/10 text-red-400 border border-red-500/20' },
};

const emptyForm = {
  title: '', 
  author_id: '',
  publisher_id: '',
  isbn: '',
  categoryIds: [],
  description: '', 
  stock: 0,
  cover: null,
};

export default function BookInventory() {
  const [books, setBooks] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAddingAuth, setIsAddingAuth] = useState(false);
  const [newAuthName, setNewAuthName] = useState('');
  const [newAuthBio, setNewAuthBio] = useState('');
  const [isSavingAuth, setIsSavingAuth] = useState(false);
  const [authorOptions, setAuthorOptions] = useState([]);

  const [categoryOptions, setCategoryOptions] = useState([]);

  const [isAddingPub, setIsAddingPub] = useState(false);
  const [newPubName, setNewPubName] = useState('');
  const [newPubCountry, setNewPubCountry] = useState('');
  const [isSavingPub, setIsSavingPub] = useState(false);
  const [publisherOptions, setPublisherOptions] = useState([]);

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);

  const fetchBooks = async () => {
    try {
      const response = await getBooks();
      const bookData = response.data.data;
      if (Array.isArray(bookData)) {
        const formattedBooks = bookData.map(book => {
          let computedStatus = 'available';
          if (book.availableCopies === 0) {
            computedStatus = 'out_of_stock';
          } else if (book.availableCopies <= 2) {
            computedStatus = 'low_stock';
          }

          return {
            ...book,
            cover: book.coverUrl || 'https://placehold.co/300x450/e2e8f0/475569?text=No+Cover',
            stock: book.totalCopies || 0,
            status: computedStatus,
            author: book.author || 'Unknown Author',
            category: book.category || 'Uncategorized',
            hidden: book.is_hidden,
          };
        });
        setBooks(formattedBooks);
      } else {
        setBooks([]);
      }
      
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  useEffect(() => {
    fetchBooks();

    Promise.all([getAuthors(), getCategories(), getPublishers()]).then(([resAuth, resCat, resPub]) => {
      setAuthorOptions(resAuth.data?.data || resAuth.data || []);
      setCategoryOptions(resCat.data?.data || resCat.data || []);
      setPublisherOptions(resPub.data?.data || resPub.data || []);
    }).catch(err => console.error("Error fetching Select Options:", err));
  }, []);

  const filtered = books.filter(b => {
    const matchSearch = 
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.publisher.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'All' || b.category === filterCat;
    return matchSearch && matchCat;
  });

  const openAddModal = () => {
    setEditBook(null);
    setForm(emptyForm);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (book) => {
    setEditBook(book);
    setForm({
      title: book.title,
      author_id: book.author_id || '',
      publisher_id: book.publisher_id || '',
      isbn: book.isbn || '',
      categoryIds: book.category_id ? [book.category_id] : [],
      description: book.description || '',
      stock: book.totalCopies || book.stock,
      cover: book.coverUrl || book.cover,
    });
    setImagePreview(book.coverUrl || book.cover); 
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, cover: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataToSend = new FormData();
      dataToSend.append('title', form.title);
      dataToSend.append('author_id', form.author_id);
      dataToSend.append('publisher_id', form.publisher_id);
      dataToSend.append('isbn', form.isbn);
      dataToSend.append('description', form.description || '');
      dataToSend.append('total_copies', form.stock);

      // Gửi mảng category dưới dạng chuỗi JSON
      if (form.categoryIds && form.categoryIds.length > 0) {
        dataToSend.append('categoryIds', JSON.stringify(form.categoryIds));
      }

      // Chỉ đính kèm file nếu Admin có tải ảnh lên (trường hợp File object)
      if (form.cover && typeof form.cover !== 'string') {
        dataToSend.append('cover', form.cover); 
      }

      if (editBook) {
        await updateBook(editBook.id, dataToSend); 
      } else {
        await createBook(dataToSend); 
      }

      setShowModal(false);
      fetchBooks();

    } catch (error) {
      console.error("Save book error:", error);
      const errorMessage = error.response?.data?.message || "Error saving book!";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHide = async (id) => {
    try {
      const response = await toggleHideBook(id);

      const newHiddenState = response.data.data.is_hidden;

      setBooks(prev => prev.map(b => 
        b.id === id ? { ...b, hidden: !!newHiddenState } : b
      ));

    } catch (error) {
      console.error("Error when toggling book visibility:", error);
      const errorMessage = error.response?.data?.message || "Cannot change book visibility! It might be currently borrowed or has borrowing history.";
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBook(id);
      setBooks(prev => prev.filter(b => b.id !== id));
    setDeleteId(null);
  }   catch (error) {
      console.error("Delete book error:", error);
      const errorMessage = error.response?.data?.message || "Error deleting book! It might be currently borrowed or has borrowing history.";
      alert(errorMessage);
    }
  };

  const handleQuickAddAuthor = async () => {
    if (!newAuthName.trim()) return;
    setIsSavingAuth(true);
    try {
      const res = await createAuthor({ name: newAuthName.trim(), bio: newAuthBio.trim() });
      if (res.data?.success) {
        const newAuthor = res.data.data;
        setAuthorOptions(prev => [...prev, newAuthor]);
        setForm(prev => ({ ...prev, author_id: newAuthor.id }));

        setNewAuthName('');
        setNewAuthBio('');
        setIsAddingAuth(false);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error adding author!");
    } finally {
      setIsSavingAuth(false);
    }
  };

  const handleQuickAddPublisher = async () => {
    if (!newPubName.trim() || !newPubCountry.trim()) return;
    setIsSavingPub(true);
    try {
      const res = await createPublisher({ name: newPubName.trim(), country: newPubCountry.trim() });
      if (res.data?.success) {
        const newPub = res.data.data;
        setPublisherOptions(prev => [...prev, newPub]);
        setForm(prev => ({ ...prev, publisher_id: newPub.id }));

        setNewPubName('');
        setNewPubCountry('');
        setIsAddingPub(false);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error adding publisher!");
    } finally {
      setIsSavingPub(false);
    }
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
            placeholder="Search books or authors or publishers ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
            <button
              key="all"
              onClick={() => setFilterCat('All')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterCat === 'All'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500/40'
              }`}
            >
              All
            </button>
            {categoryOptions.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCat(cat.name)} // So sánh theo tên (name)
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  filterCat === cat.name
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500/40'
                }`}
              >
                {cat.name}
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
                <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3">Publisher</th>
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
                    {book.hidden ? <span className="text-xs text-slate-400">(Hidden)</span> : null}
                  </td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-sm">{book.author}</td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-sm">{book.publisher}</td>
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
          <div className="relative bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h2 className="text-slate-900 dark:text-white font-bold">{editBook ? 'Edit Book' : 'Add New Book'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Form - Thêm overflow-y-auto để cuộn nếu form dài */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Khu vực Upload Ảnh bìa */}
              <div className="flex flex-col items-center mb-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 w-full text-left">Cover Image</label>
                <div className="relative w-32 h-44 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden hover:border-indigo-500 transition-colors group bg-slate-50 dark:bg-slate-800/50">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <Upload size={20} className="mb-1.5 group-hover:text-indigo-500 transition-colors" />
                      <span className="text-xs">Upload Cover</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                </div>
              </div>

              {/* 1. Tiêu đề sách - Sử dụng InputField component */}
              <InputField 
                name="title" 
                label="Book Title *" 
                placeholder="e.g. The Great Gatsby" 
                icon={BookOpen} 
                value={form.title} 
                onChange={(e) => setForm({...form, title: e.target.value})} 
                fieldErrors={{}} // Truyền object rỗng nếu form này chưa quản lý fieldErrors riêng biệt
              />

              {/* 2. Hàng chứa Author & Publisher (Sử dụng select box được custom đồng bộ class với InputField) */}
              <div className="grid grid-cols-2 gap-4 items-start">
                {/* KHỐI TÁC GIẢ */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs text-slate-500 dark:text-slate-400">Author *</label>
                    {!isAddingAuth ? (
                      <button type="button" onClick={() => setIsAddingAuth(true)} className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium transition-colors cursor-pointer">+ New</button>
                    ) : (
                      <button type="button" onClick={() => { setIsAddingAuth(false); setNewAuthName(''); setNewAuthBio(''); }} className="text-[11px] text-slate-400 hover:text-slate-500 transition-colors cursor-pointer">Cancel</button>
                    )}
                  </div>

                  {!isAddingAuth ? (
                    <div className="relative">
                      <PenTool size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                      <select 
                        required 
                        value={form.author_id} 
                        onChange={(e) => setForm({...form, author_id: e.target.value})} 
                        className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 cursor-pointer appearance-none"
                      >
                        <option value="">Select Author</option>
                        {authorOptions.map(auth => (<option key={auth.id} value={auth.id}>{auth.name}</option>))}
                      </select>
                      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  ) : (
                    // FORM MINI THÊM TÁC GIẢ
                    <div className="flex flex-col gap-2 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-900/10">
                      <input type="text" autoFocus placeholder="Author Name *" value={newAuthName} onChange={(e) => setNewAuthName(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/40" />
                      <input type="text" placeholder="Bio (Optional)..." value={newAuthBio} onChange={(e) => setNewAuthBio(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/40" />
                      <button type="button" disabled={isSavingAuth || !newAuthName.trim()} onClick={handleQuickAddAuthor} className="w-full py-2 bg-indigo-600 text-white font-medium text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        {isSavingAuth ? 'Saving...' : 'Save Author'}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* KHỐI NHÀ XUẤT BẢN */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs text-slate-500 dark:text-slate-400">Publisher</label>
                    {!isAddingPub ? (
                      <button type="button" onClick={() => setIsAddingPub(true)} className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium transition-colors cursor-pointer">+ New</button>
                    ) : (
                      <button type="button" onClick={() => { setIsAddingPub(false); setNewPubName(''); setNewPubCountry(''); }} className="text-[11px] text-slate-400 hover:text-slate-500 transition-colors cursor-pointer">Cancel</button>
                    )}
                  </div>

                  {!isAddingPub ? (
                    <div className="relative">
                      <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                      <select 
                        value={form.publisher_id} 
                        onChange={(e) => setForm({...form, publisher_id: e.target.value})} 
                        className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 cursor-pointer appearance-none"
                      >
                        <option value="">Select Publisher</option>
                        {publisherOptions.map(pub => (<option key={pub.id} value={pub.id}>{pub.name}</option>))}
                      </select>
                      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  ) : (
                    // FORM MINI THÊM NXB
                    <div className="flex flex-col gap-2 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-900/10">
                      <input type="text" autoFocus placeholder="Publisher Name *" value={newPubName} onChange={(e) => setNewPubName(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/40" />
                      <input type="text" placeholder="Country *" value={newPubCountry} onChange={(e) => setNewPubCountry(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/40" />
                      <button type="button" disabled={isSavingPub || !newPubName.trim() || !newPubCountry.trim()} onClick={handleQuickAddPublisher} className="w-full py-2 bg-indigo-600 text-white font-medium text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        {isSavingPub ? 'Saving...' : 'Save Publisher'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Thể loại sách / Genre (Custom select box đồng bộ class với InputField) */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Genre *</label>
                <div className="relative">
                  <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                  <select
                    required
                    value={form.categoryIds?.[0] || ""}
                    onChange={e => setForm(p => ({ ...p, categoryIds: [Number(e.target.value)] }))}
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 cursor-pointer appearance-none"
                  >
                    <option value="">Select Genre</option>
                    {categoryOptions.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 4. Hàng chứa ISBN & Total Copies - Sử dụng InputField component */}
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  name="isbn" 
                  label="ISBN Code" 
                  placeholder="e.g. ISBN-0..." 
                  icon={Hash} 
                  value={form.isbn} 
                  onChange={(e) => setForm({...form, isbn: e.target.value})} 
                  fieldErrors={{}} 
                />

                <InputField 
                  name="stock" 
                  label="Total Copies *" 
                  type="text"
                  placeholder="0" 
                  icon={Package} 
                  value={form.stock} 
                  onChange={(e) => setForm({...form, stock: parseInt(e.target.value) || 0})} 
                  fieldErrors={{}} 
                />
              </div>

              {/* 5. Ô nhập mô tả / Description (Custom textarea đồng bộ class với InputField) */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Description</label>
                <div className="relative">
                  <FileText size={15} className="absolute left-3 top-3 text-slate-400" />
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Brief description of the book..."
                    className="w-full pl-9 pr-4 pt-2.5 pb-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 resize-none"
                  />
                </div>
              </div>

              {/* Khối nút Hành động Cancel / Submit */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? 'Saving...' : (editBook ? 'Save Changes' : 'Add Book')}
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