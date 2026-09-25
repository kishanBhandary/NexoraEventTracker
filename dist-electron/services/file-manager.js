"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupDatabase = backupDatabase;
exports.restoreDatabase = restoreDatabase;
exports.getDatabaseLocation = getDatabaseLocation;
exports.clearDatabaseData = clearDatabaseData;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_js_1 = require("../database/database.js");
function backupDatabase() {
    const source = (0, database_js_1.getDatabasePath)();
    const dir = path_1.default.join((0, database_js_1.getAppDataDir)(), "backups");
    fs_1.default.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const target = path_1.default.join(dir, `student_event_tracker_${stamp}.sqlite`);
    fs_1.default.copyFileSync(source, target);
    return { filePath: target };
}
function restoreDatabase(filePath) {
    const source = path_1.default.resolve(filePath);
    if (!fs_1.default.existsSync(source)) {
        return { success: false, message: "Backup file not found." };
    }
    const target = (0, database_js_1.getDatabasePath)();
    fs_1.default.copyFileSync(source, target);
    return { success: true, message: "Database restored successfully." };
}
function getDatabaseLocation() {
    return (0, database_js_1.getDatabasePath)();
}
function clearDatabaseData() {
    const db = (0, database_js_1.openDatabase)();
    try {
        db.prepare("DELETE FROM participations").run();
        db.prepare("DELETE FROM events").run();
        db.prepare("DELETE FROM students").run();
        db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('students', 'events', 'participations')").run();
        db.close();
        return { success: true, message: "Database data cleared successfully." };
    }
    catch (error) {
        db.close();
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to clear database data.",
        };
    }
}
