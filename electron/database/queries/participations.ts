import { openDatabase } from "../database.js";

type ParticipationSQLiteRow = {
  id: number;
  student_id: number;
  event_id: number;
  event_status: string;
  certificate_status: string;
  achievement: string;
  permission_file: string;
  certificate_file: string;
  winner_certificate: string;
  photos: string;
  created_at: string;
  updated_at: string;
};

export function getParticipation(studentId: number, eventId: number) {
  const db = openDatabase();
  const row = db.prepare(`SELECT * FROM participations WHERE student_id = ? AND event_id = ?`).get(studentId, eventId) as ParticipationSQLiteRow | undefined;
  db.close();
  return row;
}

export function createParticipation(participation: {
  student_id: number;
  event_id: number;
  event_status?: string;
  certificate_status?: string;
  achievement?: string;
  permission_file?: string;
}) {
  const db = openDatabase();
  const existing = db.prepare(`SELECT id FROM participations WHERE student_id = ? AND event_id = ?`).get(participation.student_id, participation.event_id) as { id: number } | undefined;
  if (existing) {
    db.close();
    return { id: existing.id, duplicate: true };
  }

  const result = db.prepare(`
    INSERT INTO participations (student_id, event_id, event_status, certificate_status, achievement, permission_file, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(
    participation.student_id,
    participation.event_id,
    participation.event_status ?? "Attended",
    participation.certificate_status ?? "Pending",
    participation.achievement ?? "",
    participation.permission_file ?? "",
  );

  const created = db.prepare(`SELECT * FROM participations WHERE id = ?`).get(result.lastInsertRowid) as ParticipationSQLiteRow | undefined;
  db.close();
  return created;
}

export function updateParticipationByStudentAndEvent(studentId: number, eventId: number, updates: Record<string, string | number | null>) {
  const db = openDatabase();
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
  const row = db.prepare(`SELECT * FROM participations WHERE student_id = ? AND event_id = ?`).get(studentId, eventId) as ParticipationSQLiteRow | undefined;
  db.close();
  return row;
}
