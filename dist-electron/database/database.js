"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_NAME = void 0;
exports.getAppDataDir = getAppDataDir;
exports.getDatabasePath = getDatabasePath;
exports.openDatabase = openDatabase;
exports.closeDatabase = closeDatabase;
exports.getDatabase = getDatabase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const schema_1 = require("./schema");
exports.APP_NAME = "StudentEventTracker";
function getAppDataDir() {
    const base = process.env.APPDATA || path_1.default.join(os_1.default.homedir(), "AppData", "Roaming");
    if (process.platform === "win32")
        return path_1.default.join(base, exports.APP_NAME);
    return path_1.default.join(os_1.default.homedir(), ".config", exports.APP_NAME);
}
function getDatabasePath() {
    const dir = getAppDataDir();
    fs_1.default.mkdirSync(dir, { recursive: true });
    return path_1.default.join(dir, "student_event_tracker.sqlite");
}
function openDatabase() {
    const dbPath = getDatabasePath();
    const db = new better_sqlite3_1.default(dbPath);
    db.pragma("journal_mode = WAL");
    db.exec(schema_1.schemaSql);
    return db;
}
function closeDatabase(db) {
    db.close();
}
function getDatabase() {
    const db = openDatabase();
    return db;
}
