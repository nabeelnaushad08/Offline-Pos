"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShoppingCart } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { LoginView } from "./login-view";
import { AppShell } from "@/components/layout/app-shell";
import { isElectron } from "@/lib/utils";

type Phase = "booting" | "login" | "app";

// ── Loading screen ─────────────────────────────────────────────────────────────

function BootScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20"
      >
        <ShoppingCart className="h-8 w-8 text-primary" strokeWidth={1.5} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Starting…
      </motion.div>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, user, _hasHydrated, clearAuth, setAuth } = useAuthStore();
  const [phase, setPhase] = useState<Phase>("booting");

  useEffect(() => {
    // Wait for Zustand to finish rehydrating from sessionStorage
    if (!_hasHydrated) return;

    const validate = async () => {
      if (!isAuthenticated || !user) {
        setPhase("login");
        return;
      }

      // Session exists in sessionStorage — re-validate with the DB
      if (isElectron()) {
        try {
          const result = await window.electron.auth.validateSession(user.id);
          if (result.valid && result.user && result.permissions) {
            setAuth(result.user, result.permissions);
            setPhase("app");
          } else {
            clearAuth();
            setPhase("login");
          }
        } catch {
          // IPC not ready yet (e.g., dev server) — trust the stored session
          setPhase("app");
        }
      } else {
        // Browser / dev mode — trust stored session
        setPhase("app");
      }
    };

    validate();
  }, [_hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // After a successful login (isAuthenticated flips to true), switch to app
  useEffect(() => {
    if (phase === "login" && isAuthenticated) {
      setPhase("app");
    }
  }, [isAuthenticated, phase]);

  // After logout (isAuthenticated flips to false), switch to login
  useEffect(() => {
    if (phase === "app" && !isAuthenticated) {
      setPhase("login");
    }
  }, [isAuthenticated, phase]);

  return (
    <AnimatePresence mode="wait">
      {phase === "booting" && (
        <motion.div key="boot" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <BootScreen />
        </motion.div>
      )}

      {phase === "login" && (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <LoginView />
        </motion.div>
      )}

      {phase === "app" && (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-screen"
        >
          <AppShell>{children}</AppShell>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
