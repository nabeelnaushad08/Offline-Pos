"use client";

import { isElectron } from "./utils";
import type { SettingRecord, DatabaseInfo, LegacyBackupResult, LoginResult, ValidateSessionResult, ChangePasswordResult, DashboardData, POSProduct, POSCategory, POSCustomer, CompleteSaleInput, CompleteSaleResult } from "@/types/api";
import type { InventoryProduct, InventoryCategory, InventorySupplier, InventoryPurchase, StockMovementRecord, StockAdjustInput, ReceivePurchaseItem, PurchaseFormValues } from "@/types/inventory";
import type { DailySalesRow, MonthlySalesRow, TopProductRow, InventoryValuationSummary, CashFlowRow, SupplierPurchaseRow } from "@/types/reports";
import type { PrinterConfig, PrinterStatusInfo, ReceiptData, PrintResult, DetectedPrinter } from "@/types/printer";
import type { BackupEntry, BackupResult as BackupEntryResult, RestoreResult, BackupOperationResult, BackupScheduleConfig } from "@/types/backup";

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
  setAutoLaunch: (enable: boolean) => requireElectron().app.setAutoLaunch(enable),
  getAutoLaunch: () => requireElectron().app.getAutoLaunch(),
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
  backup: (targetPath = ""): Promise<LegacyBackupResult> =>
    requireElectron().database.backup(targetPath),

  getInfo: (): Promise<DatabaseInfo> =>
    requireElectron().database.getInfo(),
};

// ── Inventory ─────────────────────────────────────────────────────────────────

type RawProductRow = {
  id: string; name: string; slug: string; sku: string; barcode: string | null;
  description: string | null; categoryId: string; supplierId: string | null;
  costPrice: number; sellingPrice: number; taxRate: number; unit: string;
  stockQuantity: number; minStockLevel: number; maxStockLevel: number | null;
  isTrackStock: boolean; status: string; image: string | null;
  createdAt: string; updatedAt: string;
  category: { name: string };
  supplier: { name: string } | null;
};

type RawCategoryRow = {
  id: string; name: string; slug: string; description: string | null;
  parentId: string | null; sortOrder: number; isActive: boolean;
  _count?: { products: number };
};

type RawSupplierRow = {
  id: string; name: string; code: string; contactName: string | null;
  email: string | null; phone: string | null; address: string | null;
  city: string | null; country: string | null; taxNumber: string | null;
  notes: string | null; isActive: boolean; balance: number; createdAt: string;
  _count?: { products: number };
};

type RawPurchaseRow = {
  id: string; purchaseNumber: string; status: string; supplierId: string;
  subtotal: number; taxAmount: number; shippingCost: number; discountAmount: number;
  totalAmount: number; paidAmount: number; expectedDate: string | null;
  receivedDate: string | null; notes: string | null; createdAt: string;
  supplier: { name: string };
  createdBy: { fullName: string };
  items: Array<{
    id: string; productId: string; productName: string; productSku: string;
    quantityOrdered: number; quantityReceived: number; unitCost: number; totalAmount: number;
  }>;
};

type RawMovementRow = {
  id: string; productId: string; movementType: string; quantity: number;
  quantityBefore: number; quantityAfter: number; notes: string | null; createdAt: string;
  user: { fullName: string } | null;
  product?: { name: string };
};

function mapProduct(r: RawProductRow): InventoryProduct {
  return {
    ...r,
    status: r.status as InventoryProduct["status"],
    categoryName: r.category.name,
    supplierName: r.supplier?.name ?? null,
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  };
}

