"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Input, Textarea, Toast } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS, EXPERT_PROFILES, getExpertDates, getExpertSlots } from "@/lib/mock";
import type { ExpertProfile, TimeSlot } from "@/lib/mock";
import type { FulfillmentDetails } from "@/lib/store/leads";

/*
 * Shared consultation-booking stepper — used by Admin (books directly) and Sales
 * (submits for admin approval). Left rail · content · live booking summary.
 */

export interface ConsultationFlowSubmit {
  customerName: string;
  summary: string;
  subtotal: number;
  discount: number;
  total: number;
  details?: FulfillmentDetails;
}

interface ConsultationCreateFlowProps {
  headerTitle?: string;
  submitLabel: string;
  successMessage: string;
  footNote?: string;
  onBack: () => void;
  onSubmit: (payload: ConsultationFlowSubmit) => void;
  onDone: () => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const eyebrow = "text-[11px] font-medium tracking-[0.06em] uppercase";
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const fmtDob = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join("/");
};

type NewCustomer = { name: string; phone: string; email: string; birthDate: string; birthTime: string; birthPlace: string };

function ConsultationInner({ headerTitle = "Book consultation", submitLabel, successMessage, footNote = "Payment link is sent to the customer. Confirmed once paid.", onBack, onSubmit, onDone }: ConsultationCreateFlowProps) {
  const params = useSearchParams();
  const preExpert = EXPERT_PROFILES.find((e) => e.id === params.get("expertId")) ?? null;
  const preDate = params.get("date") ?? "";
  const preCustomerId = params.get("customerId") ?? "";
  const preDateObj = preDate ? new Date(preDate + "T00:00:00") : null;

  const initialReached = preExpert ? 2 : preCustomerId ? 1 : 0;
  const [step, setStep] = useState(initialReached);
  const [reached, setReached] = useState(initialReached);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerId, setCustomerId] = useState(preCustomerId);
  const [newCustomer, setNewCustomer] = useState<NewCustomer | null>(null);
  const [problem, setProblem] = useState("");

  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(preExpert);
  const [selectedDate, setSelectedDate] = useState(preExpert && preDate && getExpertDates(preExpert.id).includes(preDate) ? preDate : "");
  const [viewYear, setViewYear] = useState((preDateObj ?? new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState((preDateObj ?? new Date()).getMonth());
  const [selectedSlot, setSelectedSlot] = useState("");

  const [editFee, setEditFee] = useState("");
  const [discount, setDiscount] = useState("");

  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<"success" | "error" | "info">("success");

  const selectedCustomer = MOCK_CUSTOMERS.find((c) => c.id === customerId);
  const customer = newCustomer ?? selectedCustomer;
  const availableDates = selectedExpert ? getExpertDates(selectedExpert.id) : [];
  const slotsForDate = selectedExpert && selectedDate ? getExpertSlots(selectedExpert.id, selectedDate) : [];

  const customerMatches = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return MOCK_CUSTOMERS.slice(0, 6);
    return MOCK_CUSTOMERS.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))).slice(0, 6);
  }, [customerQuery]);

  const pickCustomer = (id: string) => { setCustomerId(id); setNewCustomer(null); setCustomerQuery(""); setCustomerOpen(false); };
  const startNewCustomer = () => { setNewCustomer({ name: customerQuery.trim(), phone: "", email: "", birthDate: "", birthTime: "", birthPlace: "" }); setCustomerId(""); setCustomerQuery(""); setCustomerOpen(false); };
  const clearCustomer = () => { setCustomerId(""); setNewCustomer(null); };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); };
  const isoFor = (day: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const selectDay = (day: number) => { const iso = isoFor(day); if (!availableDates.includes(iso)) return; setSelectedDate(iso); setSelectedSlot(""); };
  const selectSlot = (slot: TimeSlot) => { if (slot.available) setSelectedSlot(slot.time); };

  const pickExpert = (ep: ExpertProfile) => {
    setSelectedExpert(ep);
    setSelectedSlot("");
    const dates = getExpertDates(ep.id);
    if (dates.length > 0) { setSelectedDate(dates[0]); const d = new Date(dates[0]); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
    else setSelectedDate("");
  };

  const feeNum = Number(editFee) || selectedExpert?.fee || 0;
  const discPct = Math.min(100, Math.max(0, Number(discount) || 0));
  const discountAmount = Math.round((feeNum * discPct) / 100);
  const total = Math.max(0, feeNum - discountAmount);

  const dateLabel = selectedDate ? new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "";

  const customerDone = newCustomer ? !!(newCustomer.name && newCustomer.phone) : !!selectedCustomer;
  const expertDone = !!selectedExpert;
  const scheduleDone = !!selectedDate && !!selectedSlot;
  const stepDone = [customerDone, expertDone, scheduleDone];

  const pending = !customerDone
    ? { step: 0, msg: newCustomer ? "Add the new customer's name & phone" : "Select a customer" }
    : !expertDone
      ? { step: 1, msg: "Choose an expert for this consultation" }
      : !scheduleDone
        ? { step: 2, msg: "Pick an available date and time" }
        : null;
  const canCreate = !pending;

  const STEPS = [
    { key: "customer", label: "Customer", sub: "Who is this for" },
    { key: "expert", label: "Expert", sub: "Who will consult" },
    { key: "schedule", label: "Schedule", sub: "Date & time" },
  ];

  const goTo = (i: number) => { if (i <= reached) setStep(i); };
  const next = () => {
    if (!stepDone[step]) return;
    const n = Math.min(step + 1, STEPS.length - 1);
    setStep(n);
    setReached((r) => Math.max(r, n));
  };

  const handleCreate = () => {
    const details: FulfillmentDetails = {
      schedule: { expert: selectedExpert?.name, date: dateLabel || undefined, time: selectedSlot || undefined, problem: problem || undefined },
      lineItems: [{ label: "Consultation fee", amount: feeNum }, ...(discountAmount > 0 ? [{ label: "Discount", amount: -discountAmount }] : [])],
    };
    onSubmit({
      customerName: customer?.name || "New customer",
      summary: selectedExpert ? `Consultation · ${selectedExpert.name}${dateLabel ? ` · ${dateLabel}` : ""}` : "Consultation",
      subtotal: feeNum,
      discount: discountAmount,
      total,
      details,
    });
    setToastTone("success");
    setToast(successMessage);
    setTimeout(onDone, 900);
  };
  const attemptCreate = () => {
    if (pending) {
      setStep(pending.step);
      setReached((r) => Math.max(r, pending.step));
      setToastTone("info");
      setToast(pending.msg);
      setTimeout(() => setToast(""), 2600);
      return;
    }
    handleCreate();
  };

  const suggestionRow = "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-[9px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.10)]";

  return (
    <>
      <PageHeader title={headerTitle} back={{ label: "Back", onClick: onBack }} />

      <div className="grid grid-cols-1 lg:grid-cols-[210px_1fr_330px] gap-5 items-start pb-6">
        {/* ── Stepper rail ── */}
        <nav className="lg:sticky lg:top-4">
          <ol className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {STEPS.map((s, i) => {
              const active = i === step;
              const done = i < reached || (stepDone[i] && i !== step);
              const clickable = i <= reached;
              return (
                <li key={s.key} className="shrink-0">
                  <button onClick={() => goTo(i)} disabled={!clickable} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-left transition-colors" style={{ background: active ? T.accentFaint : "transparent", cursor: clickable ? "pointer" : "default", opacity: clickable ? 1 : 0.5 }}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0" style={done ? { background: T.good, color: "#fff" } : active ? { background: T.accent, color: T.accentInk } : { background: "rgba(89,82,54,0.09)", color: T.faint }}>
                      {done ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20 6 9 17l-5-5" /></svg> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold whitespace-nowrap" style={{ color: active || done ? T.text : T.muted }}>{s.label}</span>
                      <span className="hidden lg:block text-[11px]" style={{ color: T.faint }}>{s.sub}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ── Step content ── */}
        <div className="min-w-0">
          <Card className="!p-6">
            {/* STEP 1 — CUSTOMER */}
            {step === 0 && (
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Customer</h2>
                <p className="text-[12.5px] mt-0.5 mb-4" style={{ color: T.muted }}>Search an existing customer or add a new one.</p>

                {!customer ? (
                  <div className="relative">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: T.faint }}><circle cx="11" cy="11" r="7" strokeWidth="1.5" /><path d="m16 16 4 4" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    <input value={customerQuery} onChange={(e) => { setCustomerQuery(e.target.value); setCustomerOpen(true); }} onFocusCapture={() => setCustomerOpen(true)} placeholder="Type a name, phone, or email…" className="w-full h-11 pl-9 pr-3 rounded-[10px] text-[14px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]" style={{ background: T.popover, border: `1px solid ${T.border}`, color: T.text }} />
                    {customerOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setCustomerOpen(false)} />
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-[12px] p-1.5 max-h-[320px] overflow-y-auto" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
                          <button onClick={startNewCustomer} className={suggestionRow} style={{ color: T.accent }}>
                            <span className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ border: `1px dashed ${T.accentBorder}` }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14" /></svg></span>
                            <span className="text-[13px] font-medium">Add new customer{customerQuery.trim() ? ` “${customerQuery.trim()}”` : ""}</span>
                          </button>
                          {customerMatches.length > 0 && <div className="my-1 mx-2 h-px" style={{ background: T.borderSoft }} />}
                          {customerMatches.map((c) => (
                            <button key={c.id} onClick={() => pickCustomer(c.id)} className={suggestionRow}>
                              <span className="w-8 h-8 rounded-[9px] flex items-center justify-center text-[12px] font-semibold shrink-0" style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}`, color: T.accent }}>{c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-medium truncate" style={{ color: T.text }}>{c.name}</span><span className="block text-[11.5px] truncate" style={{ color: T.muted }}>{c.phone} · {c.email}</span></span>
                            </button>
                          ))}
                          {customerMatches.length === 0 && customerQuery.trim() && <div className="px-3 py-2 text-[12.5px]" style={{ color: T.faint }}>No customers match “{customerQuery}”.</div>}
                        </div>
                      </>
                    )}
                  </div>
                ) : newCustomer ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className={eyebrow} style={{ color: T.faint }}>New customer</span>
                      <button onClick={clearCustomer} className="inline-flex items-center gap-1.5 text-[12px] font-medium h-8 px-3 rounded-[9px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]" style={{ color: T.muted, border: `1px solid ${T.border}` }}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M10 3.5 5.5 8 10 12.5" /></svg>Back to search</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input value={newCustomer.name} onChange={(v) => setNewCustomer((p) => p && { ...p, name: v })} label="Name" placeholder="e.g. Priya Sharma" required />
                      <Input value={newCustomer.phone} onChange={(v) => setNewCustomer((p) => p && { ...p, phone: v })} label="Phone / WhatsApp" type="tel" placeholder="+91 98765 43210" required />
                      <Input value={newCustomer.email} onChange={(v) => setNewCustomer((p) => p && { ...p, email: v })} label="Email (optional)" type="email" placeholder="priya@example.com" />
                    </div>
                    <div>
                      <div className={`${eyebrow} mb-1.5`} style={{ color: T.faint }}>Birth details (for the chart)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input value={newCustomer.birthDate} onChange={(v) => setNewCustomer((p) => p && { ...p, birthDate: fmtDob(v) })} label="Birth date" placeholder="DD / MM / YYYY" inputMode="numeric" maxLength={10} />
                        <Input value={newCustomer.birthTime} onChange={(v) => setNewCustomer((p) => p && { ...p, birthTime: v })} label="Birth time" placeholder="10:30 AM" />
                        <Input value={newCustomer.birthPlace} onChange={(v) => setNewCustomer((p) => p && { ...p, birthPlace: v })} label="Birth place" placeholder="Kochi, Kerala" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-[12px] px-3.5 py-3" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}` }}>
                    <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[13px] font-semibold shrink-0" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, color: T.accent }}>{selectedCustomer!.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                    <div className="min-w-0 flex-1"><div className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>{selectedCustomer!.name}</div><div className="text-[12px] truncate" style={{ color: T.muted }}>{selectedCustomer!.phone} · {selectedCustomer!.email}</div></div>
                    <button onClick={clearCustomer} className="text-[12px] font-medium shrink-0 cursor-pointer hover:underline underline-offset-4" style={{ color: T.accent }}>Change</button>
                  </div>
                )}

                {customer && (
                  <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <Textarea value={problem} onChange={setProblem} label="Problem statement / reason (optional)" rows={3} placeholder="Brief description of what the customer needs…" />
                  </div>
                )}
              </div>
            )}

            {/* STEP 2 — EXPERT */}
            {step === 1 && (
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Expert</h2>
                <p className="text-[12.5px] mt-0.5 mb-4" style={{ color: T.muted }}>Choose the astrologer for this consultation.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {EXPERT_PROFILES.map((ep) => {
                    const on = selectedExpert?.id === ep.id;
                    const initials = ep.name.replace(/^(Dr|Pt|Acharya)\.?\s*/i, "").split(" ").map((w) => w[0]).slice(0, 2).join("");
                    return (
                      <button key={ep.id} type="button" onClick={() => pickExpert(ep)} className="group relative text-left rounded-[14px] p-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5" style={{ background: on ? T.accentFaint : T.card, border: `1px solid ${on ? T.accent : T.borderSoft}`, boxShadow: on ? `0 0 0 3px rgba(119,123,98,0.16), ${T.shadow}` : T.shadow }}>
                        {on && <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: T.accent, color: T.accentInk }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M20 6 9 17l-5-5" /></svg></span>}
                        <div className="flex items-start gap-3">
                          <span className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0" style={{ background: on ? T.card : T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>{initials}</span>
                          <div className="min-w-0 flex-1 pr-5">
                            <div className="text-[14px] font-semibold truncate" style={{ color: T.text }}>{ep.name}</div>
                            <div className="text-[12px] mt-0.5 truncate" style={{ color: T.muted }}>{ep.specialization}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                          <span className="flex items-center gap-1.5 text-[11px] min-w-0" style={{ color: T.faint }}><span className="shrink-0">{ep.experience}</span><span className="shrink-0">·</span><span className="truncate">{ep.languages.join(", ")}</span></span>
                          <span className="text-[14px] font-semibold tabular-nums shrink-0" style={{ color: T.text }}>{inr(ep.fee)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3 — SCHEDULE */}
            {step === 2 && (
              <div>
                <h2 className="text-[16px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Schedule</h2>
                <p className="text-[12.5px] mt-0.5 mb-4" style={{ color: T.muted }}>Pick an available date and time{selectedExpert ? ` with ${selectedExpert.name}` : ""}.</p>
                {!selectedExpert ? (
                  <p className="text-[13px] rounded-[10px] px-3.5 py-3" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.muted }}>Choose an expert first.</p>
                ) : (
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-[300px] shrink-0">
                      <div className="flex items-center justify-between mb-3">
                        <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(119,123,98,0.12)]" style={{ color: T.muted }}>‹</button>
                        <span className="text-[13.5px] font-medium" style={{ color: T.text }}>{MONTHS[viewMonth]} {viewYear}</span>
                        <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(119,123,98,0.12)]" style={{ color: T.muted }}>›</button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-1.5">{DAYS.map((d) => <div key={d} className="text-center text-[11px] py-1" style={{ color: T.faint }}>{d}</div>)}</div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const iso = isoFor(day);
                          const available = availableDates.includes(iso);
                          const selected = selectedDate === iso;
                          return (
                            <button key={day} type="button" onClick={() => selectDay(day)} disabled={!available} className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] transition-colors disabled:cursor-not-allowed cursor-pointer" style={{ background: selected ? T.accent : available ? "rgba(119,123,98,0.13)" : "transparent", color: selected ? T.accentInk : available ? T.text : T.faint, fontWeight: selected ? 700 : available ? 500 : 400, opacity: available ? 1 : 0.4 }}>{day}</button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-3 mt-4 text-[11px]" style={{ color: T.faint }}>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: "rgba(119,123,98,0.25)" }} /> Available</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full opacity-40" style={{ background: T.border }} /> Unavailable</span>
                      </div>
                    </div>

                    <div className="flex-1 lg:border-l lg:pl-6" style={{ borderColor: T.borderSoft }}>
                      {!selectedDate ? (
                        <p className="text-[13px]" style={{ color: T.faint }}>Select a date to see available times.</p>
                      ) : (
                        <>
                          <div className={`${eyebrow} mb-1`} style={{ color: T.faint }}>Available slots</div>
                          <div className="text-[12px] mb-3" style={{ color: T.muted }}>{new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {slotsForDate.map((slot) => (
                              <button key={slot.time} type="button" onClick={() => selectSlot(slot)} disabled={!slot.available} className="py-2.5 px-3 rounded-[9px] text-[13.5px] font-medium transition-all disabled:cursor-not-allowed cursor-pointer tabular-nums" style={{ background: selectedSlot === slot.time ? T.accent : slot.available ? T.popover : "transparent", border: `1px solid ${selectedSlot === slot.time ? T.accent : slot.available ? T.border : T.borderSoft}`, color: selectedSlot === slot.time ? T.accentInk : slot.available ? T.text : T.faint, opacity: slot.available ? 1 : 0.45 }}>{slot.time}</button>
                            ))}
                          </div>
                          {slotsForDate.filter((s) => s.available).length === 0 && <p className="text-[13px] mt-4" style={{ color: T.danger }}>No slots available on this date. Pick another date.</p>}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step nav */}
            <div className="flex items-center justify-between mt-6 pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <GhostBtn onClick={() => (step === 0 ? onBack() : setStep(step - 1))}>{step === 0 ? "Cancel" : "← Back"}</GhostBtn>
              {step < STEPS.length - 1 ? (
                <GoldBtn onClick={next} disabled={!stepDone[step]}>Continue →</GoldBtn>
              ) : (
                <span className="text-[12px]" style={{ color: T.faint }}>Finish in the booking summary →</span>
              )}
            </div>
          </Card>
        </div>

        {/* ── Live summary ── */}
        <aside className="lg:sticky lg:top-4">
          <Card className="!p-6">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Booking summary</h2>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between gap-3"><span style={{ color: T.faint }}>Customer</span><span className="text-right font-medium min-w-0 truncate" style={{ color: customer ? T.text : T.faint }}>{customer ? customer.name || "New customer" : "—"}</span></div>
              <div className="flex justify-between gap-3"><span style={{ color: T.faint }}>Expert</span><span className="text-right font-medium min-w-0 truncate" style={{ color: selectedExpert ? T.text : T.faint }}>{selectedExpert?.name || "—"}</span></div>
              <div className="flex justify-between gap-3"><span style={{ color: T.faint }}>Date</span><span className="text-right font-medium min-w-0 truncate" style={{ color: dateLabel ? T.text : T.faint }}>{dateLabel || "—"}</span></div>
              <div className="flex justify-between gap-3"><span style={{ color: T.faint }}>Time</span><span className="text-right font-medium" style={{ color: selectedSlot ? T.text : T.faint }}>{selectedSlot || "—"}</span></div>
              {problem && <div className="flex justify-between gap-3"><span className="shrink-0" style={{ color: T.faint }}>Problem</span><span className="text-right min-w-0 truncate" style={{ color: T.muted }}>{problem}</span></div>}
            </div>
            <div className="mt-4 pt-4 space-y-2.5 text-[13px] tabular-nums" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <div className="flex items-center justify-between gap-3">
                <span style={{ color: T.muted }}>Fee</span>
                <label className="group flex items-center h-9 rounded-[9px] pl-2.5 pr-2 cursor-text transition-shadow duration-200 focus-within:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]" style={{ background: T.card, border: `1px solid ${T.accentBorder}`, boxShadow: `inset 0 1px 2px rgba(43,42,34,0.04)` }}>
                  <span className="text-[12.5px]" style={{ color: T.accent }}>₹</span>
                  <input value={editFee} onChange={(e) => setEditFee(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder={selectedExpert ? String(selectedExpert.fee) : "0"} className="w-[80px] h-full px-1.5 bg-transparent text-[13.5px] font-semibold tabular-nums text-right outline-none placeholder:font-normal" style={{ color: T.text }} aria-label="Consultation fee" />
                </label>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5" style={{ color: T.muted }}>Discount<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px]" style={{ color: T.faint }}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg></span>
                <label className="group flex items-center h-9 rounded-[9px] pl-2.5 pr-2 cursor-text transition-shadow duration-200 focus-within:shadow-[0_0_0_3px_rgba(119,123,98,0.16)]" style={{ background: T.card, border: `1px solid ${discount ? T.accent : T.accentBorder}`, boxShadow: `inset 0 1px 2px rgba(43,42,34,0.04)` }}>
                  <input value={discount} onChange={(e) => setDiscount(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0" className="w-[54px] h-full px-1.5 bg-transparent text-[13.5px] font-semibold tabular-nums text-right outline-none placeholder:font-normal" style={{ color: T.text }} aria-label="Discount percent" />
                  <span className="text-[12.5px]" style={{ color: T.accent }}>%</span>
                </label>
              </div>
            </div>
            <div className="mt-4 pt-4 flex items-baseline justify-between" style={{ borderTop: `1px solid ${T.border}` }}>
              <span className="text-[13px] font-medium" style={{ color: T.muted }}>Total</span>
              <span className="font-title text-[22px] font-semibold tabular-nums tracking-[-0.01em]" style={{ color: T.text }}>{inr(total)}</span>
            </div>
            <div className="mt-4">
              <button onClick={attemptCreate} aria-disabled={!canCreate} className={`w-full inline-flex items-center justify-center gap-2 h-11 rounded-[11px] text-[13.5px] font-semibold transition-all duration-200 cursor-pointer ${canCreate ? "hover:-translate-y-px hover:brightness-[1.08] active:scale-[0.98]" : ""}`} style={canCreate ? { background: T.accent, color: T.accentInk, boxShadow: "inset 0 1px 0 rgba(244,241,229,0.14), 0 1px 2px rgba(43,42,34,0.1)" } : { background: "rgba(89,82,54,0.13)", color: T.faint }}>{submitLabel}</button>
              {pending && (
                <button onClick={() => { setStep(pending.step); setReached((r) => Math.max(r, pending.step)); }} className="w-full mt-2 flex items-center justify-center gap-1.5 text-[11.5px] cursor-pointer transition-colors group" style={{ color: T.accent }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                  <span className="group-hover:underline underline-offset-2">{pending.msg}</span>
                </button>
              )}
              <p className="text-[11px] mt-3 text-center" style={{ color: T.faint }}>{footNote}</p>
            </div>
          </Card>
        </aside>
      </div>

      {/* Mobile sticky bar — running total + primary CTA, sits above the tab bar */}
      <div className="lg:hidden fixed inset-x-0 z-30 flex items-center gap-3 px-4 py-2.5" style={{ bottom: "calc(60px + env(safe-area-inset-bottom))", background: "rgba(255,254,250,0.94)", backdropFilter: "blur(8px)", borderTop: `1px solid ${T.border}` }}>
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>Total</div>
          <div className="text-[16px] font-semibold tabular-nums leading-tight" style={{ color: T.text }}>{inr(total)}</div>
        </div>
        <button onClick={attemptCreate} aria-disabled={!canCreate} className="ml-auto inline-flex items-center justify-center h-10 px-5 rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all active:scale-[0.98]" style={canCreate ? { background: T.accent, color: T.accentInk } : { background: "rgba(89,82,54,0.13)", color: T.faint }}>
          {submitLabel}
        </button>
      </div>

      <Toast message={toast} tone={toastTone} />
    </>
  );
}

export function ConsultationCreateFlow(props: ConsultationCreateFlowProps) {
  return <Suspense fallback={null}><ConsultationInner {...props} /></Suspense>;
}
