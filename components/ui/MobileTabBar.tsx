"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { Modal } from "./Modal";
import type { NavGroup, NavItem } from "./Sidebar";

/* Native-app-style bottom tab bar for mobile. Shows the first few nav items as
   tabs and rolls the rest into a "More" sheet. Hidden at md and up (sidebar takes over). */
export function MobileTabBar({ groups, userLabel, onSignOut }: { groups: NavGroup[]; userLabel?: string; onSignOut?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const items = groups.flatMap((g) => g.items);
  const primary = items.slice(0, 4);
  const rest = items.slice(4);
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const hasFlag = (it: NavItem) => !!it.dot || (it.badge !== undefined && it.badge > 0);
  const restActive = rest.some((it) => active(it.href)) || rest.some(hasFlag);

  const go = (href: string) => { setMoreOpen(false); router.push(href); };

  const Glyph = ({ node }: { node: React.ReactNode }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">{node}</svg>
  );

  const Tab = ({ label, icon, on, flag, onClick }: { label: string; icon: React.ReactNode; on: boolean; flag?: boolean; onClick: () => void }) => (
    <button onClick={onClick} className="relative flex-1 flex flex-col items-center justify-center gap-1 h-full min-w-0 cursor-pointer transition-colors" style={{ color: on ? T.accent : T.faint }}>
      <span className="relative"><Glyph node={icon} />{flag && <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full" style={{ background: T.gold, boxShadow: `0 0 0 2px ${T.card}` }} />}</span>
      <span className="text-[10px] font-medium leading-none truncate max-w-[64px]">{label}</span>
      {on && <span className="absolute top-0 w-8 h-[3px] rounded-full" style={{ background: T.accent }} />}
    </button>
  );

  const moreIcon = <><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>;

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch h-[60px]"
        style={{ background: T.card, borderTop: `1px solid ${T.border}`, paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -6px 24px -10px rgba(43,42,34,0.22)" }}
      >
        {primary.map((it) => <Tab key={it.key} label={it.label} icon={it.icon} on={active(it.href)} flag={hasFlag(it)} onClick={() => router.push(it.href)} />)}
        {rest.length > 0 && <Tab label="More" icon={moreIcon} on={restActive || moreOpen} flag={rest.some(hasFlag)} onClick={() => setMoreOpen(true)} />}
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu">
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="text-[11px] tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>{g.label}</div>
              <div className="space-y-0.5">
                {g.items.map((it) => {
                  const on = active(it.href);
                  return (
                    <button key={it.key} onClick={() => go(it.href)} disabled={it.disabled} className="w-full flex items-center gap-3 px-2.5 h-11 rounded-[10px] text-left transition-colors disabled:opacity-40" style={{ background: on ? T.accentFaint : "transparent", color: on ? T.text : T.muted }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0" style={{ color: on ? T.accent : T.faint }}>{it.icon}</svg>
                      <span className="text-[14px] font-medium flex-1">{it.label}</span>
                      {it.badge !== undefined && it.badge > 0 && <span className="text-[11px] font-semibold tabular-nums min-w-[20px] h-5 px-1.5 rounded-full inline-flex items-center justify-center" style={{ background: T.gold, color: T.accentInk }}>{it.badge}</span>}
                      {it.dot && (it.badge === undefined || it.badge === 0) && <span className="w-2 h-2 rounded-full" style={{ background: T.gold }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {onSignOut && (
            <div className="pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <button onClick={() => { setMoreOpen(false); onSignOut(); }} className="w-full flex items-center gap-3 px-2.5 h-11 rounded-[10px] text-left transition-colors hover:bg-[rgba(163,73,63,0.08)]" style={{ color: T.danger }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
                <span className="text-[14px] font-medium flex-1">Sign out{userLabel ? ` · ${userLabel}` : ""}</span>
              </button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
