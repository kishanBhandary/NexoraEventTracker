"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewForm2Excel = previewForm2Excel;
exports.importForm2Excel = importForm2Excel;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_js_1 = require("../database/database.js");
const excel_parser_js_1 = require("./excel-parser.js");
function buildPreviewRow(row) {
    return {
        usn: (0, excel_parser_js_1.getCellValue)(row, ["usn", "studentusn"]).toUpperCase(),
        eventName: (0, excel_parser_js_1.getCellValue)(row, ["eventname", "event", "eventtitle"]),
        eventDate: (0, excel_parser_js_1.getCellValue)(row, ["eventdate", "date"]),
        participationStatus: (0, excel_parser_js_1.getCellValue)(row, ["participationstatus", "status"]),
        achievement: (0, excel_parser_js_1.getCellValue)(row, ["achievement", "result"]),
        certificate: (0, excel_parser_js_1.getCellValue)(row, ["certificate", "certificatefile"]),
        winnerCertificate: (0, excel_parser_js_1.getCellValue)(row, ["winnercertificate", "winningcertificate"]),
        photos: (0, excel_parser_js_1.getCellValue)(row, ["photos", "photo"]),
    };
}
function previewForm2Excel(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        return {
            fileName: path_1.default.basename(filePath),
            fileSize: 0,
            summary: { rowsProcessed: 0, matchedRegistrations: 0, certificatesSubmitted: 0, photosUpdated: 0, achievementsUpdated: 0, duplicatesSkipped: 0, recordsForReview: 0 },
            rows: [],
            errors: ["File not found."],
        };
    }
    const rows = (0, excel_parser_js_1.parseExcelFile)(filePath);
    const previewRows = [];
    const seenKeys = new Set();
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
        }
        else if (seenKeys.has(registrationKey)) {
            duplicatesSkipped += 1;
        }
        else {
            seenKeys.add(registrationKey);
            matchedRegistrations += 1;
            if (previewRow.certificate)
                certificatesSubmitted += 1;
            if (previewRow.photos)
                photosUpdated += 1;
            if (previewRow.achievement)
                achievementsUpdated += 1;
        }
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
function importForm2Excel(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        return { summary: { rowsProcessed: 0, matchedRegistrations: 0, certificatesSubmitted: 0, photosUpdated: 0, achievementsUpdated: 0, duplicatesSkipped: 0, studentsNotFound: 0, eventsNotFound: 0, recordsForReview: 0 }, errors: ["File not found."] };
    }
    const rows = (0, excel_parser_js_1.parseExcelFile)(filePath);
    const db = (0, database_js_1.openDatabase)();
    const summary = {
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
    const errors = [];
    for (const row of rows) {
        try {
            const usn = (0, excel_parser_js_1.getCellValue)(row, ["usn", "studentusn"]).toUpperCase();
            const eventName = (0, excel_parser_js_1.getCellValue)(row, ["eventname", "event", "eventtitle"]);
            const eventDate = (0, excel_parser_js_1.getCellValue)(row, ["eventdate", "date"]);
            const participationStatus = (0, excel_parser_js_1.getCellValue)(row, ["participationstatus", "status"]);
            const achievement = (0, excel_parser_js_1.getCellValue)(row, ["achievement", "result"]);
            const certificateFile = (0, excel_parser_js_1.getCellValue)(row, ["certificate", "certificatefile"]);
            const winnerCertificate = (0, excel_parser_js_1.getCellValue)(row, ["winnercertificate", "winningcertificate"]);
            const photos = (0, excel_parser_js_1.getCellValue)(row, ["photos", "photo"]);
            if (!usn || !eventName || !eventDate) {
                summary.recordsForReview += 1;
                continue;
            }
            const student = db.prepare(`SELECT * FROM students WHERE usn = ?`).get(usn);
            if (!student) {
                summary.studentsNotFound += 1;
                continue;
            }
            const event = db.prepare(`SELECT * FROM events WHERE event_name = ? AND event_date = ?`).get(eventName, eventDate);
            if (!event) {
                summary.eventsNotFound += 1;
                continue;
            }
            const participation = db.prepare(`SELECT * FROM participations WHERE student_id = ? AND event_id = ?`).get(student.id, event.id);
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
            if (certificateFile)
                summary.certificatesSubmitted += 1;
            if (photos)
                summary.photosUpdated += 1;
            if (achievement)
                summary.achievementsUpdated += 1;
        }
        catch (error) {
            errors.push(error instanceof Error ? error.message : "Unknown error");
            summary.recordsForReview += 1;
        }
    }
    db.close();
    return { summary, errors };
}
