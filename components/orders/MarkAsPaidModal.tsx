"use client";
import { useEffect, useState } from "react";
import { Modal, GoldBtn, GhostBtn, Input, Textarea, Chip } from "@/components/ui";
import { T } from "@/lib/theme";
import { inr } from "@/lib/types";
import * as V from "@/lib/validators";

const METHOD_CHIPS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
];

type Addr = { line1: string; line2: string; city: string; state: string; pincode: string };
const EMPTY_ADDR: Addr = { line1: "", line2: "", city: "", state: "", pincode: "" };
const fmtAddr = (a: Addr) =>
  [a.line1, a.line2, a.city, a.state && a.pincode ? `${a.state} ${a.pincode}` : a.state || a.pincode]
    .filter(Boolean)
    .join(", ");

function AddressFields({ value, onChange }: { value: Addr; onChange: (a: Addr) => void }) {
  const set = (k: keyof Addr, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3">
      <Input value={value.line1} onChange={(v) => set("line1", v)} label="Address line 1" placeholder="House / flat no., building, street" required />
      <Input value={value.line2} onChange={(v) => set("line2", v)} label="Address line 2 (optional)" placeholder="Landmark, area" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input value={value.city} onChange={(v) => set("city", v)} label="City" placeholder="e.g. Mumbai" required />
        <Input value={value.state} onChange={(v) => set("state", v)} label="State" placeholder="e.g. Maharashtra" required />
        <Input
          value={value.pincode}
          onChange={(v) => set("pincode", v.replace(/[^0-9]/g, ""))}
          label="Pincode"
          inputMode="numeric"
          maxLength={6}
          placeholder="e.g. 400001"
          required
        />
      </div>
    </div>
  );
}

export type MarkAsPaidResult = {
  method: string;
  reference: string;
  notes?: string;
  shippingAddress?: string;
};

type SavedAddress = { label: string; text: string };

type MarkAsPaidModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: MarkAsPaidResult) => void;
  amount: number;
  customerName: string;
  /** Consultation fee vs order total context line */
  contextLabel?: string;
  /** Recommended stone order — collect shipping address before payment */
  requireAddress?: boolean;
  existingAddress?: string;
};

/**
 * Shared Mark as paid flow for orders and consultations.
 */
