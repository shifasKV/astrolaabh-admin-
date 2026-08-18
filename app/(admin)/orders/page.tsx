"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, GoldBtn, Select, ShopifyButton, Pagination, downloadXLS, downloadPDF, fmtChipDate, ExportBtn, ToolbarSearch, FiltersPopover, FilterField, FilterChip, DateRangeFields, EmptyState, TableSkeleton } from "@/components/ui";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { T } from "@/lib/theme";
import { MOCK_ORDERS, MOCK_INCOMPLETE_ORDERS } from "@/lib/mock";
import { inr } from "@/lib/types";

const TABS = [
  { key: "all", label: "All orders" },
  { key: "payment_pending", label: "Payment pending" },
  { key: "not_shipped", label: "Not shipped" },
  { key: "cert_missing", label: "Cert missing" },
  { key: "energ_missing", label: "Energ missing" },
  { key: "incomplete", label: "Incomplete" },
];

const INCOMPLETE_REASON_LABEL: Record<string, string> = {
  payment_failed: "Payment failed",
  abandoned_cart: "Cart abandoned",
  payment_expired: "Payment expired",
  card_declined: "Card declined",
  requested_call: "Requested call",
};

const INCOMPLETE_REASON_TONE: Record<string, "danger" | "gold" | "muted"> = {
  payment_failed: "danger",
  abandoned_cart: "gold",
  payment_expired: "muted",
  card_declined: "danger",
  requested_call: "gold",
};

type SortKey = "date_desc" | "date_asc" | "amount_high" | "amount_low";

const STATUS_FILTER_LABEL: Record<string, string> = {
  payment_pending: "Payment pending",
  cert_missing: "Cert missing",
  energ_missing: "Energ missing",
  not_shipped: "Not shipped",
  in_transit: "In transit",
  delivered: "Delivered",
};

const STONE_TYPE_OPTIONS = [
  { value: "", label: "All stone types" },
  { value: "pukhraj", label: "Pukhraj (Yellow Sapphire)" },
  { value: "manik", label: "Manik (Ruby)" },
  { value: "neelam", label: "Neelam (Blue Sapphire)" },
  { value: "panna", label: "Panna (Emerald)" },
  { value: "heera", label: "Heera (Diamond)" },
  { value: "gomed", label: "Gomed (Hessonite)" },
  { value: "moonga", label: "Moonga (Red Coral)" },
  { value: "moti", label: "Moti (Pearl)" },
  { value: "lehsunia", label: "Lehsunia (Cat's Eye)" },
];

const STONE_TYPE_MATCH: Record<string, string[]> = {
  pukhraj: ["pukhraj", "yellow sapphire"],
  manik: ["manik", "ruby"],
  neelam: ["neelam", "blue sapphire"],
  panna: ["panna", "emerald"],
  heera: ["heera", "diamond"],
  gomed: ["gomed", "hessonite"],
  moonga: ["moonga", "coral"],
  moti: ["moti", "pearl"],
  lehsunia: ["lehsunia", "cat's eye"],
};

const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last_7", label: "Last 7 days" },
  { key: "last_30", label: "Last 30 days" },
  { key: "last_90", label: "Last 90 days" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "custom", label: "Custom range" },
] as const;

function getPresetDates(key: string): { from: string; to: string } {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  switch (key) {
    case "today": return { from: iso(today), to: iso(today) };
    case "yesterday": { const y = new Date(today); y.setDate(y.getDate() - 1); return { from: iso(y), to: iso(y) }; }
    case "last_7": { const d = new Date(today); d.setDate(d.getDate() - 7); return { from: iso(d), to: iso(today) }; }
    case "last_30": { const d = new Date(today); d.setDate(d.getDate() - 30); return { from: iso(d), to: iso(today) }; }
    case "last_90": { const d = new Date(today); d.setDate(d.getDate() - 90); return { from: iso(d), to: iso(today) }; }
    case "this_month": return { from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today) };
    case "last_month": return { from: iso(new Date(today.getFullYear(), today.getMonth() - 1, 1)), to: iso(new Date(today.getFullYear(), today.getMonth(), 0)) };
    default: return { from: "", to: "" };
  }
}

