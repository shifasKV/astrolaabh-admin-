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
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" style={{ borderBottom: `1px solid ${T.border}` }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="relative -mb-px px-3 py-2.5 text-[13.5px] transition-colors duration-200 whitespace-nowrap cursor-pointer"
            style={{
              color: isActive ? T.text : T.muted,
              fontWeight: isActive ? 600 : 400,
              borderBottom: `2px solid ${isActive ? T.accent : "transparent"}`,
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = T.text; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = T.muted; }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className="ml-1.5 text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded-full align-middle"
                style={{
                  color: isActive ? T.accent : T.faint,
                  background: isActive ? T.accentMuted : "rgba(89,82,54,0.07)",
                }}
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
