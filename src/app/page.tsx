"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Plus, Search, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SpreadsheetImportCard } from "@/components/import/SpreadsheetImportCard";
import { Sidebar } from "@/components/layout/Sidebar";

type EventParticipationRow = {
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
  participationStatus: string;
  achievement: string;
  concernFormStatus: string;
  certificateStatus: string;
  winnerCertificateStatus: string;
  photosStatus: string;
};

type StudentProfileDraft = {
  name: string;
  email: string;
  phone: string;
  branch: string;
  semester: string;
  yearOfPassing: string;
};

const sectionTitles: Record<string, { title: string; subtitle: string; button: string }> = {
  students: { title: "All Students", subtitle: "Showing 1–8 of 8 students", button: "+ Import Concern Form" },
  events: { title: "All Events", subtitle: "Showing 1–8 of 8 events", button: "+ Add Event" },
  import: { title: "Data Import", subtitle: "Import student event information into the local database", button: "Upload Excel" },
  "import-form1": { title: "Form1 Concern Form", subtitle: "Upload and process concern form submissions", button: "Import Concern Form" },
  "import-form2": { title: "Form2 Participation", subtitle: "Upload participation records and achievement data", button: "Import Participation Form" },
  reports: { title: "Reports", subtitle: "Generate department and student achievement summaries", button: "+ Export Report" },
  settings: { title: "Settings", subtitle: "Configure application and storage preferences", button: "Save Settings" },
};

const normalizeBranch = (value: string) => {
  const text = String(value ?? "ISE").trim();
  return text.replace(/\s+/g, " ");
};

