"use client";
import { useState } from "react";
import { PageHeader, Card, StatCard, Chip, GhostBtn, Input, GoldBtn, EmptyState } from "@/components/ui";
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
        action={<GhostBtn>Download statement</GhostBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Pending" value={inr(pendingAmount)} sub="in holding period" featured />
        <StatCard label="Approved" value={inr(approvedAmount)} sub="ready for payout" />
        <StatCard label="Total paid" value={inr(affiliate.totalPaid)} />
        <StatCard label="Lifetime earned" value={inr(affiliate.totalPaid + affiliate.totalAccrued)} />
      </div>

      {/* Payout history */}
      <Card className="mb-4 !p-5">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Payout history</h2>
        {myPayouts.length === 0 ? (
          <EmptyState inline icon="inbox" title="No payouts yet" description="Your payout history will appear here once the first cycle completes." />
        ) : (
          <div>
            {myPayouts.map((p, i, arr) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold" style={{ color: T.text }}>{p.period}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>
                    {p.reference || "Not yet processed"}{p.paidAt && ` · Paid ${p.paidAt}`}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Chip tone={p.status === "paid" ? "good" : p.status === "processing" ? "gold" : "muted"}>{p.status}</Chip>
                  <span className="text-[15px] font-semibold tabular-nums w-[92px] text-right" style={{ color: T.text }}>{inr(p.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Account details */}
      <Card className="mb-4 !p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Account details</h2>
          {!editingBank && (
            <GhostBtn className="!h-8 !px-3 !text-[12px]" onClick={() => setEditingBank(true)}>Edit</GhostBtn>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
            {[
              ["Account holder", holderName],
              ["Bank name", bankName],
              ["Account number", "••••" + accountNumber.slice(-4)],
              ["IFSC code", ifsc],
              ["UPI ID", upiId || "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>{k}</div>
                <div className="text-[13px] font-medium tabular-nums" style={{ color: T.text }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Payout policy */}
      <Card className="!p-5">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Payout policy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
          {[
            ["Payout cycle", "Monthly, by the 5th"],
            ["Minimum threshold", "₹5,000"],
            ["Holding period", "14 days after delivery"],
            ["Method", "Bank transfer (NEFT/IMPS)"],
            ["Deductions", "Returns/refunds clawed back; TDS as applicable"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>{k}</div>
              <div className="text-[13px] font-medium" style={{ color: T.text }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
