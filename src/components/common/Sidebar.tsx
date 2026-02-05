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
  MenuIcon,
} from "lucide-react";
import { useState } from "react";
import CreatePostModal from "./CreatePostModal";
import { useCurrentUserProfileQuery } from "@/hooks/useUserQuery";

interface SidebarProps {
  searchOpen: boolean;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  onNotificationOpen: () => void;
}

export default function Sidebar({
  searchOpen,
  onSearchOpen,
  onSearchClose,
  onNotificationOpen,
}: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { data: currentUser } = useCurrentUserProfileQuery();
  const [createPostModal, setCreatePostModal] = useState(false);

  const [activePanel, setActivePanel] = useState<
    "search" | "notification" | null
  >(null);

  const menuItems = [
    { label: "Trang chủ", icon: HomeIcon, href: "/", action: null, id: "home" },
    {
      label: "Tìm kiếm",
      icon: SearchIcon,
      href: "",
      action: () => onSearchOpen(),
      id: "search",
    },
    {
      label: "Khám phá",
      icon: CompassIcon,
      href: "/explore",
      action: null,
      id: "explore",
    },
    {
      label: "Tin nhắn",
      icon: MessageCircleIcon,
      href: "/chat",
      action: null,
      id: "chat",
    },
    {
      label: "Thông báo",
      icon: HeartIcon,
      href: "",
      action: () => onNotificationOpen(),
      id: "notification",
    },
    {
      label: "Tạo",
      icon: PlusSquareIcon,
      href: "",
      action: () => setCreatePostModal(true),
      id: "create",
    },
    {
      label: "Trang cá nhân",
      icon: UserIcon,
      href: currentUser ? `/user/${currentUser._id}` : "",
      action: null,
      id: "profile",
    },
  ];

  const isActive = (href: string) => {
    if (!href) return false;
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <aside
        className={`hidden md:flex border-r border-gray-700 bg-black flex-col py-8 transition-all duration-300 flex-shrink-0 ${
          searchOpen ? "w-20 px-4 items-center" : "w-64 px-6"
        }`}
      >
        <div className="mb-8 h-9 flex items-center">
          {searchOpen ? (
            <button
              onClick={onSearchClose}
              className="text-white hover:opacity-70 cursor-pointer"
            >
              <MenuIcon className="w-7 h-7" />
            </button>
          ) : (
            <Link to="/" onClick={onSearchClose}>
              <h1 className="text-3xl font-bold text-white font-cursive">
                Instagram
              </h1>
            </Link>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isPanelItem =
              item.id === "search" || item.id === "notification";

            const content = (
              <div
                className={`flex items-center hover:opacity-80 cursor-pointer ${
                  searchOpen ? "justify-center" : "gap-4"
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                {!searchOpen && (
                  <span className={active ? "font-bold" : ""}>
                    {item.label}
                  </span>
                )}
              </div>
            );

            if (item.href) {
              return (
                <Link key={item.label} to={item.href} onClick={onSearchClose}>
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={item.label}
                onClick={() => {
                  if (isPanelItem && searchOpen) {
                    if (item.action) item.action();
                  } else if (item.action) {
                    item.action();
                  }
                }}
              >
                {content}
              </div>
            );
          })}
        </nav>

        {!searchOpen && (
          <Button
            onClick={logout}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 mt-4 cursor-pointer"
          >
            Đăng xuất
          </Button>
        )}
      </aside>

      <CreatePostModal
        isOpen={createPostModal}
        onClose={() => setCreatePostModal(false)}
      />
    </>
  );
}
