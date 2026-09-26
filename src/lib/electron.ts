declare global {
  interface Window {
    electronAPI?: {
      student: {
        getByUsn: (usn: string) => Promise<any>;
        list: () => Promise<any>;
        upsert: (student: Record<string, string>) => Promise<any>;
        delete: (usn: string) => Promise<any>;
      };
      event: {
        getByNameAndDate: (eventName: string, eventDate: string) => Promise<any>;
        upsert: (event: Record<string, string>) => Promise<any>;
      };
      dialog: {
        openExcel: (type: "form1" | "form2") => Promise<string | null>;
      };
      import: {
        form1: (filePath: string) => Promise<any>;
        form2: (filePath: string) => Promise<any>;
      };
      preview: {
        form1: (filePath: string) => Promise<any>;
        form2: (filePath: string) => Promise<any>;
      };
      database: {
        backup: () => Promise<any>;
        restore: (filePath: string) => Promise<any>;
        getLocation: () => Promise<any>;
        clearData: () => Promise<any>;
      };
      report: {
        summary: () => Promise<any>;
        students: () => Promise<any>;
        events: () => Promise<any>;
        departments: () => Promise<any>;
      };
      drive?: {
        auth: () => Promise<boolean>;
        pick: () => Promise<{id: string, name: string} | null>;
        download: (fileId: string, fileName: string) => Promise<string | null>;
      };
    };
  }
}

export function getElectronAPI() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.electronAPI;
}
