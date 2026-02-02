import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useAuthStore } from "@/stores/authStore";

import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedLayout } from "@/layouts/ProtectedLayout";

import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import HomePage from "@/pages/HomePage";
import ExplorePage from "@/pages/ExplorePage";
import ChatPage from "@/pages/ChatPage";
import ProfilePage from "@/pages/ProfilePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  function RootRedirect() {
    const { isAuthenticated, isHydrated } = useAuthStore();

    if (!isHydrated) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      );
    }

    return isAuthenticated ? (
      <Navigate to="" replace />
    ) : (
      <Navigate to="/login" replace />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/reset-password/:token"
              element={<ResetPasswordPage />}
            />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Route>

          <Route element={<ProtectedLayout />}>
            <Route element={<MainLayout />}>
              <Route path="" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/user/:userId" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
