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
