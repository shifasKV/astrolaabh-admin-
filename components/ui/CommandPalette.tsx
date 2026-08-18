"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { ADMIN_NAV } from "@/lib/nav";
import type { NavGroup } from "@/components/ui/Sidebar";
import { MOCK_ORDERS, MOCK_CUSTOMERS, MOCK_CONSULTATIONS, MOCK_AFFILIATES, EXPERT_PROFILES } from "@/lib/mock";

type Item = { id: string; label: string; sub: string; group: string; href: string; kind: "nav" | "order" | "customer" | "consultation" | "affiliate" | "expert" };

function buildIndex(groups: NavGroup[], indexRecords: boolean): Item[] {
  const nav: Item[] = groups.flatMap((g) =>
    g.items.map((i) => ({ id: `nav-${i.key}`, label: i.label, sub: g.label, group: "Go to", href: i.href, kind: "nav" as const })),
  );
  if (!indexRecords) return nav;
  const orders: Item[] = MOCK_ORDERS.map((o) => ({ id: o.id, label: o.id, sub: o.customerName, group: "Orders", href: `/orders/${o.id}`, kind: "order" as const }));
  const customers: Item[] = MOCK_CUSTOMERS.map((c) => ({ id: c.id, label: c.name, sub: c.email, group: "Customers", href: `/customers/${c.id}`, kind: "customer" as const }));
  const cons: Item[] = MOCK_CONSULTATIONS.map((c) => ({ id: c.id, label: c.customerName, sub: `${c.id} · ${c.expertName}`, group: "Consultations", href: `/consultations/${c.id}`, kind: "consultation" as const }));
  const affs: Item[] = MOCK_AFFILIATES.map((a) => ({ id: a.id, label: a.name, sub: a.code, group: "Affiliates", href: `/affiliates/${a.id}`, kind: "affiliate" as const }));
  const experts: Item[] = EXPERT_PROFILES.map((e) => ({ id: e.id, label: e.name, sub: e.specialization, group: "Astro-Gemologists", href: `/astro-gemologists/${e.id}`, kind: "expert" as const }));
  return [...nav, ...orders, ...customers, ...cons, ...affs, ...experts];
}

function Glyph({ kind }: { kind: Item["kind"] }) {
  const c = { fill: "none" as const, stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "w-4 h-4" };
  if (kind === "customer") return <svg viewBox="0 0 24 24" {...c}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" /></svg>;
  if (kind === "order") return <svg viewBox="0 0 24 24" {...c}><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
  if (kind === "consultation") return <svg viewBox="0 0 24 24" {...c}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" /></svg>;
  if (kind === "affiliate") return <svg viewBox="0 0 24 24" {...c}><circle cx="8.5" cy="9" r="2.8" /><circle cx="16" cy="10.5" r="2.2" /><path d="M3.5 19c1-2.6 2.9-4 5-4s4 1.4 5 4" /></svg>;
  if (kind === "expert") return <svg viewBox="0 0 24 24" {...c}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2" /></svg>;
  return <svg viewBox="0 0 24 24" {...c}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export function CommandPalette({ groups = ADMIN_NAV, indexRecords = true }: { groups?: NavGroup[]; indexRecords?: boolean } = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const index = useMemo(() => buildIndex(groups, indexRecords), [groups, indexRecords]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const openEvt = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", openEvt);
    return () => { document.removeEventListener("keydown", onKey); window.removeEventListener("open-command-palette", openEvt); };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const pool = query
      ? index.filter((i) => i.label.toLowerCase().includes(query) || i.sub.toLowerCase().includes(query))
      : index.filter((i) => i.kind === "nav");
    return pool.slice(0, 24);
  }, [q, index]);

  useEffect(() => { setActive(0); }, [q]);

  const go = (item: Item) => {
    setOpen(false);
    router.push(item.href);
  };

  if (!open) return null;

  const grouped: Record<string, Item[]> = {};
  results.forEach((r) => { (grouped[r.group] ??= []).push(r); });
  let flatIdx = -1;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(43,42,34,0.4)", backdropFilter: "blur(3px)" }} onClick={() => setOpen(false)} />
      <div
        className="relative w-full max-w-[560px] rounded-[16px] overflow-hidden"
        style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: "0 4px 12px rgba(43,42,34,0.08), 0 40px 80px -36px rgba(43,42,34,0.45)", animation: "modal-in 0.2s cubic-bezier(0.22,1,0.36,1)" }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active]); }
        }}
      >
        <div className="flex items-center gap-3 px-[18px] h-[54px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-[19px] h-[19px] shrink-0" style={{ color: T.accent }}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search or jump to a page…"
            className="flex-1 h-7 bg-transparent outline-none focus:outline-none focus-visible:outline-none text-[15px] placeholder:font-normal"
            style={{ color: T.text }}
          />
          <kbd className="text-[10.5px] font-medium px-1.5 py-0.5 rounded-[5px] shrink-0" style={{ background: "rgba(89,82,54,0.08)", color: T.faint }}>ESC</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="text-center py-10 text-[13px]" style={{ color: T.faint }}>No matches for “{q}”.</div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-1">
                <div className="px-4 pt-2 pb-1 text-[10.5px] font-medium tracking-[0.07em] uppercase" style={{ color: T.faint }}>{group}</div>
                {items.map((item) => {
                  flatIdx++;
                  const idx = flatIdx;
                  const on = idx === active;
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => go(item)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left cursor-pointer"
                      style={{ background: on ? T.accentFaint : "transparent" }}
                    >
                      <span className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ background: on ? T.card : "rgba(89,82,54,0.05)", border: `1px solid ${T.borderSoft}`, color: on ? T.accent : T.muted }}>
                        <Glyph kind={item.kind} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium truncate" style={{ color: T.text }}>{item.label}</span>
                        <span className="block text-[12px] truncate" style={{ color: T.muted }}>{item.sub}</span>
                      </span>
                      {on && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" style={{ color: T.accent }}><path d="m9 18 6-6-6-6" /></svg>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
