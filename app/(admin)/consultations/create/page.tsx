"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, SearchFilter, Input, Textarea, StepIndicator } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS, EXPERT_PROFILES, getExpertDates, getExpertSlots } from "@/lib/mock";
import type { ExpertProfile, TimeSlot } from "@/lib/mock";
import * as V from "@/lib/validators";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

type Step = "customer" | "schedule" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "customer", label: "Customer" },
  { key: "schedule", label: "Schedule" },
  { key: "review", label: "Review" },
];

function CreateConsultationPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  // Prefill when arriving from an expert's calendar (?expertId=&date=&customerId=)
  const preExpert = EXPERT_PROFILES.find((e) => e.id === params.get("expertId")) ?? null;
  const preDate = params.get("date") ?? "";
  const preCustomerId = params.get("customerId") ?? "";
  const preDateObj = preDate ? new Date(preDate + "T00:00:00") : null;

  const [step, setStep] = useState<Step>("customer");
  const [search, setSearch] = useState("");
  const [animating, setAnimating] = useState(false);
  const [toast, setToast] = useState("");

  // Customer
  const [customerId, setCustomerId] = useState(preCustomerId);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "", birthDate: "", birthTime: "", birthPlace: "" });
  const [createdCustomer, setCreatedCustomer] = useState<{ id: string; name: string; email: string; phone: string } | null>(null);

  // Details
  const [problem, setProblem] = useState("");

  // Schedule
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(preExpert);
  const [selectedDate, setSelectedDate] = useState(preExpert && preDate && getExpertDates(preExpert.id).includes(preDate) ? preDate : "");
  const [viewYear, setViewYear] = useState((preDateObj ?? new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState((preDateObj ?? new Date()).getMonth());
  const [selectedSlot, setSelectedSlot] = useState("");

  // Review editable fields
  const [editFee, setEditFee] = useState("");
  const [discount, setDiscount] = useState("");

  const selectedCustomer = createdCustomer ?? MOCK_CUSTOMERS.find((c) => c.id === customerId);
  const customerName = selectedCustomer?.name ?? "";
  const availableDates = selectedExpert ? getExpertDates(selectedExpert.id) : [];
  const slotsForDate = selectedExpert && selectedDate ? getExpertSlots(selectedExpert.id, selectedDate) : [];

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const canNavigateTo = (targetIndex: number) => {
    if (targetIndex === 0) return true;
    if (targetIndex === 1) return !!customerId || !!createdCustomer;
    if (targetIndex === 2) return (!!customerId || !!createdCustomer) && !!selectedExpert && !!selectedDate && !!selectedSlot;
    return false;
  };

  const goTo = (target: Step) => {
    setAnimating(true);
    setTimeout(() => { setStep(target); setAnimating(false); }, 180);
  };

  const handleCreate = () => {
    setToast("Consultation created successfully");
    setTimeout(() => setToast(""), 3000);
    router.push("/consultations");
  };

  const selectCustomer = (id: string) => {
    setCustomerId(id);
    setCreatedCustomer(null);
    setSearch("");
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearErr = (k: string) => setErrors((p) => (p[k] ? { ...p, [k]: "" } : p));
  const validateCustomer = () => {
    const e: Record<string, string> = {
      name: V.required(newCustomer.name, "Name"),
      phone: V.phone(newCustomer.phone),
      email: V.email(newCustomer.email),
    };
    setErrors(e);
    return V.isClean(e);
  };

  const handleCreateCustomer = () => {
    if (!validateCustomer()) return;
    const id = `cust_new_${Date.now()}`;
    setCreatedCustomer({ id, ...newCustomer });
    setCustomerId(id);
    setShowNewCustomer(false);
    setSearch("");
    goTo("schedule");
  };

  // Calendar helpers
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const isDateAvailable = (day: number) => {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return availableDates.includes(iso);
  };

  const isDateSelected = (day: number) => {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return selectedDate === iso;
  };

  const selectDay = (day: number) => {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!availableDates.includes(iso)) return;
    setSelectedDate(iso);
    setSelectedSlot("");
  };

  const selectSlot = (slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot.time);
  };

  return (
    <>
      <PageHeader
        title="Book consultation"
        back={{ label: "Consultations", href: "/consultations" }}
      />

      <StepIndicator
        steps={STEPS}
        currentIndex={stepIndex}
        onNavigate={(i) => goTo(STEPS[i].key)}
        canNavigateTo={canNavigateTo}
      />

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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>Customer Details</h3>
              <button
                onClick={() => setShowNewCustomer((v) => !v)}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[8px] text-[12px] font-medium cursor-pointer transition-all hover:brightness-110 active:scale-[0.97]"
                style={{
                  background: showNewCustomer ? "rgba(119,123,98,0.12)" : `${T.accent}`,
                  border: `1px solid ${showNewCustomer ? T.accentBorder : T.accent}`,
                  color: showNewCustomer ? T.accent : T.accentInk,
                }}
              >
                {showNewCustomer ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                    Select from existing
                  </>
                ) : "+ New customer"}
              </button>
            </div>

            {showNewCustomer ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    value={newCustomer.name}
                    onChange={(v) => { setNewCustomer((p) => ({ ...p, name: v })); clearErr("name"); }}
                    onBlur={() => setErrors((p) => ({ ...p, name: V.required(newCustomer.name, "Name") }))}
                    error={errors.name}
                    label="Name"
                    placeholder="e.g. Priya Sharma"
                  />
                  <Input
                    value={newCustomer.phone}
                    onChange={(v) => { setNewCustomer((p) => ({ ...p, phone: v })); clearErr("phone"); }}
                    onBlur={() => setErrors((p) => ({ ...p, phone: V.phone(newCustomer.phone) }))}
                    error={errors.phone}
                    label="Phone / WhatsApp"
                    placeholder="e.g. +91 98765 43210"
                  />
                  <Input
                    value={newCustomer.email}
                    onChange={(v) => { setNewCustomer((p) => ({ ...p, email: v })); clearErr("email"); }}
                    onBlur={() => setErrors((p) => ({ ...p, email: V.email(newCustomer.email) }))}
                    error={errors.email}
                    label="Email"
                    placeholder="e.g. priya@example.com"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    value={newCustomer.birthDate}
                    onChange={(v) => setNewCustomer((p) => ({ ...p, birthDate: v }))}
                    label="Birth date"
                    placeholder="e.g. 15 Mar 1992"
                  />
                  <Input
                    value={newCustomer.birthTime}
                    onChange={(v) => setNewCustomer((p) => ({ ...p, birthTime: v }))}
                    label="Birth time"
                    placeholder="e.g. 10:30 AM"
                  />
                  <Input
                    value={newCustomer.birthPlace}
                    onChange={(v) => setNewCustomer((p) => ({ ...p, birthPlace: v }))}
                    label="Birth place"
                    placeholder="e.g. Kochi, Kerala"
                  />
                </div>

                <div className="pt-4 mt-2" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <h3 className="text-[15px] font-semibold mb-3" style={{ color: T.text }}>Problem Statement</h3>
                  <div className="max-w-lg">
                    <Textarea
                      value={problem}
                      onChange={setProblem}
                      label="Problem statement / reason"
                      placeholder="Brief description of what the customer needs…"
                    />
                  </div>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <GoldBtn onClick={handleCreateCustomer}>Create & continue</GoldBtn>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search name, email…" />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-0.5 pr-1">
                  {MOCK_CUSTOMERS.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c.id)}
                      className={`w-full flex items-center gap-3 py-2.5 px-3 text-left rounded-[10px] transition-colors duration-150 cursor-pointer ${customerId === c.id ? "" : "hover:bg-[rgba(89,82,54,0.05)]"}`}
                      style={{
                        background: customerId === c.id ? "rgba(119,123,98,0.13)" : undefined,
                        border: `1px solid ${customerId === c.id ? T.accentBorder : "transparent"}`,
                      }}
                    >
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
                        style={{ background: `${T.accent}15`, border: `1px solid ${T.accent}30`, color: T.accent }}
                      >
                        {c.name[0]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-medium truncate" style={{ color: T.text }}>{c.name}</div>
                        <div className="text-[12px] truncate" style={{ color: T.muted }}>{c.email}</div>
                      </div>
                      <span className="hidden sm:block text-[12.5px] tabular-nums shrink-0" style={{ color: T.muted }}>{c.phone}</span>
                      <span
                        className="w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center"
                        style={{ border: `1.5px solid ${customerId === c.id ? T.accent : "rgba(89,82,54,0.25)"}` }}
                      >
                        {customerId === c.id && <span className="w-[9px] h-[9px] rounded-full" style={{ background: T.accent }} />}
                      </span>
                    </button>
                  ))}
                </div>
                {customerId && (
                  <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <h3 className="text-[15px] font-semibold mb-3" style={{ color: T.text }}>Problem Statement</h3>
                    <div className="max-w-lg">
                      <Textarea
                        value={problem}
                        onChange={setProblem}
                        label="Problem statement / reason"
                        placeholder="Brief description of what the customer needs…"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            {customerId && !showNewCustomer && (
              <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <GoldBtn onClick={() => goTo("schedule")}>Next →</GoldBtn>
              </div>
            )}
          </Card>
        )}

        {/* STEP: Schedule (Expert + Date + Slot combined) */}
        {step === "schedule" && (
          <div className="space-y-5">
            {/* Expert selection */}
            <Card>
              <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Choose expert</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {EXPERT_PROFILES.map((ep) => (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => {
                      setSelectedExpert(ep);
                      setSelectedSlot("");
                      const dates = getExpertDates(ep.id);
                      if (dates.length > 0) {
                        setSelectedDate(dates[0]);
                        const d = new Date(dates[0]);
                        setViewYear(d.getFullYear());
                        setViewMonth(d.getMonth());
                      } else {
                        setSelectedDate("");
                      }
                    }}
                    className="text-left rounded-[12px] p-4 transition-all hover:scale-[1.02] cursor-pointer"
                    style={{
                      background: T.card,
                      border: `1px solid ${selectedExpert?.id === ep.id ? T.accent : T.border}`,
                      boxShadow: selectedExpert?.id === ep.id ? "0 0 0 1px rgba(119,123,98,0.38)" : "none",
                    }}
                  >
                    <div className="text-[14px] font-semibold mb-1" style={{ color: T.text }}>{ep.name}</div>
                    <div className="text-[12px] mb-2" style={{ color: T.muted }}>{ep.specialization}</div>
                    <div className="flex items-center gap-3 text-[11px]" style={{ color: T.faint }}>
                      <span>{ep.experience}</span>
                      <span>•</span>
                      <span>{ep.languages.join(", ")}</span>
                    </div>
                    <div className="mt-3 text-[13.5px] font-semibold" style={{ color: T.accent }}>
                      ₹{ep.fee.toLocaleString("en-IN")}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Date + Slot selection — visible once an expert is selected */}
            {selectedExpert && (
              <Card>
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Calendar */}
                  <div className="flex-1">
                    <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>
                      Select date for <span style={{ color: T.text }}>{selectedExpert.name}</span>
                    </div>
                    <div className="max-w-[320px]">
                      <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(119,123,98,0.15)]" style={{ color: T.muted }}>‹</button>
                        <span className="text-[13.5px] font-medium" style={{ color: T.text }}>{MONTHS[viewMonth]} {viewYear}</span>
                        <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(119,123,98,0.15)]" style={{ color: T.muted }}>›</button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map((d) => (
                          <div key={d} className="text-center text-[11px] py-1" style={{ color: T.faint }}>{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const available = isDateAvailable(day);
                          const selected = isDateSelected(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => selectDay(day)}
                              disabled={!available}
                              className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] transition-colors disabled:cursor-not-allowed cursor-pointer"
                              style={{
                                background: selected ? T.accent : available ? "rgba(119,123,98,0.13)" : "transparent",
                                color: selected ? T.accentInk : available ? T.text : T.faint,
                                fontWeight: selected ? 700 : available ? 500 : 400,
                                opacity: available ? 1 : 0.4,
                              }}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-3 mt-4 text-[11px]" style={{ color: T.faint }}>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full" style={{ background: "rgba(119,123,98,0.25)" }} /> Available
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full opacity-40" style={{ background: T.border }} /> Unavailable
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Slots — visible once a date is selected */}
                  {selectedDate && (
                    <div className="flex-1 lg:border-l lg:pl-6" style={{ borderColor: T.borderSoft }}>
                      <div className="text-[11px] tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>
                        Available slots
                      </div>
                      <div className="text-[12px] mb-4" style={{ color: T.muted }}>
                        {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {slotsForDate.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => selectSlot(slot)}
                            disabled={!slot.available}
                            className="py-2.5 px-3 rounded-[9px] text-[13.5px] font-medium transition-all disabled:cursor-not-allowed cursor-pointer tabular-nums"
                            style={{
                              background: selectedSlot === slot.time ? T.accent : slot.available ? T.panel : "transparent",
                              border: `1px solid ${selectedSlot === slot.time ? T.accent : slot.available ? T.border : T.borderSoft}`,
                              color: selectedSlot === slot.time ? T.accentInk : slot.available ? T.text : T.faint,
                              opacity: slot.available ? 1 : 0.45,
                            }}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                      {slotsForDate.filter((s) => s.available).length === 0 && (
                        <p className="text-[13px] mt-4" style={{ color: T.danger }}>No slots available on this date. Pick another date.</p>
                      )}
                    </div>
                  )}
                </div>

                {selectedSlot && (
                  <div className="mt-5 pt-3 flex justify-end" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <GoldBtn onClick={() => goTo("review")}>Next →</GoldBtn>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* STEP: Review */}
        {step === "review" && selectedExpert && (
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Review booking</div>
            <div className="space-y-3 text-[13.5px]">
              {[
                ["Customer", customerName],
                ["Expert", selectedExpert.name],
                ["Date", selectedDate ? new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""],
                ["Time", selectedSlot],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span style={{ color: T.muted }}>{k}</span>
                  <span className="text-right font-medium" style={{ color: T.text }}>{v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-1.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ color: T.muted }}>Fee</span>
                <div className="flex items-center gap-1 rounded-md px-2 py-1" style={{ background: "rgba(89,82,54,0.05)", border: `1px solid rgba(89,82,54,0.14)` }}>
                  <span className="text-[12px]" style={{ color: T.faint }}>₹</span>
                  <input
                    type="text"
                    value={editFee || String(selectedExpert.fee)}
                    onChange={(e) => setEditFee(e.target.value)}
                    className="text-right font-semibold tabular-nums bg-transparent border-none outline-none w-[100px] text-[13.5px]"
                    style={{ color: T.text }}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center py-1.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ color: T.muted }}>Discount</span>
                <div className="flex items-center gap-1 rounded-md px-2 py-1" style={{ background: "rgba(89,82,54,0.05)", border: `1px solid rgba(89,82,54,0.14)` }}>
                  <input
                    type="text"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="text-right tabular-nums bg-transparent border-none outline-none w-[100px] text-[13.5px]"
                    style={{ color: T.danger || "#e55" }}
                    placeholder="0"
                  />
                  <span className="text-[12px]" style={{ color: T.faint }}>%</span>
                </div>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium" style={{ color: T.text }}>Total</span>
                <span className="text-[15px] font-semibold tabular-nums" style={{ color: T.text }}>
                  {(() => {
                    const fee = Number(editFee) || selectedExpert.fee;
                    const discPct = Math.min(100, Math.max(0, Number(discount) || 0));
                    return `₹${Math.max(0, Math.round(fee - (fee * discPct / 100))).toLocaleString("en-IN")}`;
                  })()}
                </span>
              </div>
              {problem && (
                <div className="pt-2">
                  <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Problem</div>
                  <p className="text-[13px]" style={{ color: T.text }}>{problem}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2.5 mt-6">
              <GoldBtn onClick={handleCreate}>Book consultation</GoldBtn>
              <GhostBtn onClick={() => router.push("/consultations")}>Cancel</GhostBtn>
            </div>
            <p className="text-[11px] mt-3" style={{ color: T.faint }}>Payment link will be sent to the customer. Consultation is confirmed once paid.</p>
          </Card>
        )}
      </div>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium animate-in"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}

export default function CreateConsultationPage() {
  return (
    <Suspense fallback={null}>
      <CreateConsultationPageInner />
    </Suspense>
  );
}
