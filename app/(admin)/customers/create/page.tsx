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

export default function CreateCustomerPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearErr = (k: string) => setErrors((p) => (p[k] ? { ...p, [k]: "" } : p));
  const [toast, setToast] = useState("");

  const location = [city, state].filter(Boolean).join(", ");

  const handleCreate = () => {
    const e: Record<string, string> = {
      name: V.required(name, "Full name"),
      email: V.email(email),
      phone: V.phone(phone),
    };
    setErrors(e);
    if (!V.isClean(e)) return;
    setToast("Customer created successfully");
    setTimeout(() => { setToast(""); router.push("/customers"); }, 1500);
  };

  return (
    <>
      <PageHeader
        title="Add customer"
        back={{ label: "Customers", href: "/customers" }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start pb-24">
        {/* Live preview rail */}
        <aside className="lg:sticky lg:top-4">
          <Card className="!p-5">
            <div className="flex flex-col items-center text-center pb-4 mb-4" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center text-[24px] font-semibold" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>{(name || "N")[0].toUpperCase()}</div>
              <div className="text-[15px] font-semibold mt-3 leading-tight" style={{ color: T.text }}>{name || "New customer"}</div>
              <div className="text-[12px] mt-0.5 truncate max-w-full" style={{ color: T.muted }}>{email || "—"}</div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[12.5px]">
                <span style={{ color: T.faint }}>Mobile</span>
                <span className="font-medium tabular-nums" style={{ color: T.text }}>{phone || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[12.5px]">
                <span style={{ color: T.faint }}>Location</span>
                <span className="font-medium truncate text-right" style={{ color: T.text }}>{location || "—"}</span>
              </div>
            </div>
          </Card>
        </aside>

        {/* Seamless form */}
        <Card className="!p-0 overflow-hidden">
          <Section title="Identity & contact" sub="Name and how you'll reach this customer." first>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={name} onChange={(v) => { setName(v); clearErr("name"); }} onBlur={() => setErrors((p) => ({ ...p, name: V.required(name, "Full name") }))} error={errors.name} label="Full name" placeholder="e.g. Priya Sharma" />
              <Input value={email} onChange={(v) => { setEmail(v); clearErr("email"); }} onBlur={() => setErrors((p) => ({ ...p, email: V.email(email) }))} error={errors.email} label="Email" type="email" placeholder="e.g. priya@example.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={phone} onChange={(v) => { setPhone(v); clearErr("phone"); }} onBlur={() => setErrors((p) => ({ ...p, phone: V.phone(phone) }))} error={errors.phone} label="Mobile number" type="tel" placeholder="e.g. +91 98765 43210" />
            </div>
          </Section>

          <Section title="Shipping address" sub="Where the customer's orders are delivered.">
            <Input value={line1} onChange={setLine1} label="Address line 1" placeholder="House/flat no., building, street" />
            <Input value={line2} onChange={setLine2} label="Address line 2 (optional)" placeholder="Landmark, area" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input value={city} onChange={setCity} label="City" placeholder="e.g. Mumbai" />
              <Input value={state} onChange={setState} label="State" placeholder="e.g. Maharashtra" />
              <Input value={pincode} onChange={setPincode} label="Pincode" type="number" placeholder="e.g. 400001" />
            </div>
          </Section>
        </Card>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 -mx-5 md:-mx-10 px-5 md:px-10 py-3.5 flex items-center justify-between gap-2.5" style={{ background: "rgba(248,245,238,0.9)", backdropFilter: "blur(6px)", borderTop: `1px solid ${T.borderSoft}` }}>
        <span className="text-[12px] hidden sm:block" style={{ color: T.faint }}>Address is optional and can be added later from the customer&apos;s profile.</span>
        <div className="flex items-center gap-2.5 ml-auto">
          <GhostBtn onClick={() => router.push("/customers")}>Cancel</GhostBtn>
          <GoldBtn onClick={handleCreate}>Create customer</GoldBtn>
        </div>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
          {toast}
        </div>
      )}
    </>
  );
}
