"use client";

import { useEffect, useState } from "react";
import { WifiOff, HardDrive, LogOut, ChevronDown, User } from "lucide-react";
import { PrinterStatusBadge } from "@/components/printer/printer-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/hooks/use-auth";
import { isElectron, formatDate } from "@/lib/utils";
import { appClient } from "@/lib/ipc-client";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const { appVersion, platform, setSystemInfo } = useAppStore();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isElectron() && !appVersion) {
      Promise.all([
        appClient.getVersion(),
        appClient.getPlatform(),
        appClient.getDataPath(),
      ])
        .then(([version, plat, dataPath]) => {
          setSystemInfo({ appVersion: version, platform: plat, dataPath });
        })
        .catch(console.error);
    }
  }, [appVersion, setSystemInfo]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowUserMenu(false);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-sm">
      {/* Left — date/time */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-foreground">
          {formatDate(currentTime)}
        </h1>
        <span className="text-xs text-muted-foreground font-mono">
          {currentTime.toLocaleTimeString()}
        </span>
      </div>

      {/* Right — status + user menu */}
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className="gap-1.5 text-xs font-normal border-success/30 text-success"
        >
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>

        <PrinterStatusBadge />

        {isElectron() && (
          <Badge variant="outline" className="gap-1.5 text-xs font-normal">
            <HardDrive className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {platform ?? "…"} · v{appVersion ?? "…"}
            </span>
          </Badge>
        )}

        {/* User menu */}
        {user && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2 h-8 px-2.5"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 border border-primary/20">
                <User className="h-3 w-3 text-primary" />
              </div>
              <div className="hidden sm:flex flex-col items-start leading-none">
                <span className="text-xs font-medium text-foreground">
                  {user.fullName.split(" ")[0]}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {user.role.displayName}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-lg border border-border bg-card shadow-xl shadow-black/20"
                  >
                    {/* User info */}
                    <div className="border-b border-border/60 px-3 py-2.5">
                      <p className="text-xs font-semibold text-foreground">
                        {user.fullName}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        @{user.username}
                      </p>
                      <div className="mt-1.5 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5">
                        <span className="text-[10px] font-medium text-primary">
                          {user.role.displayName}
                        </span>
                      </div>
                    </div>

                    {/* Sign out */}
                    <div className="p-1">
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        {isLoggingOut ? "Signing out…" : "Sign Out"}
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
}
