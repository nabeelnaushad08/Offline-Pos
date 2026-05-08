"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Database,
  HardDrive,
  Layers,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isElectron } from "@/lib/utils";
import { databaseClient } from "@/lib/ipc-client";

const STACK = [
  { label: "Electron", description: "Desktop runtime", status: "ready" },
  { label: "Next.js 15", description: "App Router · Static export", status: "ready" },
  { label: "TypeScript", description: "Strict mode", status: "ready" },
  { label: "Tailwind CSS", description: "v3 · CSS variables", status: "ready" },
  { label: "ShadCN UI", description: "Custom components", status: "ready" },
  { label: "Prisma ORM", description: "SQLite · WAL mode", status: "ready" },
  { label: "Zustand", description: "Persisted state", status: "ready" },
  { label: "Framer Motion", description: "Animations", status: "ready" },
];

const FEATURES = [
  {
    icon: ShoppingCart,
    label: "Point of Sale",
    description: "Fast checkout, receipt printing, cash/card handling",
  },
  {
    icon: Layers,
    label: "Inventory",
    description: "Products, categories, stock tracking, low-stock alerts",
  },
  {
    icon: Database,
    label: "Local Database",
    description: "SQLite with WAL mode — fully offline, no cloud required",
  },
  {
    icon: HardDrive,
    label: "Auto Backup",
    description: "Scheduled database backups to a configurable path",
  },
  {
    icon: Zap,
    label: "Fast & Offline",
    description: "Sub-millisecond queries, works without internet",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

interface DbInfo {
  size: number;
  path: string;
  tables: string[];
}

export default function DashboardPage() {
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    if (!isElectron()) return;
    databaseClient
      .getInfo()
      .then(setDbInfo)
      .catch(() => setDbError(true));
  }, []);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-6xl"
    >
      {/* Hero */}
      <motion.div variants={item} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              System Foundation
            </h1>
            <p className="text-sm text-muted-foreground">
              All core systems initialized and ready
            </p>
          </div>
        </div>
      </motion.div>

      {/* Status banner */}
      <motion.div
        variants={item}
        className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 px-4 py-3"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Foundation layer is operational
          </p>
          <p className="text-xs text-muted-foreground">
            {isElectron()
              ? "Running inside Electron — IPC bridge active"
              : "Running in browser — Electron IPC unavailable (expected in dev)"}
          </p>
        </div>
        <Badge variant="outline" className="ml-auto border-success/30 text-success text-xs">
          v1.0.0
        </Badge>
      </motion.div>

      {/* Stack grid */}
      <motion.div variants={item}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Technology Stack
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STACK.map((tech) => (
            <motion.div
              key={tech.label}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {tech.label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {tech.description}
                      </p>
                    </div>
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-success" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Upcoming modules */}
      <motion.div variants={item}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Upcoming Modules
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.label} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-sm">{feature.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Database info — only in Electron */}
      {isElectron() && (
        <motion.div variants={item}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Database
          </h2>
          <Card className="border-border/50">
            <CardContent className="p-4">
              {dbError && (
                <p className="text-sm text-destructive">
                  Could not read database info — run migrations first: <code className="font-mono text-xs">npm run db:migrate</code>
                </p>
              )}
              {dbInfo && (
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Size</dt>
                    <dd className="mt-1 text-sm font-mono font-semibold text-foreground">
                      {(dbInfo.size / 1024).toFixed(1)} KB
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Tables</dt>
                    <dd className="mt-1 text-sm font-mono font-semibold text-foreground">
                      {dbInfo.tables.length}
                    </dd>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="text-xs text-muted-foreground">Path</dt>
                    <dd className="mt-1 truncate text-xs font-mono text-muted-foreground">
                      {dbInfo.path}
                    </dd>
                  </div>
                </dl>
              )}
              {!dbInfo && !dbError && (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Loading database info…
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
