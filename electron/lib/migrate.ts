import { execFileSync } from "child_process";
import path from "path";
import fs from "fs";
import { app } from "electron";

const isDev = process.env.NODE_ENV === "development";

/**
 * Resolves the path to the Prisma CLI binary bundled with the app.
 * In production the CLI is in extraResources/prisma; in dev it's in node_modules/.bin.
 */
function getPrismaBin(): string {
  if (isDev) {
    return path.join(process.cwd(), "node_modules", ".bin", "prisma");
  }
  const resourcesPath = process.resourcesPath;
  const win = path.join(resourcesPath, "prisma", "dist", "bin.js");
  if (fs.existsSync(win)) return win;
  return path.join(resourcesPath, "prisma", "build", "index.js");
}

/**
 * Resolves the directory containing Prisma migration files.
 * In production they're in extraResources; in dev they're in the project root.
 */
function getMigrationsDir(): string {
  if (isDev) return path.join(process.cwd(), "prisma", "migrations");
  return path.join(process.resourcesPath, "prisma", "migrations");
}

/**
 * Returns the DATABASE_URL for the current environment.
 * Prisma CLI needs this as an env var when running migrate deploy.
 */
function getDbUrl(): string {
  const dbPath = isDev
    ? path.join(process.cwd(), "database", "pos.db")
    : path.join(app.getPath("userData"), "database", "pos.db");
  return `file:${dbPath}`;
}

/**
 * Runs `prisma migrate deploy` to apply all pending migrations.
 * Safe to run on every startup — it is idempotent.
 */
export async function runMigrations(): Promise<void> {
  const migrationsDir = getMigrationsDir();

  if (!fs.existsSync(migrationsDir)) {
    console.warn("[Migrate] No migrations directory found — skipping");
    return;
  }

  const prismaBin = getPrismaBin();
  const schemaPath = isDev
    ? path.join(process.cwd(), "prisma", "schema.prisma")
    : path.join(process.resourcesPath, "prisma", "schema.prisma");

  if (!fs.existsSync(schemaPath)) {
    console.warn("[Migrate] prisma/schema.prisma not found at", schemaPath);
    return;
  }

  const dbUrl = getDbUrl();
  console.log("[Migrate] Running prisma migrate deploy…");

  try {
    // Use node to invoke the Prisma CLI binary in production (it's a JS file)
    const cmd = isDev ? prismaBin : process.execPath;
    const args = isDev
      ? ["migrate", "deploy", "--schema", schemaPath]
      : [prismaBin, "migrate", "deploy", "--schema", schemaPath];

    execFileSync(cmd, args, {
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
        // Tell Prisma where its query engine is in production
        PRISMA_QUERY_ENGINE_LIBRARY: getPrismaEngineLibPath(),
      },
      stdio: isDev ? "inherit" : "pipe",
      timeout: 60_000,
    });

    console.log("[Migrate] Migrations applied successfully");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // If it's just "no pending migrations", that's not an error
    if (msg.includes("no pending migrations") || msg.includes("already applied")) {
      console.log("[Migrate] No pending migrations");
      return;
    }
    console.error("[Migrate] Migration failed:", msg);
    // Don't throw — a failed migration shouldn't crash the app on startup
    // The DB might still be usable (e.g., already migrated by a previous run)
  }
}

/**
 * Returns the path to the Prisma query engine shared library.
 */
function getPrismaEngineLibPath(): string {
  if (isDev) {
    // In dev, Prisma resolves its engine automatically
    return "";
  }

  const resourcesPath = process.resourcesPath;

  // Windows
  if (process.platform === "win32") {
    return path.join(resourcesPath, ".prisma", "client", "query_engine-windows.dll.node");
  }
  // macOS
  if (process.platform === "darwin") {
    return path.join(resourcesPath, ".prisma", "client", "libquery_engine-darwin.dylib.node");
  }
  // Linux
  return path.join(resourcesPath, ".prisma", "client", "libquery_engine-debian-openssl-3.0.x.so.node");
}

/**
 * Marks first-run in userData so we only seed once.
 */
function isFirstRun(): boolean {
  const flagPath = path.join(app.getPath("userData"), ".initialized");
  if (fs.existsSync(flagPath)) return false;
  fs.writeFileSync(flagPath, new Date().toISOString());
  return true;
}

export { isFirstRun };
