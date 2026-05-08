"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { isElectron } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";

// ── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const shakeVariants = {
  shake: {
    x: [0, -10, 10, -8, 8, -4, 4, 0],
    transition: { duration: 0.5 },
  },
  idle: { x: 0 },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function LoginView() {
  const { setAuth } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [storeName, setStoreName] = useState("Offline POS");

  const usernameRef = useRef<HTMLInputElement>(null);

  // Load store name from settings
  useEffect(() => {
    usernameRef.current?.focus();
    if (!isElectron()) return;
    window.electron.settings
      .get("store.name")
      .then((s) => {
        if (s?.value) setStoreName(s.value);
      })
      .catch(() => {});
  }, []);

  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      triggerError("Please enter your username.");
      usernameRef.current?.focus();
      return;
    }
    if (!password) {
      triggerError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      if (!isElectron()) {
        // Dev-mode shortcut: accept any credentials and mock an admin session
        await new Promise((r) => setTimeout(r, 800));
        const mockUser: AuthUser = {
          id: "dev-user",
          username: trimmedUsername,
          email: null,
          fullName: "Dev User",
          phone: null,
          status: "ACTIVE",
          avatar: null,
          roleId: "dev-role",
          lastLoginAt: null,
          role: { id: "dev-role", name: "ADMIN", displayName: "Administrator" },
        };
        setAuth(mockUser, ["dashboard:view", "pos:open", "products:view", "inventory:view"]);
        return;
      }

      const result = await window.electron.auth.login(trimmedUsername, password);

      if (!result.success || !result.user || !result.permissions) {
        triggerError(result.error ?? "Login failed. Please try again.");
        return;
      }

      setAuth(result.user, result.permissions);
    } catch {
      triggerError("Unable to connect. Please restart the application.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Background mesh gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        <motion.div
          variants={shakeVariants}
          animate={shake ? "shake" : "idle"}
          className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/40"
        >
          {/* Top accent line */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="p-8"
          >
            {/* Brand */}
            <motion.div variants={itemVariants} className="mb-8 flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-lg">
                  <ShoppingCart className="h-7 w-7 text-white" strokeWidth={1.75} />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {storeName}
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Sign in to continue
                </p>
              </div>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Username */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <Label htmlFor="username" className="text-xs text-muted-foreground uppercase tracking-wider">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    ref={usernameRef}
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={isLoading}
                    className="pl-9 bg-background/50 border-border/60 focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={isLoading}
                    className="pl-9 pr-10 bg-background/50 border-border/60 focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      <p className="text-xs text-destructive leading-relaxed">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div variants={itemVariants} className="pt-1">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full overflow-hidden bg-primary hover:bg-primary/90 font-semibold tracking-wide"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isLoading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in…
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Sign In
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </form>
          </motion.div>

          {/* Footer */}
          <div className="border-t border-border/40 bg-muted/20 px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] text-muted-foreground">Offline Mode</span>
              </div>
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-muted-foreground/50 line-through" />
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {isElectron() ? "Desktop" : "Browser"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Below-card hint */}
        <motion.p
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="mt-4 text-center text-[10px] text-muted-foreground/40"
        >
          Contact your administrator if you cannot sign in.
        </motion.p>
      </motion.div>
    </div>
  );
}
