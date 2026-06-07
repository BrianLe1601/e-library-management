import { useState, useEffect, useCallback } from 'react';
import {
  Download, FileSpreadsheet, FileText, Calendar, Filter,
  TrendingUp, BookOpen, Users, BarChart2, Loader2, RefreshCw,
  AlertTriangle, ChevronLeft, ChevronRight, Eye, X,
  CheckCircle, XCircle, AlertCircle, RotateCcw, HelpCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import adminService from '../../services/adminService';

// ─────────────────────────────────────────────────────────────────────────────
// Inject thư viện qua <script> tag rồi đọc từ window
// ─────────────────────────────────────────────────────────────────────────────
const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

const getJsPDF = async () => {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');
  return window.jspdf?.jsPDF || window.jsPDF;
};

// Chuyển tiếng Việt có dấu → không dấu để PDF render đúng (Dùng font mặc định)
const viToAscii = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

const getXLSX = async () => {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  return window.XLSX;
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-300 text-xs mb-2">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className }) => (
  <div className={`bg-slate-700/40 rounded animate-pulse ${className}`} />
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt      = (n) => Number(n || 0).toLocaleString('vi-VN');
const fmtMoney = (n) => `${fmt(n)}đ`;
const pct      = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(1) : '0.0');
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_META = {
  borrowing: { label: 'Borrowing',  cls: 'bg-blue-500/10 text-blue-400'       },
  renewed:   { label: 'Renewed',    cls: 'bg-purple-500/10 text-purple-400'   },
  returned:  { label: 'Returned',   cls: 'bg-emerald-500/10 text-emerald-400' },
  overdue:   { label: 'Overdue',    cls: 'bg-red-500/10 text-red-400'         },
  pending:   { label: 'Pending',    cls: 'bg-amber-500/10 text-amber-400'     },
  cancelled: { label: 'Cancelled',  cls: 'bg-slate-500/10 text-slate-400'     },
  lost:      { label: 'Lost',       cls: 'bg-orange-500/10 text-orange-400'   },
  returning: { label: 'Returning',  cls: 'bg-teal-500/10 text-teal-400'       },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, cls: 'bg-slate-500/10 text-slate-400' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${meta.cls}`}>
      {meta.label}
    </span>
  );
};

// ─── Borrow Detail Modal ───────────────────────────────────────────────────────
const BorrowDetailModal = ({ row, onClose }) => {
  if (!row) return null;

  const borrowDate  = row.borrow_date  ? new Date(row.borrow_date)  : null;
  const dueDate     = row.due_date     ? new Date(row.due_date)     : null;
  const returnDate  = row.return_date  ? new Date(row.return_date)  : null;
  const daysTotal   = borrowDate && dueDate ? Math.round((dueDate - borrowDate) / 86400000) : null;
  const daysOverdue = dueDate && (
    row.status === 'overdue'
      ? Math.round((new Date() - dueDate) / 86400000)
      : returnDate && returnDate > dueDate
        ? Math.round((returnDate - dueDate) / 86400000)
        : null
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-indigo-400" />
            <h3 className="text-slate-900 dark:text-white font-semibold text-sm">Borrow Record Detail</h3>
            <span className="text-slate-400 text-xs font-mono">#{row.id}</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={14} className="text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={row.status} />
            {row.fine_amount > 0 ? (
              <span className={`text-sm font-semibold ${row.fine_paid ? 'text-emerald-400' : 'text-red-400'}`}>
                Fine: {fmtMoney(row.fine_amount)} {row.fine_paid ? '(Paid ✓)' : '(Unpaid)'}
              </span>
            ) : (
              <span className="text-xs text-slate-400">No fine</span>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-2">Reader</p>
            <div className="flex justify-between"><span className="text-xs text-slate-500">Name</span><span className="text-sm font-medium text-slate-800 dark:text-slate-200">{row.user_name}</span></div>
            <div className="flex justify-between"><span className="text-xs text-slate-500">Email</span><span className="text-xs text-slate-500">{row.email}</span></div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-2">Book</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{row.book_title}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-2">Timeline</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-[10px] text-slate-400 mb-1">Borrow Date</p><p className="text-xs font-medium text-slate-700 dark:text-slate-200">{fmtDate(row.borrow_date)}</p></div>
              <div><p className="text-[10px] text-slate-400 mb-1">Due Date</p><p className={`text-xs font-medium ${daysOverdue > 0 ? 'text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{fmtDate(row.due_date)}</p></div>
              <div><p className="text-[10px] text-slate-400 mb-1">Return Date</p><p className="text-xs font-medium text-emerald-400">{fmtDate(row.return_date)}</p></div>
            </div>
            {daysTotal && <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between"><span className="text-xs text-slate-500">Loan period</span><span className="text-xs font-medium text-slate-700 dark:text-slate-300">{daysTotal} days</span></div>}
            {daysOverdue > 0 && <div className="flex justify-between"><span className="text-xs text-slate-500">Days overdue</span><span className="text-xs font-semibold text-red-400">{daysOverdue} days</span></div>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 mb-1">Renewals</p>
              <p className="text-sm font-semibold text-purple-400">{row.renewed_count || 0}×</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 mb-1">Handled by</p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{row.handled_by || '—'}</p>
            </div>
          </div>

          {row.note && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-amber-400 mb-1">Note</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{row.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function Reports() {
  
  // SỬA LỖI MÚI GIỜ Ở ĐÂY: Lấy đúng ngày Local Time của Việt Nam
  const today = new Date();
  const currentYear = today.getFullYear();
  const localMonth = String(today.getMonth() + 1).padStart(2, '0');
  const localDay = String(today.getDate()).padStart(2, '0');
  const localTodayStr = `${currentYear}-${localMonth}-${localDay}`;

  const [dateFrom,     setDateFrom]     = useState(`${currentYear}-01-01`);
  const [dateTo,       setDateTo]       = useState(localTodayStr);
  const [chartYear,    setChartYear]    = useState(currentYear);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCat,  setSelectedCat]  = useState('All');
  const [selectedRow,  setSelectedRow]  = useState(null);

  const [summary,      setSummary]      = useState(null);
  const [chartData,    setChartData]    = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [detailRows,   setDetailRows]   = useState([]);
  const [detailTotal,  setDetailTotal]  = useState(0);
  const [detailPage,   setDetailPage]   = useState(1);
  const DETAIL_LIMIT = 20;

  const [loadingSummary,  setLoadingSummary]  = useState(true);
  const [loadingChart,    setLoadingChart]    = useState(true);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingDetail,   setLoadingDetail]   = useState(true);
  const [exporting,       setExporting]       = useState(null); // null | 'pdf' | 'excel'

  // ── Fetch detail ────────────────
  const fetchDetail = useCallback(async (page = 1) => {
    setLoadingDetail(true);
    try {
      const res = await adminService.getReports(
        dateFrom,
        dateTo,
        statusFilter,
        page,
        DETAIL_LIMIT
      );

      const data  = res?.data;
      const rows  =
        data?.data?.rows   ??
        data?.rows         ??
        data?.data         ??  
        (Array.isArray(data) ? data : []);

      const total =
        data?.meta?.total ??
        data?.data?.total ??
        data?.total ??
        (Array.isArray(rows) ? rows.length : 0);

      setDetailRows(Array.isArray(rows) ? rows : []);
      setDetailTotal(Number(total) || 0);
      setDetailPage(page);
    } catch (e) {
      console.error('[Reports] fetchDetail error:', e);
      setDetailRows([]);
    } finally {
      setLoadingDetail(false);
    }
  }, [dateFrom, dateTo, statusFilter]);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await adminService.getReportSummary(dateFrom, dateTo);
      setSummary(res.data?.data ?? res.data ?? null);
    } catch (e) { console.error('[summary]', e); }
    finally { setLoadingSummary(false); }
  }, [dateFrom, dateTo]);

  const fetchChart = useCallback(async () => {
    setLoadingChart(true);
    try {
      const res = await adminService.getBorrowChart(chartYear);
      setChartData(res.data?.data ?? []);
    } catch (e) { console.error('[chart]', e); }
    finally { setLoadingChart(false); }
  }, [chartYear]);

  const fetchCategory = useCallback(async () => {
    setLoadingCategory(true);
    try {
      const res = await adminService.getCategoryReport(dateFrom, dateTo);
      setCategoryData(res.data?.data ?? []);
    } catch (e) { console.error('[category]', e); }
    finally { setLoadingCategory(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchSummary(); fetchCategory(); fetchDetail(1); }, [fetchSummary, fetchCategory, fetchDetail]);
  useEffect(() => { fetchChart(); }, [fetchChart]);

  const handleApply = () => { fetchSummary(); fetchCategory(); fetchDetail(1); };

  // ── Export PDF (Đã fix font và landscape) ──────────────────────────────────
  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      const res = await adminService.getAllReports(
        dateFrom,
        dateTo,
        statusFilter
      );

      const allRows = Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      // 1. Tải thư viện và khởi tạo khổ giấy ngang
      const jsPDF = await getJsPDF();
      const doc = new jsPDF('landscape'); 

      // 2. Tạo tiêu đề báo cáo
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(viToAscii("LIBRARY STATISTIC REPORT"), 14, 22); 
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 30);

      // 3. Chuẩn bị dữ liệu
      const tableColumn = [
        '#', 
        'Reader Name', 
        'Email', 
        'Book Title', 
        'Borrow Date', 
        'Due Date', 
        'Return Date', 
        'Status', 
        'Renewals', 
        'Fine (VND)', 
        'Paid', 
        'Handled By'
      ];

      const tableRows = allRows.map(r => [
        r.id,
        viToAscii(r.user_name || ''),
        r.email || '',
        viToAscii(r.book_title || ''),
        fmtDate(r.borrow_date),
        fmtDate(r.due_date),
        fmtDate(r.return_date),
        viToAscii(STATUS_META[r.status]?.label || r.status),
        r.renewed_count || 0,
        r.fine_amount ? fmt(r.fine_amount) : '0',
        r.fine_amount > 0 ? (r.fine_paid ? 'Yes' : 'No') : '-',
        viToAscii(r.handled_by || '-')
      ]);

      // 4. Vẽ bảng
      doc.autoTable({
        startY: 36,
        head: [tableColumn],
        body: tableRows,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: 'bold',
        }
      });

      doc.save(`Report_${dateFrom}_${dateTo}.pdf`);

    } catch (error) {
      console.error("Error when exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  // ── Export Excel ─────────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const res = await adminService.getAllReports(
        dateFrom,
        dateTo,
        statusFilter
      );
      const data = res?.data;
      const rows = Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      const XLSX = await getXLSX();
      if (!XLSX) throw new Error('XLSX not available on window');

      const wb = XLSX.utils.book_new();

      const wsData = [
        ['#', 'Reader Name', 'Email', 'Book Title', 'Borrow Date', 'Due Date', 'Return Date', 'Status', 'Renewals', 'Fine Amount (VND)', 'Fine Paid', 'Handled By'],
        ...rows.map(r => [
          r.id, r.user_name, r.email, r.book_title,
          fmtDate(r.borrow_date), fmtDate(r.due_date), fmtDate(r.return_date),
          STATUS_META[r.status]?.label || r.status,
          r.renewed_count || 0,
          r.fine_amount || 0,
          r.fine_amount > 0 ? (r.fine_paid ? 'Yes' : 'No') : '-',
          r.handled_by || '-',
        ]),
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(wsData);
      ws1['!cols'] = [8,22,30,36,12,12,12,12,10,18,10,18].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws1, 'Borrow Records');

      const catData = [
        ['Category', 'Total Borrowed', 'Returned', 'Overdue', 'Return Rate (%)'],
        ...categoryData.map(c => [c.category, c.borrowed, c.returned, c.overdue, pct(c.returned, c.borrowed)]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(catData);
      ws2['!cols'] = [24,16,12,12,16].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(wb, ws2, 'Category Summary');

      if (summary) {
        const sumData = [
          ['Metric', 'Value'],
          ['Period', `${dateFrom} - ${dateTo}`],
          ['Total Borrows', summary.totalBorrows],
          ['Total Returns', summary.totalReturns],
          ['New Members', summary.totalNewUsers],
          ['Fines Collected (VND)', summary.totalFinesCollected],
          ['Generated At', new Date().toLocaleString('en-GB')],
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(sumData);
        ws3['!cols'] = [24, 24].map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, ws3, 'Summary');
      }

      XLSX.writeFile(wb, `Report_${dateFrom}_${dateTo}.xlsx`);
    } catch (e) {
      console.error('[exportExcel]', e);
      alert(`Export Excel failed: ${e.message}`);
    } finally {
      setExporting(null);
    }
  };

  const filteredCategory = selectedCat === 'All' ? categoryData : categoryData.filter(c => c.category === selectedCat);
  const totalPages = Math.ceil(detailTotal / DETAIL_LIMIT) || 1;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-5">

      {selectedRow && <BorrowDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-slate-900 dark:text-white text-xl font-black">Reports & Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Live data from the library system</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportPDF}
            disabled={!!exporting}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
              exporting === 'pdf'
                ? 'bg-red-500/20 text-red-400 cursor-wait'
                : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
            }`}
          >
            {exporting === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!!exporting}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
              exporting === 'excel'
                ? 'bg-emerald-500/20 text-emerald-400 cursor-wait'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {exporting === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            {exporting === 'excel' ? 'Exporting…' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-slate-400" />
          <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">Report Filters</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
            <span className="text-slate-400 text-sm">to</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
            <option value="">All Statuses</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
            <option value="All">All Categories</option>
            {categoryData.map(c => <option key={c.category} value={c.category}>{c.category}</option>)}
          </select>
          <button onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors">
            <RefreshCw size={13} /> Apply
          </button>
        </div>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Borrows',   value: loadingSummary ? null : fmt(summary?.totalBorrows),            icon: BookOpen,   color: 'text-indigo-400',  bg: 'bg-indigo-500/10'  },
          { label: 'Books Returned',  value: loadingSummary ? null : fmt(summary?.totalReturns),             icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'New Members',     value: loadingSummary ? null : fmt(summary?.totalNewUsers),            icon: Users,      color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
          { label: 'Fines Collected', value: loadingSummary ? null : fmtMoney(summary?.totalFinesCollected), icon: BarChart2,  color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <Icon size={16} className={s.color} />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 dark:text-slate-400 text-[11px] md:text-xs truncate">{s.label}</p>
                {loadingSummary ? <Sk className="h-6 w-16 mt-1" /> : <p className={`text-lg md:text-xl font-semibold tabular-nums ${s.color}`}>{s.value}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bar Chart ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4 md:p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold text-sm md:text-base">Monthly Borrow & Return</h3>
            <p className="text-slate-400 text-xs mt-0.5">Live data from the borrows table</p>
          </div>
          <select value={chartYear} onChange={e => setChartYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none">
            {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {loadingChart ? (
          <div className="flex items-center justify-center h-52"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>
        ) : chartData.every(d => d.borrows === 0 && d.returns === 0) ? (
          <div className="flex flex-col items-center justify-center h-52 text-slate-500">
            <AlertTriangle size={24} className="mb-2 opacity-50" />
            <p className="text-xs">No data available for {chartYear}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={window.innerWidth < 640 ? 2 : 0} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Bar dataKey="borrows"     name="Borrowed"       fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="returns"     name="Returned"       fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="uniqueUsers" name="Unique Members" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Category Performance Table ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold text-sm md:text-base">Category Performance</h3>
            <p className="text-slate-400 text-xs mt-0.5">Borrow statistics grouped by book category</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                {['Category','Total Borrowed','Returned','Overdue','Return Rate','Performance'].map(h => (
                  <th key={h} className="text-left text-[11px] text-slate-400 uppercase tracking-wider px-4 md:px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingCategory ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                    {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-5 py-3.5"><Sk className="h-4 w-16" /></td>)}
                  </tr>
                ))
              ) : filteredCategory.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500 text-sm">No category data available</td></tr>
              ) : (
                filteredCategory.map(row => {
                  const returnRate = pct(row.returned, row.borrowed);
                  const rate = parseFloat(returnRate);
                  return (
                    <tr key={row.category} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 md:px-5 py-3.5"><span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium">{row.category}</span></td>
                      <td className="px-4 md:px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm tabular-nums">{fmt(row.borrowed)}</td>
                      <td className="px-4 md:px-5 py-3.5 text-slate-700 dark:text-slate-200 text-sm tabular-nums">{fmt(row.returned)}</td>
                      <td className="px-4 md:px-5 py-3.5"><span className={`text-sm font-medium tabular-nums ${row.overdue > 20 ? 'text-red-400' : row.overdue > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>{row.overdue}</span></td>
                      <td className="px-4 md:px-5 py-3.5"><span className={`text-sm font-medium tabular-nums ${rate >= 90 ? 'text-emerald-400' : rate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{row.borrowed === 0 ? '—' : `${returnRate}%`}</span></td>
                      <td className="px-4 md:px-5 py-3.5 w-32 md:w-36">
                        {row.borrowed === 0 ? <span className="text-slate-500 text-xs">No borrows yet</span> : (
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700">
                            <div className={`h-1.5 rounded-full transition-all ${rate >= 90 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(rate, 100)}%` }} />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 md:px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <p className="text-xs text-slate-400">Reporting period: <span className="text-slate-600 dark:text-slate-300 font-medium">{dateFrom} — {dateTo}</span></p>
        </div>
      </div>

      {/* ── Borrow Records Detail ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 md:px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold text-sm md:text-base">Borrow Records Detail</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {loadingDetail ? 'Loading…' : detailTotal > 0
                ? `${fmt(detailTotal)} records${statusFilter ? ` · ${STATUS_META[statusFilter]?.label}` : ''}`
                : 'No records found — check console for API response structure'}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {['', 'borrowing', 'overdue', 'returned', 'pending', 'renewed'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); }}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {s === '' ? 'All' : STATUS_META[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                {['#','Reader','Book Title','Borrow Date','Due Date','Return Date','Status','Renew','Fine','Handled By',''].map(h => (
                  <th key={h} className="text-left text-[11px] text-slate-400 uppercase tracking-wider px-3 md:px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingDetail ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800/60">
                    {Array.from({ length: 11 }).map((_, j) => <td key={j} className="px-4 py-3.5"><Sk className="h-4 w-14" /></td>)}
                  </tr>
                ))
              ) : detailRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-14">
                    <AlertTriangle size={22} className="mx-auto mb-2 text-slate-400 opacity-50" />
                    <p className="text-slate-500 text-sm">No borrow records found</p>
                    <p className="text-slate-400 text-xs mt-1">Try adjusting the date range or status filter</p>
                  </td>
                </tr>
              ) : (
                detailRows.map(row => (
                  <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-3 md:px-4 py-3 text-xs text-slate-400 tabular-nums font-mono">#{row.id}</td>
                    <td className="px-3 md:px-4 py-3">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{row.user_name}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{row.email}</p>
                    </td>
                    <td className="px-3 md:px-4 py-3 text-sm text-slate-700 dark:text-slate-200 max-w-[160px] truncate" title={row.book_title}>{row.book_title}</td>
                    <td className="px-3 md:px-4 py-3 text-xs text-slate-500 tabular-nums whitespace-nowrap">{fmtDate(row.borrow_date)}</td>
                    <td className="px-3 md:px-4 py-3 text-xs tabular-nums whitespace-nowrap">
                      <span className={row.status === 'overdue' ? 'text-red-400 font-medium' : 'text-slate-500'}>{fmtDate(row.due_date)}</span>
                    </td>
                    <td className="px-3 md:px-4 py-3 text-xs text-slate-500 tabular-nums whitespace-nowrap">{fmtDate(row.return_date)}</td>
                    <td className="px-3 md:px-4 py-3"><StatusBadge status={row.status} /></td>
                    <td className="px-3 md:px-4 py-3 text-center">
                      {row.renewed_count > 0
                        ? <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-medium">{row.renewed_count}×</span>
                        : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-xs tabular-nums whitespace-nowrap">
                      {row.fine_amount > 0
                        ? <span className={row.fine_paid ? 'text-emerald-400' : 'text-red-400'}>{fmtMoney(row.fine_amount)} <span className="text-[10px]">{row.fine_paid ? '✓' : '!'}</span></span>
                        : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-xs text-slate-500 truncate max-w-[100px]">{row.handled_by || '—'}</td>
                    <td className="px-3 md:px-4 py-3">
                      <button onClick={() => setSelectedRow(row)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[11px]">
                        <Eye size={11} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 md:px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400">Page {detailPage} of {totalPages} · {fmt(detailTotal)} records</p>
          {totalPages > 1 && (
            <div className="flex gap-1 items-center">
              <button disabled={detailPage === 1} onClick={() => fetchDetail(detailPage - 1)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <ChevronLeft size={12} /> Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = detailPage <= 3 ? i + 1 : detailPage >= totalPages - 2 ? totalPages - 4 + i : detailPage - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => fetchDetail(p)}
                    className={`w-7 h-7 rounded-lg text-xs transition ${p === detailPage ? 'bg-indigo-600 text-white' : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'}`}>
                    {p}
                  </button>
                );
              })}
              <button disabled={detailPage === totalPages} onClick={() => fetchDetail(detailPage + 1)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Next <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="px-4 md:px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <p className="text-xs text-slate-400">Reporting period: <span className="text-slate-600 dark:text-slate-300 font-medium">{dateFrom} — {dateTo}</span></p>
        </div>
      </div>
    </div>
  );
}