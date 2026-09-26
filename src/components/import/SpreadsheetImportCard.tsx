"use client";

import { ArrowRight, Eye, FileSpreadsheet, Trash2, Upload, Cloud, X, Download } from "lucide-react";
import { useMemo, useState } from "react";

import { getElectronAPI } from "@/lib/electron";

type FormType = "form1" | "form2";

type StatCard = {
  key: string;
  label: string;
  className: string;
};

type Column = {
  key: string;
  label: string;
  className?: string;
};

type SpreadsheetImportCardProps = {
  form: FormType;
  eyebrow: string;
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeClassName: string;
  description: string;
  emptyHint: string;
  stats: StatCard[];
  columns: Column[];
  importButtonLabel: string;
};

function formatBytes(size: number) {
  if (!size) return "0 KB";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(size) / Math.log(1024)));
  const value = size / 1024 ** index;
  return `${value >= 10 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

export function SpreadsheetImportCard({
  form,
  eyebrow,
  title,
  subtitle,
  badgeLabel,
  badgeClassName,
  description,
  emptyHint,
  stats,
  columns,
  importButtonLabel,
}: SpreadsheetImportCardProps) {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
      const [loadingDrive, setLoadingDrive] = useState(false);

  const api = useMemo(() => getElectronAPI(), []);

  const loadPreview = async (targetPath: string) => {
    if (!api?.preview?.[form]) {
      setMessage("Preview API is not available.");
      return;
    }

    setLoadingPreview(true);
    setMessage("");

    try {
      const result = await api.preview[form](targetPath);
      setFilePath(targetPath);
      setFileName(result?.fileName ?? targetPath.split(/[\\/]/).pop() ?? "Selected file");
      setFileSize(Number(result?.fileSize ?? 0));
      setSummary(result?.summary ?? {});
      setPreviewRows(Array.isArray(result?.rows) ? result.rows : []);

      const errors = Array.isArray(result?.errors) ? result.errors : [];
      if (errors.length > 0) {
        setMessage(errors[0]);
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  const selectFile = async () => {
    if (!api?.dialog?.openExcel) {
      setMessage("File picker is not available.");
      return;
    }

    const chosenFile = await api.dialog.openExcel(form);
    if (!chosenFile) {
      setMessage("No Excel file selected.");
      return;
    }

    await loadPreview(chosenFile);
  };

    const openDrivePicker = async () => {
    if (!api?.drive) {
      setMessage("Drive API is not available.");
      return;
    }
    setLoadingDrive(true);
    try {
      const authed = await api.drive.auth();
      if (!authed) {
        setMessage("Google Drive authentication failed.");
        return;
      }
      const picked = await api.drive.pick();
      if (picked && picked.id) {
        await downloadDriveFile(picked.id, picked.name || "Google_Drive_File.xlsx");
      }
    } catch (e: any) {
      setMessage(e.message || "Error accessing Google Drive.");
    } finally {
      setLoadingDrive(false);
    }
  };

  const downloadDriveFile = async (fileId: string, name: string) => {
    if (!api?.drive) return;
    setLoadingDrive(true);
    try {
      const tempPath = await api.drive.download(fileId, name);
      if (tempPath) {
        await loadPreview(tempPath);
      } else {
        setMessage("Failed to download file from Google Drive.");
      }
    } catch {
      setMessage("Error downloading file.");
    } finally {
      setLoadingDrive(false);
    }
  };

  const importFile = async () => {
    if (!filePath) {
      setMessage("Select a file before importing.");
      return;
    }

    if (!api?.import?.[form]) {
      setMessage("Import API is not available.");
      return;
    }

    setLoadingImport(true);
    setMessage("");

    try {
      const result = await api.import[form](filePath);
      const summaryResult = result?.summary ?? {};
      const rowsProcessed = Number(summaryResult.rowsProcessed ?? 0);
      setSummary(summaryResult);
      setMessage(`${importButtonLabel} completed. ${rowsProcessed} ${rowsProcessed === 1 ? "row" : "rows"} processed.`);
    } finally {
      setLoadingImport(false);
    }
  };

  const removeFile = () => {
    setFilePath(null);
    setFileName("");
    setFileSize(0);
    setPreviewRows([]);
    setSummary({});
    setMessage("");
  };

  return (
    <section className="rounded-[22px] border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667085]">{eyebrow}</div>
          <h2 className="text-[2rem] font-bold tracking-[-0.06em] text-[#111111] sm:text-[2.4rem]">{title}</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#475467]">{subtitle}</p>
        </div>

        <div className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${badgeClassName}`}>
          {badgeLabel}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => void selectFile()}
            className="group flex flex-1 flex-col items-center justify-center rounded-[20px] border border-dashed border-[#FCA5A5] bg-[#FFF5F5] px-6 py-8 text-center transition hover:border-[#DC2626] hover:bg-[#FFF0F0]"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_18px_rgba(220,38,38,0.08)]">
              <Upload className="h-7 w-7 text-[#DC2626]" />
            </div>
            <div className="text-[18px] font-semibold tracking-[-0.03em] text-[#111111]">Browse Local File</div>
            <div className="mt-1 text-[14px] text-[#475467]">from your computer</div>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#667085]">
              <span className="rounded-full border border-[#E4E7EC] bg-white px-2.5 py-1">.xlsx</span>
              <span className="rounded-full border border-[#E4E7EC] bg-white px-2.5 py-1">.xls</span>
              <span className="rounded-full border border-[#E4E7EC] bg-white px-2.5 py-1">.csv</span>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => void openDrivePicker()}
            disabled={loadingDrive}
            className="group flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[#E4E7EC] bg-[#FCFCFD] px-6 py-6 text-center transition hover:border-[#111111] hover:bg-[#F9FAFB] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-[#E4E7EC]">
              <Cloud className="h-5 w-5 text-[#111111]" />
            </div>
            <div className="text-[15px] font-semibold tracking-[-0.03em] text-[#111111]">
              {loadingDrive ? "Connecting..." : "Import from Google Drive"}
            </div>
          </button>
        </div>

        <div className="flex flex-col gap-4 rounded-[20px] border border-[#E4E7EC] bg-[#FCFCFD] p-4">
          {filePath ? (
            <div className="flex items-center justify-between gap-4 rounded-[16px] border border-[#E4E7EC] bg-white px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#E8F7EE] text-[#1B8A52]">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-[#111111]">{fileName}</div>
                  <div className="mt-1 text-[12px] text-[#667085]">{formatBytes(fileSize)}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={removeFile}
                className="inline-flex items-center gap-1 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] font-semibold text-[#B91C1C] transition hover:bg-[#FEE2E2]"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          ) : (
            <div className="rounded-[16px] border border-dashed border-[#E4E7EC] bg-white px-4 py-6 text-[14px] text-[#667085]">
              {emptyHint}
            </div>
          )}

          <button
            type="button"
            onClick={() => void loadPreview(filePath ?? "")}
            disabled={!filePath || loadingPreview}
            className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#DC2626] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_10px_18px_rgba(220,38,38,0.18)] transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            {loadingPreview ? "Loading Preview..." : "Preview Data"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="text-[12px] leading-6 text-[#667085]">Supported format: .xlsx / .xls / .csv (Max size: 10 MB)</div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.label} className={`rounded-[16px] border px-4 py-4 ${stat.className}`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#667085]">{stat.label}</div>
            <div className="mt-2 text-[28px] font-bold tracking-[-0.06em] text-[#111111]">{Number(summary[stat.key] ?? 0)}</div>
            <div className="mt-2 text-[12px] text-[#667085]">{index === 0 ? "Based on the selected spreadsheet" : "Preview counts only"}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-[18px] border border-[#E4E7EC] bg-white">
        <div className="border-b border-[#E4E7EC] bg-[#F9FAFB] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#667085]">Preview Data</div>
          <div className="mt-1 text-[13px] text-[#475467]">First {Math.min(previewRows.length, 10)} records from the selected file</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-[13px]">
            <thead className="bg-white text-[#667085]">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={`border-b border-[#E4E7EC] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] ${column.className ?? ""}`}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.length > 0 ? (
                previewRows.map((row, rowIndex) => (
                  <tr key={`${rowIndex}-${row.usn ?? "row"}`}>
                    {columns.map((column) => (
                      <td key={`${rowIndex}-${column.key}`} className={`border-b border-[#E4E7EC] px-3 py-3 text-[#111111] ${column.className ?? ""}`}>
                        {String(row[column.key] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-[14px] text-[#667085]" colSpan={columns.length}>
                    {message || emptyHint}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[13px] text-[#475467]">{description}</div>
        <button
          type="button"
          onClick={() => void importFile()}
          disabled={!filePath || loadingImport}
          className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#111111] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingImport ? "Importing..." : importButtonLabel}
        </button>
      </div>

      {message && (
        <div className="mt-5 rounded-[14px] border border-[#BDE7D2] bg-[#ECFDF5] px-4 py-3 text-sm font-medium text-[#065F46]">
          {message}
        </div>
      )}

      </section>
  );
}