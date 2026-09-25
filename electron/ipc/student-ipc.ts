import { ipcMain } from "electron";
import { deleteStudentByUsn, getAllStudentsWithEvents, getStudentByUsn, upsertStudent } from "../database/queries/students.js";

ipcMain.handle("student:getByUsn", (_, usn: string) => getStudentByUsn(usn));
ipcMain.handle("student:list", () => getAllStudentsWithEvents());
ipcMain.handle("student:upsert", (_, student) => upsertStudent(student));
ipcMain.handle("student:delete", (_, usn: string) => deleteStudentByUsn(usn));
