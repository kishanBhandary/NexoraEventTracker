import { openDatabase } from "../database.js";

type EventSQLiteRow = {
  id: number;
  event_name: string;
  event_type: string;
  host_college: string;
  event_date: string;
  created_at: string;
};

export function getEventByNameAndDate(eventName: string, eventDate: string) {
  const db = openDatabase();
  const row = db.prepare(`SELECT * FROM events WHERE event_name = ? AND event_date = ?`).get(eventName, eventDate) as EventSQLiteRow | undefined;
  db.close();
  return row;
}

export function upsertEvent(event: { event_name: string; event_type?: string; host_college?: string; event_date?: string }) {
  const db = openDatabase();
  const existing = db.prepare(`SELECT * FROM events WHERE event_name = ? AND event_date = ?`).get(event.event_name, event.event_date ?? "") as EventSQLiteRow | undefined;

  if (existing) {
    db.prepare(`
      UPDATE events
      SET event_type = COALESCE(?, event_type), host_college = COALESCE(?, host_college)
      WHERE id = ?
    `).run(event.event_type ?? null, event.host_college ?? null, existing.id);
    const updated = db.prepare(`SELECT * FROM events WHERE id = ?`).get(existing.id) as EventSQLiteRow | undefined;
    db.close();
    return updated;
  }

  const result = db.prepare(`
    INSERT INTO events (event_name, event_type, host_college, event_date, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(event.event_name, event.event_type ?? "", event.host_college ?? "", event.event_date ?? "");

  const created = db.prepare(`SELECT * FROM events WHERE id = ?`).get(result.lastInsertRowid) as EventSQLiteRow | undefined;
  db.close();
  return created;
}
