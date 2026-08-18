"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_ACCOUNTS, DEMO_PASSWORD, ROLE_ROUTES, INVITE_ACCOUNTS } from "@/lib/store/auth";
import { T } from "@/lib/theme";

export default function LoginPage() {
  const router = useRouter();
  const { login, selectRole } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const canSubmit = Boolean(email.trim() && password);
  const inputCls = "w-full h-11 px-3.5 rounded-[10px] text-[14px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]";
  const inputStyle = { background: "#fbf8f1", border: `1px solid ${T.border}`, color: T.text, boxShadow: "inset 0 1px 2px rgba(43,42,34,0.03)" };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    const user = login(email, password);
    if (!user) {
      setError("We couldn't sign you in with those details. Check the email and password.");
      return;
    }
    setError("");
    router.push(ROLE_ROUTES[user.role]);
  };

  return (
    <main
      className="min-h-dvh relative overflow-hidden"
      style={{ background: `url(/login/bg-gems.jpg) center / cover no-repeat, ${T.bg}` }}
    >
      {/* soft wash so type holds on the left, the stone breathes on the right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, rgba(241,235,220,0.72) 0%, rgba(241,235,220,0.4) 42%, rgba(241,235,220,0) 68%)" }}
      />

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
                <div className="font-title text-[22px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: T.text }}>Operations Portal</div>
              </div>
            </div>
            <div className="hairline mb-6" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>
                  Work email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@astrolaabh.house"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    className={`${inputCls} !pr-11`}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.07)]"
                    style={{ color: T.faint }}
                  >
                    {showPassword ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" /></svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button type="button" onClick={() => router.push("/forgot-password")} className="text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-80" style={{ color: T.accent }}>
                    Forgot password?
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="flex items-start gap-2 text-[12.5px] px-3 py-2.5 rounded-[9px]"
                  style={{ background: "rgba(163,73,63,0.08)", border: "1px solid rgba(163,73,63,0.22)", color: T.danger }}
                >
                  <span className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: T.danger }} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full h-11 rounded-[10px] text-[14px] font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:brightness-100 hover:brightness-110 hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(43,42,34,0.08),0_14px_30px_-14px_rgba(160,125,56,0.55)] active:scale-[0.99] cursor-pointer"
                style={{ background: T.primary, color: T.primaryInk, boxShadow: "inset 0 1px 0 rgba(244,241,229,0.12), 0 1px 2px rgba(43,42,34,0.1)" }}
              >
                Sign in
              </button>
            </form>

            {/* Demo helper — click an account to fill the form */}
            <div className="mt-5 rounded-[12px] px-3.5 py-3" style={{ background: "rgba(89,82,54,0.045)", border: `1px solid ${T.borderSoft}` }}>
              <button
                onClick={() => setShowDemo((v) => !v)}
                className="w-full flex items-center justify-between text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                style={{ color: T.muted }}
              >
                <span>Demo accounts — password <span className="font-semibold tabular-nums" style={{ color: T.text }}>{DEMO_PASSWORD}</span></span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-3.5 h-3.5 transition-transform duration-200 ${showDemo ? "rotate-180" : ""}`}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {showDemo && (
                <div className="mt-3 space-y-1">
                  {DEMO_ACCOUNTS.map((a) => (
                    <button
                      key={a.email}
                      onClick={() => { setEmail(a.email); setPassword(DEMO_PASSWORD); setError(""); setShowDemo(false); }}
                      className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[8px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                    >
                      <span className="text-[12.5px] font-medium" style={{ color: T.text }}>{a.label}</span>
                      <span className="text-[11.5px] truncate" style={{ color: T.faint }}>{a.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => { selectRole("affiliate"); router.push("/onboarding"); }}
            className="group mt-5 w-full flex items-center justify-center gap-2 h-11 rounded-[10px] text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-[rgba(119,123,98,0.06)]"
            style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
          >
            <span style={{ color: T.muted }}>New affiliate?</span>
            <span className="font-semibold" style={{ color: T.accent }}>Apply to partner</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: T.accent }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>

      {/* Prototype controller — simulate a newly-invited user opening their activation link */}
      <div className="fixed bottom-5 right-5 z-50">
        {showInvite && (
          <div
            className="mb-2 w-[260px] rounded-[14px] p-3.5"
            style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: "0 4px 12px rgba(43,42,34,0.10), 0 30px 60px -30px rgba(43,42,34,0.45)" }}
          >
            <div className="text-[10px] font-semibold tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Prototype · invite flow</div>
            <p className="text-[12px] leading-relaxed mb-2.5" style={{ color: T.muted }}>Open the first-time “set your password” link as an invited user:</p>
            <div className="space-y-1">
              {INVITE_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  onClick={() => router.push(`/set-password?email=${encodeURIComponent(a.email)}`)}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[9px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.10)]"
                >
                  <span className="text-[12.5px] font-medium" style={{ color: T.text }}>{a.label}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" style={{ color: T.faint }}><path d="m9 18 6-6-6-6" /></svg>
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => setShowInvite((v) => !v)}
          className="ml-auto flex items-center gap-1.5 h-9 pl-2.5 pr-3.5 rounded-full text-[12px] font-medium cursor-pointer transition-all duration-200 hover:brightness-105"
          style={{ background: T.primary, color: T.primaryInk, boxShadow: "0 6px 20px -6px rgba(43,42,34,0.5)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          {showInvite ? "Close" : "Prototype"}
        </button>
      </div>
    </main>
  );
}
