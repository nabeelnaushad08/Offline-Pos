"use client";

import { can, canAny } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";
import { ShieldOff } from "lucide-react";

interface ProtectedRouteProps {
  /** Single permission required */
  permission?: string;
  /** Any of these permissions */
  anyPermission?: string[];
  /** Content to render when access is denied (defaults to a message) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Wraps a subtree and hides it (or shows fallback) when the current user
 * lacks the required permission(s).  Does NOT redirect — use AuthProvider
 * for that.  Useful for conditionally rendering UI elements within a page.
 */
export function ProtectedRoute({
  permission,
  anyPermission,
  fallback,
  children,
}: ProtectedRouteProps) {
  const permissions = useAuthStore((s) => s.permissions);

  const hasAccess =
    (!permission || can(permissions, permission)) &&
    (!anyPermission || canAny(permissions, anyPermission));

  if (!hasAccess) {
    return (
      <>
        {fallback ?? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ShieldOff className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Access Restricted</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You don&apos;t have permission to view this section.
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
