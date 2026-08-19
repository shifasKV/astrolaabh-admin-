"use client";
import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, Chip, Modal, Input, GoldBtn, GhostBtn, ShopifyIcon, ShopifyButton, SHOPIFY_GREEN_DARK, SHOPIFY_TINT, SHOPIFY_BORDER, Pagination, ToolbarSearch, InlineFilter, MultiCheck, SortMenu, EmptyState, TableSkeleton, Toast } from "@/components/ui";

const INV_ICONS = {
  stone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>,
  colour: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 2s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></svg>,
  zodiac: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="m12 2 2.4 5.8L20 9l-4.5 3.9L17 20l-5-3-5 3 1.5-7.1L4 9l5.6-1.2z" /></svg>,
  design: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /></svg>,
  metal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M12 2 4 7v10l8 5 8-5V7z" /></svg>,
};
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
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

function ItemRowMenu({ shopifyUrl, websiteUrl, enabled, onToggle, outOfStock, onOutOfStock, sellingFast, onSellingFast }: { shopifyUrl: string; websiteUrl: string; enabled: boolean; onToggle: () => void; outOfStock?: boolean; onOutOfStock?: () => void; sellingFast?: boolean; onSellingFast?: () => void }) {
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

  const itemClass = "w-full text-left px-2.5 py-2 rounded-[8px] text-[12.5px] font-medium transition-colors cursor-pointer hover:bg-[rgba(119,123,98,0.10)] flex items-center gap-2.5";
  const extArrow = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 ml-auto shrink-0" style={{ color: T.faint }}>
      <path d="M7 17L17 7M17 7H9M17 7v8" />
    </svg>
  );
  const iconSlot = "w-4 flex items-center justify-center shrink-0";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen((v) => !v); }}
        aria-label="Row actions"
        className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[rgba(89,82,54,0.08)] cursor-pointer"
        style={{ border: `1px solid ${open ? T.accentBorder : T.borderSoft}`, color: T.muted, background: open ? T.accentFaint : "transparent" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 w-[210px] rounded-[12px] p-1.5"
          style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift, animation: "fadeIn 0.12s ease both" }}
        >
          <a href={shopifyUrl} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className={itemClass} style={{ color: T.text }}>
            <span className={iconSlot}><ShopifyIcon size={13} /></span>
            Open in Shopify
            {extArrow}
          </a>
          <a href={websiteUrl} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className={itemClass} style={{ color: T.text }}>
            <span className={iconSlot}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ color: T.muted }}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </span>
            View on website
            {extArrow}
          </a>
          <Link href="/orders/create" onClick={(e) => e.stopPropagation()} className={itemClass} style={{ color: T.text }}>
            <span className={iconSlot}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: T.muted }}><path d="M12 5v14M5 12h14"/></svg>
            </span>
            Create order
          </Link>

          <div className="mx-1 my-1.5" style={{ borderTop: `1px solid ${T.borderSoft}` }} />
          <div className="px-2.5 pt-1 pb-1.5 text-[10.5px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Listing</div>

          {onOutOfStock && (
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOutOfStock(); setOpen(false); }}
              className={itemClass}
              style={{ color: T.text }}
            >
              <span className={iconSlot}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: outOfStock ? T.good : T.muted }}>
                  <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
                </svg>
              </span>
              {outOfStock ? "Mark as in stock" : "Mark as out of stock"}
            </button>
          )}
          {onSellingFast && (
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onSellingFast(); setOpen(false); }}
              className={itemClass}
              style={{ color: T.text }}
            >
              <span className={iconSlot}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: sellingFast ? "#c57b1a" : T.muted }}>
                  <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
                </svg>
              </span>
              {sellingFast ? "Remove selling fast" : "Mark as selling fast"}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(); setOpen(false); }}
            className={`${itemClass} hover:!bg-[rgba(163,73,63,0.08)]`}
            style={{ color: enabled ? T.danger : T.good }}
          >
            <span className={iconSlot}>
              {enabled ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </span>
            {enabled ? "Disable listing" : "Enable listing"}
          </button>
        </div>
      )}
    </div>
  );
}

