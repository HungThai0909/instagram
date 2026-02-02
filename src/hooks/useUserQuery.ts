import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/services/axios";

export const useCurrentUserProfileQuery = () => {
  return useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/users/profile");
      return res.data.data;
    },
  });
};

export const useUserByIdQuery = (userId: string) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/users/${userId}`);
      return res.data.data;
    },
    enabled: !!userId,
  });
};

export const useUserPostsByIdQuery = (userId: string) => {
  return useQuery({
    queryKey: ["userPosts", userId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/posts/user/${userId}`, {
        params: { filter: "all" },
      });
      return res.data.data;
    },
    enabled: !!userId,
  });
};

export const useFollowUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await axiosInstance.post(`/api/follow/${userId}/follow`);
      return res.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });
};

export const useUnfollowUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await axiosInstance.delete(`/api/follow/${userId}/follow`);
      return res.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });
};
