import { PrismaClient } from "@prisma/client";
import { app } from "electron";
import path from "path";
import fs from "fs";

const isDev = process.env.NODE_ENV === "development";

function resolveDatabasePath(): string {
  if (isDev) {
    // Relative to project root in development
    const dir = path.join(process.cwd(), "database");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, "pos.db");
  }
  // In production use Electron's userData directory (persists across updates)
  const dir = path.join(app.getPath("userData"), "database");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "pos.db");
}

let _client: PrismaClient | null = null;

export function getDb(): PrismaClient {
  if (_client) return _client;

  const dbPath = resolveDatabasePath();
  _client = new PrismaClient({
    datasources: { db: { url: `file:${dbPath}` } },
    log: isDev ? ["warn", "error"] : ["error"],
  });

  return _client;
}

export async function initDb(): Promise<void> {
  const db = getDb();
  await db.$connect();

  // SQLite performance + correctness pragmas
  await db.$executeRaw`PRAGMA journal_mode  = WAL`;
  await db.$executeRaw`PRAGMA foreign_keys  = ON`;
  await db.$executeRaw`PRAGMA synchronous   = NORMAL`;
  await db.$executeRaw`PRAGMA cache_size    = -32000`; // 32 MB page cache
  await db.$executeRaw`PRAGMA temp_store    = MEMORY`;
  await db.$executeRaw`PRAGMA mmap_size     = 268435456`; // 256 MB mmap
}

export async function closeDb(): Promise<void> {
  if (_client) {
    await _client.$disconnect();
    _client = null;
  }
}
