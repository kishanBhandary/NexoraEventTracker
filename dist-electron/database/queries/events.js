"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventByNameAndDate = getEventByNameAndDate;
exports.upsertEvent = upsertEvent;
const database_js_1 = require("../database.js");
function getEventByNameAndDate(eventName, eventDate) {
    const db = (0, database_js_1.openDatabase)();
    const row = db.prepare(`SELECT * FROM events WHERE event_name = ? AND event_date = ?`).get(eventName, eventDate);
    db.close();
    return row;
}
function upsertEvent(event) {
    const db = (0, database_js_1.openDatabase)();
    const existing = db.prepare(`SELECT * FROM events WHERE event_name = ? AND event_date = ?`).get(event.event_name, event.event_date ?? "");
    if (existing) {
        db.prepare(`
      UPDATE events
      SET event_type = COALESCE(?, event_type), host_college = COALESCE(?, host_college)
      WHERE id = ?
    `).run(event.event_type ?? null, event.host_college ?? null, existing.id);
        const updated = db.prepare(`SELECT * FROM events WHERE id = ?`).get(existing.id);
        db.close();
        return updated;
    }
    const result = db.prepare(`
    INSERT INTO events (event_name, event_type, host_college, event_date, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(event.event_name, event.event_type ?? "", event.host_college ?? "", event.event_date ?? "");
    const created = db.prepare(`SELECT * FROM events WHERE id = ?`).get(result.lastInsertRowid);
    db.close();
    return created;
}
