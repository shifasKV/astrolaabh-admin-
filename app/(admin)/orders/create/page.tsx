"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, Chip, Input } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS } from "@/lib/mock";
import { STONES, ENERGISATION, inr } from "@/lib/catalog";

/*
 * Create order — one page, no wizard.
 * Type to find the customer and stone; everything else is optional.
 * A live summary on the right shows exactly what will be created.
 */

const SETTING_TYPES = ["Ring", "Pendant", "Bracelet", "Loose stone"] as const;
const METALS = ["22K Gold", "18K Gold", "Silver", "Panchdhatu"] as const;

function SectionTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-2.5 mb-3">
      <span
        className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[12px] font-semibold shrink-0 translate-y-0.5"
        style={{ background: T.accentMuted, color: T.accent }}
      >
        {n}
      </span>
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>{title}</h2>
      {hint && <span className="text-[12px]" style={{ color: T.faint }}>{hint}</span>}
    </div>
  );
}

export default function CreateOrderPage() {
  const router = useRouter();

  // Customer
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [newCustomer, setNewCustomer] = useState<{ name: string; phone: string; email: string } | null>(null);
  const [showBirth, setShowBirth] = useState(false);
  const [birth, setBirth] = useState({ date: "", time: "", place: "" });
  const [address, setAddress] = useState("");

  // Stone
  const [stoneQuery, setStoneQuery] = useState("");
  const [stoneOpen, setStoneOpen] = useState(false);
  const [stoneSku, setStoneSku] = useState("");
  const [stonePrice, setStonePrice] = useState("");

  // Setting (optional)
  const [settingType, setSettingType] = useState("");
  const [metal, setMetal] = useState("");
  const [size, setSize] = useState("");
  const [settingPrice, setSettingPrice] = useState("");

  // Energisation + pricing
  const [energisationKey, setEnergisationKey] = useState("shuddhi");
  const [discount, setDiscount] = useState("");
  const [toast, setToast] = useState("");

  const selectedCustomer = MOCK_CUSTOMERS.find((c) => c.id === customerId);
  const customer = newCustomer ?? selectedCustomer;
  const selectedStone = STONES.find((s) => s.sku === stoneSku);
  const energisation = ENERGISATION.find((e) => e.key === energisationKey);

  const customerMatches = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return MOCK_CUSTOMERS.slice(0, 6);
    return MOCK_CUSTOMERS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")),
    ).slice(0, 6);
  }, [customerQuery]);

  const stoneMatches = useMemo(() => {
    const q = stoneQuery.trim().toLowerCase();
    if (!q) return STONES.slice(0, 6);
    return STONES.filter(
      (s) =>
        s.gemName.toLowerCase().includes(q) ||
        s.english.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [stoneQuery]);

  const pickCustomer = (id: string) => {
    const c = MOCK_CUSTOMERS.find((x) => x.id === id);
    if (!c) return;
    setCustomerId(id);
    setNewCustomer(null);
    setAddress(c.shippingAddress ?? "");
    setCustomerQuery("");
    setCustomerOpen(false);
  };

  const startNewCustomer = () => {
    setNewCustomer({ name: customerQuery.trim(), phone: "", email: "" });
    setCustomerId("");
    setAddress("");
    setCustomerOpen(false);
    setCustomerQuery("");
  };

  const clearCustomer = () => {
    setCustomerId("");
    setNewCustomer(null);
    setAddress("");
    setShowBirth(false);
  };

  const pickStone = (sku: string) => {
    const s = STONES.find((x) => x.sku === sku);
    if (!s) return;
    setStoneSku(sku);
    setStonePrice(String(s.price));
    setStoneQuery("");
    setStoneOpen(false);
  };

  const stoneAmount = selectedStone ? Number(stonePrice) || selectedStone.price : 0;
  const settingAmount = Number(settingPrice) || 0;
  const energisationAmount = energisation?.fee ?? 0;
  const discountAmount = Number(discount) || 0;
  const total = Math.max(0, stoneAmount + settingAmount + energisationAmount - discountAmount);

  const customerReady = newCustomer ? !!(newCustomer.name && newCustomer.phone) : !!selectedCustomer;
  const canCreate = customerReady && !!selectedStone;

  const handleCreate = () => {
    if (!canCreate) return;
    setToast("Order created successfully");
    setTimeout(() => router.push("/orders"), 700);
  };

  const suggestionRow =
    "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-[9px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.10)]";

  return (
    <>
      <PageHeader title="Create order" back={{ label: "Orders", onClick: () => router.push("/orders") }} />

      <div className="flex flex-col lg:flex-row items-start gap-4">
        {/* ——— Form ——— */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* 1 · Customer */}
          <Card className="!p-6">
            <SectionTitle n={1} title="Customer" />
            {!customer ? (
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: T.faint }}>
                  <circle cx="11" cy="11" r="7" strokeWidth="1.5" />
                  <path d="m16 16 4 4" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  value={customerQuery}
                  onChange={(e) => { setCustomerQuery(e.target.value); setCustomerOpen(true); }}
                  onFocus={() => setCustomerOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setCustomerOpen(false);
                    if (e.key === "Enter" && customerMatches[0]) pickCustomer(customerMatches[0].id);
                  }}
                  placeholder="Type a name, phone, or email…"
                  className="w-full h-11 pl-9 pr-3 rounded-[10px] text-[14px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]"
                  style={{ background: T.popover, border: `1px solid ${T.border}`, color: T.text }}
                />
                {customerOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setCustomerOpen(false)} />
                    <div
                      className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-[12px] p-1.5 max-h-[320px] overflow-y-auto"
                      style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}
                    >
                      {customerMatches.map((c) => (
                        <button key={c.id} onClick={() => pickCustomer(c.id)} className={suggestionRow}>
                          <span
                            className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[12px] font-semibold shrink-0"
                            style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}`, color: T.accent }}
                          >
                            {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13.5px] font-medium truncate" style={{ color: T.text }}>{c.name}</span>
                            <span className="block text-[11.5px] truncate" style={{ color: T.muted }}>{c.phone} · {c.email}</span>
                          </span>
                        </button>
                      ))}
                      {customerMatches.length === 0 && (
                        <div className="px-3 py-2 text-[12.5px]" style={{ color: T.faint }}>No customers match “{customerQuery}”.</div>
                      )}
                      <button onClick={startNewCustomer} className={suggestionRow} style={{ color: T.accent }}>
                        <span className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ border: `1px dashed ${T.accentBorder}` }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14" /></svg>
                        </span>
                        <span className="text-[13px] font-medium">
                          New customer{customerQuery.trim() ? ` “${customerQuery.trim()}”` : ""}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : newCustomer ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input value={newCustomer.name} onChange={(v) => setNewCustomer((p) => p && { ...p, name: v })} label="Name" placeholder="e.g. Priya Sharma" />
                  <Input value={newCustomer.phone} onChange={(v) => setNewCustomer((p) => p && { ...p, phone: v })} label="Phone / WhatsApp" placeholder="+91 98765 43210" />
                  <Input value={newCustomer.email} onChange={(v) => setNewCustomer((p) => p && { ...p, email: v })} label="Email (optional)" placeholder="priya@example.com" />
                </div>
                <button onClick={() => setShowBirth((v) => !v)} className="text-[12.5px] font-medium cursor-pointer hover:underline underline-offset-4" style={{ color: T.accent }}>
                  {showBirth ? "Hide birth details" : "+ Add birth details (for the chart)"}
                </button>
                {showBirth && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input value={birth.date} onChange={(v) => setBirth((p) => ({ ...p, date: v }))} label="Birth date" placeholder="15 Mar 1992" />
                    <Input value={birth.time} onChange={(v) => setBirth((p) => ({ ...p, time: v }))} label="Birth time" placeholder="10:30 AM" />
                    <Input value={birth.place} onChange={(v) => setBirth((p) => ({ ...p, place: v }))} label="Birth place" placeholder="Kochi, Kerala" />
                  </div>
                )}
                <button onClick={clearCustomer} className="text-[12.5px] cursor-pointer hover:underline underline-offset-4" style={{ color: T.muted }}>
                  ← Back to search
                </button>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 rounded-[12px] px-3.5 py-3"
                style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}` }}
              >
                <span
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[13px] font-semibold shrink-0"
                  style={{ background: T.card, border: `1px solid ${T.borderSoft}`, color: T.accent }}
                >
                  {selectedCustomer!.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>{selectedCustomer!.name}</div>
                  <div className="text-[12px] truncate" style={{ color: T.muted }}>{selectedCustomer!.phone} · {selectedCustomer!.email}</div>
                </div>
                <button
                  onClick={clearCustomer}
                  className="text-[12px] font-medium shrink-0 cursor-pointer hover:underline underline-offset-4"
                  style={{ color: T.accent }}
                >
                  Change
                </button>
              </div>
            )}

            {/* Delivery address — auto-filled, editable */}
            {customer && (
              <div className="mt-4">
                <div className="text-[11px] font-medium tracking-[0.06em] uppercase mb-1.5" style={{ color: T.faint }}>
                  Deliver to {selectedCustomer?.shippingAddress && address === selectedCustomer.shippingAddress ? "· address on file" : ""}
                </div>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="House / street, city, state, PIN"
                  className="w-full px-3.5 py-2.5 rounded-[10px] text-[13.5px] outline-none resize-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]"
                  style={{ background: T.popover, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
            )}
          </Card>

          {/* 2 · Stone */}
          <Card className="!p-6">
            <SectionTitle n={2} title="Stone" />
            {!selectedStone ? (
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: T.faint }}>
                  <circle cx="11" cy="11" r="7" strokeWidth="1.5" />
                  <path d="m16 16 4 4" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  value={stoneQuery}
                  onChange={(e) => { setStoneQuery(e.target.value); setStoneOpen(true); }}
                  onFocus={() => setStoneOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setStoneOpen(false);
                    if (e.key === "Enter" && stoneMatches[0]) pickStone(stoneMatches[0].sku);
                  }}
                  placeholder="Type a gem, SKU, or origin — e.g. Pukhraj, Ceylon…"
                  className="w-full h-11 pl-9 pr-3 rounded-[10px] text-[14px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]"
                  style={{ background: T.popover, border: `1px solid ${T.border}`, color: T.text }}
                />
                {stoneOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setStoneOpen(false)} />
                    <div
                      className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-[12px] p-1.5 max-h-[320px] overflow-y-auto"
                      style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}
                    >
                      {stoneMatches.map((s) => (
                        <button key={s.sku} onClick={() => pickStone(s.sku)} className={suggestionRow}>
                          <span className="w-8 h-8 rounded-[9px] shrink-0" style={{ background: s.shadeHex, border: `1px solid ${T.borderSoft}` }} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13.5px] font-medium truncate" style={{ color: T.text }}>
                              {s.gemName} · {s.english}
                            </span>
                            <span className="block text-[11.5px] truncate" style={{ color: T.muted }}>
                              {s.ratti}r · {s.origin} · {s.sku}
                            </span>
                          </span>
                          <span className="text-[13px] font-semibold tabular-nums shrink-0" style={{ color: T.text }}>{inr(s.price)}</span>
                        </button>
                      ))}
                      {stoneMatches.length === 0 && (
                        <div className="px-3 py-2 text-[12.5px]" style={{ color: T.faint }}>No stones match “{stoneQuery}”.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div
                className="flex flex-wrap items-center gap-3 rounded-[12px] px-3.5 py-3"
                style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}` }}
              >
                <span className="w-9 h-9 rounded-[10px] shrink-0" style={{ background: selectedStone.shadeHex, border: `1px solid ${T.borderSoft}` }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>
                    {selectedStone.gemName} · {selectedStone.english}
                  </div>
                  <div className="text-[12px] truncate" style={{ color: T.muted }}>
                    {selectedStone.ratti}r · {selectedStone.origin} · {selectedStone.sku}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[12px]" style={{ color: T.faint }}>₹</span>
                  <input
                    value={stonePrice}
                    onChange={(e) => setStonePrice(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-[110px] h-8 px-2.5 rounded-[8px] text-[13px] font-semibold tabular-nums text-right outline-none"
                    style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
                    aria-label="Stone price"
                  />
                  <button
                    onClick={() => { setStoneSku(""); setStonePrice(""); }}
                    className="text-[12px] font-medium cursor-pointer hover:underline underline-offset-4"
                    style={{ color: T.accent }}
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* 3 · Setting */}
          <Card className="!p-6">
            <SectionTitle n={3} title="Setting" hint="optional — skip for a loose stone" />
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SETTING_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setSettingType(settingType === t ? "" : t)}
                  className="h-8 px-3.5 rounded-full text-[13px] cursor-pointer transition-colors duration-150"
                  style={
                    settingType === t
                      ? { background: T.accent, color: T.accentInk, fontWeight: 600 }
                      : { background: "rgba(89,82,54,0.06)", color: T.muted }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            {settingType && settingType !== "Loose stone" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {METALS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMetal(metal === m ? "" : m)}
                      className="h-8 px-3.5 rounded-full text-[12.5px] cursor-pointer transition-colors duration-150"
                      style={
                        metal === m
                          ? { background: T.gold, color: T.accentInk, fontWeight: 600 }
                          : { background: "rgba(89,82,54,0.06)", color: T.muted }
                      }
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-[380px]">
                  <Input value={size} onChange={setSize} label={settingType === "Ring" ? "Ring size" : "Size / length"} placeholder={settingType === "Ring" ? "e.g. 18" : "e.g. 20 in"} />
                  <Input value={settingPrice} onChange={(v) => setSettingPrice(v.replace(/[^0-9]/g, ""))} label="Making charge (₹)" placeholder="e.g. 18500" />
                </div>
              </div>
            )}
          </Card>

          {/* 4 · Energisation */}
          <Card className="!p-6">
            <SectionTitle n={4} title="Energisation" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ENERGISATION.map((e) => {
                const active = energisationKey === e.key;
                return (
                  <button
                    key={e.key}
                    onClick={() => setEnergisationKey(e.key)}
                    className="text-left rounded-[12px] px-4 py-3 cursor-pointer transition-all duration-150"
                    style={{
                      background: active ? T.accentFaint : T.popover,
                      border: `1px solid ${active ? T.accentBorder : T.borderSoft}`,
                      boxShadow: active ? `inset 0 0 0 1px ${T.accentBorder}` : "none",
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13.5px] font-semibold" style={{ color: T.text }}>{e.name}</span>
                      <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: e.fee === 0 ? T.good : T.text }}>
                        {e.fee === 0 ? "Included" : inr(e.fee)}
                      </span>
                    </div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: T.muted }}>{e.duration}</div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ——— Live summary ——— */}
        <aside className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-4">
          <Card className="!p-6">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Order summary</h2>

            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between gap-3">
                <span style={{ color: T.faint }}>Customer</span>
                <span className="text-right font-medium min-w-0 truncate" style={{ color: customer ? T.text : T.faint }}>
                  {customer ? customer.name || "New customer" : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span style={{ color: T.faint }}>Stone</span>
                <span className="text-right font-medium min-w-0 truncate" style={{ color: selectedStone ? T.text : T.faint }}>
                  {selectedStone ? `${selectedStone.gemName} ${selectedStone.ratti}r` : "—"}
                </span>
              </div>
              {settingType && (
                <div className="flex justify-between gap-3">
                  <span style={{ color: T.faint }}>Setting</span>
                  <span className="text-right font-medium" style={{ color: T.text }}>
                    {settingType}{metal ? ` · ${metal}` : ""}{size ? ` · ${size}` : ""}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span style={{ color: T.faint }}>Energisation</span>
                <span className="text-right font-medium" style={{ color: T.text }}>{energisation?.name}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 space-y-2 text-[13px] tabular-nums" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <div className="flex justify-between"><span style={{ color: T.muted }}>Stone</span><span style={{ color: T.text }}>{selectedStone ? inr(stoneAmount) : "—"}</span></div>
              {settingAmount > 0 && <div className="flex justify-between"><span style={{ color: T.muted }}>Making</span><span style={{ color: T.text }}>{inr(settingAmount)}</span></div>}
              <div className="flex justify-between"><span style={{ color: T.muted }}>Energisation</span><span style={{ color: T.text }}>{energisationAmount === 0 ? "Free" : inr(energisationAmount)}</span></div>
              <div className="flex items-center justify-between gap-3">
                <span style={{ color: T.muted }}>Discount</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[12px]" style={{ color: T.faint }}>− ₹</span>
                  <input
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="0"
                    className="w-[86px] h-7 px-2 rounded-[7px] text-[12.5px] tabular-nums text-right outline-none"
                    style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.text }}
                    aria-label="Discount"
                  />
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 flex items-baseline justify-between" style={{ borderTop: `1px solid ${T.border}` }}>
              <span className="text-[13px] font-medium" style={{ color: T.muted }}>Total</span>
              <span className="font-title text-[22px] font-semibold tabular-nums tracking-[-0.01em]" style={{ color: T.text }}>{inr(total)}</span>
            </div>

            <div className="mt-4">
              <GoldBtn onClick={handleCreate} disabled={!canCreate} className="w-full">
                Create order
              </GoldBtn>
              {!canCreate && (
                <div className="text-[11.5px] mt-2 text-center" style={{ color: T.faint }}>
                  {!customerReady ? "Pick or add a customer to continue" : "Pick a stone to continue"}
                </div>
              )}
            </div>
          </Card>
        </aside>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-[10px] text-[13px] font-medium"
          style={{ background: T.primary, color: T.primaryInk, boxShadow: T.shadowLift, animation: "wl-toast 0.3s ease both" }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
