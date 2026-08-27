"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, Input, GoldBtn, GhostBtn, Modal } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES } from "@/lib/mock";
import { useApproval, type ApprovalState } from "../layout";

function ApplicationStatusContent({ state, reason }: { state: ApprovalState; reason: string }) {
  const router = useRouter();

  const applicant = {
    name: "Rajendra Pandey",
    email: "rajendra.p@wellnessindia.in",
    phone: "+91 98765 43210",
    city: "New Delhi",
    appliedAt: "15 Jun, 2026",
    bankName: "HDFC Bank",
    accountNumber: "••••6789",
    ifsc: "HDFC0001234",
    upi: "rajendra@upi",
    panFile: "PAN_Card_Rajendra.pdf",
  };

  const meta = state === "rejected"
    ? { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>, color: "#a3493f", bg: "rgba(163,73,63,0.10)", border: "rgba(163,73,63,0.35)", title: "Application rejected", desc: "Your affiliate application was not approved. Please review the feedback below." }
    : state === "revision_requested"
    ? { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>, color: "#8a6a2f", bg: "rgba(160,125,56,0.10)", border: "rgba(184,138,62,0.42)", title: "Revision requested", desc: "The AstroLaabh team has reviewed your application and needs some changes before approval." }
    : { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 2" /></svg>, color: "#8a6a2f", bg: "rgba(160,125,56,0.10)", border: "rgba(184,138,62,0.42)", title: "Application under review", desc: "Your application is being reviewed by the AstroLaabh team. This typically takes 1–2 business days." };

  return (
    <>
      {/* Status header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-[18px] flex items-center justify-center mx-auto mb-4" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
          {meta.icon}
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] mb-1.5" style={{ color: T.text }}>{meta.title}</h1>
        <p className="text-[13.5px] leading-relaxed max-w-[420px] mx-auto" style={{ color: T.muted }}>{meta.desc}</p>
      </div>

      {/* Feedback reason (for rejected / revision_requested) */}
      {(state === "rejected" || state === "revision_requested") && reason && (
        <div className="rounded-[14px] p-4 mb-6" style={{ background: state === "rejected" ? "rgba(163,73,63,0.06)" : "rgba(160,125,56,0.06)", border: `1px solid ${meta.border}`, borderLeft: `3px solid ${meta.color}` }}>
          <div className="text-[11px] font-semibold tracking-[0.08em] uppercase mb-1.5" style={{ color: meta.color }}>
            {state === "rejected" ? "Reason for rejection" : "Changes requested"}
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: T.text }}>{reason}</p>
        </div>
      )}

      {/* Submitted details */}
      <Card className="!p-0 overflow-hidden mb-6">
        <div className="p-5">
          <h2 className="text-[14px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Personal details</h2>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            {[["Full name", applicant.name], ["Email", applicant.email], ["Phone", applicant.phone], ["City", applicant.city], ["Applied on", applicant.appliedAt]].map(([k, v]) => (
              <div key={k}>
                <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-0.5" style={{ color: T.faint }}>{k}</div>
                <div className="text-[13px] font-medium" style={{ color: T.text }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          <h2 className="text-[14px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Bank details</h2>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            {[["Bank name", applicant.bankName], ["Account", applicant.accountNumber], ["IFSC", applicant.ifsc], ["UPI ID", applicant.upi]].map(([k, v]) => (
              <div key={k}>
                <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-0.5" style={{ color: T.faint }}>{k}</div>
                <div className="text-[13px] font-medium tabular-nums" style={{ color: T.text }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          <h2 className="text-[14px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Documents</h2>
          <div className="flex items-center gap-3 rounded-[10px] p-3" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
            <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, color: T.accent }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{applicant.panFile}</div>
              <div className="text-[11px]" style={{ color: T.muted }}>PAN Card</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {state === "revision_requested" && (
          <button
            onClick={() => router.push("/onboarding")}
            className="h-10 px-6 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110"
            style={{ background: T.accent, color: T.accentInk }}
          >
            Resubmit application
          </button>
        )}
        <a href="mailto:support@astrolaabh.house" className="h-10 px-5 rounded-[10px] text-[13px] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.06)]" style={{ border: `1px solid ${T.border}`, color: T.text }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M4 4h16v12H5.2L4 17.2z" /><path d="M8 9h8M8 12h5" /></svg>
          Contact support
        </a>
      </div>
    </>
  );
}

function ApprovedProfileContent() {
  const affiliate = MOCK_AFFILIATES[0];

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

export default function ProfilePage() {
  const { approval, reviewReason } = useApproval();

  if (approval !== "approved") {
    return <ApplicationStatusContent state={approval} reason={reviewReason} />;
  }

  return <ApprovedProfileContent />;
}
