"use client";
import Link from "next/link";
import { T } from "@/lib/theme";

/*
 * MobileListCard — the canonical phone-sized row for every list/table.
 *
 * Hierarchy (top → bottom):
 *   1. title (bold)            + right: the ONE number/status that matters
 *   2. sub (muted meta line)   + right: rightSub (small, under right)
 *   3. chips (status/reason)
 *   4. facts (labeled pairs, only when a value has no obvious meaning alone)
 *
 * Desktop keeps the existing grid rows — callers hide this with `sm:hidden`
 * (or md:/lg: to match their table breakpoint) via `className`.
 */

export interface MobileFact { label: string; value: React.ReactNode }

interface MobileListCardProps {
  title: React.ReactNode;
  right?: React.ReactNode;     // headline value or chip, top-right
  sub?: React.ReactNode;       // muted meta line under the title
  rightSub?: React.ReactNode;  // small line under `right`
  chips?: React.ReactNode;     // status / reason chips row
  facts?: MobileFact[];        // labeled pairs for non-obvious values
  leading?: React.ReactNode;   // avatar / swatch / thumbnail
  href?: string;
  onClick?: () => void;
  className?: string;          // visibility: "sm:hidden" | "md:hidden" | "lg:hidden"
  chevron?: boolean;           // show a tap affordance (default true when href/onClick)
}

export function MobileListCard({ title, right, sub, rightSub, chips, facts, leading, href, onClick, className = "sm:hidden", chevron }: MobileListCardProps) {
  const tappable = !!href || !!onClick;
  const showChevron = chevron ?? tappable;

  const body = (
    <div className="flex items-start gap-3">
      {leading && <span className="shrink-0 mt-0.5">{leading}</span>}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[14px] font-semibold leading-snug truncate" style={{ color: T.text }}>{title}</span>
          {(right || showChevron) && (
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="text-right">
                {right && <span className="block text-[13.5px] font-semibold tabular-nums leading-snug" style={{ color: T.text }}>{right}</span>}
                {rightSub && <span className="block text-[11px] mt-0.5" style={{ color: T.faint }}>{rightSub}</span>}
              </span>
              {showChevron && <svg viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mt-0.5"><path d="M9 6l6 6-6 6" /></svg>}
            </span>
          )}
        </div>
        {sub && <div className="text-[12px] mt-0.5 truncate" style={{ color: T.muted }}>{sub}</div>}
        {chips && <div className="flex items-center gap-1.5 flex-wrap mt-2">{chips}</div>}
        {facts && facts.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2.5 pt-2.5" style={{ borderTop: `1px dashed ${T.borderSoft}` }}>
            {facts.map((f, i) => (
              <div key={i} className="min-w-0">
                <div className="text-[10px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{f.label}</div>
                <div className="text-[12.5px] font-medium truncate mt-0.5" style={{ color: T.text }}>{f.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const cls = `${className} block w-full text-left px-4 py-3.5 transition-colors active:bg-[rgba(119,123,98,0.08)]`;
  const style = { borderBottom: `1px solid ${T.borderSoft}` };

  if (href) return <Link href={href} className={cls} style={style}>{body}</Link>;
  if (onClick) return <button onClick={onClick} className={`${cls} cursor-pointer`} style={style}>{body}</button>;
  return <div className={cls} style={style}>{body}</div>;
}
