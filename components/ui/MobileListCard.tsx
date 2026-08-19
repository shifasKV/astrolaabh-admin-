"use client";
import Link from "next/link";
import { T } from "@/lib/theme";

/*
 * MobileListCard v2 — designed for one-glance scanning, not a desktop-row dump.
 *
 * Anatomy (3 zones):
 *   ┌ anchor │ Title                      ₹value ┐   ← who + how much
 *   │        │ one contextual line               │   ← what (plain language)
 *   │  ● Status · qualifier          2d ago      │   ← where it stands + when
 *   └──────────────────────────────────────────┘
 *
 * Rules the composition follows:
 *  - ONE bold fact per corner; nothing competes with the title or the value.
 *  - Status is a coloured dot + words (chips read as buttons on touch — avoided).
 *  - Time is relative ("2d ago") — absolute dates cost a mental conversion.
 *  - No label:value grids. If a value needs a label, it belongs on the detail page.
 */

export interface MobileFact { label: string; value: React.ReactNode }

export interface MobileStatus {
  label: string;
  tone?: "good" | "gold" | "danger" | "info" | "muted";
  /** secondary qualifier shown after a middot, e.g. reason */
  extra?: string;
}

const TONE_COLOR: Record<NonNullable<MobileStatus["tone"]>, string> = {
  good: T.good,
  gold: T.gold,
  danger: T.danger,
  info: T.info,
  muted: T.faint,
};

/** "2d ago" / "in 3d" style relative time for mobile cards. */
export function timeAgo(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return dateStr;
  const diff = Date.now() - then;
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  let span: string;
  if (mins < 60) span = `${Math.max(mins, 1)}m`;
  else if (hrs < 24) span = `${hrs}h`;
  else if (days < 30) span = `${days}d`;
  else if (days < 365) span = `${Math.floor(days / 30)}mo`;
  else span = `${Math.floor(days / 365)}y`;
  return diff >= 0 ? `${span} ago` : `in ${span}`;
}

/** Monogram avatar — the default visual anchor for people-centric lists. */
export function Monogram({ name, tone = "accent" }: { name: string; tone?: "accent" | "muted" }) {
  const initials = name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold"
      style={tone === "accent"
        ? { background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }
        : { background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.muted }}
    >
      {initials}
    </span>
  );
}

interface MobileListCardProps {
  title: React.ReactNode;
  /** one plain-language context line under the title — "Pukhraj 5.9r · Ceylon", not label:value */
  sub?: React.ReactNode;
  /** the single number that matters, top-right */
  right?: React.ReactNode;
  /** small line under `right` (rarely needed — prefer `time`) */
  rightSub?: React.ReactNode;
  /** where the record stands — rendered as ● label · extra in tone colour */
  status?: MobileStatus;
  /** when — pass a raw date string; rendered relative via timeAgo (or pass preformatted text) */
  time?: string;
  /** visual anchor for scanning: <Monogram/>, stone swatch, thumbnail */
  leading?: React.ReactNode;
  /** legacy escape hatches (restyled inline, kept so existing callers still render) */
  chips?: React.ReactNode;
  facts?: MobileFact[];
  href?: string;
  onClick?: () => void;
  className?: string;
  chevron?: boolean;
}

export function MobileListCard({ title, sub, right, rightSub, status, time, leading, chips, facts, href, onClick, className = "sm:hidden", chevron }: MobileListCardProps) {
  const tappable = !!href || !!onClick;
  const showChevron = chevron ?? tappable;
  const statusColor = status ? TONE_COLOR[status.tone ?? "muted"] : undefined;
  const timeLabel = time ? (/\d{4}/.test(time) || time.includes("T") ? timeAgo(time) : time) : undefined;
  const hasFooter = !!status || !!chips || !!timeLabel;

  const body = (
    <>
      <div className="flex items-center gap-3">
        {leading && <span className="shrink-0">{leading}</span>}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-semibold leading-snug truncate" style={{ color: T.text }}>{title}</span>
            {right && <span className="text-[14.5px] font-semibold tabular-nums shrink-0" style={{ color: T.text }}>{right}</span>}
          </div>
          <div className="flex items-baseline justify-between gap-3">
            {sub ? <span className="text-[12.5px] leading-snug truncate mt-0.5" style={{ color: T.muted }}>{sub}</span> : <span />}
            {rightSub && <span className="text-[11px] shrink-0" style={{ color: T.faint }}>{rightSub}</span>}
          </div>
        </div>
        {showChevron && <svg viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 -mr-1"><path d="M9 6l6 6-6 6" /></svg>}
      </div>

      {hasFooter && (
        <div className={`flex items-center justify-between gap-3 mt-2 ${leading ? "pl-[52px]" : ""}`}>
          <span className="flex items-center gap-1.5 min-w-0">
            {status && (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium truncate" style={{ color: statusColor }}>
                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: statusColor }} />
                <span className="truncate">{status.label}{status.extra ? <span style={{ color: T.faint }}> · {status.extra}</span> : null}</span>
              </span>
            )}
            {!status && chips && <span className="flex items-center gap-1.5 flex-wrap">{chips}</span>}
          </span>
          {timeLabel && <span className="text-[11.5px] tabular-nums shrink-0" style={{ color: T.faint }}>{timeLabel}</span>}
        </div>
      )}

      {facts && facts.length > 0 && (
        <div className={`text-[12px] mt-1.5 truncate ${leading ? "pl-[52px]" : ""}`} style={{ color: T.faint }}>
          {facts.map((f, i) => (
            <span key={i}>{i > 0 && <span> · </span>}{f.label} <span className="font-medium" style={{ color: T.muted }}>{f.value}</span></span>
          ))}
        </div>
      )}
    </>
  );

  const cls = `${className} block w-full text-left px-4 py-3 transition-colors active:bg-[rgba(119,123,98,0.08)]`;
  const style = { borderBottom: `1px solid ${T.borderSoft}` };

  if (href) return <Link href={href} className={cls} style={style}>{body}</Link>;
  if (onClick) return <button onClick={onClick} className={`${cls} cursor-pointer`} style={style}>{body}</button>;
  return <div className={cls} style={style}>{body}</div>;
}
