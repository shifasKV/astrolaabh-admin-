"use client";
import { useMemo, useState } from "react";
import { GoldBtn, GhostBtn, Chip, Input, Select, Modal } from "@/components/ui";
import { T } from "@/lib/theme";
import { STONES, DESIGNS, ENERGISATION, inr, imgFit } from "@/lib/catalog";

export interface RecommendationPickResult {
  stoneSku: string;
  gemstone: string;
  weightRange: string;
  metalSetting: string;
  designName: string;
  designSlug: string;
  form: string;
  energisationKey: string;
  energisationName: string;
}

const STEPS = [
  { key: "stone", label: "Stone", sub: "Pick or add a gemstone" },
  { key: "design", label: "Design", sub: "Setting or loose" },
  { key: "energisation", label: "Energisation", sub: "Ritual tier" },
] as const;

const FORMS = ["Ring", "Pendant", "Bracelet", "Loose stone"] as const;
const STONE_GEMS = [...new Set(STONES.map((s) => s.gemName))];
const GEM_OPTIONS = [
  { value: "pukhraj", label: "Pukhraj · Yellow Sapphire", english: "Yellow Sapphire", gemName: "Pukhraj" },
  { value: "manik", label: "Manik · Ruby", english: "Ruby", gemName: "Manik" },
  { value: "neelam", label: "Neelam · Blue Sapphire", english: "Blue Sapphire", gemName: "Neelam" },
  { value: "panna", label: "Panna · Emerald", english: "Emerald", gemName: "Panna" },
];
const SHADE_SWATCHES = ["#e7c14a", "#c0392b", "#2a4a8a", "#1f7a4d", "#d98324", "#7d5ba6", "#4a4a4a"];

type CustomStone = { gem: string; gemName: string; english: string; ratti: string; origin: string; shadeHex: string; price: string };

interface RecommendationPickerFlowProps {
  initial?: Partial<RecommendationPickResult>;
  startStep?: number;
  onCancel: () => void;
  onComplete: (result: RecommendationPickResult) => void;
}

