import { contextBridge, ipcRenderer } from "electron";

const api = {
  student: {
    getByUsn: (usn: string) => ipcRenderer.invoke("student:getByUsn", usn),
    list: () => ipcRenderer.invoke("student:list"),
    upsert: (student: Record<string, string>) => ipcRenderer.invoke("student:upsert", student),
    delete: (usn: string) => ipcRenderer.invoke("student:delete", usn),
  },
  event: {
    getByNameAndDate: (eventName: string, eventDate: string) => ipcRenderer.invoke("event:getByNameAndDate", eventName, eventDate),
    upsert: (event: Record<string, string>) => ipcRenderer.invoke("event:upsert", event),
  },
  dialog: {
    openExcel: (type: "form1" | "form2") => ipcRenderer.invoke("dialog:openExcel", type),
  },
  import: {
    form1: (filePath: string) => ipcRenderer.invoke("import:form1", filePath),
    form2: (filePath: string) => ipcRenderer.invoke("import:form2", filePath),
  },
  preview: {
    form1: (filePath: string) => ipcRenderer.invoke("import:preview:form1", filePath),
    form2: (filePath: string) => ipcRenderer.invoke("import:preview:form2", filePath),
  },
  database: {
    backup: () => ipcRenderer.invoke("database:backup"),
    restore: (filePath: string) => ipcRenderer.invoke("database:restore", filePath),
    getLocation: () => ipcRenderer.invoke("database:getLocation"),
    clearData: () => ipcRenderer.invoke("database:clearData"),
  },
  report: {
    summary: () => ipcRenderer.invoke("report:summary"),
    students: () => ipcRenderer.invoke("report:students"),
    events: () => ipcRenderer.invoke("report:events"),
    departments: () => ipcRenderer.invoke("report:departments"),
  },
};

contextBridge.exposeInMainWorld("electronAPI", api);

export type ElectronAPI = typeof api;