export const inventoryClient = {
  getProducts: async (filters?: {
    categoryId?: string;
    supplierId?: string;
    status?: string | null;
    search?: string;
  }): Promise<InventoryProduct[]> => {
    const rows = await requireElectron().invoke<RawProductRow[]>("inventory:getProducts", filters);
    return rows.map(mapProduct);
  },

  getProduct: async (id: string): Promise<InventoryProduct | null> => {
    const row = await requireElectron().invoke<RawProductRow | null>("products:get", id);
    return row ? mapProduct(row) : null;
  },

  createProduct: async (data: Record<string, unknown>): Promise<InventoryProduct> => {
    const row = await requireElectron().invoke<RawProductRow>("products:create", data);
    return mapProduct(row);
  },

  updateProduct: async (id: string, data: Record<string, unknown>): Promise<InventoryProduct> => {
    const row = await requireElectron().invoke<RawProductRow>("products:update", id, data);
    return mapProduct(row);
  },

  deleteProduct: async (id: string): Promise<void> => {
    await requireElectron().invoke("products:delete", id);
  },

  getCategories: async (): Promise<InventoryCategory[]> => {
    const rows = await requireElectron().invoke<RawCategoryRow[]>("categories:list");
    return rows.map((r) => ({
      ...r,
      productCount: r._count?.products ?? 0,
    }));
  },

  createCategory: async (data: Record<string, unknown>): Promise<InventoryCategory> => {
    const row = await requireElectron().invoke<RawCategoryRow>("categories:create", data);
    return { ...row, productCount: 0 };
  },

  updateCategory: async (id: string, data: Record<string, unknown>): Promise<InventoryCategory> => {
    const row = await requireElectron().invoke<RawCategoryRow>("categories:update", id, data);
    return { ...row, productCount: row._count?.products ?? 0 };
  },

  deleteCategory: async (id: string): Promise<void> => {
    await requireElectron().invoke("categories:delete", id);
  },

  getSuppliers: async (): Promise<InventorySupplier[]> => {
    const rows = await requireElectron().invoke<RawSupplierRow[]>("suppliers:list");
    return rows.map((r) => ({
      ...r,
      productCount: r._count?.products ?? 0,
      createdAt: String(r.createdAt),
    }));
  },

  createSupplier: async (data: Record<string, unknown>): Promise<InventorySupplier> => {
    const row = await requireElectron().invoke<RawSupplierRow>("suppliers:create", data);
    return { ...row, productCount: 0, createdAt: String(row.createdAt) };
  },

  updateSupplier: async (id: string, data: Record<string, unknown>): Promise<InventorySupplier> => {
    const row = await requireElectron().invoke<RawSupplierRow>("suppliers:update", id, data);
    return { ...row, productCount: row._count?.products ?? 0, createdAt: String(row.createdAt) };
  },

  getPurchases: async (filters?: { status?: string; supplierId?: string }): Promise<InventoryPurchase[]> => {
    const rows = await requireElectron().invoke<RawPurchaseRow[]>("purchases:list", filters);
    return rows.map((r) => ({
      id: r.id,
      purchaseNumber: r.purchaseNumber,
      status: r.status as InventoryPurchase["status"],
      supplierId: r.supplierId,
      supplierName: r.supplier.name,
      subtotal: r.subtotal,
      taxAmount: r.taxAmount,
      shippingCost: r.shippingCost,
      discountAmount: r.discountAmount,
      totalAmount: r.totalAmount,
      paidAmount: r.paidAmount,
      expectedDate: r.expectedDate ? String(r.expectedDate) : null,
      receivedDate: r.receivedDate ? String(r.receivedDate) : null,
      notes: r.notes,
      items: r.items ?? [],
      createdByName: r.createdBy.fullName,
      createdAt: String(r.createdAt),
    }));
  },

  getPurchase: async (id: string): Promise<InventoryPurchase | null> => {
    const r = await requireElectron().invoke<RawPurchaseRow | null>("purchases:get", id);
    if (!r) return null;
    return {
      id: r.id,
      purchaseNumber: r.purchaseNumber,
      status: r.status as InventoryPurchase["status"],
      supplierId: r.supplierId,
      supplierName: r.supplier.name,
      subtotal: r.subtotal,
      taxAmount: r.taxAmount,
      shippingCost: r.shippingCost,
      discountAmount: r.discountAmount,
      totalAmount: r.totalAmount,
      paidAmount: r.paidAmount,
      expectedDate: r.expectedDate ? String(r.expectedDate) : null,
      receivedDate: r.receivedDate ? String(r.receivedDate) : null,
      notes: r.notes,
      items: r.items ?? [],
      createdByName: r.createdBy.fullName,
      createdAt: String(r.createdAt),
    };
  },

  createPurchase: async (
    input: PurchaseFormValues & { createdByUserId: string }
  ): Promise<{ success: boolean; error?: string }> =>
    requireElectron().invoke("inventory:createPurchase", input),

  adjustStock: async (
    input: StockAdjustInput
  ): Promise<{ success: boolean; before?: number; after?: number; error?: string }> =>
    requireElectron().invoke("inventory:adjustStock", input),

  receivePurchase: async (
    purchaseId: string,
    items: ReceivePurchaseItem[],
    userId: string
  ): Promise<{ success: boolean; status?: string; error?: string }> =>
    requireElectron().invoke("inventory:receivePurchase", purchaseId, items, userId),

  getStockMovements: async (productId: string): Promise<StockMovementRecord[]> => {
    const rows = await requireElectron().invoke<RawMovementRow[]>("stock:movements", productId);
    return rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product?.name ?? "",
      movementType: r.movementType,
      quantity: r.quantity,
      quantityBefore: r.quantityBefore,
      quantityAfter: r.quantityAfter,
      notes: r.notes,
      createdAt: String(r.createdAt),
      userName: r.user?.fullName ?? null,
    }));
  },
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const reportsClient = {
  dailySales: (from: string, to: string): Promise<DailySalesRow[]> =>
    requireElectron().invoke<DailySalesRow[]>("reports:dailySales", from, to),

  monthlySales: (from: string, to: string): Promise<MonthlySalesRow[]> =>
    requireElectron().invoke<MonthlySalesRow[]>("reports:monthlySales", from, to),

  topProducts: (from: string, to: string): Promise<TopProductRow[]> =>
    requireElectron().invoke<TopProductRow[]>("reports:topProducts", from, to),

  inventoryValuation: (): Promise<InventoryValuationSummary> =>
    requireElectron().invoke<InventoryValuationSummary>("reports:inventoryValuation"),

  cashFlow: (from: string, to: string): Promise<CashFlowRow[]> =>
    requireElectron().invoke<CashFlowRow[]>("reports:cashFlow", from, to),

  supplierPurchases: (from: string, to: string): Promise<SupplierPurchaseRow[]> =>
    requireElectron().invoke<SupplierPurchaseRow[]>("reports:supplierPurchases", from, to),
};

