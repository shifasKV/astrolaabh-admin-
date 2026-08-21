"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Chip, GoldBtn, GhostBtn, BackLink, Modal, ConfirmDialog } from "@/components/ui";
import { T } from "@/lib/theme";
import { inr, imgFit } from "@/lib/catalog";
import { useLeads, salesMemberName, submitterRole, type ApprovalStatus, type ReviewAction } from "@/lib/store/leads";

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("");

const STATUS_META: Record<ApprovalStatus, { label: string; fg: string; bg: string; border: string; sub: string }> = {
  pending: { label: "Admin approval pending", fg: "#a07d38", bg: "rgba(160,125,56,0.10)", border: "rgba(160,125,56,0.30)", sub: "Submitted by the sales executive — waiting on your review." },
  approved: { label: "Admin approved", fg: "#5f7040", bg: "rgba(95,112,64,0.10)", border: "rgba(95,112,64,0.30)", sub: "Approved — ready to fulfil." },
  completed: { label: "Completed", fg: "#5f7040", bg: "rgba(95,112,64,0.12)", border: "rgba(95,112,64,0.34)", sub: "Order has been fulfilled and closed." },
  rejected: { label: "Rejected", fg: "#a3493f", bg: "rgba(163,73,63,0.10)", border: "rgba(163,73,63,0.28)", sub: "Sent back to the sales executive for follow-up." },
  on_hold: { label: "On hold", fg: "#587082", bg: "rgba(88,112,130,0.10)", border: "rgba(88,112,130,0.28)", sub: "Paused — waiting on more information before a decision." },
};

