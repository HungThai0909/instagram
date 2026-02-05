import axiosInstance from "./axios";
import type { LoginRequest, User } from "@/types";

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    const res = await axiosInstance.post("/api/auth/login", data, {
      skipAuth: true,
    } as any);

    const payload = res.data.data;

    return {
      user: payload.user,
      accessToken: payload.tokens.accessToken,
      refreshToken: payload.tokens.refreshToken,
    };
  },

  register: async (data: RegisterRequest) => {
    const res = await axiosInstance.post("/api/auth/register", data, {
      skipAuth: true,
    } as any);
    return res.data.data;
  },

  verifyEmailWithToken: async (token: string) => {
    console.log("Calling verify API with token:", token);
    
    try {
      const res = await axiosInstance.post(
        `/api/auth/verify-email/${token}`,
        {},
        { skipAuth: true } as any,
      );
      
      console.log("Verify API response:", res.data);
      return res.data.data;
    } catch (error: any) {
      console.error("Verify API error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  resendVerification: async (email: string) => {
    const res = await axiosInstance.post(
      "/api/auth/resend-verification-email",
      { email },
      { skipAuth: true } as any,
    );
    return res.data.data;
  },

  forgotPassword: async (data: { email: string }) => {
    const res = await axiosInstance.post("/api/auth/forgot-password", data, {
      skipAuth: true,
    } as any);
    return res.data;
  },

  resetPassword: async (
    token: string,
    data: { password: string; confirmPassword: string },
  ) => {
    const res = await axiosInstance.post(
      `/api/auth/reset-password/${token}`,
      data,
      { skipAuth: true } as any,
    );
    return res.data.data;
  },

  logout: async () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
  },
};