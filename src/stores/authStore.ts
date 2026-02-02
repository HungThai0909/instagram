import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (user, token) => {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("current_user", JSON.stringify(user));

        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("current_user");
        localStorage.removeItem("auth-storage");

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isHydrated: true,
        });
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
