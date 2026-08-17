"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, GoldBtn, GhostBtn } from "@/components/ui";
import { T } from "@/lib/theme";
import { V, validate, hasErrors, type ValidationErrors } from "@/lib/validation";

const STEPS = [
  { key: "personal", label: "Personal Details" },
  { key: "bank", label: "Bank Details" },
  { key: "document", label: "Upload PAN" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

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

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const markTouched = (field: string) => setTouched((prev) => new Set(prev).add(field));
  const showError = (field: string) => (touched.has(field) || submitAttempted) ? errors[field] : undefined;

  const validateStep0 = () => validate({
    name: V.required(name),
    email: V.email(email),
    phone: V.phone(phone),
  });

  const validateStep1 = () => validate({
    holderName: V.required(holderName),
    bankName: V.required(bankName),
    accountNumber: V.required(accountNumber),
    accountMatch: V.accountMatch(accountNumber, confirmAccount),
    ifsc: V.ifsc(ifsc),
  });

  const canNext = () => {
    if (step === 0) return !hasErrors(validateStep0());
    if (step === 1) return !hasErrors(validateStep1());
    if (step === 2) return !!panFile;
    return false;
  };

  const handleContinue = () => {
    setSubmitAttempted(true);
    if (step === 0) {
      setTouched(new Set(["name", "email", "phone"]));
      const errs = validateStep0();
      setErrors(errs);
      if (hasErrors(errs)) return;
    } else if (step === 1) {
      setTouched(new Set(["holderName", "bankName", "accountNumber", "confirmAccount", "ifsc"]));
      const errs = validateStep1();
      setErrors(errs);
      if (hasErrors(errs)) return;
    }
    setSubmitAttempted(false);
    setTouched(new Set());
    setErrors({});
    setStep(step + 1);
  };

  const handleSubmit = () => {
    router.push("/aff-dashboard?status=pending");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: T.bg }}>
      <div className="w-full max-w-[560px]">
        {/* Header */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-14 h-14 object-contain mx-auto mb-4 drop-shadow-[0_4px_12px_rgba(160,125,56,0.35)]" />
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
              <h2 className="text-[16px] font-semibold mb-1" style={{ color: T.text }}>Personal Details</h2>
              <p className="text-[13px] mb-5" style={{ color: T.muted }}>Tell us a bit about yourself</p>
              <div className="space-y-4">
                <Input value={name} onChange={(v) => { markTouched("name"); setName(v); }} label="Full name" placeholder="e.g. Pt. Sandeep Kochaar" error={showError("name")} />
                <Input value={email} onChange={(v) => { markTouched("email"); setEmail(v); }} label="Email address" type="email" placeholder="you@example.com" error={showError("email")} />
                <Input value={phone} onChange={(v) => { markTouched("phone"); setPhone(v); }} label="Phone number" placeholder="+91 98100 00000" error={showError("phone")} />
                <Input value={city} onChange={setCity} label="City (optional)" placeholder="e.g. New Delhi" />
              </div>
            </>
          )}

          {/* Step 2: Bank Details */}
          {step === 1 && (
            <>
              <h2 className="text-[16px] font-semibold mb-1" style={{ color: T.text }}>Bank Details</h2>
              <p className="text-[13px] mb-5" style={{ color: T.muted }}>For commission payouts</p>
              <div className="space-y-4">
                <Input value={holderName} onChange={(v) => { markTouched("holderName"); setHolderName(v); }} label="Account holder name" placeholder="As on bank records" error={showError("holderName")} />
                <Input value={bankName} onChange={(v) => { markTouched("bankName"); setBankName(v); }} label="Bank name" placeholder="e.g. HDFC Bank" error={showError("bankName")} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input value={accountNumber} onChange={(v) => { markTouched("accountNumber"); setAccountNumber(v); }} label="Account number" placeholder="Enter account number" error={showError("accountNumber")} />
                  <Input value={confirmAccount} onChange={(v) => { markTouched("confirmAccount"); setConfirmAccount(v); }} label="Confirm account number" placeholder="Re-enter account number" error={showError("accountMatch")} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input value={ifsc} onChange={(v) => { markTouched("ifsc"); setIfsc(v); }} label="IFSC code" placeholder="e.g. HDFC0001234" error={showError("ifsc")} />
                  <Input value={upiId} onChange={setUpiId} label="UPI ID (optional)" placeholder="e.g. name@upi" />
                </div>
              </div>
            </>
          )}

          {/* Step 3: Upload PAN */}
          {step === 2 && (
            <>
              <h2 className="text-[16px] font-semibold mb-1" style={{ color: T.text }}>Upload PAN Card</h2>
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
            </>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            {step > 0 ? (
              <GhostBtn onClick={() => setStep(step - 1)}>← Back</GhostBtn>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <GoldBtn onClick={handleContinue}>
                Continue →
              </GoldBtn>
            ) : (
              <GoldBtn onClick={handleSubmit} disabled={!canNext()}>
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
