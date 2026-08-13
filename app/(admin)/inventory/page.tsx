"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, SearchFilter, Select, Chip, Modal, Input, GoldBtn, GhostBtn, ShopifyIcon, ShopifyButton, SHOPIFY_GREEN_DARK, SHOPIFY_TINT, SHOPIFY_BORDER } from "@/components/ui";
import { T } from "@/lib/theme";
import { STONES, DESIGNS, ENERGISATION, INTENTS, ZODIAC, inr as catalogInr } from "@/lib/catalog";
import type { Stone, Design } from "@/lib/catalog";

const GURUJIS = [
  { id: "guruji_anand", name: "Pandit Anand Sharma", speciality: "Vedic Brihaspati Mantra", location: "Varanasi", phone: "+91 98765 43210", active: true },
  { id: "guruji_raghav", name: "Guruji Raghav Mishra", speciality: "Surya & Shani rituals", location: "Haridwar", phone: "+91 87654 32109", active: true },
  { id: "guruji_keshav", name: "Acharya Keshav Tripathi", speciality: "Navagraha Shanti", location: "Ujjain", phone: "+91 76543 21098", active: true },
  { id: "guruji_sundar", name: "Pandit Sundar Iyer", speciality: "Maha Abhishek & Havan", location: "Kanchipuram", phone: "+91 65432 10987", active: false },
];

const STONE_TYPES = [
  { value: "", label: "All stones" },
  { value: "pukhraj", label: "Pukhraj (Yellow Sapphire)" },
  { value: "manik", label: "Manik (Ruby)" },
  { value: "neelam", label: "Neelam (Blue Sapphire)" },
  { value: "panna", label: "Panna (Emerald)" },
];

const COLOR_OPTIONS = [
  { value: "", label: "All colours" },
  { value: "Light Lemon", label: "Light Lemon" },
  { value: "Canary", label: "Canary" },
  { value: "Golden", label: "Golden" },
  { value: "Deep Golden", label: "Deep Golden" },
  { value: "Raspberry", label: "Raspberry" },
  { value: "Crimson", label: "Crimson" },
  { value: "Pigeon Blood", label: "Pigeon Blood" },
  { value: "Steel Blue", label: "Steel Blue" },
  { value: "Cornflower", label: "Cornflower" },
  { value: "Royal Blue", label: "Royal Blue" },
  { value: "Grass Green", label: "Grass Green" },
  { value: "Vivid Green", label: "Vivid Green" },
  { value: "Deep Velvet", label: "Deep Velvet" },
];

const INTENT_OPTIONS = [
  { value: "", label: "All intents" },
  ...INTENTS.map((i) => ({ value: i.label, label: i.label })),
];

const ZODIAC_OPTIONS = [
  { value: "", label: "All zodiac" },
  ...ZODIAC.map((z) => ({ value: z.planet, label: `${z.glyph} ${z.sign}` })),
];

const FORM_OPTIONS = [
  { value: "", label: "All types" },
  { value: "Ring", label: "Ring" },
  { value: "Pendant", label: "Pendant" },
  { value: "Bracelet", label: "Bracelet" },
];

/* Design thumbnails — curated designs carry a real photo; generated ones
   borrow deterministically from the house photo set for their form. */
const DESIGN_IMG_COUNT: Record<string, number> = { Ring: 12, Pendant: 8, Bracelet: 6 };
function designThumb(d: Design): string {
  if (d.image && !d.image.endsWith("jewellery.svg")) return d.image;
  const n = DESIGN_IMG_COUNT[d.form] ?? 6;
  let h = 0;
  for (const ch of d.slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `/designs/${d.form.toLowerCase()}-${String((h % n) + 1).padStart(2, "0")}.png`;
}

const METAL_OPTIONS = [
  { value: "", label: "All metals" },
  { value: "22k gold", label: "22k Gold" },
  { value: "18k gold", label: "18k Gold" },
  { value: "Panchdhatu", label: "Panchdhatu" },
];

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(); }}
      className="relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors duration-200"
      style={{
        background: enabled ? `${T.accent}30` : "rgba(89,82,54,0.08)",
        border: `1px solid ${enabled ? `${T.accent}60` : "rgba(89,82,54,0.18)"}`,
      }}
      title={enabled ? "Enabled — click to disable" : "Disabled — click to enable"}
    >
      <span
        className="inline-block h-[16px] w-[16px] rounded-full transition-transform duration-200"
        style={{
          background: enabled ? T.accent : "rgba(89,82,54,0.35)",
          transform: enabled ? "translateX(20px)" : "translateX(3px)",
        }}
      />
    </button>
  );
}

