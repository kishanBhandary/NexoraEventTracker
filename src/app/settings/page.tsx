export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-black">Settings</h1>
      <div className="mt-8 max-w-2xl border border-[#E5E5E5] bg-white p-6">
        <div className="grid gap-4 text-sm text-[#444444]">
          <div className="flex justify-between border-b border-[#E5E5E5] pb-3"><span>Application Information</span><strong className="text-black">Student Event Tracker</strong></div>
          <div className="flex justify-between border-b border-[#E5E5E5] pb-3"><span>Database Location</span><strong className="text-black">AppData / local SQLite</strong></div>
          <div className="flex justify-between border-b border-[#E5E5E5] pb-3"><span>Storage Location</span><strong className="text-black">Offline local folder</strong></div>
          <div className="flex justify-between border-b border-[#E5E5E5] pb-3"><span>Application Version</span><strong className="text-black">0.1.0</strong></div>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="bg-[#DC2626] px-4 py-2 font-semibold text-white hover:bg-[#B91C1C]">Backup Database</button>
          <button className="border border-[#E5E5E5] bg-white px-4 py-2 font-semibold text-black hover:bg-[#F5F5F5]">Restore Database</button>
        </div>
      </div>
    </div>
  );
}
