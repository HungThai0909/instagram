import axiosInstance from "./axios";
import type {
  Comment,
  CreateCommentRequest,
  PaginationParams,
  PaginatedResponse,
} from "@/types";

export const commentService = {
  getPostComments: async (postId: string, params: PaginationParams) => {
    const response = await axiosInstance.get<PaginatedResponse<Comment>>(
      `/api/posts/${postId}/comments`,
      { params },
    );
    return response.data;
  },

  getCommentReplies: async (commentId: string, params: PaginationParams) => {
    const response = await axiosInstance.get<PaginatedResponse<Comment>>(
      `/api/comments/${commentId}/replies`,
      { params },
    );
    return response.data;
  },

  createComment: async (postId: string, data: CreateCommentRequest) => {
    const response = await axiosInstance.post<Comment>(
      `/api/posts/${postId}/comments`,
      data,
    );
    return response.data;
  },


  createCommentReply: async (commentId: string, data: CreateCommentRequest) => {
    const response = await axiosInstance.post<Comment>(
      `/api/comments/${commentId}/replies`,
      data,
    );
    return response.data;
  },

 
  updateComment: async (commentId: string, content: string) => {
    const response = await axiosInstance.put<Comment>(
      `/api/comments/${commentId}`,
      { content },
    );
    return response.data;
  },

  
  deleteComment: async (commentId: string) => {
    await axiosInstance.delete(`/api/comments/${commentId}`);
  },

  
  likeComment: async (commentId: string) => {
    const response = await axiosInstance.post(
      `/api/comments/${commentId}/like`,
    );
    return response.data;
  },

  unlikeComment: async (commentId: string) => {
    const response = await axiosInstance.delete(
      `/api/comments/${commentId}/like`,
    );
    return response.data;
  },
};
