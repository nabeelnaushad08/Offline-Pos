// Exported types shared between the Electron bridge and the renderer

import type { AuthUser, LoginResult, ValidateSessionResult, ChangePasswordResult } from "./auth";
import type { DashboardData } from "./dashboard";
import type { POSProduct, POSCategory, POSCustomer, CompleteSaleInput, CompleteSaleResult } from "./pos";
import type { PrinterConfig, PrinterStatusInfo, ReceiptData, PrintResult, DetectedPrinter } from "./printer";
import type { BackupEntry, BackupResult as BackupEntryResult, RestoreResult, BackupOperationResult, BackupScheduleConfig } from "./backup";

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

export interface LegacyBackupResult {
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

  pos: {
    getCategories: () => Promise<POSCategory[]>;
    getProducts: (search?: string, categoryId?: string) => Promise<POSProduct[]>;
    getProductByBarcode: (barcode: string) => Promise<POSProduct | null>;
    searchCustomers: (term: string) => Promise<POSCustomer[]>;
    completeSale: (input: CompleteSaleInput) => Promise<CompleteSaleResult>;
  };

  printer: {
    getStatus: () => Promise<PrinterStatusInfo>;
    saveConfig: (config: PrinterConfig) => Promise<PrintResult>;
    printReceipt: (data: ReceiptData) => Promise<PrintResult>;
    openCashDrawer: () => Promise<PrintResult>;
    testPrint: () => Promise<PrintResult>;
    detectPrinters: () => Promise<DetectedPrinter[]>;
  };

  backup: {
    list: () => Promise<BackupEntry[]>;
    create: (label?: string) => Promise<BackupEntryResult>;
    restore: (backupId: string) => Promise<RestoreResult>;
    delete: (backupId: string) => Promise<BackupOperationResult>;
    getSchedule: () => Promise<BackupScheduleConfig>;
    saveSchedule: (config: BackupScheduleConfig) => Promise<BackupOperationResult>;
    getDir: () => Promise<string>;
  };

  database: {
    backup: (targetPath: string) => Promise<LegacyBackupResult>;
    getInfo: () => Promise<DatabaseInfo>;
  };
}

export type { DashboardData, POSProduct, POSCategory, POSCustomer, CompleteSaleInput, CompleteSaleResult };
export type { PrinterConfig, PrinterStatusInfo, ReceiptData, PrintResult, DetectedPrinter };
export type { BackupEntry, BackupEntryResult, RestoreResult, BackupOperationResult, BackupScheduleConfig };
