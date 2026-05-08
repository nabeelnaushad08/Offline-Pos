import type { PrinterConfig, PrinterStatus, PrinterStatusInfo, ReceiptData, PrintResult, DetectedPrinter } from "../../src/types/printer";

// Lazily loaded to avoid crashing if package is missing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ThermalPrinter: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PrinterTypes: any;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ntp = require("node-thermal-printer");
  ThermalPrinter = ntp.ThermalPrinter;
  PrinterTypes = ntp.PrinterTypes;
} catch {
  console.warn("[Printer] node-thermal-printer not available");
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  MOBILE_MONEY: "Mobile Money",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT: "Credit",
  SPLIT: "Cash + Card",
};

function padLeft(str: string, width: number, pad = " "): string {
  return str.length >= width ? str : pad.repeat(width - str.length) + str;
}

function padRight(str: string, width: number): string {
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}

function centerText(str: string, width: number): string {
  const trimmed = str.substring(0, width);
  const padding = Math.max(0, Math.floor((width - trimmed.length) / 2));
  return " ".repeat(padding) + trimmed;
}

export class PrinterManager {
  private static _instance: PrinterManager;
  private _config: PrinterConfig | null = null;
  private _status: PrinterStatus = "offline";
  private _lastError = "";
  private _lastCheckedAt = new Date().toISOString();
  private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _reconnectDelay = 2000;
  private readonly _maxReconnectDelay = 32000;
  private _printing = false;

  private constructor() {}

