"use client";

import { isElectron } from "./utils";
import type { SettingRecord, DatabaseInfo, BackupResult } from "@/types/api";

function requireElectron(): Window["electron"] {
  if (!isElectron()) {
    throw new Error("Electron IPC not available. Are you running inside Electron?");
  }
  return window.electron;
}

// ── App ──────────────────────────────────────────────────────────────────────

export const appClient = {
  getVersion: () => requireElectron().app.getVersion(),
  getPlatform: () => requireElectron().app.getPlatform(),
  getDataPath: () => requireElectron().app.getDataPath(),
};

// ── Settings ─────────────────────────────────────────────────────────────────

export const settingsClient = {
  get: (key: string): Promise<SettingRecord | null> =>
    requireElectron().settings.get(key),

  set: (key: string, value: string): Promise<SettingRecord> =>
    requireElectron().settings.set(key, value),

  getAll: (): Promise<SettingRecord[]> =>
    requireElectron().settings.getAll(),

  delete: (key: string): Promise<void> =>
    requireElectron().settings.delete(key),
};

// ── Database ──────────────────────────────────────────────────────────────────

export const databaseClient = {
  backup: (targetPath = ""): Promise<BackupResult> =>
    requireElectron().database.backup(targetPath),

  getInfo: (): Promise<DatabaseInfo> =>
    requireElectron().database.getInfo(),
};
