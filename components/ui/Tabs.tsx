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
    <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative px-3.5 py-2.5 text-[13px] rounded-t-[9px] transition-all duration-200 whitespace-nowrap cursor-pointer ${
              isActive ? "" : "hover:bg-[rgba(195,160,88,0.04)]"
            }`}
            style={{
              color: isActive ? T.text : T.muted,
              background: isActive ? T.card : "transparent",
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[10.5px] tabular-nums" style={{ color: isActive ? T.muted : T.faint }}>
                {tab.count}
              </span>
            )}
            {isActive && (
              <span
                className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                style={{ background: T.accent }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
