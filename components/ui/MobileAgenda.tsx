"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { T } from "@/lib/theme";

/*
 * MobileAgenda — Apple-Calendar-style agenda for phones.
 * A single vertical list of day sections that extends as you scroll
 * (sentinel at the bottom loads further weeks; "Earlier" reveals the past).
 * Empty days are skipped so the thumb travels through events, not whitespace.
 * Replaces the desktop hour-grid below md.
 */

export interface AgendaEvent {
  id: string;
  dateISO: string;      // yyyy-mm-dd
  timeLabel: string;    // "6:00 AM"
  title: string;
  sub?: string;
  color: string;        // status tone colour
  href?: string;
  onClick?: () => void;
}

const DAY_MS = 86400000;
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function MobileAgenda({ events, className = "md:hidden" }: { events: AgendaEvent[]; className?: string }) {
  const [pastDays, setPastDays] = useState(14);
  const [futureDays, setFutureDays] = useState(45);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const todayRef = useRef<HTMLDivElement | null>(null);
  const didAutoScroll = useRef(false);

  const todayISO = toISO(new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const e of events) {
      if (!map.has(e.dateISO)) map.set(e.dateISO, []);
      map.get(e.dateISO)!.push(e);
    }
    for (const list of map.values()) list.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
    return map;
  }, [events]);

  // Visible window: days WITH events between (today - pastDays) and (today + futureDays)
  const days = useMemo(() => {
    const start = Date.now() - pastDays * DAY_MS;
    const end = Date.now() + futureDays * DAY_MS;
    return [...byDay.keys()]
      .filter((iso) => { const t = new Date(iso + "T00:00:00").getTime(); return t >= start && t <= end; })
      .sort();
  }, [byDay, pastDays, futureDays]);

  const hasEarlier = useMemo(() => {
    const start = Date.now() - pastDays * DAY_MS;
    return [...byDay.keys()].some((iso) => new Date(iso + "T00:00:00").getTime() < start);
  }, [byDay, pastDays]);
  const hasLater = useMemo(() => {
    const end = Date.now() + futureDays * DAY_MS;
    return [...byDay.keys()].some((iso) => new Date(iso + "T00:00:00").getTime() > end);
  }, [byDay, futureDays]);

  // Infinite forward scroll — extend the future window when the sentinel appears.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasLater) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setFutureDays((d) => d + 45);
    }, { rootMargin: "300px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasLater, days.length]);

  // Land on today (or the next upcoming day) once.
  useEffect(() => {
    if (didAutoScroll.current) return;
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ block: "start" });
      didAutoScroll.current = true;
    }
  }, [days]);

  const firstUpcoming = days.find((iso) => iso >= todayISO);

  const fmtDay = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    const label = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    if (iso === todayISO) return `Today · ${label}`;
    return label;
  };

  return (
    <div className={className}>
      {hasEarlier && (
        <button onClick={() => setPastDays((d) => d + 45)} className="w-full py-2.5 text-[12.5px] font-medium cursor-pointer transition-colors active:bg-[rgba(119,123,98,0.08)]" style={{ color: T.accent }}>
          ↑ Show earlier
        </button>
      )}

      {days.length === 0 && (
        <p className="text-[13px] py-10 text-center" style={{ color: T.faint }}>Nothing scheduled in this period.</p>
      )}

      {days.map((iso) => (
        <div key={iso} ref={iso === firstUpcoming ? todayRef : undefined} style={{ scrollMarginTop: 64 }}>
          {/* Sticky day header */}
          <div className="sticky top-14 z-10 px-4 py-1.5 text-[11.5px] font-semibold tracking-[0.05em] uppercase" style={{ background: "rgba(248,245,238,0.92)", backdropFilter: "blur(6px)", color: iso === todayISO ? T.accent : T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
            {fmtDay(iso)}
          </div>
          {(byDay.get(iso) ?? []).map((e) => {
            const inner = (
              <>
                <span className="w-[64px] shrink-0 text-[12px] tabular-nums pt-0.5" style={{ color: T.muted }}>{e.timeLabel}</span>
                <span className="w-[3px] self-stretch rounded-full shrink-0" style={{ background: e.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold leading-snug truncate" style={{ color: T.text }}>{e.title}</span>
                  {e.sub && <span className="block text-[12px] mt-0.5 truncate" style={{ color: T.muted }}>{e.sub}</span>}
                </span>
              </>
            );
            const cls = "flex items-start gap-3 px-4 py-2.5 w-full text-left transition-colors active:bg-[rgba(119,123,98,0.08)]";
            const style = { borderBottom: `1px solid ${T.borderSoft}` };
            if (e.href) return <Link key={e.id} href={e.href} className={cls} style={style}>{inner}</Link>;
            if (e.onClick) return <button key={e.id} onClick={e.onClick} className={`${cls} cursor-pointer`} style={style}>{inner}</button>;
            return <div key={e.id} className={cls} style={style}>{inner}</div>;
          })}
        </div>
      ))}

      {hasLater && <div ref={sentinelRef} className="py-6 text-center text-[12px]" style={{ color: T.faint }}>Loading more…</div>}
    </div>
  );
}
