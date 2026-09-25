"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const database_js_1 = require("./database/database.js");
require("./ipc/student-ipc.js");
require("./ipc/event-ipc.js");
require("./ipc/import-ipc.js");
require("./ipc/report-ipc.js");
electron_1.app.disableHardwareAcceleration();
electron_1.app.commandLine.appendSwitch("disable-gpu");
electron_1.app.commandLine.appendSwitch("disable-software-rasterizer");
electron_1.app.commandLine.appendSwitch("disable-features", "UseSkiaRenderer");
electron_1.app.commandLine.appendSwitch("no-sandbox");
const appRoot = path_1.default.resolve(__dirname, "..");
const appUrl = "http://localhost:3001";
async function waitForServer() {
    for (let attempt = 0; attempt < 60; attempt += 1) {
        try {
            const response = await fetch(appUrl, { method: "GET" });
            if (response.ok) {
                return;
            }
        }
        catch {
            // keep retrying until the frontend server is ready
        }
        const nextCommand = process.env.ELECTRON_IS_DEV === "true" ? ["next", "dev", "-p", "3001"] : ["next", "start", "-p", "3001"];
        const nextBinary = process.platform === "win32" ? "npx.cmd" : "npx";
        if (attempt === 0 && !process.env.ELECTRON_SERVER_STARTED) {
            process.env.ELECTRON_SERVER_STARTED = "true";
            (0, child_process_1.spawn)(nextBinary, nextCommand, {
                cwd: appRoot,
                stdio: "ignore",
                env: { ...process.env },
            });
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1500,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        backgroundColor: "#ffffff",
        autoHideMenuBar: true,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
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
electron_1.app.whenReady().then(async () => {
    (0, database_js_1.openDatabase)();
    await waitForServer();
    createWindow();
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.ipcMain.handle("ping", () => "pong");
