"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { T, INPUT_CLASS, INPUT_STYLE } from "@/lib/theme";

/* ─── Input ─── */

interface InputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number" | "url" | "search" | "tel";
  label?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onBlur?: () => void;
  required?: boolean;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url" | "search";
  maxLength?: number;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-[11.5px] mt-1.5" style={{ color: T.danger }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
      {message}
    </p>
  );
}

export function Input({ value, onChange, placeholder, type = "text", label, className = "", disabled, error, onKeyDown, onBlur, required, inputMode, maxLength }: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[11px] tracking-[0.12em] uppercase mb-1.5" style={{ color: T.faint }}>
          {label}{required && <span className="ml-0.5" style={{ color: T.danger }}>*</span>}
        </label>
      )}
      <input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        className={`${INPUT_CLASS} disabled:opacity-50`}
        style={error ? { ...INPUT_STYLE, borderColor: T.danger, boxShadow: "0 0 0 3px rgba(163,73,63,0.1)" } : INPUT_STYLE}
      />
      <FieldError message={error} />
    </div>
  );
}

/* ─── Custom Select ─── */

interface SelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
  placeholder?: string;
  /** Prepended to the selected option label in the trigger (e.g. "Status: " → "Status: Scheduled"). */
  prefix?: string;
  compact?: boolean;
  error?: string;
}

const SEARCH_THRESHOLD = 5;

