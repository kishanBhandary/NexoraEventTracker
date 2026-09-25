type StatCardProps = {
  label: string;
  value: number | string;
  accent?: boolean;
};

export function StatCard({ label, value, accent = false }: StatCardProps) {
  return (
    <div className={`border border-[#E5E5E5] bg-white p-5 ${accent ? "bg-[#FEF2F2]" : ""}`}>
      <div className="text-[0.78rem] font-medium uppercase tracking-[0.14em] text-[#444444]">{label}</div>
      <div className="mt-4 text-[2.2rem] font-black tracking-[-0.05em] text-black">{value}</div>
    </div>
  );
}
