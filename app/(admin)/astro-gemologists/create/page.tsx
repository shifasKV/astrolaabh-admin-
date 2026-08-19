"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input, Select, Textarea } from "@/components/ui";
import { T } from "@/lib/theme";
import * as V from "@/lib/validators";

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

function ChipToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12.5px] font-medium transition-all duration-150 cursor-pointer"
      style={active
        ? { background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }
        : { background: "transparent", border: `1px solid ${T.borderSoft}`, color: T.muted }}
    >
      {active && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M20 6 9 17l-5-5" /></svg>}
      {label}
    </button>
  );
}

export default function CreateAstroGemologistPage() {
  const router = useRouter();
  const [toast, setToast] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [fee, setFee] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [stoneRate, setStoneRate] = useState("8");
  const [jewelleryRate, setJewelleryRate] = useState("6");
  const [consultationRate, setConsultationRate] = useState("15");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upi, setUpi] = useState("");

  const handlePhoto = (file: File) => {
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleMulti = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearErr = (k: string) => setErrors((p) => (p[k] ? { ...p, [k]: "" } : p));
  const validate = () => {
    const e: Record<string, string> = {
      name: V.required(name, "Full name"),
      email: V.email(email),
      phone: V.phone(phone),
      age: V.optionalNumber(age, "Age"),
      fee: V.positiveNumber(fee, "Session rate"),
      ifsc: V.ifsc(ifsc),
    };
    setErrors(e);
    return V.isClean(e);
  };

  const handleCreate = () => {
    if (!validate()) return;
    setToast("Astro-Gemologist created — invite link sent");
    setTimeout(() => router.push("/astro-gemologists"), 1500);
  };

  return (
    <>
      <PageHeader
        title="Add Astro-Gemologist"
        back={{ label: "Astro-Gemologists", href: "/astro-gemologists" }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start pb-24">
        {/* Live preview rail */}
        <aside className="lg:sticky lg:top-4">
          <Card className="!p-5">
            <div className="flex flex-col items-center text-center pb-4 mb-4" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="relative">
                {photoPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Preview" className="w-[72px] h-[72px] rounded-[20px] object-cover" style={{ border: `1px solid ${T.accentBorder}` }} />
                    <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(""); }} aria-label="Remove photo" className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer" style={{ background: T.danger, color: "#fff" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-2.5 h-2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </>
                ) : (
                  <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[24px] font-semibold" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>{(name || "N")[0]}</div>
                )}
              </div>
              <div className="text-[15px] font-semibold mt-3 leading-tight" style={{ color: T.text }}>{name || "New astro-gemologist"}</div>
              <div className="text-[12px] mt-0.5 truncate max-w-full" style={{ color: T.muted }}>{email || "—"}</div>
              <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); }} />
              <label htmlFor="photo-upload" className="inline-flex items-center gap-1.5 h-8 px-3 mt-3.5 rounded-[9px] text-[12px] font-medium cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.1)]" style={{ color: T.text, border: `1px solid ${T.border}` }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
                {photo ? "Change photo" : "Upload photo"}
              </label>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12.5px]">
                <span style={{ color: T.faint }}>Session rate</span>
                <span className="font-semibold tabular-nums" style={{ color: T.text }}>{fee ? `₹${Number(fee).toLocaleString("en-IN")}` : "—"}</span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span style={{ color: T.faint }}>Experience</span>
                <span className="font-medium" style={{ color: T.text }}>{EXPERIENCE_OPTIONS.find((o) => o.value === experience)?.label ?? "—"}</span>
              </div>
              {(languages.length > 0 || skills.length > 0) && (
                <div className="pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  {languages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {languages.map((l) => (
                        <span key={l} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: T.accentFaint, color: T.accent, border: `1px solid ${T.borderSoft}` }}>{l}</span>
                      ))}
                    </div>
                  )}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((k) => (
                        <span key={k} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(89,82,54,0.06)", color: T.muted }}>{SKILL_OPTIONS.find((s) => s.value === k)?.label ?? k}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </aside>

        {/* Seamless form */}
        <Card className="!p-0 overflow-hidden">
          <Section title="Identity & contact" sub="Name and how the customer reaches this expert." first>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={name} onChange={(v) => { setName(v); clearErr("name"); }} onBlur={() => setErrors((p) => ({ ...p, name: V.required(name, "Full name") }))} error={errors.name} label="Full name" placeholder="e.g. Pt. Sandeep Kochaar" />
              <Input value={email} onChange={(v) => { setEmail(v); clearErr("email"); }} onBlur={() => setErrors((p) => ({ ...p, email: V.email(email) }))} error={errors.email} label="Email" type="email" placeholder="e.g. name@astrolaabh.house" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input value={phone} onChange={(v) => { setPhone(v); clearErr("phone"); }} onBlur={() => setErrors((p) => ({ ...p, phone: V.phone(phone) }))} error={errors.phone} label="Mobile number" type="tel" placeholder="e.g. +91 98765 43210" />
              <Input value={age} onChange={(v) => { setAge(v); clearErr("age"); }} error={errors.age} label="Age" type="number" placeholder="e.g. 45" />
              <Select value={gender} onChange={setGender} label="Gender" options={GENDER_OPTIONS} placeholder="Select gender" />
            </div>
          </Section>

          <Section title="Expertise" sub="Languages, specializations, experience and session rate.">
            <div>
              <FieldLabel>Languages spoken</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <ChipToggle key={lang.value} label={lang.label} active={languages.includes(lang.value)} onClick={() => toggleMulti(languages, lang.value, setLanguages)} />
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Skills &amp; specializations</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <ChipToggle key={skill.value} label={skill.label} active={skills.includes(skill.value)} onClick={() => toggleMulti(skills, skill.value, setSkills)} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select value={experience} onChange={setExperience} label="Experience" options={EXPERIENCE_OPTIONS} placeholder="Select experience" />
              <Input value={fee} onChange={(v) => { setFee(v); clearErr("fee"); }} onBlur={() => setErrors((p) => ({ ...p, fee: V.positiveNumber(fee, "Session rate") }))} error={errors.fee} label="Per session rate (₹)" type="number" placeholder="e.g. 5000" />
            </div>
            <Textarea value={bio} onChange={setBio} label="Bio / About" placeholder="Brief description about the expert's background and expertise…" rows={3} />
          </Section>

          <Section title="Commission & payout" sub="Commission percentages and the bank account for payouts. Can be updated later.">
            <div>
              <FieldLabel>Commission rates</FieldLabel>
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
            <div className="pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <FieldLabel>Account details</FieldLabel>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input value={bankName} onChange={setBankName} label="Bank name" placeholder="e.g. HDFC Bank" />
                  <Input value={accountNumber} onChange={setAccountNumber} label="Account number" placeholder="e.g. 1234 5678 6789" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input value={ifsc} onChange={(v) => { setIfsc(v); clearErr("ifsc"); }} error={errors.ifsc} label="IFSC code" placeholder="e.g. HDFC0001234" />
                  <Input value={upi} onChange={setUpi} label="UPI ID" placeholder="e.g. name@upi" />
                </div>
              </div>
            </div>
          </Section>
        </Card>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 -mx-5 md:-mx-10 px-5 md:px-10 py-3.5 flex items-center justify-between gap-2.5" style={{ background: "rgba(248,245,238,0.9)", backdropFilter: "blur(6px)", borderTop: `1px solid ${T.borderSoft}` }}>
        <span className="text-[12px] hidden sm:block" style={{ color: T.faint }}>An invite link will be emailed so they can set their password.</span>
        <div className="flex items-center gap-2.5 ml-auto">
          <GhostBtn onClick={() => router.push("/astro-gemologists")}>Cancel</GhostBtn>
          <GoldBtn onClick={handleCreate}>Create &amp; send invite</GoldBtn>
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
