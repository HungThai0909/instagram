import axiosInstance from "./axios";
import type { User, PaginationParams, PaginatedResponse } from "@/types";

export const userService = {
  getProfile: async (userId: string) => {
    const response = await axiosInstance.get<User>(`/api/users/${userId}`);
    return response.data;
  },

  updateProfile: async (
    userId: string,
    data: Partial<User> & { avatar?: File; cover_image?: File },
  ) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      const value = data[key as keyof typeof data];
      if (value && key !== "avatar" && key !== "cover_image") {
        formData.append(key, String(value));
      }
    });

    if (data.avatar) {
      formData.append("avatar", data.avatar);
    }
    if (data.cover_image) {
      formData.append("cover_image", data.cover_image);
    }

    const response = await axiosInstance.put<User>(
      `/api/users/${userId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  getFollowers: async (userId: string, params: PaginationParams) => {
    const response = await axiosInstance.get<PaginatedResponse<User>>(
      `/api/users/${userId}/followers`,
      {
        params,
      },
    );
    return response.data;
  },

  getFollowing: async (userId: string, params: PaginationParams) => {
    const response = await axiosInstance.get<PaginatedResponse<User>>(
      `/api/users/${userId}/following`,
      {
        params,
      },
    );
    return response.data;
  },

  followUser: async (userId: string) => {
    const response = await axiosInstance.post(`/api/users/${userId}/follow`);
    return response.data;
  },

  unfollowUser: async (userId: string) => {
    const response = await axiosInstance.delete(`/api/users/${userId}/follow`);
    return response.data;
  },

  searchUsers: async (query: string, params: PaginationParams) => {
    const response = await axiosInstance.get<PaginatedResponse<User>>(
      "/api/users/search",
      {
        params: { q: query, ...params },
      },
    );
    return response.data;
  },

  getExplore: async (params: PaginationParams) => {
    const response = await axiosInstance.get<PaginatedResponse<User>>(
      "/api/users/explore",
      {
        params,
      },
    );
    return response.data;
  },
};
