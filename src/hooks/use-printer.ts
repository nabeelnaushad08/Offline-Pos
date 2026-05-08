"use client";

import { useEffect, useCallback, useState } from "react";
import { isElectron } from "@/lib/utils";
import { printerClient } from "@/lib/ipc-client";
import { usePrinterStore } from "@/store/printer-store";
import type { PrinterConfig, ReceiptData, PrintResult } from "@/types/printer";

// Polls printer status and keeps the Zustand store updated.
// Call this hook in ONE always-mounted component (e.g. the header badge).
export function usePrinterStatusPoller() {
  const { setStatusInfo } = usePrinterStore();

  const refresh = useCallback(async () => {
    if (!isElectron()) return;
    try {
      const info = await printerClient.getStatus();
      setStatusInfo(info);
    } catch {}
  }, [setStatusInfo]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return refresh;
}

// Read-only access to the current printer status (from Zustand store).
export function usePrinterStatus() {
  return usePrinterStore((s) => s.statusInfo);
}

// Full printer hook with actions — use in receipt modal and settings page.
export function usePrinter() {
  const statusInfo = usePrinterStore((s) => s.statusInfo);
  const { setStatusInfo } = usePrinterStore();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!isElectron()) return;
    try {
      const info = await printerClient.getStatus();
      setStatusInfo(info);
    } catch {}
  }, [setStatusInfo]);

  const printReceipt = useCallback(async (data: ReceiptData): Promise<PrintResult> => {
    if (!isElectron()) return { success: false, error: "Not in Electron" };
    setIsPrinting(true);
    try {
      const result = await printerClient.printReceipt(data);
      await refreshStatus();
      return result;
    } finally {
      setIsPrinting(false);
    }
  }, [refreshStatus]);

  const openCashDrawer = useCallback(async (): Promise<PrintResult> => {
    if (!isElectron()) return { success: false, error: "Not in Electron" };
    return printerClient.openCashDrawer();
  }, []);

  const saveConfig = useCallback(async (config: PrinterConfig): Promise<PrintResult> => {
    if (!isElectron()) return { success: false, error: "Not in Electron" };
    setIsSaving(true);
    try {
      const result = await printerClient.saveConfig(config);
      await refreshStatus();
      return result;
    } finally {
      setIsSaving(false);
    }
  }, [refreshStatus]);

  const testPrint = useCallback(async (): Promise<PrintResult> => {
    if (!isElectron()) return { success: false, error: "Not in Electron" };
    return printerClient.testPrint();
  }, []);

  const detectPrinters = useCallback(async () => {
    if (!isElectron()) return [];
    return printerClient.detectPrinters();
  }, []);

  return {
    ...statusInfo,
    isPrinting,
    isSaving,
    printReceipt,
    openCashDrawer,
    saveConfig,
    testPrint,
    detectPrinters,
    refreshStatus,
  };
}
