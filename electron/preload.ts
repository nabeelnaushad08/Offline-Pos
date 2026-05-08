import { contextBridge, ipcRenderer } from "electron";

// Expose a type-safe, minimal surface area to the renderer process
const electronAPI = {
  invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> =>
    ipcRenderer.invoke(channel, ...args) as Promise<T>,

  // App info
  app: {
    getVersion: () => ipcRenderer.invoke("app:getVersion") as Promise<string>,
    getPlatform: () => ipcRenderer.invoke("app:getPlatform") as Promise<string>,
    getDataPath: () => ipcRenderer.invoke("app:getDataPath") as Promise<string>,
  },

  // Settings
  settings: {
    get: (key: string) =>
      ipcRenderer.invoke("settings:get", key) as Promise<{ id: string; key: string; value: string } | null>,
    set: (key: string, value: string) =>
      ipcRenderer.invoke("settings:set", key, value) as Promise<{ id: string; key: string; value: string }>,
    getAll: () =>
      ipcRenderer.invoke("settings:getAll") as Promise<Array<{ id: string; key: string; value: string }>>,
    delete: (key: string) =>
      ipcRenderer.invoke("settings:delete", key) as Promise<void>,
  },

  // Database management
  database: {
    backup: (targetPath: string) =>
      ipcRenderer.invoke("database:backup", targetPath) as Promise<{ success: boolean; path: string }>,
    getInfo: () =>
      ipcRenderer.invoke("database:getInfo") as Promise<{ size: number; path: string; tables: string[] }>,
  },
};

contextBridge.exposeInMainWorld("electron", electronAPI);

export type ElectronAPI = typeof electronAPI;
