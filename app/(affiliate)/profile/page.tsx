"use client";
import { useState } from "react";
import { PageHeader, Card, Input, GoldBtn, GhostBtn } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES } from "@/lib/mock";

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
              <Input value={name} onChange={setName} label="Full name" />
              <Input value={email} onChange={setEmail} label="Email" type="email" />
              <Input value={phone} onChange={setPhone} label="Phone" />
            </div>
            <div className="mt-4 flex gap-2.5">
              <GoldBtn onClick={() => setEditingProfile(false)}>Save changes</GoldBtn>
              <GhostBtn onClick={() => setEditingProfile(false)}>Cancel</GhostBtn>
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
              <Input value={holderName} onChange={setHolderName} label="Bank account holder name" />
              <Input value={bankName} onChange={setBankName} label="Bank name" />
              <Input value={accountNumber} onChange={setAccountNumber} label="Bank account number" />
              <Input value={confirmAccount} onChange={setConfirmAccount} label="Confirm bank account number" />
              <Input value={ifsc} onChange={setIfsc} label="IFSC code" />
              <Input value={upiId} onChange={setUpiId} label="UPI ID" placeholder="e.g. name@upi" />
            </div>
            <div className="mt-4 flex gap-2.5">
              <GoldBtn onClick={() => setEditingPayout(false)}>Save details</GoldBtn>
              <GhostBtn onClick={() => setEditingPayout(false)}>Cancel</GhostBtn>
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
              <Input value={newPassword} onChange={setNewPassword} label="New password" type="password" />
              <Input value={confirmPassword} onChange={setConfirmPassword} label="Confirm new password" type="password" />
            </div>
            <div className="mt-4 flex gap-2.5">
              <GoldBtn onClick={() => { setEditingPassword(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>Update password</GoldBtn>
              <GhostBtn onClick={() => { setEditingPassword(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>Cancel</GhostBtn>
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
