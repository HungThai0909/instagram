import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "@/components/common/Sidebar";
import SearchPanel from "@/components/common/SearchPanel";
import NotificationPanel from "@/components/common/NotificationPanel";

export function MainLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleSearchOpen = () => {
    setNotificationOpen(false);
    setSearchOpen(true);
  };
  const handleNotificationOpen = () => {
    setSearchOpen(false);
    setNotificationOpen(true);
  };

  const sidebarCollapsed = searchOpen || notificationOpen;

  return (
    <div className="flex h-screen bg-black text-white min-w-[1280px]">
      <Sidebar
        searchOpen={sidebarCollapsed}
        onSearchOpen={handleSearchOpen}
        onSearchClose={() => {
          setSearchOpen(false);
          setNotificationOpen(false);
        }}
        onNotificationOpen={handleNotificationOpen}
      />

      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}

      {notificationOpen && (
        <NotificationPanel onClose={() => setNotificationOpen(false)} />
      )}

      <main className="flex-1 overflow-y-auto border-l border-r border-gray-700">
        <Outlet />
      </main>
    </div>
  );
}
