import { ChevronDown, FileSpreadsheet, GraduationCap, Settings, Users } from "lucide-react";

const navItems = [
  { label: "Students", value: "students", icon: Users },
  { label: "Data Import", value: "import", icon: FileSpreadsheet },
  { label: "Settings", value: "settings", icon: Settings },
];

const importSubItems = [
  { label: "Import Concern Form", value: "import-form1" },
  { label: "Import Participation Form", value: "import-form2" },
];

export function Sidebar({ activeTab, onSelect }: { activeTab: string; onSelect: (value: string) => void }) {
  const showImportChildren = activeTab === "import" || activeTab === "import-form1" || activeTab === "import-form2";

  return (
    <aside className="flex w-[300px] flex-col border-r border-[#E4E7EC] bg-[#F7F7F8] px-4 py-5">
      <div className="mb-8 flex items-center gap-3 px-2 pt-1">
        <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#111111] text-white shadow-[0_8px_20px_rgba(17,17,17,0.12)]">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="leading-[1.15]">
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#111111]">Student Event</div>
          <div className="text-[12px] font-bold uppercase tracking-[0.09em] text-[#111111]">Achievement Tracker</div>
        </div>
      </div>

      <div className="mb-4 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#667085]">College Administration</div>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.value;
          const isImport = item.value === "import";

          return (
            <div key={item.value}>
              <button
                type="button"
                onClick={() => onSelect(item.value)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-[15px] font-medium transition-colors ${
                  active ? "border-l-[3px] border-[#DC2626] bg-[#F3F3F3] pl-[10px] text-[#111111]" : "text-[#111111] hover:bg-[#F1F1F1]"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-[#111111]" />
                  <span>{item.label}</span>
                </span>
                {isImport && <ChevronDown className={`h-4 w-4 text-[#667085] transition ${showImportChildren ? "rotate-180" : ""}`} />}
              </button>

              {isImport && showImportChildren && (
                <div className="mt-1 space-y-1 pb-1 pl-10 pr-1">
                  {importSubItems.map((subItem) => {
                    const childActive = activeTab === subItem.value;
                    return (
                      <button
                        key={subItem.value}
                        type="button"
                        onClick={() => onSelect(subItem.value)}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[14px] transition ${
                          childActive ? "bg-[#FEF2F2] text-[#111111]" : "text-[#111111] hover:bg-[#F1F1F1]"
                        }`}
                      >
                        <span>{subItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