export default function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { orderLeads, consultLeads, reviewFulfillment } = useLeads();

  const orderLead = orderLeads.find((o) => o.id === id && o.fulfillment);
  const consultLead = consultLeads.find((c) => c.id === id && c.fulfillment);
  const lead = orderLead ?? consultLead;
  const f = lead?.fulfillment;

  const [disc, setDisc] = useState(f ? String(f.discount) : "0");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);

  if (!lead || !f) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Fulfilment not found.</p>
        <div className="mt-3 flex justify-center"><BackLink label="Approvals" href="/leads?tab=approvals" /></div>
      </div>
    );
  }

  const meta = STATUS_META[f.approval];
  const discountEditable = f.approval === "pending" || f.approval === "on_hold";
  const discNum = Number(disc) || 0;
  const newTotal = Math.max(0, f.subtotal - discNum);
  const leadHref = f.kind === "order" ? `/orders/incomplete/${lead.id}` : `/consultations/incomplete/${lead.id}`;

  const doAct = (action: ReviewAction) => { reviewFulfillment(lead.id, action, { discount: discNum, total: newTotal }); };
  const act = (action: ReviewAction) => { if (action === "approve") setConfirmApprove(true); else doAct(action); };

  // Decision buttons per current status — one primary, minimal secondaries.
  const decisions: { primary?: { label: string; action: ReviewAction }; secondary: { label: string; action: ReviewAction }[] } = (() => {
    switch (f.approval) {
      case "pending": return { primary: { label: "Approve fulfilment", action: "approve" }, secondary: [{ label: "Put on hold", action: "hold" }, { label: "Reject", action: "reject" }] };
      case "on_hold": return { primary: { label: "Approve fulfilment", action: "approve" }, secondary: [{ label: "Reject", action: "reject" }] };
      case "approved": return { secondary: [] };
      case "rejected": return { primary: { label: "Approve fulfilment", action: "approve" }, secondary: [{ label: "Put on hold", action: "hold" }] };
      case "completed": return { secondary: [{ label: "Reopen to approved", action: "approve" }] };
    }
  })();

  return (
    <>
      <div className="mb-4"><BackLink label="Approvals" href="/leads?tab=approvals" /></div>

      {/* Status banner — only once a decision has been taken */}
      {f.approval !== "pending" && (
      <div className="rounded-[14px] px-4 py-3.5 mb-5 flex items-center gap-3" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
        <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: T.card, color: meta.fg, border: `1px solid ${meta.border}` }}>
          {f.approval === "rejected" ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-[18px] h-[18px]"><path d="M18 6 6 18M6 6l12 12" /></svg>
            : f.approval === "on_hold" ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[18px] h-[18px]"><path d="M10 5v14M14 5v14" /></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M20 6 9 17l-5-5" /></svg>}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold" style={{ color: T.text }}>{meta.label}</div>
          <div className="text-[12px]" style={{ color: T.muted }}>{meta.sub}</div>
        </div>
        {f.reviewedAt && (
          <div className="shrink-0 text-right">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>{f.approval === "on_hold" ? "Held" : f.approval === "rejected" ? "Rejected" : "Approved"} on</div>
            <div className="text-[12.5px] font-medium tabular-nums mt-0.5" style={{ color: T.text }}>{new Date(f.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {new Date(f.reviewedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase()}</div>
          </div>
        )}
      </div>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* Left — who + what */}
        <Card className="!p-6">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-semibold shrink-0" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>{initials(lead.customerName)}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Customer</div>
              <Link href={leadHref} className="text-[16px] font-semibold hover:underline block truncate" style={{ color: T.text }}>{lead.customerName}</Link>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Chip tone={f.kind === "order" ? "info" : "muted"}>{f.kind === "order" ? "Stone order" : "Consultation"}</Chip>
              {f.isCustom && <Chip tone="gold">Custom</Chip>}
            </div>
          </div>

          {/* Full breakdown */}
          {f.details && (
            <div className="mt-5 space-y-4">
              {/* Stone */}
              {f.details.stone?.name && (
                <div>
                  <div className="text-[11px] tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>Stone</div>
                  <div className="flex items-center gap-3 rounded-[12px] p-3" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
                    {f.details.stone.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <button onClick={() => setLightbox(f.details!.stone!.image!)} className="shrink-0 cursor-zoom-in"><img src={f.details.stone.image} alt="Stone" className={`w-14 h-14 rounded-[10px] ${imgFit(f.details.stone.image)}`} style={{ background: T.card, border: `1px solid ${T.borderSoft}` }} /></button>
                    ) : (
                      <span className="w-14 h-14 rounded-[10px] shrink-0" style={{ background: f.details.stone.shadeHex || T.accentFaint, border: `1px solid ${T.borderSoft}` }} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap"><span className="text-[13.5px] font-semibold" style={{ color: T.text }}>{f.details.stone.name}</span>{f.details.stone.custom && <Chip tone="gold">Custom</Chip>}</div>
                      {f.details.stone.sub && <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{f.details.stone.sub}</div>}
                    </div>
                    {typeof f.details.stone.price === "number" && <span className="text-[13.5px] font-semibold tabular-nums shrink-0" style={{ color: T.text }}>{inr(f.details.stone.price)}</span>}
                  </div>
                </div>
              )}

              {/* Design */}
              {f.details.design?.name && (
                <div>
                  <div className="text-[11px] tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>Design</div>
                  {f.details.design.image ? (
                    <div className="flex items-center gap-3 rounded-[12px] p-3" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <button onClick={() => setLightbox(f.details!.design!.image!)} className="shrink-0 cursor-zoom-in"><img src={f.details.design.image} alt="Design" className={`w-14 h-14 rounded-[10px] ${imgFit(f.details.design.image)}`} style={{ background: T.card, border: `1px solid ${T.borderSoft}` }} /></button>
                      <div className="min-w-0 flex-1"><div className="text-[13.5px] font-semibold" style={{ color: T.text }}>{f.details.design.name}</div>{f.details.design.sub && <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{f.details.design.sub}</div>}</div>
                      {typeof f.details.design.price === "number" && <span className="text-[13.5px] font-semibold tabular-nums shrink-0" style={{ color: T.text }}>{inr(f.details.design.price)}</span>}
                    </div>
                  ) : f.details.design.custom ? (
                    <div className="rounded-[12px] p-4" style={{ background: "rgba(160,125,56,0.07)", border: `1px solid rgba(160,125,56,0.28)` }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2"><svg viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 3l2 5.5L19.5 10 14 12l-2 5.5L10 12 4.5 10 10 8.5 12 3z" /><path d="M19 15l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z" /></svg><span className="text-[13.5px] font-semibold" style={{ color: T.text }}>{f.details.design.name}</span></span>
                        {typeof f.details.design.price === "number" && <span className="text-[13.5px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(f.details.design.price)}</span>}
                      </div>
                      {f.details.design.sub && <div className="text-[12px] mt-1" style={{ color: T.muted }}>{f.details.design.sub}</div>}
                      {f.details.design.refs && f.details.design.refs.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {f.details.design.refs.filter((r) => !/^https?:\/\//.test(r)).map((r, i) => (
                            <button key={i} onClick={() => setLightbox(r)} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11.5px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, color: T.text }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.6" className="w-3 h-3"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                              <span className="truncate max-w-[160px]">{r}</span>
                            </button>
                          ))}
                        </div>
                      ) : <p className="text-[12px] mt-2" style={{ color: T.faint }}>No reference images attached.</p>}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-[12px] px-3.5 py-3" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
                      <div><div className="text-[13.5px] font-semibold" style={{ color: T.text }}>{f.details.design.name}</div>{f.details.design.sub && <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{f.details.design.sub}</div>}</div>
                      {typeof f.details.design.price === "number" && <span className="text-[13.5px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(f.details.design.price)}</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Schedule (consultation) */}
              {f.details.schedule && (f.details.schedule.expert || f.details.schedule.date) && (
                <div>
                  <div className="text-[11px] tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>Schedule</div>
                  <div className="rounded-[12px] px-3.5 py-3 space-y-1.5 text-[13px]" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
                    {f.details.schedule.expert && <div className="flex justify-between gap-3"><span style={{ color: T.faint }}>Astrologer</span><span className="font-medium text-right" style={{ color: T.text }}>{f.details.schedule.expert}</span></div>}
                    {f.details.schedule.date && <div className="flex justify-between gap-3"><span style={{ color: T.faint }}>Date</span><span className="font-medium text-right" style={{ color: T.text }}>{f.details.schedule.date}</span></div>}
                    {f.details.schedule.time && <div className="flex justify-between gap-3"><span style={{ color: T.faint }}>Time</span><span className="font-medium text-right" style={{ color: T.text }}>{f.details.schedule.time}</span></div>}
                    {f.details.schedule.problem && <div className="flex justify-between gap-3"><span className="shrink-0" style={{ color: T.faint }}>Reason</span><span className="text-right" style={{ color: T.muted }}>{f.details.schedule.problem}</span></div>}
                  </div>
                </div>
              )}

              {/* Energisation + delivery */}
              {(f.details.energisation || f.details.deliverTo) && (
                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-6 gap-y-3">
                  {f.details.energisation && <div><div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Energisation</div><div className="text-[13px] font-medium" style={{ color: T.text }}>{f.details.energisation.name} · {f.details.energisation.fee === 0 ? "Included" : inr(f.details.energisation.fee)}</div></div>}
                  {f.details.deliverTo && <div><div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Deliver to</div><div className="text-[13px] font-medium" style={{ color: T.text }}>{f.details.deliverTo}</div></div>}
                </div>
              )}
            </div>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-x-6 gap-y-4 mt-5">
            <div><div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Fulfilled by</div><div className="text-[13px] font-medium" style={{ color: T.text }}>{salesMemberName(f.submittedBy)}</div>{submitterRole(f.submittedBy) && <div className="text-[11px] mt-0.5" style={{ color: T.faint }}>{submitterRole(f.submittedBy)}</div>}</div>
            <div><div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Submitted</div><div className="text-[13px] font-medium" style={{ color: T.text }}>{new Date(f.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div></div>
            <div className="col-span-2"><div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Lead</div><Link href={leadHref} className="text-[13px] font-medium hover:underline underline-offset-2" style={{ color: T.accent }}>Open lead record ↗</Link></div>
          </div>

          {f.note && (
            <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <div className="text-[11px] tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>Sales note</div>
              <div className="flex gap-2.5 text-[13px] rounded-[10px] px-3.5 py-3" style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}`, color: T.muted }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.6" className="w-4 h-4 shrink-0 mt-0.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="leading-relaxed">{f.note}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Right — pricing + decision */}
        <aside className="lg:sticky lg:top-4 space-y-4">
          <Card className="!p-6">
            <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Pricing</div>
            <div className="space-y-3 text-[13px]">
              {f.details?.lineItems && f.details.lineItems.length > 0 && (
                <div className="space-y-2 pb-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  {f.details.lineItems.map((li, i) => (
                    <div key={i} className="flex items-center justify-between"><span style={{ color: T.faint }}>{li.label}</span><span className="tabular-nums" style={{ color: li.amount < 0 ? T.danger : T.muted }}>{li.amount < 0 ? `−${inr(-li.amount)}` : inr(li.amount)}</span></div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between"><span style={{ color: T.muted }}>Subtotal</span><span className="tabular-nums" style={{ color: T.text }}>{inr(f.subtotal)}</span></div>
              <div className="flex items-center justify-between">
                <span style={{ color: T.muted }}>Discount</span>
                {discountEditable ? (
                  <label className="inline-flex items-center h-9 rounded-[9px] pl-2.5 pr-1.5 cursor-text transition-shadow duration-200 focus-within:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]" style={{ background: T.card, border: `1px solid ${T.accent}` }}>
                    <span className="text-[12.5px]" style={{ color: T.accent }}>−&nbsp;₹</span>
                    <input value={disc} onChange={(e) => setDisc(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0" className="w-[92px] h-full px-1.5 bg-transparent text-[13.5px] font-semibold tabular-nums text-right outline-none placeholder:font-normal" style={{ color: T.text }} />
                  </label>
                ) : (
                  <span className="tabular-nums font-medium" style={{ color: f.discount > 0 ? T.danger : T.faint }}>{f.discount > 0 ? `−${inr(f.discount)}` : "—"}</span>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 flex items-baseline justify-between" style={{ borderTop: `1px solid ${T.border}` }}>
              <span className="text-[13px] font-medium" style={{ color: T.muted }}>Total payable</span>
              <span className="font-title text-[24px] font-semibold tabular-nums tracking-[-0.01em]" style={{ color: T.text }}>{inr(discountEditable ? newTotal : f.total)}</span>
            </div>
            {discountEditable && <p className="text-[11.5px] mt-2 leading-relaxed" style={{ color: T.faint }}>Adjust the discount if needed — the sales executive sees your final figure.</p>}
          </Card>

          {(decisions.primary || decisions.secondary.length > 0) && (
          <Card className="!p-4">
            {decisions.primary && <GoldBtn onClick={() => act(decisions.primary!.action)} className="w-full">{decisions.primary.label}</GoldBtn>}
            {decisions.secondary.map((s, i) => (
              <GhostBtn key={s.action} onClick={() => act(s.action)} className={`w-full ${decisions.primary || i > 0 ? "mt-2.5" : ""}`}>{s.label}</GhostBtn>
            ))}
          </Card>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        onConfirm={() => { setConfirmApprove(false); doAct("approve"); }}
        title="Approve this fulfilment?"
        tone="default"
        message={<span>The total payable will be <strong>{inr(newTotal)}</strong>{discNum > 0 ? <> with a <strong>−{inr(discNum)}</strong> discount</> : null}. The submitter will see it as approved.</span>}
        confirmLabel="Approve"
      />

      <Modal open={!!lightbox} onClose={() => setLightbox(null)} title="Reference">
        {lightbox && ((lightbox.startsWith("/") || lightbox.startsWith("http")) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <div className="rounded-[12px] overflow-hidden" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}><img src={lightbox} alt="Reference" className={`w-full max-h-[70vh] ${imgFit(lightbox)}`} /></div>
        ) : (
          <div className="rounded-[12px] p-8 text-center" style={{ background: T.bg, border: `1px dashed ${T.border}` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="1.5" className="w-8 h-8 mx-auto"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
            <div className="text-[13px] font-medium mt-3" style={{ color: T.text }}>{lightbox}</div>
            <p className="text-[12px] mt-1" style={{ color: T.muted }}>Uploaded reference — no live preview available in this demo.</p>
          </div>
        ))}
      </Modal>
    </>
  );
}
