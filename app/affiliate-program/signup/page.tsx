"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/store/auth";
import { T } from "@/lib/theme";

type Step = "email" | "otp";

export default function AffiliateSignupPage() {
  const router = useRouter();
  const { selectRole } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const inputCls = "w-full h-11 px-3.5 rounded-[10px] text-[14px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]";
  const inputStyle = { background: "#fbf8f1", border: `1px solid ${T.border}`, color: T.text, boxShadow: "inset 0 1px 2px rgba(43,42,34,0.03)" };

  const handleSendOtp = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep("otp");
    }, 800);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError("");
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleVerify = (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    selectRole("affiliate");
    router.push("/onboarding");
  };

  const handleGoogle = () => {
    selectRole("affiliate");
    router.push("/onboarding");
  };

  return (
    <main
      className="min-h-dvh relative overflow-hidden"
      style={{ background: `url(/login/bg-gems.jpg) center / cover no-repeat, ${T.bg}` }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(241,235,220,0.82) 0%, rgba(241,235,220,0.5) 50%, rgba(241,235,220,0.2) 100%)" }} />

      <div className="relative z-10 min-h-dvh flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-5">
            <Link
              href="/affiliate-program"
              className="group inline-flex items-center gap-1.5 text-[12.5px] font-medium h-8 pl-2 pr-3 rounded-full transition-all duration-200 hover:-translate-x-0.5"
              style={{ color: T.muted, background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5"><path d="M10 3.5 5.5 8 10 12.5" /></svg>
              Back
            </Link>
          </div>

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
                <div className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Affiliate Program</div>
                <div className="font-title text-[22px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: T.text }}>Create account</div>
              </div>
            </div>
            <div className="h-px mb-6" style={{ background: T.border }} />

            {step === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@example.com"
                    className={inputCls}
                    style={inputStyle}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-[12.5px] px-3 py-2.5 rounded-[9px]" style={{ background: "rgba(163,73,63,0.08)", border: "1px solid rgba(163,73,63,0.22)", color: T.danger }}>
                    <span className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: T.danger }} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!email.trim() || sending}
                  className="w-full h-11 rounded-[10px] text-[14px] font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 hover:-translate-y-px active:scale-[0.99] cursor-pointer"
                  style={{ background: T.primary, color: T.primaryInk, boxShadow: "inset 0 1px 0 rgba(244,241,229,0.12), 0 1px 2px rgba(43,42,34,0.1)" }}
                >
                  {sending ? "Sending…" : "Continue with email"}
                </button>

                <div className="flex items-center gap-3 mt-4">
                  <div className="flex-1 h-px" style={{ background: T.border }} />
                  <span className="text-[11px] font-medium tracking-[0.06em] uppercase" style={{ color: T.faint }}>or</span>
                  <div className="flex-1 h-px" style={{ background: T.border }} />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  className="w-full h-11 mt-4 rounded-[10px] text-[13.5px] font-medium flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-[0_2px_6px_rgba(43,42,34,0.08)] active:scale-[0.99]"
                  style={{ background: "#fff", border: `1px solid ${T.border}`, color: T.text, boxShadow: "0 1px 2px rgba(43,42,34,0.06)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(119,123,98,0.10)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: T.accent }}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <h2 className="text-[16px] font-semibold mb-1" style={{ color: T.text }}>Verify your email</h2>
                  <p className="text-[13px]" style={{ color: T.muted }}>
                    We sent a 6-digit code to <span className="font-medium" style={{ color: T.text }}>{email}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium tracking-[0.08em] uppercase mb-2 text-center" style={{ color: T.faint }}>
                    Enter code
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-11 h-12 rounded-[10px] text-center text-[18px] font-semibold outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]"
                        style={inputStyle}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-[12.5px] px-3 py-2.5 rounded-[9px]" style={{ background: "rgba(163,73,63,0.08)", border: "1px solid rgba(163,73,63,0.22)", color: T.danger }}>
                    <span className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: T.danger }} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otp.join("").length < 6}
                  className="w-full h-11 rounded-[10px] text-[14px] font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 hover:-translate-y-px active:scale-[0.99] cursor-pointer"
                  style={{ background: T.primary, color: T.primaryInk, boxShadow: "inset 0 1px 0 rgba(244,241,229,0.12), 0 1px 2px rgba(43,42,34,0.1)" }}
                >
                  Verify & continue
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setOtp(["", "", "", "", "", ""]); setError(""); handleSendOtp(); }}
                    className="text-[12.5px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                    style={{ color: T.accent }}
                  >
                    Resend code
                  </button>
                  <span className="mx-2 text-[11px]" style={{ color: T.faint }}>·</span>
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                    className="text-[12.5px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                    style={{ color: T.muted }}
                  >
                    Change email
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-[12px] mt-5" style={{ color: T.faint }}>
            Already have an account?{" "}
            <Link href="/" className="font-medium" style={{ color: T.accent }}>Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
