import { ipcMain } from "electron";
import { BackupManager } from "../lib/backup-manager";
import type { BackupScheduleConfig } from "../../src/types/backup";

export async function registerBackupHandlers(): Promise<void> {
  const manager = BackupManager.getInstance();
  await manager.initialize();

  // ── List all backups ────────────────────────────────────────────────────────
  ipcMain.handle("backup:list", () => manager.listBackups());

  // ── Create manual backup ────────────────────────────────────────────────────
  ipcMain.handle("backup:create", (_, label?: string) =>
    manager.createBackup(label, "manual")
  );

  // ── Restore a backup by id ──────────────────────────────────────────────────
  ipcMain.handle("backup:restore", (_, backupId: string) =>
    manager.restoreBackup(backupId)
  );

  // ── Delete a backup by id ───────────────────────────────────────────────────
  ipcMain.handle("backup:delete", (_, backupId: string) =>
    manager.deleteBackup(backupId)
  );

  // ── Schedule config ─────────────────────────────────────────────────────────
  ipcMain.handle("backup:getSchedule", () => manager.loadScheduleConfig());

  ipcMain.handle("backup:saveSchedule", async (_, config: BackupScheduleConfig) => {
    try {
      await manager.saveScheduleConfig(config);
      manager.scheduleNext(config);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // ── Backup directory path ───────────────────────────────────────────────────
  ipcMain.handle("backup:getDir", () => manager.getBackupDir());
}
