"use client";
import { useState } from "react";
import { T } from "@/lib/theme";

/* Shared data-table toolbar kit — search, filter popover, chips, export, CSV. */

export function downloadCSV(header: string[], rows: (string | number)[][], filename: string) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const fmtChipDate = (isoStr: string) =>
  isoStr ? new Date(isoStr + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "…";

/* Styled hover tooltip for icon-only controls */
export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex group/tt">
      {children}
      <span
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-1 rounded-[7px] text-[11px] font-medium whitespace-nowrap opacity-0 translate-y-0.5 group-hover/tt:opacity-100 group-hover/tt:translate-y-0 transition-all duration-150 z-[60]"
        style={{ background: T.primary, color: T.primaryInk, boxShadow: T.shadowLift }}
      >
        {label}
      </span>
    </span>
  );
}

export function downloadXLS(header: string[], rows: (string | number)[][], filename: string) {
  const esc = (v: string | number) => String(v).replace(/\t/g, " ");
  const content = [header, ...rows].map((r) => r.map(esc).join("\t")).join("\n");
  const blob = new Blob(["\ufeff" + content], { type: "application/vnd.ms-excel" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function downloadPDF(title: string, header: string[], rows: (string | number)[][]) {
  const cell = (v: string | number) => String(v).replace(/</g, "&lt;");
  const html = `<html><head><title>${cell(title)}</title><style>
    body{font-family:-apple-system,sans-serif;padding:28px;color:#2b2a22}
    h1{font-size:16px;margin:0 0 14px}
    table{border-collapse:collapse;width:100%;font-size:11px}
    th,td{border:1px solid #d8d2c0;padding:6px 8px;text-align:left}
    th{background:#f3efe4;text-transform:uppercase;font-size:9.5px;letter-spacing:0.05em}
  </style></head><body><h1>${cell(title)}</h1><table><thead><tr>${header.map((h) => `<th>${cell(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${cell(c)}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.print()<\/script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export interface ExportOptions {
  from: string;
  to: string;
  format: "pdf" | "xls";
  periodLabel: string;
}

const localISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const EXPORT_PERIODS = [
  { key: "last_7", label: "Last 7 days" },
  { key: "last_week", label: "Last week" },
  { key: "last_month", label: "Last month" },
  { key: "last_quarter", label: "Last quarter" },
  { key: "last_fy", label: "Last financial year" },
  { key: "custom", label: "Custom range" },
] as const;

function periodRange(key: string, customFrom: string, customTo: string): { from: string; to: string } {
  const today = new Date();
  if (key === "last_7") {
    const f = new Date(today); f.setDate(today.getDate() - 7);
    return { from: localISO(f), to: localISO(today) };
  }
  if (key === "last_week") {
    const dow = (today.getDay() + 6) % 7;
    const monThis = new Date(today); monThis.setDate(today.getDate() - dow);
    const monPrev = new Date(monThis); monPrev.setDate(monThis.getDate() - 7);
    const sunPrev = new Date(monThis); sunPrev.setDate(monThis.getDate() - 1);
    return { from: localISO(monPrev), to: localISO(sunPrev) };
  }
  if (key === "last_month") {
    return { from: localISO(new Date(today.getFullYear(), today.getMonth() - 1, 1)), to: localISO(new Date(today.getFullYear(), today.getMonth(), 0)) };
  }
  if (key === "last_quarter") {
    const q = Math.floor(today.getMonth() / 3);
    return { from: localISO(new Date(today.getFullYear(), (q - 1) * 3, 1)), to: localISO(new Date(today.getFullYear(), q * 3, 0)) };
  }
  if (key === "last_fy") {
    const fyStart = today.getMonth() >= 3 ? today.getFullYear() - 1 : today.getFullYear() - 2;
    return { from: `${fyStart}-04-01`, to: `${fyStart + 1}-03-31` };
  }
  return { from: customFrom, to: customTo };
}

function ExportCalendar({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [viewDate, setViewDate] = useState(() => value ? new Date(value + "T00:00") : new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const days: (number | null)[] = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthName = viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const iso = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

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
          const isSelected = dateStr === value;
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

/* Export menu — calendar-based date picker with presets + download buttons */
export function ExportBtn({ onExport, dateLabel }: { onExport: (opts: ExportOptions) => void; dateLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState("last_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const isCustom = period === "custom";
  const customIncomplete = isCustom && (!customFrom || !customTo);

  const handlePreset = (key: string) => {
    setPeriod(key);
    if (key !== "custom") {
      const { from, to } = periodRange(key, "", "");
      setCustomFrom(from);
      setCustomTo(to);
    }
  };

  const fire = (format: "pdf" | "xls") => {
    const from = customFrom;
    const to = customTo;
    const periodLabel = isCustom ? `${from} to ${to}` : EXPORT_PERIODS.find((x) => x.key === period)!.label;
    onExport({ from, to, format, periodLabel });
    setOpen(false);
  };

  return (
    <div className="relative">
      <Tooltip label="Export">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Export"
          className="h-9 w-9 rounded-[9px] inline-flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200"
          style={{ background: open ? T.accentFaint : T.bg, border: `1px solid ${open ? T.accentBorder : T.border}`, color: T.text }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M12 3v11M7.5 10.5 12 15l4.5-4.5M4.5 20h15" />
          </svg>
        </button>
      </Tooltip>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1.5 z-50 w-[540px] rounded-[14px] p-4"
            style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}
          >
            <div className="px-0.5 pb-3 text-[11px] font-medium tracking-[0.06em] uppercase" style={{ color: T.faint }}>{dateLabel || "Select order date range"}</div>
            <div className="flex gap-4">
              {/* Left: presets */}
              <div className="w-[148px] shrink-0 space-y-0.5">
                <div className="text-[10px] font-medium tracking-[0.06em] uppercase mb-2" style={{ color: T.faint }}>Quick select</div>
                {EXPORT_PERIODS.map((pOpt) => {
                  const active = period === pOpt.key;
                  return (
                    <button
                      key={pOpt.key}
                      onClick={() => handlePreset(pOpt.key)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] text-[11.5px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                      style={{ color: active ? T.accent : T.text, fontWeight: active ? 600 : 400, background: active ? T.accentFaint : "transparent" }}
                    >
                      <span className="w-[13px] h-[13px] rounded-full flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${active ? T.accent : "rgba(89,82,54,0.3)"}` }}>
                        {active && <span className="w-[5px] h-[5px] rounded-full" style={{ background: T.accent }} />}
                      </span>
                      {pOpt.label}
                    </button>
                  );
                })}
              </div>
              {/* Right: calendars */}
              <div className="flex-1 min-w-0" style={{ borderLeft: `1px solid ${T.borderSoft}`, paddingLeft: "16px" }}>
                <div className="grid grid-cols-2 gap-3">
                  <ExportCalendar value={customFrom} onChange={(v) => { setCustomFrom(v); setPeriod("custom"); }} label="From" />
                  <ExportCalendar value={customTo} onChange={(v) => { setCustomTo(v); setPeriod("custom"); }} label="To" />
                </div>
                {(customFrom || customTo) && (
                  <div className="mt-3 pt-2.5 text-[11px] flex items-center gap-2" style={{ borderTop: `1px solid ${T.borderSoft}`, color: T.muted }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0" style={{ color: T.accent }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                    <span>{customFrom ? new Date(customFrom + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Start"}</span>
                    <span style={{ color: T.faint }}>→</span>
                    <span>{customTo ? new Date(customTo + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "End"}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Download buttons */}
            <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              {(["pdf", "xls"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => fire(fmt)}
                  disabled={customIncomplete}
                  className="flex-1 h-9 rounded-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] cursor-pointer transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={fmt === "pdf" ? { background: T.primary, color: T.primaryInk } : { background: T.accentMuted, color: T.accent }}
                >
                  {fmt === "pdf" ? "Download PDF" : "Download XLS"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ToolbarSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  return (
    <div className="relative w-full sm:w-[310px]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors" style={{ color: focused || hasValue ? T.accent : T.faint }}>
        <circle cx="11" cy="11" r="7" strokeWidth="1.5" />
        <path d="m16 16 4 4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-8 rounded-[9px] text-[13px] outline-none transition-all duration-200"
        style={{
          background: focused ? T.card : T.bg,
          border: `1px solid ${focused ? T.accentBorder : hasValue ? T.accentBorder : T.border}`,
          color: T.text,
          boxShadow: focused ? `0 0 0 3px ${T.accentFaint}` : "none",
        }}
      />
      {hasValue && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.1)]"
          style={{ color: T.muted }}
          tabIndex={-1}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}

export function FiltersPopover({ count, open, onToggle, children }: { count: number; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="h-9 px-3.5 rounded-[9px] text-[13px] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200"
        style={{
          background: open ? T.accentFaint : T.bg,
          border: `1px solid ${count > 0 || open ? T.accentBorder : T.border}`,
          color: T.text,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        Filters
        {count > 0 && (
          <span className="text-[11px] font-semibold tabular-nums min-w-[18px] px-1 py-px rounded-full text-center" style={{ background: T.accent, color: T.accentInk }}>
            {count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div
            className="absolute right-0 top-full mt-1.5 z-50 w-[320px] rounded-[14px] p-4 space-y-4"
            style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

export function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium tracking-[0.06em] uppercase mb-1.5" style={{ color: T.faint }}>{label}</div>
      {children}
    </div>
  );
}

export function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full text-[12px] font-medium"
      style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
    >
      {label}
      <button
        onClick={onClear}
        aria-label={`Clear ${label}`}
        className="w-[18px] h-[18px] rounded-full inline-flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.14)]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-2.5 h-2.5">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

export function DateRangeFields({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const today = iso(new Date());
  const presets = [
    { label: "Today", from: today, to: today },
    { label: "7 days", from: iso(new Date(Date.now() - 7 * 86400000)), to: today },
    { label: "30 days", from: iso(new Date(Date.now() - 30 * 86400000)), to: today },
    { label: "90 days", from: iso(new Date(Date.now() - 90 * 86400000)), to: today },
  ];
  const inputCls = "flex-1 h-9 px-2.5 rounded-[8px] text-[12.5px] outline-none min-w-0";
  const inputStyle = { background: T.bg, border: `1px solid ${T.border}`, color: T.text };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {presets.map((p) => {
          const active = from === p.from && to === p.to;
          return (
            <button
              key={p.label}
              onClick={() => onChange(p.from, p.to)}
              className="h-7 px-2.5 rounded-full text-[12px] cursor-pointer transition-colors duration-150"
              style={active ? { background: T.accent, color: T.accentInk } : { background: "rgba(89,82,54,0.06)", color: T.muted }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <input type="date" value={from} onChange={(e) => onChange(e.target.value, to)} className={inputCls} style={inputStyle} />
        <span className="text-[12px]" style={{ color: T.faint }}>–</span>
        <input type="date" value={to} onChange={(e) => onChange(from, e.target.value)} className={inputCls} style={inputStyle} />
      </div>
    </div>
  );
}

/* Column-header status filter — funnel trigger + count menu */
export interface StatusOption {
  value: string;
  label: string;
  count: number;
}

export function ColumnStatusFilter({
  label = "Status",
  value,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label?: string;
  value: string;
  options: StatusOption[];
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1 uppercase tracking-[0.06em] cursor-pointer transition-colors"
        style={{ color: value ? T.accent : T.faint, fontWeight: value ? 600 : 500 }}
      >
        {label}
        <svg viewBox="0 0 24 24" fill={value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <path d="M4 5h16l-6.5 7.5v5.5l-3-1.8v-3.7L4 5z" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div
            className="absolute left-0 top-full mt-1.5 z-50 w-[200px] rounded-[12px] p-1.5 normal-case tracking-normal"
            style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}
          >
            {options.map((opt) => {
              const active = value === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onSelect(opt.value)}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[8px] text-[12.5px] font-normal cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.10)]"
                  style={{ color: active ? T.accent : T.text, fontWeight: active ? 600 : 400, background: active ? T.accentFaint : "transparent" }}
                >
                  {opt.label}
                  <span className="text-[11px] tabular-nums" style={{ color: T.faint }}>{opt.count}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
