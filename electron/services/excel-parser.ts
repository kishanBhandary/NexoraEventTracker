import * as XLSX from "xlsx";

export type ExcelRow = Record<string, string | number | boolean | null>;

export function parseExcelFile(filePath: string): ExcelRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: "" });
  return rows;
}

export function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^student/, "");
}

export function getCellValue(row: Record<string, unknown>, aliases: string[]): string {
  const normalizedAliases = aliases.map((alias) => normalizeHeader(alias));
  const keys = Object.keys(row);
  const match = keys.find((key) => normalizedAliases.includes(normalizeHeader(key)));
  if (!match) return "";
  const value = row[match];
  return value == null ? "" : String(value).trim();
}
