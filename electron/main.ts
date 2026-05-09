import { app, BrowserWindow, shell, ipcMain, Menu } from "electron";
import path from "path";
import { initDb, closeDb } from "./lib/db";
import { registerIpcHandlers } from "./ipc";
import { runMigrations, isFirstRun } from "./lib/migrate";

const isDev = process.env.NODE_ENV === "development";

// ── Single-instance lock ──────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

app.on("second-instance", () => {
  // Focus existing window when a second instance is launched
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ── Window ────────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;

function resolveProductionIndex(): string {
  // electron-builder puts the Next.js static export in resources/out/
  const candidates = [
    path.join(process.resourcesPath, "out", "index.html"),
    // __dirname = electron-dist/electron/ → go 2 levels up to project root
    path.join(__dirname, "..", "..", "out", "index.html"),
  ];
  for (const c of candidates) {
    try {
      const fs = require("fs") as typeof import("fs");
      if (fs.existsSync(c)) return `file://${c}`;
    } catch {}
  }
  return `file://${path.join(__dirname, "..", "..", "out", "index.html")}`;
}

const createWindow = (): void => {
  // In dev: __dirname = electron-dist/electron/ → go 2 levels up to project root
  // In prod: icon is in extraResources/build/
  const iconPath = isDev
    ? path.join(__dirname, "..", "..", "build", "icon.png")
    : path.join(process.resourcesPath, "build", "icon.png");

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: "#09090b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: !isDev,
      spellcheck: false,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    frame: process.platform !== "darwin",
    autoHideMenuBar: true,
    icon: iconPath,
    title: "Offline POS",
  });

  const loadURL = isDev ? "http://localhost:3000" : resolveProductionIndex();

  mainWindow.loadURL(loadURL).catch((err) => {
    console.error("[Main] Failed to load URL:", loadURL, err);
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    if (isDev) mainWindow?.webContents.openDevTools({ mode: "detach" });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Remove default menu in production for a cleaner UX
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }
};

// ── Auto-launch IPC ───────────────────────────────────────────────────────────
// Renderer can call window.electron.invoke("app:setAutoLaunch", true/false)
ipcMain.handle("app:setAutoLaunch", (_, enable: boolean) => {
  app.setLoginItemSettings({ openAtLogin: enable });
  return { success: true };
});

ipcMain.handle("app:getAutoLaunch", () => {
  return app.getLoginItemSettings().openAtLogin;
});

// ── Startup ───────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Run DB migrations before anything else
  await runMigrations();

  // If this is a brand-new install, seed default data
  if (!isDev && isFirstRun()) {
    try {
      const { seedDefaultData } = await import("./lib/seed");
      await seedDefaultData();
    } catch (err) {
      console.warn("[Main] Seed skipped:", err);
    }
  }

  await initDb();
  await registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", async () => {
  await closeDb();
});

// ── Security ──────────────────────────────────────────────────────────────────
app.on("web-contents-created", (_, contents) => {
  contents.on("will-navigate", (event, url) => {
    if (isDev && url.startsWith("http://localhost:3000")) return;
    event.preventDefault();
  });

  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
});
