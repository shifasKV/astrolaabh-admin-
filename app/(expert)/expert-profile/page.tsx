"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, GoldBtn, GhostBtn, Input, Select, Textarea } from "@/components/ui";
import { T } from "@/lib/theme";
import * as V from "@/lib/validators";
import { EXPERT_PROFILES } from "@/lib/mock";
import { useAuth } from "@/lib/store/auth";

const EXPERT_ID = "usr_expert_01";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-medium tracking-[0.1em] uppercase mb-2" style={{ color: T.faint }}>
      {children}
    </label>
  );
}

function ChipToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12.5px] font-medium transition-all duration-150 cursor-pointer"
      style={
        active
          ? { background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }
          : { background: "transparent", border: `1px solid ${T.borderSoft}`, color: T.muted }
      }
    >
      {active && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {label}
    </button>
  );
}

function SectionHeader({
  title,
  sub,
  editing,
  onEdit,
  onSave,
  saveDisabled,
}: {
  title: string;
  sub?: string;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>{title}</h2>
        {sub && <p className="text-[12.5px] mt-1" style={{ color: T.muted }}>{sub}</p>}
      </div>
      {editing ? (
        <GoldBtn className="!h-8 !px-3.5 !text-[12px] shrink-0" onClick={onSave} disabled={saveDisabled}>
          Save
        </GoldBtn>
      ) : (
        <GhostBtn className="!h-8 !px-3.5 !text-[12px] shrink-0" onClick={onEdit}>
          Edit
        </GhostBtn>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{label}</div>
      <div className="text-[13.5px] font-medium mt-0.5" style={{ color: T.text }}>{value}</div>
    </div>
  );
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const LANGUAGE_OPTIONS = [
  { value: "Hindi", label: "Hindi" },
  { value: "English", label: "English" },
  { value: "Marathi", label: "Marathi" },
  { value: "Tamil", label: "Tamil" },
  { value: "Telugu", label: "Telugu" },
  { value: "Kannada", label: "Kannada" },
  { value: "Bengali", label: "Bengali" },
  { value: "Gujarati", label: "Gujarati" },
  { value: "Sanskrit", label: "Sanskrit" },
  { value: "Punjabi", label: "Punjabi" },
];

const SKILL_OPTIONS = [
  { value: "vedic_astrology", label: "Vedic Astrology" },
  { value: "nadi_astrology", label: "Nadi Astrology" },
  { value: "kp_astrology", label: "KP Astrology" },
  { value: "gemstone_therapy", label: "Gemstone Therapy" },
  { value: "remedial_solutions", label: "Remedial Solutions" },
  { value: "prashna_kundli", label: "Prashna Kundli" },
  { value: "numerology", label: "Numerology" },
  { value: "palmistry", label: "Palmistry" },
  { value: "vastu_shastra", label: "Vastu Shastra" },
  { value: "face_reading", label: "Face Reading" },
];

const EXPERIENCE_OPTIONS = [
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5-10", label: "5–10 years" },
  { value: "10-15", label: "10–15 years" },
  { value: "15-20", label: "15–20 years" },
  { value: "20-25", label: "20–25 years" },
  { value: "25+", label: "25+ years" },
];

function skillKeysFromSpecialization(spec: string): string[] {
  const map: Record<string, string> = {
    "Vedic Astrology": "vedic_astrology",
    "Gemstone Therapy": "gemstone_therapy",
    "Nadi Astrology": "nadi_astrology",
    "Remedial Solutions": "remedial_solutions",
    "KP Astrology": "kp_astrology",
    "Prashna Kundli": "prashna_kundli",
  };
  return Object.entries(map)
    .filter(([label]) => spec.includes(label))
    .map(([, key]) => key);
}

function experienceToKey(exp: string): string {
  const num = parseInt(exp);
  if (isNaN(num)) return "";
  if (num <= 3) return "1-3";
  if (num <= 5) return "3-5";
  if (num <= 10) return "5-10";
  if (num <= 15) return "10-15";
  if (num <= 20) return "15-20";
  if (num <= 25) return "20-25";
  return "25+";
}

type IdentityDraft = {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  photoPreview: string;
};

type ExpertiseDraft = {
  languages: string[];
  skills: string[];
  experience: string;
  bio: string;
};

type PayoutDraft = {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upi: string;
};

/**
 * Expert self-service profile — identity rail + separately editable expertise & payout.
 * Session rate is admin-only (read-only here).
 */
export default function ExpertProfilePage() {
  const { user } = useAuth();
  const expert = EXPERT_PROFILES.find((e) => e.id === EXPERT_ID);
  const [toast, setToast] = useState("");

  const [name, setName] = useState(expert?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? (expert ? `${expert.name.split(" ").pop()?.toLowerCase()}@astrolaabh.house` : ""));
  const [phone, setPhone] = useState(expert?.phone ?? "");
  const [age, setAge] = useState("52");
  const [gender, setGender] = useState("male");
  const [photoPreview, setPhotoPreview] = useState("");

  const [languages, setLanguages] = useState<string[]>(expert?.languages ?? []);
  const [skills, setSkills] = useState<string[]>(expert ? skillKeysFromSpecialization(expert.specialization) : []);
  const fee = expert ? String(expert.fee) : "";
  const [experience, setExperience] = useState(expert ? experienceToKey(expert.experience) : "");
  const [bio, setBio] = useState("Vedic astrologer specializing in gemstone remedies for career and planetary afflictions.");

  const [bankName, setBankName] = useState("HDFC Bank");
  const [accountNumber, setAccountNumber] = useState("1234 5678 6789");
  const [ifsc, setIfsc] = useState("HDFC0001234");
  const [upi, setUpi] = useState(`${expert?.name.split(" ").pop()?.toLowerCase() ?? "expert"}@upi`);

  const [identityEditing, setIdentityEditing] = useState(false);
  const [expertiseEditing, setExpertiseEditing] = useState(false);
  const [payoutEditing, setPayoutEditing] = useState(false);

  const [identityDraft, setIdentityDraft] = useState<IdentityDraft | null>(null);
  const [expertiseDraft, setExpertiseDraft] = useState<ExpertiseDraft | null>(null);
  const [payoutDraft, setPayoutDraft] = useState<PayoutDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#payout") {
      setPayoutDraft({ bankName, accountNumber, ifsc, upi });
      setPayoutEditing(true);
      requestAnimationFrame(() => {
        document.getElementById("payout")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open edit once on hash land
  }, []);

  if (!expert) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[14px]" style={{ color: T.muted }}>Profile not found.</p>
      </div>
    );
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handlePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setIdentityDraft((d) => (d ? { ...d, photoPreview: preview } : d));
    };
    reader.readAsDataURL(file);
  };

  const startIdentityEdit = () => {
    setIdentityDraft({ name, email, phone, age, gender, photoPreview });
    setErrors({});
    setIdentityEditing(true);
  };

  const saveIdentity = () => {
    if (!identityDraft) return;
    const e: Record<string, string> = {
      name: V.required(identityDraft.name, "Full name"),
      email: V.email(identityDraft.email),
      phone: V.phone(identityDraft.phone),
      age: V.optionalNumber(identityDraft.age, "Age"),
    };
    setErrors(e);
    if (!V.isClean(e)) return;
    setName(identityDraft.name.trim());
    setEmail(identityDraft.email.trim());
    setPhone(identityDraft.phone.trim());
    setAge(identityDraft.age.trim());
    setGender(identityDraft.gender);
    setPhotoPreview(identityDraft.photoPreview);
    setIdentityEditing(false);
    setIdentityDraft(null);
    showToast("Identity updated");
  };

  const startExpertiseEdit = () => {
    setExpertiseDraft({ languages: [...languages], skills: [...skills], experience, bio });
    setExpertiseEditing(true);
  };

  const saveExpertise = () => {
    if (!expertiseDraft) return;
    setLanguages(expertiseDraft.languages);
    setSkills(expertiseDraft.skills);
    setExperience(expertiseDraft.experience);
    setBio(expertiseDraft.bio.trim());
    setExpertiseEditing(false);
    setExpertiseDraft(null);
    showToast("Expertise updated");
  };

  const startPayoutEdit = () => {
    setPayoutDraft({ bankName, accountNumber, ifsc, upi });
    setErrors({});
    setPayoutEditing(true);
  };

  const savePayout = () => {
    if (!payoutDraft) return;
    const e: Record<string, string> = { ifsc: V.ifsc(payoutDraft.ifsc) };
    setErrors(e);
    if (!V.isClean(e)) return;
    setBankName(payoutDraft.bankName.trim());
    setAccountNumber(payoutDraft.accountNumber.trim());
    setIfsc(payoutDraft.ifsc.trim().toUpperCase());
    setUpi(payoutDraft.upi.trim());
    setPayoutEditing(false);
    setPayoutDraft(null);
    showToast("Payout account updated");
  };

  const toggleMulti = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const genderLabel = GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? "—";
  const experienceLabel = EXPERIENCE_OPTIONS.find((o) => o.value === experience)?.label ?? "—";
  const feeDisplay = fee ? `₹${Number(fee).toLocaleString("en-IN")}` : "—";

  return (
    <>
      <PageHeader title="My profile" />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start pb-8">
        {/* Identity rail */}
        <aside className="lg:sticky lg:top-4">
          <Card className="!p-5">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>
                Identity
              </div>
              {identityEditing ? (
                <GoldBtn className="!h-7 !px-3 !text-[11px]" onClick={saveIdentity}>
                  Save
                </GoldBtn>
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
                  <div className="relative">
                    {identityDraft.photoPreview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={identityDraft.photoPreview}
                          alt="Preview"
                          className="w-[72px] h-[72px] rounded-[20px] object-cover"
                          style={{ border: `1px solid ${T.accentBorder}` }}
                        />
                        <button
                          type="button"
                          onClick={() => setIdentityDraft((d) => (d ? { ...d, photoPreview: "" } : d))}
                          aria-label="Remove photo"
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer"
                          style={{ background: T.danger, color: "#fff" }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-2.5 h-2.5">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div
                        className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[24px] font-semibold"
                        style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
                      >
                        {(identityDraft.name || expert.name)[0]}
                      </div>
                    )}
                  </div>
                  <input
                    id="expert-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhoto(f);
                    }}
                  />
                  <label
                    htmlFor="expert-photo-upload"
                    className="inline-flex items-center gap-1.5 h-8 px-3 mt-3 rounded-[9px] text-[12px] font-medium cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.1)]"
                    style={{ color: T.text, border: `1px solid ${T.border}` }}
                  >
                    {identityDraft.photoPreview ? "Change photo" : "Upload photo"}
                  </label>
                </div>
                <Input
                  value={identityDraft.name}
                  onChange={(v) => setIdentityDraft((d) => (d ? { ...d, name: v } : d))}
                  error={errors.name}
                  label="Full name"
                />
                <Input
                  value={identityDraft.email}
                  onChange={(v) => setIdentityDraft((d) => (d ? { ...d, email: v } : d))}
                  error={errors.email}
                  label="Email"
                  type="email"
                />
                <Input
                  value={identityDraft.phone}
                  onChange={(v) => setIdentityDraft((d) => (d ? { ...d, phone: v } : d))}
                  error={errors.phone}
                  label="Mobile number"
                  type="tel"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={identityDraft.age}
                    onChange={(v) => setIdentityDraft((d) => (d ? { ...d, age: v } : d))}
                    error={errors.age}
                    label="Age"
                    type="number"
                  />
                  <Select
                    value={identityDraft.gender}
                    onChange={(v) => setIdentityDraft((d) => (d ? { ...d, gender: v } : d))}
                    label="Gender"
                    options={GENDER_OPTIONS}
                    placeholder="Select"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt={name}
                    className="w-[72px] h-[72px] rounded-[20px] object-cover"
                    style={{ border: `1px solid ${T.accentBorder}` }}
                  />
                ) : (
                  <div
                    className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[24px] font-semibold"
                    style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
                  >
                    {(name || expert.name)[0]}
                  </div>
                )}
                <div className="text-[15px] font-semibold mt-3 leading-tight" style={{ color: T.text }}>{name || expert.name}</div>
                <div className="w-full mt-4 pt-4 space-y-3 text-left" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <DetailItem label="Email" value={email || "—"} />
                  <DetailItem label="Mobile number" value={phone || "—"} />
                  <div className="grid grid-cols-2 gap-3">
                    <DetailItem label="Age" value={age || "—"} />
                    <DetailItem label="Gender" value={genderLabel} />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </aside>

        <div className="space-y-4">
          {/* Expertise — session rate read-only */}
          <Card className="!p-6">
            <SectionHeader
              title="Expertise"
              sub="Languages, specializations, experience and bio."
              editing={expertiseEditing}
              onEdit={startExpertiseEdit}
              onSave={saveExpertise}
            />
            {expertiseEditing && expertiseDraft ? (
              <div className="space-y-5">
                <div>
                  <FieldLabel>Languages spoken</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <ChipToggle
                        key={lang.value}
                        label={lang.label}
                        active={expertiseDraft.languages.includes(lang.value)}
                        onClick={() =>
                          setExpertiseDraft((d) =>
                            d ? { ...d, languages: toggleMulti(d.languages, lang.value) } : d,
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel>Skills &amp; specializations</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((skill) => (
                      <ChipToggle
                        key={skill.value}
                        label={skill.label}
                        active={expertiseDraft.skills.includes(skill.value)}
                        onClick={() =>
                          setExpertiseDraft((d) =>
                            d ? { ...d, skills: toggleMulti(d.skills, skill.value) } : d,
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    value={expertiseDraft.experience}
                    onChange={(v) => setExpertiseDraft((d) => (d ? { ...d, experience: v } : d))}
                    label="Experience"
                    options={EXPERIENCE_OPTIONS}
                    placeholder="Select experience"
                  />
                  <div>
                    <FieldLabel>Session rate</FieldLabel>
                    <div
                      className="h-10 px-3 rounded-[9px] flex items-center text-[13.5px] font-medium tabular-nums"
                      style={{ background: "rgba(89,82,54,0.04)", border: `1px solid ${T.borderSoft}`, color: T.muted }}
                    >
                      {feeDisplay}
                      <span className="text-[11px] ml-2 font-normal" style={{ color: T.faint }}>Admin only</span>
                    </div>
                  </div>
                </div>
                <Textarea
                  value={expertiseDraft.bio}
                  onChange={(v) => setExpertiseDraft((d) => (d ? { ...d, bio: v } : d))}
                  label="Bio / About"
                  placeholder="Brief description about your background and expertise…"
                  rows={3}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] tracking-[0.07em] uppercase mb-1.5" style={{ color: T.faint }}>Languages</div>
                  <div className="flex flex-wrap gap-1.5">
                    {languages.length ? (
                      languages.map((l) => (
                        <span key={l} className="text-[12px] px-2.5 py-0.5 rounded-full" style={{ background: T.accentFaint, color: T.accent }}>
                          {l}
                        </span>
                      ))
                    ) : (
                      <span className="text-[13px]" style={{ color: T.faint }}>—</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] tracking-[0.07em] uppercase mb-1.5" style={{ color: T.faint }}>Skills</div>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.length ? (
                      skills.map((k) => (
                        <span key={k} className="text-[12px] px-2.5 py-0.5 rounded-full" style={{ background: "rgba(89,82,54,0.06)", color: T.muted }}>
                          {SKILL_OPTIONS.find((s) => s.value === k)?.label ?? k}
                        </span>
                      ))
                    ) : (
                      <span className="text-[13px]" style={{ color: T.faint }}>—</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <DetailItem label="Experience" value={experienceLabel} />
                  <DetailItem label="Session rate" value={feeDisplay} />
                </div>
                {bio && (
                  <div>
                    <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>Bio</div>
                    <p className="text-[13.5px] mt-1 leading-relaxed" style={{ color: T.text }}>{bio}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Payout — separate edit */}
          <Card id="payout" className="!p-6 scroll-mt-24">
            <SectionHeader
              title="Payout account"
              sub="Bank details used for commission payouts."
              editing={payoutEditing}
              onEdit={startPayoutEdit}
              onSave={savePayout}
            />
            {payoutEditing && payoutDraft ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    value={payoutDraft.bankName}
                    onChange={(v) => setPayoutDraft((d) => (d ? { ...d, bankName: v } : d))}
                    label="Bank name"
                    placeholder="e.g. HDFC Bank"
                  />
                  <Input
                    value={payoutDraft.accountNumber}
                    onChange={(v) => setPayoutDraft((d) => (d ? { ...d, accountNumber: v } : d))}
                    label="Account number"
                    placeholder="e.g. 1234 5678 6789"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    value={payoutDraft.ifsc}
                    onChange={(v) => setPayoutDraft((d) => (d ? { ...d, ifsc: v } : d))}
                    error={errors.ifsc}
                    label="IFSC code"
                    placeholder="e.g. HDFC0001234"
                  />
                  <Input
                    value={payoutDraft.upi}
                    onChange={(v) => setPayoutDraft((d) => (d ? { ...d, upi: v } : d))}
                    label="UPI ID"
                    placeholder="e.g. name@upi"
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
