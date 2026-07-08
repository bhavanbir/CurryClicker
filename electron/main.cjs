const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const steam = require("./steam.cjs");

const DEV = process.env.ELECTRON_DEV === "1";
const DEV_URL = "http://localhost:5173";
const SAVE_DEBOUNCE_MS = 1000;

const savePath = path.join(app.getPath("userData"), "save.json");

let pendingSave = null;
let saveTimer = null;

function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (pendingSave === null) return;
  try {
    fs.writeFileSync(savePath, pendingSave);
  } catch (err) {
    console.warn("[save] write failed:", err.message);
  }
  pendingSave = null;
}

ipcMain.handle("save:read", () => {
  try {
    return fs.readFileSync(savePath, "utf8");
  } catch {
    return null;
  }
});

ipcMain.handle("save:write", (_e, data) => {
  pendingSave = data;
  if (!saveTimer) {
    saveTimer = setTimeout(() => {
      saveTimer = null;
      flushSave();
    }, SAVE_DEBOUNCE_MS);
  }
});

ipcMain.handle("steam:achievement", (_e, id) => steam.unlockAchievement(id));
ipcMain.handle("steam:score", (_e, value) => steam.submitWeekScore(value));
ipcMain.handle("steam:playerName", () => steam.getPlayerName());

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: "Curry Clicker",
    backgroundColor: "#fffdf8",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // External links (e.g. the Steam store CTA) open in the system browser, never
  // inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (DEV) {
    const load = () => win.loadURL(DEV_URL).catch(() => setTimeout(load, 500));
    load();
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  win.webContents.on("did-finish-load", () => {
    console.log("[main] renderer loaded");
  });

  return win;
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    steam.init();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("before-quit", flushSave);

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

// Steam overlay + required Chromium switches (in-process-gpu,
// disable-direct-composition) are applied by this helper; it must run before the
// app is ready, so call it at module load.
try {
  require("steamworks.js").electronEnableSteamOverlay();
} catch {
  // No Steam / native module: overlay simply stays off.
}
