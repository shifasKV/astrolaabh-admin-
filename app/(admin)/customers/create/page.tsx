"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, SearchFilter, Chip, Input, StepIndicator } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS } from "@/lib/mock";
import * as V from "@/lib/validators";

type Step = "customer" | "address";
const STEPS: { key: Step; label: string }[] = [
  { key: "customer", label: "Customer" },
  { key: "address", label: "Address" },
];

export default function CreateCustomerPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("customer");
  const [animating, setAnimating] = useState(false);
  const [toast, setToast] = useState("");

  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });
  const [createdCustomer, setCreatedCustomer] = useState<{ id: string; name: string; email: string; phone: string } | null>(null);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ line1: "", line2: "", city: "", state: "", pincode: "" });

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const canNavigateTo = (targetIndex: number) => {
    if (targetIndex === 0) return true;
    if (targetIndex === 1) return !!createdCustomer;
    return false;
  };

  const goTo = (target: Step) => {
    setAnimating(true);
    setTimeout(() => { setStep(target); setAnimating(false); }, 180);
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearErr = (k: string) => setErrors((p) => (p[k] ? { ...p, [k]: "" } : p));
  const validateCustomer = () => {
    const e: Record<string, string> = {
      name: V.required(newCustomer.name, "Full name"),
      email: V.email(newCustomer.email),
      phone: V.phone(newCustomer.phone),
    };
    setErrors(e);
    return V.isClean(e);
  };

  const handleCreateCustomer = () => {
    if (!validateCustomer()) return;
    const id = `cust_new_${Date.now()}`;
    setCreatedCustomer({ id, ...newCustomer });
    goTo("address");
  };

  const selectAddress = (addr: string) => {
    setSelectedAddress(addr);
  };

  const handleSaveNewAddress = () => {
    if (!newAddress.line1 || !newAddress.city || !newAddress.pincode) return;
    const formatted = `${newAddress.line1}${newAddress.line2 ? ", " + newAddress.line2 : ""}, ${newAddress.city}, ${newAddress.state} ${newAddress.pincode}`;
    setSelectedAddress(formatted);
    setShowNewAddress(false);
  };

  const handleSave = () => {
    setToast("Customer saved successfully");
    setTimeout(() => {
      setToast("");
      router.push("/customers");
    }, 1500);
  };

  return (
    <>
      <PageHeader
        title="Add customer"
        back={{ label: "Customers", onClick: () => router.push("/customers") }}
      />

      <StepIndicator
        steps={STEPS}
        currentIndex={stepIndex}
        onNavigate={(i) => goTo(STEPS[i].key)}
        canNavigateTo={canNavigateTo}
      />

      <div
        className="transition-all duration-200"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(8px)" : "translateY(0)",
        }}
      >
        {/* STEP: Customer */}
        {step === "customer" && (
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Customer details</div>

            <div className="space-y-3">
              <Input
                value={newCustomer.name}
                onChange={(v) => { setNewCustomer((p) => ({ ...p, name: v })); clearErr("name"); }}
                onBlur={() => setErrors((p) => ({ ...p, name: V.required(newCustomer.name, "Full name") }))}
                error={errors.name}
                label="Full name"
                placeholder="e.g. Priya Sharma"
              />
              <Input
                value={newCustomer.email}
                onChange={(v) => { setNewCustomer((p) => ({ ...p, email: v })); clearErr("email"); }}
                onBlur={() => setErrors((p) => ({ ...p, email: V.email(newCustomer.email) }))}
                error={errors.email}
                label="Email"
                placeholder="e.g. priya@example.com"
              />
              <Input
                value={newCustomer.phone}
                onChange={(v) => { setNewCustomer((p) => ({ ...p, phone: v })); clearErr("phone"); }}
                onBlur={() => setErrors((p) => ({ ...p, phone: V.phone(newCustomer.phone) }))}
                error={errors.phone}
                label="Mobile number"
                placeholder="e.g. +91 98765 43210"
              />
            </div>

            <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <GoldBtn onClick={handleCreateCustomer}>Next →</GoldBtn>
            </div>
          </Card>
        )}

        {/* STEP: Address */}
        {step === "address" && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Shipping address</div>
              {!showNewAddress && (
                <button
                  onClick={() => setShowNewAddress(true)}
                  className="text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                  style={{ color: T.accent }}
                >
                  + New address
                </button>
              )}
            </div>

            {createdCustomer && (
              <div className="text-[12px] mb-4 px-3 py-2 rounded-[8px]" style={{ background: "rgba(119,123,98,0.10)", color: T.muted }}>
                Adding address for <span style={{ color: T.text }}>{createdCustomer.name}</span>
              </div>
            )}

            {showNewAddress ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium" style={{ color: T.accent }}>Add new address</span>
                  <button onClick={() => setShowNewAddress(false)} className="text-[11px] cursor-pointer" style={{ color: T.muted }}>← Back</button>
                </div>
                <Input
                  value={newAddress.line1}
                  onChange={(v) => setNewAddress((p) => ({ ...p, line1: v }))}
                  label="Address line 1"
                  placeholder="House/flat no., building, street"
                />
                <Input
                  value={newAddress.line2}
                  onChange={(v) => setNewAddress((p) => ({ ...p, line2: v }))}
                  label="Address line 2 (optional)"
                  placeholder="Landmark, area"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={newAddress.city}
                    onChange={(v) => setNewAddress((p) => ({ ...p, city: v }))}
                    label="City"
                    placeholder="e.g. Mumbai"
                  />
                  <Input
                    value={newAddress.state}
                    onChange={(v) => setNewAddress((p) => ({ ...p, state: v }))}
                    label="State"
                    placeholder="e.g. Maharashtra"
                  />
                </div>
                <Input
                  value={newAddress.pincode}
                  onChange={(v) => setNewAddress((p) => ({ ...p, pincode: v }))}
                  label="Pincode"
                  placeholder="e.g. 400001"
                />
                <div className="flex gap-2.5 pt-2">
                  <GoldBtn onClick={handleSaveNewAddress}>Use this address</GoldBtn>
                  <GhostBtn onClick={() => setShowNewAddress(false)}>Cancel</GhostBtn>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[13.5px] mb-2" style={{ color: T.muted }}>No saved addresses</p>
                <button onClick={() => setShowNewAddress(true)} className="text-[12px] font-medium cursor-pointer" style={{ color: T.accent }}>+ Add new address</button>
              </div>
            )}

            {selectedAddress && (
              <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <div className="text-[12px] truncate pr-4" style={{ color: T.muted }}>
                  <span className="text-[11px] uppercase tracking-[0.06em] mr-2" style={{ color: T.faint }}>Address:</span>
                  {selectedAddress}
                </div>
                <GoldBtn onClick={handleSave}>Save customer</GoldBtn>
              </div>
            )}
          </Card>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-[9px] text-[13.5px] shadow-lg" style={{ background: T.good, color: "#fff" }}>
          {toast}
        </div>
      )}
    </>
  );
}
