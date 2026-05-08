"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { can, canAny, canAll } from "@/lib/permissions";
import { isElectron } from "@/lib/utils";

export function useAuth() {
  const { user, permissions, isAuthenticated, clearAuth, setAuth } = useAuthStore();

  const logout = useCallback(async () => {
    if (user && isElectron()) {
      try {
        await window.electron.auth.logout(user.id);
      } catch {
        // Don't block logout on IPC failure
      }
    }
    clearAuth();
  }, [user, clearAuth]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!user || !isElectron()) return isAuthenticated;
    try {
      const result = await window.electron.auth.validateSession(user.id);
      if (result.valid && result.user && result.permissions) {
        setAuth(result.user, result.permissions);
        return true;
      }
      clearAuth();
      return false;
    } catch {
      return false;
    }
  }, [user, isAuthenticated, setAuth, clearAuth]);

  return {
    user,
    permissions,
    isAuthenticated,

    // Permission checks
    can: (permission: string) => can(permissions, permission),
    canAny: (perms: string[]) => canAny(permissions, perms),
    canAll: (perms: string[]) => canAll(permissions, perms),

    // Role shortcuts
    isOwner: () => user?.role.name === "OWNER",
    isAdmin: () => ["OWNER", "ADMIN"].includes(user?.role.name ?? ""),
    isManager: () => user?.role.name === "MANAGER",
    isCashier: () => user?.role.name === "CASHIER",

    // Actions
    logout,
    refreshSession,
  };
}
