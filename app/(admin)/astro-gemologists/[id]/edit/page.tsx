"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input, Select, Textarea, FileInput } from "@/components/ui";
import { T } from "@/lib/theme";
import { EXPERT_PROFILES } from "@/lib/mock";

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

export default function EditAstroGemologistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const expert = EXPERT_PROFILES.find((e) => e.id === id);
  const [toast, setToast] = useState("");

  const [name, setName] = useState(expert?.name ?? "");
  const [email, setEmail] = useState(expert ? `${expert.name.split(" ").pop()?.toLowerCase()}@astrolaabh.house` : "");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [languages, setLanguages] = useState<string[]>(expert?.languages ?? []);
  const [skills, setSkills] = useState<string[]>(expert ? skillKeysFromSpecialization(expert.specialization) : []);
  const [fee, setFee] = useState(expert ? String(expert.fee) : "");
  const [experience, setExperience] = useState(expert ? experienceToKey(expert.experience) : "");
  const [bio, setBio] = useState("");

  if (!expert) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[14px]" style={{ color: T.muted }}>Expert not found.</p>
      </div>
    );
  }

  const handlePhoto = (file: File) => {
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleMulti = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const canSubmit = name.trim() && email.trim() && phone.trim();

  const handleSave = () => {
    if (!canSubmit) return;
    setToast("Profile updated");
    setTimeout(() => {
      router.push(`/astro-gemologists/${id}`);
    }, 1500);
  };

  return (
    <>
      <PageHeader
        title={`Edit — ${expert.name}`}
        sub="Update expert profile details"
        back={{ label: expert.name, href: `/astro-gemologists/${id}` }}
      />

      <div className="space-y-6 max-w-[820px]">
        {/* Personal information */}
        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.accent }}>Personal information</div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={name} onChange={setName} label="Full name" placeholder="e.g. Pt. Sandeep Kochaar" />
              <Input value={email} onChange={setEmail} label="Email" type="email" placeholder="e.g. name@astrolaabh.house" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input value={phone} onChange={setPhone} label="Mobile number" placeholder="e.g. +91 98765 43210" />
              <Input value={age} onChange={setAge} label="Age" type="number" placeholder="e.g. 45" />
              <Select value={gender} onChange={setGender} label="Gender" options={GENDER_OPTIONS} placeholder="Select gender" />
            </div>

            {/* Photo */}
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase mb-1.5" style={{ color: T.faint }}>Photo</label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover"
                      style={{ border: `2px solid ${T.accent}40` }}
                    />
                    <button
                      type="button"
                      onClick={() => { setPhoto(null); setPhotoPreview(""); }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                      style={{ background: T.danger, color: "#fff" }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-bold"
                    style={{ background: `${T.accent}15`, border: `2px solid ${T.accent}40`, color: T.accent }}
                  >
                    {expert.name[0]}
                  </div>
                )}
                <FileInput
                  onSelect={handlePhoto}
                  accept="image/*"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Professional details */}
        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.accent }}>Professional details</div>
          <div className="space-y-4">
            {/* Languages */}
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase mb-2" style={{ color: T.faint }}>Languages spoken</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const selected = languages.includes(lang.value);
                  return (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => toggleMulti(languages, lang.value, setLanguages)}
                      className="h-8 px-3 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer"
                      style={{
                        background: selected ? `${T.accent}18` : "transparent",
                        border: `1px solid ${selected ? T.accent : T.borderSoft}`,
                        color: selected ? T.accent : T.muted,
                      }}
                    >
                      {selected && <span className="mr-1">✓</span>}
                      {lang.label}
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
                    <button
                      key={skill.value}
                      type="button"
                      onClick={() => toggleMulti(skills, skill.value, setSkills)}
                      className="h-8 px-3 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer"
                      style={{
                        background: selected ? `${T.accent}18` : "transparent",
                        border: `1px solid ${selected ? T.accent : T.borderSoft}`,
                        color: selected ? T.accent : T.muted,
                      }}
                    >
                      {selected && <span className="mr-1">✓</span>}
                      {skill.label}
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

        {/* Actions */}
        <div className="flex items-center gap-3 pb-8">
          <GoldBtn onClick={handleSave} disabled={!canSubmit}>
            Save changes
          </GoldBtn>
          <GhostBtn onClick={() => router.push(`/astro-gemologists/${id}`)}>Cancel</GhostBtn>
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
