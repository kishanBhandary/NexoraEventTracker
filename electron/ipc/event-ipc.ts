import { ipcMain } from "electron";
import { getEventByNameAndDate, upsertEvent } from "../database/queries/events.js";

ipcMain.handle("event:getByNameAndDate", (_, eventName: string, eventDate: string) => getEventByNameAndDate(eventName, eventDate));
ipcMain.handle("event:upsert", (_, event) => upsertEvent(event));
