"use client";
import { useState } from "react";
import { PageHeader, Card, StatCard, Chip, GhostBtn, Input, GoldBtn } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES, MOCK_PAYOUTS, MOCK_REFERRAL_EVENTS } from "@/lib/mock";
import { inr } from "@/lib/types";

export default function EarningsPage() {
  const affiliate = MOCK_AFFILIATES[0];
  const myPayouts = MOCK_PAYOUTS.filter((p) => p.affiliateId === affiliate.id);
  const myReferrals = MOCK_REFERRAL_EVENTS.filter((r) => r.affiliateId === affiliate.id);

  const pendingAmount = myReferrals.filter((r) => r.commissionStatus === "pending").reduce((s, r) => s + (r.commissionAmount || 0), 0);
  const approvedAmount = myReferrals.filter((r) => r.commissionStatus === "approved").reduce((s, r) => s + (r.commissionAmount || 0), 0);

  const [editingBank, setEditingBank] = useState(false);
  const [holderName, setHolderName] = useState("Pt. Sandeep Kochaar");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [accountNumber, setAccountNumber] = useState("50100123456789");
  const [confirmAccount, setConfirmAccount] = useState("50100123456789");
  const [ifsc, setIfsc] = useState("HDFC0001234");
  const [upiId, setUpiId] = useState("sandeep@upi");

  return (
    <>
      <PageHeader
        title="Earnings & payouts"
        sub="Commission statements and payment history"
        action={<GhostBtn>Download statement</GhostBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Pending" value={inr(pendingAmount)} sub="in holding period" />
        <StatCard label="Approved" value={inr(approvedAmount)} sub="ready for payout" />
        <StatCard label="Total paid" value={inr(affiliate.totalPaid)} />
        <StatCard label="Lifetime earned" value={inr(affiliate.totalPaid + affiliate.totalAccrued)} />
      </div>

      {/* Payout history */}
      <Card className="mb-4">
        <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Payout history</div>
        {myPayouts.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <div>
              <div className="text-[14px] font-medium" style={{ color: T.text }}>{p.period}</div>
              <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>
                {p.reference || "—"} {p.paidAt && `· Paid ${p.paidAt}`}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Chip tone={p.status === "paid" ? "good" : p.status === "processing" ? "gold" : "muted"}>{p.status}</Chip>
              <span className="text-[14px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(p.amount)}</span>
            </div>
          </div>
        ))}
      </Card>

      {/* Account details */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Account details</div>
          {!editingBank && (
            <GhostBtn className="!h-8 !px-3 !text-[11px]" onClick={() => setEditingBank(true)}>Edit</GhostBtn>
          )}
        </div>

        {editingBank ? (
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
              <GoldBtn onClick={() => setEditingBank(false)}>Save details</GoldBtn>
              <GhostBtn onClick={() => setEditingBank(false)}>Cancel</GhostBtn>
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

      {/* Payout policy */}
      <Card>
        <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Payout policy</div>
        <div className="space-y-2 text-[13px]">
          {[
            ["Payout cycle", "Monthly, by the 5th"],
            ["Minimum threshold", "₹5,000"],
            ["Holding period", "14 days after delivery"],
            ["Method", "Bank transfer (NEFT/IMPS)"],
            ["Deductions", "Returns/refunds clawed back; TDS as applicable"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <span style={{ color: T.muted }}>{k}</span>
              <span style={{ color: T.text }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
