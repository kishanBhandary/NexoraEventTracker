"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSummary = buildSummary;
exports.buildStudentReport = buildStudentReport;
exports.buildEventReport = buildEventReport;
exports.buildDepartmentReport = buildDepartmentReport;
const database_js_1 = require("../database/database.js");
function buildSummary() {
    const db = (0, database_js_1.openDatabase)();
    const summary = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM students) AS totalStudents,
      (SELECT COUNT(*) FROM events) AS totalEvents,
      (SELECT COUNT(*) FROM participations) AS totalParticipants,
      (SELECT COUNT(*) FROM participations WHERE achievement LIKE '%Winner%' OR achievement LIKE '%winner%') AS winners,
      (SELECT COUNT(*) FROM participations WHERE certificate_status = 'Pending') AS certificatesPending,
      (SELECT COUNT(*) FROM participations WHERE certificate_status = 'Verified') AS certificatesVerified
  `).get();
    db.close();
    return summary;
}
function buildStudentReport() {
    const db = (0, database_js_1.openDatabase)();
    const rows = db.prepare(`
    SELECT s.usn, s.name, s.branch, s.semester,
      COUNT(p.id) AS totalEvents,
      SUM(CASE WHEN p.achievement LIKE '%Winner%' OR p.achievement LIKE '%winner%' THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN p.achievement LIKE '%Finalist%' OR p.achievement LIKE '%finalist%' THEN 1 ELSE 0 END) AS finalists,
      COUNT(p.id) AS participations
    FROM students s
    LEFT JOIN participations p ON p.student_id = s.id
    GROUP BY s.id
    ORDER BY s.usn ASC
  `).all();
    db.close();
    return rows;
}
function buildEventReport() {
    const db = (0, database_js_1.openDatabase)();
    const rows = db.prepare(`
    SELECT e.event_name AS event, e.host_college AS college, e.event_date AS date,
      COUNT(p.id) AS participants,
      SUM(CASE WHEN p.achievement LIKE '%Winner%' OR p.achievement LIKE '%winner%' THEN 1 ELSE 0 END) AS winners
    FROM events e
    LEFT JOIN participations p ON p.event_id = e.id
    GROUP BY e.id
    ORDER BY e.event_date DESC
  `).all();
    db.close();
    return rows;
}
function buildDepartmentReport() {
    const db = (0, database_js_1.openDatabase)();
    const rows = db.prepare(`
    SELECT s.branch,
      COUNT(DISTINCT s.id) AS students,
      COUNT(p.id) AS participation,
      SUM(CASE WHEN p.achievement LIKE '%Winner%' OR p.achievement LIKE '%winner%' THEN 1 ELSE 0 END) AS wins,
      SUM(CASE WHEN p.achievement LIKE '%Finalist%' OR p.achievement LIKE '%finalist%' THEN 1 ELSE 0 END) AS finalists
    FROM students s
    LEFT JOIN participations p ON p.student_id = s.id
    GROUP BY s.branch
    ORDER BY s.branch ASC
  `).all();
    db.close();
    return rows;
}
