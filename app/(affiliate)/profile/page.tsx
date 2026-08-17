"use client";
import { useState } from "react";
import { PageHeader, Card, Input, GoldBtn, GhostBtn } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES } from "@/lib/mock";
import { V, validate, hasErrors, type ValidationErrors } from "@/lib/validation";

export default function ProfilePage() {
  const affiliate = MOCK_AFFILIATES[0];

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(affiliate.name);
  const [email, setEmail] = useState(affiliate.email);
  const [phone, setPhone] = useState("+91 98100 55555");

  // Payout editing
  const [editingPayout, setEditingPayout] = useState(false);
  const [holderName, setHolderName] = useState("Pt. Sandeep Kochaar");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [accountNumber, setAccountNumber] = useState("50100123456789");
  const [confirmAccount, setConfirmAccount] = useState("50100123456789");
  const [ifsc, setIfsc] = useState("HDFC0001234");
  const [upiId, setUpiId] = useState("sandeep@upi");

  const [codeCopied, setCodeCopied] = useState(false);

  // Password
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileErrors, setProfileErrors] = useState<ValidationErrors>({});
  const [payoutErrors, setPayoutErrors] = useState<ValidationErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<ValidationErrors>({});
  const [profileTouched, setProfileTouched] = useState<Set<string>>(new Set());
  const [payoutTouched, setPayoutTouched] = useState<Set<string>>(new Set());
  const [passwordTouched, setPasswordTouched] = useState<Set<string>>(new Set());
  const [profileSubmitAttempted, setProfileSubmitAttempted] = useState(false);
  const [payoutSubmitAttempted, setPayoutSubmitAttempted] = useState(false);
  const [passwordSubmitAttempted, setPasswordSubmitAttempted] = useState(false);

  const markProfileTouched = (field: string) => setProfileTouched((prev) => new Set(prev).add(field));
  const markPayoutTouched = (field: string) => setPayoutTouched((prev) => new Set(prev).add(field));
  const markPasswordTouched = (field: string) => setPasswordTouched((prev) => new Set(prev).add(field));

  const showProfileError = (field: string) => (profileTouched.has(field) || profileSubmitAttempted) ? profileErrors[field] : undefined;
  const showPayoutError = (field: string) => (payoutTouched.has(field) || payoutSubmitAttempted) ? payoutErrors[field] : undefined;
  const showPasswordError = (field: string) => (passwordTouched.has(field) || passwordSubmitAttempted) ? passwordErrors[field] : undefined;

  const handleSaveProfile = () => {
    setProfileSubmitAttempted(true);
    setProfileTouched(new Set(["name", "email", "phone"]));
    const errs = validate({
      name: V.required(name),
      email: V.email(email),
      phone: V.phone(phone),
    });
    setProfileErrors(errs);
    if (hasErrors(errs)) return;
    setProfileSubmitAttempted(false);
    setEditingProfile(false);
  };

  const handleSavePayout = () => {
    setPayoutSubmitAttempted(true);
    setPayoutTouched(new Set(["holderName", "bankName", "accountNumber", "confirmAccount", "ifsc"]));
    const errs = validate({
      holderName: V.required(holderName),
      bankName: V.required(bankName),
      accountMatch: V.accountMatch(accountNumber, confirmAccount),
      ifsc: V.ifsc(ifsc),
    });
    setPayoutErrors(errs);
    if (hasErrors(errs)) return;
    setPayoutSubmitAttempted(false);
    setEditingPayout(false);
  };

  const handleSavePassword = () => {
    setPasswordSubmitAttempted(true);
    setPasswordTouched(new Set(["newPassword", "confirmPassword"]));
    const errs = validate({
      newPassword: V.password(newPassword),
      confirmPassword: V.passwordMatch(newPassword, confirmPassword),
    });
    setPasswordErrors(errs);
    if (hasErrors(errs)) return;
    setPasswordSubmitAttempted(false);
    setEditingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <>
      <PageHeader title="My Profile" sub="Manage your account, payout details, and security" />

      {/* Profile details */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Profile details</div>
          {!editingProfile && (
            <GhostBtn className="!h-8 !px-3 !text-[11px]" onClick={() => setEditingProfile(true)}>Edit</GhostBtn>
          )}
        </div>

        {editingProfile ? (
          <>
            <div className="space-y-3 max-w-[500px]">
              <Input value={name} onChange={(v) => { markProfileTouched("name"); setName(v); }} label="Full name" error={showProfileError("name")} />
              <Input value={email} onChange={(v) => { markProfileTouched("email"); setEmail(v); }} label="Email" type="email" error={showProfileError("email")} />
              <Input value={phone} onChange={(v) => { markProfileTouched("phone"); setPhone(v); }} label="Phone" error={showProfileError("phone")} />
            </div>
            <div className="mt-4 flex gap-2.5">
              <GoldBtn onClick={handleSaveProfile}>Save changes</GoldBtn>
              <GhostBtn onClick={() => { setEditingProfile(false); setProfileSubmitAttempted(false); }}>Cancel</GhostBtn>
            </div>
          </>
        ) : (
          <div className="space-y-2.5 text-[13px]">
            {[
              ["Full name", name],
              ["Email", email],
              ["Phone", phone],
              ["Joined", affiliate.joinedAt],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span style={{ color: T.muted }}>{k}</span>
                <span className="font-medium" style={{ color: T.text }}>{v}</span>
              </div>
            ))}
            <div className="flex justify-between gap-2">
              <span style={{ color: T.muted }}>Affiliate code</span>
              <button
                className="font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors hover:opacity-80"
                style={{ color: T.text }}
                onClick={() => { navigator.clipboard.writeText(affiliate.code); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
              >
                {affiliate.code}
                {codeCopied ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.good} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                )}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Payout method */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Payment details</div>
          {!editingPayout && (
            <GhostBtn className="!h-8 !px-3 !text-[11px]" onClick={() => setEditingPayout(true)}>Edit</GhostBtn>
          )}
        </div>

        {editingPayout ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input value={holderName} onChange={(v) => { markPayoutTouched("holderName"); setHolderName(v); }} label="Bank account holder name" error={showPayoutError("holderName")} />
              <Input value={bankName} onChange={(v) => { markPayoutTouched("bankName"); setBankName(v); }} label="Bank name" error={showPayoutError("bankName")} />
              <Input value={accountNumber} onChange={(v) => { markPayoutTouched("accountNumber"); setAccountNumber(v); }} label="Bank account number" />
              <Input value={confirmAccount} onChange={(v) => { markPayoutTouched("confirmAccount"); setConfirmAccount(v); }} label="Confirm bank account number" error={showPayoutError("accountMatch")} />
              <Input value={ifsc} onChange={(v) => { markPayoutTouched("ifsc"); setIfsc(v); }} label="IFSC code" error={showPayoutError("ifsc")} />
              <Input value={upiId} onChange={setUpiId} label="UPI ID" placeholder="e.g. name@upi" />
            </div>
            <div className="mt-4 flex gap-2.5">
              <GoldBtn onClick={handleSavePayout}>Save details</GoldBtn>
              <GhostBtn onClick={() => { setEditingPayout(false); setPayoutSubmitAttempted(false); }}>Cancel</GhostBtn>
            </div>
            <p className="text-[11px] mt-3" style={{ color: T.faint }}>Banking details are encrypted and only visible to authorized finance team.</p>
          </>
        ) : (
          <div className="space-y-2.5 text-[13px]">
            {[
              ["Account holder", holderName],
              ["Bank name", bankName],
              ["Account number", "••••" + accountNumber.slice(-4)],
              ["IFSC code", ifsc],
              ["UPI ID", upiId || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span style={{ color: T.muted }}>{k}</span>
                <span className="font-medium" style={{ color: T.text }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Change password */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Security</div>
          {!editingPassword && (
            <GhostBtn className="!h-8 !px-3 !text-[11px]" onClick={() => setEditingPassword(true)}>Change password</GhostBtn>
          )}
        </div>

        {editingPassword ? (
          <>
            <div className="space-y-3 max-w-[400px]">
              <Input value={currentPassword} onChange={setCurrentPassword} label="Current password" type="password" />
              <Input value={newPassword} onChange={(v) => { markPasswordTouched("newPassword"); setNewPassword(v); }} label="New password" type="password" error={showPasswordError("newPassword")} />
              <Input value={confirmPassword} onChange={(v) => { markPasswordTouched("confirmPassword"); setConfirmPassword(v); }} label="Confirm new password" type="password" error={showPasswordError("confirmPassword")} />
            </div>
            <div className="mt-4 flex gap-2.5">
              <GoldBtn onClick={handleSavePassword}>Update password</GoldBtn>
              <GhostBtn onClick={() => { setEditingPassword(false); setPasswordSubmitAttempted(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>Cancel</GhostBtn>
            </div>
          </>
        ) : (
          <div className="text-[13px]" style={{ color: T.muted }}>
            Password last changed: 30 days ago
          </div>
        )}
      </Card>

    </>
  );
}