function ExternalLink({ href, label, shopify }: { href: string; label: string; shopify?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-[6px] transition-colors ${shopify ? "font-medium hover:bg-[rgba(149,191,71,0.12)]" : "hover:bg-[rgba(89,82,54,0.05)]"}`}
      style={shopify
        ? { border: `1px solid ${SHOPIFY_BORDER}`, color: SHOPIFY_GREEN_DARK }
        : { border: `1px solid ${T.borderSoft}`, color: T.muted }}
    >
      {shopify && <ShopifyIcon size={12} />}
      {label} <span className="text-[11px]">↗</span>
    </a>
  );
}

function StoneRowMenu({ shopifyUrl, websiteUrl, enabled, onToggle }: { shopifyUrl: string; websiteUrl: string; enabled: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const itemClass = "w-full text-left px-3.5 py-2 text-[12px] transition-colors cursor-pointer hover:bg-[rgba(160,125,56,0.08)] flex items-center gap-2";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((v) => !v); }}
        className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[rgba(89,82,54,0.08)] cursor-pointer"
        style={{ border: `1px solid ${T.borderSoft}`, color: T.muted }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-[180px] rounded-[10px] py-1.5 shadow-lg" style={{ background: T.popover, border: `1px solid ${T.border}` }}>
          <a href={shopifyUrl} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className={itemClass} style={{ color: SHOPIFY_GREEN_DARK }}>
            <ShopifyIcon size={12} /> Shopify <span className="text-[10px] ml-auto opacity-60">↗</span>
          </a>
          <a href={websiteUrl} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className={itemClass} style={{ color: T.text }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Website <span className="text-[10px] ml-auto opacity-60">↗</span>
          </a>
          <Link href="/orders/create" onClick={(e) => e.stopPropagation()} className={itemClass} style={{ color: T.text }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Create order
          </Link>
          <div className="mx-2 my-1.5" style={{ borderTop: `1px solid ${T.borderSoft}` }} />
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(); setOpen(false); }}
            className={itemClass}
            style={{ color: enabled ? T.danger : T.good }}
          >
            {enabled ? "Disable listing" : "Enable listing"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "stones";
  const [tab, setTab] = useState(tabParam);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [disabledStones, setDisabledStones] = useState<Set<string>>(new Set());
  const [disabledDesigns, setDisabledDesigns] = useState<Set<string>>(new Set());

  const [stoneType, setStoneType] = useState("");
  const [color, setColor] = useState("");
  const [intent, setIntent] = useState("");
  const [zodiac, setZodiac] = useState("");

  const [form, setForm] = useState("");
  const [metal, setMetal] = useState("");

  const [stoneSort, setStoneSort] = useState("");
  const [designSort, setDesignSort] = useState("");

  const toggleStone = (sku: string) => {
    const wasDisabled = disabledStones.has(sku);
    setDisabledStones((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku); else next.add(sku);
      return next;
    });
    setToast(wasDisabled ? "Stone activated" : "Stone deactivated");
    setTimeout(() => setToast(""), 3000);
  };

  const toggleDesign = (slug: string) => {
    const wasDisabled = disabledDesigns.has(slug);
    setDisabledDesigns((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
    setToast(wasDisabled ? "Design activated" : "Design deactivated");
    setTimeout(() => setToast(""), 3000);
  };

  const [disabledEnergisation, setDisabledEnergisation] = useState<Set<string>>(new Set());
  const toggleEnergisation = (key: string) => {
    const wasDisabled = disabledEnergisation.has(key);
    setDisabledEnergisation((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setToast(wasDisabled ? "Package activated" : "Package deactivated");
    setTimeout(() => setToast(""), 3000);
  };

  const [showAddGuruji, setShowAddGuruji] = useState(false);
  const [newGurujiName, setNewGurujiName] = useState("");
  const [newGurujiSpeciality, setNewGurujiSpeciality] = useState("");
  const [newGurujiLocation, setNewGurujiLocation] = useState("");
  const [disabledGurujis, setDisabledGurujis] = useState<Set<string>>(new Set(
    GURUJIS.filter((g) => !g.active).map((g) => g.id)
  ));
  const toggleGuruji = (id: string) => {
    const wasDisabled = disabledGurujis.has(id);
    setDisabledGurujis((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setToast(wasDisabled ? "Guruji activated" : "Guruji deactivated");
    setTimeout(() => setToast(""), 3000);
  };

  const intentGem = useMemo(() => {
    if (!intent) return "";
    const match = INTENTS.find((i) => i.label === intent);
    return match?.gem ?? "";
  }, [intent]);

  const filteredStones = useMemo(() => {
    return STONES.filter((s: Stone) => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.sku.toLowerCase().includes(q) && !s.gemName.toLowerCase().includes(q)) return false;
      }
      if (stoneType && s.gem !== stoneType) return false;
      if (color && s.shade !== color) return false;
      if (intentGem && s.gem !== intentGem) return false;
      if (zodiac) {
        const match = ZODIAC.find((z) => z.planet === zodiac);
        if (match && s.planet !== match.planet) return false;
      }
      return true;
    }).sort((a, b) => {
      if (stoneSort === "price_asc") return a.price - b.price;
      if (stoneSort === "price_desc") return b.price - a.price;
      if (stoneSort === "ratti_asc") return a.ratti - b.ratti;
      if (stoneSort === "ratti_desc") return b.ratti - a.ratti;
      return 0;
    });
  }, [search, stoneType, color, intentGem, zodiac, stoneSort]);

  const filteredDesigns = useMemo(() => {
    return DESIGNS.filter((d: Design) => {
      if (search) {
        const q = search.toLowerCase();
        if (!d.name.toLowerCase().includes(q) && !d.slug.toLowerCase().includes(q) && !d.form.toLowerCase().includes(q)) return false;
      }
      if (form && d.form !== form) return false;
      if (metal && d.metal !== metal) return false;
      return true;
    }).sort((a, b) => {
      if (designSort === "name_asc") return a.name.localeCompare(b.name);
      if (designSort === "stock_asc") return a.remaining - b.remaining;
      if (designSort === "stock_desc") return b.remaining - a.remaining;
      return 0;
    });
  }, [search, form, metal, designSort]);

  const pageTitle = tab === "stones" ? "Stones" : tab === "designs" ? "Jewellery Designs" : "Energisation Packages";
  const pageSub = tab === "stones"
    ? "Gemstone inventory synced from Shopify"
    : tab === "designs"
      ? "Jewellery designs synced from Shopify"
      : "Energisation packages available for customers";

  return (
    <>
      <PageHeader
        title={pageTitle}
        sub={pageSub}
        action={
          <ShopifyButton href="https://admin.shopify.com/products">Open Shopify Products</ShopifyButton>
        }
      />

      {tab !== "energisation" && (
        <div className="mb-4">
          <SearchFilter search={search} onSearchChange={setSearch} placeholder={tab === "stones" ? "Search SKU, gemstone…" : "Search design name…"} />
        </div>
      )}

      {/* Filters */}
      {tab === "stones" && (
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <div className="w-[170px]">
            <Select value={stoneType} onChange={setStoneType} options={STONE_TYPES} compact />
          </div>
          <div className="w-[150px]">
            <Select value={color} onChange={setColor} options={COLOR_OPTIONS} compact searchable />
          </div>
          <div className="w-[180px]">
            <Select value={intent} onChange={setIntent} options={INTENT_OPTIONS} compact />
          </div>
          <div className="w-[150px]">
            <Select value={zodiac} onChange={setZodiac} options={ZODIAC_OPTIONS} compact searchable />
          </div>
          <div className="w-[180px] ml-auto">
            <Select
              value={stoneSort}
              onChange={setStoneSort}
              compact
              prefix="Sort: "
              options={[
                { value: "", label: "Featured" },
                { value: "price_asc", label: "Price low to high" },
                { value: "price_desc", label: "Price high to low" },
                { value: "ratti_asc", label: "Weight low to high" },
                { value: "ratti_desc", label: "Weight high to low" },
              ]}
            />
          </div>
        </div>
      )}

      {tab === "designs" && (
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <div className="w-[150px]">
            <Select value={form} onChange={setForm} options={FORM_OPTIONS} compact />
          </div>
          <div className="w-[150px]">
            <Select value={metal} onChange={setMetal} options={METAL_OPTIONS} compact />
          </div>
          <div className="w-[190px] ml-auto">
            <Select
              value={designSort}
              onChange={setDesignSort}
              compact
              prefix="Sort: "
              options={[
                { value: "", label: "Featured" },
                { value: "name_asc", label: "Name A to Z" },
                { value: "stock_asc", label: "Stock low to high" },
                { value: "stock_desc", label: "Stock high to low" },
              ]}
            />
          </div>
        </div>
      )}

      {tab === "stones" && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>
              {filteredStones.length} stones
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.06em] font-medium px-2 py-[3px] rounded-[6px] whitespace-nowrap" style={{ color: SHOPIFY_GREEN_DARK, background: SHOPIFY_TINT }}><ShopifyIcon size={11} /> Synced · Shopify</span>
          </div>
          <div
            className="hidden md:grid grid-cols-[minmax(200px,1.2fr)_100px_140px_130px_48px] gap-x-4 px-3 py-2.5 rounded-[8px] text-[11px] tracking-[0.07em] uppercase font-semibold"
            style={{ color: T.muted, background: "rgba(89,82,54,0.035)" }}
          >
            <span>Stone</span>
            <span className="text-right">Weight</span>
            <span className="text-right">Price / ratti</span>
            <span className="text-right">Total</span>
            <span />
          </div>
          {filteredStones.slice(0, 30).map((s, i, arr) => (
            <div
              key={s.sku}
              className="grid md:grid-cols-[minmax(200px,1.2fr)_100px_140px_130px_48px] grid-cols-1 gap-x-4 gap-y-1.5 items-center px-3 py-3 text-[13.5px]"
              style={{ borderBottom: i < Math.min(arr.length, 30) - 1 ? `1px solid ${T.borderSoft}` : "none", opacity: disabledStones.has(s.sku) ? 0.5 : 1 }}
            >
              <span className="flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/gems/${s.gem}.png`}
                  alt={s.gemName}
                  className="w-9 h-9 rounded-[8px] object-cover shrink-0"
                  style={{ border: `1px solid ${T.borderSoft}` }}
                  loading="lazy"
                />
                <span className="min-w-0">
                  <span className="block font-medium truncate" style={{ color: T.text }}>{s.gemName}</span>
                  <span className="block text-[11px] tracking-[0.05em] uppercase tabular-nums" style={{ color: T.faint }}>{s.sku}</span>
                </span>
              </span>
              <span className="tabular-nums md:text-right" style={{ color: T.muted }}>{s.ratti} r</span>
              <span className="tabular-nums md:text-right text-[13px]" style={{ color: T.muted }}>{catalogInr(s.pricePerRatti)}</span>
              <span className="tabular-nums md:text-right font-semibold" style={{ color: T.text }}>{catalogInr(s.price)}</span>
              <span className="flex items-center justify-end">
                <StoneRowMenu
                  shopifyUrl={`https://admin.shopify.com/products/${s.sku}`}
                  websiteUrl={`https://astrolaabh.house/stones/${s.slug}`}
                  enabled={!disabledStones.has(s.sku)}
                  onToggle={() => toggleStone(s.sku)}
                />
              </span>
            </div>
          ))}
          {filteredStones.length > 30 && (
            <p className="text-[12px] mt-3 text-center" style={{ color: T.faint }}>Showing 30 of {filteredStones.length} stones</p>
          )}
          {filteredStones.length === 0 && (
            <p className="text-[13.5px] py-6 text-center" style={{ color: T.muted }}>No stones match the current filters.</p>
          )}
        </Card>
      )}

      {tab === "designs" && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>
              {filteredDesigns.length} designs
            </div>
          </div>
          {filteredDesigns.map((d, i, arr) => (
            <div
              key={d.slug}
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3 text-[13.5px]"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
            >
              <span className="flex items-center gap-3 w-[220px] min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={designThumb(d)}
                  alt={d.name}
                  className="w-9 h-9 rounded-[8px] object-cover shrink-0"
                  style={{ border: `1px solid ${T.borderSoft}`, background: "#fffdf5" }}
                  loading="lazy"
                />
                <span className="min-w-0">
                  <span className="block font-medium truncate" style={{ color: T.text }}>{d.name}</span>
                  <span className="block text-[11.5px]" style={{ color: T.faint }}>{d.form} · {d.metal}</span>
                </span>
              </span>
              <span className="text-[13px]" style={{ color: T.muted }}>run {d.runSize} · {d.remaining} remain</span>
              <span className="ml-auto flex items-center gap-3">
                <ExternalLink href={`https://admin.shopify.com/products/${d.slug}`} label="Shopify" shopify />
                <ToggleSwitch enabled={!disabledDesigns.has(d.slug)} onToggle={() => toggleDesign(d.slug)} />
              </span>
            </div>
          ))}
          {filteredDesigns.length === 0 && (
            <p className="text-[13.5px] py-6 text-center" style={{ color: T.muted }}>No designs match the current filters.</p>
          )}
        </Card>
      )}

      {tab === "energisation" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase font-medium" style={{ color: T.faint }}>
              {ENERGISATION.length} packages
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.06em] font-medium px-2 py-[3px] rounded-[6px] whitespace-nowrap" style={{ color: SHOPIFY_GREEN_DARK, background: SHOPIFY_TINT }}><ShopifyIcon size={11} /> Synced · Shopify</span>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {ENERGISATION.map((tier) => {
              const enabled = !disabledEnergisation.has(tier.key);
              return (
                <div
                  key={tier.key}
                  className="rounded-[12px] p-5 flex flex-col transition-opacity duration-200"
                  style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: T.shadow, opacity: enabled ? 1 : 0.55 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-semibold" style={{ color: T.text }}>{tier.name}</div>
                      <div className="font-devanagari text-[12px] mt-0.5" style={{ color: T.faint }}>{tier.sanskrit}</div>
                    </div>
                    {tier.fee === 0 && <Chip tone="good">Free</Chip>}
                  </div>
                  <div className="font-title text-[22px] font-semibold tracking-[-0.01em] tabular-nums mt-4" style={{ color: T.text }}>
                    {tier.fee === 0 ? "Included" : catalogInr(tier.fee)}
                  </div>
                  <div className="text-[12.5px] mt-1 mb-5" style={{ color: T.muted }}>{tier.duration}</div>
                  <div className="mt-auto flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <ExternalLink href={`https://admin.shopify.com/products/energisation-${tier.key}`} label="Shopify" shopify />
                    <ToggleSwitch enabled={enabled} onToggle={() => toggleEnergisation(tier.key)} />
                  </div>
                </div>
              );
            })}
          </div>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] tracking-[0.08em] uppercase font-medium" style={{ color: T.faint }}>
                Gurujis / Pandits
              </div>
              <button
                onClick={() => setShowAddGuruji(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: T.primary, color: T.primaryInk }}
              >
                + Add Guruji
              </button>
            </div>
            {GURUJIS.map((g, i) => {
              const enabled = !disabledGurujis.has(g.id);
              return (
                <div
                  key={g.id}
                  className="grid md:grid-cols-[minmax(220px,1.4fr)_1fr_150px_auto] items-center gap-x-4 gap-y-1 py-3.5 transition-opacity"
                  style={{ borderBottom: i < GURUJIS.length - 1 ? `1px solid ${T.borderSoft}` : "none", opacity: enabled ? 1 : 0.55 }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
                      style={{ background: `${T.accent}15`, border: `1px solid ${T.accent}35`, color: T.accent }}
                    >
                      {g.name.split(" ").slice(-1)[0][0]}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium truncate" style={{ color: T.text }}>{g.name}</div>
                      <div className="text-[12px] truncate" style={{ color: T.muted }}>{g.speciality}</div>
                    </div>
                  </div>
                  <div className="text-[12.5px] md:pl-0 pl-12" style={{ color: T.muted }}>{g.location}</div>
                  <div className="text-[12.5px] tabular-nums md:pl-0 pl-12" style={{ color: T.muted }}>{g.phone}</div>
                  <div className="flex items-center gap-2.5 justify-end md:pl-0 pl-12">
                    <span className="text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: enabled ? T.good : T.faint }}>
                      {enabled ? "Active" : "Inactive"}
                    </span>
                    <ToggleSwitch enabled={enabled} onToggle={() => toggleGuruji(g.id)} />
                  </div>
                </div>
              );
            })}
          </Card>

          <Modal open={showAddGuruji} onClose={() => setShowAddGuruji(false)} title="Add Guruji">
            <div className="space-y-3">
              <Input value={newGurujiName} onChange={setNewGurujiName} label="Name" placeholder="Pandit / Guruji name" />
              <Input value={newGurujiSpeciality} onChange={setNewGurujiSpeciality} label="Speciality" placeholder="e.g. Vedic Brihaspati Mantra" />
              <Input value={newGurujiLocation} onChange={setNewGurujiLocation} label="Location" placeholder="e.g. Varanasi" />
            </div>
            <div className="flex gap-2.5 mt-5">
              <GoldBtn onClick={() => { setShowAddGuruji(false); setNewGurujiName(""); setNewGurujiSpeciality(""); setNewGurujiLocation(""); }}>Add</GoldBtn>
              <GhostBtn onClick={() => setShowAddGuruji(false)}>Cancel</GhostBtn>
            </div>
          </Modal>
        </>
      )}

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
