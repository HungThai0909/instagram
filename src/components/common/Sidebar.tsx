import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  HomeIcon,
  SearchIcon,
  CompassIcon,
  MessageCircleIcon,
  HeartIcon,
  PlusSquareIcon,
  UserIcon,
} from "lucide-react";
import { useState } from "react";
import CreatePostModal from "./CreatePostModal";

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [createPostModal, setCreatePostModal] = useState(false);

  const menuItems = [
    { label: "Trang chủ", icon: HomeIcon, href: "/", action: null },
    { label: "Tìm kiếm", icon: SearchIcon, href: "", action: null },
    { label: "Khám phá", icon: CompassIcon, href: "/explore", action: null },
    { label: "Tin nhắn", icon: MessageCircleIcon, href: "/chat", action: null },
    { label: "Thông báo", icon: HeartIcon, href: "", action: null },
    {
      label: "Tạo",
      icon: PlusSquareIcon,
      href: "",
      action: () => setCreatePostModal(true),
    },
    {
      label: "Trang cá nhân",
      icon: UserIcon,
      href: `/user/${user?.id}`,
      action: null,
    },
  ];

  const isActive = (href: string) => {
    if (!href) return false;
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const handleItemClick = (item: any) => {
    if (item.action) {
      item.action();
    }
  };

  return (
    <>
      <aside className="hidden md:flex w-64 border-r border-gray-700 bg-black flex-col px-6 py-8">
        <Link to="/" className="mb-8">
          <h1 className="text-3xl font-bold text-white font-cursive">
            Instagram
          </h1>
        </Link>

        <nav className="flex-1 space-y-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return item.href ? (
              <Link key={item.label} to={item.href}>
                <div className="flex items-center gap-4 text-xl hover:opacity-80 mb-4 cursor-pointer">
                  <Icon className="w-6 h-6" />
                  <span className={active ? "font-bold" : ""}>
                    {item.label}
                  </span>
                </div>
              </Link>
            ) : (
              <div
                key={item.label}
                onClick={() => handleItemClick(item)}
                className="flex items-center gap-4 text-xl hover:opacity-80 mb-4 cursor-pointer"
              >
                <Icon className="w-6 h-6" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <Button
          onClick={logout}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 mt-4 cursor-pointer"
        >
          Đăng xuất
        </Button>
      </aside>

      <CreatePostModal
        isOpen={createPostModal}
        onClose={() => setCreatePostModal(false)}
      />
    </>
  );
}
