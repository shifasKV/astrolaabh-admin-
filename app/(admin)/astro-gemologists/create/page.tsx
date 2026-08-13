"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input, Select, Textarea, FileInput } from "@/components/ui";
import { T } from "@/lib/theme";

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

  const handleCreate = () => {
    if (!canSubmit) return;
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
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: `${T.accent}10`, border: `2px dashed ${T.accent}30` }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: T.faint }}>
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
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
