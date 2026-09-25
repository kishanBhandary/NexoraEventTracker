"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const events_js_1 = require("../database/queries/events.js");
electron_1.ipcMain.handle("event:getByNameAndDate", (_, eventName, eventDate) => (0, events_js_1.getEventByNameAndDate)(eventName, eventDate));
electron_1.ipcMain.handle("event:upsert", (_, event) => (0, events_js_1.upsertEvent)(event));
