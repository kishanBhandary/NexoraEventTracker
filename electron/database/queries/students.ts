import { openDatabase } from "../database.js";

export function getStudentByUsn(usn: string) {
  const db = openDatabase();
  const row = db.prepare(`SELECT * FROM students WHERE usn = ?`).get(usn);
  db.close();
  return row;
}

export function getAllStudentsWithEvents() {
  const db = openDatabase();
  const rows = db.prepare(`
    SELECT
      s.usn,
      s.name,
      s.email,
      s.phone,
      s.branch,
      s.semester,
      s.year_of_passing AS yearOfPassing,
      e.event_name AS eventName,
      e.event_type AS eventType,
      e.host_college AS eventVenue,
      e.event_date AS eventDate,
      p.event_status AS participationStatus,
      p.achievement,
      p.certificate_status AS certificateStatus,
      p.winner_certificate AS winnerCertificateStatus,
      p.photos AS photosStatus,
      p.permission_file AS concernFormStatus
    FROM students s
    LEFT JOIN participations p ON p.student_id = s.id
    LEFT JOIN events e ON e.id = p.event_id
    ORDER BY s.usn ASC, e.event_date ASC
  `).all();
  db.close();
  return rows;
}

export function upsertStudent(student: { usn: string; name: string; email?: string; phone?: string; branch?: string; semester?: string; year_of_passing?: string }) {
  const db = openDatabase();
  const existing = db.prepare(`SELECT id FROM students WHERE usn = ?`).get(student.usn);

  if (existing) {
    db.prepare(`
      UPDATE students
      SET name = ?, email = ?, phone = ?, branch = ?, semester = ?, year_of_passing = ?, updated_at = CURRENT_TIMESTAMP
      WHERE usn = ?
    `).run(student.name, student.email ?? "", student.phone ?? "", student.branch ?? "", student.semester ?? "", student.year_of_passing ?? "", student.usn);
    const updated = db.prepare(`SELECT * FROM students WHERE usn = ?`).get(student.usn);
    db.close();
    return updated;
  }

  const result = db.prepare(`
    INSERT INTO students (usn, name, email, phone, branch, semester, year_of_passing, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(student.usn, student.name, student.email ?? "", student.phone ?? "", student.branch ?? "", student.semester ?? "", student.year_of_passing ?? "");

  const created = db.prepare(`SELECT * FROM students WHERE id = ?`).get(result.lastInsertRowid);
  db.close();
  return created;
}

export function deleteStudentByUsn(usn: string) {
  const db = openDatabase();
  const student = db.prepare(`SELECT id FROM students WHERE usn = ?`).get(usn) as { id: number } | undefined;
  if (!student) {
    db.close();
    return { deleted: false };
  }

  db.prepare(`DELETE FROM participations WHERE student_id = ?`).run(student.id);
  const result = db.prepare(`DELETE FROM students WHERE usn = ?`).run(usn);
  db.close();

  return { deleted: result.changes > 0 };
}
