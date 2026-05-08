import type { ElectronAPI } from "./api";

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