export function Select({ value, onChange, options, label, className = "", disabled, searchable, placeholder, prefix, compact, error }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const showSearch = options.length > SEARCH_THRESHOLD;
  const selected = options.find((o) => o.value === value);
  const filtered = showSearch && search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, showSearch]);

  useEffect(() => { setHighlightIdx(-1); }, [search]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && highlightIdx >= 0 && filtered[highlightIdx]) {
      e.preventDefault();
      onChange(filtered[highlightIdx].value);
      setOpen(false);
    }
  }, [open, highlightIdx, filtered, onChange]);

  useEffect(() => {
    if (highlightIdx >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIdx] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx]);

  const height = compact ? "h-9" : "h-10";
  const triggerLabel = selected
    ? (prefix ? `${prefix}${selected.label}` : selected.label)
    : (placeholder ?? "Select…");

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] tracking-[0.12em] uppercase mb-1.5" style={{ color: T.faint }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`${height} px-3.5 rounded-[9px] text-[13.5px] w-full text-left flex items-center justify-between gap-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors`}
        style={{ ...INPUT_STYLE, ...(error ? { borderColor: T.danger, boxShadow: "0 0 0 3px rgba(163,73,63,0.1)" } : {}), color: selected ? T.text : T.faint }}
      >
        <span className="truncate">{triggerLabel}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {error && <FieldError message={error} />}

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-[9px] overflow-hidden shadow-lg"
          style={{ background: T.popover, border: `1px solid ${T.border}`, animation: "fadeIn 120ms ease-out" }}
        >
          {showSearch && (
            <div className="p-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="Search…"
                className="w-full h-8 px-3 rounded-[9px] text-[13px] outline-none"
                style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }}
              />
            </div>
          )}
          <div ref={listRef} className="max-h-[220px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3.5 py-2.5 text-[12px]" style={{ color: T.faint }}>No results</div>
            ) : (
              filtered.map((opt, idx) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full text-left px-3.5 py-2 text-[13px] transition-colors flex items-center justify-between"
                  style={{
                    background: idx === highlightIdx ? "rgba(119,123,98,0.13)" : opt.value === value ? "rgba(119,123,98,0.09)" : "transparent",
                    color: opt.value === value ? T.accent : T.text,
                  }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <span className="text-[11px] shrink-0" style={{ color: T.accent }}>✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}

/* ─── DateInput ─── */

interface DateInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  className?: string;
  placeholder?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function parseDate(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DateInput({ value, onChange, label, className = "", placeholder }: DateInputProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseDate(value);
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? new Date().getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const selectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(toISO(d));
    setOpen(false);
  };

  const isSelected = (day: number) => {
    if (!parsed) return false;
    return parsed.getDate() === day && parsed.getMonth() === viewMonth && parsed.getFullYear() === viewYear;
  };

  const isToday = (day: number) => {
    const now = new Date();
    return now.getDate() === day && now.getMonth() === viewMonth && now.getFullYear() === viewYear;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] tracking-[0.12em] uppercase mb-1.5" style={{ color: T.faint }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-10 px-3.5 rounded-[9px] text-[13.5px] w-full text-left flex items-center justify-between gap-2 outline-none cursor-pointer"
        style={{ ...INPUT_STYLE, color: parsed ? T.text : T.faint }}
      >
        <span>{parsed ? formatDate(parsed) : (placeholder ?? "Select date…")}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 9h18" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 rounded-[9px] p-3 shadow-lg w-[280px]"
          style={{ background: T.popover, border: `1px solid ${T.border}`, animation: "fadeIn 120ms ease-out" }}
        >
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[rgba(119,123,98,0.15)]" style={{ color: T.muted }}>
              ‹
            </button>
            <span className="text-[13px] font-medium" style={{ color: T.text }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[rgba(119,123,98,0.15)]" style={{ color: T.muted }}>
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] py-1" style={{ color: T.faint }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] transition-colors"
                  style={{
                    background: isSelected(day) ? T.accent : "transparent",
                    color: isSelected(day) ? T.accentInk : isToday(day) ? T.accent : T.text,
                    fontWeight: isSelected(day) || isToday(day) ? 600 : 400,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

/* ─── TimeInput ─── */

interface TimeInputProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  className?: string;
  placeholder?: string;
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 5; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";
      slots.push(`${hour12}:${String(m).padStart(2, "0")} ${ampm}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

export function TimeInput({ value, onChange, label, className = "", placeholder }: TimeInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && listRef.current && value) {
      const idx = TIME_SLOTS.indexOf(value);
      if (idx >= 0) {
        const el = listRef.current.children[idx] as HTMLElement | undefined;
        el?.scrollIntoView({ block: "center" });
      }
    }
  }, [open, value]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] tracking-[0.12em] uppercase mb-1.5" style={{ color: T.faint }}>
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-10 px-3.5 rounded-[9px] text-[13.5px] w-full text-left flex items-center justify-between gap-2 outline-none cursor-pointer"
        style={{ ...INPUT_STYLE, color: value ? T.text : T.faint }}
      >
        <span>{value || (placeholder ?? "Select time…")}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-[9px] overflow-hidden shadow-lg"
          style={{ background: T.popover, border: `1px solid ${T.border}`, animation: "fadeIn 120ms ease-out" }}
        >
          <div ref={listRef} className="max-h-[200px] overflow-y-auto py-1">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => { onChange(slot); setOpen(false); }}
                className="w-full text-left px-3.5 py-2 text-[13px] transition-colors tabular-nums"
                style={{
                  background: slot === value ? "rgba(119,123,98,0.13)" : "transparent",
                  color: slot === value ? T.accent : T.text,
                }}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

/* ─── Textarea ─── */

interface TextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
  className?: string;
  error?: string;
  onBlur?: () => void;
}

export function Textarea({ value, onChange, placeholder, label, rows = 4, className = "", error, onBlur }: TextareaProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[11px] tracking-[0.12em] uppercase mb-1.5" style={{ color: T.faint }}>
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={!!error}
        className="w-full px-3.5 py-2.5 rounded-[9px] text-[13.5px] outline-none resize-y"
        style={error ? { ...INPUT_STYLE, borderColor: T.danger, boxShadow: "0 0 0 3px rgba(163,73,63,0.1)" } : INPUT_STYLE}
      />
      <FieldError message={error} />
    </div>
  );
}

/* ─── FileInput ─── */

interface FileInputProps {
  onSelect: (file: File) => void;
  label?: string;
  accept?: string;
  className?: string;
}

export function FileInput({ onSelect, label, accept, className = "" }: FileInputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[11px] tracking-[0.12em] uppercase mb-1.5" style={{ color: T.faint }}>
          {label}
        </label>
      )}
      <input
        type="file"
        accept={accept}
        onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])}
        className="block w-full text-[13px] file:mr-3 file:py-2 file:px-4 file:rounded-[9px] file:border-0 file:text-[12px] file:font-medium file:cursor-pointer"
        style={{ color: T.muted }}
      />
    </div>
  );
}
