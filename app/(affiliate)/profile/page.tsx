"use client";
import { useState } from "react";
import { PageHeader, Card, Chip, Input, GoldBtn, GhostBtn } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES } from "@/lib/mock";

export default function ProfilePage() {
  const affiliate = MOCK_AFFILIATES[0];
  const [name, setName] = useState(affiliate.name);
  const [email, setEmail] = useState(affiliate.email);
  const [phone, setPhone] = useState("+91 98100 55555");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [accountNumber, setAccountNumber] = useState("••••••4521");
  const [ifsc, setIfsc] = useState("HDFC0001234");

  return (
    <>
      <PageHeader title="Profile & compliance" sub="Your affiliate account details, payout method, and compliance status" />

      {/* Account status */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Account status</div>
          <Chip tone="good">Active</Chip>
        </div>
        <div className="space-y-2 text-[13px]">
          {[
            ["Affiliate code", affiliate.code],
            ["Commission rate", `${affiliate.commissionRate}%`],
            ["Joined", affiliate.joinedAt],
            ["KYC status", "Verified"],
            ["Payout readiness", "Ready"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <span style={{ color: T.muted }}>{k}</span>
              <span style={{ color: T.text }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Profile details */}
      <Card className="mb-4">
        <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Profile details</div>
        <div className="space-y-3">
          <Input value={name} onChange={setName} label="Full name" />
          <Input value={email} onChange={setEmail} label="Email" type="email" />
          <Input value={phone} onChange={setPhone} label="Phone" />
        </div>
        <div className="mt-4">
          <GoldBtn>Save changes</GoldBtn>
        </div>
      </Card>

      {/* Payout method */}
      <Card className="mb-4">
        <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Payout method</div>
        <div className="space-y-3">
          <Input value={bankName} onChange={setBankName} label="Bank name" />
          <Input value={accountNumber} onChange={setAccountNumber} label="Account number" />
          <Input value={ifsc} onChange={setIfsc} label="IFSC code" />
        </div>
        <div className="mt-4 flex gap-2.5">
          <GoldBtn>Update payout details</GoldBtn>
          <GhostBtn>Verify account</GhostBtn>
        </div>
        <p className="text-[11px] mt-3" style={{ color: T.faint }}>Banking details are encrypted and only visible to authorized finance team.</p>
      </Card>

      {/* Compliance */}
      <Card>
        <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Compliance documents</div>
        <div className="space-y-2.5">
          {[
            ["PAN card", "Verified", "good"],
            ["Address proof", "Verified", "good"],
            ["Agreement", "Signed", "good"],
          ].map(([doc, status, tone]) => (
            <div key={doc} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <span className="text-[13.5px]" style={{ color: T.text }}>{doc}</span>
              <Chip tone={tone as "good"}>{status}</Chip>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
