"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input } from "@/components/ui";
import { T } from "@/lib/theme";
import { V, validate, hasErrors, type ValidationErrors } from "@/lib/validation";

export default function CreateSalesMemberPage() {
  const router = useRouter();
  const [toast, setToast] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

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
    });
    setErrors(errs);
    return errs;
  };

  const canSubmit = !hasErrors(validate({
    name: V.required(name),
    email: V.email(email),
    phone: V.phone(phone),
  }));

  const handleCreate = () => {
    setSubmitAttempted(true);
    setTouched(new Set(["name", "email", "phone"]));
    const errs = validateForm();
    if (hasErrors(errs)) return;
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
              <Input value={name} onChange={(v) => { markTouched("name"); setName(v); }} label="Full name" placeholder="e.g. Priya Sharma" error={showError("name")} />
              <Input value={email} onChange={(v) => { markTouched("email"); setEmail(v); }} label="Email" type="email" placeholder="e.g. name@astrolaabh.com" error={showError("email")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={phone} onChange={(v) => { markTouched("phone"); setPhone(v); }} label="Mobile number" placeholder="e.g. +91 98765 43210" error={showError("phone")} />
            </div>
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
