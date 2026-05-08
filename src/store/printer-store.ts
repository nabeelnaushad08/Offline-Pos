import { create } from "zustand";
import type { PrinterStatusInfo } from "@/types/printer";

interface PrinterStore {
  statusInfo: PrinterStatusInfo;
  setStatusInfo: (info: PrinterStatusInfo) => void;
}

const DEFAULT: PrinterStatusInfo = {
  status: "offline",
  config: null,
  lastError: "",
  lastCheckedAt: new Date().toISOString(),
};

export const usePrinterStore = create<PrinterStore>((set) => ({
  statusInfo: DEFAULT,
  setStatusInfo: (statusInfo) => set({ statusInfo }),
}));
