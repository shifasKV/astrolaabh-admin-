"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES } from "@/lib/mock";

export default function CreateAffiliatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const scrollTo = searchParams.get("scrollTo");
  const existing = editId ? MOCK_AFFILIATES.find((a) => a.id === editId) : null;
  const isEdit = !!existing;

  const commissionRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState("");

  const [name, setName] = useState(existing?.name ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [phone, setPhone] = useState(isEdit ? "+91 98765 43210" : "");

  const [stoneRate, setStoneRate] = useState("5");
  const [jewelleryRate, setJewelleryRate] = useState("4");
  const [consultationRate, setConsultationRate] = useState("10");

  const [bankName, setBankName] = useState(isEdit ? "HDFC Bank" : "");
  const [accountNumber, setAccountNumber] = useState(isEdit ? "1234 5678 6789" : "");
  const [ifsc, setIfsc] = useState(isEdit ? "HDFC0001234" : "");
  const [upi, setUpi] = useState(isEdit ? `${existing?.name.split(" ").pop()?.toLowerCase()}@upi` : "");

  useEffect(() => {
    if (!scrollTo) return;
    const timeout = setTimeout(() => {
      const ref = scrollTo === "commission" ? commissionRef : scrollTo === "account" ? accountRef : null;
      ref?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => clearTimeout(timeout);
  }, [scrollTo]);

  const canSubmit = name.trim() && email.trim() && phone.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
    setToast(isEdit ? "Affiliate updated" : "Affiliate created — invitation sent");
    setTimeout(() => {
      router.push(isEdit ? `/affiliates/${editId}` : "/affiliates");
    }, 1500);
  };

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit Affiliate" : "Add Affiliate"}
        sub={isEdit ? `Editing ${existing?.name}` : "Create a new affiliate partner profile"}
        back={{ label: isEdit ? existing?.name ?? "Affiliate" : "Affiliates", href: isEdit ? `/affiliates/${editId}` : "/affiliates" }}
      />

      <div className="space-y-6 max-w-[820px]">
        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.accent }}>Personal information</div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={name} onChange={setName} label="Full name" placeholder="e.g. Dr. Meenakshi Joshi" />
              <Input value={email} onChange={setEmail} label="Email" type="email" placeholder="e.g. name@example.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={phone} onChange={setPhone} label="Phone number" placeholder="e.g. +91 98765 43210" />
            </div>
          </div>
        </Card>

        <div ref={commissionRef}>
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.accent }}>Commission setup</div>
            <p className="text-[12px] mb-4" style={{ color: T.muted }}>Set the commission percentage for each category. Can be updated later.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([["stone", stoneRate, setStoneRate], ["jewellery", jewelleryRate, setJewelleryRate], ["consultation", consultationRate, setConsultationRate]] as const).map(([cat, val, setter]) => (
                <div key={cat} className="rounded-[10px] p-4" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
                  <div className="text-[11px] tracking-[0.06em] uppercase mb-2" style={{ color: T.faint }}>{cat}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => setter(e.target.value)}
                      className="w-full h-9 px-3 rounded-[8px] text-[13px] outline-none"
                      style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
                    />
                    <span className="text-[13px] font-medium shrink-0" style={{ color: T.muted }}>%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div ref={accountRef}>
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.accent }}>Account details</div>
            <p className="text-[12px] mb-4" style={{ color: T.muted }}>Bank account and UPI details for commission payouts.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input value={bankName} onChange={setBankName} label="Bank name" placeholder="e.g. HDFC Bank" />
                <Input value={accountNumber} onChange={setAccountNumber} label="Account number" placeholder="e.g. 1234 5678 6789" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input value={ifsc} onChange={setIfsc} label="IFSC code" placeholder="e.g. HDFC0001234" />
                <Input value={upi} onChange={setUpi} label="UPI ID" placeholder="e.g. name@upi" />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center gap-3 pb-8">
          <GoldBtn onClick={handleSubmit} disabled={!canSubmit}>{isEdit ? "Save Changes" : "Create Affiliate"}</GoldBtn>
          <GhostBtn onClick={() => router.push(isEdit ? `/affiliates/${editId}` : "/affiliates")}>Cancel</GhostBtn>
        </div>
      </div>

      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium animate-in"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
