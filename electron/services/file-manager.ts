import fs from "fs";
import path from "path";
import { getAppDataDir, getDatabasePath, openDatabase } from "../database/database.js";

export function backupDatabase(): { filePath: string } {
  const source = getDatabasePath();
  const dir = path.join(getAppDataDir(), "backups");
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(dir, `student_event_tracker_${stamp}.sqlite`);
  fs.copyFileSync(source, target);
  return { filePath: target };
}

export function restoreDatabase(filePath: string): { success: boolean; message: string } {
  const source = path.resolve(filePath);
  if (!fs.existsSync(source)) {
    return { success: false, message: "Backup file not found." };
  }

  const target = getDatabasePath();
  fs.copyFileSync(source, target);
  return { success: true, message: "Database restored successfully." };
}

export function getDatabaseLocation(): string {
  return getDatabasePath();
}

export function clearDatabaseData(): { success: boolean; message: string } {
  const db = openDatabase();

  try {
    db.prepare("DELETE FROM participations").run();
    db.prepare("DELETE FROM events").run();
    db.prepare("DELETE FROM students").run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('students', 'events', 'participations')").run();
    db.close();
    return { success: true, message: "Database data cleared successfully." };
  } catch (error) {
    db.close();
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to clear database data.",
    };
  }
}
