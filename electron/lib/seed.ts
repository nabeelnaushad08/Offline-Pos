import { getDb } from "./db";
import crypto from "crypto";

/**
 * Seeds the minimum required data for a fresh installation:
 *   - System roles (ADMIN, MANAGER, CASHIER)
 *   - Default admin user (admin / Admin@123)
 *   - Root product categories
 *   - Default system settings
 *
 * Called once on first launch in production (guarded by .initialized flag).
 * In development, use `npm run db:seed` which runs prisma/seed.ts instead.
 */
export async function seedDefaultData(): Promise<void> {
  const db = getDb();

  try {
    // Skip if roles already exist (idempotent guard)
    const existing = await db.role.count();
    if (existing > 0) {
      console.log("[Seed] Data already seeded, skipping");
      return;
    }

    console.log("[Seed] Seeding default data…");

    const ALL_PERMISSIONS = [
      "dashboard:view",
      "pos:open", "pos:discount", "pos:void_sale", "pos:refund", "pos:reprint",
      "products:view", "products:create", "products:update", "products:delete",
      "inventory:view", "inventory:adjust", "inventory:purchase",
      "customers:view", "customers:create", "customers:update",
      "reports:view",
      "settings:view", "settings:edit",
      "users:view", "users:create", "users:update", "users:delete",
      "backup:create", "backup:restore",
    ];

    // ── Roles ─────────────────────────────────────────────────────────────────
    const adminRole = await db.role.create({
      data: {
        name: "ADMIN",
        displayName: "Administrator",
        permissions: JSON.stringify(ALL_PERMISSIONS),
        isSystem: true,
      },
    });

    await db.role.create({
      data: {
        name: "MANAGER",
        displayName: "Manager",
        permissions: JSON.stringify(ALL_PERMISSIONS.filter((p) => !p.startsWith("users:"))),
        isSystem: true,
      },
    });

    await db.role.create({
      data: {
        name: "CASHIER",
        displayName: "Cashier",
        permissions: JSON.stringify(["dashboard:view", "pos:open", "pos:discount", "customers:view"]),
        isSystem: true,
      },
    });

    // ── Admin user ────────────────────────────────────────────────────────────
    // Hash "Admin@123" using bcryptjs — we avoid the full bcrypt dep here and
    // use a pre-computed hash to avoid bundling issues. Change via Settings.
    const bcrypt = await importBcrypt();
    const adminHash = bcrypt
      ? await bcrypt.hash("Admin@123", 10)
      : hashFallback("Admin@123");

    await db.user.create({
      data: {
        username: "admin",
        fullName: "System Admin",
        passwordHash: adminHash,
        roleId: adminRole.id,
        status: "ACTIVE",
      },
    });

    // ── Default categories ────────────────────────────────────────────────────
    const rootCategories = [
      { name: "General", slug: "general", sortOrder: 0 },
      { name: "Food & Beverages", slug: "food-beverages", sortOrder: 1 },
      { name: "Electronics", slug: "electronics", sortOrder: 2 },
      { name: "Clothing", slug: "clothing", sortOrder: 3 },
    ];

    for (const cat of rootCategories) {
      await db.category.create({ data: { ...cat, isActive: true } });
    }

    // ── Default settings ──────────────────────────────────────────────────────
    const defaults = [
      { key: "store.name",          value: "My Store",                        group: "store",   label: "Store Name" },
      { key: "store.address",       value: "",                                group: "store",   label: "Address" },
      { key: "store.phone",         value: "",                                group: "store",   label: "Phone" },
      { key: "store.receiptFooter", value: "Thank you for your business!",    group: "store",   label: "Receipt Footer" },
      { key: "pos.taxRate",         value: "0",                               group: "pos",     label: "Default Tax Rate (%)" },
      { key: "pos.currency",        value: "USD",                             group: "pos",     label: "Currency" },
      { key: "backup.schedule.enabled",   value: "false",  group: "backup", label: "enabled" },
      { key: "backup.schedule.frequency", value: "daily",  group: "backup", label: "frequency" },
      { key: "backup.schedule.keepCount", value: "10",     group: "backup", label: "keepCount" },
    ];

    for (const s of defaults) {
      await db.setting.upsert({
        where: { key: s.key },
        update: {},
        create: s,
      });
    }

    console.log("[Seed] Default data seeded successfully");
  } catch (err) {
    console.error("[Seed] Failed:", err);
  }
}

async function importBcrypt() {
  try {
    const b = await import("bcryptjs");
    return b.default ?? b;
  } catch {
    return null;
  }
}

function hashFallback(password: string): string {
  // Simple SHA-256 fallback if bcrypt isn't available — NOT secure for production
  // This should never happen since bcryptjs is a dependency
  return crypto.createHash("sha256").update(password).digest("hex");
}
