"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const report_generator_js_1 = require("../services/report-generator.js");
electron_1.ipcMain.handle("report:summary", () => (0, report_generator_js_1.buildSummary)());
electron_1.ipcMain.handle("report:students", () => (0, report_generator_js_1.buildStudentReport)());
electron_1.ipcMain.handle("report:events", () => (0, report_generator_js_1.buildEventReport)());
electron_1.ipcMain.handle("report:departments", () => (0, report_generator_js_1.buildDepartmentReport)());
