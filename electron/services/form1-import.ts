import fs from "fs";
import path from "path";
import { openDatabase } from "../database/database.js";
import { getCellValue, parseExcelFile } from "./excel-parser.js";
import { upsertStudent } from "../database/queries/students.js";
import { upsertEvent } from "../database/queries/events.js";
import { createParticipation } from "../database/queries/participations.js";

export type ImportSummary = {
  rowsProcessed: number;
  newStudents: number;
  existingStudents: number;
  newEvents: number;
  newParticipations: number;
  duplicatesSkipped: number;
  usnMismatches: number;
  errors: number;
};

export type Form1PreviewRow = {
  usn: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  semester: string;
  yearOfPassing: string;
  eventName: string;
  eventType: string;
  eventVenue: string;
  eventDate: string;
  concernForm: string;
};

export type Form1PreviewSummary = {
  rowsProcessed: number;
  newStudents: number;
  newEvents: number;
  duplicateRecords: number;
  invalidRows: number;
};

export type Form1PreviewResult = {
  fileName: string;
  fileSize: number;
  summary: Form1PreviewSummary;
  rows: Form1PreviewRow[];
  errors: string[];
};

function normalizeBranch(value: string): string {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!text) return "ISE";

  const normalized = text.toLowerCase();
  if (normalized.includes("ise") || normalized.includes("information science")) {
    return "ISE";
  }

  return text;
}

function buildPreviewRow(row: Record<string, unknown>): Form1PreviewRow {
  return {
    usn: getCellValue(row, ["usn", "studentusn", "studentusnnumber"]).toUpperCase(),
    name: getCellValue(row, ["name", "studentname", "fullname"]),
    email: getCellValue(row, ["email", "studentemail"]),
    phone: getCellValue(row, ["phone", "studentphone", "mobilenumber"]),
    branch: normalizeBranch(getCellValue(row, ["branch", "department", "program"])),
    semester: getCellValue(row, ["semester", "sem"]),
    yearOfPassing: getCellValue(row, ["yearofpassing", "passoutyear", "year of passing"]),
    eventName: getCellValue(row, ["eventname", "event", "eventtitle"]),
    eventType: getCellValue(row, ["eventtype", "type"]),
    eventVenue: getCellValue(row, ["hostcollege", "college", "host"]),
    eventDate: getCellValue(row, ["eventdate", "date"]),
    concernForm: getCellValue(row, ["concernform", "permissionfile", "permission", "concern"]),
  };
}

export function previewForm1Excel(filePath: string): Form1PreviewResult {
  if (!fs.existsSync(filePath)) {
    return {
      fileName: path.basename(filePath),
      fileSize: 0,
      summary: { rowsProcessed: 0, newStudents: 0, newEvents: 0, duplicateRecords: 0, invalidRows: 0 },
      rows: [],
      errors: ["File not found."],
    };
  }

  const rows = parseExcelFile(filePath);
  const previewRows: Form1PreviewRow[] = [];
  const uniqueStudents = new Set<string>();
  const uniqueEvents = new Set<string>();
  const duplicateKeys = new Set<string>();
  const seenKeys = new Set<string>();
  let invalidRows = 0;

  for (const row of rows) {
    const previewRow = buildPreviewRow(row);
    const registrationKey = `${previewRow.usn}|${previewRow.eventName}|${previewRow.eventDate}`;

    if (!previewRow.usn || !previewRow.eventName || !previewRow.eventDate) {
      invalidRows += 1;
      if (previewRows.length < 10) {
        previewRows.push(previewRow);
      }
      continue;
    }

    if (seenKeys.has(registrationKey)) {
      duplicateKeys.add(registrationKey);
    } else {
      seenKeys.add(registrationKey);
    }

    uniqueStudents.add(previewRow.usn);
    uniqueEvents.add(`${previewRow.eventName}|${previewRow.eventDate}`);

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
      newStudents: uniqueStudents.size,
      newEvents: uniqueEvents.size,
      duplicateRecords: duplicateKeys.size,
      invalidRows,
    },
    rows: previewRows,
    errors: [],
  };
}

export function importForm1Excel(filePath: string): { summary: ImportSummary; errors: string[] } {
  if (!fs.existsSync(filePath)) {
    return { summary: { rowsProcessed: 0, newStudents: 0, existingStudents: 0, newEvents: 0, newParticipations: 0, duplicatesSkipped: 0, usnMismatches: 0, errors: 1 }, errors: ["File not found."] };
  }

  const rows = parseExcelFile(filePath);
  const summary: ImportSummary = {
    rowsProcessed: rows.length,
    newStudents: 0,
    existingStudents: 0,
    newEvents: 0,
    newParticipations: 0,
    duplicatesSkipped: 0,
    usnMismatches: 0,
    errors: 0,
  };
  const errors: string[] = [];

  const db = openDatabase();

  for (const row of rows) {
    try {
      const usn = getCellValue(row, ["usn", "studentusn", "studentusnnumber"]).toUpperCase();
      const name = getCellValue(row, ["name", "studentname", "fullname"]);
      const email = getCellValue(row, ["email", "studentemail"]);
      const phone = getCellValue(row, ["phone", "studentphone", "mobilenumber"]);
      const branch = normalizeBranch(getCellValue(row, ["branch", "department", "program"]));
      const semester = getCellValue(row, ["semester", "sem"]);
      const yearOfPassing = getCellValue(row, ["yearofpassing", "passoutyear", "year of passing"]);
      const eventName = getCellValue(row, ["eventname", "event", "eventtitle"]);
      const eventType = getCellValue(row, ["eventtype", "type"]);
      const hostCollege = getCellValue(row, ["hostcollege", "college", "host"]);
      const eventDate = getCellValue(row, ["eventdate", "date"]);

      if (!usn || !eventName || !eventDate) {
        summary.usnMismatches += 1;
        continue;
      }

      const student = upsertStudent({ usn, name: name || usn, email, phone, branch, semester, year_of_passing: yearOfPassing });
      const studentRecord = db.prepare(`SELECT * FROM students WHERE usn = ?`).get(usn) as { id: number } | undefined;
      if (!studentRecord) {
        summary.errors += 1;
        continue;
      }

      const event = upsertEvent({
        event_name: eventName,
        event_type: eventType,
        host_college: hostCollege,
        event_date: eventDate,
      });

      const eventRecord = db.prepare(`SELECT * FROM events WHERE event_name = ? AND event_date = ?`).get(eventName, eventDate) as { id: number } | undefined;
      if (!eventRecord) {
        summary.errors += 1;
        continue;
      }

      const existingParticipation = db.prepare(`SELECT id FROM participations WHERE student_id = ? AND event_id = ?`).get(studentRecord.id, eventRecord.id);
      if (existingParticipation) {
        summary.duplicatesSkipped += 1;
        continue;
      }

      createParticipation({
        student_id: studentRecord.id,
        event_id: eventRecord.id,
        event_status: "Attended",
        certificate_status: "Pending",
        achievement: "",
        permission_file: "",
      });

      const prior = db.prepare(`SELECT id FROM students WHERE usn = ?`).get(usn) ? 1 : 0;
      if (prior && student) {
        summary.existingStudents += 1;
      } else {
        summary.newStudents += 1;
      }
      summary.newEvents += 1;
      summary.newParticipations += 1;
    } catch (error) {
      summary.errors += 1;
      errors.push(error instanceof Error ? error.message : "Unknown error");
    }
  }

  db.close();
  return { summary, errors };
}
