"use client";

import { isElectron } from "./utils";
import type { SettingRecord, DatabaseInfo, BackupResult, LoginResult, ValidateSessionResult, ChangePasswordResult, DashboardData, POSProduct, POSCategory, POSCustomer, CompleteSaleInput, CompleteSaleResult } from "@/types/api";

function requireElectron(): Window["electron"] {
  if (!isElectron()) {
    throw new Error("Electron IPC not available outside Electron.");
  }
  return window.electron;
}

// ── App ──────────────────────────────────────────────────────────────────────

export const appClient = {
  getVersion: () => requireElectron().app.getVersion(),
  getPlatform: () => requireElectron().app.getPlatform(),
  getDataPath: () => requireElectron().app.getDataPath(),
};

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authClient = {
  login: (username: string, password: string): Promise<LoginResult> =>
    requireElectron().auth.login(username, password),

  logout: (userId: string): Promise<{ success: boolean }> =>
    requireElectron().auth.logout(userId),

  validateSession: (userId: string): Promise<ValidateSessionResult> =>
    requireElectron().auth.validateSession(userId),

  changePassword: (userId: string, current: string, next: string): Promise<ChangePasswordResult> =>
    requireElectron().auth.changePassword(userId, current, next),

  hashPassword: (password: string): Promise<string> =>
    requireElectron().auth.hashPassword(password),
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

// ── POS ───────────────────────────────────────────────────────────────────────

export const posClient = {
  getCategories: (): Promise<POSCategory[]> =>
    requireElectron().pos.getCategories(),

  getProducts: (search?: string, categoryId?: string): Promise<POSProduct[]> =>
    requireElectron().pos.getProducts(search, categoryId),

  getProductByBarcode: (barcode: string): Promise<POSProduct | null> =>
    requireElectron().pos.getProductByBarcode(barcode),

  searchCustomers: (term: string): Promise<POSCustomer[]> =>
    requireElectron().pos.searchCustomers(term),

  completeSale: (input: CompleteSaleInput): Promise<CompleteSaleResult> =>
    requireElectron().pos.completeSale(input),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardClient = {
  getData: (): Promise<DashboardData> =>
    requireElectron().dashboard.getData(),
};

// ── Database ──────────────────────────────────────────────────────────────────

export const databaseClient = {
  backup: (targetPath = ""): Promise<BackupResult> =>
    requireElectron().database.backup(targetPath),

  getInfo: (): Promise<DatabaseInfo> =>
    requireElectron().database.getInfo(),
};
