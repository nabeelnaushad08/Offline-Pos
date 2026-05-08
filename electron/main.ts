import { app, BrowserWindow, shell } from "electron";
import path from "path";
import { initDb, closeDb } from "./lib/db";
import { registerIpcHandlers } from "./ipc";

const isDev = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    backgroundColor: "#09090b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: !isDev,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    frame: process.platform !== "darwin",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "..", "build", "icon.png"),
  });

  const loadURL = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "..", "out", "index.html")}`;

  mainWindow.loadURL(loadURL).catch((err) => {
    console.error("Failed to load URL:", err);
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
};

app.whenReady().then(async () => {
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

// Security: block unexpected navigation
app.on("web-contents-created", (_, contents) => {
  contents.on("will-navigate", (event, url) => {
    if (isDev && url.startsWith("http://localhost:3000")) return;
    event.preventDefault();
  });
});
