import path from "path";
import fs from "fs";
import { app } from "electron";
import { getDb, closeDb, initDb } from "./db";
import type {
  BackupEntry,
  BackupType,
  BackupScheduleConfig,
  BackupResult,
  RestoreResult,
  BackupOperationResult,
} from "../../src/types/backup";

const isDev = process.env.NODE_ENV === "development";

export class BackupManager {
  private static _instance: BackupManager;
  private _scheduleTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  static getInstance(): BackupManager {
    if (!BackupManager._instance) {
      BackupManager._instance = new BackupManager();
    }
    return BackupManager._instance;
  }

  // ── Paths ───────────────────────────────────────────────────────────────────

  getBackupDir(): string {
    const dir = isDev
      ? path.join(process.cwd(), "backups")
      : path.join(app.getPath("userData"), "backups");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  getDbPath(): string {
    return isDev
      ? path.join(process.cwd(), "database", "pos.db")
      : path.join(app.getPath("userData"), "database", "pos.db");
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  async createBackup(label?: string, type: BackupType = "manual"): Promise<BackupResult> {
    try {
      const db = getDb();

      // Flush WAL journal into the main DB file before copying
      await db.$executeRaw`PRAGMA wal_checkpoint(FULL)`;

      const backupDir = this.getBackupDir();
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, "-");
      const filename = `pos-${type}-${timestamp}.db`;
      const backupPath = path.join(backupDir, filename);

      fs.copyFileSync(this.getDbPath(), backupPath);

      const stat = fs.statSync(backupPath);
      const entry: BackupEntry = {
        id: filename.replace(".db", ""),
        filename,
        path: backupPath,
        createdAt: now.toISOString(),
        size: stat.size,
        label: label ?? this._defaultLabel(type),
        type,
      };

      // Write JSON sidecar for metadata persistence
      fs.writeFileSync(
        path.join(backupDir, filename.replace(".db", ".json")),
        JSON.stringify(entry, null, 2)
      );

      return { success: true, backup: entry };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  private _defaultLabel(type: BackupType): string {
    if (type === "scheduled") return "Scheduled";
    if (type === "pre-restore") return "Pre-restore";
    return "Manual";
  }

  // ── List ────────────────────────────────────────────────────────────────────

  listBackups(): BackupEntry[] {
    const backupDir = this.getBackupDir();
    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".json"));
    const entries: BackupEntry[] = [];

    for (const f of files) {
      try {
        const raw = fs.readFileSync(path.join(backupDir, f), "utf-8");
        const entry = JSON.parse(raw) as BackupEntry;
        if (fs.existsSync(entry.path)) {
          // Refresh size in case file changed
          entry.size = fs.statSync(entry.path).size;
          entries.push(entry);
        }
      } catch {
        // Skip malformed metadata files
      }
    }

    return entries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ── Restore ─────────────────────────────────────────────────────────────────

  async restoreBackup(backupId: string): Promise<RestoreResult> {
    const entries = this.listBackups();
    const entry = entries.find((e) => e.id === backupId);
    if (!entry) return { success: false, error: "Backup not found" };
    if (!fs.existsSync(entry.path)) {
      return { success: false, error: "Backup file missing from disk" };
    }

    // Step 1: Create a pre-restore safety snapshot of the current DB
    const safetyResult = await this.createBackup(
      `Pre-restore — ${new Date().toLocaleString()}`,
      "pre-restore"
    );
    if (!safetyResult.success) {
      return { success: false, error: `Could not create safety backup: ${safetyResult.error}` };
    }

    try {
      // Step 2: Close Prisma connection (releases file locks)
      await closeDb();

      // Step 3: Remove WAL/SHM journal files to avoid journal conflicts
      const dbPath = this.getDbPath();
      for (const ext of ["-wal", "-shm"]) {
        const f = dbPath + ext;
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }

      // Step 4: Overwrite the live DB with the chosen backup
      fs.copyFileSync(entry.path, dbPath);

      // Step 5: Reconnect and re-apply pragmas
      await initDb();

      return { success: true, preRestoreBackup: safetyResult.backup };
    } catch (err) {
      // Rollback: put the pre-restore snapshot back
      try {
        if (safetyResult.backup) {
          const dbPath = this.getDbPath();
          fs.copyFileSync(safetyResult.backup.path, dbPath);
          await initDb();
        }
      } catch {
        // Best-effort rollback
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  deleteBackup(backupId: string): BackupOperationResult {
    const entries = this.listBackups();
    const entry = entries.find((e) => e.id === backupId);
    if (!entry) return { success: false, error: "Backup not found" };

    try {
      if (fs.existsSync(entry.path)) fs.unlinkSync(entry.path);
      const meta = entry.path.replace(".db", ".json");
      if (fs.existsSync(meta)) fs.unlinkSync(meta);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // ── Pruning ─────────────────────────────────────────────────────────────────

  pruneOldBackups(keepCount: number): void {
    const all = this.listBackups();
    // Only auto-prune manual/scheduled; keep pre-restore backups for safety
    const prunable = all.filter((e) => e.type !== "pre-restore");
    if (prunable.length > keepCount) {
      prunable.slice(keepCount).forEach((e) => this.deleteBackup(e.id));
    }
  }

  // ── Schedule ────────────────────────────────────────────────────────────────

  async loadScheduleConfig(): Promise<BackupScheduleConfig> {
    const db = getDb();
    const rows = await db.setting.findMany({
      where: { key: { startsWith: "backup.schedule." } },
    });
    const m = new Map(rows.map((r) => [r.key, r.value]));

    return {
      enabled: m.get("backup.schedule.enabled") === "true",
      frequency:
        (m.get("backup.schedule.frequency") as BackupScheduleConfig["frequency"]) ?? "daily",
      keepCount: parseInt(m.get("backup.schedule.keepCount") ?? "10", 10),
      lastRun: m.get("backup.schedule.lastRun") ?? null,
      nextRun: m.get("backup.schedule.nextRun") ?? null,
    };
  }

  async saveScheduleConfig(config: BackupScheduleConfig): Promise<void> {
    const db = getDb();
    const upsert = (key: string, value: string) =>
      db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value, group: "backup", label: key.replace("backup.schedule.", "") },
      });

    const ops = [
      upsert("backup.schedule.enabled", String(config.enabled)),
      upsert("backup.schedule.frequency", config.frequency),
      upsert("backup.schedule.keepCount", String(config.keepCount)),
    ];
    if (config.lastRun) ops.push(upsert("backup.schedule.lastRun", config.lastRun));
    if (config.nextRun) ops.push(upsert("backup.schedule.nextRun", config.nextRun));
    await Promise.all(ops);
  }

  scheduleNext(config: BackupScheduleConfig): void {
    if (this._scheduleTimer) {
      clearTimeout(this._scheduleTimer);
      this._scheduleTimer = null;
    }

    if (!config.enabled) return;

    const nextMs = config.nextRun
      ? new Date(config.nextRun).getTime()
      : this._calcNextRunTime(config.frequency);
    const delay = Math.max(10_000, nextMs - Date.now()); // min 10 s to avoid tight loops

    this._scheduleTimer = setTimeout(async () => {
      this._scheduleTimer = null;
      await this._runScheduledBackup(config);
    }, delay);
  }

  private async _runScheduledBackup(config: BackupScheduleConfig): Promise<void> {
    console.log("[Backup] Running scheduled backup…");
    try {
      const result = await this.createBackup(undefined, "scheduled");
      if (result.success) {
        this.pruneOldBackups(config.keepCount);
      }
    } catch (err) {
      console.error("[Backup] Scheduled backup failed:", err);
    }

    const now = new Date().toISOString();
    const next = new Date(this._calcNextRunTime(config.frequency)).toISOString();
    const updated: BackupScheduleConfig = { ...config, lastRun: now, nextRun: next };

    try {
      await this.saveScheduleConfig(updated);
    } catch {}

    this.scheduleNext(updated);
  }

  private _calcNextRunTime(frequency: BackupScheduleConfig["frequency"]): number {
    const now = Date.now();
    switch (frequency) {
      case "hourly":  return now + 60 * 60 * 1000;
      case "daily":   return now + 24 * 60 * 60 * 1000;
      case "weekly":  return now + 7 * 24 * 60 * 60 * 1000;
      case "monthly": return now + 30 * 24 * 60 * 60 * 1000;
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    const config = await this.loadScheduleConfig();
    this.scheduleNext(config);
    console.log(
      `[Backup] Initialized — schedule ${config.enabled ? `${config.frequency}, next: ${config.nextRun ?? "TBD"}` : "disabled"}`
    );
  }

  shutdown(): void {
    if (this._scheduleTimer) {
      clearTimeout(this._scheduleTimer);
      this._scheduleTimer = null;
    }
  }
}
