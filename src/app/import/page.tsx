"use client";

import { SpreadsheetImportCard } from "@/components/import/SpreadsheetImportCard";

export default function ImportPage() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-black">Data Import</h1>
        <p className="mt-2 text-sm text-[#475467]">Preview and import both concern form spreadsheets from the same upload flow.</p>
      </div>

      <div className="space-y-8">
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
      </div>
    </div>
  );
}
