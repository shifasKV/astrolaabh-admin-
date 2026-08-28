"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES } from "@/lib/mock";
import * as V from "@/lib/validators";

function Section({ title, sub, children, first }: { title: string; sub?: string; children: React.ReactNode; first?: boolean }) {
  return (
    <div className="p-6" style={first ? undefined : { borderTop: `1px solid ${T.borderSoft}` }}>
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>{title}</h2>
      {sub && <p className="text-[12.5px] mt-1" style={{ color: T.muted }}>{sub}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-medium tracking-[0.1em] uppercase mb-2" style={{ color: T.faint }}>{children}</label>;
}

function CreateAffiliatePageInner() {
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

  const [stoneDiscount, setStoneDiscount] = useState("3");
  const [jewelleryDiscount, setJewelleryDiscount] = useState("2");
  const [consultationDiscount, setConsultationDiscount] = useState("5");

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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearErr = (k: string) => setErrors((p) => (p[k] ? { ...p, [k]: "" } : p));
  const validate = () => {
    const e: Record<string, string> = {
      name: V.required(name, "Full name"),
      email: V.email(email),
      phone: V.phone(phone),
      ifsc: V.ifsc(ifsc),
    };
    setErrors(e);
    return V.isClean(e);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setToast(isEdit ? "Affiliate updated" : "Affiliate created — invitation sent");
    setTimeout(() => {
      router.push(isEdit ? `/affiliates/${editId}` : "/affiliates");
    }, 1500);
  };

  const cancelHref = isEdit ? `/affiliates/${editId}` : "/affiliates";

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit Affiliate" : "Add Affiliate"}
        back={{ label: isEdit ? existing?.name ?? "Affiliate" : "Affiliates", href: cancelHref }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start pb-24">
        {/* Live preview rail */}
        <aside className="lg:sticky lg:top-4">
          <Card className="!p-5">
            <div className="flex flex-col items-center text-center pb-4 mb-4" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[24px] font-semibold" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>{(name || "A")[0]}</div>
              <div className="text-[15px] font-semibold mt-3 leading-tight" style={{ color: T.text }}>{name || "New affiliate"}</div>
              <div className="text-[12px] mt-0.5 truncate max-w-full" style={{ color: T.muted }}>{email || "—"}</div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12.5px]">
                <span style={{ color: T.faint }}>Phone</span>
                <span className="font-medium tabular-nums" style={{ color: T.text }}>{phone || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span style={{ color: T.faint }}>Bank</span>
                <span className="font-medium" style={{ color: T.text }}>{bankName || "—"}</span>
              </div>
              <div className="pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <div className="text-[11px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>Affiliate commission</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: T.accentFaint, color: T.accent, border: `1px solid ${T.borderSoft}` }}>Stone {stoneRate || 0}%</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: T.accentFaint, color: T.accent, border: `1px solid ${T.borderSoft}` }}>Jewellery {jewelleryRate || 0}%</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: T.accentFaint, color: T.accent, border: `1px solid ${T.borderSoft}` }}>Consult {consultationRate || 0}%</span>
                </div>
              </div>
              <div className="pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <div className="text-[11px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>Customer discount</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(76,140,74,0.10)", color: T.good, border: `1px solid ${T.borderSoft}` }}>Stone {stoneDiscount || 0}%</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(76,140,74,0.10)", color: T.good, border: `1px solid ${T.borderSoft}` }}>Jewellery {jewelleryDiscount || 0}%</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(76,140,74,0.10)", color: T.good, border: `1px solid ${T.borderSoft}` }}>Consult {consultationDiscount || 0}%</span>
                </div>
              </div>
            </div>
          </Card>
        </aside>

        {/* Seamless form */}
        <Card className="!p-0 overflow-hidden">
          <Section title="Identity & contact" sub="Name and how the affiliate is reached." first>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={name} onChange={(v) => { setName(v); clearErr("name"); }} onBlur={() => setErrors((p) => ({ ...p, name: V.required(name, "Full name") }))} error={errors.name} label="Full name" placeholder="e.g. Dr. Meenakshi Joshi" />
              <Input value={email} onChange={(v) => { setEmail(v); clearErr("email"); }} onBlur={() => setErrors((p) => ({ ...p, email: V.email(email) }))} error={errors.email} label="Email" type="email" placeholder="e.g. name@example.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={phone} onChange={(v) => { setPhone(v); clearErr("phone"); }} onBlur={() => setErrors((p) => ({ ...p, phone: V.phone(phone) }))} error={errors.phone} label="Phone number" placeholder="e.g. +91 98765 43210" />
            </div>
          </Section>

          <div ref={commissionRef}>
            <Section title="Commission & discount" sub="Set the affiliate commission and the discount customers get when using their referral code.">
              <div>
                <FieldLabel>Affiliate commission rates</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([["Stone", stoneRate, setStoneRate], ["Jewellery", jewelleryRate, setJewelleryRate], ["Consultation", consultationRate, setConsultationRate]] as const).map(([cat, val, setter]) => (
                    <div key={cat} className="rounded-[12px] p-3.5" style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}` }}>
                      <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>{cat}</div>
                      <div className="flex items-center gap-1.5">
                        <input type="number" value={val} onChange={(e) => setter(e.target.value)} className="w-full h-9 px-3 rounded-[8px] text-[13px] font-semibold tabular-nums outline-none" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }} />
                        <span className="text-[13px] font-medium shrink-0" style={{ color: T.muted }}>%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Customer discount rates</FieldLabel>
                <p className="text-[12px] -mt-1 mb-2.5" style={{ color: T.faint }}>Discount applied when a referred customer uses this affiliate&apos;s code.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([["Stone", stoneDiscount, setStoneDiscount], ["Jewellery", jewelleryDiscount, setJewelleryDiscount], ["Consultation", consultationDiscount, setConsultationDiscount]] as const).map(([cat, val, setter]) => (
                    <div key={cat} className="rounded-[12px] p-3.5" style={{ background: "rgba(76,140,74,0.06)", border: `1px solid ${T.borderSoft}` }}>
                      <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>{cat}</div>
                      <div className="flex items-center gap-1.5">
                        <input type="number" value={val} onChange={(e) => setter(e.target.value)} className="w-full h-9 px-3 rounded-[8px] text-[13px] font-semibold tabular-nums outline-none" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }} />
                        <span className="text-[13px] font-medium shrink-0" style={{ color: T.muted }}>%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>

          <div ref={accountRef}>
            <Section title="Account details" sub="Bank account and UPI details for commission payouts.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input value={bankName} onChange={setBankName} label="Bank name" placeholder="e.g. HDFC Bank" />
                <Input value={accountNumber} onChange={setAccountNumber} label="Account number" placeholder="e.g. 1234 5678 6789" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input value={ifsc} onChange={(v) => { setIfsc(v); clearErr("ifsc"); }} onBlur={() => setErrors((p) => ({ ...p, ifsc: V.ifsc(ifsc) }))} error={errors.ifsc} label="IFSC code" placeholder="e.g. HDFC0001234" />
                <Input value={upi} onChange={setUpi} label="UPI ID" placeholder="e.g. name@upi" />
              </div>
            </Section>
          </div>
        </Card>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 -mx-5 md:-mx-10 px-5 md:px-10 py-3.5 flex items-center justify-between gap-2.5" style={{ background: "rgba(248,245,238,0.9)", backdropFilter: "blur(6px)", borderTop: `1px solid ${T.borderSoft}` }}>
        <span className="text-[12px] hidden sm:block" style={{ color: T.faint }}>{isEdit ? "Changes take effect immediately after saving." : "An invitation will be emailed so they can set up their account."}</span>
        <div className="flex items-center gap-2.5 ml-auto">
          <GhostBtn onClick={() => router.push(cancelHref)}>Cancel</GhostBtn>
          <GoldBtn onClick={handleSubmit}>{isEdit ? "Save Changes" : "Create Affiliate"}</GoldBtn>
        </div>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium animate-in"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}

export default function CreateAffiliatePage() {
  return (
    <Suspense fallback={null}>
      <CreateAffiliatePageInner />
    </Suspense>
  );
}
