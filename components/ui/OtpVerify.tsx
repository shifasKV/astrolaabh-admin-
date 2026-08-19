"use client";
import { T } from "@/lib/theme";
import { Alert } from "./Alert";

export function applyOtpInput(otp: string[], index: number, raw: string): { next: string[]; focusIndex: number } {
  const digits = raw.replace(/\D/g, "");
  const next = [...otp];
  if (!digits) {
    next[index] = "";
    return { next, focusIndex: index };
  }
  if (digits.length > 1) {
    digits.slice(0, 6).split("").forEach((d, i) => { next[i] = d; });
    return { next, focusIndex: Math.min(digits.length, 5) };
  }
  next[index] = digits;
  return { next, focusIndex: Math.min(index + 1, 5) };
}

export function OtpVerifyForm({
  email,
  otp,
  otpRefs,
  error,
  resendIn,
  submitLabel,
  onOtpChange,
  onOtpKeyDown,
  onSubmit,
  onResend,
  onBack,
}: {
  email: string;
  otp: string[];
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  error: string;
  resendIn: number;
  submitLabel: string;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
}) {
  const filled = otp.join("").length === 6;

  return (
    <form onSubmit={onSubmit}>
      <h2 className="font-title text-[20px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: T.text }}>
        Enter the code
      </h2>
      <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: T.muted }}>
        A 6-digit OTP was sent to your email. It expires in a few minutes.
      </p>

      <div
        className="mt-4 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5"
        style={{ background: "rgba(89,82,54,0.045)", border: `1px solid ${T.borderSoft}` }}
      >
        <span className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: T.accentFaint, color: T.accent }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-medium tracking-[0.06em] uppercase" style={{ color: T.faint }}>Sent to</div>
          <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{email}</div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-[12px] font-medium shrink-0 cursor-pointer hover:underline underline-offset-4"
          style={{ color: T.accent }}
        >
          Change
        </button>
      </div>

      <div className="mt-5">
        <label className="block text-[11px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>
          One-time password
        </label>
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={i === 0 ? 6 : 1}
              aria-label={`Digit ${i + 1}`}
              value={digit}
              data-filled={!!digit}
              onChange={(e) => onOtpChange(i, e.target.value)}
              onKeyDown={(e) => onOtpKeyDown(i, e)}
              className="h-12 w-full rounded-[10px] text-center text-[18px] font-semibold tabular-nums outline-none transition-all duration-150 border-[1.5px] [border-color:rgba(89,82,54,0.20)] shadow-[inset_0_1px_2px_rgba(43,42,34,0.03)] data-[filled=true]:[border-color:rgba(119,123,98,0.45)] focus:[border-color:#65694f] focus:shadow-[0_0_0_3px_rgba(101,105,79,0.18)]"
              style={{ background: digit ? T.card : "#fbf8f1", color: T.text }}
              autoFocus={i === 0}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 min-h-[20px]">
        {resendIn > 0 ? (
          <p className="text-[12.5px]" style={{ color: T.muted }}>
            Resend OTP in <span className="font-semibold tabular-nums" style={{ color: T.text }}>{resendIn}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={onResend}
            className="text-[12.5px] font-medium cursor-pointer hover:underline underline-offset-4"
            style={{ color: T.accent }}
          >
            Resend OTP
          </button>
        )}
      </div>

      {error && <Alert tone="error" className="mt-3">{error}</Alert>}

      <button
        type="submit"
        disabled={!filled}
        className="mt-5 w-full h-11 rounded-[10px] text-[14px] font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:brightness-100 hover:brightness-110 hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(43,42,34,0.08),0_14px_30px_-14px_rgba(160,125,56,0.55)] active:scale-[0.99] cursor-pointer"
        style={{ background: T.accent, color: T.accentInk, boxShadow: "inset 0 1px 0 rgba(244,241,229,0.12), 0 1px 2px rgba(43,42,34,0.1)" }}
      >
        {submitLabel}
      </button>
    </form>
  );
}
