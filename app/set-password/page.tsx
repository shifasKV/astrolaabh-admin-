"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, INVITE_ACCOUNTS, ROLE_ROUTES } from "@/lib/store/auth";
import { T } from "@/lib/theme";
import { Alert } from "@/components/ui";

function SetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginByEmail } = useAuth();

  const email = params.get("email") ?? "";
  const invite = INVITE_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
  const roleLabel = invite?.label ?? "team member";

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full h-11 px-3.5 rounded-[10px] text-[14px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(160,125,56,0.16)]";
  const inputStyle = { background: "#fbf8f1", border: `1px solid ${T.border}`, color: T.text, boxShadow: "inset 0 1px 2px rgba(43,42,34,0.03)" } as const;

  const rules = { length: pw.length >= 8, match: pw.length > 0 && pw === confirm };
  const canSubmit = rules.length && rules.match;

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!rules.length) { setError("Use at least 8 characters."); return; }
    if (!rules.match) { setError("Passwords don't match."); return; }
    setError("");
    const user = loginByEmail(email);
    router.push(user ? ROLE_ROUTES[user.role] : "/");
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
            <div className="flex items-center gap-4 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-12 h-12 object-contain drop-shadow-[0_4px_12px_rgba(160,125,56,0.35)]" />
              <div>
                <div className="eyebrow mb-0.5">Activate your account</div>
                <div className="font-title text-[22px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: T.text }}>Set a password</div>
              </div>
            </div>

            {/* Highlighted welcome */}
            <div
              className="rounded-[14px] p-4 mb-5"
              style={{ background: "linear-gradient(160deg, #faf0d8 0%, #efdfb8 100%)", border: "1px solid rgba(160,125,56,0.35)" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-title text-[16px] font-semibold tracking-[-0.01em]" style={{ color: "#7a5c26" }}>Welcome to AstroLaabh</span>
                <span className="text-[15px]" aria-hidden>✦</span>
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "#8a6a2f" }}>
                You&apos;ve been invited as {invite ? <span className="font-semibold">{roleLabel === "team member" ? "a team member" : `an ${roleLabel}`}</span> : "a team member"}.
                {email && <> Set a password for <span className="font-semibold">{email}</span> to activate your account.</>}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>New password</label>
                <div className="relative">
                  <input type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => { setPw(e.target.value); setError(""); }} placeholder="At least 8 characters" className={`${inputCls} !pr-11`} style={inputStyle} />
                  <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.07)]" style={{ color: T.faint }}>
                    {show ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" /></svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>Confirm password</label>
                <input type={show ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }} placeholder="Re-enter password" className={inputCls} style={inputStyle} />
              </div>

              <div className="flex items-center gap-4 text-[12px]">
                <span className="inline-flex items-center gap-1.5" style={{ color: rules.length ? T.good : T.faint }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: rules.length ? T.good : T.borderSoft }} /> 8+ characters
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ color: rules.match ? T.good : T.faint }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: rules.match ? T.good : T.borderSoft }} /> passwords match
                </span>
              </div>

              {error && <Alert tone="error">{error}</Alert>}

              <button type="submit" disabled={!canSubmit} className="h-11 w-full rounded-[10px] text-[14px] font-semibold transition-all duration-200 hover:brightness-110 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed" style={{ background: T.accent, color: T.accentInk }}>
                Set password &amp; continue →
              </button>
              <button type="button" onClick={() => router.push("/")} className="w-full text-center text-[12.5px] font-medium cursor-pointer transition-opacity hover:opacity-80" style={{ color: T.accent }}>
                ← Back to sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordInner />
    </Suspense>
  );
}
