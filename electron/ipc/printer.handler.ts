import { ipcMain } from "electron";
import { getDb } from "../lib/db";
import { PrinterManager } from "../lib/printer-manager";
import type { PrinterConfig, ReceiptData } from "../../src/types/printer";

const SETTINGS_KEYS = {
  ENABLED: "printer.enabled",
  CONNECTION: "printer.connection",
  ADDRESS: "printer.address",
  PORT: "printer.port",
  MODEL_TYPE: "printer.modelType",
  PAPER_WIDTH: "printer.paperWidth",
  CASH_DRAWER: "printer.cashDrawer",
  AUTOPRINT: "printer.autoprint",
} as const;

async function loadConfigFromDb(): Promise<PrinterConfig | null> {
  const db = getDb();
  const rows = await db.setting.findMany({
    where: { key: { startsWith: "printer." } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  if (!map.has(SETTINGS_KEYS.ENABLED)) return null;

  return {
    enabled: map.get(SETTINGS_KEYS.ENABLED) === "true",
    connection: (map.get(SETTINGS_KEYS.CONNECTION) as "network" | "usb") ?? "network",
    address: map.get(SETTINGS_KEYS.ADDRESS) ?? "192.168.1.100",
    port: parseInt(map.get(SETTINGS_KEYS.PORT) ?? "9100", 10),
    modelType: (map.get(SETTINGS_KEYS.MODEL_TYPE) as "EPSON" | "STAR") ?? "EPSON",
    paperWidth: (parseInt(map.get(SETTINGS_KEYS.PAPER_WIDTH) ?? "80", 10) as 58 | 80),
    cashDrawer: map.get(SETTINGS_KEYS.CASH_DRAWER) !== "false",
    autoprint: map.get(SETTINGS_KEYS.AUTOPRINT) === "true",
  };
}

async function saveConfigToDb(config: PrinterConfig): Promise<void> {
  const db = getDb();
  const upsert = (key: string, value: string) =>
    db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group: "printer", label: key.replace("printer.", "") },
    });

  await Promise.all([
    upsert(SETTINGS_KEYS.ENABLED, String(config.enabled)),
    upsert(SETTINGS_KEYS.CONNECTION, config.connection),
    upsert(SETTINGS_KEYS.ADDRESS, config.address),
    upsert(SETTINGS_KEYS.PORT, String(config.port)),
    upsert(SETTINGS_KEYS.MODEL_TYPE, config.modelType),
    upsert(SETTINGS_KEYS.PAPER_WIDTH, String(config.paperWidth)),
    upsert(SETTINGS_KEYS.CASH_DRAWER, String(config.cashDrawer)),
    upsert(SETTINGS_KEYS.AUTOPRINT, String(config.autoprint)),
  ]);
}

async function loadStoreSettings(): Promise<{ name: string; address: string; phone: string; footer: string }> {
  const db = getDb();
  const rows = await db.setting.findMany({
    where: { key: { startsWith: "store." } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    name: map.get("store.name") ?? "My Store",
    address: map.get("store.address") ?? "",
    phone: map.get("store.phone") ?? "",
    footer: map.get("store.receiptFooter") ?? "Thank you for your business!",
  };
}

export async function registerPrinterHandlers(): Promise<void> {
  const manager = PrinterManager.getInstance();

  // Load saved config and initialize on startup
  const savedConfig = await loadConfigFromDb();
  if (savedConfig) {
    await manager.initialize(savedConfig);
  }

  // ── Get Status ──────────────────────────────────────────────────────────────
  ipcMain.handle("printer:getStatus", () => manager.getStatusInfo());

  // ── Save Config ─────────────────────────────────────────────────────────────
  ipcMain.handle("printer:saveConfig", async (_, config: PrinterConfig) => {
    try {
      await saveConfigToDb(config);
      await manager.initialize(config);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  // ── Print Receipt ───────────────────────────────────────────────────────────
  ipcMain.handle("printer:printReceipt", async (_, data: ReceiptData) => {
    const store = await loadStoreSettings();
    return manager.printReceipt(data, store.name, store.address || undefined, store.phone || undefined, store.footer || undefined);
  });

  // ── Open Cash Drawer ────────────────────────────────────────────────────────
  ipcMain.handle("printer:openCashDrawer", () => manager.openCashDrawer());

  // ── Test Print ──────────────────────────────────────────────────────────────
  ipcMain.handle("printer:testPrint", () => manager.testPrint());

  // ── Detect USB Printers ─────────────────────────────────────────────────────
  ipcMain.handle("printer:detectPrinters", () => manager.detectPrinters());
}
