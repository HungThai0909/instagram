import axiosInstance from "./axios";
import type {
  Conversation,
  Message,
  CreateMessageRequest,
  PaginationParams,
  PaginatedResponse,
} from "@/types";

export const chatService = {
  getConversations: async (params: PaginationParams) => {
    const response = await axiosInstance.get<PaginatedResponse<Conversation>>(
      "/api/conversations",
      {
        params,
      },
    );
    return response.data;
  },

  getConversation: async (conversationId: string) => {
    const response = await axiosInstance.get<Conversation>(
      `/api/conversations/${conversationId}`,
    );
    return response.data;
  },

  getMessages: async (conversationId: string, params: PaginationParams) => {
    const response = await axiosInstance.get<PaginatedResponse<Message>>(
      `/api/conversations/${conversationId}/messages`,
      { params },
    );
    return response.data;
  },

  sendMessage: async (data: CreateMessageRequest) => {
    const formData = new FormData();
    formData.append("conversation_id", data.conversation_id);
    formData.append("content", data.content);

    if (data.image) {
      formData.append("image", data.image);
    }

    const response = await axiosInstance.post<Message>(
      "/api/messages",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  
  markMessageAsRead: async (messageId: string) => {
    const response = await axiosInstance.put(`/api/messages/${messageId}/read`);
    return response.data;
  },

 
  startConversation: async (userId: string) => {
    const response = await axiosInstance.post<Conversation>(
      "/api/conversations",
      {
        user_id: userId,
      },
    );
    return response.data;
  },

  deleteConversation: async (conversationId: string) => {
    await axiosInstance.delete(`/api/conversations/${conversationId}`);
  },
};
