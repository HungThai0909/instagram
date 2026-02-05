import { useEffect, useMemo, useState } from "react";
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
import { useQueryClient } from "@tanstack/react-query";

interface User {
  _id: string;
  username: string;
  fullName: string;
  profilePicture: string | null;
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

  const [currentUserFollowing, setCurrentUserFollowing] = useState<User[]>([]);

  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUserProfileQuery();

  const { mutate: followUser, isPending: isFollowing } =
    useFollowUserMutation();
  const { mutate: unfollowUser, isPending: isUnfollowing } =
    useUnfollowUserMutation();

  const getMediaUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${axiosInstance.defaults.baseURL}${path}`;
  };

  const fetchCurrentUserFollowing = async () => {
    if (!currentUser) return;

    const res = await axiosInstance.get(
      `/api/follow/${currentUser._id}/following`,
    );

    const following = (res.data.data.following || []).filter(
      (u: any) => u && u._id,
    );

    setCurrentUserFollowing(following);
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      const endpoint =
        type === "followers"
          ? `/api/follow/${userId}/followers`
          : `/api/follow/${userId}/following`;

      const res = await axiosInstance.get(endpoint);

      const list =
        type === "followers"
          ? res.data.data.followers
          : res.data.data.following;

      setUsers((list || []).filter((u: any) => u && u._id));
    } catch {
      toast.error("Không thể tải danh sách");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    fetchCurrentUserFollowing();
    fetchUsers();
  }, [isOpen, userId, type]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const followingMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    currentUserFollowing.forEach((u) => {
      if (u?._id) map[u._id] = true;
    });
    return map;
  }, [currentUserFollowing]);

  const handleToggleFollow = (targetUser: User) => {
    if (!currentUser) return;

    const isFollowed = followingMap[targetUser._id];

    const targetUserKey = ["user", targetUser._id];
    const currentUserKey = ["currentUserProfile"];
    const currentUserProfileKey = ["user", currentUser._id];

    if (isFollowed) {
      unfollowUser(targetUser._id, {
        onSuccess: () => {
          setCurrentUserFollowing((prev) =>
            prev.filter((u) => u._id !== targetUser._id),
          );

          queryClient.setQueryData(targetUserKey, (old: any) =>
            old
              ? {
                  ...old,
                  followersCount: Math.max(0, old.followersCount - 1),
                  isFollowing: false,
                }
              : old,
          );

          queryClient.setQueryData(currentUserKey, (old: any) =>
            old
              ? {
                  ...old,
                  followingCount: Math.max(0, old.followingCount - 1),
                }
              : old,
          );

          queryClient.setQueryData(currentUserProfileKey, (old: any) =>
            old
              ? {
                  ...old,
                  followingCount: Math.max(0, old.followingCount - 1),
                }
              : old,
          );

          toast.success(`Đã bỏ theo dõi ${targetUser.username}`);
        },
        onError: () => toast.error("Không thể bỏ theo dõi"),
      });
    } else {
      followUser(targetUser._id, {
        onSuccess: () => {
          setCurrentUserFollowing((prev) => [...prev, targetUser]);

          queryClient.setQueryData(targetUserKey, (old: any) =>
            old
              ? {
                  ...old,
                  followersCount: old.followersCount + 1,
                  isFollowing: true,
                }
              : old,
          );

          queryClient.setQueryData(currentUserKey, (old: any) =>
            old
              ? {
                  ...old,
                  followingCount: old.followingCount + 1,
                }
              : old,
          );

          queryClient.setQueryData(currentUserProfileKey, (old: any) =>
            old
              ? {
                  ...old,
                  followingCount: old.followingCount + 1,
                }
              : old,
          );

          toast.success(`Đã theo dõi ${targetUser.username}`);
        },
        onError: () => toast.error("Không thể theo dõi"),
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
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-white rounded-full" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Chưa có người nào
            </div>
          ) : (
            users.map((user) => {
              const isFollowed = followingMap[user._id];

              return (
                <div
                  key={user._id}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-white/5"
                >
                  <Link to={`/user/${user._id}`} onClick={onClose}>
                    {user.profilePicture ? (
                      <img
                        src={getMediaUrl(user.profilePicture)}
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
                      className="font-semibold text-sm truncate block"
                    >
                      {user.username}
                    </Link>
                    <p className="text-gray-400 text-xs truncate">
                      {user.fullName}
                    </p>
                  </div>

                  {user._id !== currentUser?._id && (
                    <Button
                      onClick={() => handleToggleFollow(user)}
                      disabled={isFollowing || isUnfollowing}
                      className={`font-semibold text-sm px-4 h-8 rounded-lg cursor-pointer ${
                        isFollowed
                          ? "bg-[#363636] hover:bg-[#262626]"
                          : "bg-[#0095f6] hover:bg-[#1877f2]"
                      }`}
                    >
                      {isFollowed ? "Đang theo dõi" : "Theo dõi"}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
