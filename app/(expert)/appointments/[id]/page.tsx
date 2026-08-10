"use client";
import { use, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, GoldBtn, GhostBtn, Textarea, Input, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CONSULTATIONS, MOCK_CUSTOMERS, MOCK_STONE_RECOMMENDATIONS, MOCK_REMEDY_RECOMMENDATIONS } from "@/lib/mock";
import { STONES } from "@/lib/catalog";

export default function ConsultationWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const consultation = MOCK_CONSULTATIONS.find((c) => c.id === id);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [recForm, setRecForm] = useState({ gemstone: "", rationale: "", purpose: "", weight: "", metal: "", finger: "", timing: "" });

  if (!consultation) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Consultation not found.</p>
        <Link href="/appointments" className="text-[12.5px] mt-2 inline-block" style={{ color: T.accent }}>← Back</Link>
      </div>
    );
  }

  const customer = MOCK_CUSTOMERS.find((c) => c.id === consultation.customerId);
  const stoneRec = MOCK_STONE_RECOMMENDATIONS.find((r) => r.consultationId === consultation.id);
  const remedyRec = MOCK_REMEDY_RECOMMENDATIONS.find((r) => r.consultationId === consultation.id);

  return (
    <>
      <PageHeader
        title={`${consultation.customerName} — ${consultation.type.replace(/_/g, " ")}`}
        sub={`${new Date(consultation.scheduledAt).toLocaleString("en-IN")} · ${consultation.duration}min`}
        back={{ label: "Appointments", onClick: () => window.history.back() }}
        action={
          consultation.meetingLink ? (
            <a href={consultation.meetingLink} target="_blank" rel="noopener">
              <GoldBtn>Join meeting ↗</GoldBtn>
            </a>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <Chip tone={consultation.status === "scheduled" ? "gold" : consultation.status === "closed" ? "good" : "muted"}>
          {consultation.status.replace(/_/g, " ")}
        </Chip>
        {consultation.rescheduleReason && <Chip tone="danger">Reschedule requested</Chip>}
      </div>

      {/* Customer context */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Customer context</div>
          {customer ? (
            <div className="space-y-2 text-[12.5px]">
              {[
                ["Name", customer.name],
                ["Birth", `${customer.birthDate} · ${customer.birthTime}`],
                ["Place", customer.birthPlace],
                ["Rashi / Nakshatra", `${customer.rashi || "—"} / ${customer.nakshatra || "—"}`],
                ["Chart ref", customer.chartRef || "Not generated"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span style={{ color: T.muted }}>{k}</span><span style={{ color: T.text }}>{v}</span></div>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px]" style={{ color: T.muted }}>Customer not found.</p>
          )}
          {customer?.chartRef && (
            <div className="mt-3 p-3 rounded-[8px] text-center" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
              <p className="text-[11px]" style={{ color: T.faint }}>Chart viewer placeholder</p>
              <p className="text-[12px] mt-1" style={{ color: T.muted }}>{customer.chartRef} — Kundali / D1 chart</p>
            </div>
          )}
        </Card>

        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Problem & intake</div>
          <p className="text-[13px] leading-relaxed" style={{ color: T.text }}>
            {consultation.problemStatement || "No problem statement recorded."}
          </p>
          {consultation.notes && (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <div className="text-[10px] uppercase mb-1" style={{ color: T.faint }}>Notes</div>
              <p className="text-[12.5px]" style={{ color: T.muted }}>{consultation.notes}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Working notes */}
      <Card className="mb-4">
        <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Working notes (private)</div>
        <Textarea value={notes} onChange={setNotes} placeholder="Personal notes during consultation — not shared with customer" rows={3} />
      </Card>

      {/* Post-consultation summary */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Post-consultation summary</div>
          {consultation.summary && <Chip tone="good">Submitted</Chip>}
        </div>
        {consultation.summary ? (
          <p className="text-[13px] leading-relaxed" style={{ color: T.text }}>{consultation.summary}</p>
        ) : (
          <>
            <Textarea value={summaryDraft} onChange={setSummaryDraft} placeholder="Key observations, interpretation, conclusion, agreed next steps…" rows={4} />
            <div className="flex items-center gap-2.5 mt-3">
              <GoldBtn disabled={!summaryDraft.trim()}>Submit summary</GoldBtn>
              <GhostBtn disabled={!summaryDraft.trim()}>Save draft</GhostBtn>
            </div>
            <p className="text-[11px] mt-2" style={{ color: T.faint }}>Summary will be visible to the customer after submission.</p>
          </>
        )}
      </Card>

      {/* Stone recommendation */}
      {stoneRec ? (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Stone recommendation</div>
            <Chip tone={stoneRec.status === "converted_to_order" ? "good" : "gold"}>{stoneRec.status.replace(/_/g, " ")}</Chip>
          </div>
          <div className="space-y-1.5 text-[12.5px]">
            <div><span style={{ color: T.muted }}>Gemstone: </span><span style={{ color: T.text }}>{stoneRec.gemstone}</span></div>
            <div><span style={{ color: T.muted }}>Weight: </span><span style={{ color: T.text }}>{stoneRec.weightRange}</span></div>
            <div><span style={{ color: T.muted }}>Setting: </span><span style={{ color: T.text }}>{stoneRec.metalSetting}</span></div>
            <div><span style={{ color: T.muted }}>Rationale: </span><span style={{ color: T.text }}>{stoneRec.rationale}</span></div>
          </div>
        </Card>
      ) : (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Stone recommendation</div>
            <GoldBtn onClick={() => setShowRecommendation(!showRecommendation)}>
              {showRecommendation ? "Cancel" : "+ New recommendation"}
            </GoldBtn>
          </div>
          {showRecommendation && (
            <div className="space-y-3 mt-3">
              <Select value={recForm.gemstone} onChange={(v) => setRecForm((f) => ({ ...f, gemstone: v }))} label="Gemstone" options={[{ value: "", label: "Select…" }, { value: "Yellow Sapphire (Pukhraj)", label: "Yellow Sapphire (Pukhraj)" }, { value: "Ruby (Manik)", label: "Ruby (Manik)" }, { value: "Blue Sapphire (Neelam)", label: "Blue Sapphire (Neelam)" }, { value: "Emerald (Panna)", label: "Emerald (Panna)" }, { value: "Diamond (Heera)", label: "Diamond (Heera)" }]} />
              <Textarea value={recForm.rationale} onChange={(v) => setRecForm((f) => ({ ...f, rationale: v }))} label="Astrological rationale" placeholder="Why this stone for this chart…" rows={3} />
              <Input value={recForm.purpose} onChange={(v) => setRecForm((f) => ({ ...f, purpose: v }))} label="Purpose" placeholder="E.g. Career advancement" />
              <div className="grid sm:grid-cols-2 gap-3">
                <Input value={recForm.weight} onChange={(v) => setRecForm((f) => ({ ...f, weight: v }))} label="Weight range" placeholder="E.g. 5.0–6.0 ratti" />
                <Input value={recForm.metal} onChange={(v) => setRecForm((f) => ({ ...f, metal: v }))} label="Metal / setting" placeholder="E.g. 22K Gold ring" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input value={recForm.finger} onChange={(v) => setRecForm((f) => ({ ...f, finger: v }))} label="Finger guidance" placeholder="E.g. Index finger, right hand" />
                <Input value={recForm.timing} onChange={(v) => setRecForm((f) => ({ ...f, timing: v }))} label="Timing guidance" placeholder="E.g. Thursday, Pushya nakshatra" />
              </div>
              <div className="flex gap-2.5">
                <GoldBtn>Submit recommendation</GoldBtn>
                <GhostBtn>Save as draft</GhostBtn>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Remedy recommendation */}
      {remedyRec && (
        <Card className="mb-4">
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Other remedy</div>
          <div className="space-y-1.5 text-[12.5px]">
            <div><span style={{ color: T.muted }}>Type: </span><span style={{ color: T.text }}>{remedyRec.type}</span></div>
            <div><span style={{ color: T.muted }}>Instructions: </span><span style={{ color: T.text }}>{remedyRec.instructions}</span></div>
            {remedyRec.frequency && <div><span style={{ color: T.muted }}>Frequency: </span><span style={{ color: T.text }}>{remedyRec.frequency}</span></div>}
            {remedyRec.duration && <div><span style={{ color: T.muted }}>Duration: </span><span style={{ color: T.text }}>{remedyRec.duration}</span></div>}
          </div>
        </Card>
      )}

      {/* Reschedule */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Actions</div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <GhostBtn onClick={() => setShowReschedule(!showReschedule)}>Request reschedule</GhostBtn>
          <GhostBtn>Flag issue</GhostBtn>
          <GhostBtn>Handover to Admin</GhostBtn>
        </div>
        {showReschedule && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            <Textarea value={rescheduleReason} onChange={setRescheduleReason} label="Reason for reschedule" placeholder="E.g. Travel conflict, patient emergency…" rows={2} />
            <div className="mt-2">
              <GoldBtn disabled={!rescheduleReason.trim()}>Submit request</GoldBtn>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
