"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const students_js_1 = require("../database/queries/students.js");
electron_1.ipcMain.handle("student:getByUsn", (_, usn) => (0, students_js_1.getStudentByUsn)(usn));
electron_1.ipcMain.handle("student:list", () => (0, students_js_1.getAllStudentsWithEvents)());
electron_1.ipcMain.handle("student:upsert", (_, student) => (0, students_js_1.upsertStudent)(student));
electron_1.ipcMain.handle("student:delete", (_, usn) => (0, students_js_1.deleteStudentByUsn)(usn));
