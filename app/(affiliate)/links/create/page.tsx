"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, SearchFilter, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { STONES, DESIGNS, INTENTS, ZODIAC, inr as catalogInr } from "@/lib/catalog";
import type { Stone, Design } from "@/lib/catalog";
import { EXPERT_PROFILES } from "@/lib/mock";

const STONE_TYPE_OPTIONS = [
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
  { value: "Raspberry", label: "Raspberry" },
  { value: "Cornflower", label: "Cornflower" },
  { value: "Royal Blue", label: "Royal Blue" },
  { value: "Grass Green", label: "Grass Green" },
  { value: "Vivid Green", label: "Vivid Green" },
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
const METAL_CHIPS = ["22k gold", "18k gold", "Panchdhatu"];
const PER_PAGE = 12;

type FlowType = "stone" | "consultation";
type StoneStep = 1 | 2 | 3;

function Stepper({ steps, current, onStepClick }: { steps: string[]; current: number; onStepClick?: (step: number) => void }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        const isClickable = isDone && onStepClick;
        return (
          <div key={label} className="flex items-center">
            {i > 0 && <div className="w-10 h-[2px] mx-1" style={{ background: isDone ? T.accent : T.borderSoft }} />}
            <button
              type="button"
              onClick={() => isClickable && onStepClick(stepNum)}
              className={`flex items-center gap-2 ${isClickable ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 transition-all"
                style={{
                  background: isDone ? T.accent : isActive ? `${T.accent}18` : T.panel,
                  color: isDone ? "#fff" : isActive ? T.accent : T.faint,
                  border: `1.5px solid ${isDone || isActive ? T.accent : T.borderSoft}`,
                }}
              >
                {isDone ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg> : stepNum}
              </div>
              <span className="text-[12px] font-medium whitespace-nowrap" style={{ color: isDone || isActive ? T.text : T.faint }}>{label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function CreateLinkPage() {
  const router = useRouter();
  const [toast, setToast] = useState("");
  const [flowType, setFlowType] = useState<FlowType>("stone");

  const [stoneStep, setStoneStep] = useState<StoneStep>(1);
  const [stoneSearch, setStoneSearch] = useState("");
  const [stoneType, setStoneType] = useState("");
  const [stoneColor, setStoneColor] = useState("");
  const [stoneIntent, setStoneIntent] = useState("");
  const [stoneZodiac, setStoneZodiac] = useState("");
  const [stonePage, setStonePage] = useState(0);
  const [selectedStone, setSelectedStone] = useState<Stone | null>(null);

  const [designSearch, setDesignSearch] = useState("");
  const [designForm, setDesignForm] = useState("");
  const [designMetal, setDesignMetal] = useState("");
  const [designPage, setDesignPage] = useState(0);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

  const [expertSearch, setExpertSearch] = useState("");
  const [selectedExpert, setSelectedExpert] = useState<typeof EXPERT_PROFILES[0] | null>(null);

  const [campaign, setCampaign] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const filteredStones = useMemo(() => {
    let items = STONES;
    if (stoneSearch) {
      const q = stoneSearch.toLowerCase();
      items = items.filter((s) => s.gemName.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q) || s.english.toLowerCase().includes(q));
    }
    if (stoneType) items = items.filter((s) => s.gem === stoneType);
    if (stoneColor) items = items.filter((s) => s.shade === stoneColor || s.colour === stoneColor);
    if (stoneIntent) items = items.filter((s) => s.purpose.some((p) => p === stoneIntent));
    if (stoneZodiac) items = items.filter((s) => s.planet === stoneZodiac);
    return items;
  }, [stoneSearch, stoneType, stoneColor, stoneIntent, stoneZodiac]);
  const stonePages = Math.ceil(filteredStones.length / PER_PAGE);
  const stonePaged = filteredStones.slice(stonePage * PER_PAGE, (stonePage + 1) * PER_PAGE);

  const filteredDesigns = useMemo(() => {
    let items = DESIGNS.filter((d) => d.remaining > 0);
    if (designSearch) {
      const q = designSearch.toLowerCase();
      items = items.filter((d) => d.name.toLowerCase().includes(q) || d.form.toLowerCase().includes(q));
    }
    if (designForm) items = items.filter((d) => d.form === designForm);
    if (designMetal) items = items.filter((d) => d.metal === designMetal);
    return items;
  }, [designSearch, designForm, designMetal]);
  const designPages = Math.ceil(filteredDesigns.length / PER_PAGE);
  const designPaged = filteredDesigns.slice(designPage * PER_PAGE, (designPage + 1) * PER_PAGE);

  const filteredExperts = useMemo(() => {
    let items = EXPERT_PROFILES.filter((e) => e.status === "active");
    if (expertSearch) {
      const q = expertSearch.toLowerCase();
      items = items.filter((e) => e.name.toLowerCase().includes(q) || e.specialization.toLowerCase().includes(q));
    }
    return items;
  }, [expertSearch]);

  const buildUrl = () => {
    let url = "https://astrolaabh.house/r/SANDEEP108";
    const params: string[] = [];
    if (selectedStone) {
      params.push(`stone=${selectedStone.slug}`);
      if (selectedDesign) params.push(`design=${selectedDesign.slug}`);
    }
    if (selectedExpert) params.push(`consult=${selectedExpert.id}`);
    if (campaign.trim()) params.push(`c=${campaign.trim().toLowerCase().replace(/\s+/g, "-")}`);
    if (params.length) url += "?" + params.join("&");
    return url;
  };

  const generateAndCopy = () => {
    const url = buildUrl();
    navigator.clipboard.writeText(url);
    showToast("Link copied to clipboard!");
  };

  const switchType = (t: FlowType) => {
    setFlowType(t);
    setStoneStep(1);
    setSelectedStone(null);
    setSelectedDesign(null);
    setSelectedExpert(null);
    setCampaign("");
  };

  const handleStepClick = (step: number) => {
    if (step < stoneStep) setStoneStep(step as StoneStep);
  };

  return (
    <>
      <PageHeader title="Create Affiliate Link" back={{ label: "Links", href: "/links" }} />

      {/* Type toggle + Stepper row */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex rounded-[10px] overflow-hidden" style={{ border: `1.5px solid ${T.border}` }}>
          {(["stone", "consultation"] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchType(t)}
              className="px-5 py-2.5 text-[13px] font-medium transition-all cursor-pointer capitalize"
              style={{ background: flowType === t ? T.accent : "transparent", color: flowType === t ? "#fff" : T.muted }}
            >{t === "stone" ? "Stone" : "Consultation"}</button>
          ))}
        </div>
        {flowType === "stone" && <Stepper steps={["Choose Stone", "Choose Jewellery", "Generate Link"]} current={stoneStep} onStepClick={handleStepClick} />}
        {flowType === "consultation" && <Stepper steps={["Choose Expert", "Generate Link"]} current={selectedExpert ? 2 : 1} />}
      </div>

      {/* ==================== STONE FLOW ==================== */}
      {flowType === "stone" && (
        <>
          {/* ---- Step 1: Choose stone ---- */}
          {stoneStep === 1 && (
            <>
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <div className="flex-1 min-w-[200px] max-w-[350px]">
                  <SearchFilter search={stoneSearch} onSearchChange={(v) => { setStoneSearch(v); setStonePage(0); }} placeholder="Search SKU, gemstone…" />
                </div>
                <div className="w-[160px]"><Select value={stoneType} onChange={(v) => { setStoneType(v); setStonePage(0); }} compact options={STONE_TYPE_OPTIONS} /></div>
                <div className="w-[140px]"><Select value={stoneColor} onChange={(v) => { setStoneColor(v); setStonePage(0); }} compact options={COLOR_OPTIONS} /></div>
                <div className="w-[150px]"><Select value={stoneIntent} onChange={(v) => { setStoneIntent(v); setStonePage(0); }} compact options={INTENT_OPTIONS} /></div>
                <div className="w-[140px]"><Select value={stoneZodiac} onChange={(v) => { setStoneZodiac(v); setStonePage(0); }} compact options={ZODIAC_OPTIONS} /></div>
              </div>

              <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>{filteredStones.length} stones</div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {stonePaged.map((s) => (
                  <button
                    key={s.sku}
                    type="button"
                    onClick={() => { setSelectedStone(s); setStoneStep(2); }}
                    className="rounded-[12px] p-3 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                    style={{ background: T.card, border: `1.5px solid ${T.border}` }}
                  >
                    <div className="flex justify-center mb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/gems/${s.gem}.png`} alt={s.gemName} className="w-16 h-16 rounded-[10px] object-cover" style={{ border: `1px solid ${T.borderSoft}` }} loading="lazy" />
                    </div>
                    <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{s.gemName}</div>
                    <div className="text-[11px] mt-0.5 tabular-nums" style={{ color: T.faint }}>{s.sku}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px]" style={{ color: T.muted }}>{s.ratti} ratti</span>
                      <span className="text-[13px] font-semibold tabular-nums" style={{ color: T.accent }}>{catalogInr(s.price)}</span>
                    </div>
                  </button>
                ))}
              </div>

              {filteredStones.length === 0 && <div className="text-center py-10 text-[13px]" style={{ color: T.muted }}>No stones match the current filters.</div>}
              {stonePages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  <button onClick={() => setStonePage((p) => Math.max(0, p - 1))} disabled={stonePage === 0} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30" style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>‹</button>
                  <span className="text-[12px] px-2" style={{ color: T.muted }}>{stonePage + 1} of {stonePages}</span>
                  <button onClick={() => setStonePage((p) => Math.min(stonePages - 1, p + 1))} disabled={stonePage >= stonePages - 1} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30" style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>›</button>
                </div>
              )}
            </>
          )}

          {/* ---- Step 2: Choose jewellery (optional) ---- */}
          {stoneStep === 2 && (
            <>
              {selectedStone && (
                <div className="rounded-[12px] px-4 py-3 mb-4 flex items-center gap-3" style={{ background: `${T.accent}06`, border: `1px solid ${T.accent}25` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/gems/${selectedStone.gem}.png`} alt={selectedStone.gemName} className="w-10 h-10 rounded-[8px] object-cover" style={{ border: `1px solid ${T.borderSoft}` }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold" style={{ color: T.text }}>{selectedStone.gemName}</span>
                    <span className="text-[12px] ml-2" style={{ color: T.muted }}>{selectedStone.sku} · {catalogInr(selectedStone.price)}</span>
                  </div>
                  <button onClick={() => setStoneStep(1)} className="text-[12px] cursor-pointer hover:underline" style={{ color: T.accent }}>Change stone</button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <div className="flex-1 min-w-[200px] max-w-[300px]">
                  <SearchFilter search={designSearch} onSearchChange={(v) => { setDesignSearch(v); setDesignPage(0); }} placeholder="Search design…" />
                </div>
                <div className="w-[140px]"><Select value={designForm} onChange={(v) => { setDesignForm(v); setDesignPage(0); }} compact options={FORM_OPTIONS} /></div>
              </div>

              {/* Metal chips */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => { setDesignMetal(""); setDesignPage(0); }}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer"
                  style={{ background: !designMetal ? T.accent : "transparent", color: !designMetal ? "#fff" : T.muted, border: `1px solid ${!designMetal ? T.accent : T.borderSoft}` }}
                >All metals</button>
                {METAL_CHIPS.map((m) => (
                  <button
                    key={m}
                    onClick={() => { setDesignMetal(designMetal === m ? "" : m); setDesignPage(0); }}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer"
                    style={{ background: designMetal === m ? T.accent : "transparent", color: designMetal === m ? "#fff" : T.muted, border: `1px solid ${designMetal === m ? T.accent : T.borderSoft}` }}
                  >{m}</button>
                ))}
              </div>

              <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>{filteredDesigns.length} designs</div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Loose stone option as the first card */}
                <button
                  type="button"
                  onClick={() => { setSelectedDesign(null); setStoneStep(3); }}
                  className="rounded-[12px] p-3 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: T.card, border: `1.5px dashed ${T.accent}50` }}
                >
                  <div className="flex justify-center mb-2">
                    <div className="w-16 h-16 rounded-[10px] flex items-center justify-center" style={{ background: `${T.accent}08`, border: `1px solid ${T.accent}20` }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    </div>
                  </div>
                  <div className="text-[13px] font-semibold" style={{ color: T.accent }}>Loose stone</div>
                  <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>No jewellery design</div>
                  <div className="text-[11px] mt-2 font-medium" style={{ color: T.accent }}>Select →</div>
                </button>

                {designPaged.map((d) => (
                  <button
                    key={d.slug}
                    type="button"
                    onClick={() => { setSelectedDesign(d); setStoneStep(3); }}
                    className="rounded-[12px] p-3 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                    style={{ background: T.card, border: `1.5px solid ${T.border}` }}
                  >
                    <div className="flex justify-center mb-2">
                      <div className="w-16 h-16 rounded-[10px] flex items-center justify-center text-[24px]" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
                        {d.form === "Ring" ? "💍" : d.form === "Pendant" ? "📿" : "⌚"}
                      </div>
                    </div>
                    <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{d.name}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>{d.form} · {d.metal}</div>
                    <div className="text-[11px] mt-1" style={{ color: T.faint }}>{d.remaining} in stock</div>
                  </button>
                ))}
              </div>

              {filteredDesigns.length === 0 && <div className="text-center py-10 text-[13px]" style={{ color: T.muted }}>No designs match the current filters.</div>}
              {designPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  <button onClick={() => setDesignPage((p) => Math.max(0, p - 1))} disabled={designPage === 0} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30" style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>‹</button>
                  <span className="text-[12px] px-2" style={{ color: T.muted }}>{designPage + 1} of {designPages}</span>
                  <button onClick={() => setDesignPage((p) => Math.min(designPages - 1, p + 1))} disabled={designPage >= designPages - 1} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30" style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>›</button>
                </div>
              )}
            </>
          )}

          {/* ---- Step 3: Generate link ---- */}
          {stoneStep === 3 && (
            <div className="max-w-[600px] space-y-4">
              <Card>
                <div className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Your selection</div>
                {selectedStone && (
                  <div className="flex items-center gap-3 mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/gems/${selectedStone.gem}.png`} alt={selectedStone.gemName} className="w-12 h-12 rounded-[10px] object-cover" style={{ border: `1px solid ${T.borderSoft}` }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold" style={{ color: T.text }}>{selectedStone.gemName}</div>
                      <div className="text-[12px]" style={{ color: T.muted }}>
                        {selectedStone.english} · {selectedStone.ratti} ratti · {catalogInr(selectedStone.price)}
                      </div>
                    </div>
                    <button onClick={() => setStoneStep(1)} className="text-[12px] cursor-pointer hover:underline" style={{ color: T.accent }}>Change</button>
                  </div>
                )}
                {selectedDesign ? (
                  <div className="flex items-center gap-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <div className="w-12 h-12 rounded-[10px] flex items-center justify-center text-[20px]" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
                      {selectedDesign.form === "Ring" ? "💍" : selectedDesign.form === "Pendant" ? "📿" : "⌚"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold" style={{ color: T.text }}>{selectedDesign.name}</div>
                      <div className="text-[12px]" style={{ color: T.muted }}>{selectedDesign.form} · {selectedDesign.metal}</div>
                    </div>
                    <button onClick={() => setStoneStep(2)} className="text-[12px] cursor-pointer hover:underline" style={{ color: T.accent }}>Change</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <span className="text-[12px]" style={{ color: T.muted }}>Loose stone (no jewellery)</span>
                    <button onClick={() => setStoneStep(2)} className="text-[12px] cursor-pointer hover:underline ml-auto" style={{ color: T.accent }}>Add jewellery</button>
                  </div>
                )}
              </Card>

              <Card>
                <div className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Campaign name (optional)</div>
                <input
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="e.g. youtube-aug, insta-reel"
                  className="w-full h-10 px-3 rounded-[9px] text-[13px] outline-none"
                  style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, color: T.text }}
                />
              </Card>

              <GoldBtn className="!h-12 !px-8 !text-[14px] w-full" onClick={generateAndCopy}>
                Generate link & copy to clipboard
              </GoldBtn>
            </div>
          )}
        </>
      )}

      {/* ==================== CONSULTATION FLOW ==================== */}
      {flowType === "consultation" && (
        <>
          <div className="flex flex-wrap items-center gap-2.5 mb-4 max-w-[700px]">
            <div className="flex-1 min-w-[200px]">
              <SearchFilter search={expertSearch} onSearchChange={setExpertSearch} placeholder="Search expert name, specialization…" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[700px]">
            {filteredExperts.map((e) => {
              const isSelected = selectedExpert?.id === e.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelectedExpert(e)}
                  className="rounded-[12px] p-5 text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 relative"
                  style={{ background: isSelected ? `${T.accent}08` : T.card, border: `1.5px solid ${isSelected ? T.accent : T.border}` }}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: T.accent }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                  )}
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold shrink-0" style={{ background: `${T.accent}15`, border: `2px solid ${T.accent}40`, color: T.accent }}>{e.name[0]}</div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold" style={{ color: T.text }}>{e.name}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{e.specialization}</div>
                      <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: T.faint }}>
                        <span>{e.experience}</span><span>·</span><span>{e.languages.join(", ")}</span><span>·</span><span style={{ color: T.accent }}>{catalogInr(e.fee)}/session</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredExperts.length === 0 && <div className="text-center py-10 text-[13px]" style={{ color: T.muted }}>No experts found.</div>}

          {selectedExpert && (
            <div className="max-w-[700px] mt-5 space-y-4">
              <Card>
                <div className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Campaign name (optional)</div>
                <input
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  placeholder="e.g. youtube-aug, insta-reel"
                  className="w-full h-10 px-3 rounded-[9px] text-[13px] outline-none"
                  style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, color: T.text }}
                />
              </Card>
              <GoldBtn className="!h-12 !px-8 !text-[14px] w-full" onClick={generateAndCopy}>
                Generate link & copy to clipboard
              </GoldBtn>
            </div>
          )}
        </>
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
