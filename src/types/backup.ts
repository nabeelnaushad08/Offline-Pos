export type BackupType = "manual" | "scheduled" | "pre-restore";

export interface BackupEntry {
  id: string;
  filename: string;
  path: string;
  createdAt: string;
  size: number;
  label: string;
  type: BackupType;
}

export interface BackupScheduleConfig {
  enabled: boolean;
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  keepCount: number;
  lastRun: string | null;
  nextRun: string | null;
}

export interface BackupResult {
  success: boolean;
  backup?: BackupEntry;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  preRestoreBackup?: BackupEntry;
  error?: string;
}

export interface BackupOperationResult {
  success: boolean;
  error?: string;
}
