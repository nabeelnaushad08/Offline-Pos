"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser } from "@/types/auth";

// sessionStorage: cleared when the Electron window closes, persists on reload
const safeSessionStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(name, value);
    } catch {}
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(name);
    } catch {}
  },
};

interface AuthState {
  // Session data
  user: AuthUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  loginAt: string | null;

  // Hydration flag — true after Zustand has restored from sessionStorage
  _hasHydrated: boolean;

  // Actions
  setAuth: (user: AuthUser, permissions: string[], loginAt?: string) => void;
  clearAuth: () => void;
  updateUser: (user: AuthUser) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      permissions: [],
      isAuthenticated: false,
      loginAt: null,
      _hasHydrated: false,

      setAuth: (user, permissions, loginAt) =>
        set({
          user,
          permissions,
          isAuthenticated: true,
          loginAt: loginAt ?? new Date().toISOString(),
        }),

      clearAuth: () =>
        set({
          user: null,
          permissions: [],
          isAuthenticated: false,
          loginAt: null,
        }),

      updateUser: (user) => set({ user }),

      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "pos-auth",
      storage: createJSONStorage(() => safeSessionStorage),
      // Only persist what's needed; _hasHydrated is always false at cold start
      partialize: (state) => ({
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
        loginAt: state.loginAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
