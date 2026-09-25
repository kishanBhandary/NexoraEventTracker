import fs from "fs";
import path from "path";
import { openDatabase } from "../database/database.js";
import { getCellValue, parseExcelFile } from "./excel-parser.js";

export type Form2PreviewRow = {
  usn: string;
  eventName: string;
  eventDate: string;
  participationStatus: string;
  achievement: string;
  certificate: string;
  winnerCertificate: string;
  photos: string;
};

export type Form2PreviewSummary = {
  rowsProcessed: number;
  matchedRegistrations: number;
  certificatesSubmitted: number;
  photosUpdated: number;
  achievementsUpdated: number;
  duplicatesSkipped: number;
  recordsForReview: number;
};

export type Form2PreviewResult = {
  fileName: string;
  fileSize: number;
  summary: Form2PreviewSummary;
  rows: Form2PreviewRow[];
  errors: string[];
};

export type Form2Summary = {
  rowsProcessed: number;
  matchedRegistrations: number;
  certificatesSubmitted: number;
  photosUpdated: number;
  achievementsUpdated: number;
  duplicatesSkipped: number;
  studentsNotFound: number;
  eventsNotFound: number;
  recordsForReview: number;
};

function buildPreviewRow(row: Record<string, unknown>): Form2PreviewRow {
  return {
    usn: getCellValue(row, ["usn", "studentusn"]).toUpperCase(),
    eventName: getCellValue(row, ["eventname", "event", "eventtitle"]),
    eventDate: getCellValue(row, ["eventdate", "date"]),
    participationStatus: getCellValue(row, ["participationstatus", "status"]),
    achievement: getCellValue(row, ["achievement", "result"]),
    certificate: getCellValue(row, ["certificate", "certificatefile"]),
    winnerCertificate: getCellValue(row, ["winnercertificate", "winningcertificate"]),
    photos: getCellValue(row, ["photos", "photo"]),
  };
}

export function previewForm2Excel(filePath: string): Form2PreviewResult {
  if (!fs.existsSync(filePath)) {
    return {
      fileName: path.basename(filePath),
      fileSize: 0,
      summary: { rowsProcessed: 0, matchedRegistrations: 0, certificatesSubmitted: 0, photosUpdated: 0, achievementsUpdated: 0, duplicatesSkipped: 0, recordsForReview: 0 },
      rows: [],
      errors: ["File not found."],
    };
  }

  const rows = parseExcelFile(filePath);
  const previewRows: Form2PreviewRow[] = [];
  const seenKeys = new Set<string>();
  let matchedRegistrations = 0;
  let certificatesSubmitted = 0;
  let photosUpdated = 0;
  let achievementsUpdated = 0;
  let duplicatesSkipped = 0;
  let recordsForReview = 0;

  for (const row of rows) {
    const previewRow = buildPreviewRow(row);
    const registrationKey = `${previewRow.usn}|${previewRow.eventName}|${previewRow.eventDate}`;

    if (!previewRow.usn || !previewRow.eventName || !previewRow.eventDate) {
      recordsForReview += 1;
    } else if (seenKeys.has(registrationKey)) {
      duplicatesSkipped += 1;
    } else {
      seenKeys.add(registrationKey);
      matchedRegistrations += 1;
      if (previewRow.certificate) certificatesSubmitted += 1;
      if (previewRow.photos) photosUpdated += 1;
      if (previewRow.achievement) achievementsUpdated += 1;
    }

    if (previewRows.length < 10) {
      previewRows.push(previewRow);
    }
  }

  const stats = fs.statSync(filePath);

  return {
    fileName: path.basename(filePath),
    fileSize: stats.size,
    summary: {
      rowsProcessed: rows.length,
      matchedRegistrations,
      certificatesSubmitted,
      photosUpdated,
      achievementsUpdated,
      duplicatesSkipped,
      recordsForReview,
    },
    rows: previewRows,
    errors: [],
  };
}

export function importForm2Excel(filePath: string): { summary: Form2Summary; errors: string[] } {
  if (!fs.existsSync(filePath)) {
    return { summary: { rowsProcessed: 0, matchedRegistrations: 0, certificatesSubmitted: 0, photosUpdated: 0, achievementsUpdated: 0, duplicatesSkipped: 0, studentsNotFound: 0, eventsNotFound: 0, recordsForReview: 0 }, errors: ["File not found."] };
  }

  const rows = parseExcelFile(filePath);
  const db = openDatabase();
  const summary: Form2Summary = {
    rowsProcessed: rows.length,
    matchedRegistrations: 0,
    certificatesSubmitted: 0,
    photosUpdated: 0,
    achievementsUpdated: 0,
    duplicatesSkipped: 0,
    studentsNotFound: 0,
    eventsNotFound: 0,
    recordsForReview: 0,
  };
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const usn = getCellValue(row, ["usn", "studentusn"]).toUpperCase();
      const eventName = getCellValue(row, ["eventname", "event", "eventtitle"]);
      const eventDate = getCellValue(row, ["eventdate", "date"]);
      const participationStatus = getCellValue(row, ["participationstatus", "status"]);
      const achievement = getCellValue(row, ["achievement", "result"]);
      const certificateFile = getCellValue(row, ["certificate", "certificatefile"]);
      const winnerCertificate = getCellValue(row, ["winnercertificate", "winningcertificate"]);
      const photos = getCellValue(row, ["photos", "photo"]);

      if (!usn || !eventName || !eventDate) {
        summary.recordsForReview += 1;
        continue;
      }

      const student = db.prepare(`SELECT * FROM students WHERE usn = ?`).get(usn) as { id: number } | undefined;
      if (!student) {
        summary.studentsNotFound += 1;
        continue;
      }

      const event = db.prepare(`SELECT * FROM events WHERE event_name = ? AND event_date = ?`).get(eventName, eventDate) as { id: number } | undefined;
      if (!event) {
        summary.eventsNotFound += 1;
        continue;
      }

      const participation = db.prepare(`SELECT * FROM participations WHERE student_id = ? AND event_id = ?`).get(student.id, event.id) as { id: number } | undefined;
      if (!participation) {
        summary.recordsForReview += 1;
        continue;
      }

      summary.matchedRegistrations += 1;
      const updateSql = `
        UPDATE participations
        SET event_status = ?, achievement = ?, certificate_status = 'Submitted', certificate_file = ?, winner_certificate = ?, photos = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      db.prepare(updateSql).run(participationStatus || "Attended", achievement || "", certificateFile || "", winnerCertificate || "", photos || "", participation.id);

      if (certificateFile) summary.certificatesSubmitted += 1;
      if (photos) summary.photosUpdated += 1;
      if (achievement) summary.achievementsUpdated += 1;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown error");
      summary.recordsForReview += 1;
    }
  }

  db.close();
  return { summary, errors };
}
