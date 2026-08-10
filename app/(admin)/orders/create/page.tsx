"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, SearchFilter, Chip, Input, Select, StepIndicator, Modal } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS } from "@/lib/mock";
import { STONES, DESIGNS, ENERGISATION, inr } from "@/lib/catalog";

type Step = "customer" | "address" | "stone" | "design" | "energisation" | "review";
const STEPS: { key: Step; label: string }[] = [
  { key: "customer", label: "Customer" },
  { key: "address", label: "Address" },
  { key: "stone", label: "Stone" },
  { key: "design", label: "Design" },
  { key: "energisation", label: "Energisation" },
  { key: "review", label: "Review" },
];

export default function CreateOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("customer");
  const [search, setSearch] = useState("");
  const [animating, setAnimating] = useState(false);
  const [toast, setToast] = useState("");
  const [editStonePrice, setEditStonePrice] = useState("");
  const [editDesignPrice, setEditDesignPrice] = useState("");
  const [discount, setDiscount] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [stoneSku, setStoneSku] = useState("");
  const [designSlug, setDesignSlug] = useState("");
  const [energisationKey, setEnergisationKey] = useState("shuddhi");
  const [showCustomDesign, setShowCustomDesign] = useState(false);
  const [customDesign, setCustomDesign] = useState({ name: "", type: "", size: "", metal: "", price: "" });
  const [designForm, setDesignForm] = useState<"" | "Ring" | "Pendant" | "Bracelet" | "Loose" | "Custom">("Ring");
  const [designMetal, setDesignMetal] = useState("22K Gold");
  const [designSize, setDesignSize] = useState("");

  // New customer form
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });
  const [createdCustomer, setCreatedCustomer] = useState<{ id: string; name: string; email: string; phone: string } | null>(null);

  // Address step
  const [selectedAddress, setSelectedAddress] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ line1: "", line2: "", city: "", state: "", pincode: "" });

  const selectedCustomer = createdCustomer ?? MOCK_CUSTOMERS.find((c) => c.id === customerId);
  const selectedStone = STONES.find((s) => s.sku === stoneSku);
  const selectedDesign = DESIGNS.find((d) => d.slug === designSlug);
  const selectedEnergisation = ENERGISATION.find((e) => e.key === energisationKey);
  const hasCustomDesign = designSlug === "__custom" && !!customDesign.name;

  const existingAddress = !createdCustomer
    ? MOCK_CUSTOMERS.find((c) => c.id === customerId)?.shippingAddress
    : undefined;

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const canNavigateTo = (targetIndex: number) => {
    if (targetIndex === 0) return true;
    if (targetIndex === 1) return !!customerId || !!createdCustomer;
    if (targetIndex === 2) return (!!customerId || !!createdCustomer) && !!selectedAddress;
    if (targetIndex === 3) return (!!customerId || !!createdCustomer) && !!selectedAddress && !!stoneSku;
    if (targetIndex === 4) return (!!customerId || !!createdCustomer) && !!selectedAddress && !!stoneSku;
    if (targetIndex === 5) return (!!customerId || !!createdCustomer) && !!selectedAddress && !!stoneSku;
    return false;
  };

  const goTo = (target: Step) => {
    setAnimating(true);
    setTimeout(() => { setStep(target); setAnimating(false); }, 180);
  };

  const handleCreate = () => {
    setToast("Order created successfully");
    setTimeout(() => setToast(""), 3000);
    router.push("/orders");
  };

  const selectCustomer = (id: string) => {
    setCustomerId(id);
    setCreatedCustomer(null);
    setSearch("");
    setSelectedAddress("");
    setShowNewAddress(false);
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) return;
    const id = `cust_new_${Date.now()}`;
    setCreatedCustomer({ id, ...newCustomer });
    setCustomerId(id);
    setShowNewCustomer(false);
    setSearch("");
    setSelectedAddress("");
    setShowNewAddress(false);
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

  const selectStone = (sku: string) => {
    setStoneSku(sku);
    setSearch("");
  };

  const selectDesign = (slug: string) => {
    setDesignSlug(slug);
  };

  const skipDesign = () => {
    setDesignSlug("");
    setShowCustomDesign(false);
    setDesignForm("");
    setDesignMetal("");
    goTo("energisation");
  };

  const confirmCustomDesign = () => {
    if (!customDesign.name) return;
    setDesignSlug("__custom");
    setShowCustomDesign(false);
    goTo("energisation");
  };

  const confirmEnergisation = () => {
    goTo("review");
  };

  return (
    <>
      <PageHeader
        title="Create order"
        sub="Select stone, design, and energisation — order will be pending until payment"
        back={{ label: "Orders", onClick: () => router.push("/orders") }}
      />

      <StepIndicator
        steps={STEPS}
        currentIndex={stepIndex}
        onNavigate={(i) => goTo(STEPS[i].key)}
        canNavigateTo={canNavigateTo}
      />

      {/* Animated content wrapper */}
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
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Select customer</div>
              <button
                onClick={() => setShowNewCustomer(true)}
                className="text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                style={{ color: T.accent }}
              >
                + New customer
              </button>
            </div>

            {showNewCustomer ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium" style={{ color: T.accent }}>Add new customer</span>
                  <button onClick={() => setShowNewCustomer(false)} className="text-[11px] cursor-pointer" style={{ color: T.muted }}>← Back to list</button>
                </div>
                <Input
                  value={newCustomer.name}
                  onChange={(v) => setNewCustomer((p) => ({ ...p, name: v }))}
                  label="Full name"
                  placeholder="e.g. Priya Sharma"
                />
                <Input
                  value={newCustomer.email}
                  onChange={(v) => setNewCustomer((p) => ({ ...p, email: v }))}
                  label="Email"
                  placeholder="e.g. priya@example.com"
                />
                <Input
                  value={newCustomer.phone}
                  onChange={(v) => setNewCustomer((p) => ({ ...p, phone: v }))}
                  label="Mobile number"
                  placeholder="e.g. +91 98765 43210"
                />
                <div className="flex gap-2.5 pt-2">
                  <GoldBtn onClick={handleCreateCustomer}>Create & continue</GoldBtn>
                  <GhostBtn onClick={() => setShowNewCustomer(false)}>Cancel</GhostBtn>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search name, email…" />
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {MOCK_CUSTOMERS.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c.id)}
                      className="w-full flex items-center justify-between py-3 px-3 text-left rounded-[9px] transition-all duration-150 cursor-pointer hover:pl-4"
                      style={{
                        background: customerId === c.id ? "rgba(195,160,88,0.08)" : "transparent",
                        borderBottom: `1px solid ${T.borderSoft}`,
                      }}
                    >
                      <div>
                        <div className="text-[13px] font-medium" style={{ color: T.text }}>{c.name}</div>
                        <div className="text-[11.5px]" style={{ color: T.muted }}>{c.email} · {c.phone}</div>
                      </div>
                      {customerId === c.id && <span style={{ color: T.accent }}>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
            {customerId && (
              <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <GoldBtn onClick={() => goTo("address")}>Next →</GoldBtn>
              </div>
            )}
          </Card>
        )}

        {/* STEP: Address */}
        {step === "address" && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Select shipping address</div>
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

            {selectedCustomer && (
              <div className="text-[12px] mb-4 px-3 py-2 rounded-[8px]" style={{ background: "rgba(195,160,88,0.04)", color: T.muted }}>
                Shipping for <span style={{ color: T.text }}>{selectedCustomer.name}</span>
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
              <div className="space-y-2">
                {existingAddress && (
                  <button
                    onClick={() => selectAddress(existingAddress)}
                    className="w-full flex items-start justify-between py-3.5 px-4 text-left rounded-[10px] transition-all duration-150 cursor-pointer"
                    style={{
                      background: selectedAddress === existingAddress ? "rgba(195,160,88,0.08)" : T.bg,
                      border: `1px solid ${selectedAddress === existingAddress ? "rgba(195,160,88,0.4)" : T.borderSoft}`,
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-medium uppercase tracking-[0.05em]" style={{ color: T.faint }}>Saved address</span>
                        <Chip tone="gold">Default</Chip>
                      </div>
                      <div className="text-[13px]" style={{ color: T.text }}>{existingAddress}</div>
                    </div>
                    {selectedAddress === existingAddress && <span className="mt-1" style={{ color: T.accent }}>✓</span>}
                  </button>
                )}

                {!existingAddress && !createdCustomer && (
                  <div className="text-center py-8">
                    <p className="text-[13px] mb-3" style={{ color: T.muted }}>No saved address for this customer</p>
                    <GoldBtn onClick={() => setShowNewAddress(true)}>Add shipping address</GoldBtn>
                  </div>
                )}

                {createdCustomer && (
                  <div className="text-center py-8">
                    <p className="text-[13px] mb-3" style={{ color: T.muted }}>New customer — add a shipping address</p>
                    <GoldBtn onClick={() => setShowNewAddress(true)}>Add shipping address</GoldBtn>
                  </div>
                )}
              </div>
            )}
            {selectedAddress && (
              <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <GoldBtn onClick={() => goTo("stone")}>Next →</GoldBtn>
              </div>
            )}
          </Card>
        )}

        {/* STEP: Stone */}
        {step === "stone" && (
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Select stone from inventory</div>
            <div className="mb-3">
              <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search SKU, gemstone…" />
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {STONES.filter((s) => !search || s.sku.toLowerCase().includes(search.toLowerCase()) || s.gemName.toLowerCase().includes(search.toLowerCase())).slice(0, 30).map((s) => (
                <button
                  key={s.sku}
                  onClick={() => selectStone(s.sku)}
                  className="w-full flex items-center justify-between py-3 px-3 text-left rounded-[9px] transition-all duration-150 cursor-pointer hover:pl-4"
                  style={{
                    background: stoneSku === s.sku ? "rgba(195,160,88,0.08)" : "transparent",
                    borderBottom: `1px solid ${T.borderSoft}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium" style={{ color: T.text }}>{s.sku}</span>
                    </div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: T.muted }}>
                      {s.gemName} · {s.origin} · {s.ratti}r · {inr(s.price)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href={`https://astrolaabh.com/stones/${s.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10.5px] transition-opacity hover:opacity-70"
                      style={{ color: T.accent }}
                    >
                      View in website
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                    {stoneSku === s.sku && <span style={{ color: T.accent }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>
            {stoneSku && (
              <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <GoldBtn onClick={() => goTo("design")}>Next →</GoldBtn>
              </div>
            )}
          </Card>
        )}

        {/* STEP: Design */}
        {step === "design" && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Select jewellery design (optional)</div>
            </div>

            {showCustomDesign && (
              <Modal title="Custom jewellery" open={showCustomDesign} onClose={() => { setShowCustomDesign(false); setDesignForm("Ring"); }}>
                <div className="space-y-3">
                  <Input
                    value={customDesign.name}
                    onChange={(v) => setCustomDesign((p) => ({ ...p, name: v }))}
                    label="Design name"
                    placeholder="e.g. Custom Navratna Ring"
                  />
                  <Select
                    value={customDesign.type}
                    onChange={(v) => setCustomDesign((p) => ({ ...p, type: v }))}
                    label="Jewellery type"
                    options={[
                      { value: "", label: "Select type…" },
                      { value: "Ring", label: "Ring" },
                      { value: "Pendant", label: "Pendant" },
                      { value: "Bracelet", label: "Bracelet" },
                      { value: "Necklace", label: "Necklace" },
                      { value: "Earring", label: "Earring" },
                      { value: "Bangle", label: "Bangle" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                  <Input
                    value={customDesign.size}
                    onChange={(v) => setCustomDesign((p) => ({ ...p, size: v }))}
                    label="Size"
                    placeholder="e.g. Ring size 18, Bracelet 7 inch"
                  />
                  <Select
                    value={customDesign.metal}
                    onChange={(v) => setCustomDesign((p) => ({ ...p, metal: v }))}
                    label="Metal"
                    options={[
                      { value: "", label: "Select metal…" },
                      { value: "22K Gold", label: "22K Gold" },
                      { value: "18K Gold", label: "18K Gold" },
                      { value: "Silver", label: "Silver" },
                      { value: "Panchdhatu", label: "Panchdhatu" },
                      { value: "Platinum", label: "Platinum" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                  <Input
                    value={customDesign.price}
                    onChange={(v) => setCustomDesign((p) => ({ ...p, price: v }))}
                    label="Price (₹)"
                    placeholder="e.g. 35000"
                  />
                  <div className="flex gap-2.5 pt-2">
                    <GoldBtn onClick={confirmCustomDesign}>Confirm custom design</GoldBtn>
                    <GhostBtn onClick={() => { setShowCustomDesign(false); setDesignForm("Ring"); }}>Cancel</GhostBtn>
                  </div>
                </div>
              </Modal>
            )}

            <div className="space-y-5">
                {/* Row 1: Wear type */}
                <div>
                  <div className="text-[11px] tracking-[0.06em] uppercase mb-2.5" style={{ color: T.muted }}>Type of wear</div>
                  <div className="flex flex-wrap gap-2.5">
                    {(["Ring", "Pendant", "Bracelet", "Loose"] as const).map((form) => {
                      const isActive = designForm === form;
                      return (
                        <button
                          key={form}
                          onClick={() => {
                            setDesignForm(form);
                            setDesignSize("");
                            if (form === "Loose") { setDesignSlug(""); }
                          }}
                          className="flex flex-col items-center justify-center w-[90px] h-[80px] rounded-[10px] transition-all duration-150 cursor-pointer"
                          style={{
                            background: isActive ? "rgba(195,160,88,0.1)" : T.bg,
                            border: `1.5px solid ${isActive ? "rgba(195,160,88,0.6)" : T.borderSoft}`,
                          }}
                        >
                          <span className="text-[20px] mb-1">
                            {form === "Ring" && "💍"}
                            {form === "Pendant" && "📿"}
                            {form === "Bracelet" && "⌚"}
                            {form === "Loose" && "💎"}
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: isActive ? T.accent : T.text }}>
                            {form === "Loose" ? "Loose stone" : form}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setShowCustomDesign(true)}
                      className="flex flex-col items-center justify-center w-[90px] h-[80px] rounded-[10px] transition-all duration-150 cursor-pointer"
                      style={{ background: T.bg, border: `1.5px dashed ${T.borderSoft}` }}
                    >
                      <span className="text-[20px] mb-1">✨</span>
                      <span className="text-[11px] font-medium" style={{ color: T.accent }}>Custom</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Metal */}
                {designForm && designForm !== "Custom" && designForm !== "Loose" && (
                  <div>
                    <div className="text-[11px] tracking-[0.06em] uppercase mb-2.5" style={{ color: T.muted }}>Metal</div>
                    <div className="flex flex-wrap gap-2">
                      {["22K Gold", "18K Gold", "Silver", "Panchdhatu"].map((metal) => {
                        const isActive = designMetal === metal;
                        return (
                          <button
                            key={metal}
                            onClick={() => setDesignMetal(isActive ? "" : metal)}
                            className="px-4 py-2 rounded-[8px] text-[12px] font-medium transition-all duration-150 cursor-pointer"
                            style={{
                              background: isActive ? "rgba(195,160,88,0.1)" : T.bg,
                              border: `1.5px solid ${isActive ? "rgba(195,160,88,0.6)" : T.borderSoft}`,
                              color: isActive ? T.accent : T.text,
                            }}
                          >
                            {metal}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Row 3: Size */}
                {designForm && designForm !== "Custom" && designForm !== "Loose" && (
                  <div>
                    <div className="text-[11px] tracking-[0.06em] uppercase mb-2.5" style={{ color: T.muted }}>Size</div>
                    <div className="flex flex-wrap gap-2">
                      {(designForm === "Ring"
                        ? ["6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"]
                        : designForm === "Pendant"
                          ? ["Small", "Medium", "Large"]
                          : ["6 inch", "6.5 inch", "7 inch", "7.5 inch", "8 inch", "8.5 inch"]
                      ).map((size) => {
                        const isActive = designSize === size;
                        return (
                          <button
                            key={size}
                            onClick={() => setDesignSize(isActive ? "" : size)}
                            className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all duration-150 cursor-pointer"
                            style={{
                              background: isActive ? "rgba(195,160,88,0.1)" : T.bg,
                              border: `1.5px solid ${isActive ? "rgba(195,160,88,0.6)" : T.borderSoft}`,
                              color: isActive ? T.accent : T.text,
                            }}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Row 3: Design grid (only when a jewellery type is selected) */}
                {designForm && designForm !== "Custom" && designForm !== "Loose" && (
                  <div>
                    <div className="text-[11px] tracking-[0.06em] uppercase mb-2.5" style={{ color: T.muted }}>Designs</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto">
                      {DESIGNS.filter((d) => d.remaining > 0 && d.form === designForm).map((d) => {
                        const isActive = designSlug === d.slug;
                        return (
                          <button
                            key={d.slug}
                            onClick={() => selectDesign(d.slug)}
                            className="flex flex-col items-center p-3 rounded-[10px] transition-all duration-150 cursor-pointer"
                            style={{
                              background: isActive ? "rgba(195,160,88,0.1)" : T.bg,
                              border: `1.5px solid ${isActive ? "rgba(195,160,88,0.6)" : T.borderSoft}`,
                            }}
                          >
                            <div
                              className="w-[72px] h-[72px] rounded-[8px] overflow-hidden mb-2"
                              style={{ background: "rgba(195,160,88,0.04)", border: `1px solid ${T.borderSoft}` }}
                            >
                              <img
                                src={d.image}
                                alt={d.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            </div>
                            <span className="text-[12px] font-medium text-center truncate w-full" style={{ color: isActive ? T.accent : T.text }}>{d.name}</span>
                            <span className="text-[10px] text-center mt-0.5" style={{ color: T.faint }}>{d.remaining} left · run {d.runSize}</span>
                            <span className="text-[11px] font-medium text-center mt-0.5" style={{ color: isActive ? T.accent : T.text }}>₹{d.price.toLocaleString("en-IN")}</span>
                          </button>
                        );
                      })}
                      {DESIGNS.filter((d) => d.remaining > 0 && d.form === designForm).length === 0 && (
                        <div className="col-span-full text-center py-6">
                          <p className="text-[12px]" style={{ color: T.muted }}>No designs available for {designForm}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            {(designSlug || designForm === "Loose") && (
              <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <GoldBtn onClick={() => goTo("energisation")}>Next →</GoldBtn>
              </div>
            )}
          </Card>
        )}

        {/* STEP: Energisation */}
        {step === "energisation" && (
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Choose energisation package</div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              <button
                onClick={() => setEnergisationKey("none")}
                className="w-full text-left rounded-[10px] p-4 transition-all duration-150 cursor-pointer"
                style={{
                  background: energisationKey === "none" ? "rgba(195,160,88,0.08)" : T.bg,
                  border: `1px solid ${energisationKey === "none" ? "rgba(195,160,88,0.4)" : T.borderSoft}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium" style={{ color: energisationKey === "none" ? T.accent : T.text }}>No energisation</span>
                  <span className="text-[12px]" style={{ color: T.faint }}>—</span>
                </div>
                <p className="text-[11.5px] mt-1" style={{ color: T.muted }}>Ship stone/jewellery as-is without any ritual.</p>
              </button>

              {ENERGISATION.map((tier, idx) => (
                <button
                  key={tier.key}
                  onClick={() => setEnergisationKey(tier.key)}
                  className="w-full text-left rounded-[10px] p-4 transition-all duration-150 cursor-pointer"
                  style={{
                    background: energisationKey === tier.key ? "rgba(195,160,88,0.08)" : T.bg,
                    border: `1px solid ${energisationKey === tier.key ? "rgba(195,160,88,0.4)" : T.borderSoft}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13px] font-semibold" style={{ color: energisationKey === tier.key ? T.accent : T.text }}>
                        {tier.name}
                      </span>
                      <span className="text-[10.5px]" style={{ color: T.faint }}>{tier.sanskrit}</span>
                      {idx === 0 && <Chip tone="good">Standard</Chip>}
                      {idx === 1 && <Chip tone="gold">Premium</Chip>}
                      {idx === 2 && <Chip tone="gold">Premium+</Chip>}
                      {idx === 3 && <Chip tone="gold">Elite</Chip>}
                    </div>
                    <span className="text-[12.5px] font-semibold tabular-nums shrink-0" style={{ color: tier.fee === 0 ? T.good : T.text }}>
                      {tier.fee === 0 ? "Included free" : inr(tier.fee)}
                    </span>
                  </div>
                  <div className="text-[11px] mt-1.5" style={{ color: T.faint }}>{tier.duration}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <GoldBtn onClick={confirmEnergisation}>Next →</GoldBtn>
            </div>
          </Card>
        )}

        {/* STEP: Review */}
        {step === "review" && (
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Review order</div>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ color: T.muted }}>Customer</span>
                <span style={{ color: T.text }}>{selectedCustomer?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ color: T.muted }}>Shipping address</span>
                <span className="text-right max-w-[60%]" style={{ color: T.text }}>{selectedAddress || "—"}</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ color: T.muted }}>Stone</span>
                <span style={{ color: T.text }}>{selectedStone ? `${selectedStone.sku} · ${selectedStone.gemName} · ${selectedStone.ratti}r` : "—"}</span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ color: T.muted }}>Design</span>
                <span className="text-right" style={{ color: T.text }}>
                  {hasCustomDesign
                    ? `${customDesign.name} · ${customDesign.type}${customDesign.metal ? ` · ${customDesign.metal}` : ""}${customDesign.size ? ` · ${customDesign.size}` : ""}`
                    : selectedDesign
                      ? `${selectedDesign.name} · ${selectedDesign.form}`
                      : "None (stone only)"}
                </span>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ color: T.muted }}>Energisation</span>
                <span style={{ color: T.text }}>
                  {energisationKey === "none" ? "Not required" : `${selectedEnergisation?.name}${selectedEnergisation?.fee ? ` · ${inr(selectedEnergisation.fee)}` : " · Included"}`}
                </span>
              </div>
              <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ color: T.muted }}>Stone price</span>
                <div className="flex items-center gap-1 rounded-md px-2 py-1" style={{ background: "rgba(235,230,215,0.04)", border: `1px solid rgba(235,230,215,0.1)` }}>
                  <span className="text-[12px]" style={{ color: T.faint }}>₹</span>
                  <input
                    type="text"
                    value={editStonePrice || (selectedStone ? String(selectedStone.price) : "")}
                    onChange={(e) => setEditStonePrice(e.target.value)}
                    className="text-right font-semibold tabular-nums bg-transparent border-none outline-none w-[100px] text-[13px]"
                    style={{ color: T.text }}
                    placeholder="0"
                  />
                </div>
              </div>
              {(hasCustomDesign || selectedDesign) && (
                <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span style={{ color: T.muted }}>{hasCustomDesign ? "Custom design price" : "Jewellery price"}</span>
                  <div className="flex items-center gap-1 rounded-md px-2 py-1" style={{ background: "rgba(235,230,215,0.04)", border: `1px solid rgba(235,230,215,0.1)` }}>
                    <span className="text-[12px]" style={{ color: T.faint }}>₹</span>
                    <input
                      type="text"
                      value={editDesignPrice || (hasCustomDesign ? customDesign.price : selectedDesign ? String(selectedDesign.price) : "")}
                      onChange={(e) => setEditDesignPrice(e.target.value)}
                      className="text-right tabular-nums bg-transparent border-none outline-none w-[100px] text-[13px]"
                      style={{ color: T.text }}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
              {selectedEnergisation && selectedEnergisation.fee > 0 && (
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span style={{ color: T.muted }}>Energisation</span>
                  <span className="tabular-nums" style={{ color: T.text }}>{inr(selectedEnergisation.fee)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ color: T.muted }}>Discount</span>
                <div className="flex items-center gap-1 rounded-md px-2 py-1" style={{ background: "rgba(235,230,215,0.04)", border: `1px solid rgba(235,230,215,0.1)` }}>
                  <input
                    type="text"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="text-right tabular-nums bg-transparent border-none outline-none w-[100px] text-[13px]"
                    style={{ color: T.danger || "#e55" }}
                    placeholder="0"
                  />
                  <span className="text-[12px]" style={{ color: T.faint }}>%</span>
                </div>
              </div>
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span className="font-medium" style={{ color: T.text }}>Total</span>
                <span className="text-[15px] font-semibold tabular-nums" style={{ color: T.text }}>
                  {(() => {
                    const sp = Number(editStonePrice) || selectedStone?.price || 0;
                    const dp = Number(editDesignPrice) || (hasCustomDesign ? Number(customDesign.price) || 0 : selectedDesign?.price || 0);
                    const ep = energisationKey !== "none" ? (selectedEnergisation?.fee ?? 0) : 0;
                    const discPct = Math.min(100, Math.max(0, Number(discount) || 0));
                    const subtotal = sp + dp + ep;
                    return inr(Math.max(0, Math.round(subtotal - (subtotal * discPct / 100))));
                  })()}
                </span>
              </div>
            </div>
            <p className="text-[11.5px] mt-4" style={{ color: T.faint }}>
              Order will be created with pending payment status. Generate a payment request from the order detail page to collect payment.
            </p>
            <div className="mt-4">
              <GoldBtn onClick={handleCreate}>Create order</GoldBtn>
            </div>
          </Card>
        )}
      </div>

      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13px] font-medium animate-in"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
