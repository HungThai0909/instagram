import axiosInstance from "./axios";
import type {
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export const postService = {
  getFeed: async (params: any) => {
    const response = await axiosInstance.get<any>("/api/posts/feed", {
      params,
    });
    return response.data;
  },

  getUserPosts: async (userId: string, params: PaginationParams) => {
    const limit = params?.limit ?? 20;
    const page = params?.page ?? 1;
    const offset = (page - 1) * limit;
    const response = await axiosInstance.get<any>(`/api/posts/user/${userId}`, {
      params: {
        filter: "all",
        limit,
        offset,
      },
    });

    return response.data?.data;
  },

  getPost: async (postId: string) => {
    const response = await axiosInstance.get<Post>(`/api/posts/${postId}`);
    return response.data;
  },

  createPost: async (data: CreatePostRequest) => {
    const formData = new FormData();
    formData.append("content", data.content);

    if (data.images) {
      data.images.forEach((image) => {
        formData.append("images", image);
      });
    }

    const response = await axiosInstance.post<Post>("/api/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updatePost: async (postId: string, data: UpdatePostRequest) => {
    const response = await axiosInstance.put<Post>(
      `/api/posts/${postId}`,
      data,
    );
    return response.data;
  },

  deletePost: async (postId: string) => {
    await axiosInstance.delete(`/api/posts/${postId}`);
  },

  likePost: async (postId: string) => {
    const response = await axiosInstance.post(`/api/posts/${postId}/like`);
    return response.data;
  },

  unlikePost: async (postId: string) => {
    const response = await axiosInstance.delete(`/api/posts/${postId}/like`);
    return response.data;
  },

  savePost: async (postId: string) => {
    const response = await axiosInstance.post(`/api/posts/${postId}/save`);
    return response.data;
  },

  unsavePost: async (postId: string) => {
    const response = await axiosInstance.delete(`/api/posts/${postId}/save`);
    return response.data;
  },

  getSavedPosts: async (params: PaginationParams) => {
    const response = await axiosInstance.get<PaginatedResponse<Post>>(
      "/api/posts/saved",
      {
        params,
      },
    );
    return response.data;
  },
};
