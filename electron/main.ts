import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { spawn } from "child_process";
import { openDatabase } from "./database/database.js";

import "./ipc/student-ipc.js";
import "./ipc/event-ipc.js";
import "./ipc/import-ipc.js";
import "./ipc/report-ipc.js";

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer");
app.commandLine.appendSwitch("disable-features", "UseSkiaRenderer");
app.commandLine.appendSwitch("no-sandbox");

const appRoot = path.resolve(__dirname, "..");
const appUrl = "http://localhost:3001";

async function waitForServer(): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(appUrl, { method: "GET" });
      if (response.ok) {
        return;
      }
    } catch {
      // keep retrying until the frontend server is ready
    }

    const isDev = process.env.ELECTRON_IS_DEV === "true";
    let nextBinary = process.platform === "win32" ? "npx.cmd" : "npx";
    let nextCommand = isDev ? ["next", "dev", "-p", "3001"] : ["next", "start", "-p", "3001"];
    let spawnEnv = { ...process.env };

    if (!isDev) {
      nextBinary = process.execPath;
      const nextCli = path.join(appRoot, "node_modules", "next", "dist", "bin", "next");
      nextCommand = [nextCli, "start", "-p", "3001"];
      spawnEnv.ELECTRON_RUN_AS_NODE = "1";
    }

    if (attempt === 0 && !process.env.ELECTRON_SERVER_STARTED) {
      process.env.ELECTRON_SERVER_STARTED = "true";
      spawn(nextBinary, nextCommand, {
        cwd: appRoot,
        stdio: "ignore",
        env: spawnEnv,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 1000,
    minWidth: 1200,
    minHeight: 800,
    title: "Event Tracker",
    icon: path.join(__dirname, "../public/eventlogo-removebg-preview.png"),
    backgroundColor: "#ffffff",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  void win.loadURL(appUrl);

  if (process.env.ELECTRON_IS_DEV === "true") {
    win.webContents.openDevTools({ mode: "detach" });
  }
}

app.whenReady().then(async () => {
  openDatabase();
  await waitForServer();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("ping", () => "pong");
