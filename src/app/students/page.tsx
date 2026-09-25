export default function StudentsPage() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black">Students</h1>
          <p className="text-sm text-[#444444]">Search, filter, sort and inspect student records.</p>
        </div>
        <button className="bg-[#DC2626] px-4 py-2 font-semibold text-white hover:bg-[#B91C1C]">Add Student</button>
      </div>
      <div className="overflow-hidden border border-[#E5E5E5] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F5F5F5] text-[#444444]">
            <tr>
              <th className="border-b border-[#E5E5E5] px-4 py-3">USN</th>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Name</th>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Email</th>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Branch</th>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Semester</th>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Total Events</th>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Wins</th>
              <th className="border-b border-[#E5E5E5] px-4 py-3">Certificate Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b border-[#E5E5E5] px-4 py-3">4AJ22IS001</td>
              <td className="border-b border-[#E5E5E5] px-4 py-3">Rahul Kumar</td>
              <td className="border-b border-[#E5E5E5] px-4 py-3">rahul@gmail.com</td>
              <td className="border-b border-[#E5E5E5] px-4 py-3">ISE</td>
              <td className="border-b border-[#E5E5E5] px-4 py-3">5th Semester</td>
              <td className="border-b border-[#E5E5E5] px-4 py-3">6</td>
              <td className="border-b border-[#E5E5E5] px-4 py-3">2</td>
              <td className="border-b border-[#E5E5E5] px-4 py-3">Verified</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
