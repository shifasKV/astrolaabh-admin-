"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";

/* ─── Inline stroke icons (feather-style, matches app convention) ─── */
const IK = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24" };
const Icon = {
  coins: (p: { className?: string }) => <svg {...IK} className={p.className}><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82" /></svg>,
  chart: (p: { className?: string }) => <svg {...IK} className={p.className}><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="5" rx="0.5" /><rect x="12" y="8" width="3" height="9" rx="0.5" /><rect x="17" y="5" width="3" height="12" rx="0.5" /></svg>,
  link: (p: { className?: string }) => <svg {...IK} className={p.className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
  bolt: (p: { className?: string }) => <svg {...IK} className={p.className}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
  shield: (p: { className?: string }) => <svg {...IK} className={p.className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>,
  hands: (p: { className?: string }) => <svg {...IK} className={p.className}><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8" /></svg>,
  arrowDown: (p: { className?: string }) => <svg {...IK} strokeWidth={2} className={p.className}><path d="M12 5v14M5 12l7 7 7-7" /></svg>,
  arrowRight: (p: { className?: string }) => <svg {...IK} strokeWidth={2} className={p.className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  chevron: (p: { className?: string }) => <svg {...IK} strokeWidth={2} className={p.className}><path d="m6 9 6 6 6-6" /></svg>,
};

type IconKey = keyof typeof Icon;

const BENEFITS: { icon: IconKey; title: string; desc: string }[] = [
  { icon: "coins", title: "Earn up to 12% commission", desc: "On every successful referral purchase: gemstones, jewellery, and consultations." },
  { icon: "chart", title: "Real-time dashboard", desc: "Track clicks, conversions, and earnings in a clean analytics panel built for you." },
  { icon: "link", title: "Custom referral links", desc: "Generate unique links for campaigns, social posts, or WhatsApp shares in one click." },
  { icon: "bolt", title: "Fast payouts", desc: "Monthly bank transfers with no minimum threshold and no hidden deductions." },
  { icon: "shield", title: "Expert-backed products", desc: "Recommend only astrologer-certified, energised gemstones your audience can trust." },
  { icon: "hands", title: "Dedicated support", desc: "A partner manager, marketing collateral, and priority resolution for your referrals." },
];

const STATS = [
  { value: "up to 12%", label: "commission on every order" },
  { value: "Monthly", label: "payouts, no minimum" },
  { value: "Free", label: "to join, quick approval" },
];

const STEPS_HOW = [
  { num: "01", title: "Create your account", desc: "Sign up with your email or Google. Takes about 30 seconds." },
  { num: "02", title: "Complete your profile", desc: "Add bank details and PAN for payouts. We verify within 24 hours." },
  { num: "03", title: "Share and earn", desc: "Generate links, share with your audience, and watch commissions grow." },
];

const FAQS = [
  { q: "Who can join the affiliate program?", a: "Anyone with an audience: astrologers, content creators, jewellers, wellness coaches, or social media influencers. There is no follower minimum." },
  { q: "How much can I earn?", a: "You earn 8 to 12% on every completed order placed through your referral link. Commission varies by product category." },
  { q: "When do I get paid?", a: "Payouts are processed on the 5th of every month for the previous month's confirmed earnings, by direct bank transfer with no minimum threshold." },
  { q: "Is there any cost to join?", a: "No. The program is free to join and free to use, with no hidden charges." },
];

const CTA_LABEL = "Create your account";

function PrimaryCta({ className = "", pulse = false }: { className?: string; pulse?: boolean }) {
  return (
    <Link
      href="/affiliate-program/signup"
      className={`h-12 px-7 rounded-[11px] text-[14.5px] font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 hover:-translate-y-px hover:shadow-[0_8px_24px_-8px_rgba(160,125,56,0.5)] ${pulse ? "cta-pulse" : ""} ${className}`}
      style={pulse ? { background: T.accent, color: T.accentInk } : { background: T.accent, color: T.accentInk, boxShadow: "inset 0 1px 0 rgba(244,241,229,0.14), 0 1px 2px rgba(43,42,34,0.1), 0 4px 12px -4px rgba(101,105,79,0.4)" }}
    >
      {CTA_LABEL}
    </Link>
  );
}

export default function AffiliateProgramPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const router = useRouter();

  return (
    <main className="min-h-dvh" style={{ backgroundColor: T.bg, backgroundImage: "linear-gradient(rgba(248,245,238,0.25), rgba(248,245,238,0.25)), url(/pattern/damask.png)", backgroundSize: "auto, 720px", backgroundRepeat: "no-repeat, repeat" }}>
      {/* ===== TOP BAR ===== */}
      <header className="sticky top-0 z-40 h-16 px-6 flex items-center justify-between backdrop-blur-[10px]" style={{ background: "rgba(248,245,238,0.82)", borderBottom: `1px solid ${T.borderSoft}` }}>
        <div className="flex items-center gap-3 md:gap-4">
          <button
            type="button"
            onClick={() => { if (typeof window !== "undefined" && window.history.length > 1) router.back(); else router.push("/"); }}
            className="group inline-flex items-center gap-1 text-[13px] font-medium cursor-pointer transition-colors hover:[color:#5c5641]"
            style={{ color: T.faint }}
            aria-label="Back to sign in"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5"><path d="M10 3.5 5.5 8 10 12.5" /></svg>
            Back
          </button>
          <span className="h-4 w-px" style={{ background: T.border }} />
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-8 h-8 object-contain" />
            <span className="font-title text-[16px] font-semibold tracking-[-0.02em]" style={{ color: T.text }}>AstroLaabh</span>
          </div>
        </div>
        <Link href="/" className="text-[13px] font-medium transition-opacity hover:opacity-70" style={{ color: T.muted }}>
          Partner sign in
        </Link>
      </header>

      {/* ===== HERO - asymmetric split ===== */}
      <section className="px-6 pt-12 md:pt-16 pb-16 md:pb-20">
        <div className="max-w-[1180px] mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
          <div className="rise">
            <span className="eyebrow">AstroLaabh Affiliate Program</span>
            <h1 className="font-title text-[38px] md:text-[52px] font-bold tracking-[-0.03em] leading-[1.05] mt-3" style={{ color: T.text }}>
              Earn from every gem <br className="hidden md:block" />you recommend.
            </h1>
            <p className="text-[16px] md:text-[17px] mt-5 max-w-[480px] leading-relaxed" style={{ color: T.muted }}>
              Recommend authentic, energised gemstones to your audience and earn up to 12% on every order.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <PrimaryCta pulse />
              <a
                href="#how-it-works"
                className="h-12 px-6 rounded-[11px] text-[14px] font-medium inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-px"
                style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text, boxShadow: T.shadow }}
              >
                How it works
                <Icon.arrowDown className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="rise" style={{ "--d": "120ms" } as React.CSSProperties}>
            <div className="relative rounded-[22px] overflow-hidden aspect-[4/5] max-h-[440px] lg:max-h-none" style={{ border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/login/hero-astrologer.png" alt="Astrologer charting a natal chart" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(36,39,27,0) 55%, rgba(36,39,27,0.55) 100%)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAND - hairline-separated, no cards ===== */}
      <section className="px-6 pb-20 md:pb-24">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 rounded-[18px] overflow-hidden" style={{ border: `1px solid ${T.borderSoft}`, background: T.card, boxShadow: T.shadow }}>
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`px-7 py-7 text-center md:text-left ${i > 0 ? "border-t md:border-t-0 md:border-l" : ""}`}
              style={{ borderColor: T.borderSoft }}
            >
              <div className="font-title text-[28px] md:text-[30px] font-bold tracking-[-0.02em]" style={{ color: T.gold }}>{s.value}</div>
              <div className="text-[13px] mt-1" style={{ color: T.muted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== BENEFITS - bento with rhythm ===== */}
      <section className="px-6 pb-20 md:pb-24">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-title text-[28px] md:text-[34px] font-bold tracking-[-0.02em] mb-3" style={{ color: T.text }}>Why partner with us</h2>
          <p className="text-[14.5px] mb-9 max-w-[520px]" style={{ color: T.muted }}>Everything you need to earn consistently. No upfront cost, no inventory, no headaches.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            {BENEFITS.map((b, i) => {
              const G = Icon[b.icon];
              const featured = i === 0;
              const tinted = i === 5;
              const span = featured || tinted ? "sm:col-span-2" : "";
              const bg = featured
                ? "linear-gradient(135deg, rgba(160,125,56,0.16), rgba(160,125,56,0.05))"
                : tinted
                ? "linear-gradient(135deg, rgba(119,123,98,0.12), rgba(119,123,98,0.04))"
                : T.card;
              const bd = featured ? "rgba(160,125,56,0.28)" : tinted ? "rgba(119,123,98,0.24)" : T.borderSoft;
              return (
                <div
                  key={b.title}
                  className={`group rounded-[16px] p-5 md:p-6 transition-all duration-200 hover:-translate-y-0.5 ${span} ${featured ? "flex flex-col sm:flex-row sm:items-center gap-5" : ""}`}
                  style={{ background: bg, border: `1px solid ${bd}`, boxShadow: T.shadow }}
                >
                  <div className={featured ? "flex items-start gap-4 flex-1" : ""}>
                    <span
                      className="shrink-0 w-11 h-11 rounded-[12px] flex items-center justify-center transition-colors"
                      style={{ background: featured ? "rgba(160,125,56,0.18)" : T.accentFaint, color: featured ? T.gold : T.accent }}
                    >
                      <G className="w-[22px] h-[22px]" />
                    </span>
                    <div className={featured ? "" : "mt-4"}>
                      <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>{b.title}</h3>
                      <p className="text-[13px] leading-relaxed mt-1" style={{ color: T.muted }}>{b.desc}</p>
                    </div>
                  </div>
                  {featured && (
                    <div className="shrink-0 sm:pl-5 sm:border-l flex sm:block items-baseline gap-2" style={{ borderColor: "rgba(160,125,56,0.22)" }}>
                      <div className="font-title text-[40px] md:text-[46px] font-bold tracking-[-0.03em] leading-none" style={{ color: T.gold }}>12%</div>
                      <div className="text-[12px] mt-1.5" style={{ color: T.muted }}>top commission tier</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS - horizontal steps ===== */}
      <section id="how-it-works" className="px-6 pb-20 md:pb-24 scroll-mt-20">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-title text-[28px] md:text-[34px] font-bold tracking-[-0.02em]" style={{ color: T.text }}>How it works</h2>
          <p className="text-[14.5px] mt-2 mb-10" style={{ color: T.muted }}>Get started in under two minutes.</p>

          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {STEPS_HOW.map((s, i) => (
              <div
                key={s.num}
                className="group relative rounded-[18px] p-6 transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}
              >
                {/* connector arrow between cards on desktop */}
                {i < STEPS_HOW.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-[13px] z-10 w-6 h-6 -translate-y-1/2 items-center justify-center rounded-full" style={{ background: T.bg, color: T.gold }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M9 6l6 6-6 6" /></svg>
                  </div>
                )}
                <span
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center font-title text-[15px] font-bold tabular-nums"
                  style={{ background: "linear-gradient(135deg, #c3a058, #a07d38)", color: "#fff", boxShadow: "0 4px 12px -4px rgba(160,125,56,0.5)" }}
                >
                  {s.num}
                </span>
                <h3 className="text-[16.5px] font-semibold mt-5 tracking-[-0.01em]" style={{ color: T.text }}>{s.title}</h3>
                <p className="text-[13.5px] leading-relaxed mt-2" style={{ color: T.muted }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12"><PrimaryCta /></div>
        </div>
      </section>

      {/* ===== FAQ - accordion ===== */}
      <section className="px-6 pb-20 md:pb-24">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-title text-[28px] md:text-[34px] font-bold tracking-[-0.02em] mb-8" style={{ color: T.text }}>Frequently asked questions</h2>
          <div className="rounded-[16px] overflow-hidden" style={{ border: `1px solid ${T.borderSoft}`, background: T.card }}>
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={f.q} style={{ borderTop: i > 0 ? `1px solid ${T.borderSoft}` : undefined }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? -1 : i)}
                    className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.04)]"
                  >
                    <span className="text-[14.5px] font-medium" style={{ color: T.text }}>{f.q}</span>
                    <Icon.chevron className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className="grid transition-all duration-200 ease-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                    <div className="overflow-hidden">
                      <p className="text-[13.5px] leading-relaxed px-5 pb-4" style={{ color: T.muted }}>{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CLOSING CTA - deep sage band ===== */}
      <section className="px-6 pb-16">
        <div className="max-w-[1000px] mx-auto relative overflow-hidden rounded-[24px] px-8 py-12 md:px-14 md:py-16 text-center" style={{ background: T.sidebar }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/login/bg-gems.jpg" alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(36,39,27,0.82), rgba(36,39,27,0.9))" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(160,125,56,0.28), transparent 70%)" }} />
          <div className="relative z-10">
            <h2 className="font-title text-[26px] md:text-[34px] font-bold tracking-[-0.02em]" style={{ color: T.sidebarText }}>Ready to start earning?</h2>
            <p className="text-[14.5px] mt-3 max-w-[440px] mx-auto leading-relaxed" style={{ color: T.sidebarMuted }}>
              Join hundreds of partners earning with AstroLaabh. Free to join, quick approval.
            </p>
            <Link
              href="/affiliate-program/signup"
              className="mt-8 h-12 px-8 rounded-[11px] text-[14.5px] font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-105 hover:-translate-y-px"
              style={{ background: T.sidebarText, color: T.sidebar, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}
            >
              {CTA_LABEL}
              <Icon.arrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="px-6 py-8" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
        <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-6 h-6 object-contain" />
            <span className="text-[13px] font-medium" style={{ color: T.muted }}>AstroLaabh</span>
          </div>
          <p className="text-[12.5px]" style={{ color: T.faint }}>© 2026 AstroLaabh. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
