import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function ProtectedLayout() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
