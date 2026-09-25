export const schemaSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usn TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  branch TEXT,
  semester TEXT,
  year_of_passing TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  event_type TEXT,
  host_college TEXT,
  event_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS participations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  event_status TEXT,
  certificate_status TEXT DEFAULT 'Pending',
  achievement TEXT,
  permission_file TEXT,
  certificate_file TEXT,
  winner_certificate TEXT,
  photos TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(id),
  FOREIGN KEY(event_id) REFERENCES events(id)
);

CREATE INDEX IF NOT EXISTS idx_students_usn ON students(usn);
CREATE INDEX IF NOT EXISTS idx_events_name_date ON events(event_name, event_date);
CREATE INDEX IF NOT EXISTS idx_participations_student_event ON participations(student_id, event_id);
CREATE INDEX IF NOT EXISTS idx_participations_event_status ON participations(event_status);
`;
