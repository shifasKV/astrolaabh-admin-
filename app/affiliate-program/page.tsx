"use client";
import { useState } from "react";
import Link from "next/link";
import { T } from "@/lib/theme";

const BENEFITS = [
  { icon: "💰", title: "Earn up to 12% commission", desc: "On every successful referral purchase — gemstones, jewellery, and consultations." },
  { icon: "📊", title: "Real-time dashboard", desc: "Track clicks, conversions, and earnings with a clean analytics panel built for you." },
  { icon: "🔗", title: "Custom referral links", desc: "Generate unique links for campaigns, social posts, or WhatsApp shares in one click." },
  { icon: "⚡", title: "Fast payouts", desc: "Monthly bank transfers — no minimum threshold, no hidden deductions." },
  { icon: "🎓", title: "Expert-backed products", desc: "Recommend only astrologer-certified, energised gemstones your audience can trust." },
  { icon: "🤝", title: "Dedicated support", desc: "Get a partner manager, marketing collateral, and priority resolution for your referrals." },
];

const STEPS_HOW = [
  { num: "01", title: "Create your account", desc: "Sign up with your email or Google — takes 30 seconds." },
  { num: "02", title: "Complete your profile", desc: "Add your bank details and PAN for payouts. We verify within 24 hours." },
  { num: "03", title: "Share & earn", desc: "Generate links, share with your audience, and watch your commissions grow." },
];

const FAQS = [
  { q: "Who can join the affiliate program?", a: "Anyone with an audience — astrologers, content creators, jewellers, wellness coaches, or social media influencers. There's no follower minimum." },
  { q: "How much can I earn?", a: "You earn 8–12% on every completed order placed through your referral link. Commission varies by product category." },
  { q: "When do I get paid?", a: "Payouts are processed on the 5th of every month for the previous month's confirmed earnings. Direct bank transfer, no minimum threshold." },
  { q: "Is there any cost to join?", a: "Absolutely not. The program is free to join and free to use — no hidden charges." },
];

export default function AffiliateProgramPage() {
  const [openFaq, setOpenFaq] = useState(0);
  return (
    <main className="min-h-dvh" style={{ background: T.bg }}>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden py-20 md:py-28 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 20%, rgba(160,125,56,0.06) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-[780px] mx-auto text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-16 h-16 object-contain mx-auto mb-6 drop-shadow-[0_4px_16px_rgba(160,125,56,0.35)]" />
          <h1 className="font-title text-[36px] md:text-[48px] font-bold tracking-[-0.03em] leading-[1.1]" style={{ color: T.text }}>
            Earn with AstroLaabh
          </h1>
          <p className="text-[16px] md:text-[18px] mt-4 max-w-[540px] mx-auto leading-relaxed" style={{ color: T.muted }}>
            Join our affiliate program and earn commissions by recommending authentic, energised gemstones to your audience.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link
              href="/affiliate-program/signup"
              className="h-12 px-7 rounded-[11px] text-[14.5px] font-semibold inline-flex items-center justify-center transition-all duration-200 hover:brightness-110 hover:-translate-y-px hover:shadow-[0_8px_24px_-8px_rgba(160,125,56,0.5)]"
              style={{ background: T.primary, color: T.primaryInk, boxShadow: "0 1px 2px rgba(43,42,34,0.1), 0 4px 12px -4px rgba(160,125,56,0.3)" }}
            >
              Create account
            </Link>
            <a
              href="#how-it-works"
              className="h-12 px-6 rounded-[11px] text-[14px] font-medium inline-flex items-center gap-2 transition-all duration-200 hover:-translate-y-px"
              style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text, boxShadow: T.shadow }}
            >
              How it works
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4"><path d="m6 9 6 6 6-6" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className="px-6 pb-20">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-title text-[26px] md:text-[32px] font-bold tracking-[-0.02em] text-center mb-3" style={{ color: T.text }}>Why partner with us</h2>
          <p className="text-[14px] text-center mb-10 max-w-[480px] mx-auto" style={{ color: T.muted }}>Everything you need to earn consistently — no upfront cost, no inventory, no headaches.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-[16px] p-5" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}>
                <div className="text-[24px] mb-3">{b.icon}</div>
                <h3 className="text-[14px] font-semibold mb-1" style={{ color: T.text }}>{b.title}</h3>
                <p className="text-[12.5px] leading-relaxed" style={{ color: T.muted }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="px-6 pb-20">
        <div className="max-w-[780px] mx-auto">
          <h2 className="font-title text-[26px] md:text-[32px] font-bold tracking-[-0.02em] text-center mb-3" style={{ color: T.text }}>How it works</h2>
          <p className="text-[14px] text-center mb-10" style={{ color: T.muted }}>Get started in under 2 minutes</p>
          <div className="space-y-4">
            {STEPS_HOW.map((s, i) => (
              <div key={s.num} className="flex items-start gap-5 rounded-[16px] p-5" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}>
                <span className="text-[28px] font-title font-bold tracking-[-0.02em] shrink-0 w-10 text-right" style={{ color: i === 0 ? T.accent : T.faint }}>{s.num}</span>
                <div>
                  <h3 className="text-[15px] font-semibold mb-0.5" style={{ color: T.text }}>{s.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: T.muted }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/affiliate-program/signup"
              className="h-12 px-7 rounded-[11px] text-[14.5px] font-semibold inline-flex items-center justify-center transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
              style={{ background: T.primary, color: T.primaryInk, boxShadow: "0 1px 2px rgba(43,42,34,0.1), 0 4px 12px -4px rgba(160,125,56,0.3)" }}
            >
              Get started — it&apos;s free
            </Link>
          </div>
        </div>
      </section>


      {/* ===== FAQ ===== */}
      <section className="px-6 pb-20">
        <div className="max-w-[640px] mx-auto">
          <h2 className="font-title text-[26px] md:text-[32px] font-bold tracking-[-0.02em] text-center mb-8" style={{ color: T.text }}>Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={f.q} className="rounded-[14px] p-4 cursor-pointer transition-all duration-200" style={{ background: T.card, border: `1px solid ${isOpen ? T.border : T.borderSoft}` }} onClick={() => setOpenFaq(isOpen ? -1 : i)}>
                  <div className="flex items-center justify-between gap-3 text-[14px] font-medium" style={{ color: T.text }}>
                    {f.q}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} style={{ color: T.faint }}><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                  {isOpen && <p className="text-[13px] mt-3 leading-relaxed" style={{ color: T.muted }}>{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA FOOTER ===== */}
      <section className="px-6 pb-16">
        <div className="max-w-[640px] mx-auto rounded-[20px] p-8 md:p-10 text-center" style={{ background: "rgba(119,123,98,0.06)", border: `1px solid ${T.borderSoft}` }}>
          <h2 className="font-title text-[22px] md:text-[28px] font-bold tracking-[-0.02em] mb-2" style={{ color: T.text }}>Ready to start earning?</h2>
          <p className="text-[14px] mb-6" style={{ color: T.muted }}>Join hundreds of partners earning with AstroLaabh. Free to join, quick approval.</p>
          <Link
            href="/affiliate-program/signup"
            className="h-12 px-7 rounded-[11px] text-[14.5px] font-semibold inline-flex items-center justify-center transition-all duration-200 hover:brightness-110 hover:-translate-y-px"
            style={{ background: T.primary, color: T.primaryInk, boxShadow: "0 1px 2px rgba(43,42,34,0.1), 0 4px 12px -4px rgba(160,125,56,0.3)" }}
          >
            Create your free account
          </Link>
        </div>
      </section>
    </main>
  );
}
