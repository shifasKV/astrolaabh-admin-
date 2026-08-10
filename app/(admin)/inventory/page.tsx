"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Card, SearchFilter, Select, Chip, Modal, Input, GoldBtn, GhostBtn } from "@/components/ui";
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
        background: enabled ? `${T.accent}30` : "rgba(255,255,255,0.06)",
        border: `1px solid ${enabled ? `${T.accent}60` : "rgba(255,255,255,0.12)"}`,
      }}
      title={enabled ? "Enabled — click to disable" : "Disabled — click to enable"}
    >
      <span
        className="inline-block h-[16px] w-[16px] rounded-full transition-transform duration-200"
        style={{
          background: enabled ? T.accent : "rgba(255,255,255,0.25)",
          transform: enabled ? "translateX(20px)" : "translateX(3px)",
        }}
      />
    </button>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-[6px] transition-colors hover:brightness-125"
      style={{ border: `1px solid ${T.borderSoft}`, color: T.muted }}
    >
      {label} <span className="text-[10px]">↗</span>
    </a>
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
    });
  }, [search, stoneType, color, intentGem, zodiac]);

  const filteredDesigns = useMemo(() => {
    return DESIGNS.filter((d: Design) => {
      if (search) {
        const q = search.toLowerCase();
        if (!d.name.toLowerCase().includes(q) && !d.slug.toLowerCase().includes(q) && !d.form.toLowerCase().includes(q)) return false;
      }
      if (form && d.form !== form) return false;
      if (metal && d.metal !== metal) return false;
      return true;
    });
  }, [search, form, metal]);

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
          <a href="https://admin.shopify.com/products" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-[8px]" style={{ border: `1px solid ${T.border}`, color: T.good }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.good }} />
            Open Shopify Products ↗
          </a>
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
        </div>
      )}

      {tab === "stones" && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>
              {filteredStones.length} stones
            </div>
            <Chip tone="good">Synced · Shopify</Chip>
          </div>
          {filteredStones.slice(0, 30).map((s) => (
            <div key={s.sku} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3 text-[13px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <span className="font-medium w-[110px]" style={{ color: T.text }}>{s.sku}</span>
              <span className="w-[140px]" style={{ color: T.muted }}>{s.gemName} · {s.ratti}r</span>
              <span className="tabular-nums text-[12.5px]" style={{ color: T.muted }}>{catalogInr(s.pricePerRatti)}/r · {catalogInr(s.price)}</span>
              <span className="ml-auto flex items-center gap-3">
                <ExternalLink href={`https://admin.shopify.com/products/${s.sku}`} label="Shopify" />
                <ExternalLink href={`https://astrolaabh.house/stones/${s.slug}`} label="Website" />
                <ToggleSwitch enabled={!disabledStones.has(s.sku)} onToggle={() => toggleStone(s.sku)} />
              </span>
            </div>
          ))}
          {filteredStones.length > 30 && (
            <p className="text-[12px] mt-3 text-center" style={{ color: T.faint }}>Showing 30 of {filteredStones.length} stones</p>
          )}
          {filteredStones.length === 0 && (
            <p className="text-[13px] py-6 text-center" style={{ color: T.muted }}>No stones match the current filters.</p>
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
          {filteredDesigns.map((d) => (
            <div key={d.slug} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3 text-[13px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <span className="font-medium w-[120px]" style={{ color: T.text }}>{d.name}</span>
              <span className="w-[80px]" style={{ color: T.muted }}>{d.form}</span>
              <span className="w-[80px] text-[12.5px]" style={{ color: T.faint }}>{d.metal}</span>
              <span className="text-[12.5px]" style={{ color: T.muted }}>run {d.runSize} · {d.remaining} remain</span>
              <span className="ml-auto flex items-center gap-3">
                <ExternalLink href={`https://admin.shopify.com/products/${d.slug}`} label="Shopify" />
                <ToggleSwitch enabled={!disabledDesigns.has(d.slug)} onToggle={() => toggleDesign(d.slug)} />
              </span>
            </div>
          ))}
          {filteredDesigns.length === 0 && (
            <p className="text-[13px] py-6 text-center" style={{ color: T.muted }}>No designs match the current filters.</p>
          )}
        </Card>
      )}

      {tab === "energisation" && (
        <>
          <Card className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>
                {ENERGISATION.length} packages
              </div>
              <Chip tone="good">Synced · Shopify</Chip>
            </div>
            {ENERGISATION.map((tier) => (
              <div key={tier.key} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3.5 text-[13px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span className="font-semibold w-[160px]" style={{ color: T.accent }}>{tier.name}</span>
                <span className="text-[11px] w-[80px]" style={{ color: T.faint }}>{tier.sanskrit}</span>
                <Chip tone={tier.fee === 0 ? "good" : "gold"}>{tier.fee === 0 ? "Free" : "Paid"}</Chip>
                <span className="text-[12.5px] tabular-nums" style={{ color: T.muted }}>{tier.fee === 0 ? "Included" : catalogInr(tier.fee)}</span>
                <span className="text-[11.5px]" style={{ color: T.faint }}>{tier.duration}</span>
                <span className="ml-auto flex items-center gap-3">
                  <ExternalLink href={`https://admin.shopify.com/products/energisation-${tier.key}`} label="Shopify" />
                  <ToggleSwitch enabled={!disabledEnergisation.has(tier.key)} onToggle={() => toggleEnergisation(tier.key)} />
                </span>
              </div>
            ))}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>
                Gurujis / Pandits
              </div>
              <button
                onClick={() => setShowAddGuruji(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[11.5px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: T.accent, color: T.accentInk }}
              >
                + Add Guruji
              </button>
            </div>
            {GURUJIS.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3.5 text-[13px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span className="font-medium w-[180px]" style={{ color: T.text }}>{g.name}</span>
                <span className="text-[12px] w-[140px]" style={{ color: T.muted }}>{g.speciality}</span>
                <span className="text-[11.5px] w-[120px]" style={{ color: T.faint }}>{g.location}</span>
                <span className="text-[11.5px]" style={{ color: T.muted }}>{g.phone}</span>
                <span className="ml-auto">
                  <ToggleSwitch enabled={!disabledGurujis.has(g.id)} onToggle={() => toggleGuruji(g.id)} />
                </span>
              </div>
            ))}
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
