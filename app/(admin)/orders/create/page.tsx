"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, SearchFilter, Chip, Input, Select, StepIndicator } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS } from "@/lib/mock";
import { STONES, DESIGNS, ENERGISATION, inr } from "@/lib/catalog";

type Step = "customer" | "stone" | "design" | "energisation" | "review";
const STEPS: { key: Step; label: string }[] = [
  { key: "customer", label: "Customer" },
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

  const [customerId, setCustomerId] = useState("");
  const [stoneSku, setStoneSku] = useState("");
  const [designSlug, setDesignSlug] = useState("");
  const [energisationKey, setEnergisationKey] = useState("shuddhi");
  const [showCustomDesign, setShowCustomDesign] = useState(false);
  const [customDesign, setCustomDesign] = useState({ name: "", type: "", size: "", metal: "", price: "" });

  const selectedCustomer = MOCK_CUSTOMERS.find((c) => c.id === customerId);
  const selectedStone = STONES.find((s) => s.sku === stoneSku);
  const selectedDesign = DESIGNS.find((d) => d.slug === designSlug);
  const selectedEnergisation = ENERGISATION.find((e) => e.key === energisationKey);
  const hasCustomDesign = designSlug === "__custom" && !!customDesign.name;

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const canNavigateTo = (targetIndex: number) => {
    if (targetIndex === 0) return true;
    if (targetIndex === 1) return !!customerId;
    if (targetIndex === 2) return !!customerId && !!stoneSku;
    if (targetIndex === 3) return !!customerId && !!stoneSku;
    if (targetIndex === 4) return !!customerId && !!stoneSku;
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
    setSearch("");
    goTo("stone");
  };

  const selectStone = (sku: string) => {
    setStoneSku(sku);
    setSearch("");
    goTo("design");
  };

  const selectDesign = (slug: string) => {
    setDesignSlug(slug);
    goTo("energisation");
  };

  const skipDesign = () => {
    setDesignSlug("");
    setShowCustomDesign(false);
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
            <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Select customer</div>
            <div className="mb-3">
              <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search name, email…" />
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {MOCK_CUSTOMERS.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())).map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCustomer(c.id)}
                  className="w-full flex items-center justify-between py-3 px-3 text-left rounded-[8px] transition-all duration-150 hover:pl-4"
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
          </Card>
        )}

        {/* STEP: Stone */}
        {step === "stone" && (
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Select stone from inventory</div>
            <div className="mb-3">
              <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search SKU, gemstone…" />
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {STONES.filter((s) => !search || s.sku.toLowerCase().includes(search.toLowerCase()) || s.gemName.toLowerCase().includes(search.toLowerCase())).slice(0, 30).map((s) => (
                <button
                  key={s.sku}
                  onClick={() => selectStone(s.sku)}
                  className="w-full flex items-center justify-between py-3 px-3 text-left rounded-[8px] transition-all duration-150 hover:pl-4"
                  style={{
                    background: stoneSku === s.sku ? "rgba(195,160,88,0.08)" : "transparent",
                    borderBottom: `1px solid ${T.borderSoft}`,
                  }}
                >
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: T.text }}>{s.sku}</div>
                    <div className="text-[11.5px]" style={{ color: T.muted }}>{s.gemName} · {s.ratti}r · {inr(s.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.oneOfOne && <Chip tone="gold">One of one</Chip>}
                    {stoneSku === s.sku && <span style={{ color: T.accent }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* STEP: Design */}
        {step === "design" && (
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Select jewellery design (optional)</div>

            {showCustomDesign ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium" style={{ color: T.accent }}>Custom jewellery</span>
                  <button onClick={() => setShowCustomDesign(false)} className="text-[11px]" style={{ color: T.muted }}>← Back to list</button>
                </div>
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
                    { value: "Brooch", label: "Brooch" },
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
                    { value: "Platinum", label: "Platinum" },
                    { value: "Silver (Panchdhatu)", label: "Silver (Panchdhatu)" },
                    { value: "Ashtadhatu", label: "Ashtadhatu" },
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
                  <GhostBtn onClick={() => setShowCustomDesign(false)}>Cancel</GhostBtn>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={skipDesign}
                    className="flex-1 flex items-center justify-between py-3 px-3 text-left rounded-[8px] transition-all duration-150 hover:pl-4"
                    style={{ background: "transparent", borderBottom: `1px solid ${T.borderSoft}` }}
                  >
                    <span className="text-[13px]" style={{ color: T.muted }}>No design — stone only</span>
                    <Chip tone="gold">Skip →</Chip>
                  </button>
                </div>
                <button
                  onClick={() => setShowCustomDesign(true)}
                  className="w-full flex items-center justify-between py-3 px-3 text-left rounded-[8px] mb-2 transition-all duration-150 hover:pl-4"
                  style={{ background: "transparent", borderBottom: `1px solid ${T.borderSoft}` }}
                >
                  <div>
                    <span className="text-[13px] font-medium" style={{ color: T.accent }}>+ Custom jewellery</span>
                    <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>Specify type, size, metal & price</div>
                  </div>
                </button>
                <div className="max-h-[300px] overflow-y-auto">
                  {DESIGNS.filter((d) => d.remaining > 0).map((d) => (
                    <button
                      key={d.slug}
                      onClick={() => selectDesign(d.slug)}
                      className="w-full flex items-center justify-between py-3 px-3 text-left rounded-[8px] transition-all duration-150 hover:pl-4"
                      style={{
                        background: designSlug === d.slug ? "rgba(195,160,88,0.08)" : "transparent",
                        borderBottom: `1px solid ${T.borderSoft}`,
                      }}
                    >
                      <div>
                        <div className="text-[13px] font-medium" style={{ color: T.text }}>{d.name}</div>
                        <div className="text-[11.5px]" style={{ color: T.muted }}>{d.form} · run {d.runSize} · {d.remaining} remain</div>
                      </div>
                      {designSlug === d.slug && <span style={{ color: T.accent }}>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </Card>
        )}

        {/* STEP: Energisation */}
        {step === "energisation" && (
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Choose energisation package</div>

            <div className="space-y-3 mb-4">
              {/* No energisation option */}
              <button
                onClick={() => setEnergisationKey("none")}
                className="w-full text-left rounded-[10px] p-4 transition-all duration-150"
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

              {/* Tiered energisation packages */}
              {ENERGISATION.map((tier, idx) => (
                <button
                  key={tier.key}
                  onClick={() => setEnergisationKey(tier.key)}
                  className="w-full text-left rounded-[10px] p-4 transition-all duration-150"
                  style={{
                    background: energisationKey === tier.key ? "rgba(195,160,88,0.08)" : T.bg,
                    border: `1px solid ${energisationKey === tier.key ? "rgba(195,160,88,0.4)" : T.borderSoft}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
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

                  <div className="text-[11px] mb-2" style={{ color: T.faint }}>{tier.duration}</div>

                  <ul className="space-y-1">
                    {tier.includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11.5px]" style={{ color: T.muted }}>
                        <span className="shrink-0 mt-[3px] w-1 h-1 rounded-full" style={{ background: tier.fee === 0 ? T.good : T.accent }} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="text-[10.5px] mt-2 pt-2" style={{ color: T.faint, borderTop: `1px solid ${T.borderSoft}` }}>
                    Proof: {tier.proof}
                  </div>
                </button>
              ))}
            </div>

            <GoldBtn onClick={confirmEnergisation}>Continue to review</GoldBtn>
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
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ color: T.muted }}>Stone price</span>
                <span className="font-semibold tabular-nums" style={{ color: T.text }}>{selectedStone ? inr(selectedStone.price) : "—"}</span>
              </div>
              {hasCustomDesign && customDesign.price && (
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span style={{ color: T.muted }}>Custom design</span>
                  <span className="tabular-nums" style={{ color: T.text }}>{inr(Number(customDesign.price) || 0)}</span>
                </div>
              )}
              {selectedEnergisation && selectedEnergisation.fee > 0 && (
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span style={{ color: T.muted }}>Energisation</span>
                  <span className="tabular-nums" style={{ color: T.text }}>{inr(selectedEnergisation.fee)}</span>
                </div>
              )}
              <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span className="font-medium" style={{ color: T.text }}>Total</span>
                <span className="text-[15px] font-semibold tabular-nums" style={{ color: T.text }}>
                  {selectedStone ? inr(selectedStone.price + (hasCustomDesign ? Number(customDesign.price) || 0 : 0) + (energisationKey !== "none" ? (selectedEnergisation?.fee ?? 0) : 0)) : "—"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span style={{ color: T.muted }}>Payment status</span>
                <Chip tone="gold">Pending payment</Chip>
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