export function RecommendationPickerFlow({ initial, startStep = 0, onCancel, onComplete }: RecommendationPickerFlowProps) {
  const [step, setStep] = useState(startStep);
  const [reached, setReached] = useState(startStep);

  const [stoneQuery, setStoneQuery] = useState("");
  const [stoneSku, setStoneSku] = useState(initial?.stoneSku ?? "");
  const [stoneGem, setStoneGem] = useState("");
  const [stonePreviewSku, setStonePreviewSku] = useState("");
  const [stoneCustomMode, setStoneCustomMode] = useState(false);
  const [customStone, setCustomStone] = useState<CustomStone | null>(null);
  const [draftStone, setDraftStone] = useState<CustomStone>({ gem: "pukhraj", gemName: "Pukhraj", english: "Yellow Sapphire", ratti: "", origin: "", shadeHex: SHADE_SWATCHES[0], price: "" });

  const [form, setForm] = useState(initial?.form ?? "Ring");
  const [designSlug, setDesignSlug] = useState(initial?.designSlug ?? "");
  const [designQuery, setDesignQuery] = useState("");
  const [previewSlug, setPreviewSlug] = useState("");
  const [customDesign, setCustomDesign] = useState(false);
  const [cdMetal, setCdMetal] = useState("22K Gold");
  const [cdPrice, setCdPrice] = useState("");

  const [energisationKey, setEnergisationKey] = useState(initial?.energisationKey ?? "shuddhi");

  const selectedStone = STONES.find((s) => s.sku === stoneSku);
  const selectedDesign = DESIGNS.find((d) => d.slug === designSlug);
  const previewStone = STONES.find((s) => s.sku === stonePreviewSku);
  const previewDesign = DESIGNS.find((d) => d.slug === previewSlug);
  const energisation = ENERGISATION.find((e) => e.key === energisationKey);

  const stoneMatches = useMemo(() => {
    const q = stoneQuery.trim().toLowerCase();
    const pool = stoneGem ? STONES.filter((s) => s.gemName === stoneGem) : STONES;
    if (!q) return pool.slice(0, 12);
    return pool.filter((s) =>
      s.gemName.toLowerCase().includes(q) ||
      s.english.toLowerCase().includes(q) ||
      s.sku.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      String(s.ratti).includes(q),
    ).slice(0, 12);
  }, [stoneQuery, stoneGem]);

  const designMatches = useMemo(() => {
    if (!form || form === "Loose stone") return [];
    const q = designQuery.trim().toLowerCase();
    return DESIGNS.filter((d) => d.form === form && d.remaining > 0 && (!q || d.name.toLowerCase().includes(q) || d.metal.toLowerCase().includes(q)));
  }, [form, designQuery]);

  const pickStone = (sku: string) => { setStoneSku(sku); setCustomStone(null); setStoneQuery(""); };
  const saveCustomStone = () => {
    if (!draftStone.ratti || !draftStone.price) return;
    setCustomStone(draftStone);
    setStoneSku("");
  };

  const stoneDone = !!selectedStone || !!customStone;
  const designDone = form === "Loose stone" || (customDesign ? !!(cdMetal && cdPrice) : !!selectedDesign);
  const stepDone = [stoneDone, designDone, true];

  const goTo = (i: number) => { if (i <= reached) setStep(i); };
  const next = () => {
    if (!stepDone[step]) return;
    const n = Math.min(step + 1, STEPS.length - 1);
    setStep(n);
    setReached((r) => Math.max(r, n));
  };

  const buildResult = (): RecommendationPickResult => {
    const stone = selectedStone;
    const design = selectedDesign;
    const gemLabel = customStone ? `${customStone.gemName} (${customStone.english})` : stone?.gemName ?? initial?.gemstone ?? "";
    const weight = customStone ? `${customStone.ratti} ratti` : stone ? `${stone.ratti} ratti` : initial?.weightRange ?? "";
    const metalSetting = form === "Loose stone"
      ? "Loose stone"
      : customDesign
        ? `${cdMetal} ${form}`
        : design
          ? `${design.metal} ${form}`
          : `${cdMetal} ${form}`;
    return {
      stoneSku: stone?.sku ?? "",
      gemstone: gemLabel,
      weightRange: weight,
      metalSetting,
      designName: form === "Loose stone" ? "Loose stone" : customDesign ? `Custom ${form}` : design?.name ?? "",
      designSlug: design?.slug ?? "",
      form,
      energisationKey,
      energisationName: energisation?.name ?? "",
    };
  };

  const handleComplete = () => onComplete(buildResult());

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[190px_1fr] gap-5 items-start">
        <nav>
          <ol className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
            {STEPS.map((s, i) => {
              const active = i === step;
              const done = i < reached || (stepDone[i] && i !== step);
              const clickable = i <= reached;
              return (
                <li key={s.key} className="shrink-0">
                  <button
                    type="button"
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
                      <span className="hidden md:block text-[11px]" style={{ color: T.faint }}>{s.sub}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-w-0 rounded-[12px] p-5" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
          {step === 0 && (
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Stone</h2>
              <p className="text-[12.5px] mt-0.5 mb-4" style={{ color: T.muted }}>Pick a gemstone from the vault, or enter a custom one.</p>
              {customStone ? (
                <div className="flex flex-wrap items-center gap-3 rounded-[12px] px-3.5 py-3" style={{ background: "linear-gradient(135deg, rgba(160,125,56,0.14), rgba(160,125,56,0.05))", border: "1px solid rgba(160,125,56,0.55)" }}>
                  <span className="w-9 h-9 rounded-[10px] shrink-0" style={{ background: customStone.shadeHex, border: `1px solid ${T.borderSoft}` }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>{customStone.gemName} · {customStone.english} <Chip tone="gold">Custom</Chip></div>
                    <div className="text-[12px] truncate" style={{ color: T.muted }}>{customStone.ratti}r{customStone.origin ? ` · ${customStone.origin}` : ""}</div>
                  </div>
                  <button type="button" onClick={() => setCustomStone(null)} className="text-[12px] font-medium cursor-pointer hover:underline underline-offset-4" style={{ color: T.accent }}>Change</button>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <div className="inline-flex p-0.5 rounded-[10px]" style={{ background: "rgba(89,82,54,0.08)" }}>
                      <button type="button" onClick={() => setStoneCustomMode(false)} className="h-8 px-3.5 rounded-[8px] text-[12.5px] cursor-pointer" style={!stoneCustomMode ? { background: T.card, color: T.text, fontWeight: 600 } : { color: T.muted }}>From vault</button>
                      <button type="button" onClick={() => setStoneCustomMode(true)} className="h-8 px-3.5 rounded-[8px] text-[12.5px] cursor-pointer" style={stoneCustomMode ? { background: T.card, color: T.text, fontWeight: 600 } : { color: T.muted }}>Custom stone</button>
                    </div>
                  </div>
                  {!stoneCustomMode && (
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div className="flex flex-wrap gap-1.5">
                        {["", ...STONE_GEMS].map((g) => (
                          <button key={g || "all"} type="button" onClick={() => { setStoneGem(g); setStoneQuery(""); }} className="h-8 px-3.5 rounded-full text-[12.5px] cursor-pointer" style={stoneGem === g ? { background: T.accent, color: T.accentInk, fontWeight: 600 } : { background: "rgba(89,82,54,0.06)", color: T.muted }}>{g || "All stones"}</button>
                        ))}
                      </div>
                      <input value={stoneQuery} onChange={(e) => setStoneQuery(e.target.value)} placeholder="Search ratti, origin, SKU…" className="w-full sm:w-[220px] h-8 px-3 rounded-[9px] text-[13px] outline-none" style={{ background: T.popover, border: `1px solid ${T.border}`, color: T.text }} />
                    </div>
                  )}
                  {!stoneCustomMode ? (
                    <div className="max-h-[360px] overflow-y-auto -mx-1 px-1">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                        {stoneMatches.map((s) => {
                          const on = stoneSku === s.sku;
                          return (
                            <button key={s.sku} type="button" onClick={() => setStonePreviewSku(s.sku)} className="group relative text-left rounded-[12px] overflow-hidden transition-all hover:-translate-y-0.5" style={{ background: T.card, border: `1.5px solid ${on ? T.accent : T.borderSoft}` }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <span className="block aspect-square w-full" style={{ background: T.bg }}><img src={s.image} alt={`${s.gemName} · ${s.english}`} className={`w-full h-full ${imgFit(s.image)}`} /></span>
                              {on && <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: T.accent, color: T.accentInk }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><path d="M20 6 9 17l-5-5" /></svg></span>}
                              <span className="block p-2"><span className="block text-[11.5px] font-semibold truncate" style={{ color: T.text }}>{s.gemName} · {s.english}</span><span className="block text-[10.5px] truncate mt-0.5" style={{ color: T.faint }}>{s.ratti}r · {s.origin}</span><span className="block text-[11px] font-semibold tabular-nums mt-0.5" style={{ color: T.muted }}>{inr(s.price)}</span></span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Select value={draftStone.gem} onChange={(v) => { const g = GEM_OPTIONS.find((o) => o.value === v)!; setDraftStone((p) => ({ ...p, gem: v, gemName: g.gemName, english: g.english })); }} label="Gemstone" options={GEM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
                      <div className="grid grid-cols-2 gap-3">
                        <Input value={draftStone.ratti} onChange={(v) => setDraftStone((p) => ({ ...p, ratti: v.replace(/[^0-9.]/g, "") }))} label="Ratti" placeholder="e.g. 5.9" required />
                        <Input value={draftStone.price} onChange={(v) => setDraftStone((p) => ({ ...p, price: v.replace(/[^0-9]/g, "") }))} label="Price (₹)" inputMode="numeric" placeholder="e.g. 250000" required />
                      </div>
                      <Input value={draftStone.origin} onChange={(v) => setDraftStone((p) => ({ ...p, origin: v }))} label="Origin (optional)" placeholder="e.g. Ceylon (Sri Lanka)" />
                      <div className="flex justify-end"><GoldBtn onClick={saveCustomStone} disabled={!draftStone.ratti || !draftStone.price}>Use this stone</GoldBtn></div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Design</h2>
              <p className="text-[12.5px] mt-0.5 mb-4" style={{ color: T.muted }}>Choose a setting and a design, or keep it a loose stone.</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {FORMS.map((f) => (
                  <button key={f} type="button" onClick={() => { setForm(f); setDesignSlug(""); setDesignQuery(""); }} className="h-8 px-3.5 rounded-full text-[12.5px] cursor-pointer" style={form === f ? { background: T.accent, color: T.accentInk, fontWeight: 600 } : { background: "rgba(89,82,54,0.06)", color: T.muted }}>{f}</button>
                ))}
              </div>
              {form === "Loose stone" ? (
                <p className="text-[13px] rounded-[10px] px-3.5 py-3" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, color: T.muted }}>No setting — the stone ships loose.</p>
              ) : (
                <>
                  <input value={designQuery} onChange={(e) => setDesignQuery(e.target.value)} placeholder={`Search ${form.toLowerCase()} designs…`} className="w-full h-8 px-3 mb-3 rounded-[9px] text-[13px] outline-none" style={{ background: T.popover, border: `1px solid ${T.border}`, color: T.text }} />
                  <div className="max-h-[360px] overflow-y-auto -mx-1 px-1">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {designMatches.map((d) => {
                        const on = designSlug === d.slug;
                        return (
                          <button key={d.slug} type="button" onClick={() => setPreviewSlug(d.slug)} className="group relative text-left rounded-[12px] overflow-hidden" style={{ background: T.card, border: `1.5px solid ${on ? T.accent : T.borderSoft}` }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <span className="block aspect-square w-full" style={{ background: T.bg }}><img src={d.image} alt={d.name} className={`w-full h-full ${imgFit(d.image)}`} /></span>
                            {on && <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: T.accent, color: T.accentInk }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><path d="M20 6 9 17l-5-5" /></svg></span>}
                            <span className="block p-2"><span className="block text-[11.5px] font-semibold truncate" style={{ color: T.text }}>{d.name}</span><span className="block text-[11px] font-semibold tabular-nums mt-0.5" style={{ color: T.muted }}>{inr(d.price)}</span></span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Energisation</h2>
              <p className="text-[12.5px] mt-0.5 mb-4" style={{ color: T.muted }}>Choose the ritual tier for this stone.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ENERGISATION.map((e) => {
                  const active = energisationKey === e.key;
                  return (
                    <button key={e.key} type="button" onClick={() => setEnergisationKey(e.key)} className="text-left rounded-[12px] px-4 py-3 cursor-pointer transition-all" style={active ? { background: "linear-gradient(135deg, rgba(160,125,56,0.14), rgba(160,125,56,0.05))", border: "1px solid rgba(160,125,56,0.55)" } : { background: T.popover, border: `1px solid ${T.borderSoft}` }}>
                      <div className="flex items-baseline justify-between gap-2"><span className="text-[13.5px] font-semibold" style={{ color: T.text }}>{e.name}</span><span className="text-[12.5px] font-semibold tabular-nums" style={{ color: e.fee === 0 ? T.good : T.text }}>{e.fee === 0 ? "Included" : inr(e.fee)}</span></div>
                      <div className="text-[11.5px] mt-0.5" style={{ color: T.muted }}>{e.duration}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            <GhostBtn onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}>{step === 0 ? "Cancel" : "← Back"}</GhostBtn>
            {step < STEPS.length - 1 ? (
              <GoldBtn onClick={next} disabled={!stepDone[step]}>Continue →</GoldBtn>
            ) : (
              <GoldBtn onClick={handleComplete} disabled={!stoneDone}>Save selection</GoldBtn>
            )}
          </div>
        </div>
      </div>

      <Modal open={!!previewStone} onClose={() => setStonePreviewSku("")} title={previewStone ? `${previewStone.gemName} · ${previewStone.english}` : "Stone"}>
        {previewStone && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="rounded-[14px] overflow-hidden" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
              <img src={previewStone.image} alt={`${previewStone.gemName} · ${previewStone.english}`} className={`w-full aspect-square ${imgFit(previewStone.image)}`} />
            </div>
            <div className="flex justify-end gap-2.5 mt-5">
              <GhostBtn onClick={() => setStonePreviewSku("")}>Close</GhostBtn>
              {stoneSku === previewStone.sku ? (
                <GhostBtn onClick={() => { setStoneSku(""); setStonePreviewSku(""); }}>Remove</GhostBtn>
              ) : (
                <GoldBtn onClick={() => { pickStone(previewStone.sku); setStonePreviewSku(""); }}>Select this stone</GoldBtn>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!previewDesign} onClose={() => setPreviewSlug("")} title={previewDesign?.name ?? "Design"}>
        {previewDesign && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="rounded-[14px] overflow-hidden" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
              <img src={previewDesign.image} alt={previewDesign.name} className={`w-full aspect-square ${imgFit(previewDesign.image)}`} />
            </div>
            <div className="flex justify-end gap-2.5 mt-5">
              <GhostBtn onClick={() => setPreviewSlug("")}>Close</GhostBtn>
              {designSlug === previewDesign.slug ? (
                <GhostBtn onClick={() => { setDesignSlug(""); setPreviewSlug(""); }}>Remove</GhostBtn>
              ) : (
                <GoldBtn onClick={() => { setDesignSlug(previewDesign.slug); setPreviewSlug(""); }}>Select this design</GoldBtn>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
