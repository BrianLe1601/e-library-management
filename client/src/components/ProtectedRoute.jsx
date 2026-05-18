import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Khi đang đợi xác nhận Token từ Backend, hiện màn hình chờ để tránh giao diện giật lag
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070d1b]">
        <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Trường hợp 1: Chưa đăng nhập hệ thống -> Đẩy về login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Trường hợp 2: Đã đăng nhập nhưng quyền không khớp với danh sách được phép truy cập
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Quyền hạn hợp lệ hoàn toàn -> Cho phép render Layout con bên trong
  return <Outlet />;
}