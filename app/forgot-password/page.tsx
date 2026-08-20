"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { Alert } from "@/components/ui";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full h-11 px-3.5 rounded-[10px] text-[14px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(160,125,56,0.16)]";
  const inputStyle = { background: "#fbf8f1", border: `1px solid ${T.border}`, color: T.text, boxShadow: "inset 0 1px 2px rgba(43,42,34,0.03)" } as const;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setSent(true);
  };

  return (
    <main className="min-h-dvh relative overflow-hidden" style={{ background: `url(/login/bg-gems.jpg) center / cover no-repeat, ${T.bg}` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(241,235,220,0.72) 0%, rgba(241,235,220,0.4) 42%, rgba(241,235,220,0) 68%)" }} />
      <div className="relative z-10 min-h-dvh flex items-center px-6 md:px-[9vw]">
        <div className="w-full max-w-[440px]">
          <div
            className="rounded-[22px] p-8 backdrop-blur-[8px]"
            style={{
              background: "rgba(250, 246, 236, 0.94)",
              border: "1px solid rgba(255,253,247,0.75)",
              boxShadow: "0 2px 6px rgba(43,42,34,0.06), 0 32px 70px -30px rgba(43,42,34,0.4), inset 0 1px 0 rgba(255,253,247,0.85)",
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-12 h-12 object-contain drop-shadow-[0_4px_12px_rgba(160,125,56,0.35)]" />
              <div>
                <div className="eyebrow mb-0.5">AstroLaabh</div>
                <div className="font-title text-[22px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: T.text }}>Reset your password</div>
              </div>
            </div>
            <div className="hairline mb-6" />

            {sent ? (
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-[14px] mx-auto mb-4 flex items-center justify-center" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
                </div>
                <h2 className="text-[15px] font-semibold" style={{ color: T.text }}>Check your inbox</h2>
                <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: T.muted }}>
                  If an account exists for <span className="font-medium" style={{ color: T.text }}>{email.trim()}</span>, we&apos;ve sent a link to reset your password.
                </p>
                <button onClick={() => router.push("/")} className="mt-6 h-11 w-full rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110" style={{ background: T.accent, color: T.accentInk }}>
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <p className="text-[13px] leading-relaxed" style={{ color: T.muted }}>
                  Enter the email tied to your account and we&apos;ll send you a link to set a new password.
                </p>
                <div>
                  <label className="block text-[11px] font-medium tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>Work email</label>
                  <input type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@astrolaabh.house" className={inputCls} style={inputStyle} />
                </div>
                {error && <Alert tone="error">{error}</Alert>}
                <button type="submit" className="h-11 w-full rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110" style={{ background: T.accent, color: T.accentInk }}>
                  Send reset link
                </button>
                <button type="button" onClick={() => router.push("/")} className="w-full text-center text-[12.5px] font-medium cursor-pointer transition-opacity hover:opacity-80" style={{ color: T.accent }}>
                  ← Back to sign in
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