function MiniCalendar({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [viewDate, setViewDate] = useState(() => value ? new Date(value + "T00:00") : new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const days: (number | null)[] = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthName = viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const iso = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const selectedDate = value;

  return (
    <div>
      <div className="text-[10px] font-medium tracking-[0.06em] uppercase mb-1.5" style={{ color: T.faint }}>{label}</div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer hover:bg-[rgba(89,82,54,0.08)]" style={{ color: T.muted }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <span className="text-[12px] font-medium" style={{ color: T.text }}>{monthName}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer hover:bg-[rgba(89,82,54,0.08)]" style={{ color: T.muted }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="text-[9px] font-medium py-1" style={{ color: T.faint }}>{d}</span>
        ))}
        {days.map((day, i) => {
          if (day === null) return <span key={`e-${i}`} />;
          const dateStr = iso(day);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === new Date().toISOString().slice(0, 10);
          return (
            <button
              key={i}
              onClick={() => onChange(dateStr)}
              className="w-7 h-7 rounded-[6px] text-[11px] flex items-center justify-center cursor-pointer transition-colors"
              style={{
                background: isSelected ? T.primary : "transparent",
                color: isSelected ? T.primaryInk : isToday ? T.accent : T.text,
                fontWeight: isSelected || isToday ? 600 : 400,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterButton({ label, active, open, onClick, icon }: { label: string; active: boolean; open: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="h-9 px-3 rounded-[9px] text-[12.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 whitespace-nowrap"
      style={{
        background: active ? T.accentFaint : open ? T.accentFaint : T.bg,
        border: `1px solid ${active ? T.accentBorder : open ? T.accentBorder : T.border}`,
        color: active ? T.accent : T.text,
      }}
    >
      {icon}
      {label}
      {active && (
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
      )}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3" style={{ color: T.faint }}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

function StatusFilterDropdown({ value, onChange, open, onToggle, resetPage }: { value: string[]; onChange: (v: string[]) => void; open: boolean; onToggle: () => void; resetPage: () => void }) {
  const toggle = (v: string) => {
    if (!v) { onChange([]); resetPage(); return; }
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    onChange(next);
    resetPage();
  };
  const label = value.length === 0 ? "Status" : value.length === 1 ? STATUS_FILTER_LABEL[value[0]] : `${value.length} statuses`;
  return (
    <div className="relative">
      <FilterButton
        label={label}
        active={value.length > 0}
        open={open}
        onClick={onToggle}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-[220px] rounded-[12px] p-1.5" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
            {[{ value: "", label: "All statuses" }, ...Object.entries(STATUS_FILTER_LABEL).map(([k, v]) => ({ value: k, label: v }))].map((opt) => {
              const isActive = opt.value === "" ? value.length === 0 : value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[12.5px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                  style={{ color: isActive ? T.accent : T.text, fontWeight: isActive ? 600 : 400, background: isActive ? T.accentFaint : "transparent" }}
                >
                  <span className="w-3.5 h-3.5 rounded-[3px] flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${isActive ? T.accent : "rgba(89,82,54,0.25)"}`, background: isActive ? T.accent : "transparent" }}>
                    {isActive && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function DateFilterDropdown({ from, to, onChangeFrom, onChangeTo, open, onToggle, resetPage }: { from: string; to: string; onChangeFrom: (v: string) => void; onChangeTo: (v: string) => void; open: boolean; onToggle: () => void; resetPage: () => void }) {
  const [datePreset, setDatePreset] = useState<string>("");
  const hasValue = !!(from || to);

  const handlePreset = (key: string) => {
    setDatePreset(key);
    if (key !== "custom") {
      const dates = getPresetDates(key);
      onChangeFrom(dates.from);
      onChangeTo(dates.to);
      resetPage();
    }
  };

  const dateLabel = hasValue
    ? `${from ? new Date(from + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "…"} – ${to ? new Date(to + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "…"}`
    : "Order Date";

  return (
    <div className="relative">
      <FilterButton
        label={dateLabel}
        active={hasValue}
        open={open}
        onClick={onToggle}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-[520px] rounded-[12px] p-4" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
            <div className="flex gap-4">
              {/* Left: presets */}
              <div className="w-[148px] shrink-0 space-y-0.5">
                <div className="text-[10px] font-medium tracking-[0.06em] uppercase mb-2" style={{ color: T.faint }}>Quick select</div>
                {DATE_PRESETS.map((p) => {
                  const isActive = datePreset === p.key;
                  return (
                    <button
                      key={p.key}
                      onClick={() => handlePreset(p.key)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] text-[11.5px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                      style={{ color: isActive ? T.accent : T.text, fontWeight: isActive ? 600 : 400, background: isActive ? T.accentFaint : "transparent" }}
                    >
                      <span className="w-[13px] h-[13px] rounded-full flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${isActive ? T.accent : "rgba(89,82,54,0.3)"}` }}>
                        {isActive && <span className="w-[5px] h-[5px] rounded-full" style={{ background: T.accent }} />}
                      </span>
                      {p.label}
                    </button>
                  );
                })}
                {hasValue && (
                  <button
                    onClick={() => { onChangeFrom(""); onChangeTo(""); setDatePreset(""); resetPage(); }}
                    className="w-full mt-2 text-[11px] text-left px-2.5 py-1 cursor-pointer hover:underline underline-offset-4"
                    style={{ color: T.danger }}
                  >
                    Clear dates
                  </button>
                )}
              </div>
              {/* Right: calendars */}
              <div className="flex-1 min-w-0" style={{ borderLeft: `1px solid ${T.borderSoft}`, paddingLeft: "16px" }}>
                <div className="grid grid-cols-2 gap-3">
                  <MiniCalendar value={from} onChange={(v) => { onChangeFrom(v); setDatePreset("custom"); resetPage(); }} label="From" />
                  <MiniCalendar value={to} onChange={(v) => { onChangeTo(v); setDatePreset("custom"); resetPage(); }} label="To" />
                </div>
                {hasValue && (
                  <div className="mt-3 pt-2.5 text-[11px] flex items-center gap-2" style={{ borderTop: `1px solid ${T.borderSoft}`, color: T.muted }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0" style={{ color: T.accent }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                    <span>{from ? new Date(from + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Start"}</span>
                    <span style={{ color: T.faint }}>→</span>
                    <span>{to ? new Date(to + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "End"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StoneTypeFilterDropdown({ value, onChange, open, onToggle, resetPage }: { value: string[]; onChange: (v: string[]) => void; open: boolean; onToggle: () => void; resetPage: () => void }) {
  const toggle = (v: string) => {
    if (!v) { onChange([]); resetPage(); return; }
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    onChange(next);
    resetPage();
  };
  const label = value.length === 0 ? "Stone Type" : value.length === 1 ? (STONE_TYPE_OPTIONS.find(s => s.value === value[0])?.label.split(" (")[0] || "Stone") : `${value.length} stones`;
  return (
    <div className="relative">
      <FilterButton
        label={label}
        active={value.length > 0}
        open={open}
        onClick={onToggle}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-[240px] rounded-[12px] p-1.5" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
            {STONE_TYPE_OPTIONS.filter(o => o.value !== "").map((opt) => {
              const isActive = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[12.5px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                  style={{ color: isActive ? T.accent : T.text, fontWeight: isActive ? 600 : 400, background: isActive ? T.accentFaint : "transparent" }}
                >
                  <span className="w-3.5 h-3.5 rounded-[3px] flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${isActive ? T.accent : "rgba(89,82,54,0.25)"}`, background: isActive ? T.accent : "transparent" }}>
                    {isActive && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function OrderByFilterDropdown({ value, onChange, open, onToggle, resetPage }: { value: string[]; onChange: (v: string[]) => void; open: boolean; onToggle: () => void; resetPage: () => void }) {
  const options = [
    { value: "customer", label: "Customer" },
    { value: "ops", label: "Ops" },
  ];
  const toggle = (v: string) => {
    const next = value.includes(v) ? value.filter((x) => x !== v) : [...value, v];
    onChange(next);
    resetPage();
  };
  const label = value.length === 0 ? "Order By" : value.length === 2 ? "All" : value.includes("customer") ? "Customer" : "Ops";
  return (
    <div className="relative">
      <FilterButton
        label={label}
        active={value.length > 0}
        open={open}
        onClick={onToggle}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-[200px] rounded-[12px] p-1.5" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
            {options.map((opt) => {
              const isActive = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[12.5px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                  style={{ color: isActive ? T.accent : T.text, fontWeight: isActive ? 600 : 400, background: isActive ? T.accentFaint : "transparent" }}
                >
                  <span className="w-3.5 h-3.5 rounded-[3px] flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${isActive ? T.accent : "rgba(89,82,54,0.25)"}`, background: isActive ? T.accent : "transparent" }}>
                    {isActive && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function IncReasonFilter({ value, onChange, open, onToggle, resetPage }: { value: string[]; onChange: (v: string[]) => void; open: boolean; onToggle: () => void; resetPage: () => void }) {
  const toggle = (v: string) => { const next = value.includes(v) ? value.filter(x => x !== v) : [...value, v]; onChange(next); resetPage(); };
  const label = value.length === 0 ? "Status" : value.length === 1 ? (INCOMPLETE_REASON_LABEL[value[0]] || value[0]) : `${value.length} reasons`;
  return (
    <div className="relative">
      <FilterButton label={label} active={value.length > 0} open={open} onClick={onToggle}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>} />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-[220px] rounded-[12px] p-1.5" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
            {Object.entries(INCOMPLETE_REASON_LABEL).map(([k, v]) => {
              const isActive = value.includes(k);
              return (
                <button key={k} onClick={() => toggle(k)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[12.5px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                  style={{ color: isActive ? T.accent : T.text, fontWeight: isActive ? 600 : 400, background: isActive ? T.accentFaint : "transparent" }}>
                  <span className="w-3.5 h-3.5 rounded-[3px] flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${isActive ? T.accent : "rgba(89,82,54,0.25)"}`, background: isActive ? T.accent : "transparent" }}>
                    {isActive && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </span>
                  {v}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function IncStoneFilter({ value, onChange, stones, open, onToggle, resetPage }: { value: string[]; onChange: (v: string[]) => void; stones: string[]; open: boolean; onToggle: () => void; resetPage: () => void }) {
  const toggle = (v: string) => { const next = value.includes(v) ? value.filter(x => x !== v) : [...value, v]; onChange(next); resetPage(); };
  const label = value.length === 0 ? "Stone" : value.length === 1 ? value[0].split(" ")[0] : `${value.length} stones`;
  return (
    <div className="relative">
      <FilterButton label={label} active={value.length > 0} open={open} onClick={onToggle}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>} />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-[260px] max-h-[300px] overflow-y-auto rounded-[12px] p-1.5" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
            {stones.map((s) => {
              const isActive = value.includes(s);
              return (
                <button key={s} onClick={() => toggle(s)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[12.5px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                  style={{ color: isActive ? T.accent : T.text, fontWeight: isActive ? 600 : 400, background: isActive ? T.accentFaint : "transparent" }}>
                  <span className="w-3.5 h-3.5 rounded-[3px] flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${isActive ? T.accent : "rgba(89,82,54,0.25)"}`, background: isActive ? T.accent : "transparent" }}>
                    {isActive && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </span>
                  {s}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function IncDateFilter({ from, to, onChangeFrom, onChangeTo, open, onToggle, resetPage }: { from: string; to: string; onChangeFrom: (v: string) => void; onChangeTo: (v: string) => void; open: boolean; onToggle: () => void; resetPage: () => void }) {
  const [datePreset, setDatePreset] = useState<string>("");
  const hasValue = !!(from || to);
  const handlePreset = (key: string) => { setDatePreset(key); if (key !== "custom") { const d = getPresetDates(key); onChangeFrom(d.from); onChangeTo(d.to); resetPage(); } };
  const dateLabel = hasValue
    ? `${from ? new Date(from + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "…"} – ${to ? new Date(to + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "…"}`
    : "Failed Date";
  return (
    <div className="relative">
      <FilterButton label={dateLabel} active={hasValue} open={open} onClick={onToggle}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>} />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-[520px] rounded-[12px] p-4" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
            <div className="flex gap-4">
              <div className="w-[148px] shrink-0 space-y-0.5">
                <div className="text-[10px] font-medium tracking-[0.06em] uppercase mb-2" style={{ color: T.faint }}>Quick select</div>
                {DATE_PRESETS.map((p) => {
                  const isActive = datePreset === p.key;
                  return (
                    <button key={p.key} onClick={() => handlePreset(p.key)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] text-[11.5px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                      style={{ color: isActive ? T.accent : T.text, fontWeight: isActive ? 600 : 400, background: isActive ? T.accentFaint : "transparent" }}>
                      <span className="w-[13px] h-[13px] rounded-full flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${isActive ? T.accent : "rgba(89,82,54,0.3)"}` }}>
                        {isActive && <span className="w-[5px] h-[5px] rounded-full" style={{ background: T.accent }} />}
                      </span>
                      {p.label}
                    </button>
                  );
                })}
                {hasValue && (
                  <button onClick={() => { onChangeFrom(""); onChangeTo(""); setDatePreset(""); resetPage(); }}
                    className="w-full mt-2 text-[11px] text-left px-2.5 py-1 cursor-pointer hover:underline underline-offset-4" style={{ color: T.danger }}>Clear dates</button>
                )}
              </div>
              <div className="flex-1 min-w-0" style={{ borderLeft: `1px solid ${T.borderSoft}`, paddingLeft: "16px" }}>
                <div className="grid grid-cols-2 gap-3">
                  <MiniCalendar value={from} onChange={(v) => { onChangeFrom(v); setDatePreset("custom"); resetPage(); }} label="From" />
                  <MiniCalendar value={to} onChange={(v) => { onChangeTo(v); setDatePreset("custom"); resetPage(); }} label="To" />
                </div>
                {hasValue && (
                  <div className="mt-3 pt-2.5 text-[11px] flex items-center gap-2" style={{ borderTop: `1px solid ${T.borderSoft}`, color: T.muted }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0" style={{ color: T.accent }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                    <span>{from ? new Date(from + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Start"}</span>
                    <span style={{ color: T.faint }}>→</span>
                    <span>{to ? new Date(to + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "End"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPlacedBy, setFilterPlacedBy] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterStoneType, setFilterStoneType] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState<"status" | "date" | "stone" | "placedBy" | null>(null);
  const [page, setPage] = useState(1);

  // Incomplete tab filters
  const [incFilterCustomer, setIncFilterCustomer] = useState("");
  const [incFilterStone, setIncFilterStone] = useState<string[]>([]);
  const [incFilterReason, setIncFilterReason] = useState<string[]>([]);
  const [incFilterDateFrom, setIncFilterDateFrom] = useState("");
  const [incFilterDateTo, setIncFilterDateTo] = useState("");
  const [incOpenFilter, setIncOpenFilter] = useState<"reason" | "stone" | "date" | null>(null);
  const [incShowFilters, setIncShowFilters] = useState(false);
  const [incSort, setIncSort] = useState<SortKey>("date_desc");
  const [incPage, setIncPage] = useState(1);

  const PER_PAGE = 10;
  const loading = useSimulatedLoad();

  const matchesStatus = (o: (typeof MOCK_ORDERS)[number], status: string) => {
    if (!status) return true;
    if (status === "payment_pending") return o.paymentStatus === "pending";
    if (status === "cert_missing") return o.certificateStatus === "missing" && o.paymentStatus === "paid";
    if (status === "energ_missing") return o.energisationStatus === "pending" && o.paymentStatus === "paid";
    if (status === "not_shipped") return o.paymentStatus === "paid" && o.shopifyStatus !== "fulfilled" && !o.tracking;
    if (status === "in_transit") return !!o.tracking && o.shopifyStatus !== "fulfilled";
    if (status === "delivered") return o.shopifyStatus === "fulfilled";
    return true;
  };

  const filtered = MOCK_ORDERS.filter((o) => (tab === "all" || tab === "incomplete") ? true : matchesStatus(o, tab)).filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.items.some((i) => i.name.toLowerCase().includes(q));
  }).filter((o) => {
    if (filterCustomer && o.customerName !== filterCustomer) return false;
    return true;
  }).filter((o) => {
    if (filterStatus.length === 0) return true;
    return filterStatus.some((s) => matchesStatus(o, s));
  }).filter((o) => {
    if (filterDateFrom && o.placedAt < filterDateFrom) return false;
    if (filterDateTo && o.placedAt > filterDateTo) return false;
    return true;
  }).filter((o) => {
    if (filterPlacedBy.length === 0) return true;
    if (filterPlacedBy.includes("customer") && !o.placedBy) return true;
    if (filterPlacedBy.includes("ops") && !!o.placedBy) return true;
    return false;
  }).filter((o) => {
    if (filterStoneType.length === 0) return true;
    return filterStoneType.some((st) => {
      const keywords = STONE_TYPE_MATCH[st] || [];
      return o.items.some((item) => {
        const name = item.name.toLowerCase();
        const gem = (item.gemstone || "").toLowerCase();
        return keywords.some((kw) => name.includes(kw) || gem.includes(kw));
      });
    });
  }).sort((a, b) => {
    if (sort === "date_desc") return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
    if (sort === "date_asc") return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
    if (sort === "amount_high") return b.total - a.total;
    if (sort === "amount_low") return a.total - b.total;
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const uniqueCustomers = [...new Set(MOCK_ORDERS.map((o) => o.customerName))].sort();
  const hasActiveFilters = !!filterCustomer || filterStatus.length > 0 || !!filterDateFrom || !!filterDateTo || filterPlacedBy.length > 0 || filterStoneType.length > 0;
  const activeFilterCount = [filterCustomer, filterStatus.length > 0 ? "1" : "", filterPlacedBy.length > 0 ? "1" : "", filterStoneType.length > 0 ? "1" : "", (filterDateFrom || filterDateTo) ? "1" : ""].filter(Boolean).length;
  const statusCounts = Object.fromEntries(
    Object.keys(STATUS_FILTER_LABEL).map((k) => [k, MOCK_ORDERS.filter((o) => matchesStatus(o, k)).length]),
  );

  // Incomplete tab — computed at component scope so global export can reach it
  const incCustomers = [...new Set(MOCK_INCOMPLETE_ORDERS.map((o) => o.customerName))].sort();
  const incStones = [...new Set(MOCK_INCOMPLETE_ORDERS.map((o) => o.itemName))].sort();
  const hasIncFilters = !!incFilterCustomer || incFilterStone.length > 0 || incFilterReason.length > 0 || !!incFilterDateFrom || !!incFilterDateTo;
  const incFilterCount = [incFilterCustomer, incFilterStone.length > 0 ? "1" : "", incFilterReason.length > 0 ? "1" : "", incFilterDateFrom || incFilterDateTo].filter(Boolean).length;

  const incFiltered = MOCK_INCOMPLETE_ORDERS
    .filter((o) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return o.customerName.toLowerCase().includes(q) || o.itemName.toLowerCase().includes(q);
    })
    .filter((o) => !incFilterCustomer || o.customerName === incFilterCustomer)
    .filter((o) => incFilterStone.length === 0 || incFilterStone.includes(o.itemName))
    .filter((o) => incFilterReason.length === 0 || incFilterReason.includes(o.reason))
    .filter((o) => {
      if (incFilterDateFrom && o.failedAt < incFilterDateFrom) return false;
      if (incFilterDateTo && o.failedAt > incFilterDateTo) return false;
      return true;
    })
    .sort((a, b) => {
      if (incSort === "date_asc") return new Date(a.failedAt).getTime() - new Date(b.failedAt).getTime();
      if (incSort === "amount_high") return b.amount - a.amount;
      if (incSort === "amount_low") return a.amount - b.amount;
      return new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime();
    });

  const incTotalPages = Math.ceil(incFiltered.length / PER_PAGE);
  const incCurrentPage = incPage > incTotalPages && incTotalPages > 0 ? incTotalPages : incPage;
  const incPaginated = incFiltered.slice((incCurrentPage - 1) * PER_PAGE, incCurrentPage * PER_PAGE);

  /* Global export — respects active tab + filters, scoped to the chosen period */
  const handleExport = ({ from, to, format, periodLabel }: { from: string; to: string; format: "pdf" | "xls"; periodLabel: string }) => {
    const inRange = (d: string) => (!from || d.slice(0, 10) >= from) && (!to || d.slice(0, 10) <= to);
    if (tab === "incomplete") {
      const header = ["Customer", "Item", "Failed at", "Reason", "Amount (INR)"];
      const rows = incFiltered.filter((o) => inRange(o.failedAt)).map((o) => [o.customerName, o.itemName, o.failedAt, INCOMPLETE_REASON_LABEL[o.reason] || o.reason, o.amount]);
      if (format === "xls") downloadXLS(header, rows, `incomplete-orders-${from}-to-${to}.xls`);
      else downloadPDF(`Incomplete orders — ${periodLabel}`, header, rows);
    } else {
      const header = ["Order ID", "Customer", "Items", "Created date", "Created by", "Shipment status", "Payment status", "Amount (INR)"];
      const rows = filtered.filter((o) => inRange(o.placedAt)).map((o) => [
        o.id,
        o.customerName,
        o.items.map((i) => i.name).join("; "),
        o.placedAt,
        o.placedBy || "Customer",
        o.shopifyStatus === "fulfilled" ? "Delivered" : o.tracking ? "In transit" : "Not shipped",
        o.paymentStatus,
        o.total,
      ]);
      if (format === "xls") downloadXLS(header, rows, `orders-${from}-to-${to}.xls`);
      else downloadPDF(`Orders — ${periodLabel}`, header, rows);
    }
  };

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader
        title="Orders & fulfilment"
        action={
          <div className="flex items-center gap-2.5">
            <ExportBtn onExport={handleExport} />
            <ShopifyButton href="https://admin.shopify.com/orders">Open Shopify</ShopifyButton>
            <Link href="/orders/create"><GoldBtn>+ Create order</GoldBtn></Link>
          </div>
        }
      />



      {/* Pinned controls — tabs, search, and filters stay visible while the table scrolls */}
      <div
        className="sticky top-0 z-30 -mx-5 md:-mx-10 px-5 md:px-10 pt-1 pb-0.5 mb-4"
        style={{ background: T.bg, boxShadow: `0 1px 0 ${T.borderSoft}` }}
      >
      {/* Row 1: Tabs (pill style) — always same structure */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Tabs
          tabs={TABS.map((t) => ({
            ...t,
            count: t.key === "all" ? MOCK_ORDERS.length : t.key === "incomplete" ? MOCK_INCOMPLETE_ORDERS.length : (statusCounts[t.key] ?? 0),
          }))}
          active={tab}
          onChange={(k) => { setTab(k); setPage(1); }}
        />
      </div>

      {/* Row 2: Search + filters + sort */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <ToolbarSearch value={search} onChange={setSearch} placeholder="Search orders, customers…" />
        <div className="ml-auto flex items-center gap-2">
          {tab !== "incomplete" ? (
            <>
              <StatusFilterDropdown value={filterStatus} onChange={setFilterStatus} open={openFilter === "status"} onToggle={() => setOpenFilter(openFilter === "status" ? null : "status")} resetPage={() => setPage(1)} />
              <DateFilterDropdown from={filterDateFrom} to={filterDateTo} onChangeFrom={setFilterDateFrom} onChangeTo={setFilterDateTo} open={openFilter === "date"} onToggle={() => setOpenFilter(openFilter === "date" ? null : "date")} resetPage={() => setPage(1)} />
              <StoneTypeFilterDropdown value={filterStoneType} onChange={setFilterStoneType} open={openFilter === "stone"} onToggle={() => setOpenFilter(openFilter === "stone" ? null : "stone")} resetPage={() => setPage(1)} />
              <OrderByFilterDropdown value={filterPlacedBy} onChange={setFilterPlacedBy} open={openFilter === "placedBy"} onToggle={() => setOpenFilter(openFilter === "placedBy" ? null : "placedBy")} resetPage={() => setPage(1)} />
              <div className="w-[160px]">
                <Select
                  value={sort}
                  onChange={(val) => setSortBy(val)}
                  compact
                  prefix="Sort: "
                  options={[
                    { value: "date_desc", label: "Newest first" },
                    { value: "date_asc", label: "Oldest first" },
                    { value: "amount_high", label: "Amount: high" },
                    { value: "amount_low", label: "Amount: low" },
                  ]}
                />
              </div>
              <div className="w-[57px] flex items-center justify-center">
                {hasActiveFilters && (
                  <button
                    onClick={() => { setFilterCustomer(""); setFilterStatus([]); setFilterPlacedBy([]); setFilterDateFrom(""); setFilterDateTo(""); setFilterStoneType([]); setPage(1); }}
                    className="text-[12px] px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap"
                    style={{ color: T.danger }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <IncReasonFilter value={incFilterReason} onChange={setIncFilterReason} open={incOpenFilter === "reason"} onToggle={() => setIncOpenFilter(incOpenFilter === "reason" ? null : "reason")} resetPage={() => setIncPage(1)} />
              <IncStoneFilter value={incFilterStone} onChange={setIncFilterStone} stones={incStones} open={incOpenFilter === "stone"} onToggle={() => setIncOpenFilter(incOpenFilter === "stone" ? null : "stone")} resetPage={() => setIncPage(1)} />
              <IncDateFilter from={incFilterDateFrom} to={incFilterDateTo} onChangeFrom={setIncFilterDateFrom} onChangeTo={setIncFilterDateTo} open={incOpenFilter === "date"} onToggle={() => setIncOpenFilter(incOpenFilter === "date" ? null : "date")} resetPage={() => setIncPage(1)} />
              <div className="w-[160px]">
                <Select value={incSort} onChange={(v) => { setIncSort(v as SortKey); setIncPage(1); }} compact prefix="Sort: " options={[{ value: "date_desc", label: "Newest first" }, { value: "date_asc", label: "Oldest first" }, { value: "amount_high", label: "Amount: high" }, { value: "amount_low", label: "Amount: low" }]} />
              </div>
              <div className="w-[57px] flex items-center justify-center">
                {hasIncFilters && (
                  <button
                    onClick={() => { setIncFilterCustomer(""); setIncFilterStone([]); setIncFilterReason([]); setIncFilterDateFrom(""); setIncFilterDateTo(""); setIncPage(1); }}
                    className="text-[12px] px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap"
                    style={{ color: T.danger }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      </div>

      {tab !== "incomplete" && <>
      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        {loading ? (
          <TableSkeleton cols={6} rows={8} />
        ) : (
          <>
        {/* Sticky header — survives long scrolls */}
        <div
          className="hidden sm:grid grid-cols-[64px_1fr_110px_120px_150px_110px] gap-3 items-center px-4 h-10 text-[11px] font-medium tracking-[0.06em] uppercase sticky top-0 z-10 rounded-t-[15px]"
          style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.border}` }}
        >
          <span>Order</span>
          <span>Customer</span>
          <span>Created</span>
          <span>Created by</span>
          <span>Status</span>
          <span className="text-right">Amount</span>
        </div>
        <div className="md:flex-1 md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">

        {paginated.length === 0 ? (
          <EmptyState inline icon="search" title="No orders" description="Try clearing filters or a different search." />
        ) : (
          paginated.map((o, idx) => {
            const paid = o.paymentStatus === "paid";
            /* One status per row, most urgent wins — payment > cert > energisation > shipment */
            const st =
              o.paymentStatus === "pending"
                ? { tone: "gold" as const, label: "Payment pending" }
                : o.certificateStatus === "missing" && paid
                  ? { tone: "danger" as const, label: "Cert missing" }
                  : o.energisationStatus === "pending" && paid
                    ? { tone: "danger" as const, label: "Energ pending" }
                    : o.shopifyStatus === "fulfilled"
                      ? { tone: "good" as const, label: "Delivered" }
                      : o.tracking
                        ? { tone: "info" as const, label: "In transit" }
                        : { tone: "muted" as const, label: "Not shipped" };
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="group grid grid-cols-1 sm:grid-cols-[64px_1fr_110px_120px_150px_110px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                style={{ borderBottom: idx < paginated.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
              >
                <span className="text-[11.5px] tabular-nums" style={{ color: T.faint }}>#{o.id.replace("AL-ORD-", "")}</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{o.customerName}</div>
                  <div className="text-[12px] truncate mt-px" style={{ color: T.muted }}>
                    {o.items[0]?.name}
                    {o.items.length > 1 && <span style={{ color: T.faint }}> +{o.items.length - 1}</span>}
                  </div>
                </div>
                <span className="text-[12px] tabular-nums" style={{ color: T.muted }}>
                  {new Date(o.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="text-[12px] truncate capitalize" style={{ color: T.muted }}>
                  {o.placedBy ? o.placedBy.split("@")[0] : "Customer"}
                </span>
                <div><Chip tone={st.tone}>{st.label}</Chip></div>
                <span className="text-[13px] font-semibold tabular-nums text-right" style={{ color: T.text }}>{inr(o.total)}</span>
              </Link>
            );
          })
        )}
        </div>
          </>
        )}
      </Card>

      <Pagination page={currentPage - 1} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={(p) => setPage(p + 1)} />
      </>}

      {/* ============ INCOMPLETE ORDERS ============ */}
      {tab === "incomplete" && (
        <>
          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
            {loading ? (
              <TableSkeleton cols={6} rows={8} />
            ) : (
              <>
              <div
                className="hidden sm:grid grid-cols-[1fr_1fr_100px_140px_100px_110px] gap-3 items-center px-4 h-10 text-[11px] font-medium tracking-[0.06em] uppercase sticky top-0 z-10 rounded-t-[15px]"
                style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.border}` }}
              >
                <span>Customer</span>
                <span>Stone / Item</span>
                <span>Date</span>
                <span>Status</span>
                <span>Assignee</span>
                <span className="text-right">Amount</span>
              </div>
            <div className="md:flex-1 md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
              {incFiltered.length === 0 ? (
                <EmptyState inline icon="check" title="No incomplete orders" description="Nothing needs recovery right now." />
              ) : (
                incPaginated.map((o, idx) => (
                  <Link
                    key={o.id}
                    href={`/orders/incomplete/${o.id}`}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_140px_100px_110px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                    style={{ borderBottom: idx < incPaginated.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                  >
                    <div className="min-w-0">
                      <span className="text-[13px] font-semibold truncate block" style={{ color: T.text }}>{o.customerName}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[13px] truncate block" style={{ color: T.muted }}>{o.itemName}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[12px]" style={{ color: T.text }}>{new Date(o.failedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    </div>
                    <div>
                      <Chip tone={INCOMPLETE_REASON_TONE[o.reason] || "muted"}>{INCOMPLETE_REASON_LABEL[o.reason] || o.reason}</Chip>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[12px]" style={{ color: T.faint }}>—</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[14px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(o.amount)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
              </>
            )}
            </Card>
          <Pagination page={incCurrentPage - 1} totalPages={incTotalPages} totalItems={incFiltered.length} perPage={PER_PAGE} onPageChange={(p) => setIncPage(p + 1)} />
        </>
      )}
      </div>
    </>
  );

  function setSortBy(val: string) {
    setSort(val as SortKey);
    setPage(1);
  }
}
