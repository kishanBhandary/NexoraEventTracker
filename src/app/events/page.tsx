export default function EventsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black">Events</h1>
        <p className="text-sm text-[#444444]">Track event participation, winners and college-level performance.</p>
      </div>
      <div className="overflow-hidden border border-[#E5E5E5] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F5F5F5] text-[#444444]">
            <tr>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Event Name</th>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Event Type</th>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Host College</th>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Event Date</th>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Participants</th>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Winners</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-[#E5E5E5] px-4 py-3">Hackathon 2026</td>
              <td className="border-b border-[#E5E5E5] px-4 py-3">Hackathon</td>
              <td className="border-b border-[#E5E5E5] px-4 py-3">XYZ College</td>
              <td className="border-b border-[#E5E5E5] px-4 py-3">10 Sep 2026</td>
              <td className="border-b border-[#E5E5E5] px-4 py-3">42</td>
              <td className="border-b border-[#E5E5E5] px-4 py-3">5</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
