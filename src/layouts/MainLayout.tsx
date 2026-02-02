import { Outlet } from "react-router-dom";
import Sidebar from "@/components/common/Sidebar";

export function MainLayout() {
  return (
    <div className="flex h-screen bg-black text-white min-w-[1280px]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto border-l border-r border-gray-700">
        <Outlet />
      </main>
    </div>
  );
}
