"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { T } from "@/lib/theme";

/*
 * Mobile toolbar kit — phone lists get an app-style control row:
 *   [ Filters (n) ]                    [ 🔍 ] [ ⇅ ]
 * - Filters opens a bottom sheet with the full filter controls.
 * - Search is icon-only; tapping swaps the row for a full-width input.
 * - The page's primary action becomes a floating button (MobileFab).
 * Desktop toolbars stay exactly as they are (callers hide this at sm+).
 */

/* ─── Bottom sheet ─── */
export function MobileSheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[210]">
      <div className="absolute inset-0" style={{ background: "rgba(41,38,23,0.45)", backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 rounded-t-[20px] flex flex-col max-h-[82dvh]" style={{ background: T.card, boxShadow: "0 -18px 50px -20px rgba(0,0,0,0.45)", paddingBottom: "env(safe-area-inset-bottom)", animation: "sheet-up 0.26s cubic-bezier(0.22,1,0.36,1)" }}>
        <div className="flex justify-center pt-2.5 pb-1"><span className="w-9 h-1 rounded-full" style={{ background: "rgba(89,82,54,0.22)" }} /></div>
        <div className="flex items-center justify-between px-5 pb-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <span className="text-[15px] font-semibold" style={{ color: T.text }}>{title}</span>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 -mr-1.5 rounded-full flex items-center justify-center cursor-pointer transition-colors active:bg-[rgba(89,82,54,0.10)]" style={{ color: T.muted }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1 min-h-0">{children}</div>
        {footer && <div className="px-5 py-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ─── Labeled section inside the filter sheet ─── */
export function SheetSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="text-[11px] tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>{label}</div>
      {children}
    </div>
  );
}

/* ─── The collapsed toolbar row ─── */
interface MobileToolbarProps {
  className?: string;           // visibility, default "sm:hidden"
  filterCount: number;
  filters?: React.ReactNode;    // sheet content (SheetSections); omit to hide the Filters button
  onClearAll?: () => void;
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  sort?: React.ReactNode;       // pass the existing <SortMenu/>
}

export function MobileToolbar({ className = "sm:hidden", filterCount, filters, onClearAll, search, onSearch, searchPlaceholder = "Search…", sort }: MobileToolbarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(!!search);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (searchOpen) inputRef.current?.focus(); }, [searchOpen]);

  return (
    <div className={className}>
      {searchOpen ? (
        /* Expanded search takes over the row */
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: T.faint }}><circle cx="11" cy="11" r="7" strokeWidth="1.6" /><path d="m16 16 4 4" strokeWidth="1.6" strokeLinecap="round" /></svg>
            <input ref={inputRef} value={search} onChange={(e) => onSearch(e.target.value)} placeholder={searchPlaceholder} className="w-full h-10 pl-9 pr-8 rounded-[10px] text-[14px] outline-none" style={{ background: T.popover, border: `1px solid ${T.accent}`, color: T.text }} />
            {search && (
              <button onClick={() => onSearch("")} aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center" style={{ color: T.faint }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <button onClick={() => { onSearch(""); setSearchOpen(false); }} className="text-[13px] font-medium shrink-0 cursor-pointer" style={{ color: T.accent }}>Cancel</button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3">
          {filters != null && (
            <button onClick={() => setSheetOpen(true)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium cursor-pointer transition-colors active:bg-[rgba(119,123,98,0.10)]" style={{ background: filterCount > 0 ? T.accentFaint : "rgba(255,253,247,0.5)", border: `1px solid ${filterCount > 0 ? T.accentBorder : T.border}`, color: filterCount > 0 ? T.accent : T.muted }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 5h18l-7 8v6l-4-2v-4z" /></svg>
              Filters
              {filterCount > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-bold inline-flex items-center justify-center" style={{ background: T.accent, color: T.accentInk }}>{filterCount}</span>}
            </button>
          )}
          <span className="flex-1" />
          <button onClick={() => setSearchOpen(true)} aria-label="Search" className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors active:bg-[rgba(119,123,98,0.10)]" style={{ background: "rgba(255,253,247,0.5)", border: `1px solid ${T.border}`, color: T.muted }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><circle cx="11" cy="11" r="7" strokeWidth="1.7" /><path d="m16 16 4 4" strokeWidth="1.7" strokeLinecap="round" /></svg>
          </button>
          {sort}
        </div>
      )}

      {filters != null && <MobileSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        footer={
          <div className="flex items-center gap-2.5">
            {onClearAll && filterCount > 0 && (
              <button onClick={onClearAll} className="h-11 px-4 rounded-[11px] text-[13.5px] font-medium cursor-pointer" style={{ color: T.danger }}>Clear all</button>
            )}
            <button onClick={() => setSheetOpen(false)} className="flex-1 h-11 rounded-[11px] text-[13.5px] font-semibold cursor-pointer transition-all active:scale-[0.98]" style={{ background: T.accent, color: T.accentInk }}>
              Show results
            </button>
          </div>
        }
      >
        {filters}
      </MobileSheet>}
    </div>
  );
}

/* ─── Floating action button — the page's primary action on mobile ─── */
export function MobileFab({ href, onClick, label, className = "sm:hidden" }: { href?: string; onClick?: () => void; label?: string; className?: string }) {
  const inner = (
    <>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-5 h-5"><path d="M12 5v14M5 12h14" /></svg>
      {label && <span className="text-[13.5px] font-semibold pr-1">{label}</span>}
    </>
  );
  const cls = `${className} fixed right-4 z-30 inline-flex items-center gap-1.5 h-13 ${label ? "pl-3.5 pr-4 rounded-full" : "w-13 justify-center rounded-full"} cursor-pointer transition-all active:scale-[0.96]`;
  const style: React.CSSProperties = {
    bottom: "calc(76px + env(safe-area-inset-bottom))",
    height: 52,
    ...(label ? {} : { width: 52 }),
    background: T.accent,
    color: T.accentInk,
    boxShadow: "0 6px 20px -6px rgba(101,105,79,0.55), inset 0 1px 0 rgba(244,241,229,0.16)",
  };
  if (href) return <Link href={href} className={cls} style={style}>{inner}</Link>;
  return <button onClick={onClick} className={cls} style={style}>{inner}</button>;
}
