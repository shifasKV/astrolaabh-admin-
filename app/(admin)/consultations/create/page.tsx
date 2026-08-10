"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, GhostBtn, Select, Textarea, StepIndicator } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS, EXPERT_PROFILES, getExpertDates, getExpertSlots } from "@/lib/mock";
import type { ExpertProfile, TimeSlot } from "@/lib/mock";

const TYPES = [
  { value: "initial", label: "Initial consultation" },
  { value: "follow_up", label: "Follow-up" },
  { value: "stone_selection", label: "Stone selection" },
  { value: "remedy_review", label: "Remedy review" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

type Step = 1 | 2 | 3 | 4 | 5;

export default function CreateConsultationPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const [customerId, setCustomerId] = useState("");
  const [type, setType] = useState("initial");
  const [problem, setProblem] = useState("");

  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null);

  const [selectedDate, setSelectedDate] = useState("");
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const [selectedSlot, setSelectedSlot] = useState("");
  const [toast, setToast] = useState("");

  const customerName = MOCK_CUSTOMERS.find((c) => c.id === customerId)?.name ?? "";
  const availableDates = selectedExpert ? getExpertDates(selectedExpert.id) : [];
  const slotsForDate = selectedExpert && selectedDate ? getExpertSlots(selectedExpert.id, selectedDate) : [];

  const handleCreate = () => {
    setToast("Consultation created successfully");
    setTimeout(() => setToast(""), 3000);
    router.push("/consultations");
  };

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
    setStep(4);
  };

  const selectSlot = (slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot.time);
    setStep(5);
  };

  const STEPS = [
    { key: "details", label: "Details" },
    { key: "expert", label: "Expert" },
    { key: "date", label: "Date" },
    { key: "slot", label: "Slot" },
    { key: "review", label: "Review" },
  ];

  return (
    <>
      <PageHeader
        title="Book consultation"
        sub="Schedule a new consultation for a customer"
        back={{ label: "Consultations", href: "/consultations" }}
      />

      <StepIndicator
        steps={STEPS}
        currentIndex={step - 1}
        onNavigate={(i) => { if (i < step - 1) setStep((i + 1) as Step); }}
        canNavigateTo={(i) => i < step - 1}
      />

      {/* Step 1: Customer + Type + Problem */}
      {step === 1 && (
        <Card>
          <div className="max-w-lg space-y-4">
            <Select
              value={customerId}
              onChange={setCustomerId}
              label="Customer"
              searchable
              placeholder="Select customer…"
              options={[
                { value: "", label: "Select customer…" },
                ...MOCK_CUSTOMERS.map((c) => ({ value: c.id, label: `${c.name} (${c.email})` })),
              ]}
            />
            <Select value={type} onChange={setType} label="Consultation type" options={TYPES} />
            <Textarea
              value={problem}
              onChange={setProblem}
              label="Problem statement / reason"
              placeholder="Brief description of what the customer needs…"
            />
            <div className="pt-3">
              <GoldBtn onClick={() => setStep(2)} disabled={!customerId}>Continue</GoldBtn>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Expert Selection */}
      {step === 2 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPERT_PROFILES.map((ep) => (
            <button
              key={ep.id}
              type="button"
              onClick={() => { setSelectedExpert(ep); setSelectedDate(""); setSelectedSlot(""); setStep(3); }}
              className="text-left rounded-[12px] p-5 transition-all hover:scale-[1.02]"
              style={{
                background: T.card,
                border: `1px solid ${selectedExpert?.id === ep.id ? T.accent : T.border}`,
                boxShadow: selectedExpert?.id === ep.id ? "0 0 0 1px rgba(195,160,88,0.3)" : "none",
              }}
            >
              <div className="text-[14px] font-semibold mb-1" style={{ color: T.text }}>{ep.name}</div>
              <div className="text-[12px] mb-2" style={{ color: T.muted }}>{ep.specialization}</div>
              <div className="flex items-center gap-3 text-[11px]" style={{ color: T.faint }}>
                <span>{ep.experience}</span>
                <span>•</span>
                <span>{ep.languages.join(", ")}</span>
              </div>
              <div className="mt-3 text-[13px] font-semibold" style={{ color: T.accent }}>
                ₹{ep.fee.toLocaleString("en-IN")}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Date Selection (Calendar) */}
      {step === 3 && selectedExpert && (
        <Card>
          <div className="text-[12px] mb-4" style={{ color: T.muted }}>
            Select a date for <span style={{ color: T.text }}>{selectedExpert.name}</span>
          </div>
          <div className="max-w-[320px]">
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[rgba(195,160,88,0.1)]" style={{ color: T.muted }}>‹</button>
              <span className="text-[13px] font-medium" style={{ color: T.text }}>{MONTHS[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[rgba(195,160,88,0.1)]" style={{ color: T.muted }}>›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] py-1" style={{ color: T.faint }}>{d}</div>
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
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] transition-colors disabled:cursor-not-allowed"
                    style={{
                      background: selected ? T.accent : available ? "rgba(195,160,88,0.08)" : "transparent",
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
            <div className="flex items-center gap-3 mt-4 text-[10.5px]" style={{ color: T.faint }}>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: "rgba(195,160,88,0.2)" }} /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full opacity-40" style={{ background: T.border }} /> Unavailable
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Slot Selection */}
      {step === 4 && selectedExpert && selectedDate && (
        <Card>
          <div className="text-[12px] mb-1" style={{ color: T.muted }}>
            Available slots for <span style={{ color: T.text }}>{selectedExpert.name}</span>
          </div>
          <div className="text-[11px] mb-5" style={{ color: T.faint }}>
            {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {slotsForDate.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => selectSlot(slot)}
                disabled={!slot.available}
                className="py-3 px-3 rounded-[9px] text-[13px] font-medium transition-all disabled:cursor-not-allowed tabular-nums"
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
            <p className="text-[12.5px] mt-4" style={{ color: T.danger }}>No slots available on this date. Please go back and pick another date.</p>
          )}
        </Card>
      )}

      {/* Step 5: Review */}
      {step === 5 && selectedExpert && (
        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Review booking</div>
          <div className="space-y-3 text-[13px] max-w-md">
            {[
              ["Customer", customerName],
              ["Type", TYPES.find((t) => t.value === type)?.label ?? type],
              ["Expert", selectedExpert.name],
              ["Date", selectedDate ? new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""],
              ["Time", selectedSlot],
              ["Fee", `₹${selectedExpert.fee.toLocaleString("en-IN")}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-1.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <span style={{ color: T.muted }}>{k}</span>
                <span className="text-right font-medium" style={{ color: T.text }}>{v}</span>
              </div>
            ))}
            {problem && (
              <div className="pt-2">
                <div className="text-[10px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Problem</div>
                <p className="text-[12.5px]" style={{ color: T.text }}>{problem}</p>
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