function InventoryPageInner() {
  const loading = useSimulatedLoad();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "stones";
  const [tab, setTab] = useState(tabParam);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [toast, setToast] = useState("");
  const [disabledStones, setDisabledStones] = useState<Set<string>>(new Set());
  const [outOfStockStones, setOutOfStockStones] = useState<Set<string>>(new Set());
  const [sellingFastStones, setSellingFastStones] = useState<Set<string>>(new Set());
  const [disabledDesigns, setDisabledDesigns] = useState<Set<string>>(new Set());
  const [outOfStockDesigns, setOutOfStockDesigns] = useState<Set<string>>(new Set());
  const [sellingFastDesigns, setSellingFastDesigns] = useState<Set<string>>(new Set());

  const [stoneType, setStoneType] = useState<string[]>([]);
  const [color, setColor] = useState<string[]>([]);
  const [intent, setIntent] = useState<string[]>([]);
  const [zodiac, setZodiac] = useState<string[]>([]);

  const [form, setForm] = useState<string[]>([]);
  const [metal, setMetal] = useState<string[]>([]);

  const [stoneSort, setStoneSort] = useState("");
  const [designSort, setDesignSort] = useState("");
  const [stonePage, setStonePage] = useState(1);
  const [designPage, setDesignPage] = useState(1);
  const [energTab, setEnergTab] = useState<"packages" | "gurujis">("packages");

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

  const toggleStoneStock = (sku: string) => {
    const wasOOS = outOfStockStones.has(sku);
    setOutOfStockStones((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku); else next.add(sku);
      return next;
    });
    setToast(wasOOS ? "Stone marked as in stock" : "Stone marked as out of stock");
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

  const toggleDesignStock = (slug: string) => {
    const wasOOS = outOfStockDesigns.has(slug);
    setOutOfStockDesigns((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
    setToast(wasOOS ? "Design marked as in stock" : "Design marked as out of stock");
    setTimeout(() => setToast(""), 3000);
  };

  const toggleStoneSellingFast = (sku: string) => {
    const was = sellingFastStones.has(sku);
    setSellingFastStones((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku); else next.add(sku);
      return next;
    });
    setToast(was ? "Selling fast removed" : "Marked as selling fast");
    setTimeout(() => setToast(""), 3000);
  };

  const toggleDesignSellingFast = (slug: string) => {
    const was = sellingFastDesigns.has(slug);
    setSellingFastDesigns((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
    setToast(was ? "Selling fast removed" : "Marked as selling fast");
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

  const intentGems = useMemo(
    () => intent.map((lbl) => INTENTS.find((i) => i.label === lbl)?.gem).filter(Boolean) as string[],
    [intent],
  );

  const filteredStones = useMemo(() => {
    return STONES.filter((s: Stone) => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.sku.toLowerCase().includes(q) && !s.gemName.toLowerCase().includes(q)) return false;
      }
      if (stoneType.length && !stoneType.includes(s.gem)) return false;
      if (color.length && !color.includes(s.shade)) return false;
      if (intentGems.length && !intentGems.includes(s.gem)) return false;
      if (zodiac.length && !zodiac.includes(s.planet)) return false;
      return true;
    }).sort((a, b) => {
      if (stoneSort === "price_asc") return a.price - b.price;
      if (stoneSort === "price_desc") return b.price - a.price;
      if (stoneSort === "ratti_asc") return a.ratti - b.ratti;
      if (stoneSort === "ratti_desc") return b.ratti - a.ratti;
      return 0;
    });
  }, [search, stoneType, color, intentGems, zodiac, stoneSort]);

  const filteredDesigns = useMemo(() => {
    return DESIGNS.filter((d: Design) => {
      if (search) {
        const q = search.toLowerCase();
        if (!d.name.toLowerCase().includes(q) && !d.slug.toLowerCase().includes(q) && !d.form.toLowerCase().includes(q)) return false;
      }
      if (form.length && !form.includes(d.form)) return false;
      if (metal.length && !metal.includes(d.metal)) return false;
      return true;
    }).sort((a, b) => {
      if (designSort === "name_asc") return a.name.localeCompare(b.name);
      if (designSort === "stock_asc") return a.remaining - b.remaining;
      if (designSort === "stock_desc") return b.remaining - a.remaining;
      return 0;
    });
  }, [search, form, metal, designSort]);

  const PER_PAGE = 10;
  const stoneTotalPages = Math.ceil(filteredStones.length / PER_PAGE);
  const stoneCurrentPage = stonePage > stoneTotalPages && stoneTotalPages > 0 ? stoneTotalPages : stonePage;
  const stonePaginated = filteredStones.slice((stoneCurrentPage - 1) * PER_PAGE, stoneCurrentPage * PER_PAGE);
  const designTotalPages = Math.ceil(filteredDesigns.length / PER_PAGE);
  const designCurrentPage = designPage > designTotalPages && designTotalPages > 0 ? designTotalPages : designPage;
  const designPaginated = filteredDesigns.slice((designCurrentPage - 1) * PER_PAGE, designCurrentPage * PER_PAGE);

  const stoneFilterCount = stoneType.length + color.length + intent.length + zodiac.length;
  const designFilterCount = form.length + metal.length;
  const clearStoneFilters = () => { setStoneType([]); setColor([]); setIntent([]); setZodiac([]); setStonePage(1); };
  const clearDesignFilters = () => { setForm([]); setMetal([]); setDesignPage(1); };

  const pageTitle = tab === "stones" ? "Stones" : tab === "designs" ? "Jewellery Designs" : "Energisation Packages";
  const pageSub = tab === "stones"
    ? "Gemstone inventory synced from Shopify"
    : tab === "designs"
      ? "Jewellery designs synced from Shopify"
      : "Energisation packages available for customers";

  return (
    <>
      <div className={tab !== "energisation" ? "md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0" : ""}>
      <PageHeader
        title={pageTitle}
        action={
          <ShopifyButton href="https://admin.shopify.com/products">Open Shopify Products</ShopifyButton>
        }
      />



      {/* Pinned controls — search + filters stay visible while the table scrolls */}
      {tab !== "energisation" && (
        <div
          className="sticky top-0 z-30 -mx-5 md:-mx-10 px-5 md:px-10 pt-1 pb-1 mb-1"
          style={{ background: "transparent" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {/* Filters — open inline pills */}
            <div className="flex flex-wrap items-center gap-2">
              {tab === "stones" ? (
                <>
                  <InlineFilter label="Stone type" icon={INV_ICONS.stone} count={stoneType.length} width={240}>
                    <MultiCheck options={STONE_TYPES.filter((o) => o.value)} value={stoneType} onChange={setStoneType} onAfter={() => setStonePage(1)} />
                  </InlineFilter>
                  <InlineFilter label="Colour" icon={INV_ICONS.colour} count={color.length} width={220}>
                    <MultiCheck options={COLOR_OPTIONS.filter((o) => o.value)} value={color} onChange={setColor} onAfter={() => setStonePage(1)} />
                  </InlineFilter>
                  <InlineFilter label="Zodiac" icon={INV_ICONS.zodiac} count={zodiac.length} width={220}>
                    <MultiCheck options={ZODIAC_OPTIONS.filter((o) => o.value)} value={zodiac} onChange={setZodiac} onAfter={() => setStonePage(1)} />
                  </InlineFilter>
                  {stoneFilterCount > 0 && (
                    <button onClick={clearStoneFilters} className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap" style={{ color: T.danger }}>Clear all</button>
                  )}
                </>
              ) : (
                <>
                  <InlineFilter label="Design type" icon={INV_ICONS.design} count={form.length} width={200}>
                    <MultiCheck options={FORM_OPTIONS.filter((o) => o.value)} value={form} onChange={setForm} onAfter={() => setDesignPage(1)} />
                  </InlineFilter>
                  <InlineFilter label="Metal" icon={INV_ICONS.metal} count={metal.length} width={200}>
                    <MultiCheck options={METAL_OPTIONS.filter((o) => o.value)} value={metal} onChange={setMetal} onAfter={() => setDesignPage(1)} />
                  </InlineFilter>
                  {designFilterCount > 0 && (
                    <button onClick={clearDesignFilters} className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap" style={{ color: T.danger }}>Clear all</button>
                  )}
                </>
              )}
            </div>
            {/* Search + sort — right */}
            <div className="ml-auto flex items-center gap-2">
              <ToolbarSearch
                value={search}
                onChange={(v) => { setSearch(v); setStonePage(1); setDesignPage(1); }}
                placeholder={tab === "stones" ? "Search SKU, gemstone…" : "Search design name…"}
              />
              {tab === "stones" ? (
                <SortMenu
                  value={stoneSort}
                  onChange={(v) => { setStoneSort(v); setStonePage(1); }}
                  options={[
                    { value: "", label: "Featured" },
                    { value: "price_asc", label: "Price low to high" },
                    { value: "price_desc", label: "Price high to low" },
                    { value: "ratti_asc", label: "Weight low to high" },
                    { value: "ratti_desc", label: "Weight high to low" },
                  ]}
                />
              ) : (
                <SortMenu
                  value={designSort}
                  onChange={(v) => { setDesignSort(v); setDesignPage(1); }}
                  options={[
                    { value: "", label: "Featured" },
                    { value: "name_asc", label: "Name A to Z" },
                    { value: "stock_asc", label: "Stock low to high" },
                    { value: "stock_desc", label: "Stock high to low" },
                  ]}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "stones" && (
        <>
        <Card className="!p-0 md:flex md:flex-col md:min-h-0">
          <div className="flex items-center justify-between px-4 h-11 rounded-t-[15px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <h2 className="text-[13.5px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>
              {filteredStones.length} stones
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.06em] font-medium px-2 py-[3px] rounded-[6px] whitespace-nowrap" style={{ color: SHOPIFY_GREEN_DARK, background: SHOPIFY_TINT }}><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: SHOPIFY_GREEN_DARK }} /> Synced with Shopify</span>
          </div>
          {loading ? <TableSkeleton cols={7} rows={8} /> : <>
          <div
            className="hidden md:grid grid-cols-[minmax(220px,1.4fr)_130px_130px_100px_80px_120px_48px] gap-x-4 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium"
            style={{ color: T.faint, borderBottom: `1px solid ${T.border}` }}
          >
            <span>Stone</span>
            <span>Intent</span>
            <span>Zodiac</span>
            <span>Colour</span>
            <span className="text-right">Inventory</span>
            <span className="text-right">Total</span>
            <span />
          </div>
          <div className="md:flex-1 md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
          {stonePaginated.map((s, i, arr) => (
            <div
              key={s.sku}
              className="grid md:grid-cols-[minmax(220px,1.4fr)_130px_130px_100px_80px_120px_48px] grid-cols-1 gap-x-4 gap-y-1.5 items-center px-4 py-2.5 text-[13px] even:bg-[rgba(89,82,54,0.025)] last:rounded-b-[15px]"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
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
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium truncate" style={{ color: T.text }}>{s.gemName}</span>
                    {disabledStones.has(s.sku) && <span className="shrink-0 text-[10px] font-semibold px-1.5 py-[1px] rounded-[4px]" style={{ background: "rgba(163,73,63,0.1)", color: T.danger }}>Disabled</span>}
                    {outOfStockStones.has(s.sku) && <span className="shrink-0 text-[10px] font-semibold px-1.5 py-[1px] rounded-[4px]" style={{ background: "rgba(163,73,63,0.1)", color: T.danger }}>Out of Stock</span>}
                    {sellingFastStones.has(s.sku) && !outOfStockStones.has(s.sku) && !disabledStones.has(s.sku) && <span className="shrink-0 text-[10px] font-semibold px-1.5 py-[1px] rounded-[4px]" style={{ background: "rgba(197,123,26,0.1)", color: "#c57b1a" }}>Selling Fast</span>}
                  </span>
                  <span className="block text-[11px] tracking-[0.05em] uppercase tabular-nums" style={{ color: T.faint }}>{s.sku} · {s.ratti} r</span>
                </span>
              </span>
              <span className="text-[12px] truncate" style={{ color: T.muted }}>{s.purpose?.[0] || "—"}</span>
              <span className="text-[12px]" style={{ color: T.muted }}>{s.planetGlyph} {s.planet}</span>
              <span className="text-[12px]" style={{ color: T.muted }}>{s.shade || s.colour || "—"}</span>
              <span className="tabular-nums md:text-right text-[12px]" style={{ color: outOfStockStones.has(s.sku) ? T.danger : T.muted }}>{outOfStockStones.has(s.sku) ? "0" : "1"}</span>
              <span className="tabular-nums md:text-right font-semibold" style={{ color: T.text }}>{catalogInr(s.price)}</span>
              <span className="flex items-center justify-end">
                <ItemRowMenu
                  shopifyUrl={`https://admin.shopify.com/products/${s.sku}`}
                  websiteUrl={`https://astrolaabh.house/stones/${s.slug}`}
                  enabled={!disabledStones.has(s.sku)}
                  onToggle={() => toggleStone(s.sku)}
                  outOfStock={outOfStockStones.has(s.sku)}
                  onOutOfStock={() => toggleStoneStock(s.sku)}
                  sellingFast={sellingFastStones.has(s.sku)}
                  onSellingFast={() => toggleStoneSellingFast(s.sku)}
                />
              </span>
            </div>
          ))}
          {filteredStones.length === 0 && (
            <EmptyState inline icon="gem" title="No stones" description="No stones match these filters." />
          )}
          </div>
          </>}
        </Card>
        <Pagination page={stoneCurrentPage - 1} totalPages={stoneTotalPages} totalItems={filteredStones.length} perPage={PER_PAGE} onPageChange={(p) => setStonePage(p + 1)} />
        </>
      )}

      {tab === "designs" && (
        <>
        <Card className="!p-0 md:flex md:flex-col md:min-h-0">
          <div className="flex items-center justify-between px-4 h-11 rounded-t-[15px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <h2 className="text-[13.5px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>
              {filteredDesigns.length} designs
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.06em] font-medium px-2 py-[3px] rounded-[6px] whitespace-nowrap" style={{ color: SHOPIFY_GREEN_DARK, background: SHOPIFY_TINT }}><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: SHOPIFY_GREEN_DARK }} /> Synced with Shopify</span>
          </div>
          {loading ? <TableSkeleton cols={5} rows={8} /> : <>
          <div
            className="hidden md:grid grid-cols-[minmax(200px,1.2fr)_120px_120px_120px_48px] gap-x-4 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium"
            style={{ color: T.faint, borderBottom: `1px solid ${T.border}` }}
          >
            <span>Design</span>
            <span>Design type</span>
            <span>Metal type</span>
            <span className="text-right">Remaining</span>
            <span />
          </div>
          <div className="md:flex-1 md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
          {designPaginated.map((d, i, arr) => (
            <div
              key={d.slug}
              className="grid md:grid-cols-[minmax(200px,1.2fr)_120px_120px_120px_48px] grid-cols-1 gap-x-4 gap-y-1.5 items-center px-4 py-2.5 text-[13px] even:bg-[rgba(89,82,54,0.025)] last:rounded-b-[15px]"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
            >
              <span className="flex items-center gap-3 min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={designThumb(d)}
                  alt={d.name}
                  className="w-9 h-9 rounded-[8px] object-cover shrink-0"
                  style={{ border: `1px solid ${T.borderSoft}`, background: "#fffdf5" }}
                  loading="lazy"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium truncate" style={{ color: T.text }}>{d.name}</span>
                    {disabledDesigns.has(d.slug) && <span className="shrink-0 text-[10px] font-semibold px-1.5 py-[1px] rounded-[4px]" style={{ background: "rgba(163,73,63,0.1)", color: T.danger }}>Disabled</span>}
                    {outOfStockDesigns.has(d.slug) && <span className="shrink-0 text-[10px] font-semibold px-1.5 py-[1px] rounded-[4px]" style={{ background: "rgba(163,73,63,0.1)", color: T.danger }}>Out of Stock</span>}
                    {sellingFastDesigns.has(d.slug) && !outOfStockDesigns.has(d.slug) && !disabledDesigns.has(d.slug) && <span className="shrink-0 text-[10px] font-semibold px-1.5 py-[1px] rounded-[4px]" style={{ background: "rgba(197,123,26,0.1)", color: "#c57b1a" }}>Selling Fast</span>}
                  </span>
                  <span className="block text-[11px] tracking-[0.05em] uppercase" style={{ color: T.faint }}>{d.slug}</span>
                </span>
              </span>
              <span className="text-[13px]" style={{ color: T.muted }}>{d.form}</span>
              <span className="text-[13px]" style={{ color: T.muted }}>{d.metal}</span>
              <span className="tabular-nums md:text-right font-medium" style={{ color: d.remaining === 0 ? T.danger : T.text }}>{d.remaining}</span>
              <span className="flex items-center justify-end">
                <ItemRowMenu
                  shopifyUrl={`https://admin.shopify.com/products/${d.slug}`}
                  websiteUrl={`https://astrolaabh.house/designs/${d.slug}`}
                  enabled={!disabledDesigns.has(d.slug)}
                  onToggle={() => toggleDesign(d.slug)}
                  outOfStock={outOfStockDesigns.has(d.slug)}
                  onOutOfStock={() => toggleDesignStock(d.slug)}
                  sellingFast={sellingFastDesigns.has(d.slug)}
                  onSellingFast={() => toggleDesignSellingFast(d.slug)}
                />
              </span>
            </div>
          ))}
          {filteredDesigns.length === 0 && (
            <EmptyState inline icon="gem" title="No designs" description="No jewellery designs match these filters." />
          )}
          </div>
          </>}
        </Card>
        <Pagination page={designCurrentPage - 1} totalPages={designTotalPages} totalItems={filteredDesigns.length} perPage={PER_PAGE} onPageChange={(p) => setDesignPage(p + 1)} />
        </>
      )}

      {tab === "energisation" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div
              className="inline-flex items-center gap-1 p-1 rounded-full"
              style={{ background: "rgba(89,82,54,0.07)", border: `1px solid ${T.borderSoft}` }}
            >
              {([["packages", `Packages`, ENERGISATION.length], ["gurujis", "Gurujis / Pandits", GURUJIS.length]] as const).map(([key, label, count]) => {
                const active = energTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setEnergTab(key)}
                    className="h-8 px-3.5 rounded-full text-[13px] whitespace-nowrap inline-flex items-center gap-1.5 shrink-0 transition-all duration-200 cursor-pointer"
                    style={
                      active
                        ? { background: T.card, color: T.text, fontWeight: 600, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(43,42,34,0.10)" }
                        : { color: T.muted, border: "1px solid transparent" }
                    }
                  >
                    {label}
                    <span
                      className="text-[11px] font-semibold tabular-nums min-w-[18px] px-1.5 py-px rounded-full text-center"
                      style={active ? { color: T.accentInk, background: T.accent } : { color: T.faint, background: "rgba(89,82,54,0.08)" }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.06em] font-medium px-2 py-[3px] rounded-[6px] whitespace-nowrap" style={{ color: SHOPIFY_GREEN_DARK, background: SHOPIFY_TINT }}><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: SHOPIFY_GREEN_DARK }} /> Synced with Shopify</span>
          </div>

          {energTab === "packages" && (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {ENERGISATION.map((tier, ti) => {
              const enabled = !disabledEnergisation.has(tier.key);
              return (
                <div
                  key={tier.key}
                  className="rounded-[18px] p-5 flex flex-col transition-opacity duration-200"
                  style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow, opacity: enabled ? 1 : 0.55 }}
                >
                  {/* Tier rung + free marker */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10.5px] font-semibold tracking-[0.14em] uppercase" style={{ color: T.gold }}>
                      Tier {ti + 1}
                    </span>
                    {tier.fee === 0 && <Chip tone="good">Free</Chip>}
                  </div>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-[16px] font-semibold" style={{ color: T.text }}>{tier.name}</span>
                    <span className="font-devanagari text-[12px]" style={{ color: T.faint }}>{tier.sanskrit}</span>
                  </div>

                  <div className="font-title text-[24px] font-semibold tracking-[-0.01em] tabular-nums mt-3" style={{ color: T.text }}>
                    {tier.fee === 0 ? "Included" : catalogInr(tier.fee)}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{tier.duration}</div>

                  {/* What the tier includes */}
                  <div className="mt-4 pt-4 space-y-2" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    {tier.includes.slice(0, 3).map((inc) => (
                      <div key={inc} className="flex items-start gap-2 text-[12px] leading-snug" style={{ color: T.muted }}>
                        <span
                          className="w-[15px] h-[15px] rounded-full flex items-center justify-center shrink-0 mt-px"
                          style={{ background: T.accentMuted }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-[8px] h-[8px]" style={{ color: T.accent }}>
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </span>
                        <span className="min-w-0">{inc}</span>
                      </div>
                    ))}
                    {tier.includes.length > 3 && (
                      <div className="text-[11px] pl-[23px]" style={{ color: T.faint }}>+{tier.includes.length - 3} more</div>
                    )}
                  </div>

                  {/* Listing state + actions */}
                  <div className="mt-auto flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <ExternalLink href={`https://admin.shopify.com/products/energisation-${tier.key}`} label="Shopify" shopify />
                    <ToggleSwitch enabled={enabled} onToggle={() => toggleEnergisation(tier.key)} />
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {energTab === "gurujis" && (
          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
            <div className="flex items-center justify-between px-4 h-12 rounded-t-[15px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <h2 className="text-[13.5px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>
                Gurujis / Pandits
              </h2>
              <button
                onClick={() => setShowAddGuruji(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12px] font-medium cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                style={{ background: T.popover, border: `1px solid ${T.border}`, color: T.text }}
              >
                + Add Guruji
              </button>
            </div>
            <div
              className="hidden md:grid grid-cols-[minmax(220px,1.3fr)_1fr_130px_150px_130px] gap-x-4 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium"
              style={{ color: T.faint, borderBottom: `1px solid ${T.border}` }}
            >
              <span>Guruji</span>
              <span>Speciality</span>
              <span>Location</span>
              <span>Phone</span>
              <span className="text-right">Status</span>
            </div>
            {GURUJIS.map((g, i) => {
              const enabled = !disabledGurujis.has(g.id);
              return (
                <div
                  key={g.id}
                  className="grid md:grid-cols-[minmax(220px,1.3fr)_1fr_130px_150px_130px] grid-cols-1 gap-x-4 gap-y-1 items-center px-4 py-2.5 transition-opacity even:bg-[rgba(89,82,54,0.025)] last:rounded-b-[15px]"
                  style={{ borderBottom: i < GURUJIS.length - 1 ? `1px solid ${T.borderSoft}` : "none", opacity: enabled ? 1 : 0.55 }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[11.5px] font-semibold shrink-0"
                      style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}`, color: T.accent }}
                    >
                      {g.name.split(" ").map((w) => w[0]).slice(-2).join("")}
                    </span>
                    <span className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{g.name}</span>
                  </div>
                  <span className="text-[12px] truncate md:pl-0 pl-11" style={{ color: T.muted }}>{g.speciality}</span>
                  <span className="text-[12px] truncate md:pl-0 pl-11" style={{ color: T.muted }}>{g.location}</span>
                  <span className="text-[12px] tabular-nums md:pl-0 pl-11" style={{ color: T.muted }}>{g.phone}</span>
                  <div className="flex items-center gap-2.5 justify-end md:pl-0 pl-11">
                    <span className="text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: enabled ? T.good : T.faint }}>
                      {enabled ? "Active" : "Inactive"}
                    </span>
                    <ToggleSwitch enabled={enabled} onToggle={() => toggleGuruji(g.id)} />
                  </div>
                </div>
              );
            })}
          </Card>
          )}

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

      {toast && <Toast message={toast} />}
      </div>
    </>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
      <InventoryPageInner />
    </Suspense>
  );
}
