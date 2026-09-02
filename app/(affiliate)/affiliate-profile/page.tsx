"use client";
import { useState } from "react";
import { PageHeader, Card, GoldBtn, GhostBtn, Input } from "@/components/ui";
import { T } from "@/lib/theme";
import * as V from "@/lib/validators";
import { useAuth } from "@/lib/store/auth";
import { MOCK_AFFILIATES } from "@/lib/mock";
import { PasswordCard } from "@/components/profile/PasswordCard";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{label}</div>
      <div className="text-[13.5px] font-medium mt-0.5 tabular-nums break-all" style={{ color: T.text }}>{value}</div>
    </div>
  );
}

function RateDisplay({ label, value, tone = "accent" }: { label: string; value: string; tone?: "accent" | "good" }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{label}</div>
      <div className="text-[18px] font-semibold tabular-nums mt-0.5" style={{ color: tone === "good" ? T.good : T.text }}>
        {value}%
      </div>
    </div>
  );
}

/**
 * Affiliate portal My profile — matches admin affiliate edit layout
 * (identity rail + commission rates view + payout account edit + password).
 */
export default function AffiliateProfilePage() {
  const { user } = useAuth();
  const affiliate = MOCK_AFFILIATES.find((a) => a.email === user?.email) ?? MOCK_AFFILIATES[0];
  const [toast, setToast] = useState("");

  const [name, setName] = useState(affiliate?.name ?? user?.name ?? "");
  const email = user?.email ?? affiliate?.email ?? "";
  const [phone, setPhone] = useState("+91 98765 00000");

  const stoneRate = String(affiliate?.commissionRate ?? 5);
  const jewelleryRate = String(Math.max(0, (affiliate?.commissionRate ?? 5) - 1));
  const consultationRate = String(Math.max(0, (affiliate?.commissionRate ?? 5) + 5));
  const stoneDiscount = "3";
  const jewelleryDiscount = "2";
  const consultationDiscount = "5";

  const [bankName, setBankName] = useState("HDFC Bank");
  const [accountNumber, setAccountNumber] = useState("1234 5678 6789");
  const [ifsc, setIfsc] = useState("HDFC0001234");
  const [upi, setUpi] = useState(`${(affiliate?.name ?? "affiliate").split(" ").pop()?.toLowerCase()}@upi`);

  const [identityEditing, setIdentityEditing] = useState(false);
  const [accountEditing, setAccountEditing] = useState(false);
  const [identityDraft, setIdentityDraft] = useState<{ name: string; phone: string } | null>(null);
  const [accountDraft, setAccountDraft] = useState<{
    bankName: string;
    accountNumber: string;
    ifsc: string;
    upi: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const startIdentityEdit = () => {
    setIdentityDraft({ name, phone });
    setErrors({});
    setIdentityEditing(true);
  };

  const saveIdentity = () => {
    if (!identityDraft) return;
    const e: Record<string, string> = {
      name: V.required(identityDraft.name, "Full name"),
      phone: V.phone(identityDraft.phone),
    };
    setErrors(e);
    if (!V.isClean(e)) return;
    setName(identityDraft.name.trim());
    setPhone(identityDraft.phone.trim());
    setIdentityEditing(false);
    setIdentityDraft(null);
    showToast("Identity updated");
  };

  const startAccountEdit = () => {
    setAccountDraft({ bankName, accountNumber, ifsc, upi });
    setErrors({});
    setAccountEditing(true);
  };

  const saveAccount = () => {
    if (!accountDraft) return;
    const e: Record<string, string> = { ifsc: V.ifsc(accountDraft.ifsc) };
    setErrors(e);
    if (!V.isClean(e)) return;
    setBankName(accountDraft.bankName.trim());
    setAccountNumber(accountDraft.accountNumber.trim());
    setIfsc(accountDraft.ifsc.trim().toUpperCase());
    setUpi(accountDraft.upi.trim());
    setAccountEditing(false);
    setAccountDraft(null);
    showToast("Payout account updated");
  };

  return (
    <>
      <PageHeader title="My profile" />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start pb-8">
        <aside className="lg:sticky lg:top-4">
          <Card className="!p-5">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Identity</div>
              {identityEditing ? (
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
              )}
            </div>

            {identityEditing && identityDraft ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[24px] font-semibold"
                    style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
                  >
                    {(identityDraft.name || name || "A")[0]}
                  </div>
                </div>
                <Input
                  value={identityDraft.name}
                  onChange={(v) => setIdentityDraft((d) => (d ? { ...d, name: v } : d))}
                  error={errors.name}
                  label="Full name"
                />
                <div>
                  <div className="text-[11px] tracking-[0.07em] uppercase mb-2" style={{ color: T.faint }}>Email</div>
                  <div
                    className="h-10 px-3 rounded-[9px] flex items-center text-[13.5px] truncate"
                    style={{ background: "rgba(89,82,54,0.04)", border: `1px solid ${T.borderSoft}`, color: T.muted }}
                  >
                    {email}
                  </div>
                </div>
                <Input
                  value={identityDraft.phone}
                  onChange={(v) => setIdentityDraft((d) => (d ? { ...d, phone: v } : d))}
                  error={errors.phone}
                  label="Mobile number"
                  type="tel"
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
                <div className="text-[15px] font-semibold mt-3 leading-tight" style={{ color: T.text }}>{name}</div>
                <div className="w-full mt-4 pt-4 space-y-3 text-left" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <DetailItem label="Email" value={email || "—"} />
                  <DetailItem label="Mobile number" value={phone || "—"} />
                  <DetailItem label="Role" value="Affiliate partner" />
                </div>
              </div>
            )}
          </Card>
        </aside>

        <div className="space-y-4">
          <Card className="!p-6">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Commission & discount</h2>
            <p className="text-[12.5px] mt-1 mb-5" style={{ color: T.muted }}>
              Rates set by AstroLaabh — contact ops to request a change.
            </p>
            <div className="space-y-5">
              <div>
                <div className="text-[11px] tracking-[0.07em] uppercase mb-3" style={{ color: T.faint }}>Your commission</div>
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
          </Card>

          <Card className="!p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Payout account</h2>
                <p className="text-[12.5px] mt-1" style={{ color: T.muted }}>Bank details used for commission payouts.</p>
              </div>
              {accountEditing ? (
                <GoldBtn className="!h-8 !px-3.5 !text-[12px] shrink-0" onClick={saveAccount}>Save</GoldBtn>
              ) : (
                <GhostBtn className="!h-8 !px-3.5 !text-[12px] shrink-0" onClick={startAccountEdit}>Edit</GhostBtn>
              )}
            </div>
            {accountEditing && accountDraft ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    value={accountDraft.bankName}
                    onChange={(v) => setAccountDraft((d) => (d ? { ...d, bankName: v } : d))}
                    label="Bank name"
                  />
                  <Input
                    value={accountDraft.accountNumber}
                    onChange={(v) => setAccountDraft((d) => (d ? { ...d, accountNumber: v } : d))}
                    label="Account number"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    value={accountDraft.ifsc}
                    onChange={(v) => setAccountDraft((d) => (d ? { ...d, ifsc: v } : d))}
                    error={errors.ifsc}
                    label="IFSC code"
                  />
                  <Input
                    value={accountDraft.upi}
                    onChange={(v) => setAccountDraft((d) => (d ? { ...d, upi: v } : d))}
                    label="UPI ID"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <DetailItem label="Bank" value={bankName} />
                <DetailItem label="Account" value={accountNumber} />
                <DetailItem label="IFSC" value={ifsc} />
                <DetailItem label="UPI" value={upi || "—"} />
              </div>
            )}
          </Card>

          <PasswordCard />
        </div>
      </div>

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
