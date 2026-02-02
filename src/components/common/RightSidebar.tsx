import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import axiosInstance from "@/services/axios";
import {
  useFollowUserMutation,
  useUnfollowUserMutation,
  useCurrentUserProfileQuery,
} from "@/hooks/useUserQuery";
import { toast } from "sonner";

export default function RightSidebar() {
  const { mutate: followUser, isPending: followPending } =
    useFollowUserMutation();
  const { mutate: unfollowUser, isPending: unfollowPending } =
    useUnfollowUserMutation();

  const { data: currentUser } = useCurrentUserProfileQuery();

  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["users", "suggested"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/users/suggested", {
        params: { limit: 5 },
      });
      return res.data;
    },
  });

  const suggestions = suggestionsData?.data || [];

  const [localFollowing, setLocalFollowing] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (suggestions.length > 0) {
      const map: Record<string, boolean> = {};
      suggestions.forEach((u: any) => {
        map[u._id] = u.isFollowing ?? false;
      });
      setLocalFollowing(map);
    }
  }, [suggestions]);

  const getMediaUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("//")) return path;
    return `${axiosInstance.defaults.baseURL}${path}`;
  };

  const handleToggleFollow = (userId: string, username: string) => {
    const isFollowing = localFollowing[userId];

    if (isFollowing) {
      unfollowUser(userId, {
        onSuccess: () => {
          toast.success(`Đã bỏ theo dõi ${username}`);
          setLocalFollowing((prev) => ({
            ...prev,
            [userId]: false,
          }));
        },
        onError: () => toast.error("Không thể bỏ theo dõi"),
      });
    } else {
      followUser(userId, {
        onSuccess: () => {
          toast.success(`Đã theo dõi ${username}`);
          setLocalFollowing((prev) => ({
            ...prev,
            [userId]: true,
          }));
        },
        onError: () => toast.error("Không thể theo dõi người dùng"),
      });
    }
  };

  return (
    <div className="hidden xl:block w-[320px] py-8 px-6 h-full overflow-y-auto">
      {currentUser && (
        <div className="flex items-center gap-3 mb-6">
          <Link to={`/user/${currentUser._id}`}>
            {currentUser.profilePicture ? (
              <img
                src={getMediaUrl(currentUser.profilePicture)}
                alt={currentUser.username}
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                <span className="text-black font-semibold">
                  {currentUser.username?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              to={`/user/${currentUser._id}`}
              className="font-semibold text-sm block truncate"
            >
              {currentUser.username}
            </Link>
            <p className="text-gray-400 text-sm truncate">
              {currentUser.fullName}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 font-semibold text-sm">Gợi ý cho bạn</h3>
        <button className="text-xs font-semibold text-white hover:text-gray-300 cursor-pointer">
          Xem tất cả
        </button>
      </div>

      <div className="space-y-3">
        {suggestionsLoading ? (
          <div className="text-center text-sm text-gray-400 py-4">
            Đang tải...
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-4">
            Không có gợi ý
          </div>
        ) : (
          suggestions.map((s: any) => (
            <div key={s._id} className="flex items-center gap-3">
              <Link to={`/user/${s._id}`}>
                {s.profilePicture ? (
                  <img
                    src={getMediaUrl(s.profilePicture)}
                    alt={s.username}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                    <span className="text-black font-semibold uppercase">
                      {s.username[0]}
                    </span>
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  to={`/user/${s._id}`}
                  className="font-semibold text-sm block truncate"
                >
                  {s.username}
                </Link>
                <p className="text-gray-400 text-xs truncate">Gợi ý cho bạn</p>
              </div>

              <button
                onClick={() => handleToggleFollow(s._id, s.username)}
                disabled={followPending || unfollowPending}
                className="text-xs font-semibold cursor-pointer text-blue-500 hover:text-white"
              >
                {localFollowing[s._id] ? "Đang theo dõi" : "Theo dõi"}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-gray-500 mt-8">© 2026 INSTAGRAM FROM F8</div>
    </div>
  );
}
