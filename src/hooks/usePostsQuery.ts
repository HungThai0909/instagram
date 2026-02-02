import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/services/axios";
import { toast } from "sonner";
import type { Post } from "@/types";

interface PostsParams {
  page?: number;
  limit?: number;
}

export const useFeedPostsQuery = (params: PostsParams) => {
  return useQuery({
    queryKey: ["posts", "feed", params],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/posts/feed", { params });
      return res.data;
    },
  });
};

export const useUserPostsQuery = (userId: string, params: PostsParams) => {
  return useQuery({
    queryKey: ["posts", "user", userId, params],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/posts/user/${userId}`, {
        params,
      });
      return res.data;
    },
    enabled: Boolean(userId),
  });
};

export const useLikePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) =>
      axiosInstance.post(`/api/posts/${postId}/like`),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
    },

    onError: () => {
      toast.error("Không thể thích bài viết");
    },
  });
};

export const useUnlikePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) =>
      axiosInstance.delete(`/api/posts/${postId}/like`),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
    },

    onError: () => {
      toast.error("Không thể bỏ thích bài viết");
    },
  });
};

export const useSavePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) =>
      axiosInstance.post(`/api/posts/${postId}/save`),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
      toast.success("Đã lưu bài viết");
    },

    onError: () => {
      toast.error("Không thể lưu bài viết");
    },
  });
};

export const useUnsavePostMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) =>
      axiosInstance.delete(`/api/posts/${postId}/save`),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
      toast.success("Đã bỏ lưu bài viết");
    },

    onError: () => {
      toast.error("Không thể bỏ lưu bài viết");
    },
  });
};
