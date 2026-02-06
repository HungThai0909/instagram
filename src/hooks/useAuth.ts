import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/authService";
import type { LoginRequest } from "@/types";
import { toast } from "sonner";

export function useAuth() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const logoutStore = useAuthStore((s) => s.logout);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isLoading, setIsLoading] = useState(false);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const { user, accessToken, refreshToken } = await authService.login(data);

      if (!accessToken || !user) {
        toast.error("Phản hồi đăng nhập không hợp lệ");
        setIsLoading(false);
        return null;
      }

      localStorage.setItem("auth_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("current_user", JSON.stringify(user));

      setAuth(user, accessToken);

      toast.success("Đăng nhập thành công!");

      navigate("/", { replace: true });

      return user;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Đăng nhập thất bại";
      toast.error(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      logoutStore();
      navigate("/login", { replace: true });
    }
  };

  return { login, logout, isLoading, user, isAuthenticated };
}
