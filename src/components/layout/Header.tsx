export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-[#E5E5E5] bg-[#F7F7F7] px-8 py-6">
      <div>
        <h2 className="text-[2.2rem] font-black tracking-[-0.06em] text-[#111111]">All Student Records</h2>
        <p className="mt-1 text-[15px] text-[#444444]">Showing 1–12 of 34 students</p>
      </div>
      <button className="bg-[#111111] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#000000]">
        + New Registration
      </button>
    </header>
  );
}
