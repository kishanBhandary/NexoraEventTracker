import { ipcMain } from "electron";
import { buildSummary, buildStudentReport, buildDepartmentReport, buildEventReport } from "../services/report-generator.js";

ipcMain.handle("report:summary", () => buildSummary());
ipcMain.handle("report:students", () => buildStudentReport());
ipcMain.handle("report:events", () => buildEventReport());
ipcMain.handle("report:departments", () => buildDepartmentReport());
