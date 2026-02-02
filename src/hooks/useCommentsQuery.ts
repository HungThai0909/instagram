import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentService } from "@/services/commentService";
import type { CreateCommentRequest, PaginationParams } from "@/types";
import { toast } from "sonner";

export function usePostCommentsQuery(postId: string, params: PaginationParams) {
  return useQuery({
    queryKey: ["comments", "post", postId, params.page],
    queryFn: () => commentService.getPostComments(postId, params),
    enabled: !!postId,
  });
}

export function useCommentRepliesQuery(
  commentId: string,
  params: PaginationParams,
) {
  return useQuery({
    queryKey: ["comments", "replies", commentId, params.page],
    queryFn: () => commentService.getCommentReplies(commentId, params),
    enabled: !!commentId,
  });
}

export function useCreateCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      data,
    }: {
      postId: string;
      data: CreateCommentRequest;
    }) => commentService.createComment(postId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", "post", variables.postId],
      });
    },
    onError: () => {
      toast.error("Failed to post comment");
    },
  });
}

export function useCreateCommentReplyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      data,
    }: {
      commentId: string;
      data: CreateCommentRequest;
    }) => commentService.createCommentReply(commentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", "replies", variables.commentId],
      });
    },
    onError: () => {
      toast.error("Failed to post reply");
    },
  });
}

export function useUpdateCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => commentService.updateComment(commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast.success("Comment updated");
    },
    onError: () => {
      toast.error("Failed to update comment");
    },
  });
}

export function useDeleteCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast.success("Comment deleted");
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });
}

export function useLikeCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentService.likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
    onError: () => {
      toast.error("Failed to like comment");
    },
  });
}

export function useUnlikeCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentService.unlikeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
    onError: () => {
      toast.error("Failed to unlike comment");
    },
  });
}
