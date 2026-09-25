"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const file_manager_js_1 = require("../services/file-manager.js");
const form1_import_js_1 = require("../services/form1-import.js");
const form2_import_js_1 = require("../services/form2-import.js");
const form1_import_js_2 = require("../services/form1-import.js");
electron_1.ipcMain.handle("import:form1", async (_, filePath) => (0, form1_import_js_1.importForm1Excel)(filePath));
electron_1.ipcMain.handle("import:form2", async (_, filePath) => (0, form2_import_js_1.importForm2Excel)(filePath));
electron_1.ipcMain.handle("import:preview:form1", async (_, filePath) => (0, form1_import_js_2.previewForm1Excel)(filePath));
electron_1.ipcMain.handle("import:preview:form2", async (_, filePath) => (0, form2_import_js_1.previewForm2Excel)(filePath));
electron_1.ipcMain.handle("dialog:openExcel", async (_, type) => {
    const result = await electron_1.dialog.showOpenDialog({
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
electron_1.ipcMain.handle("database:backup", () => (0, file_manager_js_1.backupDatabase)());
electron_1.ipcMain.handle("database:restore", (_, filePath) => (0, file_manager_js_1.restoreDatabase)(filePath));
electron_1.ipcMain.handle("database:getLocation", () => (0, file_manager_js_1.getDatabaseLocation)());
electron_1.ipcMain.handle("database:clearData", () => (0, file_manager_js_1.clearDatabaseData)());
