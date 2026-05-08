export type PrinterStatus = "online" | "offline" | "connecting" | "error";

export interface PrinterConfig {
  enabled: boolean;
  connection: "network" | "usb";
  address: string;    // IP for network, device path for USB
  port: number;       // 9100 for network
  modelType: "EPSON" | "STAR";
  paperWidth: 58 | 80;
  cashDrawer: boolean;
  autoprint: boolean;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  itemDiscount: number;
  lineTotal: number;
}

export interface ReceiptData {
  saleId: string;
  saleNumber: string;
  cashierName: string;
  customerName?: string | null;
  completedAt: string;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
}

export interface PrinterStatusInfo {
  status: PrinterStatus;
  config: PrinterConfig | null;
  lastError: string;
  lastCheckedAt: string;
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

export interface DetectedPrinter {
  path: string;
  label: string;
}

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  enabled: false,
  connection: "network",
  address: "192.168.1.100",
  port: 9100,
  modelType: "EPSON",
  paperWidth: 80,
  cashDrawer: true,
  autoprint: false,
};
