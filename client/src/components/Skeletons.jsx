// src/components/Skeletons.jsx
import React from "react";
import { Skeleton } from "./ui/skeleton"; // Đường dẫn tới file skeleton.tsx gốc

/* ========================================================================
   1. DÀNH CHO TRANG HIỂN THỊ SÁCH (Client: HomePage, BooksPage, SavedBooks)
   ======================================================================== */

// Khung xương cho 1 thẻ sách (Dạng Lưới/Grid)
export default function BookCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/60 p-3 flex flex-col w-full h-full">
      <Skeleton className="w-full aspect-[3/4] rounded-xl" />
      <div className="mt-3 space-y-2 flex-1 flex flex-col">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-3 w-2/3" />
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-700/40 flex justify-between items-center">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// Khung xương cho trang Chi tiết sách (BookDetail)
export function BookDetailSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-8 animate-pulse p-4 sm:p-0">
      <Skeleton className="w-full md:w-72 shrink-0 aspect-[3/4] rounded-2xl" />
      <div className="flex-1 space-y-4 py-2">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-1/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="space-y-3 pt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex gap-4 pt-6">
          <Skeleton className="h-12 w-36 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Khung xương cho Danh mục ở Trang chủ (Categories)
export function CategoryItemSkeleton() {
  return (
    <div className="h-16 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5">
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-2.5 w-1/2" />
    </div>
  );
}


/* ========================================================================
   2. DÀNH CHO ADMIN & DỮ LIỆU BẢNG (Admin: Inventory, Users, Borrows, Reports)
   ======================================================================== */

// Khung xương cho 1 hàng trong Table
export function TableRowSkeleton({ columns = 5 }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/50">
      {/* Cột đầu: Thường là ảnh, ID hoặc Icon */}
      <td className="px-6 py-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
      </td>
      {/* Các cột ở giữa */}
      {Array.from({ length: columns - 2 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 rounded" style={{ width: i % 2 === 0 ? "70%" : "45%" }} />
        </td>
      ))}
      {/* Cột cuối: Các nút thao tác (Actions) */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2 w-full">
          <Skeleton className="h-8 w-14 rounded-lg" />
          <Skeleton className="h-8 w-14 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}


/* ========================================================================
   3. DÀNH CHO DANH SÁCH & THỐNG KÊ (List & Stats)
   ======================================================================== */

// Khung xương cho Thẻ thống kê (Dashboard Admin / Home Stats)
export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between">
      <div className="space-y-3 w-full">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
      </div>
      <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
    </div>
  );
}

// Khung xương cho Thông báo (Notifications - Client & Admin)
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2 mt-1">
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-20 mt-2" />
      </div>
    </div>
  );
}

// Khung xương cho Lịch sử mượn sách (DashboardTab / BorrowedTab của User)
export function BorrowHistorySkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
      <Skeleton className="w-12 h-16 rounded-lg shrink-0" /> {/* Ảnh sách nhỏ */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-7 w-20 rounded-lg shrink-0" /> {/* Status badge */}
    </div>
  );
}