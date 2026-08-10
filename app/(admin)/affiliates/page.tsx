"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, StatCard, Chip, GoldBtn, Modal, Input, SearchFilter } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES } from "@/lib/mock";
import { inr } from "@/lib/types";

export default function AffiliatesPage() {
  const [showModal, setShowModal] = useState(false);
  const [newAffiliate, setNewAffiliate] = useState({ name: "", email: "", phone: "" });
  const [search, setSearch] = useState("");

  const totalAccrued = MOCK_AFFILIATES.reduce((s, a) => s + a.totalAccrued, 0);
  const totalRegs = MOCK_AFFILIATES.reduce((s, a) => s + a.totalRegistrations, 0);
  const totalPurchases = MOCK_AFFILIATES.reduce((s, a) => s + a.totalPurchases, 0);

  const filtered = MOCK_AFFILIATES.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  return (
    <>
      <PageHeader
        title="Affiliate operations"
        sub="Manage affiliates, attribution, commissions, and payouts"
        action={<GoldBtn onClick={() => setShowModal(true)}>+ New Affiliate</GoldBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active affiliates" value={MOCK_AFFILIATES.filter((a) => a.status === "active").length} />
        <StatCard label="Referred registrations" value={totalRegs} />
        <StatCard label="Referred purchases" value={totalPurchases} />
        <StatCard label="Commission accrued" value={inr(totalAccrued)} />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search name, code, email…" />
      </div>

      <div className="grid gap-4">
        {filtered.map((a) => (
          <Link key={a.id} href={`/affiliates/${a.id}`}>
            <Card className="card-interactive cursor-pointer">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <span
                    className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-semibold shrink-0"
                    style={{ background: `${T.accent}18`, border: `1.5px solid ${T.accent}40`, color: T.accent }}
                  >
                    {a.name[0]}
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: T.text }}>{a.name}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: T.accent }}>{a.code}</div>
                    <div className="text-[11.5px] mt-1" style={{ color: T.faint }}>{a.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Chip tone={a.status === "active" ? "good" : a.status === "under_review" ? "gold" : "danger"}>
                    {a.status.replace(/_/g, " ")}
                  </Chip>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <div>
                  <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Registrations</div>
                  <div className="text-[15px] font-semibold mt-0.5" style={{ color: T.text }}>{a.totalRegistrations}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Purchases</div>
                  <div className="text-[15px] font-semibold mt-0.5" style={{ color: T.text }}>{a.totalPurchases}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Commission rate</div>
                  <div className="text-[15px] font-semibold mt-0.5" style={{ color: T.accent }}>{a.commissionRate}%</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Accrued</div>
                  <div className="text-[15px] font-semibold mt-0.5" style={{ color: T.text }}>{inr(a.totalAccrued)}</div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-[13px] text-center py-8" style={{ color: T.muted }}>No affiliates found.</p>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Affiliate">
        <div className="space-y-4">
          <Input value={newAffiliate.name} onChange={(v) => setNewAffiliate((p) => ({ ...p, name: v }))} label="Full name" placeholder="Name Surname" />
          <Input value={newAffiliate.email} onChange={(v) => setNewAffiliate((p) => ({ ...p, email: v }))} label="Email" type="email" placeholder="email@example.com" />
          <Input value={newAffiliate.phone} onChange={(v) => setNewAffiliate((p) => ({ ...p, phone: v }))} label="Phone number" placeholder="+91 98765 43210" />
          <div className="pt-2">
            <GoldBtn onClick={() => setShowModal(false)}>Create affiliate</GoldBtn>
          </div>
        </div>
      </Modal>
    </>
  );
}
