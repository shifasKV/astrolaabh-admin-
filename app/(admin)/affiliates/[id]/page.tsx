"use client";
import { use, useState } from "react";
import Link from "next/link";
import { Card, StatCard, Chip, GoldBtn, GhostBtn, Modal, Input, SectionLink } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES, MOCK_REFERRAL_EVENTS, MOCK_PAYOUTS } from "@/lib/mock";
import { inr } from "@/lib/types";

export default function AffiliateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const affiliate = MOCK_AFFILIATES.find((a) => a.id === id);

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isActive, setIsActive] = useState(affiliate?.status === "active");
  const [editForm, setEditForm] = useState({
    name: affiliate?.name ?? "",
    email: affiliate?.email ?? "",
    phone: "+91 98765 43210",
    bankName: "HDFC Bank",
    accountNumber: "****6789",
    ifsc: "HDFC0001234",
    upi: `${affiliate?.name.split(" ").pop()?.toLowerCase()}@upi`,
  });
  const [payoutForm, setPayoutForm] = useState({ amount: "", notes: "" });

  if (!affiliate) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Affiliate not found.</p>
        <Link href="/affiliates" className="text-[12.5px] mt-2 inline-block" style={{ color: T.accent }}>← Back</Link>
      </div>
    );
  }

  const referrals = MOCK_REFERRAL_EVENTS.filter((r) => r.affiliateId === affiliate.id);
  const payouts = MOCK_PAYOUTS.filter((p) => p.affiliateId === affiliate.id);
  const conversion = affiliate.totalRegistrations > 0 ? Math.round((affiliate.totalPurchases / affiliate.totalRegistrations) * 100) : 0;

  return (
    <>
      {/* Back link */}
      <div className="mb-5">
        <Link href="/affiliates" className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:opacity-80 transition-opacity duration-200" style={{ color: T.accent }}>
          ← Affiliates
        </Link>
      </div>

      {/* Profile Card */}
      <div className="rounded-[14px] p-6 mb-6" style={{ background: `linear-gradient(135deg, ${T.card} 0%, ${T.panel} 100%)`, border: `1px solid ${T.border}` }}>
        <div className="flex flex-wrap items-start gap-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-bold shrink-0"
            style={{ background: `${T.accent}15`, border: `2px solid ${T.accent}40`, color: T.accent }}
          >
            {affiliate.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-[17px] font-semibold" style={{ color: T.text }}>{affiliate.name}</span>
              <Chip tone={isActive ? "good" : "danger"}>{isActive ? "active" : "inactive"}</Chip>
            </div>
            <div className="text-[13px] mt-1" style={{ color: T.muted }}>{affiliate.code} · {affiliate.email} · {affiliate.commissionRate}% commission</div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-[12px]" style={{ color: T.faint }}>
              <span>Joined {affiliate.joinedAt}</span>
              <span>·</span>
              <span>Conversion {conversion}%</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <GhostBtn className="!text-[11.5px] !h-8 !px-3" onClick={() => setShowEditModal(true)}>
              Edit
            </GhostBtn>
            <GhostBtn className="!text-[11.5px] !h-8 !px-3" onClick={() => setIsActive((v) => !v)}>
              {isActive ? "Deactivate" : "Activate"}
            </GhostBtn>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard label="Registrations" value={affiliate.totalRegistrations} />
        <StatCard label="Purchases" value={affiliate.totalPurchases} />
        <StatCard label="Commission accrued" value={inr(affiliate.totalAccrued)} />
      </div>

      {/* Payment & Payouts — combined */}
      <Card className="mb-6">
        {/* Payment details */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] tracking-[0.08em] uppercase font-medium" style={{ color: T.faint }}>Payment details</span>
          <GoldBtn onClick={() => setShowPayoutModal(true)}>Make payout</GoldBtn>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: T.faint }}>Bank</div>
            <div className="text-[13px] mt-0.5" style={{ color: T.text }}>{editForm.bankName}</div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: T.faint }}>Account</div>
            <div className="text-[13px] mt-0.5" style={{ color: T.text }}>{editForm.accountNumber}</div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: T.faint }}>IFSC</div>
            <div className="text-[13px] mt-0.5" style={{ color: T.text }}>{editForm.ifsc}</div>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-wider" style={{ color: T.faint }}>UPI</div>
            <div className="text-[13px] mt-0.5" style={{ color: T.accent }}>{editForm.upi}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-5" style={{ borderTop: `1px solid ${T.border}` }} />

        {/* Payouts */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] tracking-[0.08em] uppercase font-medium" style={{ color: T.faint }}>Payouts</span>
          <SectionLink href={`/affiliates/${id}/payouts`} />
        </div>
        {payouts.length === 0 ? (
          <p className="text-[12.5px]" style={{ color: T.muted }}>No payouts yet.</p>
        ) : (
          payouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3 text-[12.5px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div>
                <div className="font-medium" style={{ color: T.text }}>{p.period}</div>
                <div className="mt-0.5" style={{ color: T.muted }}>{p.reference} · {p.paidAt ?? "pending"}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <Chip tone={p.status === "paid" ? "good" : "gold"}>{p.status}</Chip>
                <span className="tabular-nums font-semibold" style={{ color: T.text }}>{inr(p.amount)}</span>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Recent Referrals */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] tracking-[0.08em] uppercase font-medium" style={{ color: T.faint }}>Recent referral events</span>
          <SectionLink href={`/affiliates/${id}/referrals`} />
        </div>
        {referrals.length === 0 ? (
          <p className="text-[12.5px]" style={{ color: T.muted }}>No referral events.</p>
        ) : (
          referrals.slice(0, 5).map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between py-2.5 text-[12.5px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div>
                <span style={{ color: T.text }}>{r.eventDate}</span>
                <span className="mx-2" style={{ color: T.faint }}>·</span>
                <span style={{ color: T.muted }}>{r.eventType}</span>
                <span className="mx-2" style={{ color: T.faint }}>·</span>
                <span style={{ color: T.muted }}>{r.maskedCustomer}</span>
              </div>
              <div className="flex items-center gap-2.5">
                {r.orderValue && <span className="tabular-nums" style={{ color: T.text }}>{inr(r.orderValue)}</span>}
                {r.commissionAmount && <span className="tabular-nums" style={{ color: T.accent }}>{inr(r.commissionAmount)} comm</span>}
                {r.commissionStatus && <Chip tone={r.commissionStatus === "paid" ? "good" : r.commissionStatus === "approved" ? "gold" : "muted"}>{r.commissionStatus}</Chip>}
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Make Payout Modal */}
      <Modal open={showPayoutModal} onClose={() => setShowPayoutModal(false)} title="Initiate payout">
        <div className="space-y-5">
          <div className="p-4 rounded-[10px]" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium" style={{ color: T.text }}>{affiliate.name}</div>
                <div className="text-[11.5px] mt-0.5" style={{ color: T.muted }}>{editForm.upi}</div>
              </div>
              <div className="text-right">
                <div className="text-[10.5px] uppercase tracking-wider" style={{ color: T.faint }}>Pending</div>
                <div className="text-[16px] font-semibold" style={{ color: T.accent }}>{inr(affiliate.totalAccrued)}</div>
              </div>
            </div>
          </div>

          <Input value={payoutForm.amount} onChange={(v) => setPayoutForm((p) => ({ ...p, amount: v }))} label="Payout amount (₹)" placeholder={String(affiliate.totalAccrued)} />

          <Input value={payoutForm.notes} onChange={(v) => setPayoutForm((p) => ({ ...p, notes: v }))} label="Period / notes" placeholder="e.g. May – Jul 2026" />

          <div className="pt-2">
            <GoldBtn onClick={() => setShowPayoutModal(false)}>Proceed to payment →</GoldBtn>
          </div>

          <p className="text-[11px] text-center" style={{ color: T.faint }}>
            You will be redirected to the payment gateway to complete the transfer.
          </p>
        </div>
      </Modal>

      {/* Edit Details Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit affiliate details">
        <div className="space-y-4">
          <Input value={editForm.name} onChange={(v) => setEditForm((p) => ({ ...p, name: v }))} label="Full name" placeholder="Name" />
          <Input value={editForm.email} onChange={(v) => setEditForm((p) => ({ ...p, email: v }))} label="Email" type="email" placeholder="email@example.com" />
          <Input value={editForm.phone} onChange={(v) => setEditForm((p) => ({ ...p, phone: v }))} label="Phone number" placeholder="+91 98765 43210" />
          <div className="pt-2" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            <div className="text-[11px] uppercase tracking-wider mb-3 mt-3" style={{ color: T.faint }}>Bank details</div>
          </div>
          <Input value={editForm.bankName} onChange={(v) => setEditForm((p) => ({ ...p, bankName: v }))} label="Bank name" placeholder="HDFC Bank" />
          <Input value={editForm.accountNumber} onChange={(v) => setEditForm((p) => ({ ...p, accountNumber: v }))} label="Account number" placeholder="Account number" />
          <Input value={editForm.ifsc} onChange={(v) => setEditForm((p) => ({ ...p, ifsc: v }))} label="IFSC code" placeholder="HDFC0001234" />
          <Input value={editForm.upi} onChange={(v) => setEditForm((p) => ({ ...p, upi: v }))} label="UPI ID" placeholder="name@upi" />
          <div className="pt-2">
            <GoldBtn onClick={() => setShowEditModal(false)}>Save changes</GoldBtn>
          </div>
        </div>
      </Modal>
    </>
  );
}
