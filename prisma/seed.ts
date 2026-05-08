/**
 * Prisma seed — bootstraps the database with:
 *   • 3 system roles (ADMIN, MANAGER, CASHIER)
 *   • 1 admin user  (username: admin / password: Admin@123)
 *   • Root categories
 *   • Default system settings
 *   • Default printer record
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const BCRYPT_ROUNDS = 10;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function hashPassword(input: string): Promise<string> {
  return bcrypt.hash(input, BCRYPT_ROUNDS);
}

function jsonPerms(perms: string[]): string {
  return JSON.stringify(perms);
}

// ── Permission constants ──────────────────────────────────────────────────────

const ALL_PERMISSIONS = [
  "dashboard:view",
  "pos:open",
  "pos:discount",
  "pos:void_sale",
  "pos:refund",
  "pos:reprint",
  "products:view",
  "products:create",
  "products:update",
  "products:delete",
  "categories:manage",
  "suppliers:manage",
  "customers:view",
  "customers:manage",
  "inventory:view",
  "inventory:adjust",
  "inventory:transfer",
  "purchases:view",
  "purchases:create",
  "purchases:receive",
  "purchases:delete",
  "reports:sales",
  "reports:inventory",
  "reports:financial",
  "reports:export",
  "settings:view",
  "settings:manage",
  "users:view",
  "users:manage",
  "roles:manage",
  "printers:manage",
  "backup:create",
  "backup:restore",
  "activity:view",
];

const MANAGER_PERMISSIONS = [
  "dashboard:view",
  "pos:open",
  "pos:discount",
  "pos:void_sale",
  "pos:refund",
  "pos:reprint",
  "products:view",
  "products:create",
  "products:update",
  "categories:manage",
  "suppliers:manage",
  "customers:view",
  "customers:manage",
  "inventory:view",
  "inventory:adjust",
  "purchases:view",
  "purchases:create",
  "purchases:receive",
  "reports:sales",
  "reports:inventory",
  "reports:financial",
  "printers:manage",
  "backup:create",
  "activity:view",
];

const CASHIER_PERMISSIONS = [
  "dashboard:view",
  "pos:open",
  "pos:reprint",
  "products:view",
  "customers:view",
  "customers:manage",
  "inventory:view",
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding database…\n");

  // ── Roles ────────────────────────────────────────────────────────────────
  console.log("  Creating roles…");

  const adminRole = await db.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      displayName: "Administrator",
      permissions: jsonPerms(ALL_PERMISSIONS),
      isSystem: true,
    },
  });

  const managerRole = await db.role.upsert({
    where: { name: "MANAGER" },
    update: {},
    create: {
      name: "MANAGER",
      displayName: "Manager",
      permissions: jsonPerms(MANAGER_PERMISSIONS),
      isSystem: true,
    },
  });

  await db.role.upsert({
    where: { name: "CASHIER" },
    update: {},
    create: {
      name: "CASHIER",
      displayName: "Cashier",
      permissions: jsonPerms(CASHIER_PERMISSIONS),
      isSystem: true,
    },
  });

  await db.role.upsert({
    where: { name: "INVENTORY_CLERK" },
    update: {},
    create: {
      name: "INVENTORY_CLERK",
      displayName: "Inventory Clerk",
      permissions: jsonPerms([
        "dashboard:view",
        "products:view",
        "products:create",
        "products:update",
        "categories:manage",
        "suppliers:manage",
        "inventory:view",
        "inventory:adjust",
        "purchases:view",
        "purchases:create",
        "purchases:receive",
      ]),
      isSystem: false,
    },
  });

  console.log("  ✓ Roles created");

  // ── Users ─────────────────────────────────────────────────────────────────
  console.log("  Creating users…");

  await db.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@offlinepos.local",
      passwordHash: await hashPassword("Admin@123"),
      fullName: "System Administrator",
      status: "ACTIVE",
      roleId: adminRole.id,
    },
  });

  await db.user.upsert({
    where: { username: "manager" },
    update: {},
    create: {
      username: "manager",
      email: "manager@offlinepos.local",
      passwordHash: await hashPassword("Manager@123"),
      fullName: "Store Manager",
      status: "ACTIVE",
      roleId: managerRole.id,
    },
  });

  console.log("  ✓ Users created");

  // ── Categories ────────────────────────────────────────────────────────────
  console.log("  Creating categories…");

  const categoryData = [
    { name: "Food & Beverage", slug: "food-beverage", sortOrder: 1 },
    { name: "Electronics", slug: "electronics", sortOrder: 2 },
    { name: "Clothing", slug: "clothing", sortOrder: 3 },
    { name: "Health & Beauty", slug: "health-beauty", sortOrder: 4 },
    { name: "Home & Living", slug: "home-living", sortOrder: 5 },
    { name: "Stationery", slug: "stationery", sortOrder: 6 },
    { name: "Toys & Games", slug: "toys-games", sortOrder: 7 },
    { name: "Other", slug: "other", sortOrder: 99 },
  ];

  for (const cat of categoryData) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log("  ✓ Categories created");

  // ── Default customer ──────────────────────────────────────────────────────
  console.log("  Creating walk-in customer…");

  await db.customer.upsert({
    where: { code: "WALKIN" },
    update: {},
    create: {
      name: "Walk-in Customer",
      code: "WALKIN",
      isActive: true,
    },
  });

  console.log("  ✓ Walk-in customer created");

  // ── Settings ──────────────────────────────────────────────────────────────
  console.log("  Creating default settings…");

  const settings: Array<{
    key: string;
    value: string;
    group: string;
    label: string;
    isPublic: boolean;
  }> = [
    // General
    { key: "store.name", value: "My Store", group: "general", label: "Store Name", isPublic: true },
    { key: "store.address", value: "", group: "general", label: "Store Address", isPublic: true },
    { key: "store.phone", value: "", group: "general", label: "Store Phone", isPublic: true },
    { key: "store.email", value: "", group: "general", label: "Store Email", isPublic: true },
    { key: "store.taxNumber", value: "", group: "general", label: "Tax/VAT Number", isPublic: true },
    { key: "store.currency", value: "USD", group: "general", label: "Currency Code", isPublic: true },
    { key: "store.currencySymbol", value: "$", group: "general", label: "Currency Symbol", isPublic: true },
    { key: "store.locale", value: "en-US", group: "general", label: "Locale", isPublic: true },
    { key: "store.timezone", value: "UTC", group: "general", label: "Timezone", isPublic: true },
    // POS
    { key: "pos.defaultTaxRate", value: "0", group: "pos", label: "Default Tax Rate (%)", isPublic: true },
    { key: "pos.taxInclusive", value: "false", group: "pos", label: "Tax Inclusive Pricing", isPublic: true },
    { key: "pos.enableDiscount", value: "true", group: "pos", label: "Enable Discounts", isPublic: true },
    { key: "pos.maxDiscountPercent", value: "100", group: "pos", label: "Max Discount (%)", isPublic: false },
    { key: "pos.requireCustomer", value: "false", group: "pos", label: "Require Customer on Sale", isPublic: true },
    { key: "pos.autoOpenCashDrawer", value: "false", group: "pos", label: "Auto-Open Cash Drawer", isPublic: true },
    { key: "pos.salePrefixFormat", value: "SAL-{YYYYMMDD}-{NNNN}", group: "pos", label: "Sale Number Format", isPublic: false },
    { key: "pos.purchasePrefixFormat", value: "PO-{YYYYMMDD}-{NNNN}", group: "pos", label: "Purchase Number Format", isPublic: false },
    // Receipt
    { key: "receipt.header", value: "", group: "receipt", label: "Receipt Header Text", isPublic: true },
    { key: "receipt.footer", value: "Thank you for your business!", group: "receipt", label: "Receipt Footer Text", isPublic: true },
    { key: "receipt.showLogo", value: "false", group: "receipt", label: "Show Logo on Receipt", isPublic: true },
    { key: "receipt.showTaxBreakdown", value: "true", group: "receipt", label: "Show Tax Breakdown", isPublic: true },
    // Inventory
    { key: "inventory.enableLowStockAlerts", value: "true", group: "inventory", label: "Enable Low Stock Alerts", isPublic: true },
    { key: "inventory.defaultUnit", value: "pcs", group: "inventory", label: "Default Unit", isPublic: true },
    // Backup
    { key: "backup.autoBackup", value: "true", group: "backup", label: "Enable Auto Backup", isPublic: false },
    { key: "backup.intervalHours", value: "24", group: "backup", label: "Backup Interval (hours)", isPublic: false },
    { key: "backup.retainDays", value: "30", group: "backup", label: "Retain Backups (days)", isPublic: false },
    { key: "backup.path", value: "", group: "backup", label: "Backup Destination Path", isPublic: false },
  ];

  for (const s of settings) {
    await db.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log("  ✓ Settings created");

  // ── Printer ───────────────────────────────────────────────────────────────
  console.log("  Creating default printer record…");

  const existingPrinter = await db.printer.findFirst({ where: { isDefault: true } });
  if (!existingPrinter) {
    await db.printer.create({
      data: {
        name: "Default Receipt Printer",
        type: "RECEIPT",
        connection: "usb",
        paperWidth: 80,
        isDefault: true,
        isActive: true,
      },
    });
  }

  console.log("  ✓ Printer created");

  console.log("\n✅  Seed complete.\n");
  console.log("  Default credentials (bcrypt-hashed):");
  console.log("    admin   / Admin@123");
  console.log("    manager / Manager@123");
  console.log("\n  ⚠️  Change these passwords immediately after first login.\n");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
