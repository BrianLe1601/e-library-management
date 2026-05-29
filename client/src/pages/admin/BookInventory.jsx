import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, EyeOff, Eye, X, Upload,
  BookOpen, Hash, Package, PenTool, Building, Tag, FileText, ChevronDown, Layers
} from 'lucide-react';
import adminService from '../../services/adminService';
import InputField from '../../components/InputField';

// 100% English Status Configuration
const statusConfig = {
  available: { label: 'Available', className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' },
  low_stock: { label: 'Low Stock', className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' },
  out_of_stock: { label: 'Out of Stock', className: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20' },
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

  const [loadingData, setLoadingData] = useState(true);

  const fetchBooks = async () => {
    try {
      setLoadingData(true);
      const response = await adminService.getBooks();
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
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    Promise.all([adminService.getAuthors(), adminService.getCategories(), adminService.getPublishers()]).then(([resAuth, resCat, resPub]) => {
      setAuthorOptions(resAuth.data?.data || resAuth.data || []);
      setCategoryOptions(resCat.data?.data || resCat.data || []);
      setPublisherOptions(resPub.data?.data || resPub.data || []);
    }).catch(err => console.error("Error fetching Select Options:", err));
  }, []);

  const filtered = useMemo(() => {
    const safeBooks = Array.isArray(books) ? books : [];
    const searchLower = search.toLowerCase();
    
    return safeBooks.filter(b => {
      const matchSearch = 
        (b.title || '').toLowerCase().includes(searchLower) ||
        (b.author || '').toLowerCase().includes(searchLower) ||
        (b.publisher || '').toLowerCase().includes(searchLower);
      const matchCat = filterCat === 'All' || b.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [books, search, filterCat]);

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

      if (form.categoryIds && form.categoryIds.length > 0) {
        dataToSend.append('categoryIds', JSON.stringify(form.categoryIds));
      }

      if (form.cover && typeof form.cover !== 'string') {
        dataToSend.append('cover', form.cover); 
      }

      if (editBook) {
        await adminService.updateBook(editBook.id, dataToSend); 
      } else {
        await adminService.createBook(dataToSend); 
      }

      setShowModal(false);
      fetchBooks();

    } catch (error) {
      console.error("Save book error:", error);
      alert(error.response?.data?.message || "Error saving book!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHide = async (id) => {
    try {
      const response = await adminService.toggleHideBook(id);
      const newHiddenState = response.data.data.is_hidden;
      setBooks(prev => prev.map(b => 
        b.id === id ? { ...b, hidden: !!newHiddenState } : b
      ));
    } catch (error) {
      console.error("Error when toggling book visibility:", error);
      alert(error.response?.data?.message || "Cannot change book visibility status.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminService.deleteBook(id);
      setBooks(prev => prev.filter(b => b.id !== id));
      setDeleteId(null);
    } catch (error) {
      console.error("Delete book error:", error);
      alert(error.response?.data?.message || "Error deleting book!");
    }
  };

  const handleQuickAddAuthor = async () => {
    if (!newAuthName.trim()) return;
    setIsSavingAuth(true);
    try {
      const res = await adminService.createAuthor({ name: newAuthName.trim(), bio: newAuthBio.trim() });
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
      const res = await adminService.createPublisher({ name: newPubName.trim(), country: newPubCountry.trim() });
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 px-4 py-6 sm:px-6 lg:px-8 font-sans antialiased transition-colors duration-200 pb-24">
      <div className="mx-auto max-w-[1400px] space-y-6">
        
        {/* HEADER */}
        <header className="rounded-3xl border border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-[#0d1527]/80 backdrop-blur-md p-5 sm:p-6 shadow-xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between transition-colors">
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Inventory Management</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">Book Inventory</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex items-center gap-2">
              <Layers size={14} className="text-indigo-500" />
              Total of {books.length} books in system.
            </p>
          </div>
          
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
          >
            <Plus size={18} strokeWidth={3} /> Add New Book
          </button>
        </header>

        {/* SEARCH & FILTER */}
        <div className="flex flex-col gap-3">
          <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0d1527]/50 p-2 sm:p-3 shadow-sm transition-colors">
            <span className="absolute inset-y-0 left-4 sm:left-5 flex items-center text-slate-400">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or publisher..." 
              className="w-full pl-10 sm:pl-12 pr-4 py-2 bg-transparent text-sm font-medium focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          {/* Categories Horizontal Scrollbar */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x touch-pan-x">
            <button
              onClick={() => setFilterCat('All')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start ${
                filterCat === 'All'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-[#0d1527]/50 border border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              All Categories
            </button>
            {categoryOptions.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCat(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all snap-start ${
                  filterCat === cat.name
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white dark:bg-[#0d1527]/50 border border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING & EMPTY STATE */}
        {loadingData ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#0d1527]/40 rounded-3xl border border-slate-200 dark:border-slate-800/60">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4" />
            <p className="text-slate-500 font-medium text-sm">Loading book inventory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-[#0d1527]/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <BookOpen size={48} strokeWidth={1} className="text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-slate-900 dark:text-white font-bold mb-1">No Books Found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">No books match your filters or search keywords.</p>
          </div>
        ) : (
          <>
            {/* VIEW MOBILE (BOOK CARDS) */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
              {filtered.map(book => (
                <div key={book.id} className={`bg-white dark:bg-[#0d1527] rounded-2xl p-3 border border-slate-200 dark:border-slate-800/80 shadow-sm flex gap-3 transition-opacity ${book.hidden ? 'opacity-60 grayscale-[30%]' : ''}`}>
                  <div className="w-20 h-28 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative">
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
                    {/* FIXED: Using ternary operator to completely clean up the '0' issue */}
                    {book.hidden ? (
                      <div className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Hidden</div>
                    ) : ""}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-tight">{book.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{book.author}</p>
                      <p className="text-[10px] text-indigo-500 font-medium mt-1 uppercase bg-indigo-50 dark:bg-indigo-500/10 w-fit px-1.5 py-0.5 rounded">{book.category}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusConfig[book.status].className}`}>{statusConfig[book.status].label}</span>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1">Stock: {book.stock} copies</span>
                      </div>
                      {/* FIXED: Added Toggle Visibility Button (Eye/EyeOff) right on Mobile layout */}
                      <div className="flex gap-1">
                        <button onClick={() => openEditModal(book)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => toggleHide(book.id)} className={`p-2 rounded-lg transition-colors ${book.hidden ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`} title={book.hidden ? 'Show' : 'Hide'}>
                          {book.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button onClick={() => setDeleteId(book.id)} className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* VIEW DESKTOP (TABLE) */}
            <div className="hidden sm:block bg-white dark:bg-[#0d1527]/60 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0a101f]/50 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6 w-20">Cover</th>
                      <th className="py-4 px-6">Book Info</th>
                      <th className="py-4 px-6">Author</th>
                      <th className="py-4 px-6">Category</th>
                      <th className="py-4 px-6 text-center">Stock</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                    {filtered.map(book => (
                      <tr key={book.id} className={`group hover:bg-slate-50/50 dark:hover:bg-[#10192e]/40 transition-colors ${book.hidden ? 'opacity-50 grayscale-[20%]' : ''}`}>
                        <td className="py-3 px-6">
                          <div className="w-11 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                            <img src={book.cover} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        </td>
                        <td className="py-3 px-6 max-w-[220px]">
                          <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{book.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400 font-mono">ISBN: {book.isbn || 'N/A'}</span>
                            {/* FIXED: Using ternary operator to clean up the '0' issue on Desktop */}
                            {book.hidden ? (
                              <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Hidden</span>
                            ) : ""}
                          </div>
                        </td>
                        <td className="py-3 px-6 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[150px]">{book.author}</td>
                        <td className="py-3 px-6">
                          <span className="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-lg truncate block w-fit max-w-[120px]">
                            {book.category}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <span className="font-black text-slate-800 dark:text-white">{book.stock}</span>
                          <span className="text-xs text-slate-400 ml-1">copies</span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${statusConfig[book.status].className}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" /> {statusConfig[book.status].label}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditModal(book)} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => toggleHide(book.id)} className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors" title={book.hidden ? 'Show' : 'Hide'}>{book.hidden ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                            <button onClick={() => setDeleteId(book.id)} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors" title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* MODAL ADD / EDIT BOOK */}
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] sm:rounded-3xl rounded-t-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
                <div>
                  <h2 className="text-slate-900 dark:text-white font-black text-lg tracking-tight">{editBook ? 'Update Book' : 'Add New Book'}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Provide detailed information for the repository</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                
                {/* Book Cover Upload Section */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 w-full text-left">Book Cover Image</label>
                  <div className="relative w-32 h-44 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group bg-slate-50 dark:bg-[#0a101f]">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                          <Upload size={18} /> Change Image
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-center p-4 text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <Upload size={24} className="mb-2" />
                        <span className="text-[11px] font-bold">Upload Cover</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>

                <InputField name="title" label="Book Title *" placeholder="Enter book title..." icon={BookOpen} value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} fieldErrors={{}} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Author */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-400">Author *</label>
                      {!isAddingAuth ? (
                        <button type="button" onClick={() => setIsAddingAuth(true)} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer">+ Add New</button>
                      ) : (
                        <button type="button" onClick={() => { setIsAddingAuth(false); setNewAuthName(''); setNewAuthBio(''); }} className="text-xs text-slate-500 font-bold hover:underline cursor-pointer">Cancel</button>
                      )}
                    </div>
                    {!isAddingAuth ? (
                      <div className="relative">
                        <PenTool size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        <select required value={form.author_id} onChange={(e) => setForm({...form, author_id: e.target.value})} className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0a101f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                          <option value="">Select Author</option>
                          {authorOptions.map(auth => (<option key={auth.id} value={auth.id}>{auth.name}</option>))}
                        </select>
                        <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-900/10">
                        <input type="text" autoFocus placeholder="Author Name *" value={newAuthName} onChange={(e) => setNewAuthName(e.target.value)} className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                        <input type="text" placeholder="Biography (Optional)..." value={newAuthBio} onChange={(e) => setNewAuthBio(e.target.value)} className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                        <button type="button" disabled={isSavingAuth || !newAuthName.trim()} onClick={handleQuickAddAuthor} className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg disabled:opacity-50">
                          {isSavingAuth ? 'Saving...' : 'Save Author'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Publisher */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-400">Publisher</label>
                      {!isAddingPub ? (
                        <button type="button" onClick={() => setIsAddingPub(true)} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer">+ Add New</button>
                      ) : (
                        <button type="button" onClick={() => { setIsAddingPub(false); setNewPubName(''); setNewPubCountry(''); }} className="text-xs text-slate-500 font-bold hover:underline cursor-pointer">Cancel</button>
                      )}
                    </div>
                    {!isAddingPub ? (
                      <div className="relative">
                        <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        <select value={form.publisher_id} onChange={(e) => setForm({...form, publisher_id: e.target.value})} className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0a101f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                          <option value="">Select Publisher</option>
                          {publisherOptions.map(pub => (<option key={pub.id} value={pub.id}>{pub.name}</option>))}
                        </select>
                        <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-900/10">
                        <input type="text" autoFocus placeholder="Publisher Name *" value={newPubName} onChange={(e) => setNewPubName(e.target.value)} className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                        <input type="text" placeholder="Country *" value={newPubCountry} onChange={(e) => setNewPubCountry(e.target.value)} className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                        <button type="button" disabled={isSavingPub || !newPubName.trim() || !newPubCountry.trim()} onClick={handleQuickAddPublisher} className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg disabled:opacity-50">
                          {isSavingPub ? 'Saving...' : 'Save Publisher'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400">Category *</label>
                  <div className="relative">
                    <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <select required value={form.categoryIds?.[0] || ""} onChange={e => setForm(p => ({ ...p, categoryIds: [Number(e.target.value)] }))} className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0a101f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                      <option value="">Select Category</option>
                      {categoryOptions.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField name="isbn" label="ISBN Code" placeholder="e.g. ISBN-0..." icon={Hash} value={form.isbn} onChange={(e) => setForm({...form, isbn: e.target.value})} fieldErrors={{}} />
                  <InputField name="stock" label="Total Copies *" type="text" placeholder="0" icon={Package} value={form.stock} onChange={(e) => setForm({...form, stock: parseInt(e.target.value) || 0})} fieldErrors={{}} />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400">Description</label>
                  <div className="relative">
                    <FileText size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Enter summary or description of the book..." className="w-full pl-10 pr-4 pt-2.5 pb-2 text-sm rounded-xl bg-slate-50 dark:bg-[#0a101f] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-indigo-500 resize-none" />
                  </div>
                </div>
              </form>

              <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080d1a] text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-black shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : (editBook ? 'Save Changes' : 'Add to Inventory')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-500/10 mx-auto mb-4 border border-rose-100 dark:border-rose-500/20">
                <Trash2 size={24} className="text-rose-500 dark:text-rose-400" />
              </div>
              <h3 className="text-center text-slate-900 dark:text-white font-black text-xl mb-1.5">Permanently Delete?</h3>
              <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                This action cannot be undone. All book information will be completely removed from the library system.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-black shadow-md shadow-rose-600/20 transition-colors">
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}