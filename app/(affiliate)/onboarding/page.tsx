"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, GoldBtn } from "@/components/ui";
import { useAuth } from "@/lib/store/auth";
import * as V from "@/lib/validators";
import { T } from "@/lib/theme";

const STEPS = [
  { key: "personal", label: "Personal Details" },
  { key: "bank", label: "Bank Details" },
  { key: "document", label: "Upload PAN" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearErr = (k: string) => setErrors((p) => (p[k] ? { ...p, [k]: "" } : p));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccount, setConfirmAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");

  const [panFile, setPanFile] = useState<string | null>(null);
  const [panDrag, setPanDrag] = useState(false);


  const validateStep = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      e.name = V.required(name, "Full name");
      e.email = V.email(email);
      e.phone = V.phone(phone);
    } else if (step === 1) {
      e.holderName = V.required(holderName, "Account holder name");
      e.bankName = V.required(bankName, "Bank name");
      e.accountNumber = V.required(accountNumber, "Account number");
      e.confirmAccount = !confirmAccount ? "Please re-enter the account number." : accountNumber !== confirmAccount ? "Account numbers do not match." : "";
      e.ifsc = V.ifsc(ifsc);
    } else if (step === 2) {
      e.pan = panFile ? "" : "Please upload your PAN card.";
    }
    setErrors(e);
    return V.isClean(e);
  };

  const goNext = () => { if (validateStep()) setStep(step + 1); };

  const handleSubmit = () => {
    if (!validateStep()) return;
    router.push("/profile?status=pending");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden" style={{ background: `url(/login/onboarding-gems.png) center / cover no-repeat, ${T.bg}` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(241,235,220,0.62) 0%, rgba(241,235,220,0.42) 55%, rgba(241,235,220,0.6) 100%)" }} />

      {/* Subtle utility — so a new partner never feels stuck */}
      <div className="fixed top-5 right-5 z-20 flex items-center gap-1.5 h-9 px-1.5 rounded-full" style={{ background: "rgba(255,253,247,0.8)", border: `1px solid ${T.borderSoft}`, backdropFilter: "blur(6px)", boxShadow: T.shadow }}>
        <a href="mailto:support@astrolaabh.house" className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] font-medium transition-colors hover:bg-[rgba(119,123,98,0.1)]" style={{ color: T.muted }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M4 4h16v12H5.2L4 17.2z" /><path d="M8 9h8M8 12h5" /></svg>
          Support
        </a>
        <span className="w-px h-4" style={{ background: T.borderSoft }} />
        <button onClick={() => { logout(); router.push("/"); }} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] font-medium cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.1)]" style={{ color: T.muted }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>
          Log out
        </button>
      </div>
      <div className="relative z-10 w-full max-w-[560px]">
        {step > 0 && (
          <div className="mb-5">
            <button
              onClick={() => setStep(step - 1)}
              className="group inline-flex items-center gap-1.5 text-[12.5px] font-medium h-8 pl-2 pr-3 rounded-full transition-all duration-200 hover:-translate-x-0.5 cursor-pointer"
              style={{ color: T.muted, background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5"><path d="M10 3.5 5.5 8 10 12.5" /></svg>
              Back
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-14 h-14 object-contain mx-auto mb-4 drop-shadow-[0_4px_12px_rgba(119,123,98,0.35)]" />
          <h1 className="font-title text-[24px] font-semibold tracking-[-0.02em]" style={{ color: T.text }}>Welcome to AstroLaabh</h1>
          <p className="text-[14px] mt-2" style={{ color: T.muted }}>Complete your profile to start as an affiliate partner</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <button
                onClick={() => { if (i < step) setStep(i); }}
                className="flex items-center gap-2 cursor-pointer"
                disabled={i > step}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all"
                  style={{
                    background: i < step ? T.good : i === step ? T.accent : "transparent",
                    border: `2px solid ${i < step ? T.good : i === step ? T.accent : T.border}`,
                    color: i <= step ? "#fff" : T.muted,
                  }}
                >
                  {i < step ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="text-[12px] font-medium hidden sm:inline" style={{ color: i === step ? T.text : T.muted }}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="w-8 h-[2px] rounded-full" style={{ background: i < step ? T.good : T.borderSoft }} />
              )}
            </div>
          ))}
        </div>

        <Card className="p-6">
          {/* Step 1: Personal Details */}
          {step === 0 && (
            <>
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>Personal Details</h2>
              <p className="text-[13px] mb-5" style={{ color: T.muted }}>Tell us a bit about yourself</p>
              <div className="space-y-4">
                <Input value={name} onChange={(v) => { setName(v); clearErr("name"); }} onBlur={() => setErrors((p) => ({ ...p, name: V.required(name, "Full name") }))} error={errors.name} label="Full name" placeholder="e.g. Pt. Sandeep Kochaar" />
                <Input value={email} onChange={(v) => { setEmail(v); clearErr("email"); }} onBlur={() => setErrors((p) => ({ ...p, email: V.email(email) }))} error={errors.email} label="Email address" type="email" placeholder="you@example.com" />
                <Input value={phone} onChange={(v) => { setPhone(v); clearErr("phone"); }} onBlur={() => setErrors((p) => ({ ...p, phone: V.phone(phone) }))} error={errors.phone} label="Phone number" type="tel" placeholder="+91 98100 00000" />
                <Input value={city} onChange={setCity} label="City (optional)" placeholder="e.g. New Delhi" />
              </div>
            </>
          )}

          {/* Step 2: Bank Details */}
          {step === 1 && (
            <>
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>Bank Details</h2>
              <p className="text-[13px] mb-5" style={{ color: T.muted }}>For commission payouts</p>
              <div className="space-y-4">
                <Input value={holderName} onChange={(v) => { setHolderName(v); clearErr("holderName"); }} onBlur={() => setErrors((p) => ({ ...p, holderName: V.required(holderName, "Account holder name") }))} error={errors.holderName} label="Account holder name" placeholder="As on bank records" />
                <Input value={bankName} onChange={(v) => { setBankName(v); clearErr("bankName"); }} onBlur={() => setErrors((p) => ({ ...p, bankName: V.required(bankName, "Bank name") }))} error={errors.bankName} label="Bank name" placeholder="e.g. HDFC Bank" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input value={accountNumber} onChange={(v) => { setAccountNumber(v); clearErr("accountNumber"); }} onBlur={() => setErrors((p) => ({ ...p, accountNumber: V.required(accountNumber, "Account number") }))} error={errors.accountNumber} label="Account number" type="number" placeholder="Enter account number" />
                  <Input value={confirmAccount} onChange={(v) => { setConfirmAccount(v); clearErr("confirmAccount"); }} onBlur={() => setErrors((p) => ({ ...p, confirmAccount: !confirmAccount ? "Please re-enter the account number." : accountNumber !== confirmAccount ? "Account numbers do not match." : "" }))} error={errors.confirmAccount} label="Confirm account number" type="number" placeholder="Re-enter account number" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input value={ifsc} onChange={(v) => { setIfsc(v); clearErr("ifsc"); }} onBlur={() => setErrors((p) => ({ ...p, ifsc: V.ifsc(ifsc) }))} error={errors.ifsc} label="IFSC code" placeholder="e.g. HDFC0001234" />
                  <Input value={upiId} onChange={setUpiId} label="UPI ID (optional)" placeholder="e.g. name@upi" />
                </div>
              </div>
            </>
          )}

          {/* Step 3: Upload PAN */}
          {step === 2 && (
            <>
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>Upload PAN Card</h2>
              <p className="text-[13px] mb-5" style={{ color: T.muted }}>Required for KYC verification</p>
              <div
                className="border-2 border-dashed rounded-[12px] p-8 text-center transition-colors cursor-pointer"
                style={{
                  borderColor: panDrag ? T.accent : panFile ? T.good : T.border,
                  background: panDrag ? `${T.accent}08` : panFile ? `${T.good}08` : "transparent",
                }}
                onDragOver={(e) => { e.preventDefault(); setPanDrag(true); }}
                onDragLeave={() => setPanDrag(false)}
                onDrop={(e) => { e.preventDefault(); setPanDrag(false); if (e.dataTransfer.files[0]) setPanFile(e.dataTransfer.files[0].name); }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*,.pdf";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) setPanFile(file.name);
                  };
                  input.click();
                }}
              >
                {panFile ? (
                  <div className="space-y-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={T.good} strokeWidth="1.5" strokeLinecap="round" className="mx-auto"><path d="M20 6L9 17l-5-5"/></svg>
                    <p className="text-[14px] font-medium" style={{ color: T.text }}>{panFile}</p>
                    <p className="text-[12px]" style={{ color: T.good }}>File uploaded successfully</p>
                    <button
                      className="text-[12px] underline cursor-pointer"
                      style={{ color: T.muted }}
                      onClick={(e) => { e.stopPropagation(); setPanFile(null); }}
                    >
                      Remove & re-upload
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" className="mx-auto"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <p className="text-[14px] font-medium" style={{ color: T.text }}>Drop your PAN card here</p>
                    <p className="text-[12px]" style={{ color: T.muted }}>or click to browse · JPEG, PNG, or PDF</p>
                  </div>
                )}
              </div>
              {errors.pan && <p className="text-[12px] mt-2" style={{ color: T.danger }}>{errors.pan}</p>}
            </>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            <span className="text-[12px] font-medium" style={{ color: T.faint }}>Step {step + 1} of {STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <GoldBtn onClick={goNext}>
                Continue →
              </GoldBtn>
            ) : (
              <GoldBtn onClick={handleSubmit}>
                Submit for review
              </GoldBtn>
            )}
          </div>
        </Card>

        <p className="text-[12px] text-center mt-5" style={{ color: T.faint }}>
          Your details will be reviewed by the AstroLaabh team. You&apos;ll receive an email once approved.
        </p>
      </div>
    </div>
  );
}
