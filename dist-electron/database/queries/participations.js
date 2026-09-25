"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParticipation = getParticipation;
exports.createParticipation = createParticipation;
exports.updateParticipationByStudentAndEvent = updateParticipationByStudentAndEvent;
const database_js_1 = require("../database.js");
function getParticipation(studentId, eventId) {
    const db = (0, database_js_1.openDatabase)();
    const row = db.prepare(`SELECT * FROM participations WHERE student_id = ? AND event_id = ?`).get(studentId, eventId);
    db.close();
    return row;
}
function createParticipation(participation) {
    const db = (0, database_js_1.openDatabase)();
    const existing = db.prepare(`SELECT id FROM participations WHERE student_id = ? AND event_id = ?`).get(participation.student_id, participation.event_id);
    if (existing) {
        db.close();
        return { id: existing.id, duplicate: true };
    }
    const result = db.prepare(`
    INSERT INTO participations (student_id, event_id, event_status, certificate_status, achievement, permission_file, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(participation.student_id, participation.event_id, participation.event_status ?? "Attended", participation.certificate_status ?? "Pending", participation.achievement ?? "", participation.permission_file ?? "");
    const created = db.prepare(`SELECT * FROM participations WHERE id = ?`).get(result.lastInsertRowid);
    db.close();
    return created;
}
function updateParticipationByStudentAndEvent(studentId, eventId, updates) {
    const db = (0, database_js_1.openDatabase)();
    const fields = Object.entries(updates)
        .filter(([, value]) => value !== undefined)
        .map(([key]) => `${key} = ?`);
    if (!fields.length) {
        db.close();
        return null;
    }
    const values = Object.values(updates).filter((value) => value !== undefined);
    const sql = `UPDATE participations SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE student_id = ? AND event_id = ?`;
    db.prepare(sql).run(...values, studentId, eventId);
    const row = db.prepare(`SELECT * FROM participations WHERE student_id = ? AND event_id = ?`).get(studentId, eventId);
    db.close();
    return row;
}
