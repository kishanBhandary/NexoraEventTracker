export default function ReportsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-black">Reports</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="border border-[#E5E5E5] bg-white p-6">
          <h2 className="text-xl font-bold text-black">Student Report</h2>
          <p className="mt-2 text-sm text-[#444444]">Student, USN, total events, wins, finalists and participation metrics.</p>
        </div>
        <div className="border border-[#E5E5E5] bg-white p-6">
          <h2 className="text-xl font-bold text-black">Event Report</h2>
          <p className="mt-2 text-sm text-[#444444]">Event, college, date and winner totals.</p>
        </div>
        <div className="border border-[#E5E5E5] bg-white p-6">
          <h2 className="text-xl font-bold text-black">Department Report</h2>
          <p className="mt-2 text-sm text-[#444444]">Branch participation, wins and final performance metrics.</p>
        </div>
      </div>
    </div>
  );
}
