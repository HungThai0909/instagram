import { Navigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import axiosInstance from "@/services/axios";
import PostCard from "@/components/common/PostCard";
import RightSidebar from "@/components/common/RightSidebar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

export default function HomePage() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  if (!isHydrated) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const limit = 20;

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts", "feed"],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await axiosInstance.get("/api/posts/feed", {
        params: { offset: pageParam, limit },
      });
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      const { offset = 0, limit = 20, hasMore } = lastPage.data || {};
      if (hasMore) return offset + limit;
      return undefined;
    },
  });

  const getMediaUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("//")) return path;
    return `${axiosInstance.defaults.baseURL}${path}`;
  };

  const posts =
    data?.pages.flatMap((page) =>
      (page.data?.posts || []).map((p: any) => ({
        id: p._id,
        user_id: p.userId?._id || null,
        user: p.userId
          ? {
              id: p.userId._id,
              email: "",
              full_name: p.userId.username,
              username: p.userId.username,
              avatar: null,
            }
          : null,
        content: p.caption || "",
        images:
          p.mediaType === "image" && p.image ? [getMediaUrl(p.image)] : [],
        video: p.mediaType === "video" ? getMediaUrl(p.video) : undefined,
        like_count: p.likes ?? 0,
        comment_count: p.comments ?? 0,
        created_at: p.createdAt,
        is_liked: p.isLiked ?? false,
        is_saved: p.isSaved ?? false,
      })),
    ) ?? [];

  return (
    <div className="flex min-h-screen bg-black text-white">
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[630px] py-8 px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Không thể tải bài viết</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                Chưa có bài viết. Hãy theo dõi người khác để xem bài viết!
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {hasNextPage && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    variant="ghost"
                    className="text-blue-500 hover:text-black cursor-pointer"
                  >
                    {isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <RightSidebar />
    </div>
  );
}
