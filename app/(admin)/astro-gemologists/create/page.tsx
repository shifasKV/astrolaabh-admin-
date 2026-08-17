"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input, Select, Textarea, FileInput } from "@/components/ui";
import { T } from "@/lib/theme";
import { V, validate, hasErrors, type ValidationErrors } from "@/lib/validation";

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

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const markTouched = (field: string) => setTouched((prev) => new Set(prev).add(field));
  const showError = (field: string) => (touched.has(field) || submitAttempted) ? errors[field] : undefined;

  const validateForm = () => {
    const errs = validate({
      name: V.required(name),
      email: V.email(email),
      phone: V.phone(phone),
      stoneRate: stoneRate.trim() ? V.percent(stoneRate) : "",
      jewelleryRate: jewelleryRate.trim() ? V.percent(jewelleryRate) : "",
      consultationRate: consultationRate.trim() ? V.percent(consultationRate) : "",
    });
    setErrors(errs);
    return errs;
  };

  const handlePhoto = (file: File) => {
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleMulti = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const canSubmit = !hasErrors(validate({
    name: V.required(name),
    email: V.email(email),
    phone: V.phone(phone),
    stoneRate: stoneRate.trim() ? V.percent(stoneRate) : "",
    jewelleryRate: jewelleryRate.trim() ? V.percent(jewelleryRate) : "",
    consultationRate: consultationRate.trim() ? V.percent(consultationRate) : "",
  }));

  const handleCreate = () => {
    setSubmitAttempted(true);
    setTouched(new Set(["name", "email", "phone", "stoneRate", "jewelleryRate", "consultationRate"]));
    const errs = validateForm();
    if (hasErrors(errs)) return;
    setToast("Astro-Gemologist created — Calendly invitation sent");
    setTimeout(() => {
      router.push("/astro-gemologists");
    }, 1500);
  };

  return (
    <>
      <PageHeader
        title="Add Astro-Gemologist"
        sub="Create a new expert profile and send a Calendly invitation"
        back={{ label: "Astro-Gemologists", href: "/astro-gemologists" }}
      />

      <div className="space-y-6 max-w-[720px]">
        {/* Astrologer details */}
        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.accent }}>Astrologer details</div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={name} onChange={(v) => { markTouched("name"); setName(v); }} label="Full name" placeholder="e.g. Pt. Sandeep Kochaar" error={showError("name")} />
              <Input value={email} onChange={(v) => { markTouched("email"); setEmail(v); }} label="Email" type="email" placeholder="e.g. name@astrolaabh.house" error={showError("email")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input value={phone} onChange={(v) => { markTouched("phone"); setPhone(v); }} label="Mobile number" placeholder="e.g. +91 98765 43210" error={showError("phone")} />
              <Input value={age} onChange={setAge} label="Age" type="number" placeholder="e.g. 45" />
              <Select value={gender} onChange={setGender} label="Gender" options={GENDER_OPTIONS} placeholder="Select gender" />
            </div>

            {/* Photo */}
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase mb-1.5" style={{ color: T.faint }}>Photo</label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" style={{ border: `2px solid ${T.accent}40` }} />
                    <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(""); }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] cursor-pointer" style={{ background: T.danger, color: "#fff" }}>✕</button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${T.accent}10`, border: `2px dashed ${T.accent}30` }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: T.faint }}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                )}
                <FileInput onSelect={handlePhoto} accept="image/*" className="flex-1" />
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase mb-2" style={{ color: T.faint }}>Languages spoken</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const selected = languages.includes(lang.value);
                  return (
                    <button key={lang.value} type="button" onClick={() => toggleMulti(languages, lang.value, setLanguages)} className="h-8 px-3 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer" style={{ background: selected ? `${T.accent}18` : "transparent", border: `1px solid ${selected ? T.accent : T.borderSoft}`, color: selected ? T.accent : T.muted }}>
                      {selected && <span className="mr-1">✓</span>}{lang.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase mb-2" style={{ color: T.faint }}>Skills & specializations</label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => {
                  const selected = skills.includes(skill.value);
                  return (
                    <button key={skill.value} type="button" onClick={() => toggleMulti(skills, skill.value, setSkills)} className="h-8 px-3 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer" style={{ background: selected ? `${T.accent}18` : "transparent", border: `1px solid ${selected ? T.accent : T.borderSoft}`, color: selected ? T.accent : T.muted }}>
                      {selected && <span className="mr-1">✓</span>}{skill.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select value={experience} onChange={setExperience} label="Experience" options={EXPERIENCE_OPTIONS} placeholder="Select experience" />
              <Input value={fee} onChange={setFee} label="Per session rate (₹)" type="number" placeholder="e.g. 5000" />
            </div>

            <Textarea value={bio} onChange={setBio} label="Bio / About" placeholder="Brief description about the expert's background and expertise…" rows={3} />
          </div>
        </Card>

        {/* Commission setup & Account details */}
        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.accent }}>Commission & payment details</div>
          <p className="text-[12px] mb-4" style={{ color: T.muted }}>Commission percentages and bank details for payouts. Can be updated later.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {([["stone", stoneRate, setStoneRate, "stoneRate"], ["jewellery", jewelleryRate, setJewelleryRate, "jewelleryRate"], ["consultation", consultationRate, setConsultationRate, "consultationRate"]] as const).map(([cat, val, setter, fieldKey]) => (
              <div key={cat} className="rounded-[10px] p-4" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
                <div className="text-[11px] tracking-[0.06em] uppercase mb-2" style={{ color: T.faint }}>{cat}</div>
                <div className="flex items-center gap-2">
                  <input type="number" value={val} onChange={(e) => { markTouched(fieldKey); setter(e.target.value); }} className="w-full h-9 px-3 rounded-[8px] text-[13px] outline-none" style={{ background: T.card, border: `1px solid ${showError(fieldKey) ? T.danger : T.border}`, color: T.text }} />
                  <span className="text-[13px] font-medium shrink-0" style={{ color: T.muted }}>%</span>
                </div>
                {showError(fieldKey) && <p className="text-[11px] mt-1" style={{ color: T.danger }}>{showError(fieldKey)}</p>}
              </div>
            ))}
          </div>
          <div className="pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Account details</div>
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
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-8">
          <GoldBtn onClick={handleCreate} disabled={!canSubmit}>
            Create Astro-Gemologist
          </GoldBtn>
          <GhostBtn onClick={() => router.push("/astro-gemologists")}>Cancel</GhostBtn>
          <span className="text-[12px] ml-2" style={{ color: T.faint }}>
            A Calendly invitation will be sent automatically
          </span>
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
