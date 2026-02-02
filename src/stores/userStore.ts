import { create } from "zustand";
import type { User } from "@/types";

interface UserState {
  currentProfile: User | null;
  isLoading: boolean;
  setCurrentProfile: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  updateProfile: (user: Partial<User>) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentProfile: null,
  isLoading: false,
  setCurrentProfile: (currentProfile) => set({ currentProfile }),
  setLoading: (isLoading) => set({ isLoading }),
  updateProfile: (updates) =>
    set((state) => ({
      currentProfile: state.currentProfile
        ? { ...state.currentProfile, ...updates }
        : null,
    })),
  reset: () =>
    set({
      currentProfile: null,
      isLoading: false,
    }),
}));
