import AdminSidebar from "../components/AdminSidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
     <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1">   
        <Outlet />
      </main>
    </div>
  );
}
