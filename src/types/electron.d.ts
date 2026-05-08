// Augment the global Window interface with the Electron IPC bridge
import type { ElectronAPI } from "./api";

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