const isIseBranch = (value: string) => {
  const branch = normalizeBranch(value).toLowerCase();
  return branch.includes("ise") || branch.includes("information science") || branch.includes("information science and engineering");
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("students");
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<EventParticipationRow | null>(null);
  const [studentRows, setStudentRows] = useState<EventParticipationRow[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const [studentProfileDraft, setStudentProfileDraft] = useState<StudentProfileDraft>({
    name: "",
    email: "",
    phone: "",
    branch: "",
    semester: "",
    yearOfPassing: "",
  });
  const [isEditingStudentProfile, setIsEditingStudentProfile] = useState(false);

  const loadStudents = async () => {
    const api = (window as any).electronAPI;
    if (!api?.student?.list) return;

    const data = await api.student.list();
    const normalized = (Array.isArray(data) ? data : []).map((row: any) => ({
      usn: String(row.usn ?? ""),
      name: String(row.name ?? ""),
      email: String(row.email ?? ""),
      phone: String(row.phone ?? ""),
      branch: normalizeBranch(String(row.branch ?? "ISE")),
      semester: String(row.semester ?? ""),
      yearOfPassing: String(row.yearOfPassing ?? row.year_of_passing ?? ""),
      eventName: String(row.eventName ?? ""),
      eventType: String(row.eventType ?? ""),
      eventVenue: String(row.eventVenue ?? ""),
      eventDate: String(row.eventDate ?? ""),
      participationStatus: String(row.participationStatus ?? ""),
      achievement: String(row.achievement ?? ""),
      concernFormStatus: String(row.concernFormStatus ?? ""),
      certificateStatus: String(row.certificateStatus ?? ""),
      winnerCertificateStatus: String(row.winnerCertificateStatus ?? ""),
      photosStatus: String(row.photosStatus ?? ""),
    }));

    setStudentRows(normalized.filter((row) => isIseBranch(row.branch)));
  };

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api) return;
    api.report.summary().catch(() => undefined);
    void loadStudents();
  }, []);

  const matchedStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    const unique = new Map<string, EventParticipationRow>();
    studentRows.forEach((row) => {
      if (!isIseBranch(row.branch)) return;
      const haystack = [row.usn, row.name, row.email, row.phone].join(" ").toLowerCase();
      if (haystack.includes(query)) {
        unique.set(row.usn, row);
      }
    });

    return Array.from(unique.values());
  }, [search, studentRows]);

  const singleStudentMatch = matchedStudents.length === 1 ? matchedStudents[0] : null;

  const filteredRows = useMemo(() => {
    if (!search.trim()) {
      return studentRows.filter((row) => isIseBranch(row.branch));
    }

    return [];
  }, [search, studentRows]);

  const selectedStudentRecords = selectedRecord
    ? Array.from(
        new Map(
          studentRows
            .filter((row) => row.usn === selectedRecord.usn && isIseBranch(row.branch))
            .map((row) => [`${(row.eventName || "event").trim()}|${(row.eventDate || "date").trim()}`, row])
        ).values()
      )
    : [];

  const handleStudentProfileSave = async () => {
    if (!selectedRecord) return;
    const trimmedName = studentProfileDraft.name.trim();
    const trimmedEmail = studentProfileDraft.email.trim();
    const trimmedPhone = studentProfileDraft.phone.trim();
    const trimmedBranch = studentProfileDraft.branch.trim();
    const trimmedSemester = studentProfileDraft.semester.trim();
    const trimmedYear = studentProfileDraft.yearOfPassing.trim();

    if (!trimmedName) return;

    const api = (window as any).electronAPI;
    if (!api?.student?.upsert) return;

    await api.student.upsert({
      usn: selectedRecord.usn,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      branch: trimmedBranch,
      semester: trimmedSemester,
      year_of_passing: trimmedYear,
    });

    setSelectedRecord({
      ...selectedRecord,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      branch: trimmedBranch,
      semester: trimmedSemester,
      yearOfPassing: trimmedYear,
    });
    setStudentProfileDraft({
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      branch: trimmedBranch,
      semester: trimmedSemester,
      yearOfPassing: trimmedYear,
    });
    setIsEditingStudentProfile(false);
    await loadStudents();
  };

  const handleStudentDelete = async () => {
    if (!selectedRecord) return;

    const confirmed = window.confirm(`Delete student ${selectedRecord.name} (${selectedRecord.usn})?`);
    if (!confirmed) return;

    const api = (window as any).electronAPI;
    if (!api?.student?.delete) return;

    await api.student.delete(selectedRecord.usn);
    setSelectedRecord(null);
    await loadStudents();
  };

  const openStudentProfileEditor = () => {
    if (!selectedRecord) return;

    setStudentProfileDraft({
      name: selectedRecord.name,
      email: selectedRecord.email,
      phone: selectedRecord.phone,
      branch: selectedRecord.branch,
      semester: selectedRecord.semester,
      yearOfPassing: selectedRecord.yearOfPassing,
    });
    setIsEditingStudentProfile(true);
  };

  const handleClearData = async () => {
    const api = (window as any).electronAPI;
    if (!api?.database?.clearData) {
      setImportMessage("Data reset API is not available.");
      return;
    }

    const confirmed = window.confirm("This will permanently delete all students, events, and imported records from the local database. Continue?");
    if (!confirmed) return;

    const result = await api.database.clearData();
    setImportMessage(result?.message ?? "Database data cleared successfully.");
    setSelectedRecord(null);
    await loadStudents();
  };

  const renderImportForm1 = () => (
    <SpreadsheetImportCard
      form="form1"
      eyebrow="Concern Form"
      title="Form1 Concern Form"
      subtitle="Import and review student concern registration records from the concern form data sheet."
      badgeLabel="Active"
      badgeClassName="border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
      description="Local Excel import • SQLite storage"
      emptyHint="Select a concern form Excel file to preview the uploaded records."
      importButtonLabel="Import Form 1"
      stats={[
        { key: "rowsProcessed", label: "Total Records", className: "border-[#E0F2FE] bg-[#F0F9FF]" },
        { key: "newStudents", label: "New Students", className: "border-[#D1FAE5] bg-[#F0FDF4]" },
        { key: "newEvents", label: "New Event Registrations", className: "border-[#E9D5FF] bg-[#FAF5FF]" },
        { key: "duplicateRecords", label: "Duplicate Records", className: "border-[#FEF3C7] bg-[#FFFBEB]" },
      ]}
      columns={[
        { key: "usn", label: "USN" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "branch", label: "Branch" },
        { key: "semester", label: "Sem" },
        { key: "yearOfPassing", label: "Year" },
        { key: "eventName", label: "Event Name" },
        { key: "eventType", label: "Event Type" },
        { key: "eventVenue", label: "Event Venue" },
        { key: "eventDate", label: "Event Date" },
        { key: "concernForm", label: "Concern Form" },
      ]}
    />
  );

  const renderImportForm2 = () => (
    <SpreadsheetImportCard
      form="form2"
      eyebrow="Participation"
      title="Form2 Participation"
      subtitle="Import participation, certificate, and achievement updates from the post-event data sheet."
      badgeLabel="Updated"
      badgeClassName="border-[#DBEAFE] bg-[#EFF6FF] text-[#1D4ED8]"
      description="Event records • Achievement updates"
      emptyHint="Select a participation Excel file to preview the imported records."
      importButtonLabel="Import Form 2"
      stats={[
        { key: "rowsProcessed", label: "Total Records", className: "border-[#E0F2FE] bg-[#F0F9FF]" },
        { key: "matchedRegistrations", label: "Matched Registrations", className: "border-[#D1FAE5] bg-[#F0FDF4]" },
        { key: "certificatesSubmitted", label: "Certificates Submitted", className: "border-[#E9D5FF] bg-[#FAF5FF]" },
        { key: "recordsForReview", label: "Records For Review", className: "border-[#FEF3C7] bg-[#FFFBEB]" },
      ]}
      columns={[
        { key: "usn", label: "USN" },
        { key: "eventName", label: "Event Name" },
        { key: "eventDate", label: "Event Date" },
        { key: "participationStatus", label: "Participation" },
        { key: "achievement", label: "Achievement" },
        { key: "certificate", label: "Certificate" },
        { key: "winnerCertificate", label: "Winner Certificate" },
        { key: "photos", label: "Photos" },
      ]}
    />
  );

  const renderStudents = () => (
    <>
      <div className="mb-7 overflow-hidden rounded-[14px] border border-[#E4E7EC] bg-white shadow-[0_2px_8px_rgba(17,17,17,0.02)]">
        <div className="flex items-center gap-4 border-b border-[#E4E7EC] bg-white px-4 py-3.5">
          <div className="flex flex-1 items-center gap-3 rounded-[10px] border border-[#E4E7EC] bg-[#F9FAFB] px-3.5 py-3">
            <Search className="h-4 w-4 text-[#667085]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by USN, name, email or phone..."
              className="w-full border-none bg-transparent text-[15px] text-[#111111] placeholder:text-[#667085] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {search.trim() ? (
        matchedStudents.length > 0 ? (
          <div className="mb-7 space-y-3">
            {matchedStudents.map((student) => (
              <div key={student.usn} className="rounded-[14px] border border-[#E4E7EC] bg-white p-5 shadow-[0_2px_8px_rgba(17,17,17,0.02)]">
                <div className="flex items-center justify-between gap-5">
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#667085]">{student.usn}</div>
                    <div className="mt-2 text-[23px] font-bold tracking-[-0.03em] text-[#111111]">{student.name}</div>
                    <div className="mt-2 text-[15px] text-[#667085]">
                      {student.branch} • {student.semester} Semester • {student.yearOfPassing}
                    </div>
                    <div className="mt-3 text-[14px] text-[#111111]">{student.email}</div>
                    <div className="text-[14px] text-[#111111]">{student.phone}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedRecord(student)}
                    className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#D0D5DD] bg-white px-4 py-2.5 text-[14px] font-medium text-[#111111] transition hover:bg-[#FEF2F2] hover:border-[#DC2626] hover:text-[#B91C1C]"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-7 rounded-[14px] border border-[#E4E7EC] bg-white px-6 py-10 text-center shadow-[0_2px_8px_rgba(17,17,17,0.02)]">
            <div className="text-[18px] font-semibold text-[#111111]">No student found</div>
            <div className="mt-2 text-[14px] text-[#667085]">Try searching using:</div>
            <div className="mt-1 text-[14px] text-[#667085]">USN, Name, Email, or Phone number</div>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-[12px] border border-[#E4E7EC] bg-white shadow-[0_2px_8px_rgba(17,17,17,0.02)]">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[#F9FAFB] text-[#667085]">
              <tr>
                {['USN', 'Name', 'Branch', 'Semester', 'Year of Passing', 'Event Name', 'Event Venue', 'Actions'].map((header) => (
                  <th key={header} className="border-b border-[#E4E7EC] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={`${row.usn}-${row.eventName}`} className="bg-white hover:bg-[#FAFAFA]">
                  <td className="border-b border-[#E4E7EC] px-4 py-4 text-[14px] font-medium text-[#111111]">{row.usn}</td>
                  <td className="border-b border-[#E4E7EC] px-4 py-4 text-[14px] text-[#111111]">{row.name}</td>
                  <td className="border-b border-[#E4E7EC] px-4 py-4 text-[14px] text-[#111111]">{row.branch}</td>
                  <td className="border-b border-[#E4E7EC] px-4 py-4 text-[14px] text-[#111111]">{row.semester}</td>
                  <td className="border-b border-[#E4E7EC] px-4 py-4 text-[14px] text-[#111111]">{row.yearOfPassing}</td>
                  <td className="border-b border-[#E4E7EC] px-4 py-4 text-[14px] text-[#111111]">{row.eventName}</td>
                  <td className="border-b border-[#E4E7EC] px-4 py-4 text-[14px] text-[#111111]">{row.eventVenue}</td>
                  <td className="border-b border-[#E4E7EC] px-4 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(row)}
                      className="inline-flex items-center gap-2 rounded-[8px] border border-[#E4E7EC] bg-white px-3 py-2 text-[12px] font-medium text-[#111111] hover:bg-[#f5f5f5]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 flex items-center justify-between border-t border-[#E4E7EC] bg-white px-4 py-3 text-[13px] text-[#667085]">
            <div>Showing 1 to {filteredRows.length} of {filteredRows.length} students</div>
            <div className="flex items-center gap-3">
              <span>Rows per page</span>
              <div className="flex items-center gap-2 rounded-[8px] border border-[#E4E7EC] bg-[#F9FAFB] px-2 py-1.5">
                <span>10</span>
                <ChevronDown className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <button className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E4E7EC] bg-white text-[#111111]">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#111111] text-white">1</button>
                <button className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E4E7EC] bg-white text-[#111111]">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[14px] border border-[#E4E7EC] bg-white p-0 shadow-[0_12px_26px_rgba(17,17,17,0.1)]">
            <div className="flex items-center justify-between border-b border-[#E4E7EC] px-5 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#667085]">Student Details</div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#E4E7EC] bg-white text-[#111111] hover:bg-[#F5F5F5]"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#667085]">Student Profile</div>
                <div className="flex items-center gap-2">
                  {!isEditingStudentProfile ? (
                    <button
                      type="button"
                      onClick={openStudentProfileEditor}
                      className="rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-[12px] font-medium text-[#111111] hover:bg-[#F5F5F5]"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setStudentProfileDraft({
                          name: selectedRecord.name,
                          email: selectedRecord.email,
                          phone: selectedRecord.phone,
                          branch: selectedRecord.branch,
                          semester: selectedRecord.semester,
                          yearOfPassing: selectedRecord.yearOfPassing,
                        });
                        setIsEditingStudentProfile(false);
                      }}
                      className="rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-[12px] font-medium text-[#111111] hover:bg-[#F5F5F5]"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStudentDelete}
                    className="rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] font-medium text-[#B91C1C] hover:bg-[#FEE2E2]"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <table className="w-full border-collapse text-left text-[14px]">
                <tbody>
                  {[
                    {
                      label: 'USN',
                      value: selectedRecord.usn,
                    },
                    {
                      label: 'Name',
                      value: isEditingStudentProfile ? (
                        <input
                          value={studentProfileDraft.name}
                          onChange={(e) => setStudentProfileDraft((previous) => ({ ...previous, name: e.target.value }))}
                          className="w-full rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-[14px] text-[#111111] outline-none ring-0 focus:border-[#DC2626]"
                          placeholder="Student name"
                        />
                      ) : selectedRecord.name,
                    },
                    {
                      label: 'Email',
                      value: isEditingStudentProfile ? (
                        <input
                          value={studentProfileDraft.email}
                          onChange={(e) => setStudentProfileDraft((previous) => ({ ...previous, email: e.target.value }))}
                          className="w-full rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-[14px] text-[#111111] outline-none ring-0 focus:border-[#DC2626]"
                          placeholder="Student email"
                        />
                      ) : selectedRecord.email,
                    },
                    {
                      label: 'Phone',
                      value: isEditingStudentProfile ? (
                        <input
                          value={studentProfileDraft.phone}
                          onChange={(e) => setStudentProfileDraft((previous) => ({ ...previous, phone: e.target.value }))}
                          className="w-full rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-[14px] text-[#111111] outline-none ring-0 focus:border-[#DC2626]"
                          placeholder="Student phone"
                        />
                      ) : selectedRecord.phone,
                    },
                    {
                      label: 'Branch',
                      value: isEditingStudentProfile ? (
                        <input
                          value={studentProfileDraft.branch}
                          onChange={(e) => setStudentProfileDraft((previous) => ({ ...previous, branch: e.target.value }))}
                          className="w-full rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-[14px] text-[#111111] outline-none ring-0 focus:border-[#DC2626]"
                          placeholder="Student branch"
                        />
                      ) : selectedRecord.branch,
                    },
                    {
                      label: 'Semester',
                      value: isEditingStudentProfile ? (
                        <input
                          value={studentProfileDraft.semester}
                          onChange={(e) => setStudentProfileDraft((previous) => ({ ...previous, semester: e.target.value }))}
                          className="w-full rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-[14px] text-[#111111] outline-none ring-0 focus:border-[#DC2626]"
                          placeholder="Student semester"
                        />
                      ) : selectedRecord.semester,
                    },
                    {
                      label: 'Year of Passing',
                      value: isEditingStudentProfile ? (
                        <input
                          value={studentProfileDraft.yearOfPassing}
                          onChange={(e) => setStudentProfileDraft((previous) => ({ ...previous, yearOfPassing: e.target.value }))}
                          className="w-full rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-[14px] text-[#111111] outline-none ring-0 focus:border-[#DC2626]"
                          placeholder="Year of passing"
                        />
                      ) : selectedRecord.yearOfPassing,
                    },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="border-b border-[#E4E7EC] px-3 py-2 text-[#667085]">{row.label}</td>
                      <td className="border-b border-[#E4E7EC] px-3 py-2 text-[#111111]">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {isEditingStudentProfile && (
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStudentProfileDraft({
                        name: selectedRecord.name,
                        email: selectedRecord.email,
                        phone: selectedRecord.phone,
                        branch: selectedRecord.branch,
                        semester: selectedRecord.semester,
                        yearOfPassing: selectedRecord.yearOfPassing,
                      });
                      setIsEditingStudentProfile(false);
                    }}
                    className="rounded-[8px] border border-[#D0D5DD] bg-white px-3 py-2 text-[12px] font-medium text-[#111111] hover:bg-[#F5F5F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStudentProfileSave}
                    className="rounded-[8px] bg-[#111111] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#1F2937]"
                  >
                    Save Profile
                  </button>
                </div>
              )}

              <div>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#667085]">Event Participation</div>
                <table className="w-full border-collapse text-left text-[14px]">
                  <thead className="bg-[#F9FAFB] text-[#667085]">
                    <tr>
                      {['Event Name', 'Event Date', 'Event Type', 'Event Venue', 'Participation', 'Achievement', 'Certificate'].map((header) => (
                        <th key={header} className="border-b border-[#E4E7EC] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudentRecords.map((record) => (
                      <tr key={`${record.usn}-${record.eventName}-${record.eventDate}`}>
                        <td className="border-b border-[#E4E7EC] px-3 py-2 text-[#111111]">{record.eventName}</td>
                        <td className="border-b border-[#E4E7EC] px-3 py-2 text-[#111111]">{record.eventDate}</td>
                        <td className="border-b border-[#E4E7EC] px-3 py-2 text-[#111111]">{record.eventType}</td>
                        <td className="border-b border-[#E4E7EC] px-3 py-2 text-[#111111]">{record.eventVenue}</td>
                        <td className="border-b border-[#E4E7EC] px-3 py-2 text-[#111111]">{record.participationStatus}</td>
                        <td className="border-b border-[#E4E7EC] px-3 py-2 text-[#111111]">{record.achievement}</td>
                        <td className="border-b border-[#E4E7EC] px-3 py-2 text-[#111111]">{record.certificateStatus || 'Pending'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#667085]">Event Documents</div>
                <div className="space-y-4">
                  {selectedStudentRecords.length > 0 ? (
                    selectedStudentRecords.map((record) => (
                      <div key={`${record.usn}-${record.eventName}-${record.eventDate}-docs`} className="overflow-hidden rounded-[12px] border border-[#E4E7EC] bg-white">
                        <div className="flex items-center justify-between gap-3 border-b border-[#E4E7EC] bg-[#F9FAFB] px-3 py-3">
                          <div>
                            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#667085]">{record.eventName || 'Event'}</div>
                            <div className="mt-1 text-[13px] text-[#475467]">{record.eventDate || 'No date'} • {record.eventVenue || 'Venue not provided'}</div>
                          </div>
                          <button className="rounded-[8px] border border-[#E4E7EC] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#111111] hover:bg-[#F5F5F5]">
                            View Event Details
                          </button>
                        </div>

                        <table className="w-full border-collapse text-left text-[14px]">
                          <thead className="bg-[#F9FAFB] text-[#667085]">
                            <tr>
                              {['Document', 'Status', 'Action'].map((header) => (
                                <th key={`${record.usn}-${record.eventName}-${header}`} className="border-b border-[#E4E7EC] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              ['Concern / Permission Form', record.concernFormStatus || 'Pending'],
                              ['Certificate', record.certificateStatus || 'Pending'],
                              ['Winner Certificate', record.winnerCertificateStatus || 'Not Applicable'],
                              ['Photos', record.photosStatus || 'Pending'],
                            ].map(([label, status]) => (
                              <tr key={`${record.usn}-${record.eventName}-${label}`}>
                                <td className="border-b border-[#E4E7EC] px-3 py-2 text-[#111111]">{label}</td>
                                <td className="border-b border-[#E4E7EC] px-3 py-2 text-[#111111]">{status}</td>
                                <td className="border-b border-[#E4E7EC] px-3 py-2 text-[#111111]">
                                  <button className="rounded-[8px] border border-[#E4E7EC] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#111111] hover:bg-[#F5F5F5]">
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[12px] border border-[#E4E7EC] bg-[#F9FAFB] px-3 py-4 text-[14px] text-[#667085]">
                      No document information available for this student.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const currentSection = sectionTitles[activeTab] ?? sectionTitles.students;

  return (
    <div className="flex min-h-screen bg-[#f3f3f3] text-[#111111]">
      <Sidebar activeTab={activeTab} onSelect={setActiveTab} />

      <main className="flex-1 bg-[#F7F7F8]">
        <div className="mx-auto max-w-[1400px] px-10 py-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Students</div>
              <h1 className="text-[38px] font-bold tracking-[-0.06em] text-[#111111] sm:text-[44px]">{currentSection.title}</h1>
              <p className="mt-2 text-[15px] text-[#667085]">{currentSection.subtitle}</p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("import-form1")}
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#DC2626] px-5 py-3 text-[15px] font-semibold text-white shadow-[0_12px_22px_rgba(220,38,38,0.18)] transition hover:bg-[#B91C1C]"
            >
              <Plus className="h-4 w-4" />
              <span>{currentSection.button}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {activeTab === "students" && renderStudents()}
          {activeTab === "events" && <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 text-[#111111]">Events view placeholder.</div>}
          {activeTab === "import" && <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 text-[#111111]">Import view placeholder.</div>}
          {activeTab === "import-form1" && renderImportForm1()}
          {activeTab === "import-form2" && renderImportForm2()}
          {activeTab === "reports" && <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-6 text-[#111111]">Reports view placeholder.</div>}
          {activeTab === "settings" && (
            <div className="rounded-[22px] border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
              <div className="mb-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#667085]">Application</div>
                <h2 className="text-[2rem] font-bold tracking-[-0.06em] text-[#111111] sm:text-[2.4rem]">Settings</h2>
              </div>

              <div className="mt-6 rounded-[16px] border border-[#F1C6C6] bg-[#FEF2F2] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[14px] font-semibold uppercase tracking-[0.12em] text-[#B91C1C]">Danger Zone</div>
                    <h3 className="mt-2 text-[1.5rem] font-bold tracking-[-0.05em] text-[#111111]">Delete all stored data</h3>
                    <p className="mt-2 max-w-xl text-[15px] leading-7 text-[#475467]">
                      Delete all imported students, event entries, participation records, and verification data currently stored in the local SQLite database.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleClearData()}
                    className="inline-flex cursor-pointer items-center justify-center rounded-[12px] border border-[#DC2626] bg-[#DC2626] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(220,38,38,0.18)] transition hover:bg-[#B91C1C]"
                  >
                    Delete Data
                  </button>
                </div>
              </div>

              {importMessage && (
                <div className="mt-6 rounded-[14px] border border-[#BDE7D2] bg-[#ECFDF5] px-4 py-3 text-sm font-medium text-[#065F46] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                  {importMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
