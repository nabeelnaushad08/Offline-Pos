// Exported types shared between the Electron bridge and the renderer

import type { AuthUser, LoginResult, ValidateSessionResult, ChangePasswordResult } from "./auth";
import type { DashboardData } from "./dashboard";

export type { AuthUser, AuthRole, AuthSession, LoginResult, ValidateSessionResult, ChangePasswordResult } from "./auth";

export interface SettingRecord {
  id: string;
  key: string;
  value: string;
  group?: string;
  label?: string | null;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DatabaseInfo {
  size: number;
  path: string;
  tables: string[];
}

export interface BackupResult {
  success: boolean;
  path: string;
}

export interface ElectronAPI {
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;

  app: {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<string>;
    getDataPath: () => Promise<string>;
  };

  auth: {
    login: (username: string, password: string) => Promise<LoginResult>;
    logout: (userId: string) => Promise<{ success: boolean }>;
    validateSession: (userId: string) => Promise<ValidateSessionResult>;
    changePassword: (userId: string, current: string, next: string) => Promise<ChangePasswordResult>;
    hashPassword: (password: string) => Promise<string>;
    verifyPin: (userId: string, pin: string) => Promise<{ valid: boolean }>;
  };

  settings: {
    get: (key: string) => Promise<SettingRecord | null>;
    set: (key: string, value: string) => Promise<SettingRecord>;
    getAll: () => Promise<SettingRecord[]>;
    delete: (key: string) => Promise<void>;
  };

  dashboard: {
    getData: () => Promise<DashboardData>;
  };

  database: {
    backup: (targetPath: string) => Promise<BackupResult>;
    getInfo: () => Promise<DatabaseInfo>;
  };
}

export type { DashboardData };
