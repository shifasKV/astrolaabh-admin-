"use client";
import { useState } from "react";
import { PageHeader, Card, GoldBtn, Input } from "@/components/ui";
import { T } from "@/lib/theme";
import * as V from "@/lib/validators";
import { useAuth, type Role } from "@/lib/store/auth";
import { PasswordCard } from "./PasswordCard";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  expert: "Astro-Gemologist",
  affiliate: "Affiliate partner",
  sales_admin: "Sales admin",
  sales_exec: "Sales executive",
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{label}</div>
      <div className="text-[13.5px] font-medium mt-0.5 break-all" style={{ color: T.text }}>{value}</div>
    </div>
  );
}

/**
 * Full-page My profile for admin, affiliate, and sales roles.
 * Email is always read-only; name / phone are editable.
 */
export function StaffProfilePage({ expectedRoles }: { expectedRoles: Role[] }) {
  const { user } = useAuth();
  const [toast, setToast] = useState("");

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("+91 98765 00000");
  const [photoPreview, setPhotoPreview] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ name: string; phone: string; photoPreview: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user || !expectedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[14px]" style={{ color: T.muted }}>Profile not available.</p>
      </div>
    );
  }

  const email = user.email;
  const roleLabel = ROLE_LABEL[user.role];

  const startEdit = () => {
    setDraft({ name, phone, photoPreview });
    setErrors({});
    setEditing(true);
  };

  const handlePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setDraft((d) => (d ? { ...d, photoPreview: preview } : d));
    };
    reader.readAsDataURL(file);
  };

  const saveIdentity = () => {
    if (!draft) return;
    const e: Record<string, string> = {
      name: V.required(draft.name, "Full name"),
      phone: V.phone(draft.phone),
    };
    setErrors(e);
    if (!V.isClean(e)) return;
    setName(draft.name.trim());
    setPhone(draft.phone.trim());
    setPhotoPreview(draft.photoPreview);
    setEditing(false);
    setDraft(null);
    setToast("Profile updated");
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <>
      <PageHeader title="My profile" />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start pb-8">
        <aside className="lg:sticky lg:top-4">
          <Card className="!p-5">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>
                Identity
              </div>
              {editing ? (
                <GoldBtn className="!h-7 !px-3 !text-[11px]" onClick={saveIdentity}>
                  Save
                </GoldBtn>
              ) : (
                <button
                  type="button"
                  onClick={startEdit}
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

            {editing && draft ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {draft.photoPreview ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={draft.photoPreview}
                          alt="Preview"
                          className="w-[72px] h-[72px] rounded-[20px] object-cover"
                          style={{ border: `1px solid ${T.accentBorder}` }}
                        />
                        <button
                          type="button"
                          onClick={() => setDraft((d) => (d ? { ...d, photoPreview: "" } : d))}
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
                        {(draft.name || user.name)[0]}
                      </div>
                    )}
                  </div>
                  <input
                    id="staff-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handlePhoto(f);
                    }}
                  />
                  <label
                    htmlFor="staff-photo-upload"
                    className="inline-flex items-center gap-1.5 h-8 px-3 mt-3 rounded-[9px] text-[12px] font-medium cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.1)]"
                    style={{ color: T.text, border: `1px solid ${T.border}` }}
                  >
                    {draft.photoPreview ? "Change photo" : "Upload photo"}
                  </label>
                </div>
                <Input
                  value={draft.name}
                  onChange={(v) => setDraft((d) => (d ? { ...d, name: v } : d))}
                  error={errors.name}
                  label="Full name"
                />
                <div>
                  <div className="text-[11px] tracking-[0.07em] uppercase mb-2" style={{ color: T.faint }}>Email</div>
                  <div
                    className="h-10 px-3 rounded-[9px] flex items-center text-[13.5px]"
                    style={{ background: "rgba(89,82,54,0.04)", border: `1px solid ${T.borderSoft}`, color: T.muted }}
                  >
                    {email}
                  </div>
                </div>
                <Input
                  value={draft.phone}
                  onChange={(v) => setDraft((d) => (d ? { ...d, phone: v } : d))}
                  error={errors.phone}
                  label="Mobile number"
                  type="tel"
                />
                <DetailItem label="Role" value={roleLabel} />
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
                    {(name || user.name)[0]}
                  </div>
                )}
                <div className="text-[15px] font-semibold mt-3 leading-tight" style={{ color: T.text }}>{name || user.name}</div>
                <div className="w-full mt-4 pt-4 space-y-3 text-left" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <DetailItem label="Email" value={email} />
                  <DetailItem label="Mobile number" value={phone || "—"} />
                  <DetailItem label="Role" value={roleLabel} />
                </div>
              </div>
            )}
          </Card>
        </aside>

        <div className="space-y-4">
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
