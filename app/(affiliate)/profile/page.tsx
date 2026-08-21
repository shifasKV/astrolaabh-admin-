"use client";
import { useState } from "react";
import { PageHeader, Card, Input, GoldBtn, GhostBtn, Modal } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES } from "@/lib/mock";

export default function ProfilePage() {
  const affiliate = MOCK_AFFILIATES[0];

  // Profile — saved values + modal draft; Save enabled only when dirty.
  const [profile, setProfile] = useState({ name: affiliate.name, email: affiliate.email, phone: "+91 98100 55555" });
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const profileDirty = name !== profile.name || email !== profile.email || phone !== profile.phone;
  const openProfileEdit = () => { setName(profile.name); setEmail(profile.email); setPhone(profile.phone); setEditingProfile(true); };
  const saveProfile = () => { setProfile({ name, email, phone }); setEditingProfile(false); };

  // Payout — same pattern.
  const [payout, setPayout] = useState({ holderName: "Pt. Sandeep Kochaar", bankName: "HDFC Bank", accountNumber: "50100123456789", confirmAccount: "50100123456789", ifsc: "HDFC0001234", upiId: "sandeep@upi" });
  const [editingPayout, setEditingPayout] = useState(false);
  const [holderName, setHolderName] = useState(payout.holderName);
  const [bankName, setBankName] = useState(payout.bankName);
  const [accountNumber, setAccountNumber] = useState(payout.accountNumber);
  const [confirmAccount, setConfirmAccount] = useState(payout.confirmAccount);
  const [ifsc, setIfsc] = useState(payout.ifsc);
  const [upiId, setUpiId] = useState(payout.upiId);
  const payoutDirty = holderName !== payout.holderName || bankName !== payout.bankName || accountNumber !== payout.accountNumber || confirmAccount !== payout.confirmAccount || ifsc !== payout.ifsc || upiId !== payout.upiId;
  const openPayoutEdit = () => { setHolderName(payout.holderName); setBankName(payout.bankName); setAccountNumber(payout.accountNumber); setConfirmAccount(payout.confirmAccount); setIfsc(payout.ifsc); setUpiId(payout.upiId); setEditingPayout(true); };
  const savePayout = () => { setPayout({ holderName, bankName, accountNumber, confirmAccount, ifsc, upiId }); setEditingPayout(false); };

  const [codeCopied, setCodeCopied] = useState(false);

  // Password — Update enabled only when all fields filled and confirmation matches.
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordReady = !!currentPassword && !!newPassword && newPassword === confirmPassword;
  const closePassword = () => { setEditingPassword(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); };

  return (
    <>
      <PageHeader title="My Profile" />

      {/* Profile details */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Profile details</div>
          <GhostBtn className="!h-8 !px-3 !text-[11px]" onClick={openProfileEdit}>Edit</GhostBtn>
        </div>
        <div className="space-y-2.5 text-[13px]">
          {[
            ["Full name", profile.name],
            ["Email", profile.email],
            ["Phone", profile.phone],
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
      </Card>

      {/* Payout method */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Payment details</div>
          <GhostBtn className="!h-8 !px-3 !text-[11px]" onClick={openPayoutEdit}>Edit</GhostBtn>
        </div>
        <div className="space-y-2.5 text-[13px]">
          {[
            ["Account holder", payout.holderName],
            ["Bank name", payout.bankName],
            ["Account number", "••••" + payout.accountNumber.slice(-4)],
            ["IFSC code", payout.ifsc],
            ["UPI ID", payout.upiId || "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <span style={{ color: T.muted }}>{k}</span>
              <span className="font-medium" style={{ color: T.text }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Change password */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Security</div>
          <GhostBtn className="!h-8 !px-3 !text-[11px]" onClick={() => setEditingPassword(true)}>Change password</GhostBtn>
        </div>
        <div className="text-[13px]" style={{ color: T.muted }}>
          Password last changed: 30 days ago
        </div>
      </Card>

      {/* Edit profile modal */}
      <Modal open={editingProfile} onClose={() => setEditingProfile(false)} title="Edit profile details">
        <div className="space-y-3">
          <Input value={name} onChange={setName} label="Full name" />
          <Input value={email} onChange={setEmail} label="Email" type="email" />
          <Input value={phone} onChange={setPhone} label="Phone" />
        </div>
        <div className="flex justify-end gap-2.5 mt-5">
          <GhostBtn onClick={() => setEditingProfile(false)}>Cancel</GhostBtn>
          <GoldBtn onClick={saveProfile} disabled={!profileDirty}>Save changes</GoldBtn>
        </div>
      </Modal>

      {/* Edit payment details modal */}
      <Modal open={editingPayout} onClose={() => setEditingPayout(false)} title="Edit payment details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input value={holderName} onChange={setHolderName} label="Bank account holder name" />
          <Input value={bankName} onChange={setBankName} label="Bank name" />
          <Input value={accountNumber} onChange={setAccountNumber} label="Bank account number" />
          <Input value={confirmAccount} onChange={setConfirmAccount} label="Confirm bank account number" />
          <Input value={ifsc} onChange={setIfsc} label="IFSC code" />
          <Input value={upiId} onChange={setUpiId} label="UPI ID" placeholder="e.g. name@upi" />
        </div>
        <p className="text-[11px] mt-3" style={{ color: T.faint }}>Banking details are encrypted and only visible to authorized finance team.</p>
        <div className="flex justify-end gap-2.5 mt-5">
          <GhostBtn onClick={() => setEditingPayout(false)}>Cancel</GhostBtn>
          <GoldBtn onClick={savePayout} disabled={!payoutDirty}>Save details</GoldBtn>
        </div>
      </Modal>

      {/* Change password modal */}
      <Modal open={editingPassword} onClose={closePassword} title="Change password">
        <div className="space-y-3">
          <Input value={currentPassword} onChange={setCurrentPassword} label="Current password" type="password" />
          <Input value={newPassword} onChange={setNewPassword} label="New password" type="password" />
          <Input value={confirmPassword} onChange={setConfirmPassword} label="Confirm new password" type="password" error={confirmPassword && newPassword !== confirmPassword ? "Passwords don't match" : undefined} />
        </div>
        <div className="flex justify-end gap-2.5 mt-5">
          <GhostBtn onClick={closePassword}>Cancel</GhostBtn>
          <GoldBtn onClick={closePassword} disabled={!passwordReady}>Update password</GoldBtn>
        </div>
      </Modal>
    </>
  );
}
