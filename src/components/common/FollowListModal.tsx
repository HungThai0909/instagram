import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import axiosInstance from "@/services/axios";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useCurrentUserProfileQuery,
} from "@/hooks/useUserQuery";
import { toast } from "sonner";

interface User {
  _id: string;
  username: string;
  fullName: string;
  profilePicture: string | null;
  bio: string;
  isFollowing?: boolean;
}

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
  isOwnProfile?: boolean;
}

export default function FollowListModal({
  isOpen,
  onClose,
  userId,
  type,
  isOwnProfile = false,
}: FollowListModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingState, setFollowingState] = useState<Record<string, boolean>>(
    {},
  );

  const { data: currentUser } = useCurrentUserProfileQuery();

  const { mutate: followUser, isPending: isFollowing } =
    useFollowUserMutation();
  const { mutate: unfollowUser, isPending: isUnfollowing } =
    useUnfollowUserMutation();

  const getMediaUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("//")) return path;
    return `${axiosInstance.defaults.baseURL}${path}`;
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const endpoint =
        type === "followers"
          ? `/api/follow/${userId}/followers`
          : `/api/follow/${userId}/following`;

      const res = await axiosInstance.get(endpoint);
      const userList =
        type === "followers"
          ? res.data.data.followers
          : res.data.data.following;

      setUsers(userList);

      setFollowingState((prev) => {
        const state: Record<string, boolean> = {};

        userList.forEach((u: User) => {
          state[u._id] =
            prev[u._id] ??
            (type === "following" && isOwnProfile
              ? true
              : (u.isFollowing ?? false));
        });

        return state;
      });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Không thể tải danh sách");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, userId, type]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleToggleFollow = (targetUserId: string, username: string) => {
    const isCurrentlyFollowing = followingState[targetUserId];

    if (isCurrentlyFollowing) {
      unfollowUser(targetUserId, {
        onSuccess: () => {
          if (type === "following" && isOwnProfile) {
            setUsers((prev) => prev.filter((u) => u._id !== targetUserId));
          } else {
            setFollowingState((prev) => ({
              ...prev,
              [targetUserId]: false,
            }));
          }
          toast.success(`Đã bỏ theo dõi ${username}`);
        },
        onError: () => {
          toast.error("Không thể bỏ theo dõi");
        },
      });
    } else {
      followUser(targetUserId, {
        onSuccess: () => {
          setFollowingState((prev) => ({
            ...prev,
            [targetUserId]: true,
          }));
          toast.success(`Đã theo dõi ${username}`);
        },
        onError: () => {
          toast.error("Không thể theo dõi");
        },
      });
    }
  };

  if (!isOpen) return null;

  const title = type === "followers" ? "Người theo dõi" : "Đang theo dõi";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-[#262626] rounded-xl w-full max-w-[400px] max-h-[400px] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-base font-semibold flex-1 text-center">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Chưa có người nào
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-white/5"
              >
                <Link to={`/user/${user._id}`} onClick={onClose}>
                  {user.profilePicture ? (
                    <img
                      src={getMediaUrl(user.profilePicture)}
                      alt={user.username}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                      <span className="text-black font-semibold uppercase">
                        {user.username[0]}
                      </span>
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/user/${user._id}`}
                    onClick={onClose}
                    className="font-semibold text-sm block truncate hover:opacity-70"
                  >
                    {user.username}
                  </Link>
                  <p className="text-gray-400 text-xs truncate">
                    {user.fullName}
                  </p>
                </div>
                {user._id !== currentUser?._id && (
                  <Button
                    onClick={() => handleToggleFollow(user._id, user.username)}
                    disabled={isFollowing || isUnfollowing}
                    className={`font-semibold text-sm px-4 h-8 rounded-lg cursor-pointer disabled:opacity-50 ${
                      followingState[user._id]
                        ? "bg-[#363636] hover:bg-[#262626] text-white"
                        : "bg-[#0095f6] hover:bg-[#1877f2] text-white"
                    }`}
                  >
                    {followingState[user._id] ? "Đang theo dõi" : "Theo dõi"}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
