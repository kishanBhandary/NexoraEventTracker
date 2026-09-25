"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const participations_js_1 = require("../database/queries/participations.js");
electron_1.ipcMain.handle("participation:updateById", (_, participationId, updates) => (0, participations_js_1.updateParticipationById)(participationId, updates));
