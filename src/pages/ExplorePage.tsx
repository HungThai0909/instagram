import { useState, useEffect, useRef, useCallback } from "react";
import axiosInstance from "@/services/axios";
import CommentModal from "@/components/common/CommentModal";
import { toast } from "sonner";
import type { Post } from "@/types";

export default function ExplorePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const hasFetchedInitialRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const getMediaUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${axiosInstance.defaults.baseURL}${path}`;
  };

  const fetchPosts = useCallback(
    async (currentOffset: number) => {
      if (isLoading) return;
      try {
        setIsLoading(true);
        const res = await axiosInstance.get("/api/posts/explore", {
          params: { offset: currentOffset, limit: 20 },
        });
        const { posts: newPosts, hasMore: more } = res.data.data;

        setPosts((prev) =>
          currentOffset === 0 ? newPosts : [...prev, ...newPosts],
        );
        setHasMore(more);
        setOffset(currentOffset + newPosts.length);
      } catch (error) {
        console.error("Failed to fetch explore posts:", error);
        toast.error("Không thể tải bài viết");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  useEffect(() => {
    if (hasFetchedInitialRef.current) return;

    hasFetchedInitialRef.current = true;
    fetchPosts(0);
  }, [fetchPosts]);

  useEffect(() => {
    if (isLoading || offset === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchPosts(offset);
        }
      },
      { threshold: 0.1 },
    );

    observerRef.current = observer;

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading, hasMore, offset, fetchPosts]);

  const handlePostClick = async (postId: string) => {
    try {
      setIsLoadingPost(true);
      const res = await axiosInstance.get(`/api/posts/${postId}`);
      const fullPost = res.data.data;

      const transformedPost: Post = {
        id: fullPost._id,
        user: {
          id: fullPost.userId._id,
          username: fullPost.userId.username,
          avatar: fullPost.userId.profilePicture
            ? getMediaUrl(fullPost.userId.profilePicture)
            : null,
        },
        content: fullPost.caption || "",
        images: fullPost.image ? [getMediaUrl(fullPost.image)] : [],
        video: fullPost.video ? getMediaUrl(fullPost.video) : null,
        like_count: fullPost.likes || 0,
        comment_count: fullPost.comments || 0,
        is_liked: fullPost.isLiked || false,
        is_saved: fullPost.isSaved || false,
        created_at: fullPost.createdAt,
      };

      setSelectedPost(transformedPost);
      setShowComments(true);
    } catch (error) {
      console.error("Failed to fetch post:", error);
      toast.error("Không thể tải bài viết");
    } finally {
      setIsLoadingPost(false);
    }
  };

  const handleLikePost = async () => {
    if (!selectedPost) return;
    try {
      if (selectedPost.is_liked) {
        await axiosInstance.delete(`/api/posts/${selectedPost.id}/like`);
      } else {
        await axiosInstance.post(`/api/posts/${selectedPost.id}/like`);
      }
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              is_liked: !prev.is_liked,
              like_count: prev.is_liked
                ? prev.like_count - 1
                : prev.like_count + 1,
            }
          : prev,
      );

      setPosts((prev) =>
        prev.map((p) =>
          p._id === selectedPost.id
            ? {
                ...p,
                isLiked: !p.isLiked,
                likes: p.isLiked ? p.likes - 1 : p.likes + 1,
              }
            : p,
        ),
      );
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleSavePost = async () => {
    if (!selectedPost) return;
    try {
      if (selectedPost.is_saved) {
        await axiosInstance.delete(`/api/posts/${selectedPost.id}/save`);
      } else {
        await axiosInstance.post(`/api/posts/${selectedPost.id}/save`);
      }
      setSelectedPost((prev) =>
        prev ? { ...prev, is_saved: !prev.is_saved } : prev,
      );
      setPosts((prev) =>
        prev.map((p) =>
          p._id === selectedPost.id ? { ...p, isSaved: !p.isSaved } : p,
        ),
      );
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-black text-white">
      <div className="grid grid-cols-5 gap-[2px] px-2">
        {posts.map((post) => (
          <div
            key={post._id}
            onClick={() => handlePostClick(post._id)}
            className="relative aspect-square bg-gray-900 group cursor-pointer overflow-hidden"
          >
            {post.mediaType === "video" ? (
              <>
                <video
                  src={getMediaUrl(post.video)}
                  className="w-full h-full object-cover"
                  muted
                />

                <div className="absolute top-2 right-2 z-10">
                  <svg
                    className="w-5 h-5 text-white drop-shadow-lg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5.888 22.5a3.46 3.46 0 0 1-1.721-.46l-.003-.002a3.451 3.451 0 0 1-1.72-2.982V4.943a3.445 3.445 0 0 1 5.163-2.987l12.226 7.059a3.444 3.444 0 0 1-.001 5.967l-12.22 7.056a3.462 3.462 0 0 1-1.724.462Z" />
                  </svg>
                </div>
              </>
            ) : (
              <img
                src={getMediaUrl(post.image)}
                alt={post.caption}
                className="w-full h-full object-cover"
              />
            )}

            {post.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 z-10">
                <p className="text-white text-xs truncate">{post.caption}</p>
                <p className="text-gray-300 text-xs">@{post.userId.username}</p>
              </div>
            )}

            {post.mediaType === "image" && (
              <div className="absolute top-2 right-2 z-10">
                <svg
                  className="w-5 h-5 text-white drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 12l3 3.71L14 11l5 6H5l2-5z" />
                </svg>
              </div>
            )}

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 z-20">
              <div className="flex items-center gap-2 text-white font-semibold">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 48 48">
                  <path d="M34.6 6.1c5.7 0 10.4 5.2 10.4 11.5 0 6.8-5.9 11-11.5 16S25 41.3 24 41.9c-1.1-.7-4.7-4-9.5-8.3-5.7-5-11.5-9.2-11.5-16C3 11.3 7.7 6.1 13.4 6.1c4.2 0 6.5 2 8.1 4.3 1.9 2.6 2.2 3.9 2.5 3.9.3 0 .6-1.3 2.5-3.9 1.6-2.3 3.9-4.3 8.1-4.3m0-3c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5.6 0 1.1-.2 1.6-.5 1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z" />
                </svg>
                <span>{post.likes}</span>
              </div>
              <div className="flex items-center gap-2 text-white font-semibold">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 48 48">
                  <path
                    clipRule="evenodd"
                    d="M47.5 46.1l-2.8-11c1.8-3.3 2.8-7.1 2.8-11.1C47.5 11 37 .5 24 .5S.5 11 .5 24 11 47.5 24 47.5c4 0 7.8-1 11.1-2.8l11 2.8c.8.2 1.6-.6 1.4-1.4zm-3-22.1c0 4-1 7-2.6 10-.2.4-.3.9-.2 1.4l2.1 8.4-8.3-2.1c-.5-.1-1-.1-1.4.2-1.8 1-5.2 2.6-10 2.6-11.4 0-20.6-9.2-20.6-20.5S12.7 3.5 24 3.5 44.5 12.7 44.5 24z"
                    fillRule="evenodd"
                  />
                </svg>
                <span>{post.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {isLoading && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        )}
      </div>

      {selectedPost && (
        <CommentModal
          post={selectedPost}
          isOpen={showComments}
          onClose={() => {
            setShowComments(false);
            setSelectedPost(null);
          }}
          onLike={handleLikePost}
          onSave={handleSavePost}
        />
      )}
    </div>
  );
}
