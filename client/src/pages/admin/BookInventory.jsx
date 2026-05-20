import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, BookOpen, Loader2,
  ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import bookService from '../../services/bookService';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getStockStatus = (available, total) => {
  if (available === 0) return { label: 'Hết sách', cls: 'bg-red-500/10 text-red-400 border border-red-500/20' };
  if (available <= 2)  return { label: 'Sắp hết',  cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
  return                      { label: 'Còn sách', cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
};

const LIMIT = 10;

const emptyForm = {
  title: '', author_id: '', publisher_id: '', isbn: '',
  publish_year: '', description: '', cover_url: '', total_copies: '1',
  category_ids: [],
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all
      ${type === 'success' ? 'bg-emerald-900/90 border-emerald-700 text-emerald-200' : 'bg-red-900/90 border-red-700 text-red-200'}`}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {msg}
    </div>
  );
}

// ── Form Modal ────────────────────────────────────────────────────────────────
function BookFormModal({ open, onClose, editBook, categories, authors, publishers, onSaved }) {
  const [form, setForm]     = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  useEffect(() => {
    if (!open) return;
    if (editBook) {
      setForm({
        title:        editBook.title         || '',
        author_id:    String(editBook.author_id  || ''),
        publisher_id: String(editBook.publisher_id || ''),
        isbn:         editBook.isbn          || '',
        publish_year: String(editBook.publish_year || ''),
        description:  editBook.description   || '',
        cover_url:    editBook.cover_url     || '',
        total_copies: String(editBook.total_copies || 1),
        category_ids: editBook.category_ids  || [],
      });
    } else {
      setForm(emptyForm);
    }
    setErr('');
  }, [open, editBook]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleCat = (id) => {
    setForm(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter(c => c !== id)
        : [...prev.category_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const payload = {
        title:        form.title.trim(),
        author_id:    Number(form.author_id),
        publisher_id: form.publisher_id ? Number(form.publisher_id) : null,
        isbn:         form.isbn.trim()   || null,
        publish_year: form.publish_year  ? Number(form.publish_year) : null,
        description:  form.description.trim() || null,
        cover_url:    form.cover_url.trim()   || null,
        total_copies: Number(form.total_copies) || 1,
        category_ids: form.category_ids,
      };
      if (editBook) {
        await bookService.updateBook(editBook.id, payload);
      } else {
        await bookService.createBook(payload);
      }
      onSaved(editBook ? 'Cập nhật sách thành công!' : 'Thêm sách mới thành công!');
      onClose();
    } catch (e) {
      setErr(e?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-slate-900 dark:text-white font-bold text-lg">
              {editBook ? 'Chỉnh sửa thông tin sách' : 'Thêm sách mới vào kho'}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {editBook ? `ID #${editBook.id}` : 'Điền đầy đủ thông tin bên dưới'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <form id="book-form" onSubmit={handleSubmit} className="p-6 space-y-5">
            {err && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                <AlertTriangle size={14} /> {err}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">Tên sách <span className="text-red-400">*</span></label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Nhập tên sách..." className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Author */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">Tác giả <span className="text-red-400">*</span></label>
                <select required value={form.author_id} onChange={e => set('author_id', e.target.value)} className={inputCls}>
                  <option value="">-- Chọn tác giả --</option>
                  {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              {/* Publisher */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">Nhà xuất bản</label>
                <select value={form.publisher_id} onChange={e => set('publisher_id', e.target.value)} className={inputCls}>
                  <option value="">-- Chọn NXB --</option>
                  {publishers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* ISBN */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">ISBN</label>
                <input value={form.isbn} onChange={e => set('isbn', e.target.value)} placeholder="978-xxx-xxx" className={inputCls} />
              </div>
              {/* Year */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">Năm xuất bản</label>
                <input type="number" min="1000" max={new Date().getFullYear()} value={form.publish_year} onChange={e => set('publish_year', e.target.value)} placeholder="2024" className={inputCls} />
              </div>
              {/* Copies */}
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">Số lượng <span className="text-red-400">*</span></label>
                <input type="number" min="1" required value={form.total_copies} onChange={e => set('total_copies', e.target.value)} placeholder="1" className={inputCls} />
              </div>
            </div>

            {/* Cover URL */}
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">URL ảnh bìa</label>
              <input value={form.cover_url} onChange={e => set('cover_url', e.target.value)} placeholder="https://example.com/cover.jpg" className={inputCls} />
              {form.cover_url && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={form.cover_url} alt="preview" className="h-16 w-12 object-cover rounded-md border border-slate-700" onError={e => { e.target.style.display='none'; }} />
                  <span className="text-xs text-slate-500">Xem trước ảnh bìa</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">Mô tả / Tóm tắt nội dung</label>
              <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Nhập mô tả nội dung sách..." className={`${inputCls} resize-none`} />
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Danh mục / Thể loại</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCat(c.id)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                        form.category_ids.includes(c.id)
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-indigo-500'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Hủy
          </button>
          <button form="book-form" type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm transition-colors flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Đang lưu...' : editBook ? 'Lưu thay đổi' : 'Thêm sách'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
function DeleteModal({ book, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');

  const handleDelete = async () => {
    setLoading(true); setErr('');
    try {
      await bookService.deleteBook(book.id);
      onDeleted('Xóa sách thành công!');
      onClose();
    } catch (e) {
      setErr(e?.message || 'Không thể xóa sách này.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mx-auto mb-4">
          <Trash2 size={22} className="text-red-400" />
        </div>
        <h3 className="text-center text-slate-900 dark:text-white font-bold mb-1">Xóa sách?</h3>
        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-1">
          Bạn sắp xóa <span className="font-semibold text-slate-200">"{book.title}"</span>
        </p>
        <p className="text-center text-slate-500 text-xs mb-5">Thao tác này không thể hoàn tác.</p>
        {err && <p className="text-red-400 text-xs text-center mb-3">{err}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Hủy
          </button>
          <button onClick={handleDelete} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm transition-colors flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function BookInventory() {
  const [books,      setBooks]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');
  const [loading,    setLoading]    = useState(true);

  // Lookup lists cho form
  const [categories,  setCategories]  = useState([]);
  const [authors,     setAuthors]     = useState([]);
  const [publishers,  setPublishers]  = useState([]);

  // Modal state
  const [showForm,    setShowForm]    = useState(false);
  const [editBook,    setEditBook]    = useState(null);
  const [deleteBook,  setDeleteBook]  = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // ── Tải lookup data một lần ──────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      bookService.getCategories().catch(() => ({ success: false })),
      bookService.getAuthors().catch(() => ({ success: false })),
      bookService.getPublishers().catch(() => ({ success: false })),
    ]).then(([cats, auths, pubs]) => {
      if (cats.success)  setCategories(cats.data  || []);
      if (auths.success) setAuthors(auths.data     || []);
      if (pubs.success)  setPublishers(pubs.data   || []);
    });
  }, []);

  // ── Tải danh sách sách ───────────────────────────────────────────────────
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookService.getBooks({
        search, category: catFilter, page, limit: LIMIT,
      });
      if (res.success) {
        setBooks(res.data || []);
        setTotal(res.meta?.total || 0);
      }
    } catch (e) {
      console.error('[BookInventory] fetchBooks:', e);
    } finally {
      setLoading(false);
    }
  }, [search, catFilter, page]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openAdd  = () => { setEditBook(null); setShowForm(true); };
  const openEdit = (book) => { setEditBook(book); setShowForm(true); };

  const handleSaved = (msg) => { showToast(msg); fetchBooks(); };
  const handleDeleted = (msg) => { showToast(msg); fetchBooks(); };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="p-6 space-y-5">
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-white font-bold text-xl">Quản lý Kho Sách</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Tổng cộng <span className="font-semibold text-indigo-400">{total}</span> đầu sách trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchBooks} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Làm mới">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-colors">
            <Plus size={16} /> Thêm sách mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm flex">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên sách, tác giả, ISBN..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-4 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </form>

        {/* Category filter tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setCatFilter(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              catFilter === '' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500/40'
            }`}
          >
            Tất cả
          </button>
          {categories.slice(0, 6).map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCatFilter(String(cat.id)); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                catFilter === String(cat.id) ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500/40'
              }`}
            >
              {cat.name}
              <span className="ml-1 opacity-60">({cat.book_count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                {['Ảnh bìa', 'Thông tin sách', 'Tác giả', 'Danh mục', 'Số lượng', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} className="text-left text-xs text-slate-400 uppercase tracking-wider px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Không tìm thấy sách nào</p>
                    <p className="text-xs mt-1 opacity-70">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                books.map(book => {
                  const status = getStockStatus(book.available_copies, book.total_copies);
                  const cats   = Array.isArray(book.categories)
                    ? book.categories
                    : (book.categories ? String(book.categories).split(',') : []);

                  return (
                    <tr key={book.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Cover */}
                      <td className="px-4 py-3">
                        <div className="w-10 h-14 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                          {book.cover_url
                            ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" onError={e => e.target.src='https://placehold.co/80x110/334155/94a3b8?text=N/A'} />
                            : <div className="w-full h-full flex items-center justify-center"><BookOpen size={16} className="text-slate-400" /></div>
                          }
                        </div>
                      </td>
                      {/* Info */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="text-slate-800 dark:text-slate-100 text-sm font-semibold line-clamp-2">{book.title}</p>
                        {book.isbn && <p className="text-slate-400 text-xs mt-0.5 font-mono">{book.isbn}</p>}
                        {book.publish_year && <p className="text-slate-400 text-xs">Năm {book.publish_year}</p>}
                      </td>
                      {/* Author */}
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">
                        {book.author_name || book.author || '—'}
                      </td>
                      {/* Categories */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {cats.slice(0, 2).map((c, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-medium">{String(c).trim()}</span>
                          ))}
                          {cats.length > 2 && <span className="text-slate-400 text-[10px]">+{cats.length - 2}</span>}
                        </div>
                      </td>
                      {/* Stock */}
                      <td className="px-4 py-3">
                        <span className="text-slate-700 dark:text-slate-200 text-sm font-bold">{book.available_copies}</span>
                        <span className="text-slate-400 text-xs">/{book.total_copies}</span>
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.cls}`}>{status.label}</span>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(book)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="Chỉnh sửa">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeleteBook(book)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Xóa">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400">
              Trang {page}/{totalPages} — {total} sách
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page - 2 + i;
                if (pg > totalPages) return null;
                return (
                  <button key={pg} onClick={() => setPage(pg)} className={`w-7 h-7 rounded-lg text-xs transition-colors ${pg === page ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                    {pg}
                  </button>
                );
              })}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <BookFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        editBook={editBook}
        categories={categories}
        authors={authors}
        publishers={publishers}
        onSaved={handleSaved}
      />

      {deleteBook && (
        <DeleteModal
          book={deleteBook}
          onClose={() => setDeleteBook(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
