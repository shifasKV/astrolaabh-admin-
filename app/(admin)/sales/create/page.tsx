"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input, Select } from "@/components/ui";
import { T } from "@/lib/theme";

const ROLE_OPTIONS = [
  { value: "Sales Lead", label: "Sales Lead" },
  { value: "Sales Manager", label: "Sales Manager" },
];

export default function CreateSalesMemberPage() {
  const router = useRouter();
  const [toast, setToast] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input value={phone} onChange={setPhone} label="Mobile number" placeholder="e.g. +91 98765 43210" />
              <Select value={role} onChange={setRole} label="Role" options={ROLE_OPTIONS} placeholder="Select role" />
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
