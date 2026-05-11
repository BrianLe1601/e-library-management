import { LayoutDashboard, BookOpen, Users, RotateCcw, BarChart2 } from 'lucide-react';

export const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/books', icon: BookOpen, label: 'Book Inventory' },
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/admin/borrowing', icon: RotateCcw, label: 'Borrowing & Returns' },
  { to: '/admin/reports', icon: BarChart2, label: 'Reports' },
];