// ── Printer ───────────────────────────────────────────────────────────────────

export const printerClient = {
  getStatus: (): Promise<PrinterStatusInfo> =>
    requireElectron().invoke<PrinterStatusInfo>("printer:getStatus"),

  saveConfig: (config: PrinterConfig): Promise<PrintResult> =>
    requireElectron().invoke<PrintResult>("printer:saveConfig", config),

  printReceipt: (data: ReceiptData): Promise<PrintResult> =>
    requireElectron().invoke<PrintResult>("printer:printReceipt", data),

  openCashDrawer: (): Promise<PrintResult> =>
    requireElectron().invoke<PrintResult>("printer:openCashDrawer"),

  testPrint: (): Promise<PrintResult> =>
    requireElectron().invoke<PrintResult>("printer:testPrint"),

  detectPrinters: (): Promise<DetectedPrinter[]> =>
    requireElectron().invoke<DetectedPrinter[]>("printer:detectPrinters"),
};

// ── Backup ────────────────────────────────────────────────────────────────────

export const backupClient = {
  list: (): Promise<BackupEntry[]> =>
    requireElectron().invoke<BackupEntry[]>("backup:list"),

  create: (label?: string): Promise<BackupEntryResult> =>
    requireElectron().invoke<BackupEntryResult>("backup:create", label),

  restore: (backupId: string): Promise<RestoreResult> =>
    requireElectron().invoke<RestoreResult>("backup:restore", backupId),

  delete: (backupId: string): Promise<BackupOperationResult> =>
    requireElectron().invoke<BackupOperationResult>("backup:delete", backupId),

  getSchedule: (): Promise<BackupScheduleConfig> =>
    requireElectron().invoke<BackupScheduleConfig>("backup:getSchedule"),

  saveSchedule: (config: BackupScheduleConfig): Promise<BackupOperationResult> =>
    requireElectron().invoke<BackupOperationResult>("backup:saveSchedule", config),

  getDir: (): Promise<string> =>
    requireElectron().invoke<string>("backup:getDir"),
};
