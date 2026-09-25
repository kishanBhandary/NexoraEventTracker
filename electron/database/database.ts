import fs from "fs";
import path from "path";
import os from "os";
import Database, { Database as SQLiteDatabase } from "better-sqlite3";
import { schemaSql } from "./schema";

export const APP_NAME = "StudentEventTracker";

export function getAppDataDir(): string {
  const base = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  if (process.platform === "win32") return path.join(base, APP_NAME);
  return path.join(os.homedir(), ".config", APP_NAME);
}

export function getDatabasePath(): string {
  const dir = getAppDataDir();
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "student_event_tracker.sqlite");
}

export function openDatabase(): SQLiteDatabase {
  const dbPath = getDatabasePath();
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(schemaSql);
  return db;
}

export function closeDatabase(db: SQLiteDatabase): void {
  db.close();
}

export function getDatabase(): SQLiteDatabase {
  const db = openDatabase();
  return db;
}
