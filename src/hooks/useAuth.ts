import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/authService";
import type { LoginRequest } from "@/types";

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
      const res = await authService.login(data);

      if (!res.token || !res.user) {
        throw new Error("Thông tin đăng nhập không hợp lệ");
      }

      localStorage.setItem("auth_token", res.token);
      localStorage.setItem("current_user", JSON.stringify(res.user));

      setAuth(res.user, res.token);

      navigate("/home", { replace: true });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
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
