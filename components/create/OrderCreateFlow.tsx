"use client";
import { useMemo, useState } from "react";
import { PageHeader, Card, GoldBtn, GhostBtn, Chip, Input, Select, Modal, Toast } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS } from "@/lib/mock";
import { STONES, DESIGNS, ENERGISATION, inr, imgFit } from "@/lib/catalog";
import type { FulfillmentDetails } from "@/lib/store/leads";

/*
 * Shared order-create stepper — used by Admin (commits directly) and Sales
 * (submits for admin approval). Left: step rail · Center: active step · Right:
 * live order summary. Behaviour is identical; only the submit action differs.
 */

export interface OrderFlowSubmit {
  customerName: string;
  summary: string;
  subtotal: number;
  discount: number;
  total: number;
  image?: string;
  isCustom?: boolean;
  refs?: string[];
  details?: FulfillmentDetails;
}

interface OrderCreateFlowProps {
  headerTitle?: string;
  submitLabel: string;
  successMessage: string;
  onBack: () => void;
  onSubmit: (payload: OrderFlowSubmit) => void;
  onDone: () => void;
  prefill?: { customerId?: string; stoneSku?: string };
}

type Addr = { line1: string; line2: string; city: string; state: string; pincode: string };
const EMPTY_ADDR: Addr = { line1: "", line2: "", city: "", state: "", pincode: "" };
const fmtAddr = (a: Addr) => [a.line1, a.line2, a.city, a.state && a.pincode ? `${a.state} ${a.pincode}` : a.state || a.pincode].filter(Boolean).join(", ");

type CustomStone = { gem: string; gemName: string; english: string; ratti: string; carat: string; origin: string; shade: string; shadeHex: string; treatment: string; price: string };

const GEM_OPTIONS = [
  { value: "pukhraj", label: "Pukhraj · Yellow Sapphire", english: "Yellow Sapphire", gemName: "Pukhraj" },
  { value: "manik", label: "Manik · Ruby", english: "Ruby", gemName: "Manik" },
  { value: "neelam", label: "Neelam · Blue Sapphire", english: "Blue Sapphire", gemName: "Neelam" },
  { value: "panna", label: "Panna · Emerald", english: "Emerald", gemName: "Panna" },
];
const TREATMENT_OPTIONS = [
  { value: "Natural · Unheated", label: "Natural · Unheated" },
  { value: "Natural · Untreated", label: "Natural · Untreated" },
];
const SHADE_SWATCHES = ["#e7c14a", "#c0392b", "#2a4a8a", "#1f7a4d", "#d98324", "#7d5ba6", "#4a4a4a"];

const FORMS = ["Ring", "Pendant", "Bracelet", "Loose stone"] as const;
const METAL_OPTIONS = [
  { value: "22K Gold", label: "22K Gold" },
  { value: "18K Gold", label: "18K Gold" },
  { value: "Silver", label: "Silver" },
  { value: "Panchdhatu", label: "Panchdhatu" },
];

const eyebrow = "text-[11px] font-medium tracking-[0.06em] uppercase";

/* DD/MM/YYYY — auto-insert slashes as digits are typed */
const fmtDob = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join("/");
};

/* ─── Field-by-field address ─── */
function AddressFields({ value, onChange }: { value: Addr; onChange: (a: Addr) => void }) {
  const set = (k: keyof Addr, v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3">
      <Input value={value.line1} onChange={(v) => set("line1", v)} label="Address line 1" placeholder="House / flat no., building, street" required />
      <Input value={value.line2} onChange={(v) => set("line2", v)} label="Address line 2 (optional)" placeholder="Landmark, area" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input value={value.city} onChange={(v) => set("city", v)} label="City" placeholder="e.g. Mumbai" required />
        <Input value={value.state} onChange={(v) => set("state", v)} label="State" placeholder="e.g. Maharashtra" required />
        <Input value={value.pincode} onChange={(v) => set("pincode", v.replace(/[^0-9]/g, ""))} label="Pincode" inputMode="numeric" maxLength={6} placeholder="e.g. 400001" required />
      </div>
    </div>
  );
}

