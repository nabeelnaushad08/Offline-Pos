import { contextBridge, ipcRenderer } from "electron";

const electronAPI = {
  invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> =>
    ipcRenderer.invoke(channel, ...args) as Promise<T>,

  // ── App info ──────────────────────────────────────────────────────────────
  app: {
    getVersion: () => ipcRenderer.invoke("app:getVersion") as Promise<string>,
    getPlatform: () => ipcRenderer.invoke("app:getPlatform") as Promise<string>,
    getDataPath: () => ipcRenderer.invoke("app:getDataPath") as Promise<string>,
  },

  // ── Authentication ────────────────────────────────────────────────────────
  auth: {
    login: (username: string, password: string) =>
      ipcRenderer.invoke("auth:login", username, password) as Promise<{
        success: boolean;
        user?: import("./ipc/auth.handler").SanitizedUser;
        permissions?: string[];
        error?: string;
      }>,

    logout: (userId: string) =>
      ipcRenderer.invoke("auth:logout", userId) as Promise<{ success: boolean }>,

    validateSession: (userId: string) =>
      ipcRenderer.invoke("auth:validateSession", userId) as Promise<{
        valid: boolean;
        user?: import("./ipc/auth.handler").SanitizedUser;
        permissions?: string[];
      }>,

    changePassword: (userId: string, currentPassword: string, newPassword: string) =>
      ipcRenderer.invoke("auth:changePassword", userId, currentPassword, newPassword) as Promise<{
        success: boolean;
        error?: string;
      }>,

    hashPassword: (password: string) =>
      ipcRenderer.invoke("auth:hashPassword", password) as Promise<string>,

    verifyPin: (userId: string, pin: string) =>
      ipcRenderer.invoke("auth:verifyPin", userId, pin) as Promise<{ valid: boolean }>,
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    get: (key: string) =>
      ipcRenderer.invoke("settings:get", key) as Promise<{
        id: string;
        key: string;
        value: string;
      } | null>,
    set: (key: string, value: string) =>
      ipcRenderer.invoke("settings:set", key, value) as Promise<{
        id: string;
        key: string;
        value: string;
      }>,
    getAll: () =>
      ipcRenderer.invoke("settings:getAll") as Promise<
        Array<{ id: string; key: string; value: string }>
      >,
    delete: (key: string) =>
      ipcRenderer.invoke("settings:delete", key) as Promise<void>,
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    getData: () =>
      ipcRenderer.invoke("dashboard:getData") as Promise<
        import("./ipc/dashboard.handler").DashboardData
      >,
  },

  // ── POS ───────────────────────────────────────────────────────────────────
  pos: {
    getCategories: () =>
      ipcRenderer.invoke("pos:getCategories") as Promise<
        Array<{ id: string; name: string; slug: string; image: string | null }>
      >,
    getProducts: (search?: string, categoryId?: string) =>
      ipcRenderer.invoke("pos:getProducts", search, categoryId) as Promise<
        Array<{
          id: string;
          name: string;
          sku: string;
          barcode: string | null;
          image: string | null;
          sellingPrice: number;
          costPrice: number;
          taxRate: number;
          unit: string;
          stockQuantity: number;
          categoryId: string;
          category: { name: string };
        }>
      >,
    getProductByBarcode: (barcode: string) =>
      ipcRenderer.invoke("pos:getProductByBarcode", barcode) as Promise<{
        id: string;
        name: string;
        sku: string;
        barcode: string | null;
        image: string | null;
        sellingPrice: number;
        costPrice: number;
        taxRate: number;
        unit: string;
        stockQuantity: number;
        categoryId: string;
        category: { name: string };
      } | null>,
    searchCustomers: (term: string) =>
      ipcRenderer.invoke("pos:searchCustomers", term) as Promise<
        Array<{ id: string; name: string; code: string; phone: string | null; balance: number }>
      >,
    completeSale: (input: import("./ipc/pos.handler").CompleteSaleRaw) =>
      ipcRenderer.invoke("pos:completeSale", input) as Promise<{
        success: boolean;
        saleId?: string;
        saleNumber?: string;
        error?: string;
      }>,
  },

  // ── Printer ───────────────────────────────────────────────────────────────
  printer: {
    getStatus: () =>
      ipcRenderer.invoke("printer:getStatus") as Promise<
        import("../src/types/printer").PrinterStatusInfo
      >,
    saveConfig: (config: import("../src/types/printer").PrinterConfig) =>
      ipcRenderer.invoke("printer:saveConfig", config) as Promise<
        import("../src/types/printer").PrintResult
      >,
    printReceipt: (data: import("../src/types/printer").ReceiptData) =>
      ipcRenderer.invoke("printer:printReceipt", data) as Promise<
        import("../src/types/printer").PrintResult
      >,
    openCashDrawer: () =>
      ipcRenderer.invoke("printer:openCashDrawer") as Promise<
        import("../src/types/printer").PrintResult
      >,
    testPrint: () =>
      ipcRenderer.invoke("printer:testPrint") as Promise<
        import("../src/types/printer").PrintResult
      >,
    detectPrinters: () =>
      ipcRenderer.invoke("printer:detectPrinters") as Promise<
        import("../src/types/printer").DetectedPrinter[]
      >,
  },

  // ── Database management ───────────────────────────────────────────────────
  database: {
    backup: (targetPath: string) =>
      ipcRenderer.invoke("database:backup", targetPath) as Promise<{
        success: boolean;
        path: string;
      }>,
    getInfo: () =>
      ipcRenderer.invoke("database:getInfo") as Promise<{
        size: number;
        path: string;
        tables: string[];
      }>,
  },
};

contextBridge.exposeInMainWorld("electron", electronAPI);

export type ElectronAPI = typeof electronAPI;
