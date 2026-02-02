import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Post } from "@/types";
import {
  useLikePostMutation,
  useUnlikePostMutation,
  useSavePostMutation,
  useUnsavePostMutation,
} from "@/hooks/usePostsQuery";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import CommentModal from "./CommentModal";
import OptionsModal from "./OptionsModal";
import EditPostModal from "./EditPostModal";
import { useQueryClient } from "@tanstack/react-query";

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user: currentUser } = useAuthStore();
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [editPostModal, setEditPostModal] = useState(false);
  const queryClient = useQueryClient();
  const { mutate: likePost } = useLikePostMutation();
  const { mutate: unlikePost } = useUnlikePostMutation();
  const { mutate: savePost } = useSavePostMutation();
  const { mutate: unsavePost } = useUnsavePostMutation();

  const isOwnPost = currentUser?.id === post.user?.id;

  const handleLike = () => {
    if (post.is_liked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };

  const handleSave = () => {
    if (post.is_saved) {
      unsavePost(post.id);
    } else {
      savePost(post.id);
    }
  };

  const handleEdit = () => {
    setShowOptions(false);
    setEditPostModal(true);
  };

  const handleEditPostSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const handleReport = () => {
    toast.info("Chức năng báo cáo đang được phát triển");
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: vi,
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      <article className="bg-black text-white mb-6">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to={`/user/${post.user?.id}`}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full p-[2px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center bg-white">
                  {post.user?.avatar ? (
                    <img
                      src={post.user.avatar}
                      alt={post.user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-black text-xs font-semibold uppercase">
                      {post.user?.username?.[0] || "U"}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-sm">{post.user?.username}</p>
              </div>
            </Link>
            <p className="text-xs text-gray-400">
              {formatTime(post.created_at)}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => setShowOptions(true)}
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {post.images && post.images.length > 0 && (
          <div className="relative w-full aspect-square bg-black">
            <img
              src={post.images[0]}
              alt="Post"
              className="w-full h-full object-cover rounded-sm"
            />
          </div>
        )}

        {post.video && (
          <div className="relative w-full aspect-square bg-black">
            <video
              src={post.video}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover rounded-sm pointer-events-none"
            />
          </div>
        )}

        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className="flex items-center gap-2 hover:opacity-70 transition cursor-pointer"
              >
                <Heart
                  className={`w-7 h-7 ${post.is_liked ? "fill-red-500 text-red-500" : ""}`}
                />
                <span className="text-sm font-normal">{post.like_count}</span>
              </button>

              <button
                onClick={() => setShowComments(true)}
                className="flex items-center gap-2 hover:opacity-70 transition cursor-pointer"
              >
                <MessageCircle className="w-7 h-7" />
                <span className="text-sm font-normal">
                  {post.comment_count}
                </span>
              </button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0 hover:bg-transparent hover:opacity-70 cursor-pointer"
              >
                <Send className="w-7 h-7" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              className="h-8 w-8 p-0 hover:bg-transparent hover:opacity-70 cursor-pointer"
            >
              <Bookmark
                className={`w-6 h-6 ${post.is_saved ? "fill-white" : ""}`}
              />
            </Button>
          </div>

          {post.content && (
            <p className="text-sm mt-2">
              <Link
                to={`/user/${post.user?.id}`}
                className="font-semibold mr-2 hover:opacity-70"
              >
                {post.user?.username}
              </Link>
              <span>{post.content}</span>
            </p>
          )}
        </div>
      </article>

      <CommentModal
        post={post}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        onLike={handleLike}
        onSave={handleSave}
        onOpenPostOptions={() => setShowOptions(true)}
      />

      <OptionsModal
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        isOwn={isOwnPost}
        type="post"
        onEdit={isOwnPost ? handleEdit : undefined}
        onDelete={() => onDelete?.(post.id)}
        onReport={!isOwnPost ? handleReport : undefined}
      />

      <EditPostModal
        isOpen={editPostModal}
        onClose={() => setEditPostModal(false)}
        postId={post.id}
        initialCaption={post.content || ""}
        onSuccess={handleEditPostSuccess}
      />
    </>
  );
}
