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

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { label: "Trang chủ", icon: HomeIcon, href: "/" },
    { label: "Tìm kiếm", icon: SearchIcon, href: "" },
    { label: "Khám phá", icon: CompassIcon, href: "/explore" },
    { label: "Tin nhắn", icon: MessageCircleIcon, href: "/chat" },
    { label: "Thông báo", icon: HeartIcon, href: "" },
    { label: "Tạo", icon: PlusSquareIcon, href: "/create-post" },
    { label: "Trang cá nhân", icon: UserIcon, href: `/user/${user?.id}` },
  ];

  const isActive = (href: string) => href && location.pathname.startsWith(href);

  return (
    <aside className="hidden md:flex w-64 border-r border-gray-700 bg-black flex-col px-6 py-8">
      <Link to="/" className="mb-8">
        <h1 className="text-3xl font-bold text-white font-cursive">
          Instagram
        </h1>
      </Link>

      <nav className="flex-1 space-y-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.href}>
              <div className="flex items-center gap-4 text-xl hover:opacity-80 mb-4">
                <Icon className="w-6 h-6" />
                <span className={isActive(item.href) ? "font-bold" : ""}>
                  {item.label}
                </span>
              </div>
            </Link>
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
  );
}
