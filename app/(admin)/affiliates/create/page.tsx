"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES } from "@/lib/mock";
import * as V from "@/lib/validators";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-medium tracking-[0.1em] uppercase mb-2" style={{ color: T.faint }}>
      {children}
    </label>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{label}</div>
      <div className="text-[13.5px] font-medium mt-0.5 tabular-nums break-all" style={{ color: T.text }}>{value}</div>
    </div>
  );
}

function SectionHeader({
  title,
  sub,
  editing,
  onEdit,
  onSave,
  hideActions,
}: {
  title: string;
  sub?: string;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  hideActions?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>{title}</h2>
        {sub && <p className="text-[12.5px] mt-1" style={{ color: T.muted }}>{sub}</p>}
      </div>
      {!hideActions && (
        editing ? (
          <GoldBtn className="!h-8 !px-3.5 !text-[12px] shrink-0" onClick={onSave}>Save</GoldBtn>
        ) : (
          <GhostBtn className="!h-8 !px-3.5 !text-[12px] shrink-0" onClick={onEdit}>Edit</GhostBtn>
        )
      )}
    </div>
  );
}

function RateField({
  label,
  value,
  onChange,
  tone = "accent",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tone?: "accent" | "good";
}) {
  return (
    <div
      className="rounded-[12px] p-3.5"
      style={{
        background: tone === "good" ? "rgba(76,140,74,0.06)" : T.accentFaint,
        border: `1px solid ${T.borderSoft}`,
      }}
    >
      <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>{label}</div>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 px-3 rounded-[8px] text-[13px] font-semibold tabular-nums outline-none"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
        />
        <span className="text-[13px] font-medium shrink-0" style={{ color: T.muted }}>%</span>
      </div>
    </div>
  );
}

function RateDisplay({ label, value, tone = "accent" }: { label: string; value: string; tone?: "accent" | "good" }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{label}</div>
      <div className="text-[18px] font-semibold tabular-nums mt-0.5" style={{ color: tone === "good" ? T.good : T.text }}>
        {value || "0"}%
      </div>
    </div>
  );
}

