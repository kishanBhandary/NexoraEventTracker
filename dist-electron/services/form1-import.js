"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewForm1Excel = previewForm1Excel;
exports.importForm1Excel = importForm1Excel;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_js_1 = require("../database/database.js");
const excel_parser_js_1 = require("./excel-parser.js");
const students_js_1 = require("../database/queries/students.js");
const events_js_1 = require("../database/queries/events.js");
const participations_js_1 = require("../database/queries/participations.js");
function normalizeBranch(value) {
    const text = String(value ?? "").trim().replace(/\s+/g, " ");
    if (!text)
        return "ISE";
    const normalized = text.toLowerCase();
    if (normalized.includes("ise") || normalized.includes("information science")) {
        return "ISE";
    }
    return text;
}
function buildPreviewRow(row) {
    return {
        usn: (0, excel_parser_js_1.getCellValue)(row, ["usn", "studentusn", "studentusnnumber"]).toUpperCase(),
        name: (0, excel_parser_js_1.getCellValue)(row, ["name", "studentname", "fullname"]),
        email: (0, excel_parser_js_1.getCellValue)(row, ["email", "studentemail"]),
        phone: (0, excel_parser_js_1.getCellValue)(row, ["phone", "studentphone", "mobilenumber"]),
        branch: normalizeBranch((0, excel_parser_js_1.getCellValue)(row, ["branch", "department", "program"])),
        semester: (0, excel_parser_js_1.getCellValue)(row, ["semester", "sem"]),
        yearOfPassing: (0, excel_parser_js_1.getCellValue)(row, ["yearofpassing", "passoutyear", "year of passing"]),
        eventName: (0, excel_parser_js_1.getCellValue)(row, ["eventname", "event", "eventtitle"]),
        eventType: (0, excel_parser_js_1.getCellValue)(row, ["eventtype", "type"]),
        eventVenue: (0, excel_parser_js_1.getCellValue)(row, ["hostcollege", "college", "host"]),
        eventDate: (0, excel_parser_js_1.getCellValue)(row, ["eventdate", "date"]),
        concernForm: (0, excel_parser_js_1.getCellValue)(row, ["concernform", "permissionfile", "permission", "concern"]),
    };
}
function previewForm1Excel(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        return {
            fileName: path_1.default.basename(filePath),
            fileSize: 0,
            summary: { rowsProcessed: 0, newStudents: 0, newEvents: 0, duplicateRecords: 0, invalidRows: 0 },
            rows: [],
            errors: ["File not found."],
        };
    }
    const rows = (0, excel_parser_js_1.parseExcelFile)(filePath);
    const previewRows = [];
    const uniqueStudents = new Set();
    const uniqueEvents = new Set();
    const duplicateKeys = new Set();
    const seenKeys = new Set();
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
        }
        else {
            seenKeys.add(registrationKey);
        }
        uniqueStudents.add(previewRow.usn);
        uniqueEvents.add(`${previewRow.eventName}|${previewRow.eventDate}`);
        if (previewRows.length < 10) {
            previewRows.push(previewRow);
        }
    }
    const stats = fs_1.default.statSync(filePath);
    return {
        fileName: path_1.default.basename(filePath),
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
function importForm1Excel(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        return { summary: { rowsProcessed: 0, newStudents: 0, existingStudents: 0, newEvents: 0, newParticipations: 0, duplicatesSkipped: 0, usnMismatches: 0, errors: 1 }, errors: ["File not found."] };
    }
    const rows = (0, excel_parser_js_1.parseExcelFile)(filePath);
    const summary = {
        rowsProcessed: rows.length,
        newStudents: 0,
        existingStudents: 0,
        newEvents: 0,
        newParticipations: 0,
        duplicatesSkipped: 0,
        usnMismatches: 0,
        errors: 0,
    };
    const errors = [];
    const db = (0, database_js_1.openDatabase)();
    for (const row of rows) {
        try {
            const usn = (0, excel_parser_js_1.getCellValue)(row, ["usn", "studentusn", "studentusnnumber"]).toUpperCase();
            const name = (0, excel_parser_js_1.getCellValue)(row, ["name", "studentname", "fullname"]);
            const email = (0, excel_parser_js_1.getCellValue)(row, ["email", "studentemail"]);
            const phone = (0, excel_parser_js_1.getCellValue)(row, ["phone", "studentphone", "mobilenumber"]);
            const branch = normalizeBranch((0, excel_parser_js_1.getCellValue)(row, ["branch", "department", "program"]));
            const semester = (0, excel_parser_js_1.getCellValue)(row, ["semester", "sem"]);
            const yearOfPassing = (0, excel_parser_js_1.getCellValue)(row, ["yearofpassing", "passoutyear", "year of passing"]);
            const eventName = (0, excel_parser_js_1.getCellValue)(row, ["eventname", "event", "eventtitle"]);
            const eventType = (0, excel_parser_js_1.getCellValue)(row, ["eventtype", "type"]);
            const hostCollege = (0, excel_parser_js_1.getCellValue)(row, ["hostcollege", "college", "host"]);
            const eventDate = (0, excel_parser_js_1.getCellValue)(row, ["eventdate", "date"]);
            if (!usn || !eventName || !eventDate) {
                summary.usnMismatches += 1;
                continue;
            }
            const student = (0, students_js_1.upsertStudent)({ usn, name: name || usn, email, phone, branch, semester, year_of_passing: yearOfPassing });
            const studentRecord = db.prepare(`SELECT * FROM students WHERE usn = ?`).get(usn);
            if (!studentRecord) {
                summary.errors += 1;
                continue;
            }
            const event = (0, events_js_1.upsertEvent)({
                event_name: eventName,
                event_type: eventType,
                host_college: hostCollege,
                event_date: eventDate,
            });
            const eventRecord = db.prepare(`SELECT * FROM events WHERE event_name = ? AND event_date = ?`).get(eventName, eventDate);
            if (!eventRecord) {
                summary.errors += 1;
                continue;
            }
            const existingParticipation = db.prepare(`SELECT id FROM participations WHERE student_id = ? AND event_id = ?`).get(studentRecord.id, eventRecord.id);
            if (existingParticipation) {
                summary.duplicatesSkipped += 1;
                continue;
            }
            (0, participations_js_1.createParticipation)({
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
            }
            else {
                summary.newStudents += 1;
            }
            summary.newEvents += 1;
            summary.newParticipations += 1;
        }
        catch (error) {
            summary.errors += 1;
            errors.push(error instanceof Error ? error.message : "Unknown error");
        }
    }
    db.close();
    return { summary, errors };
}
