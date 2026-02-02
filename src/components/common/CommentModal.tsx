import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  X,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosInstance from "@/services/axios";
import type { Reply, CommentData, CommentModalProps } from "../../types";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import OptionsModal from "./OptionsModal";
import EditCommentModal from "./EditCommentModal";

export default function CommentModal({
  post,
  isOpen,
  onClose,
  onLike,
  onSave,
}: CommentModalProps) {
  const { user: currentUser } = useAuthStore();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>(
    {},
  );
  const [likeCommentId, setLikeCommentId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    username: string;
  } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [commentOptionsModal, setCommentOptionsModal] = useState<{
    commentId: string;
    isOwn: boolean;
  } | null>(null);
  const [postOptionsModal, setPostOptionsModal] = useState(false);
  const [editingComment, setEditingComment] = useState<{
    commentId: string;
    content: string;
  } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const getMediaUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("//")) return path;
    return `${axiosInstance.defaults.baseURL}${path}`;
  };

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(`/api/posts/${post.id}/comments`, {
        params: { limit: 20 },
      });
      const commentsData = (res.data?.data?.comments || []).map(
        (comment: any) => ({
          ...comment,
          repliesCount: comment.replies?.length,
        }),
      );
      setComments(commentsData);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPost = async () => {
    try {
      await axiosInstance.get(`/api/posts/${post.id}`);
    } catch (error) {
      console.error("Failed to fetch post:", error);
    }
  };

  const fetchReplies = async (commentId: string) => {
    try {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
      const res = await axiosInstance.get(
        `/api/posts/${post.id}/comments/${commentId}/replies`,
        { params: { limit: 5, offset: 0 } },
      );
      const repliesData = res.data?.data?.replies || [];
      setReplies((prev) => ({
        ...prev,
        [commentId]: repliesData,
      }));
      setShowReplies((prev) => ({ ...prev, [commentId]: true }));
    } catch (error) {
      console.error("Failed to fetch replies:", error);
      toast.error("Không thể tải câu trả lời");
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const toggleReplies = (commentId: string) => {
    if (showReplies[commentId]) {
      setShowReplies((prev) => ({ ...prev, [commentId]: false }));
    } else {
      if (!replies[commentId]) {
        fetchReplies(commentId);
      } else {
        setShowReplies((prev) => ({ ...prev, [commentId]: true }));
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPost();
      fetchComments();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setReplyingTo(null);
      setReplyText("");
      setCommentText("");
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, post.id]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingComment) {
          setEditingComment(null);
        } else if (commentOptionsModal) {
          setCommentOptionsModal(null);
        } else if (postOptionsModal) {
          setPostOptionsModal(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, commentOptionsModal, postOptionsModal, editingComment]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await axiosInstance.post(`/api/posts/${post.id}/comments`, {
        content: commentText,
      });
      setCommentText("");
      await fetchComments();
      toast.success("Đã đăng bình luận");
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Không thể đăng bình luận");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      setLikeCommentId(commentId);
      const comment = comments.find((c) => c._id === commentId);
      if (!comment) return;

      await axiosInstance.post(
        `/api/posts/${post.id}/comments/${commentId}/like`,
      );

      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? {
                ...c,
                isLiked: !c.isLiked,
                likes: c.isLiked ? Math.max(0, c.likes - 1) : c.likes + 1,
              }
            : c,
        ),
      );
    } catch (error) {
      console.error("Failed to like comment:", error);
      toast.error("Không thể thích bình luận");
    } finally {
      setLikeCommentId(null);
    }
  };

  const handleLikeReply = async (commentId: string, replyId: string) => {
    try {
      setLikeCommentId(`reply-${replyId}`);
      await axiosInstance.post(
        `/api/posts/${post.id}/comments/${commentId}/replies/${replyId}/like`,
      );

      setReplies((prev) => ({
        ...prev,
        [commentId]: prev[commentId].map((r) =>
          r._id === replyId
            ? {
                ...r,
                isLiked: !r.isLiked,
                likes: r.isLiked ? Math.max(0, r.likes - 1) : r.likes + 1,
              }
            : r,
        ),
      }));
    } catch (error) {
      console.error("Failed to like reply:", error);
      toast.error("Không thể thích câu trả lời");
    } finally {
      setLikeCommentId(null);
    }
  };

  const handleReplyClick = (commentId: string, username: string) => {
    setReplyingTo({ commentId, username });
    setReplyText("");
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo || isSubmittingReply) return;

    try {
      setIsSubmittingReply(true);
      await axiosInstance.post(
        `/api/posts/${post.id}/comments/${replyingTo.commentId}/replies`,
        { content: replyText },
      );

      await fetchReplies(replyingTo.commentId);

      setComments((prev) =>
        prev.map((c) =>
          c._id === replyingTo.commentId
            ? { ...c, repliesCount: (c.repliesCount || 0) + 1 }
            : c,
        ),
      );

      setReplyText("");
      setReplyingTo(null);
      toast.success("Đã đăng câu trả lời");
    } catch (error) {
      console.error("Failed to submit reply:", error);
      toast.error("Không thể đăng trả lời");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await axiosInstance.delete(`/api/posts/${post.id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentOptionsModal(null);
      toast.success("Đã xóa bình luận");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Không thể xóa bình luận");
    }
  };

  const handleDeletePost = async () => {
    try {
      await axiosInstance.delete(`/api/posts/${post.id}`);
      setPostOptionsModal(false);
      onClose();
      toast.success("Đã xóa bài viết");
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Không thể xóa bài viết");
    }
  };

  const handleOpenCommentOptions = (commentId: string, isOwn: boolean) => {
    setCommentOptionsModal({ commentId, isOwn });
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingComment({ commentId, content });
    setCommentOptionsModal(null);
  };

  const handleSaveEditComment = async (newContent: string) => {
    if (!editingComment) return;

    try {
      setIsSavingEdit(true);
      await axiosInstance.patch(
        `/api/posts/${post.id}/comments/${editingComment.commentId}`,
        { content: newContent },
      );

      setComments((prev) =>
        prev.map((c) =>
          c._id === editingComment.commentId
            ? { ...c, content: newContent }
            : c,
        ),
      );

      setEditingComment(null);
      toast.success("Đã cập nhật bình luận");
    } catch (error) {
      console.error("Failed to update comment:", error);
      toast.error("Không thể cập nhật bình luận");
    } finally {
      setIsSavingEdit(false);
    }
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

  if (!isOpen) return null;

  const isOwnPost = currentUser?.id === post.user?.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:opacity-70 z-10 cursor-pointer"
      >
        <X className="w-8 h-8" />
      </button>

      <div
        ref={modalRef}
        className="relative w-full max-w-5xl h-[90vh] bg-black flex rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 bg-black flex items-center justify-center">
          {post.images && post.images.length > 0 ? (
            <img
              src={post.images[0]}
              alt="Post"
              className="max-w-full max-h-full object-contain"
            />
          ) : post.video ? (
            <video
              src={post.video}
              controls
              autoPlay
              className="max-w-full max-h-full"
            />
          ) : (
            <div className="text-gray-500">Không có media</div>
          )}
        </div>
        <div className="w-[400px] bg-black border-l border-gray-800 flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-gray-800">
            <Link to={`/user/${post.user?.id}`}>
              <div className="w-8 h-8 rounded-full p-[2px]">
                <div className="w-full h-full rounded-full flex items-center justify-center bg-white">
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
            </Link>
            <div className="flex-1">
              <Link
                to={`/user/${post.user?.id}`}
                className="font-semibold text-sm hover:opacity-70"
              >
                {post.user?.username}
              </Link>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => setPostOptionsModal(true)}
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8">Đang tải...</div>
            ) : comments.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Chưa có bình luận nào
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment._id}>
                  <div
                    className="group"
                    onMouseEnter={() => setHoveredCommentId(comment._id)}
                    onMouseLeave={() => setHoveredCommentId(null)}
                  >
                    <div className="flex gap-3">
                      <Link to={`/user/${post.user?.id}`}>
                        {comment.userId.profilePicture ? (
                          <img
                            src={getMediaUrl(comment.userId.profilePicture)}
                            alt={comment.userId.username}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                            <span className="text-black text-xs font-semibold uppercase">
                              {comment.userId.username[0]}
                            </span>
                          </div>
                        )}
                      </Link>
                      <div className="flex-1">
                        <p className="text-sm">
                          <Link
                            to={`/user/${post.user?.id}`}
                            className="font-semibold mr-2 hover:opacity-70"
                          >
                            {comment.userId.username}
                          </Link>
                          <span>{comment.content}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{formatTime(comment.createdAt)}</span>
                          {comment.likes > 0 && (
                            <span className="font-semibold">
                              {comment.likes} lượt thích
                            </span>
                          )}
                          <button
                            onClick={() =>
                              handleReplyClick(
                                comment._id,
                                comment.userId.username,
                              )
                            }
                            className="hover:text-gray-400 font-semibold cursor-pointer"
                          >
                            Trả lời
                          </button>
                          <button
                            onClick={() =>
                              handleOpenCommentOptions(
                                comment._id,
                                comment.userId._id === currentUser?.id,
                              )
                            }
                            className={`text-gray-500 hover:text-white cursor-pointer transition-opacity ${
                              hoveredCommentId === comment._id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-start gap-1">
                        <button
                          onClick={() => handleLikeComment(comment._id)}
                          disabled={likeCommentId === comment._id}
                          className="text-xs hover:opacity-70 cursor-pointer disabled:opacity-50"
                        >
                          <Heart
                            className={`w-3 h-3 ${
                              comment.isLiked
                                ? "fill-red-500 text-red-500"
                                : "text-gray-500"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {typeof comment.repliesCount === "number" &&
                    comment.repliesCount > 0 && (
                      <div className="ml-11 mt-3">
                        <button
                          onClick={() => toggleReplies(comment._id)}
                          disabled={loadingReplies[comment._id]}
                          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-400 font-semibold cursor-pointer"
                        >
                          <div className="w-6 h-px bg-gray-600"></div>
                          {loadingReplies[comment._id]
                            ? "Đang tải..."
                            : showReplies[comment._id]
                              ? "Ẩn câu trả lời"
                              : `Xem câu trả lời (${comment.repliesCount})`}
                        </button>
                      </div>
                    )}

                  {showReplies[comment._id] && replies[comment._id] && (
                    <div className="ml-11 mt-3 space-y-3">
                      {replies[comment._id].map((reply) => (
                        <div
                          key={reply._id}
                          className="group"
                          onMouseEnter={() =>
                            setHoveredCommentId(`reply-${reply._id}`)
                          }
                          onMouseLeave={() => setHoveredCommentId(null)}
                        >
                          <div className="flex gap-3">
                            <Link to={`/user/${post.user?.id}`}>
                              {reply.userId.profilePicture ? (
                                <img
                                  src={getMediaUrl(reply.userId.profilePicture)}
                                  alt={reply.userId.username}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                                  <span className="text-black text-xs font-semibold uppercase">
                                    {reply.userId.username[0]}
                                  </span>
                                </div>
                              )}
                            </Link>
                            <div className="flex-1">
                              <p className="text-sm">
                                <Link
                                  to={`/user/${post.user?.id}`}
                                  className="font-semibold mr-2 hover:opacity-70"
                                >
                                  {reply.userId.username}
                                </Link>
                                <span>{reply.content}</span>
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span>{formatTime(reply.createdAt)}</span>
                                {reply.likes > 0 && (
                                  <span className="font-semibold">
                                    {reply.likes} lượt thích
                                  </span>
                                )}
                                <button
                                  onClick={() =>
                                    handleReplyClick(
                                      comment._id,
                                      reply.userId.username,
                                    )
                                  }
                                  className="hover:text-gray-400 font-semibold cursor-pointer"
                                >
                                  Trả lời
                                </button>
                                <button
                                  onClick={() =>
                                    handleOpenCommentOptions(
                                      reply._id,
                                      reply.userId._id === currentUser?.id,
                                    )
                                  }
                                  className={`text-gray-500 hover:text-white cursor-pointer transition-opacity ${
                                    hoveredCommentId === `reply-${reply._id}`
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-start gap-1">
                              <button
                                onClick={() =>
                                  handleLikeReply(comment._id, reply._id)
                                }
                                disabled={
                                  likeCommentId === `reply-${reply._id}`
                                }
                                className="text-xs hover:opacity-70 cursor-pointer disabled:opacity-50"
                              >
                                <Heart
                                  className={`w-3 h-3 ${
                                    reply.isLiked
                                      ? "fill-red-500 text-red-500"
                                      : "text-gray-500"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={onLike}
                  className="hover:opacity-70 cursor-pointer"
                >
                  <Heart
                    className={`w-7 h-7 ${post.is_liked ? "fill-red-500 text-red-500" : ""}`}
                  />
                </button>
                <button className="hover:opacity-70 cursor-pointer">
                  <MessageCircle className="w-7 h-7" />
                </button>
                <button className="hover:opacity-70 cursor-pointer">
                  <Send className="w-7 h-7" />
                </button>
              </div>
              <button
                onClick={onSave}
                className="hover:opacity-70 cursor-pointer"
              >
                <Bookmark
                  className={`w-6 h-6 ${post.is_saved ? "fill-white" : ""}`}
                />
              </button>
            </div>

            {post.like_count > 0 && (
              <p className="font-semibold text-sm mb-2">
                {post.like_count} lượt thích
              </p>
            )}

            <p className="text-xs text-gray-500 mb-3">
              {formatTime(post.created_at)}
            </p>

            <form
              onSubmit={replyingTo ? handleSubmitReply : handleSubmitComment}
              className="flex flex-col gap-2 border-t border-gray-800 pt-3"
            >
              {replyingTo && (
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm whitespace-nowrap">
                    @{replyingTo.username}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText("");
                    }}
                    className="text-gray-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Input
                  value={replyingTo ? replyText : commentText}
                  onChange={(e) =>
                    replyingTo
                      ? setReplyText(e.target.value)
                      : setCommentText(e.target.value)
                  }
                  placeholder="Bình luận..."
                  className="flex-1 bg-transparent border-none text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500 px-0"
                  disabled={replyingTo ? isSubmittingReply : isSubmitting}
                />
                <Button
                  type="submit"
                  variant="link"
                  className="text-blue-500 hover:text-white font-semibold text-sm p-0 h-auto disabled:opacity-50 cursor-pointer hover:no-underline"
                  disabled={
                    replyingTo
                      ? !replyText.trim() || isSubmittingReply
                      : !commentText.trim() || isSubmitting
                  }
                >
                  Đăng
                </Button>
              </div>
            </form>
          </div>
        </div>
        <OptionsModal
          isOpen={postOptionsModal}
          onClose={() => setPostOptionsModal(false)}
          isOwn={isOwnPost}
          type="post"
          onEdit={
            isOwnPost
              ? () => {
                  toast.info("Chức năng chỉnh sửa đang được phát triển");
                  setPostOptionsModal(false);
                }
              : undefined
          }
          onDelete={handleDeletePost}
          onReport={
            !isOwnPost
              ? () => {
                  toast.info("Chức năng báo cáo đang được phát triển");
                  setPostOptionsModal(false);
                }
              : undefined
          }
        />

        <OptionsModal
          isOpen={!!commentOptionsModal}
          onClose={() => setCommentOptionsModal(null)}
          isOwn={commentOptionsModal?.isOwn || false}
          type="comment"
          onEdit={
            commentOptionsModal?.isOwn
              ? () => {
                  const comment = comments.find(
                    (c) => c._id === commentOptionsModal.commentId,
                  );
                  if (comment) {
                    handleEditComment(comment._id, comment.content);
                  }
                }
              : undefined
          }
          onDelete={() => {
            if (commentOptionsModal) {
              handleDeleteComment(commentOptionsModal.commentId);
            }
          }}
          onReport={
            !commentOptionsModal?.isOwn
              ? () => toast.info("Chức năng báo cáo đang được phát triển")
              : undefined
          }
        />

        <EditCommentModal
          isOpen={!!editingComment}
          onClose={() => setEditingComment(null)}
          initialContent={editingComment?.content || ""}
          onSave={handleSaveEditComment}
          isSaving={isSavingEdit}
        />
      </div>
    </div>
  );
}
