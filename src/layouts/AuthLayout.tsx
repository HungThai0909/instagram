import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function AuthLayout() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="" replace />;
  }

  return <Outlet />;
}
