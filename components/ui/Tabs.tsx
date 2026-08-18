"use client";
import { T } from "@/lib/theme";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  variant?: "segmented" | "underline";
}

/* Underline control — text row with an active underline + count pills */
function UnderlineTabs({ tabs, active, onChange }: Omit<TabsProps, "variant">) {
  return (
    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="relative h-10 inline-flex items-center gap-2 text-[14px] whitespace-nowrap shrink-0 transition-colors duration-200 cursor-pointer"
            style={isActive ? { color: T.text, fontWeight: 600 } : { color: T.muted }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = T.text; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = T.muted; }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className="text-[11px] font-semibold tabular-nums px-1.5 min-w-[19px] text-center rounded-full"
                style={isActive ? { background: "rgba(160,125,56,0.16)", color: "#8a6a2f" } : { background: "rgba(89,82,54,0.08)", color: T.faint }}
              >
                {tab.count}
              </span>
            )}
            {isActive && <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full" style={{ background: T.gold }} />}
          </button>
        );
      })}
    </div>
  );
}

/* Segmented control — recessed track, raised active pill */
export function Tabs({ tabs, active, onChange, variant = "segmented" }: TabsProps) {
  if (variant === "underline") return <UnderlineTabs tabs={tabs} active={active} onChange={onChange} />;
  return (
    <div
      className="inline-flex w-fit max-w-full items-center gap-0.5 p-[3px] rounded-full overflow-x-auto no-scrollbar"
      style={{ background: "rgba(89,82,54,0.055)" }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="h-8 px-3 rounded-full text-[12.5px] whitespace-nowrap inline-flex items-center gap-1.5 shrink-0 transition-all duration-200 cursor-pointer"
            style={
              isActive
                ? { background: T.card, color: T.text, fontWeight: 600, border: `1px solid ${T.borderSoft}`, boxShadow: "0 1px 2px rgba(43,42,34,0.08)" }
                : { color: T.muted, border: "1px solid transparent" }
            }
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = T.text; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = T.muted; }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`text-[10.5px] font-semibold tabular-nums text-center ${isActive ? "min-w-[17px] px-1.5 py-px rounded-full" : ""}`}
                style={isActive ? { color: T.accentInk, background: T.accent } : { color: T.faint }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