/**
 * Admin create / edit affiliate — layout matches expert My profile
 * (identity rail + separately editable commission & payout cards).
 */
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
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const [identityEditing, setIdentityEditing] = useState(!isEdit);
  const [commissionEditing, setCommissionEditing] = useState(!isEdit);
  const [accountEditing, setAccountEditing] = useState(!isEdit);

  const [identityDraft, setIdentityDraft] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [commissionDraft, setCommissionDraft] = useState<{
    stoneRate: string;
    jewelleryRate: string;
    consultationRate: string;
    stoneDiscount: string;
    jewelleryDiscount: string;
    consultationDiscount: string;
  } | null>(null);
  const [accountDraft, setAccountDraft] = useState<{
    bankName: string;
    accountNumber: string;
    ifsc: string;
    upi: string;
  } | null>(null);

  useEffect(() => {
    if (!scrollTo || !isEdit) return;
    const timeout = setTimeout(() => {
      if (scrollTo === "commission") {
        setCommissionDraft({ stoneRate, jewelleryRate, consultationRate, stoneDiscount, jewelleryDiscount, consultationDiscount });
        setCommissionEditing(true);
        commissionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (scrollTo === "account") {
        setAccountDraft({ bankName, accountNumber, ifsc, upi });
        setAccountEditing(true);
        accountRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTo, isEdit]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const startIdentityEdit = () => {
    setIdentityDraft({ name, email, phone });
    setErrors({});
    setIdentityEditing(true);
  };

  const saveIdentity = () => {
    const draft = identityDraft ?? { name, email, phone };
    const e: Record<string, string> = {
      name: V.required(draft.name, "Full name"),
      phone: V.phone(draft.phone),
      ...(isEdit ? {} : { email: V.email(draft.email) }),
    };
    setErrors(e);
    if (!V.isClean(e)) return;
    setName(draft.name.trim());
    if (!isEdit) setEmail(draft.email.trim());
    setPhone(draft.phone.trim());
    setIdentityEditing(false);
    setIdentityDraft(null);
    if (isEdit) showToast("Identity updated");
  };

  const startCommissionEdit = () => {
    setCommissionDraft({ stoneRate, jewelleryRate, consultationRate, stoneDiscount, jewelleryDiscount, consultationDiscount });
    setCommissionEditing(true);
  };

  const saveCommission = () => {
    if (!commissionDraft) return;
    setStoneRate(commissionDraft.stoneRate);
    setJewelleryRate(commissionDraft.jewelleryRate);
    setConsultationRate(commissionDraft.consultationRate);
    setStoneDiscount(commissionDraft.stoneDiscount);
    setJewelleryDiscount(commissionDraft.jewelleryDiscount);
    setConsultationDiscount(commissionDraft.consultationDiscount);
    setCommissionEditing(false);
    setCommissionDraft(null);
    if (isEdit) showToast("Commission & discount updated");
  };

  const startAccountEdit = () => {
    setAccountDraft({ bankName, accountNumber, ifsc, upi });
    setErrors({});
    setAccountEditing(true);
  };

  const saveAccount = () => {
    const draft = accountDraft ?? { bankName, accountNumber, ifsc, upi };
    const e: Record<string, string> = { ifsc: V.ifsc(draft.ifsc) };
    setErrors(e);
    if (!V.isClean(e)) return;
    setBankName(draft.bankName.trim());
    setAccountNumber(draft.accountNumber.trim());
    setIfsc(draft.ifsc.trim().toUpperCase());
    setUpi(draft.upi.trim());
    setAccountEditing(false);
    setAccountDraft(null);
    if (isEdit) showToast("Account details updated");
  };

  const handleCreate = () => {
    const e: Record<string, string> = {
      name: V.required(name, "Full name"),
      email: V.email(email),
      phone: V.phone(phone),
      ifsc: V.ifsc(ifsc),
    };
    setErrors(e);
    if (!V.isClean(e)) {
      setIdentityEditing(true);
      setAccountEditing(true);
      return;
    }
    showToast("Affiliate created — invitation sent");
    setTimeout(() => router.push("/affiliates"), 1500);
  };

  const cancelHref = isEdit ? `/affiliates/${editId}` : "/affiliates";
  const idName = identityDraft?.name ?? name;
  const idEmail = identityDraft?.email ?? email;
  const idPhone = identityDraft?.phone ?? phone;

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit Affiliate" : "Add Affiliate"}
        back={{ label: isEdit ? existing?.name ?? "Affiliate" : "Affiliates", href: cancelHref }}
      />

      <div className={`grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start ${isEdit ? "pb-8" : "pb-24"}`}>
        <aside className="lg:sticky lg:top-4">
          <Card className="!p-5">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Identity</div>
              {isEdit && (
                identityEditing ? (
                  <GoldBtn className="!h-7 !px-3 !text-[11px]" onClick={saveIdentity}>Save</GoldBtn>
                ) : (
                  <button
                    type="button"
                    onClick={startIdentityEdit}
                    aria-label="Edit identity"
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.10)]"
                    style={{ color: T.muted, border: `1px solid ${T.borderSoft}` }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                )
              )}
            </div>

            {identityEditing ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[24px] font-semibold"
                    style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
                  >
                    {(idName || "A")[0]}
                  </div>
                </div>
                <Input
                  value={idName}
                  onChange={(v) => {
                    if (isEdit) setIdentityDraft((d) => (d ? { ...d, name: v } : d));
                    else setName(v);
                  }}
                  error={errors.name}
                  label="Full name"
                  placeholder="e.g. Dr. Meenakshi Joshi"
                />
                {isEdit ? (
                  <div>
                    <div className="text-[11px] tracking-[0.07em] uppercase mb-2" style={{ color: T.faint }}>Email</div>
                    <div
                      className="h-10 px-3 rounded-[9px] flex items-center text-[13.5px] truncate"
                      style={{ background: "rgba(89,82,54,0.04)", border: `1px solid ${T.borderSoft}`, color: T.muted }}
                    >
                      {email}
                    </div>
                  </div>
                ) : (
                  <Input
                    value={email}
                    onChange={setEmail}
                    error={errors.email}
                    label="Email"
                    type="email"
                    placeholder="e.g. name@example.com"
                  />
                )}
                <Input
                  value={idPhone}
                  onChange={(v) => {
                    if (isEdit) setIdentityDraft((d) => (d ? { ...d, phone: v } : d));
                    else setPhone(v);
                  }}
                  error={errors.phone}
                  label="Mobile number"
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[24px] font-semibold"
                  style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
                >
                  {(name || "A")[0]}
                </div>
                <div className="text-[15px] font-semibold mt-3 leading-tight" style={{ color: T.text }}>{name || "—"}</div>
                <div className="w-full mt-4 pt-4 space-y-3 text-left" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <DetailItem label="Email" value={email || "—"} />
                  <DetailItem label="Mobile number" value={phone || "—"} />
                </div>
              </div>
            )}
          </Card>
        </aside>

        <div className="space-y-4">
          <Card className="!p-6 scroll-mt-24" id="commission">
            <div ref={commissionRef}>
              <SectionHeader
                title="Commission & discount"
                sub="Affiliate commission and the discount customers get with their referral code."
                editing={commissionEditing}
                onEdit={startCommissionEdit}
                onSave={saveCommission}
                hideActions={!isEdit}
              />
              {commissionEditing ? (
                <div className="space-y-5">
                  <div>
                    <FieldLabel>Affiliate commission rates</FieldLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <RateField
                        label="Stone"
                        value={commissionDraft?.stoneRate ?? stoneRate}
                        onChange={(v) => {
                          if (isEdit) setCommissionDraft((d) => (d ? { ...d, stoneRate: v } : d));
                          else setStoneRate(v);
                        }}
                      />
                      <RateField
                        label="Jewellery"
                        value={commissionDraft?.jewelleryRate ?? jewelleryRate}
                        onChange={(v) => {
                          if (isEdit) setCommissionDraft((d) => (d ? { ...d, jewelleryRate: v } : d));
                          else setJewelleryRate(v);
                        }}
                      />
                      <RateField
                        label="Consultation"
                        value={commissionDraft?.consultationRate ?? consultationRate}
                        onChange={(v) => {
                          if (isEdit) setCommissionDraft((d) => (d ? { ...d, consultationRate: v } : d));
                          else setConsultationRate(v);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Customer discount rates</FieldLabel>
                    <p className="text-[12px] -mt-1 mb-2.5" style={{ color: T.faint }}>
                      Applied when a referred customer uses this affiliate&apos;s code.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <RateField
                        label="Stone"
                        tone="good"
                        value={commissionDraft?.stoneDiscount ?? stoneDiscount}
                        onChange={(v) => {
                          if (isEdit) setCommissionDraft((d) => (d ? { ...d, stoneDiscount: v } : d));
                          else setStoneDiscount(v);
                        }}
                      />
                      <RateField
                        label="Jewellery"
                        tone="good"
                        value={commissionDraft?.jewelleryDiscount ?? jewelleryDiscount}
                        onChange={(v) => {
                          if (isEdit) setCommissionDraft((d) => (d ? { ...d, jewelleryDiscount: v } : d));
                          else setJewelleryDiscount(v);
                        }}
                      />
                      <RateField
                        label="Consultation"
                        tone="good"
                        value={commissionDraft?.consultationDiscount ?? consultationDiscount}
                        onChange={(v) => {
                          if (isEdit) setCommissionDraft((d) => (d ? { ...d, consultationDiscount: v } : d));
                          else setConsultationDiscount(v);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <div className="text-[11px] tracking-[0.07em] uppercase mb-3" style={{ color: T.faint }}>Affiliate commission</div>
                    <div className="grid grid-cols-3 gap-4">
                      <RateDisplay label="Stone" value={stoneRate} />
                      <RateDisplay label="Jewellery" value={jewelleryRate} />
                      <RateDisplay label="Consultation" value={consultationRate} />
                    </div>
                  </div>
                  <div className="pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <div className="text-[11px] tracking-[0.07em] uppercase mb-3" style={{ color: T.faint }}>Customer discount</div>
                    <div className="grid grid-cols-3 gap-4">
                      <RateDisplay label="Stone" value={stoneDiscount} tone="good" />
                      <RateDisplay label="Jewellery" value={jewelleryDiscount} tone="good" />
                      <RateDisplay label="Consultation" value={consultationDiscount} tone="good" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="!p-6 scroll-mt-24" id="account">
            <div ref={accountRef}>
              <SectionHeader
                title="Payout account"
                sub="Bank account and UPI details for commission payouts."
                editing={accountEditing}
                onEdit={startAccountEdit}
                onSave={saveAccount}
                hideActions={!isEdit}
              />
              {accountEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      value={accountDraft?.bankName ?? bankName}
                      onChange={(v) => {
                        if (isEdit) setAccountDraft((d) => (d ? { ...d, bankName: v } : d));
                        else setBankName(v);
                      }}
                      label="Bank name"
                      placeholder="e.g. HDFC Bank"
                    />
                    <Input
                      value={accountDraft?.accountNumber ?? accountNumber}
                      onChange={(v) => {
                        if (isEdit) setAccountDraft((d) => (d ? { ...d, accountNumber: v } : d));
                        else setAccountNumber(v);
                      }}
                      label="Account number"
                      placeholder="e.g. 1234 5678 6789"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      value={accountDraft?.ifsc ?? ifsc}
                      onChange={(v) => {
                        if (isEdit) setAccountDraft((d) => (d ? { ...d, ifsc: v } : d));
                        else setIfsc(v);
                      }}
                      error={errors.ifsc}
                      label="IFSC code"
                      placeholder="e.g. HDFC0001234"
                    />
                    <Input
                      value={accountDraft?.upi ?? upi}
                      onChange={(v) => {
                        if (isEdit) setAccountDraft((d) => (d ? { ...d, upi: v } : d));
                        else setUpi(v);
                      }}
                      label="UPI ID"
                      placeholder="e.g. name@upi"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <DetailItem label="Bank" value={bankName || "—"} />
                  <DetailItem label="Account" value={accountNumber || "—"} />
                  <DetailItem label="IFSC" value={ifsc || "—"} />
                  <DetailItem label="UPI" value={upi || "—"} />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {!isEdit && (
        <div
          className="sticky bottom-0 -mx-5 md:-mx-10 px-5 md:px-10 py-3.5 flex items-center justify-between gap-2.5"
          style={{ background: "rgba(248,245,238,0.9)", backdropFilter: "blur(6px)", borderTop: `1px solid ${T.borderSoft}` }}
        >
          <span className="text-[12px] hidden sm:block" style={{ color: T.faint }}>
            An invitation will be emailed so they can set up their account.
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <GhostBtn onClick={() => router.push(cancelHref)}>Cancel</GhostBtn>
            <GoldBtn onClick={handleCreate}>Create Affiliate</GoldBtn>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
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
