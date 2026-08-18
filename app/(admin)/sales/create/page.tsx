"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input } from "@/components/ui";
import { T } from "@/lib/theme";
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

export default function CreateSalesMemberPage() {
  const router = useRouter();
  const [toast, setToast] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearErr = (k: string) => setErrors((p) => (p[k] ? { ...p, [k]: "" } : p));
  const validate = () => {
    const e: Record<string, string> = {
      name: V.required(name, "Full name"),
      email: V.email(email),
      phone: V.phone(phone),
    };
    setErrors(e);
    return V.isClean(e);
  };

  const handleCreate = () => {
    if (!validate()) return;
    setToast("Sales member added successfully");
    setTimeout(() => {
      router.push("/sales");
    }, 1500);
  };

  return (
    <>
      <PageHeader
        title="Add Sales Member"
        back={{ label: "Sales", href: "/sales" }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start pb-24">
        {/* Live preview rail */}
        <aside className="lg:sticky lg:top-4">
          <Card className="!p-5">
            <div className="flex flex-col items-center text-center pb-4 mb-4" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[24px] font-semibold" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>{(name || "S")[0]}</div>
              <div className="text-[15px] font-semibold mt-3 leading-tight" style={{ color: T.text }}>{name || "New sales member"}</div>
              <div className="text-[12px] mt-0.5 truncate max-w-full" style={{ color: T.muted }}>{email || "—"}</div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12.5px]">
                <span style={{ color: T.faint }}>Phone</span>
                <span className="font-medium tabular-nums" style={{ color: T.text }}>{phone || "—"}</span>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span style={{ color: T.faint }}>Role</span>
                <span className="font-medium" style={{ color: T.text }}>Sales member</span>
              </div>
            </div>
          </Card>
        </aside>

        {/* Seamless form */}
        <Card className="!p-0 overflow-hidden">
          <Section title="Identity & contact" sub="Name and how the sales member is reached." first>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={name} onChange={(v) => { setName(v); clearErr("name"); }} onBlur={() => setErrors((p) => ({ ...p, name: V.required(name, "Full name") }))} error={errors.name} label="Full name" placeholder="e.g. Priya Sharma" />
              <Input value={email} onChange={(v) => { setEmail(v); clearErr("email"); }} onBlur={() => setErrors((p) => ({ ...p, email: V.email(email) }))} error={errors.email} label="Email" type="email" placeholder="e.g. name@astrolaabh.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={phone} onChange={(v) => { setPhone(v); clearErr("phone"); }} onBlur={() => setErrors((p) => ({ ...p, phone: V.phone(phone) }))} error={errors.phone} label="Mobile number" placeholder="e.g. +91 98765 43210" />
            </div>
          </Section>
        </Card>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 -mx-5 md:-mx-10 px-5 md:px-10 py-3.5 flex items-center justify-between gap-2.5" style={{ background: "rgba(248,245,238,0.9)", backdropFilter: "blur(6px)", borderTop: `1px solid ${T.borderSoft}` }}>
        <span className="text-[12px] hidden sm:block" style={{ color: T.faint }}>An invite link will be emailed so they can set their password.</span>
        <div className="flex items-center gap-2.5 ml-auto">
          <GhostBtn onClick={() => router.push("/sales")}>Cancel</GhostBtn>
          <GoldBtn onClick={handleCreate}>Create Sales Member</GoldBtn>
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
