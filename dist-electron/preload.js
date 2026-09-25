"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    student: {
        getByUsn: (usn) => electron_1.ipcRenderer.invoke("student:getByUsn", usn),
        list: () => electron_1.ipcRenderer.invoke("student:list"),
        upsert: (student) => electron_1.ipcRenderer.invoke("student:upsert", student),
        delete: (usn) => electron_1.ipcRenderer.invoke("student:delete", usn),
    },
    event: {
        getByNameAndDate: (eventName, eventDate) => electron_1.ipcRenderer.invoke("event:getByNameAndDate", eventName, eventDate),
        upsert: (event) => electron_1.ipcRenderer.invoke("event:upsert", event),
    },
    dialog: {
        openExcel: (type) => electron_1.ipcRenderer.invoke("dialog:openExcel", type),
    },
    import: {
        form1: (filePath) => electron_1.ipcRenderer.invoke("import:form1", filePath),
        form2: (filePath) => electron_1.ipcRenderer.invoke("import:form2", filePath),
    },
    preview: {
        form1: (filePath) => electron_1.ipcRenderer.invoke("import:preview:form1", filePath),
        form2: (filePath) => electron_1.ipcRenderer.invoke("import:preview:form2", filePath),
    },
    database: {
        backup: () => electron_1.ipcRenderer.invoke("database:backup"),
        restore: (filePath) => electron_1.ipcRenderer.invoke("database:restore", filePath),
        getLocation: () => electron_1.ipcRenderer.invoke("database:getLocation"),
        clearData: () => electron_1.ipcRenderer.invoke("database:clearData"),
    },
    report: {
        summary: () => electron_1.ipcRenderer.invoke("report:summary"),
        students: () => electron_1.ipcRenderer.invoke("report:students"),
        events: () => electron_1.ipcRenderer.invoke("report:events"),
        departments: () => electron_1.ipcRenderer.invoke("report:departments"),
    },
};
electron_1.contextBridge.exposeInMainWorld("electronAPI", api);
