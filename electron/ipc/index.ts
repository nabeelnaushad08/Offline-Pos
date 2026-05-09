import { ipcMain, app } from "electron";
import path from "path";
import fs from "fs";
import { getDb } from "../lib/db";
import { registerAuthHandlers } from "./auth.handler";
import { registerDashboardHandlers } from "./dashboard.handler";
import { registerPosHandlers } from "./pos.handler";
import { registerInventoryHandlers } from "./inventory.handler";
import { registerReportsHandlers } from "./reports.handler";
import { registerPrinterHandlers } from "./printer.handler";
import { registerBackupHandlers } from "./backup.handler";

export async function registerIpcHandlers(): Promise<void> {
  registerAuthHandlers();
  registerDashboardHandlers();
  registerPosHandlers();
  registerInventoryHandlers();
  registerReportsHandlers();
  await registerPrinterHandlers();
  await registerBackupHandlers();
  const db = getDb();

  // ── App ───────────────────────────────────────────────────────────────────
  ipcMain.handle("app:getVersion", () => app.getVersion());
  ipcMain.handle("app:getPlatform", () => process.platform);
  ipcMain.handle("app:getDataPath", () => app.getPath("userData"));

  // ── Settings ──────────────────────────────────────────────────────────────
  ipcMain.handle("settings:get", (_, key: string) =>
    db.setting.findUnique({ where: { key } })
  );

  ipcMain.handle("settings:set", (_, key: string, value: string, meta?: { group?: string; label?: string }) =>
    db.setting.upsert({
      where: { key },
      update: { value, ...meta },
      create: { key, value, group: meta?.group ?? "general", label: meta?.label },
    })
  );

  ipcMain.handle("settings:getAll", (_, group?: string) =>
    db.setting.findMany({
      where: group ? { group } : undefined,
      orderBy: [{ group: "asc" }, { key: "asc" }],
    })
  );

  ipcMain.handle("settings:delete", (_, key: string) =>
    db.setting.delete({ where: { key } })
  );

  // ── Database management ───────────────────────────────────────────────────
  ipcMain.handle("database:backup", async (_, targetPath?: string) => {
    const dbPath = path.join(
      process.env.NODE_ENV === "development"
        ? path.join(process.cwd(), "database")
        : path.join(app.getPath("userData"), "database"),
      "pos.db"
    );
    const dest =
      targetPath ||
      path.join(
        process.cwd(),
        "backups",
        `pos-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.db`
      );
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(dbPath, dest);
    return { success: true, path: dest };
  });

  ipcMain.handle("database:getInfo", async () => {
    const dbPath = path.join(
      process.env.NODE_ENV === "development"
        ? path.join(process.cwd(), "database")
        : path.join(app.getPath("userData"), "database"),
      "pos.db"
    );
    const stat = fs.existsSync(dbPath) ? fs.statSync(dbPath) : null;
    const tables = await db.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE '_prisma_%'
      ORDER BY name
    `;
    return { size: stat?.size ?? 0, path: dbPath, tables: tables.map((t) => t.name) };
  });

  // ── Roles ─────────────────────────────────────────────────────────────────
  ipcMain.handle("roles:list", () =>
    db.role.findMany({ orderBy: { name: "asc" } })
  );

  ipcMain.handle("roles:get", (_, id: string) =>
    db.role.findUnique({ where: { id } })
  );

  // ── Users ─────────────────────────────────────────────────────────────────
  ipcMain.handle("users:list", () =>
    db.user.findMany({ include: { role: true }, orderBy: { fullName: "asc" } })
  );

  ipcMain.handle("users:get", (_, id: string) =>
    db.user.findUnique({ where: { id }, include: { role: true } })
  );

  ipcMain.handle("users:getByUsername", (_, username: string) =>
    db.user.findUnique({ where: { username }, include: { role: true } })
  );

  ipcMain.handle(
    "users:create",
    (_, data: Parameters<typeof db.user.create>[0]["data"]) =>
      db.user.create({ data, include: { role: true } })
  );

  ipcMain.handle(
    "users:update",
    (_, id: string, data: Parameters<typeof db.user.update>[0]["data"]) =>
      db.user.update({ where: { id }, data, include: { role: true } })
  );

  ipcMain.handle("users:delete", (_, id: string) =>
    db.user.delete({ where: { id } })
  );

  // ── Categories ────────────────────────────────────────────────────────────
  ipcMain.handle("categories:list", () =>
    db.category.findMany({
      where: { isActive: true },
      include: { children: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })
  );

  ipcMain.handle("categories:get", (_, id: string) =>
    db.category.findUnique({ where: { id }, include: { children: true, parent: true } })
  );

  ipcMain.handle(
    "categories:create",
    (_, data: Parameters<typeof db.category.create>[0]["data"]) =>
      db.category.create({ data })
  );

  ipcMain.handle(
    "categories:update",
    (_, id: string, data: Parameters<typeof db.category.update>[0]["data"]) =>
      db.category.update({ where: { id }, data })
  );

  ipcMain.handle("categories:delete", (_, id: string) =>
    db.category.delete({ where: { id } })
  );

  // ── Suppliers ─────────────────────────────────────────────────────────────
  ipcMain.handle("suppliers:list", () =>
    db.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  );

  ipcMain.handle("suppliers:get", (_, id: string) =>
    db.supplier.findUnique({ where: { id } })
  );

  ipcMain.handle(
    "suppliers:create",
    (_, data: Parameters<typeof db.supplier.create>[0]["data"]) =>
      db.supplier.create({ data })
  );

  ipcMain.handle(
    "suppliers:update",
    (_, id: string, data: Parameters<typeof db.supplier.update>[0]["data"]) =>
      db.supplier.update({ where: { id }, data })
  );

  // ── Products ──────────────────────────────────────────────────────────────
  ipcMain.handle(
    "products:list",
    (
      _,
      filters?: { categoryId?: string; supplierId?: string; status?: string; lowStock?: boolean }
    ) =>
      db.product.findMany({
        where: {
          status: filters?.status ?? "ACTIVE",
          ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
          ...(filters?.supplierId ? { supplierId: filters.supplierId } : {}),
        },
        include: { category: true, supplier: true },
        orderBy: { name: "asc" },
      })
  );

  ipcMain.handle("products:get", (_, id: string) =>
    db.product.findUnique({ where: { id }, include: { category: true, supplier: true } })
  );

  ipcMain.handle("products:getByBarcode", (_, barcode: string) =>
    db.product.findUnique({ where: { barcode }, include: { category: true } })
  );

  ipcMain.handle("products:getBySku", (_, sku: string) =>
    db.product.findUnique({ where: { sku }, include: { category: true } })
  );

  ipcMain.handle(
    "products:create",
    (_, data: Parameters<typeof db.product.create>[0]["data"]) =>
      db.product.create({ data, include: { category: true } })
  );

  ipcMain.handle(
    "products:update",
    (_, id: string, data: Parameters<typeof db.product.update>[0]["data"]) =>
      db.product.update({ where: { id }, data, include: { category: true } })
  );

  ipcMain.handle("products:delete", (_, id: string) =>
    db.product.delete({ where: { id } })
  );

  // ── Customers ─────────────────────────────────────────────────────────────
  ipcMain.handle("customers:list", () =>
    db.customer.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  );

  ipcMain.handle("customers:get", (_, id: string) =>
    db.customer.findUnique({ where: { id } })
  );

  ipcMain.handle("customers:search", (_, term: string) =>
    db.customer.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: term } },
          { phone: { contains: term } },
          { code: { contains: term } },
          { email: { contains: term } },
        ],
      },
      take: 20,
    })
  );

  ipcMain.handle(
    "customers:create",
    (_, data: Parameters<typeof db.customer.create>[0]["data"]) =>
      db.customer.create({ data })
  );

  ipcMain.handle(
    "customers:update",
    (_, id: string, data: Parameters<typeof db.customer.update>[0]["data"]) =>
      db.customer.update({ where: { id }, data })
  );

  // ── Sales ─────────────────────────────────────────────────────────────────
  ipcMain.handle(
    "sales:list",
    (_, filters?: { status?: string; userId?: string; from?: string; to?: string; limit?: number }) =>
      db.sale.findMany({
        where: {
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.userId ? { userId: filters.userId } : {}),
          ...(filters?.from || filters?.to
            ? {
                createdAt: {
                  ...(filters.from ? { gte: new Date(filters.from) } : {}),
                  ...(filters.to ? { lte: new Date(filters.to) } : {}),
                },
              }
            : {}),
        },
        include: { items: true, customer: true, user: true },
        orderBy: { createdAt: "desc" },
        take: filters?.limit ?? 100,
      })
  );

  ipcMain.handle("sales:get", (_, id: string) =>
    db.sale.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, customer: true, user: true },
    })
  );

  ipcMain.handle(
    "sales:create",
    (_, data: Parameters<typeof db.sale.create>[0]["data"]) =>
      db.sale.create({ data, include: { items: true } })
  );

  ipcMain.handle(
    "sales:update",
    (_, id: string, data: Parameters<typeof db.sale.update>[0]["data"]) =>
      db.sale.update({ where: { id }, data, include: { items: true } })
  );

  // ── Purchases ─────────────────────────────────────────────────────────────
  ipcMain.handle(
    "purchases:list",
    (_, filters?: { status?: string; supplierId?: string; limit?: number }) =>
      db.purchase.findMany({
        where: {
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.supplierId ? { supplierId: filters.supplierId } : {}),
        },
        include: { supplier: true, createdBy: true },
        orderBy: { createdAt: "desc" },
        take: filters?.limit ?? 100,
      })
  );

  ipcMain.handle("purchases:get", (_, id: string) =>
    db.purchase.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, supplier: true, createdBy: true, receivedBy: true },
    })
  );

  ipcMain.handle(
    "purchases:create",
    (_, data: Parameters<typeof db.purchase.create>[0]["data"]) =>
      db.purchase.create({ data, include: { items: true, supplier: true } })
  );

  ipcMain.handle(
    "purchases:update",
    (_, id: string, data: Parameters<typeof db.purchase.update>[0]["data"]) =>
      db.purchase.update({ where: { id }, data, include: { items: true } })
  );

  // ── Stock Movements ───────────────────────────────────────────────────────
  ipcMain.handle(
    "stock:movements",
    (_, productId: string, limit = 50) =>
      db.stockMovement.findMany({
        where: { productId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
  );

  ipcMain.handle(
    "stock:create",
    (_, data: Parameters<typeof db.stockMovement.create>[0]["data"]) =>
      db.stockMovement.create({ data })
  );

  // ── Printers ──────────────────────────────────────────────────────────────
  ipcMain.handle("printers:list", () =>
    db.printer.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  );

  ipcMain.handle("printers:getDefault", () =>
    db.printer.findFirst({ where: { isDefault: true, isActive: true } })
  );

  ipcMain.handle(
    "printers:create",
    (_, data: Parameters<typeof db.printer.create>[0]["data"]) =>
      db.printer.create({ data })
  );

  ipcMain.handle(
    "printers:update",
    (_, id: string, data: Parameters<typeof db.printer.update>[0]["data"]) =>
      db.printer.update({ where: { id }, data })
  );

  ipcMain.handle("printers:delete", (_, id: string) =>
    db.printer.delete({ where: { id } })
  );

  // ── Activity Log ──────────────────────────────────────────────────────────
  ipcMain.handle(
    "activity:log",
    (
      _,
      data: {
        userId?: string;
        action: string;
        entity: string;
        entityId?: string;
        summary?: string;
        data?: unknown;
      }
    ) =>
      db.activityLog.create({
        data: {
          userId: data.userId ?? null,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId ?? null,
          summary: data.summary ?? null,
          data: data.data ? JSON.stringify(data.data) : null,
        },
      })
  );

  ipcMain.handle(
    "activity:list",
    (_, filters?: { userId?: string; entity?: string; limit?: number }) =>
      db.activityLog.findMany({
        where: {
          ...(filters?.userId ? { userId: filters.userId } : {}),
          ...(filters?.entity ? { entity: filters.entity } : {}),
        },
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: filters?.limit ?? 100,
      })
  );
}
