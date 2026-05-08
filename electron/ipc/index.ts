import { ipcMain, app } from "electron";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const isDev = process.env.NODE_ENV === "development";

const dbDir = isDev
  ? path.join(process.cwd(), "database")
  : path.join(app.getPath("userData"), "database");

const dbPath = path.join(dbDir, "pos.db");

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let prisma: PrismaClient;

const getPrisma = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: { url: `file:${dbPath}` },
      },
    });
  }
  return prisma;
};

export const registerIpcHandlers = async (): Promise<void> => {
  const db = getPrisma();

  // Run migrations on startup
  try {
    await db.$executeRaw`PRAGMA journal_mode=WAL`;
    await db.$executeRaw`PRAGMA foreign_keys=ON`;
    await db.$executeRaw`PRAGMA synchronous=NORMAL`;
  } catch (err) {
    console.error("DB pragma setup failed:", err);
  }

  // ── Settings ────────────────────────────────────────────────────────────────
  ipcMain.handle("settings:get", async (_, key: string) => {
    return db.setting.findUnique({ where: { key } });
  });

  ipcMain.handle("settings:set", async (_, key: string, value: string) => {
    return db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  });

  ipcMain.handle("settings:getAll", async () => {
    return db.setting.findMany({ orderBy: { key: "asc" } });
  });

  ipcMain.handle("settings:delete", async (_, key: string) => {
    await db.setting.delete({ where: { key } });
  });

  // ── Database management ──────────────────────────────────────────────────────
  ipcMain.handle("database:backup", async (_, targetPath: string) => {
    const dest = targetPath || path.join(dbDir, "..", "backups", `pos-backup-${Date.now()}.db`);
    const backupDir = path.dirname(dest);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.copyFileSync(dbPath, dest);
    return { success: true, path: dest };
  });

  ipcMain.handle("database:getInfo", async () => {
    const stat = fs.existsSync(dbPath) ? fs.statSync(dbPath) : null;
    const tables = await db.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'
    `;
    return {
      size: stat?.size ?? 0,
      path: dbPath,
      tables: tables.map((t) => t.name),
    };
  });

  // ── Audit Log ────────────────────────────────────────────────────────────────
  ipcMain.handle("audit:log", async (_, action: string, entity: string, entityId?: string, data?: unknown) => {
    return db.auditLog.create({
      data: {
        action,
        entity,
        entityId: entityId ?? null,
        data: data ? JSON.stringify(data) : null,
      },
    });
  });

  ipcMain.handle("audit:getRecent", async (_, limit = 50) => {
    return db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  });
};
