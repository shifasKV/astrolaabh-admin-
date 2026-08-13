"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input, Select, Textarea, FileInput } from "@/components/ui";
import { T } from "@/lib/theme";

const ROLE_OPTIONS = [
  { value: "Sales Lead", label: "Sales Lead" },
  { value: "Sales Executive", label: "Sales Executive" },
  { value: "Sales Manager", label: "Sales Manager" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function CreateSalesMemberPage() {
  const router = useRouter();
  const [toast, setToast] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [bio, setBio] = useState("");

  const handlePhoto = (file: File) => {
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const canSubmit = name.trim() && email.trim() && phone.trim();

  const handleCreate = () => {
    if (!canSubmit) return;
    setToast("Sales member added successfully");
    setTimeout(() => {
      router.push("/sales");
    }, 1500);
  };

  return (
    <>
      <PageHeader
        title="Add Sales Member"
        sub="Create a new sales team member profile"
        back={{ label: "Sales", href: "/sales" }}
      />

      <div className="space-y-6 max-w-[820px]">
        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.accent }}>Personal information</div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={name} onChange={setName} label="Full name" placeholder="e.g. Priya Sharma" />
              <Input value={email} onChange={setEmail} label="Email" type="email" placeholder="e.g. name@astrolaabh.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input value={phone} onChange={setPhone} label="Mobile number" placeholder="e.g. +91 98765 43210" />
              <Input value={age} onChange={setAge} label="Age" type="number" placeholder="e.g. 28" />
              <Select value={gender} onChange={setGender} label="Gender" options={GENDER_OPTIONS} placeholder="Select gender" />
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase mb-1.5" style={{ color: T.faint }}>Photo</label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" style={{ border: `2px solid ${T.accent}40` }} />
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
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${T.accent}10`, border: `2px dashed ${T.accent}30` }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: T.faint }}>
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <FileInput onSelect={handlePhoto} accept="image/*" className="flex-1" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.accent }}>Role details</div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select value={role} onChange={setRole} label="Role" options={ROLE_OPTIONS} placeholder="Select role" />
            </div>
            <Textarea value={bio} onChange={setBio} label="Notes" placeholder="Any additional notes about this team member…" rows={3} />
          </div>
        </Card>

        <div className="flex items-center gap-3 pb-8">
          <GoldBtn onClick={handleCreate} disabled={!canSubmit}>Create Sales Member</GoldBtn>
          <GhostBtn onClick={() => router.push("/sales")}>Cancel</GhostBtn>
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
