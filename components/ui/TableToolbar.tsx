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

/* Export menu — pick a period, download as PDF or XLS */
export function ExportBtn({ onExport }: { onExport: (opts: ExportOptions) => void }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState("last_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const customIncomplete = period === "custom" && (!customFrom || !customTo);
  const inputStyle = { background: T.bg, border: `1px solid ${T.border}`, color: T.text };

  const fire = (format: "pdf" | "xls") => {
    const { from, to } = periodRange(period, customFrom, customTo);
    const periodLabel = period === "custom" ? `${customFrom} to ${customTo}` : EXPORT_PERIODS.find((x) => x.key === period)!.label;
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
            className="absolute right-0 top-full mt-1.5 z-50 w-[264px] rounded-[14px] p-3"
            style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}
          >
            <div className="px-1 pb-2 text-[11px] font-medium tracking-[0.06em] uppercase" style={{ color: T.faint }}>Time range</div>
            <div className="space-y-0.5">
              {EXPORT_PERIODS.map((pOpt) => {
                const active = period === pOpt.key;
                return (
                  <button
                    key={pOpt.key}
                    onClick={() => setPeriod(pOpt.key)}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-[8px] text-[12.5px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                    style={{ color: active ? T.text : T.muted, fontWeight: active ? 600 : 400, background: active ? T.accentFaint : "transparent" }}
                  >
                    <span
                      className="w-[15px] h-[15px] rounded-full flex items-center justify-center shrink-0"
                      style={{ border: `1.5px solid ${active ? T.accent : "rgba(89,82,54,0.3)"}` }}
                    >
                      {active && <span className="w-[7px] h-[7px] rounded-full" style={{ background: T.accent }} />}
                    </span>
                    {pOpt.label}
                  </button>
                );
              })}
            </div>
            {period === "custom" && (
              <div className="flex items-center gap-2 mt-2 px-1">
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="flex-1 h-8 px-2 rounded-[7px] text-[11.5px] outline-none min-w-0" style={inputStyle} />
                <span className="text-[11px]" style={{ color: T.faint }}>–</span>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="flex-1 h-8 px-2 rounded-[7px] text-[11.5px] outline-none min-w-0" style={inputStyle} />
              </div>
            )}
            <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              {(["pdf", "xls"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => fire(fmt)}
                  disabled={customIncomplete}
                  className="flex-1 h-8 rounded-[8px] text-[12px] font-semibold uppercase tracking-[0.04em] cursor-pointer transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
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
  return (
    <div className="relative w-full sm:w-[280px]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: T.faint }}>
        <circle cx="11" cy="11" r="7" strokeWidth="1.5" />
        <path d="m16 16 4 4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-3 rounded-[9px] text-[13px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(119,123,98,0.18)]"
        style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
      />
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
