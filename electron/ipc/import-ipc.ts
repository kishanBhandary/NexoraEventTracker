import { dialog, ipcMain } from "electron";
import { backupDatabase, restoreDatabase, getDatabaseLocation, clearDatabaseData } from "../services/file-manager.js";
import { importForm1Excel } from "../services/form1-import.js";
import { importForm2Excel, previewForm2Excel } from "../services/form2-import.js";
import { previewForm1Excel } from "../services/form1-import.js";

ipcMain.handle("import:form1", async (_, filePath: string) => importForm1Excel(filePath));
ipcMain.handle("import:form2", async (_, filePath: string) => importForm2Excel(filePath));
ipcMain.handle("import:preview:form1", async (_, filePath: string) => previewForm1Excel(filePath));
ipcMain.handle("import:preview:form2", async (_, filePath: string) => previewForm2Excel(filePath));
ipcMain.handle("dialog:openExcel", async (_, type: "form1" | "form2") => {
  const result = await dialog.showOpenDialog({
    title: type === "form1" ? "Select Form 1 Excel file" : "Select Form 2 Excel file",
    properties: ["openFile"],
    filters: [
      { name: "Excel Files", extensions: ["xlsx", "xls", "csv"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});
ipcMain.handle("database:backup", () => backupDatabase());
ipcMain.handle("database:restore", (_, filePath: string) => restoreDatabase(filePath));
ipcMain.handle("database:getLocation", () => getDatabaseLocation());
ipcMain.handle("database:clearData", () => clearDatabaseData());