export function MarkAsPaidModal({
  open,
  onClose,
  onConfirm,
  amount,
  customerName,
  contextLabel = "Amount due",
  requireAddress = false,
  existingAddress = "",
}: MarkAsPaidModalProps) {
  const [step, setStep] = useState<"address" | "payment">(requireAddress ? "address" : "payment");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddrIdx, setSelectedAddrIdx] = useState(0);
  const [addAddrOpen, setAddAddrOpen] = useState(false);
  const [draftAddr, setDraftAddr] = useState<Addr>(EMPTY_ADDR);
  const [shippingAddress, setShippingAddress] = useState(existingAddress);
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setStep(requireAddress ? "address" : "payment");
    const seed = existingAddress.trim()
      ? [{ label: "Home", text: existingAddress.trim() }]
      : [];
    setAddresses(seed);
    setSelectedAddrIdx(0);
    setAddAddrOpen(seed.length === 0);
    setDraftAddr(EMPTY_ADDR);
    setShippingAddress(existingAddress.trim());
    setMethod("");
    setReference("");
    setNotes("");
    setErrors({});
  }, [open, requireAddress, existingAddress]);

  const saveNewAddress = () => {
    const e: Record<string, string> = {
      line1: V.required(draftAddr.line1, "Address line 1"),
      city: V.required(draftAddr.city, "City"),
      state: V.required(draftAddr.state, "State"),
      pincode: V.required(draftAddr.pincode, "Pincode"),
    };
    if (draftAddr.pincode && !/^\d{6}$/.test(draftAddr.pincode)) {
      e.pincode = "Enter a valid 6-digit pincode";
    }
    setErrors(e);
    if (!V.isClean(e)) return;
    const text = fmtAddr(draftAddr);
    const next = [...addresses, { label: addresses.length === 0 ? "Home" : `Address ${addresses.length + 1}`, text }];
    setAddresses(next);
    setSelectedAddrIdx(next.length - 1);
    setAddAddrOpen(false);
    setDraftAddr(EMPTY_ADDR);
    setErrors({});
  };

  const continueFromAddress = () => {
    const chosen = addresses[selectedAddrIdx]?.text?.trim() ?? "";
    const e: Record<string, string> = {
      address: chosen ? "" : "Select or add a delivery address",
    };
    setErrors(e);
    if (!V.isClean(e)) return;
    setShippingAddress(chosen);
    setStep("payment");
  };

  const confirmPayment = () => {
    const e: Record<string, string> = {
      method: V.required(method, "Payment method"),
      reference: V.required(reference, "Payment reference"),
    };
    setErrors(e);
    if (!V.isClean(e)) return;
    onConfirm({
      method,
      reference: reference.trim(),
      notes: notes.trim() || undefined,
      shippingAddress: requireAddress ? shippingAddress.trim() : undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === "address" ? "Shipping address required" : "Mark as paid"}
      wide
    >
      {/* Amount hero */}
      <div
        className="rounded-[14px] p-4 mb-5"
        style={{ background: "linear-gradient(160deg, #faf0d8 0%, #efdfb8 100%)", border: "1px solid rgba(160,125,56,0.35)" }}
      >
        <div className="text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: "#8a6a2f" }}>
          {contextLabel}
        </div>
        <div className="font-title text-[28px] font-semibold tabular-nums mt-1 tracking-[-0.02em]" style={{ color: T.text }}>
          {inr(amount)}
        </div>
        <div className="text-[13px] mt-1" style={{ color: T.muted }}>{customerName}</div>
      </div>

      {requireAddress && (
        <div className="flex items-center gap-2 mb-5">
          {(["address", "payment"] as const).map((s, i) => {
            const active = step === s;
            const done = step === "payment" && s === "address";
            const canJumpBack = s === "address" && step === "payment";
            const inner = (
              <>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                  style={{
                    background: active || done ? T.accent : "rgba(89,82,54,0.08)",
                    color: active || done ? T.accentInk : T.faint,
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span className="text-[12px] font-medium" style={{ color: active || canJumpBack ? T.text : T.faint }}>
                  {s === "address" ? "Address" : "Payment"}
                </span>
              </>
            );
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                {canJumpBack ? (
                  <button
                    type="button"
                    onClick={() => setStep("address")}
                    className="flex items-center gap-2 cursor-pointer rounded-[8px] -ml-1 px-1 py-0.5 hover:bg-[rgba(119,123,98,0.08)] transition-colors"
                  >
                    {inner}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">{inner}</div>
                )}
                {i === 0 && <div className="flex-1 h-px mx-1" style={{ background: T.borderSoft }} />}
              </div>
            );
          })}
        </div>
      )}

      {step === "address" ? (
        <div className="space-y-4">
          <p className="text-[13.5px] leading-relaxed" style={{ color: T.muted }}>
            Choose a delivery address for this recommendation before recording payment.
          </p>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium tracking-[0.06em] uppercase" style={{ color: T.faint }}>Deliver to</span>
              {!addAddrOpen && (
                <button
                  type="button"
                  onClick={() => { setAddAddrOpen(true); setDraftAddr(EMPTY_ADDR); setErrors({}); }}
                  className="text-[12px] font-medium cursor-pointer hover:underline underline-offset-4"
                  style={{ color: T.accent }}
                >
                  + Add new address
                </button>
              )}
            </div>

            <div className="space-y-2">
              {addresses.map((a, i) => {
                const on = selectedAddrIdx === i && !addAddrOpen;
                return (
                  <button
                    key={`${a.label}-${i}`}
                    type="button"
                    onClick={() => { setSelectedAddrIdx(i); setAddAddrOpen(false); setErrors((p) => (p.address ? { ...p, address: "" } : p)); }}
                    className="w-full flex items-start gap-2.5 text-left rounded-[10px] px-3.5 py-2.5 transition-colors cursor-pointer"
                    style={
                      on
                        ? {
                            background: "linear-gradient(135deg, rgba(160,125,56,0.14), rgba(160,125,56,0.05))",
                            border: "1px solid rgba(160,125,56,0.55)",
                            boxShadow: "0 0 0 3px rgba(160,125,56,0.10)",
                          }
                        : { background: T.popover, border: `1px solid ${T.border}` }
                    }
                  >
                    <span
                      className="mt-0.5 w-[15px] h-[15px] rounded-full flex items-center justify-center shrink-0"
                      style={{ border: `1.5px solid ${on ? T.accent : "rgba(89,82,54,0.3)"}` }}
                    >
                      {on && <span className="w-[7px] h-[7px] rounded-full" style={{ background: T.accent }} />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-[12.5px] font-medium" style={{ color: T.text }}>{a.label}</span>
                        {i === 0 && existingAddress.trim() === a.text && <Chip tone="muted">On file</Chip>}
                      </span>
                      <span className="block text-[12px] mt-0.5" style={{ color: T.muted }}>{a.text}</span>
                    </span>
                  </button>
                );
              })}
              {addresses.length === 0 && !addAddrOpen && (
                <p className="text-[12.5px]" style={{ color: T.faint }}>No address on file. Add a delivery address.</p>
              )}
            </div>

            {addAddrOpen && (
              <div className="mt-3 rounded-[12px] p-4" style={{ background: "rgba(119,123,98,0.07)", border: `1px solid ${T.accentBorder}` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12.5px] font-semibold" style={{ color: T.text }}>New delivery address</span>
                  <span className="text-[11px]" style={{ color: T.faint }}>Saved to profile</span>
                </div>
                <AddressFields
                  value={draftAddr}
                  onChange={(a) => {
                    setDraftAddr(a);
                    setErrors((p) => {
                      const next = { ...p };
                      delete next.line1;
                      delete next.city;
                      delete next.state;
                      delete next.pincode;
                      return next;
                    });
                  }}
                />
                {(errors.line1 || errors.city || errors.state || errors.pincode) && (
                  <p className="text-[12px] mt-2" style={{ color: T.danger }}>
                    {errors.line1 || errors.city || errors.state || errors.pincode}
                  </p>
                )}
                <div className="flex gap-2.5 mt-3.5">
                  <GoldBtn onClick={saveNewAddress}>Save address</GoldBtn>
                  {addresses.length > 0 && (
                    <GhostBtn onClick={() => { setAddAddrOpen(false); setDraftAddr(EMPTY_ADDR); setErrors({}); }}>Cancel</GhostBtn>
                  )}
                </div>
              </div>
            )}
            {errors.address && <p className="text-[12px] mt-2" style={{ color: T.danger }}>{errors.address}</p>}
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <GoldBtn onClick={continueFromAddress} disabled={addresses.length === 0 || addAddrOpen}>
              Continue to payment
            </GoldBtn>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-medium tracking-[0.06em] uppercase mb-2" style={{ color: T.faint }}>
              Payment method
            </div>
            <div className="grid grid-cols-3 gap-2">
              {METHOD_CHIPS.map((opt) => {
                const on = method === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setMethod(opt.value);
                      setErrors((p) => (p.method ? { ...p, method: "" } : p));
                    }}
                    className="h-10 px-2.5 rounded-[10px] text-[12.5px] font-medium cursor-pointer transition-colors"
                    style={
                      on
                        ? { background: T.accent, color: T.accentInk }
                        : { background: "rgba(89,82,54,0.06)", color: T.muted, border: `1px solid ${T.borderSoft}` }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {errors.method && <p className="text-[12px] mt-1.5" style={{ color: T.danger }}>{errors.method}</p>}
          </div>
          <Input
            value={reference}
            onChange={(v) => {
              setReference(v);
              setErrors((p) => (p.reference ? { ...p, reference: "" } : p));
            }}
            error={errors.reference}
            label="Payment reference / transaction ID"
            placeholder="e.g. UTR, UPI ref, cheque number"
          />
          <Textarea
            value={notes}
            onChange={setNotes}
            label="Notes (optional)"
            placeholder="Any remarks for the payment record…"
            rows={2}
          />

          <div className="flex justify-end gap-2.5 pt-1">
            {requireAddress ? (
              <GhostBtn onClick={() => setStep("address")}>Back</GhostBtn>
            ) : null}
            <GoldBtn onClick={confirmPayment}>Confirm payment</GoldBtn>
          </div>
        </div>
      )}
    </Modal>
  );
}