  static getInstance(): PrinterManager {
    if (!PrinterManager._instance) {
      PrinterManager._instance = new PrinterManager();
    }
    return PrinterManager._instance;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  async initialize(config: PrinterConfig): Promise<void> {
    this._config = config;
    this.stopHeartbeat();
    if (config.enabled && ThermalPrinter) {
      await this._checkStatus();
      this.startHeartbeat();
    }
  }

  shutdown(): void {
    this.stopHeartbeat();
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  }

  // ── Status ─────────────────────────────────────────────────────────────────

  getStatusInfo(): PrinterStatusInfo {
    return {
      status: this._status,
      config: this._config,
      lastError: this._lastError,
      lastCheckedAt: this._lastCheckedAt,
    };
  }

  private async _checkStatus(): Promise<void> {
    if (!this._config?.enabled || !ThermalPrinter) {
      this._setStatus("offline");
      return;
    }
    try {
      const printer = this._createInstance();
      const connected = await printer.isPrinterConnected();
      this._setStatus(connected ? "online" : "offline");
      if (!connected) {
        this._lastError = "Printer not responding";
        this._scheduleReconnect();
      } else {
        this._reconnectDelay = 2000; // reset backoff on success
      }
    } catch (err) {
      this._lastError = err instanceof Error ? err.message : String(err);
      this._setStatus("error");
      this._scheduleReconnect();
    }
    this._lastCheckedAt = new Date().toISOString();
  }

  private _setStatus(s: PrinterStatus): void {
    this._status = s;
  }

  private startHeartbeat(): void {
    this._heartbeatTimer = setInterval(() => {
      this._checkStatus();
    }, 30_000);
  }

  private stopHeartbeat(): void {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
  }

  private _scheduleReconnect(): void {
    if (this._reconnectTimer) return;
    const delay = this._reconnectDelay;
    this._reconnectDelay = Math.min(this._reconnectDelay * 2, this._maxReconnectDelay);
    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer = null;
      await this._checkStatus();
    }, delay);
  }

  // ── Printer Instance Factory ────────────────────────────────────────────────

  private _createInstance() {
    if (!this._config) throw new Error("Printer not configured");
    if (!ThermalPrinter) throw new Error("node-thermal-printer not available");

    const interfaceStr =
      this._config.connection === "network"
        ? `tcp://${this._config.address}:${this._config.port}`
        : this._config.address;

    return new ThermalPrinter({
      type: this._config.modelType === "STAR" ? PrinterTypes.STAR : PrinterTypes.EPSON,
      interface: interfaceStr,
      options: { timeout: 5000 },
    });
  }

  // ── Print Receipt ───────────────────────────────────────────────────────────

  async printReceipt(data: ReceiptData, storeName: string, storeAddress?: string, storePhone?: string, footer?: string): Promise<PrintResult> {
    if (this._printing) return { success: false, error: "Printer is busy" };
    if (!this._config?.enabled) return { success: false, error: "Printer not enabled" };
    if (!ThermalPrinter) return { success: false, error: "Printer library not available" };

    this._printing = true;
    try {
      const printer = this._createInstance();
      const charWidth = this._config.paperWidth === 58 ? 32 : 48;

      printer.clear();

      // ── Store header ──────────────────────────────────────────────────────
      printer.alignCenter();
      printer.setTextDoubleHeight();
      printer.bold(true);
      printer.println(storeName.substring(0, charWidth));
      printer.bold(false);
      printer.setTextNormal();

      if (storeAddress) printer.println(storeAddress.substring(0, charWidth));
      if (storePhone) printer.println(storePhone.substring(0, charWidth));
      printer.drawLine();

      // ── Sale info ─────────────────────────────────────────────────────────
      printer.alignLeft();
      const date = new Date(data.completedAt);
      printer.println(`Receipt: ${data.saleNumber}`);
      printer.println(`Date:    ${date.toLocaleDateString("en-US")} ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`);
      printer.println(`Cashier: ${data.cashierName}`);
      if (data.customerName) printer.println(`Customer: ${data.customerName}`);
      printer.drawLine();

      // ── Items ─────────────────────────────────────────────────────────────
      const priceWidth = 8;
      const nameWidth = charWidth - priceWidth - 1;

      for (const item of data.items) {
        const name = item.name.substring(0, nameWidth);
        const price = `$${item.lineTotal.toFixed(2)}`;
        printer.println(padRight(name, nameWidth) + " " + padLeft(price, priceWidth));
        const detail = `  x${item.quantity} @ $${item.unitPrice.toFixed(2)}`;
        printer.println(detail);
        if (item.itemDiscount > 0) {
          printer.println(`  Disc: -$${item.itemDiscount.toFixed(2)}`);
        }
      }

      printer.drawLine();

      // ── Totals ────────────────────────────────────────────────────────────
      const lw = charWidth - priceWidth - 1;
      printer.println(padRight("Subtotal:", lw) + " " + padLeft(`$${data.subtotal.toFixed(2)}`, priceWidth));
      if (data.discountAmount > 0) {
        printer.println(padRight("Discount:", lw) + " " + padLeft(`-$${data.discountAmount.toFixed(2)}`, priceWidth));
      }
      if (data.taxAmount > 0) {
        printer.println(padRight("Tax:", lw) + " " + padLeft(`$${data.taxAmount.toFixed(2)}`, priceWidth));
      }
      printer.drawLine();
      printer.bold(true);
      printer.println(padRight("TOTAL:", lw) + " " + padLeft(`$${data.grandTotal.toFixed(2)}`, priceWidth));
      printer.bold(false);

      printer.newLine();
      const payLabel = PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod;
      printer.println(padRight(payLabel + ":", lw) + " " + padLeft(`$${data.paidAmount.toFixed(2)}`, priceWidth));
      if (data.changeAmount > 0) {
        printer.println(padRight("Change:", lw) + " " + padLeft(`$${data.changeAmount.toFixed(2)}`, priceWidth));
      }

      printer.drawLine();

      // ── Footer ────────────────────────────────────────────────────────────
      printer.alignCenter();
      printer.println(footer ?? "Thank you for your business!");
      printer.println("Please come again!");

      printer.newLine();
      printer.newLine();
      printer.newLine();
      printer.cut();

      await printer.execute();

      this._setStatus("online");
      this._lastCheckedAt = new Date().toISOString();
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._lastError = msg;
      this._setStatus("error");
      this._scheduleReconnect();
      return { success: false, error: msg };
    } finally {
      this._printing = false;
    }
  }

  // ── Cash Drawer ─────────────────────────────────────────────────────────────

  async openCashDrawer(): Promise<PrintResult> {
    if (!this._config?.enabled) return { success: false, error: "Printer not enabled" };
    if (!this._config.cashDrawer) return { success: false, error: "Cash drawer not configured" };
    if (!ThermalPrinter) return { success: false, error: "Printer library not available" };

    try {
      const printer = this._createInstance();
      printer.clear();
      printer.openCashDrawer();
      await printer.execute();
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._lastError = msg;
      this._setStatus("error");
      this._scheduleReconnect();
      return { success: false, error: msg };
    }
  }

  // ── Test Print ──────────────────────────────────────────────────────────────

  async testPrint(): Promise<PrintResult> {
    if (!this._config?.enabled) return { success: false, error: "Printer not enabled" };
    if (!ThermalPrinter) return { success: false, error: "Printer library not available" };

    try {
      const printer = this._createInstance();
      const charWidth = this._config.paperWidth === 58 ? 32 : 48;

      printer.clear();
      printer.alignCenter();
      printer.setTextDoubleHeight();
      printer.bold(true);
      printer.println("PRINTER TEST");
      printer.bold(false);
      printer.setTextNormal();
      printer.drawLine();
      printer.alignLeft();
      printer.println("Printer: OK");
      printer.println(`Model:   ${this._config.modelType}`);
      printer.println(`Paper:   ${this._config.paperWidth}mm (${charWidth} chars)`);
      printer.println(`Connect: ${this._config.connection.toUpperCase()}`);
      if (this._config.connection === "network") {
        printer.println(`Address: ${this._config.address}:${this._config.port}`);
      } else {
        printer.println(`Device:  ${this._config.address}`);
      }
      printer.drawLine();
      printer.alignCenter();
      printer.println(centerText(new Date().toLocaleString(), charWidth));
      printer.newLine();
      printer.newLine();
      printer.newLine();
      printer.cut();

      await printer.execute();

      this._setStatus("online");
      this._lastCheckedAt = new Date().toISOString();
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._lastError = msg;
      this._setStatus("error");
      this._scheduleReconnect();
      return { success: false, error: msg };
    }
  }

  // ── Auto-Detect USB Printers ────────────────────────────────────────────────

  async detectPrinters(): Promise<DetectedPrinter[]> {
    const { promises: fs } = await import("fs");
    const results: DetectedPrinter[] = [];

    if (process.platform === "win32") {
      for (let i = 0; i <= 4; i++) {
        const path = `//./USB00${i}`;
        try {
          await fs.access(path);
          results.push({ path, label: `USB Printer ${i} (${path})` });
        } catch {}
      }
    } else if (process.platform === "linux") {
      for (let i = 0; i <= 3; i++) {
        const path = `/dev/usb/lp${i}`;
        try {
          await fs.access(path);
          results.push({ path, label: `USB Printer ${i} (${path})` });
        } catch {}
      }
    } else if (process.platform === "darwin") {
      results.push({ path: "/dev/usb/lp0", label: "USB Printer (macOS)" });
    }

    return results;
  }
}
