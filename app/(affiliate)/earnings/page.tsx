"use client";
import { useState } from "react";
import { PageHeader, Card, StatCard, Chip, GhostBtn, Input, GoldBtn, EmptyState, Modal } from "@/components/ui";
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
        action={<GhostBtn><span className="inline-flex items-center gap-1.5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>Download statement</span></GhostBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Pending" value={inr(pendingAmount)} sub="in holding period" featured />
        <StatCard label="Approved" value={inr(approvedAmount)} sub="ready for payout" />
        <StatCard label="Total paid" value={inr(affiliate.totalPaid)} />
        <StatCard label="Lifetime earned" value={inr(affiliate.totalPaid + affiliate.totalAccrued)} />
      </div>

      {/* Payout history */}
      <Card className="mb-4 !p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Payout history</h2>
          <span className="text-[11.5px] font-medium tabular-nums px-2 py-0.5 rounded-full" style={{ background: T.accentFaint, color: T.accent }}>{myPayouts.length} cycles</span>
        </div>
        {myPayouts.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState inline icon="inbox" title="No payouts yet" description="Your payout history will appear here once the first cycle completes." />
          </div>
        ) : (
          <div>
            <div className="hidden sm:grid grid-cols-[1fr_120px_120px] gap-4 px-5 py-2 text-[10.5px] font-medium tracking-[0.06em] uppercase" style={{ color: T.faint, borderTop: `1px solid ${T.borderSoft}`, borderBottom: `1px solid ${T.borderSoft}` }}>
              <span>Period</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>
            {myPayouts.map((p, i, arr) => (
              <div key={p.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_120px] items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors hover:bg-[rgba(119,123,98,0.03)]" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold" style={{ color: T.text }}>{p.period}</div>
                  <div className="text-[12px] mt-0.5 truncate" style={{ color: T.muted }}>
                    {p.reference || "Not yet processed"}{p.paidAt && ` · Paid ${p.paidAt}`}
                  </div>
                </div>
                <div className="sm:order-none order-last col-span-2 sm:col-span-1">
                  <Chip tone={p.status === "paid" ? "good" : p.status === "processing" ? "gold" : "muted"}>{p.status}</Chip>
                </div>
                <span className="text-[15px] font-semibold tabular-nums text-right" style={{ color: T.text }}>{inr(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Account details + Payout policy side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Account details */}
        <Card className="!p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Account details</h2>
            <GhostBtn className="!h-8 !px-3 !text-[12px]" onClick={() => setEditingBank(true)}>Edit</GhostBtn>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              {[
                ["Account holder", holderName],
                ["Bank name", bankName],
                ["Account number", "••••" + accountNumber.slice(-4)],
                ["IFSC code", ifsc],
                ["UPI ID", upiId || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>{k}</div>
                  <div className="text-[13px] font-medium tabular-nums truncate" style={{ color: T.text }}>{v}</div>
                </div>
              ))}
          </div>
        </Card>

        {/* Payout policy */}
        <Card className="!p-5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Payout policy</h2>
          <div>
            {[
              ["Payout cycle", "Monthly, by the 5th"],
              ["Minimum threshold", "₹5,000"],
              ["Holding period", "14 days after delivery"],
              ["Method", "Bank transfer (NEFT/IMPS)"],
              ["Deductions", "Returns/refunds clawed back; TDS as applicable"],
            ].map(([k, v], i) => (
              <div key={k} className="flex items-start justify-between gap-4 py-2.5 first:pt-0" style={i > 0 ? { borderTop: `1px solid ${T.borderSoft}` } : undefined}>
                <span className="text-[12.5px] shrink-0" style={{ color: T.faint }}>{k}</span>
                <span className="text-[12.5px] font-medium text-right" style={{ color: T.text }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={editingBank} onClose={() => setEditingBank(false)} title="Edit account details">
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
          <GhostBtn onClick={() => setEditingBank(false)}>Cancel</GhostBtn>
          <GoldBtn onClick={() => setEditingBank(false)}>Save details</GoldBtn>
        </div>
      </Modal>
    </>
  );
}
