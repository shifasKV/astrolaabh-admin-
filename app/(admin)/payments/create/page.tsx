"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input, Select, Textarea } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS } from "@/lib/mock";
import { V, validate, hasErrors, type ValidationErrors } from "@/lib/validation";

export default function CreatePaymentPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [linkedType, setLinkedType] = useState("none");
  const [linkedRef, setLinkedRef] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const markTouched = (field: string) => setTouched((prev) => new Set(prev).add(field));
  const showError = (field: string) => (touched.has(field) || submitAttempted) ? errors[field] : undefined;

  const canSubmit = customerId && purpose && !hasErrors(validate({ amount: V.positiveAmount(amount) }));

  const handleCreate = () => {
    setSubmitAttempted(true);
    setTouched(new Set(["amount"]));
    const errs = validate({ amount: V.positiveAmount(amount) });
    setErrors(errs);
    if (hasErrors(errs)) return;
    router.push("/payments");
  };

  return (
    <>
      <PageHeader
        title="Create payment request"
        sub="Generate a payment link to share with the customer"
        back={{ label: "Payments", onClick: () => router.push("/payments") }}
      />

      <Card>
        <div className="max-w-lg space-y-4">
          <Select
            value={customerId}
            onChange={setCustomerId}
            label="Customer"
            searchable
            placeholder="Select customer…"
            options={[
              { value: "", label: "Select customer…" },
              ...MOCK_CUSTOMERS.map((c) => ({ value: c.id, label: `${c.name} (${c.email})` })),
            ]}
          />

          <Input
            value={purpose}
            onChange={setPurpose}
            label="Purpose"
            placeholder="e.g. Stone purchase — AL-PKJ-0417"
          />

          <Input
            value={amount}
            onChange={(v) => { markTouched("amount"); setAmount(v); }}
            label="Amount (₹)"
            type="number"
            placeholder="e.g. 250000"
            error={showError("amount")}
          />

          <Select
            value={linkedType}
            onChange={setLinkedType}
            label="Linked to"
            options={[
              { value: "none", label: "No linked entity" },
              { value: "order", label: "Order" },
              { value: "consultation", label: "Consultation" },
              { value: "recommendation", label: "Recommendation" },
            ]}
          />

          {linkedType !== "none" && (
            <Input
              value={linkedRef}
              onChange={setLinkedRef}
              label={`${linkedType.charAt(0).toUpperCase() + linkedType.slice(1)} reference`}
              placeholder={`e.g. AL-ORD-001`}
            />
          )}

          <Textarea
            value={notes}
            onChange={setNotes}
            label="Internal notes (optional)"
            placeholder="Additional context…"
          />

          <div className="flex gap-2.5 pt-3">
            <GoldBtn onClick={handleCreate} disabled={!canSubmit}>Create & send link</GoldBtn>
            <GhostBtn onClick={() => router.push("/payments")}>Cancel</GhostBtn>
          </div>
        </div>
      </Card>
    </>
  );
}
