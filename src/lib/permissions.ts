// Permission helper utilities — all checks are pure functions over a string[]

export function can(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

export function canAny(permissions: string[], required: string[]): boolean {
  return required.some((p) => permissions.includes(p));
}

export function canAll(permissions: string[], required: string[]): boolean {
  return required.every((p) => permissions.includes(p));
}

// ── Domain shortcuts ──────────────────────────────────────────────────────────

export const Permission = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard:view",

  // POS
  POS_OPEN: "pos:open",
  POS_DISCOUNT: "pos:discount",
  POS_VOID_SALE: "pos:void_sale",
  POS_REFUND: "pos:refund",
  POS_REPRINT: "pos:reprint",

  // Products
  PRODUCTS_VIEW: "products:view",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_UPDATE: "products:update",
  PRODUCTS_DELETE: "products:delete",

  // Inventory
  INVENTORY_VIEW: "inventory:view",
  INVENTORY_ADJUST: "inventory:adjust",
  INVENTORY_TRANSFER: "inventory:transfer",

  // Customers
  CUSTOMERS_VIEW: "customers:view",
  CUSTOMERS_MANAGE: "customers:manage",

  // Suppliers
  SUPPLIERS_MANAGE: "suppliers:manage",

  // Purchases
  PURCHASES_VIEW: "purchases:view",
  PURCHASES_CREATE: "purchases:create",
  PURCHASES_RECEIVE: "purchases:receive",
  PURCHASES_DELETE: "purchases:delete",

  // Reports
  REPORTS_SALES: "reports:sales",
  REPORTS_INVENTORY: "reports:inventory",
  REPORTS_FINANCIAL: "reports:financial",
  REPORTS_EXPORT: "reports:export",

  // Users & Roles
  USERS_VIEW: "users:view",
  USERS_MANAGE: "users:manage",
  ROLES_MANAGE: "roles:manage",

  // Settings
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",

  // Printers
  PRINTERS_MANAGE: "printers:manage",

  // Backup
  BACKUP_CREATE: "backup:create",
  BACKUP_RESTORE: "backup:restore",

  // Activity
  ACTIVITY_VIEW: "activity:view",
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];