export function OrderCreateFlow({ headerTitle = "Create order", submitLabel, successMessage, onBack, onSubmit, onDone, prefill }: OrderCreateFlowProps) {
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);

  // Customer
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerId, setCustomerId] = useState(prefill?.customerId ?? "");
  const [newCustomer, setNewCustomer] = useState<{ name: string; phone: string; email: string } | null>(null);
  const [birth, setBirth] = useState({ date: "", time: "", place: "" });
  const [homeAddr, setHomeAddr] = useState<Addr>(EMPTY_ADDR);

  // Delivery address — list of labelled addresses + selection
  const [addresses, setAddresses] = useState<{ label: string; text: string }[]>(() => {
    const c = prefill?.customerId ? MOCK_CUSTOMERS.find((x) => x.id === prefill.customerId) : undefined;
    return c?.shippingAddress ? [{ label: "Home", text: c.shippingAddress }] : [];
  });
  const [selectedAddrIdx, setSelectedAddrIdx] = useState(0);
  const [addAddrOpen, setAddAddrOpen] = useState(false);
  const [draftAddr, setDraftAddr] = useState<Addr>(EMPTY_ADDR);

  // Stone
  const [stoneQuery, setStoneQuery] = useState("");
  const [stoneSku, setStoneSku] = useState("");
  const [customStone, setCustomStone] = useState<CustomStone | null>(null);
  const [stoneModalOpen, setStoneModalOpen] = useState(false);
  const [draftStone, setDraftStone] = useState<CustomStone>({ gem: "pukhraj", gemName: "Pukhraj", english: "Yellow Sapphire", ratti: "", carat: "", origin: "", shade: "", shadeHex: SHADE_SWATCHES[0], treatment: "Natural · Unheated", price: "" });

  // Design / setting
  const [form, setForm] = useState<string>("Ring");
  const [designSlug, setDesignSlug] = useState("");
  const [designQuery, setDesignQuery] = useState("");
  const [previewSlug, setPreviewSlug] = useState("");
  const [customDesign, setCustomDesign] = useState(false);
  const [cdMetal, setCdMetal] = useState("");
  const [cdCarat, setCdCarat] = useState("");
  const [cdPrice, setCdPrice] = useState("");
  const [cdImages, setCdImages] = useState<string[]>([]);
  const [cdDrive, setCdDrive] = useState("");
  const [cdDrag, setCdDrag] = useState(false);

  // Energisation + pricing
  const [energisationKey, setEnergisationKey] = useState("shuddhi");
  const [discount, setDiscount] = useState("");
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<"success" | "error" | "info">("success");

  const selectedCustomer = MOCK_CUSTOMERS.find((c) => c.id === customerId);
  const customer = newCustomer ?? selectedCustomer;
  const selectedStone = STONES.find((s) => s.sku === stoneSku);
  const selectedDesign = DESIGNS.find((d) => d.slug === designSlug);
  const previewDesign = DESIGNS.find((d) => d.slug === previewSlug);
  const energisation = ENERGISATION.find((e) => e.key === energisationKey);

  const customerMatches = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return MOCK_CUSTOMERS.slice(0, 6);
    return MOCK_CUSTOMERS.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))).slice(0, 6);
  }, [customerQuery]);

  const stoneMatches = useMemo(() => {
    const q = stoneQuery.trim().toLowerCase();
    if (!q) return STONES.slice(0, 8);
    return STONES.filter((s) =>
      s.gemName.toLowerCase().includes(q) ||
      s.english.toLowerCase().includes(q) ||
      s.sku.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      String(s.ratti).includes(q),
    ).slice(0, 12);
  }, [stoneQuery]);

  const designMatches = useMemo(() => {
    if (!form || form === "Loose stone") return [];
    const q = designQuery.trim().toLowerCase();
    return DESIGNS.filter((d) => d.form === form && (!q || d.name.toLowerCase().includes(q) || d.metal.toLowerCase().includes(q)));
  }, [form, designQuery]);

  // ─── selection helpers ───
  const pickCustomer = (id: string) => {
    const c = MOCK_CUSTOMERS.find((x) => x.id === id);
    if (!c) return;
    setCustomerId(id);
    setNewCustomer(null);
    setCustomerQuery("");
    setCustomerOpen(false);
    setAddresses(c.shippingAddress ? [{ label: "Home", text: c.shippingAddress }] : []);
    setSelectedAddrIdx(0);
  };
  const startNewCustomer = () => {
    setNewCustomer({ name: customerQuery.trim(), phone: "", email: "" });
    setCustomerId("");
    setCustomerQuery("");
    setCustomerOpen(false);
    setHomeAddr(EMPTY_ADDR);
    setAddresses([]);
  };
  const clearCustomer = () => { setCustomerId(""); setNewCustomer(null); setAddresses([]); setHomeAddr(EMPTY_ADDR); };

  const saveNewAddress = () => {
    if (!draftAddr.line1 || !draftAddr.city || !draftAddr.pincode) return;
    const next = [...addresses, { label: `Address ${addresses.length + 1}`, text: fmtAddr(draftAddr) }];
    setAddresses(next);
    setSelectedAddrIdx(next.length - 1);
    setDraftAddr(EMPTY_ADDR);
    setAddAddrOpen(false);
  };

  const pickStone = (sku: string) => { setStoneSku(sku); setCustomStone(null); setStoneQuery(""); };
  const saveCustomStone = () => {
    if (!draftStone.ratti || !draftStone.price) return;
    setCustomStone(draftStone);
    setStoneSku("");
    setStoneModalOpen(false);
  };

  // ─── amounts ───
  const stoneAmount = customStone ? Number(customStone.price) || 0 : selectedStone ? selectedStone.price : 0;
  const settingAmount = form === "Loose stone" ? 0 : customDesign ? Number(cdPrice) || 0 : selectedDesign ? selectedDesign.price : 0;
  const energisationAmount = energisation?.fee ?? 0;
  const discountAmount = Number(discount) || 0;
  const subtotal = stoneAmount + settingAmount + energisationAmount;
  const total = Math.max(0, subtotal - discountAmount);

  const deliveryText = newCustomer ? fmtAddr(homeAddr) : addresses[selectedAddrIdx]?.text || "";
  const stoneLabel = customStone ? `${customStone.gemName} ${customStone.ratti}r` : selectedStone ? `${selectedStone.gemName} ${selectedStone.ratti}r` : "";
  const designLabel = form === "Loose stone" ? "Loose stone" : customDesign ? `Custom ${form || "design"}` : selectedDesign ? selectedDesign.name : form || "";

  // ─── step completion ───
  const customerDone = (newCustomer ? !!(newCustomer.name && newCustomer.phone && birth.date && birth.time && birth.place && homeAddr.line1 && homeAddr.city && homeAddr.pincode) : !!selectedCustomer && !!deliveryText);
  const stoneDone = !!selectedStone || !!customStone;
  const designDone = form === "Loose stone" || (customDesign ? !!(cdMetal && cdPrice) : !!selectedDesign);
  const stepDone = [customerDone, stoneDone, designDone, true];

  // First unfinished requirement (discount is optional, so excluded)
  const pending = !customerDone
    ? { step: 0, msg: newCustomer ? "Complete the new customer's details & address" : "Select a customer and delivery address" }
    : !stoneDone
      ? { step: 1, msg: "Pick a stone or add a custom one" }
      : !designDone
        ? { step: 2, msg: "Choose a design or keep it a loose stone" }
        : null;
  const canCreate = !pending;

  const goTo = (i: number) => { if (i <= reached) setStep(i); };
  const next = () => {
    if (!stepDone[step]) return;
    const n = Math.min(step + 1, STEPS.length - 1);
    setStep(n);
    setReached((r) => Math.max(r, n));
  };

  const handleCreate = () => {
    const details: FulfillmentDetails = {
      stone: {
        name: customStone ? `${customStone.gemName} · ${customStone.english}` : selectedStone ? `${selectedStone.gemName} · ${selectedStone.english}` : "",
        sub: customStone ? [`${customStone.ratti} ratti`, customStone.origin, customStone.treatment].filter(Boolean).join(" · ") : selectedStone ? `${selectedStone.ratti} ratti · ${selectedStone.origin} · ${selectedStone.sku}` : undefined,
        price: stoneAmount,
        shadeHex: customStone ? customStone.shadeHex : selectedStone?.shadeHex,
        custom: !!customStone,
      },
      design: form === "Loose stone"
        ? { name: "Loose stone", sub: "No setting — ships loose" }
        : customDesign
          ? { name: `Custom ${form.toLowerCase()}`, sub: [cdMetal, cdCarat && `${cdCarat} ct`].filter(Boolean).join(" · ") || undefined, price: settingAmount, custom: true, refs: [...cdImages, ...(cdDrive ? [cdDrive] : [])] }
          : selectedDesign
            ? { name: selectedDesign.name, sub: `${selectedDesign.metal} · From library`, price: settingAmount, image: selectedDesign.image, custom: false }
            : undefined,
      energisation: energisation ? { name: energisation.name, fee: energisationAmount } : undefined,
      deliverTo: deliveryText || undefined,
      lineItems: [
        { label: "Stone", amount: stoneAmount },
        ...(settingAmount > 0 ? [{ label: "Making", amount: settingAmount }] : []),
        { label: "Energisation", amount: energisationAmount },
        ...(discountAmount > 0 ? [{ label: "Discount", amount: -discountAmount }] : []),
      ],
    };
    onSubmit({
      customerName: customer?.name || "New customer",
      summary: [stoneLabel, designLabel].filter(Boolean).join(" · "),
      subtotal,
      discount: discountAmount,
      total,
      image: !customDesign && form !== "Loose stone" ? selectedDesign?.image : undefined,
      isCustom: customDesign || !!customStone,
      refs: customDesign ? [...cdImages, ...(cdDrive ? [cdDrive] : [])] : undefined,
      details,
    });
    setToastTone("success");
    setToast(successMessage);
    setTimeout(onDone, 900);
  };

  // Rail button: if something's pending, jump to it and say what's missing; else submit.
  const attemptCreate = () => {
    if (pending) {
      setStep(pending.step);
      setReached((r) => Math.max(r, pending.step));
      setToastTone("info");
      setToast(pending.msg);
      setTimeout(() => setToast(""), 2600);
      return;
    }
    handleCreate();
  };

  const STEPS = [
    { key: "customer", label: "Customer", sub: "Who is this order for" },
    { key: "stone", label: "Stone", sub: "Pick or add a gemstone" },
    { key: "design", label: "Design", sub: "Setting or loose" },
    { key: "energisation", label: "Energisation", sub: "Ritual tier" },
  ];

  const suggestionRow = "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-[9px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.10)]";

  return (
    <>
      <PageHeader title={headerTitle} back={{ label: "Back", onClick: onBack }} />

      <div className="grid grid-cols-1 lg:grid-cols-[210px_1fr_330px] gap-5 items-start pb-6">
        {/* ── Stepper rail ── */}
        <nav className="lg:sticky lg:top-4">
          <ol className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {STEPS.map((s, i) => {
              const active = i === step;
              const done = i < reached || (stepDone[i] && i !== step);
              const clickable = i <= reached;
              return (
                <li key={s.key} className="shrink-0">
                  <button
                    onClick={() => goTo(i)}
                    disabled={!clickable}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-left transition-colors"
                    style={{ background: active ? T.accentFaint : "transparent", cursor: clickable ? "pointer" : "default", opacity: clickable ? 1 : 0.5 }}
                  >
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0" style={done ? { background: T.good, color: "#fff" } : active ? { background: T.accent, color: T.accentInk } : { background: "rgba(89,82,54,0.09)", color: T.faint }}>
                      {done ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20 6 9 17l-5-5" /></svg> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold whitespace-nowrap" style={{ color: active || done ? T.text : T.muted }}>{s.label}</span>
                      <span className="hidden lg:block text-[11px]" style={{ color: T.faint }}>{s.sub}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ── Step content ── */}
        <div className="min-w-0">
          <Card className="!p-6">
            {/* STEP 1 — CUSTOMER */}
            {step === 0 && (
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Customer</h2>
                <p className="text-[12.5px] mt-0.5 mb-4" style={{ color: T.muted }}>Search an existing customer or add a new one.</p>

                {!customer ? (
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: T.faint }}><circle cx="11" cy="11" r="7" strokeWidth="1.5" /><path d="m16 16 4 4" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    <input value={customerQuery} onChange={(e) => { setCustomerQuery(e.target.value); setCustomerOpen(true); }} onFocusCapture={() => setCustomerOpen(true)} placeholder="Type a name, phone, or email…" className="w-full h-11 pl-9 pr-3 rounded-[10px] text-[14px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]" style={{ background: T.popover, border: `1px solid ${T.border}`, color: T.text }} />
                    {customerOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setCustomerOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-[12px] p-1.5 max-h-[320px] overflow-y-auto" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
                          <button onClick={startNewCustomer} className={suggestionRow} style={{ color: T.accent }}>
                            <span className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ border: `1px dashed ${T.accentBorder}` }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14" /></svg></span>
                            <span className="text-[13px] font-medium">Add new customer{customerQuery.trim() ? ` “${customerQuery.trim()}”` : ""}</span>
                          </button>
                          {customerMatches.length > 0 && <div className="my-1 mx-2 h-px" style={{ background: T.borderSoft }} />}
                          {customerMatches.map((c) => (
                            <button key={c.id} onClick={() => pickCustomer(c.id)} className={suggestionRow}>
                              <span className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[12px] font-semibold shrink-0" style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}`, color: T.accent }}>{c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium truncate" style={{ color: T.text }}>{c.name}</span><span className="block text-[11.5px] truncate" style={{ color: T.muted }}>{c.phone} · {c.email}</span></span>
                            </button>
                          ))}
                          {customerMatches.length === 0 && customerQuery.trim() && <div className="px-3 py-2 text-[12.5px]" style={{ color: T.faint }}>No customers match “{customerQuery}”.</div>}
                        </div>
                      </>
                    )}
                  </div>
                ) : newCustomer ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className={eyebrow} style={{ color: T.faint }}>New customer</span>
                      <button onClick={clearCustomer} className="inline-flex items-center gap-1.5 text-[12px] font-medium h-8 px-3 rounded-[9px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]" style={{ color: T.muted, border: `1px solid ${T.border}` }}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M10 3.5 5.5 8 10 12.5" /></svg>Back to search</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input value={newCustomer.name} onChange={(v) => setNewCustomer((p) => p && { ...p, name: v })} label="Name" placeholder="e.g. Priya Sharma" required />
                      <Input value={newCustomer.phone} onChange={(v) => setNewCustomer((p) => p && { ...p, phone: v })} label="Phone / WhatsApp" type="tel" placeholder="+91 98765 43210" required />
                      <Input value={newCustomer.email} onChange={(v) => setNewCustomer((p) => p && { ...p, email: v })} label="Email (optional)" type="email" placeholder="priya@example.com" />
                    </div>
                    <div>
                      <div className={`${eyebrow} mb-1.5`} style={{ color: T.faint }}>Birth details (for the chart)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input value={birth.date} onChange={(v) => setBirth((p) => ({ ...p, date: fmtDob(v) }))} label="Birth date" placeholder="DD / MM / YYYY" inputMode="numeric" maxLength={10} required />
                        <Input value={birth.time} onChange={(v) => setBirth((p) => ({ ...p, time: v }))} label="Birth time" placeholder="10:30 AM" required />
                        <Input value={birth.place} onChange={(v) => setBirth((p) => ({ ...p, place: v }))} label="Birth place" placeholder="Kochi, Kerala" required />
                      </div>
                    </div>
                    <div>
                      <div className={`${eyebrow} mb-1.5`} style={{ color: T.faint }}>Home / delivery address</div>
                      <AddressFields value={homeAddr} onChange={setHomeAddr} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 rounded-[12px] px-3.5 py-3" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}` }}>
                      <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[13px] font-semibold shrink-0" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, color: T.accent }}>{selectedCustomer!.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                      <div className="min-w-0 flex-1"><div className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>{selectedCustomer!.name}</div><div className="text-[12px] truncate" style={{ color: T.muted }}>{selectedCustomer!.phone} · {selectedCustomer!.email}</div></div>
                      <button onClick={clearCustomer} className="text-[12px] font-medium shrink-0 cursor-pointer hover:underline underline-offset-4" style={{ color: T.accent }}>Change</button>
                    </div>

                    {/* Delivery address picker */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={eyebrow} style={{ color: T.faint }}>Deliver to</span>
                        {!addAddrOpen && <button onClick={() => { setAddAddrOpen(true); setDraftAddr(EMPTY_ADDR); }} className="text-[12px] font-medium cursor-pointer hover:underline underline-offset-4" style={{ color: T.accent }}>+ Add new address</button>}
                      </div>
                      <div className="space-y-2">
                        {addresses.map((a, i) => {
                          const on = selectedAddrIdx === i;
                          return (
                            <button key={i} onClick={() => setSelectedAddrIdx(i)} className="w-full flex items-start gap-2.5 text-left rounded-[10px] px-3.5 py-2.5 transition-colors" style={{ background: on ? T.accentFaint : T.popover, border: `1px solid ${on ? T.accentBorder : T.border}` }}>
                              <span className="mt-0.5 w-[15px] h-[15px] rounded-full flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${on ? T.accent : "rgba(89,82,54,0.3)"}` }}>{on && <span className="w-[7px] h-[7px] rounded-full" style={{ background: T.accent }} />}</span>
                              <span className="min-w-0"><span className="flex items-center gap-2"><span className="text-[12.5px] font-medium" style={{ color: T.text }}>{a.label}</span>{i === 0 && <Chip tone="muted">On file</Chip>}</span><span className="block text-[12px] mt-0.5" style={{ color: T.muted }}>{a.text}</span></span>
                            </button>
                          );
                        })}
                        {addresses.length === 0 && !addAddrOpen && <p className="text-[12.5px]" style={{ color: T.faint }}>No address on file. Add a delivery address.</p>}
                      </div>
                      {addAddrOpen && (
                        <div className="mt-3 rounded-[12px] p-4" style={{ background: "rgba(119,123,98,0.07)", border: `1px solid ${T.accentBorder}` }}>
                          <div className="flex items-center justify-between mb-3"><span className="text-[12.5px] font-semibold" style={{ color: T.text }}>New delivery address</span><span className="text-[11px]" style={{ color: T.faint }}>Saved to profile</span></div>
                          <AddressFields value={draftAddr} onChange={setDraftAddr} />
                          <div className="flex gap-2.5 mt-3.5"><GoldBtn onClick={saveNewAddress}>Save address</GoldBtn><GhostBtn onClick={() => setAddAddrOpen(false)}>Cancel</GhostBtn></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2 — STONE */}
            {step === 1 && (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div><h2 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Stone</h2><p className="text-[12.5px] mt-0.5" style={{ color: T.muted }}>Search by stone name or ratti, or add a custom stone.</p></div>
                  <button onClick={() => setStoneModalOpen(true)} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium h-9 px-3.5 rounded-[9px] cursor-pointer transition-colors shrink-0 hover:bg-[rgba(119,123,98,0.08)]" style={{ color: T.accent, border: `1px solid ${T.accentBorder}` }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14" /></svg>Add custom stone</button>
                </div>

                {customStone ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[12px] px-3.5 py-3" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}` }}>
                    <span className="w-9 h-9 rounded-[10px] shrink-0" style={{ background: customStone.shadeHex, border: `1px solid ${T.borderSoft}` }} />
                    <div className="min-w-0 flex-1"><div className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>{customStone.gemName} · {customStone.english} <Chip tone="gold">Custom</Chip></div><div className="text-[12px] truncate" style={{ color: T.muted }}>{customStone.ratti}r{customStone.origin ? ` · ${customStone.origin}` : ""}{customStone.treatment ? ` · ${customStone.treatment}` : ""}</div></div>
                    <div className="flex items-center gap-3 shrink-0"><span className="text-[14px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(Number(customStone.price) || 0)}</span><button onClick={() => setCustomStone(null)} className="text-[12px] font-medium cursor-pointer hover:underline underline-offset-4" style={{ color: T.accent }}>Change</button></div>
                  </div>
                ) : selectedStone ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[12px] px-3.5 py-3" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}` }}>
                    <span className="w-9 h-9 rounded-[10px] shrink-0" style={{ background: selectedStone.shadeHex, border: `1px solid ${T.borderSoft}` }} />
                    <div className="min-w-0 flex-1"><div className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>{selectedStone.gemName} · {selectedStone.english}</div><div className="text-[12px] truncate" style={{ color: T.muted }}>{selectedStone.ratti}r · {selectedStone.origin} · {selectedStone.sku}</div></div>
                    <div className="flex items-center gap-3 shrink-0"><span className="text-[14px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(selectedStone.price)}</span><button onClick={() => setStoneSku("")} className="text-[12px] font-medium cursor-pointer hover:underline underline-offset-4" style={{ color: T.accent }}>Change</button></div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="relative">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: T.faint }}><circle cx="11" cy="11" r="7" strokeWidth="1.5" /><path d="m16 16 4 4" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      <input value={stoneQuery} onChange={(e) => setStoneQuery(e.target.value)} placeholder="Search stone, ratti, origin, SKU…" className="w-full h-11 pl-9 pr-3 rounded-[10px] text-[14px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]" style={{ background: T.popover, border: `1px solid ${T.border}`, color: T.text }} />
                    </div>
                    <div className="mt-2 rounded-[12px] overflow-hidden max-h-[340px] overflow-y-auto" style={{ border: `1px solid ${T.borderSoft}` }}>
                      {stoneMatches.map((s, i) => (
                        <button key={s.sku} onClick={() => pickStone(s.sku)} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[rgba(119,123,98,0.06)]" style={{ borderTop: i > 0 ? `1px solid ${T.borderSoft}` : undefined }}>
                          <span className="w-8 h-8 rounded-[9px] shrink-0" style={{ background: s.shadeHex, border: `1px solid ${T.borderSoft}` }} />
                          <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium truncate" style={{ color: T.text }}>{s.gemName} · {s.english}</span><span className="block text-[11.5px] truncate" style={{ color: T.muted }}>{s.ratti}r · {s.origin} · {s.sku}</span></span>
                          <span className="text-[13px] font-semibold tabular-nums shrink-0" style={{ color: T.text }}>{inr(s.price)}</span>
                        </button>
                      ))}
                      {stoneMatches.length === 0 && <div className="px-3.5 py-4 text-[12.5px] text-center" style={{ color: T.faint }}>No stones match “{stoneQuery}”. Try a different name or ratti — or add a custom stone.</div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 — DESIGN */}
            {step === 2 && (
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Design</h2>
                <p className="text-[12.5px] mt-0.5 mb-4" style={{ color: T.muted }}>Choose a setting and a design, or keep it a loose stone.</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {FORMS.map((f) => (
                    <button key={f} onClick={() => { setForm(f); setDesignSlug(""); setCustomDesign(false); setDesignQuery(""); }} className="h-9 px-4 rounded-full text-[13px] cursor-pointer transition-colors" style={form === f ? { background: T.accent, color: T.accentInk, fontWeight: 600 } : { background: "rgba(89,82,54,0.06)", color: T.muted }}>{f}</button>
                  ))}
                </div>

                {form && form !== "Loose stone" && (
                  <>
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div className="inline-flex p-0.5 rounded-[10px]" style={{ background: "rgba(89,82,54,0.08)" }}>
                        <button onClick={() => setCustomDesign(false)} className="h-8 px-3.5 rounded-[8px] text-[12.5px] cursor-pointer transition-all duration-150" style={!customDesign ? { background: T.card, color: T.text, fontWeight: 600, boxShadow: "0 1px 2px rgba(43,42,34,0.10)" } : { background: "transparent", color: T.muted, fontWeight: 500 }}>From library</button>
                        <button onClick={() => setCustomDesign(true)} className="h-8 px-3.5 rounded-[8px] text-[12.5px] cursor-pointer transition-all duration-150" style={customDesign ? { background: T.card, color: T.text, fontWeight: 600, boxShadow: "0 1px 2px rgba(43,42,34,0.10)" } : { background: "transparent", color: T.muted, fontWeight: 500 }}>Custom design</button>
                      </div>
                      {!customDesign && (
                        <div className="relative flex-1 min-w-[180px] sm:max-w-[240px] sm:flex-initial">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: T.faint }}><circle cx="11" cy="11" r="7" strokeWidth="1.6" /><path d="m16 16 4 4" strokeWidth="1.6" strokeLinecap="round" /></svg>
                          <input value={designQuery} onChange={(e) => setDesignQuery(e.target.value)} placeholder={`Search ${form.toLowerCase()} designs…`} className="w-full h-8 pl-8 pr-3 rounded-[9px] text-[13px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]" style={{ background: T.popover, border: `1px solid ${T.border}`, color: T.text }} />
                        </div>
                      )}
                    </div>

                    {!customDesign ? (
                      <div className="max-h-[420px] overflow-y-auto -mx-1 px-1">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                          {designMatches.map((d) => {
                            const on = designSlug === d.slug;
                            return (
                              <button key={d.slug} onClick={() => setPreviewSlug(d.slug)} className="group relative text-left rounded-[12px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5" style={{ background: T.card, border: `1.5px solid ${on ? T.accent : T.borderSoft}`, boxShadow: on ? `0 0 0 3px rgba(119,123,98,0.18), ${T.shadow}` : T.shadow }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <span className="block aspect-square w-full" style={{ background: T.bg }}><img src={d.image} alt={d.name} className={`w-full h-full ${imgFit(d.image)}`} /></span>
                                {on && <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: T.accent, color: T.accentInk }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M20 6 9 17l-5-5" /></svg></span>}
                                <span className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center py-1 text-[10px] font-medium" style={{ background: "rgba(41,38,23,0.55)", color: "#faf6ec" }}>View</span>
                                <span className="block p-2"><span className="block text-[11.5px] font-semibold truncate" style={{ color: T.text }}>{d.name}</span><span className="block text-[11px] font-semibold tabular-nums mt-0.5" style={{ color: T.muted }}>{inr(d.price)}</span></span>
                              </button>
                            );
                          })}
                        </div>
                        {designMatches.length === 0 && <p className="text-[12.5px] py-4 text-center" style={{ color: T.faint }}>No {form?.toLowerCase()} designs yet — try Custom design.</p>}
                      </div>
                    ) : (
                      <div className="rounded-[16px] p-5" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: "inset 0 0 0 1px rgba(160,125,56,0.10)" }}>
                        <div className="flex items-center gap-2 pb-3.5 mb-4" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                          <span className="w-6 h-6 rounded-[7px] flex items-center justify-center shrink-0" style={{ background: T.accentFaint, color: T.accent }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></span>
                          <div><div className="text-[13.5px] font-semibold" style={{ color: T.text }}>Custom {form.toLowerCase()}</div><div className="text-[11.5px]" style={{ color: T.faint }}>Specify the metal and share references for the workshop.</div></div>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                            <Select value={cdMetal} onChange={setCdMetal} label="Metal" options={[{ value: "", label: "Select metal" }, ...METAL_OPTIONS]} placeholder="Select metal" />
                            <Input value={cdCarat} onChange={(v) => setCdCarat(v.replace(/[^0-9.]/g, ""))} label="Carat (optional)" inputMode="numeric" placeholder="e.g. 6" />
                            <Input value={cdPrice} onChange={(v) => setCdPrice(v.replace(/[^0-9]/g, ""))} label="Making charge (₹)" inputMode="numeric" placeholder="e.g. 18500" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                            <div>
                              <div className="block text-[11px] tracking-[0.12em] uppercase mb-1.5" style={{ color: T.faint }}>Reference images</div>
                              <div
                                className="rounded-[9px] h-10 px-3.5 flex items-center justify-center gap-2 text-center transition-colors cursor-pointer"
                                style={{ border: `1.5px dashed ${cdDrag ? T.accent : cdImages.length ? T.good : T.border}`, background: cdDrag ? "rgba(119,123,98,0.06)" : T.bg }}
                                onDragOver={(e) => { e.preventDefault(); setCdDrag(true); }}
                                onDragLeave={() => setCdDrag(false)}
                                onDrop={(e) => { e.preventDefault(); setCdDrag(false); const names = Array.from(e.dataTransfer.files).map((f) => f.name); if (names.length) setCdImages((p) => [...p, ...names]); }}
                                onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.multiple = true; inp.accept = "image/*"; inp.onchange = (e) => { const names = Array.from((e.target as HTMLInputElement).files ?? []).map((f) => f.name); if (names.length) setCdImages((p) => [...p, ...names]); }; inp.click(); }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={cdImages.length ? T.good : T.muted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
                                <span className="text-[12.5px] font-medium" style={{ color: cdImages.length ? T.good : T.muted }}>{cdImages.length ? `${cdImages.length} image${cdImages.length > 1 ? "s" : ""} added` : "Drop or click · multiple"}</span>
                              </div>
                            </div>
                            <Input value={cdDrive} onChange={setCdDrive} label="Or reference link (optional)" placeholder="https://drive.google.com/…" />
                          </div>
                          {cdImages.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {cdImages.map((n, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1 rounded-full text-[11.5px]" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }}>{n}<button onClick={() => setCdImages((p) => p.filter((_, x) => x !== i))} className="w-[18px] h-[18px] rounded-full inline-flex items-center justify-center cursor-pointer hover:bg-[rgba(89,82,54,0.14)]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-2.5 h-2.5"><path d="M18 6 6 18M6 6l12 12" /></svg></button></span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {form === "Loose stone" && <p className="text-[13px] rounded-[10px] px-3.5 py-3" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.muted }}>No setting — the stone ships loose.</p>}
              </div>
            )}

            {/* STEP 4 — ENERGISATION */}
            {step === 3 && (
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Energisation</h2>
                <p className="text-[12.5px] mt-0.5 mb-4" style={{ color: T.muted }}>Choose the ritual tier for this stone.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ENERGISATION.map((e) => {
                    const active = energisationKey === e.key;
                    return (
                      <button key={e.key} onClick={() => setEnergisationKey(e.key)} className="text-left rounded-[12px] px-4 py-3 cursor-pointer transition-all duration-150" style={{ background: active ? T.accentFaint : T.popover, border: `1px solid ${active ? T.accentBorder : T.borderSoft}`, boxShadow: active ? `inset 0 0 0 1px ${T.accentBorder}` : "none" }}>
                        <div className="flex items-baseline justify-between gap-2"><span className="text-[13.5px] font-semibold" style={{ color: T.text }}>{e.name}</span><span className="text-[12.5px] font-semibold tabular-nums" style={{ color: e.fee === 0 ? T.good : T.text }}>{e.fee === 0 ? "Included" : inr(e.fee)}</span></div>
                        <div className="text-[11.5px] mt-0.5" style={{ color: T.muted }}>{e.duration}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step nav */}
            <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <GhostBtn onClick={() => (step === 0 ? onBack() : setStep(step - 1))}>{step === 0 ? "Cancel" : "← Back"}</GhostBtn>
              {step < STEPS.length - 1 ? (
                <GoldBtn onClick={next} disabled={!stepDone[step]}>Continue →</GoldBtn>
              ) : (
                <span className="text-[12px]" style={{ color: T.faint }}>Finish in the order summary →</span>
              )}
            </div>
          </Card>
        </div>

        {/* ── Live summary ── */}
        <aside className="lg:sticky lg:top-4">
          <Card className="!p-6">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Order summary</h2>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between gap-3"><span style={{ color: T.faint }}>Customer</span><span className="text-right font-medium min-w-0 truncate" style={{ color: customer ? T.text : T.faint }}>{customer ? customer.name || "New customer" : "—"}</span></div>
              {deliveryText && <div className="flex justify-between gap-3"><span style={{ color: T.faint }}>Deliver to</span><span className="text-right font-medium min-w-0 truncate" style={{ color: T.text }}>{deliveryText}</span></div>}
              <div className="flex justify-between gap-3"><span style={{ color: T.faint }}>Stone</span><span className="text-right font-medium min-w-0 truncate" style={{ color: stoneLabel ? T.text : T.faint }}>{stoneLabel || "—"}</span></div>
              <div className="flex justify-between gap-3"><span style={{ color: T.faint }}>Design</span><span className="text-right font-medium min-w-0 truncate" style={{ color: designLabel ? T.text : T.faint }}>{designLabel || "—"}</span></div>
              <div className="flex justify-between gap-3"><span style={{ color: T.faint }}>Energisation</span><span className="text-right font-medium" style={{ color: T.text }}>{energisation?.name}</span></div>
            </div>
            <div className="mt-4 pt-4 space-y-2 text-[13px] tabular-nums" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <div className="flex justify-between"><span style={{ color: T.muted }}>Stone</span><span style={{ color: T.text }}>{stoneAmount ? inr(stoneAmount) : "—"}</span></div>
              {settingAmount > 0 && <div className="flex justify-between"><span style={{ color: T.muted }}>Making</span><span style={{ color: T.text }}>{inr(settingAmount)}</span></div>}
              <div className="flex justify-between"><span style={{ color: T.muted }}>Energisation</span><span style={{ color: T.text }}>{energisationAmount === 0 ? "Free" : inr(energisationAmount)}</span></div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5" style={{ color: T.muted }}>Discount<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px]" style={{ color: T.faint }}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></span>
                <label className="group flex items-center h-9 rounded-[9px] pl-2.5 pr-2 cursor-text transition-shadow duration-200 focus-within:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]" style={{ background: T.card, border: `1px solid ${discount ? T.accent : T.accentBorder}`, boxShadow: `inset 0 1px 2px rgba(43,42,34,0.04)` }}>
                  <span className="text-[12.5px]" style={{ color: T.accent }}>−&nbsp;₹</span>
                  <input value={discount} onChange={(e) => setDiscount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0" className="w-[70px] h-full px-1.5 bg-transparent text-[13.5px] font-semibold tabular-nums text-right outline-none placeholder:font-normal" style={{ color: T.text }} aria-label="Discount amount" />
                </label>
              </div>
            </div>
            <div className="mt-4 pt-4 flex items-baseline justify-between" style={{ borderTop: `1px solid ${T.border}` }}>
              <span className="text-[13px] font-medium" style={{ color: T.muted }}>Total</span>
              <span className="font-title text-[22px] font-semibold tabular-nums tracking-[-0.01em]" style={{ color: T.text }}>{inr(total)}</span>
            </div>
            <div className="mt-4">
              <button
                onClick={attemptCreate}
                aria-disabled={!canCreate}
                className={`w-full inline-flex items-center justify-center gap-2 h-11 rounded-[11px] text-[13.5px] font-semibold transition-all duration-200 cursor-pointer ${canCreate ? "hover:-translate-y-px hover:brightness-[1.08] active:scale-[0.98]" : ""}`}
                style={canCreate ? { background: T.accent, color: T.accentInk, boxShadow: "inset 0 1px 0 rgba(244,241,229,0.14), 0 1px 2px rgba(43,42,34,0.1)" } : { background: "rgba(89,82,54,0.13)", color: T.faint }}
              >
                {submitLabel}
              </button>
              {pending && (
                <button onClick={() => { setStep(pending.step); setReached((r) => Math.max(r, pending.step)); }} className="w-full mt-2 flex items-center justify-center gap-1.5 text-[11.5px] cursor-pointer transition-colors group" style={{ color: T.accent }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                  <span className="group-hover:underline underline-offset-2">{pending.msg}</span>
                </button>
              )}
            </div>
          </Card>
        </aside>
      </div>

      {/* Custom stone modal */}
      <Modal open={stoneModalOpen} onClose={() => setStoneModalOpen(false)} title="Add a custom stone">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={draftStone.gem} onChange={(v) => { const g = GEM_OPTIONS.find((o) => o.value === v)!; setDraftStone((p) => ({ ...p, gem: v, gemName: g.gemName, english: g.english })); }} label="Gemstone" options={GEM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
            <Input value={draftStone.english} onChange={(v) => setDraftStone((p) => ({ ...p, english: v }))} label="Variety" placeholder="e.g. Yellow Sapphire" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input value={draftStone.ratti} onChange={(v) => setDraftStone((p) => ({ ...p, ratti: v.replace(/[^0-9.]/g, "") }))} label="Ratti" placeholder="e.g. 5.9" required />
            <Input value={draftStone.price} onChange={(v) => setDraftStone((p) => ({ ...p, price: v.replace(/[^0-9]/g, "") }))} label="Price (₹)" inputMode="numeric" placeholder="e.g. 250000" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input value={draftStone.origin} onChange={(v) => setDraftStone((p) => ({ ...p, origin: v }))} label="Origin (optional)" placeholder="e.g. Ceylon (Sri Lanka)" />
            <Select value={draftStone.treatment} onChange={(v) => setDraftStone((p) => ({ ...p, treatment: v }))} label="Treatment" options={TREATMENT_OPTIONS} />
          </div>
          <div className="flex justify-end gap-2.5 pt-1">
            <GhostBtn onClick={() => setStoneModalOpen(false)}>Cancel</GhostBtn>
            <GoldBtn onClick={saveCustomStone} disabled={!draftStone.ratti || !draftStone.price}>Add stone</GoldBtn>
          </div>
        </div>
      </Modal>

      {/* Design preview modal */}
      <Modal open={!!previewDesign} onClose={() => setPreviewSlug("")} title={previewDesign?.name ?? "Design"}>
        {previewDesign && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="rounded-[14px] overflow-hidden" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
              <img src={previewDesign.image} alt={previewDesign.name} className={`w-full aspect-square ${imgFit(previewDesign.image)}`} />
            </div>
            <div className="flex items-center justify-between gap-3 mt-4">
              <div className="min-w-0">
                <div className="text-[15px] font-semibold" style={{ color: T.text }}>{previewDesign.name}</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: T.muted }}>{previewDesign.metal} · {previewDesign.form}</div>
              </div>
              <div className="text-[18px] font-semibold tabular-nums shrink-0" style={{ color: T.text }}>{inr(previewDesign.price)}</div>
            </div>
            <div className="flex justify-end gap-2.5 mt-5">
              <GhostBtn onClick={() => setPreviewSlug("")}>Close</GhostBtn>
              {designSlug === previewDesign.slug ? (
                <GhostBtn onClick={() => { setDesignSlug(""); setPreviewSlug(""); }}>Remove selection</GhostBtn>
              ) : (
                <GoldBtn onClick={() => { setDesignSlug(previewDesign.slug); setPreviewSlug(""); }}>Select this design</GoldBtn>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Toast message={toast} tone={toastTone} />
    </>
  );
}
