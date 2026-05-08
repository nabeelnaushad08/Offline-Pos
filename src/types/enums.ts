// Application-level enum constants.
// SQLite does not support native Prisma enums; these types enforce valid
// string values at compile-time while staying compatible with the DB schema.

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const SaleStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  VOIDED: "VOIDED",
  REFUNDED: "REFUNDED",
} as const;
export type SaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus];

export const PaymentMethod = {
  CASH: "CASH",
  CARD: "CARD",
  MOBILE_MONEY: "MOBILE_MONEY",
  BANK_TRANSFER: "BANK_TRANSFER",
  CREDIT: "CREDIT",
  SPLIT: "SPLIT",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PurchaseStatus = {
  DRAFT: "DRAFT",
  ORDERED: "ORDERED",
  PARTIAL: "PARTIAL",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
} as const;
export type PurchaseStatus = (typeof PurchaseStatus)[keyof typeof PurchaseStatus];

export const MovementType = {
  OPENING_STOCK: "OPENING_STOCK",
  PURCHASE: "PURCHASE",
  SALE: "SALE",
  SALE_RETURN: "SALE_RETURN",
  PURCHASE_RETURN: "PURCHASE_RETURN",
  ADJUSTMENT_IN: "ADJUSTMENT_IN",
  ADJUSTMENT_OUT: "ADJUSTMENT_OUT",
  TRANSFER: "TRANSFER",
} as const;
export type MovementType = (typeof MovementType)[keyof typeof MovementType];

export const ProductStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  DISCONTINUED: "DISCONTINUED",
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const PrinterType = {
  RECEIPT: "RECEIPT",
  LABEL: "LABEL",
  REPORT: "REPORT",
  KITCHEN: "KITCHEN",
} as const;
export type PrinterType = (typeof PrinterType)[keyof typeof PrinterType];

export const PrinterConnection = {
  USB: "usb",
  NETWORK: "network",
  BLUETOOTH: "bluetooth",
} as const;
export type PrinterConnection = (typeof PrinterConnection)[keyof typeof PrinterConnection];

export const ActivityAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  SALE_COMPLETE: "SALE_COMPLETE",
  SALE_VOID: "SALE_VOID",
  SALE_REFUND: "SALE_REFUND",
  PURCHASE_RECEIVE: "PURCHASE_RECEIVE",
  STOCK_ADJUST: "STOCK_ADJUST",
  PRINT: "PRINT",
  BACKUP: "BACKUP",
  RESTORE: "RESTORE",
  SETTINGS_CHANGE: "SETTINGS_CHANGE",
} as const;
export type ActivityAction = (typeof ActivityAction)[keyof typeof ActivityAction];

export const SettingGroup = {
  GENERAL: "general",
  POS: "pos",
  RECEIPT: "receipt",
  INVENTORY: "inventory",
  BACKUP: "backup",
} as const;
export type SettingGroup = (typeof SettingGroup)[keyof typeof SettingGroup];

// Role names (may be extended by users; system roles are protected)
export const SystemRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
  INVENTORY_CLERK: "INVENTORY_CLERK",
} as const;
export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];
