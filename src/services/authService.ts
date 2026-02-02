import axiosInstance from "./axios";
import type { AuthResponse, LoginRequest } from "@/types";

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post("/api/auth/login", data);

    const payload = response.data?.data;

    return {
      token: payload.tokens.accessToken,
      user: {
        id: payload.user._id,
        email: payload.user.email,
        username: payload.user.username,
        full_name: payload.user.fullName,
        avatar: payload.user.profilePicture,
        bio: payload.user.bio || "",
        is_verified: true,
        created_at: "",
        updated_at: "",
      },
    };
  },

  logout: async () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("current_user");
    localStorage.removeItem("auth-storage");
  },
};
