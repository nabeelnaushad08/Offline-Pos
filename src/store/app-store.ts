"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";
type SidebarState = "expanded" | "collapsed";

interface AppState {
  // UI state
  theme: Theme;
  sidebar: SidebarState;
  isLoading: boolean;

  // System info (loaded from Electron at startup)
  appVersion: string | null;
  platform: string | null;
  dataPath: string | null;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebar: (state: SidebarState) => void;
  setLoading: (loading: boolean) => void;
  setSystemInfo: (info: { appVersion: string; platform: string; dataPath: string }) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "dark",
      sidebar: "expanded",
      isLoading: false,
      appVersion: null,
      platform: null,
      dataPath: null,

      setTheme: (theme) => set({ theme }),

      toggleSidebar: () =>
        set((state) => ({
          sidebar: state.sidebar === "expanded" ? "collapsed" : "expanded",
        })),

      setSidebar: (sidebar) => set({ sidebar }),

      setLoading: (isLoading) => set({ isLoading }),

      setSystemInfo: ({ appVersion, platform, dataPath }) =>
        set({ appVersion, platform, dataPath }),
    }),
    {
      name: "pos-app-store",
      partialize: (state) => ({
        theme: state.theme,
        sidebar: state.sidebar,
      }),
    }
  )
);
