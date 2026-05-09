"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HardDrive,
  Plus,
  RotateCcw,
  Trash2,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  FolderOpen,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isElectron } from "@/lib/utils";
import { backupClient } from "@/lib/ipc-client";
import type { BackupEntry, BackupScheduleConfig } from "@/types/backup";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  manual:      { label: "Manual",      color: "border-primary/30 bg-primary/10 text-primary" },
  scheduled:   { label: "Scheduled",   color: "border-success/30 bg-success/10 text-success" },
  "pre-restore": { label: "Pre-restore", color: "border-warning/30 bg-warning/10 text-warning" },
};

const FREQ_OPTIONS: { value: BackupScheduleConfig["frequency"]; label: string; desc: string }[] = [
  { value: "hourly",  label: "Hourly",  desc: "Every hour" },
  { value: "daily",   label: "Daily",   desc: "Once a day" },
  { value: "weekly",  label: "Weekly",  desc: "Once a week" },
  { value: "monthly", label: "Monthly", desc: "Once a month" },
];

// ── Confirm Dialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ConfirmDialog({
  open, title, message, confirmLabel, confirmClass, onConfirm, onCancel, isLoading,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-warning/30 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{message}</p>
          </div>
          <button onClick={onCancel} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            size="sm"
            className={cn("flex-1 gap-1.5", confirmClass)}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [schedule, setSchedule] = useState<BackupScheduleConfig>({
    enabled: false,
    frequency: "daily",
    keepCount: 10,
    lastRun: null,
    nextRun: null,
  });
  const [backupDir, setBackupDir] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleChanged, setScheduleChanged] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  // Confirm dialogs
  const [restoreTarget, setRestoreTarget] = useState<BackupEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackupEntry | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast messages
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    if (!isElectron()) { setIsLoading(false); return; }
    try {
      const [list, sched, dir] = await Promise.all([
        backupClient.list(),
        backupClient.getSchedule(),
        backupClient.getDir(),
      ]);
      setBackups(list);
      setSchedule(sched);
      setBackupDir(dir);
    } catch (err) {
      showToast("error", "Failed to load backup data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!isElectron()) return;
    setIsCreating(true);
    try {
      const result = await backupClient.create();
      if (result.success) {
        showToast("success", `Backup created: ${result.backup?.filename}`);
        await loadData();
      } else {
        showToast("error", result.error ?? "Backup failed");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget || !isElectron()) return;
    setIsRestoring(true);
    try {
      const result = await backupClient.restore(restoreTarget.id);
      if (result.success) {
        showToast(
          "success",
          `Database restored. Safety backup: ${result.preRestoreBackup?.filename ?? "saved"}`
        );
        await loadData();
      } else {
        showToast("error", result.error ?? "Restore failed");
      }
    } finally {
      setIsRestoring(false);
      setRestoreTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !isElectron()) return;
    setIsDeleting(true);
    try {
      const result = await backupClient.delete(deleteTarget.id);
      if (result.success) {
        showToast("success", "Backup deleted");
        await loadData();
      } else {
        showToast("error", result.error ?? "Delete failed");
      }
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleSaveSchedule = async () => {
    if (!isElectron()) return;
    setIsSavingSchedule(true);
    try {
      const result = await backupClient.saveSchedule(schedule);
      if (result.success) {
        setScheduleChanged(false);
        setScheduleSaved(true);
        setTimeout(() => setScheduleSaved(false), 3000);
        await loadData();
      } else {
        showToast("error", result.error ?? "Failed to save schedule");
      }
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const setScheduleField = <K extends keyof BackupScheduleConfig>(
    key: K,
    value: BackupScheduleConfig[K]
  ) => {
    setSchedule((s) => ({ ...s, [key]: value }));
    setScheduleChanged(true);
    setScheduleSaved(false);
  };

  // ── Stats ────────────────────────────────────────────────────────────────────

  const lastBackup = backups[0] ?? null;
  const manualCount = backups.filter((b) => b.type === "manual").length;
  const scheduledCount = backups.filter((b) => b.type === "scheduled").length;
  const totalSize = backups.reduce((s, b) => s + b.size, 0);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-xl transition-all",
          toast.type === "success"
            ? "border-success/30 bg-success/10 text-success"
            : "border-destructive/30 bg-destructive/10 text-destructive"
        )}>
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Backup & Restore</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Protect your data with scheduled and on-demand backups
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={loadData}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button size="sm" className="gap-1.5 h-8" onClick={handleCreate} disabled={isCreating}>
              {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {isCreating ? "Creating…" : "Backup Now"}
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              icon: Clock,
              label: "Last Backup",
              value: lastBackup ? timeAgo(lastBackup.createdAt) : "Never",
              sub: lastBackup ? formatDate(lastBackup.createdAt) : "No backups yet",
              color: "text-primary",
            },
            {
              icon: HardDrive,
              label: "Total Backups",
              value: backups.length,
              sub: `${manualCount} manual · ${scheduledCount} scheduled`,
              color: "text-foreground",
            },
            {
              icon: ShieldCheck,
              label: "Storage Used",
              value: formatBytes(totalSize),
              sub: `Across ${backups.length} files`,
              color: "text-success",
            },
            {
              icon: Calendar,
              label: "Next Scheduled",
              value: schedule.enabled && schedule.nextRun ? timeAgo(schedule.nextRun) : "Off",
              sub: schedule.enabled && schedule.nextRun
                ? formatDate(schedule.nextRun)
                : "Enable schedule below",
              color: schedule.enabled ? "text-warning" : "text-muted-foreground",
            },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("h-4 w-4", color)} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className={cn("text-lg font-bold", color)}>{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Schedule config */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Auto Backup</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically back up on a schedule
                  </p>
                </div>
                <button
                  onClick={() => setScheduleField("enabled", !schedule.enabled)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    schedule.enabled ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    schedule.enabled ? "left-6" : "left-1"
                  )} />
                </button>
              </div>

              {schedule.enabled && (
                <>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Frequency</p>
                    <div className="grid grid-cols-2 gap-2">
                      {FREQ_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setScheduleField("frequency", opt.value)}
                          className={cn(
                            "rounded-lg border p-2.5 text-left transition-colors",
                            schedule.frequency === opt.value
                              ? "border-primary bg-primary/10"
                              : "border-border/60 hover:border-border hover:bg-muted/20"
                          )}
                        >
                          <p className={cn(
                            "text-xs font-semibold",
                            schedule.frequency === opt.value ? "text-primary" : "text-foreground"
                          )}>{opt.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Keep last{" "}
                      <span className="text-foreground font-semibold">{schedule.keepCount}</span>{" "}
                      backups
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={30}
                      value={schedule.keepCount}
                      onChange={(e) => setScheduleField("keepCount", parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>3 min</span>
                      <span>30 max</span>
                    </div>
                  </div>

                  {schedule.lastRun && (
                    <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                      <p className="text-[10px] text-muted-foreground">Last run</p>
                      <p className="text-xs text-foreground">{formatDate(schedule.lastRun)}</p>
                    </div>
                  )}
                </>
              )}

              <Button
                className="w-full gap-1.5"
                size="sm"
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule || (!scheduleChanged && !schedule.enabled)}
              >
                {isSavingSchedule ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : scheduleSaved ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : null}
                {isSavingSchedule ? "Saving…" : scheduleSaved ? "Saved!" : "Save Schedule"}
              </Button>

              {/* Backup directory */}
              {backupDir && (
                <div className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Storage Location
                    </p>
                  </div>
                  <p className="text-[11px] text-foreground font-mono break-all leading-relaxed">
                    {backupDir}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Backup history */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
                <p className="text-sm font-semibold text-foreground">
                  Backup History
                  {backups.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({backups.length} files)
                    </span>
                  )}
                </p>
              </div>

              {backups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-muted/30 mb-3">
                    <HardDrive className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No backups yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Backup Now" to create your first backup
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40 max-h-[520px] overflow-y-auto">
                  {backups.map((backup) => {
                    const badge = TYPE_LABELS[backup.type] ?? TYPE_LABELS.manual;
                    return (
                      <div
                        key={backup.id}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors"
                      >
                        {/* Icon */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/30">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-semibold text-foreground truncate max-w-xs">
                              {backup.label}
                            </p>
                            <span className={cn(
                              "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                              badge.color
                            )}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
                            {backup.filename}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">
                              {formatDate(backup.createdAt)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">·</span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatBytes(backup.size)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">·</span>
                            <span className="text-[11px] text-muted-foreground">
                              {timeAgo(backup.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setRestoreTarget(backup)}
                            title="Restore this backup"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(backup)}
                            title="Delete this backup"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:border-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Restore Confirmation */}
      <ConfirmDialog
        open={!!restoreTarget}
        title="Restore Database"
        message={`This will replace the live database with "${restoreTarget?.label ?? restoreTarget?.filename}". A safety backup will be created automatically before restoring. All unsaved changes after this backup will be lost.`}
        confirmLabel="Restore"
        confirmClass="bg-warning text-warning-foreground hover:bg-warning/90"
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
        isLoading={isRestoring}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Backup"
        message={`Are you sure you want to permanently delete "${deleteTarget?.label ?? deleteTarget?.filename}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmClass="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
