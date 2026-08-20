"use client";
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { MOCK_INCOMPLETE_ORDERS, MOCK_INCOMPLETE_CONSULTATIONS, MOCK_SALES_MEMBERS } from "@/lib/mock";
import type { IncompleteOrder, IncompleteConsultation, IncompleteOrderStatus } from "@/lib/mock";
import { DESIGNS } from "@/lib/catalog";

/*
 * Shared lead store — the single source of truth for incomplete-order and
 * incomplete-consultation leads across the Admin and Sales portals.
 *
 * Seeded from the mock incomplete arrays, then holds a localStorage-backed
 * overlay of mutations (assignee, status, activity, fulfillment/approval) so
 * that an assignment or approval made in one portal is reflected in the other
 * within the same browser. No new user profiles — assignees are always drawn
 * from the existing active sales executives (MOCK_SALES_MEMBERS).
 */

export type LeadStatus = IncompleteOrderStatus; // new | contacted | follow_up | converted | lost
export type ApprovalStatus = "pending" | "approved" | "rejected" | "on_hold" | "completed";
export type ReviewAction = "approve" | "reject" | "hold" | "complete";
export type LeadKind = "order" | "consultation";

/** Rich, itemised breakdown shown on the approval detail page. */
export interface FulfillmentDetails {
  stone?: { name: string; sub?: string; price?: number; shadeHex?: string; image?: string; custom?: boolean };
  design?: { name: string; sub?: string; price?: number; image?: string; custom?: boolean; refs?: string[] };
  energisation?: { name: string; fee: number };
  deliverTo?: string;
  schedule?: { expert?: string; date?: string; time?: string; problem?: string };
  lineItems?: { label: string; amount: number }[];
}

export interface Fulfillment {
  kind: LeadKind;
  submittedBy: string; // sales member id
  submittedAt: string;
  summary: string;
  subtotal: number;
  discount: number; // absolute ₹
  total: number;
  note?: string;
  approval: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  /** Design context for the approval view. */
  image?: string;      // library design image (real URL)
  isCustom?: boolean;  // custom stone and/or custom design
  refs?: string[];     // custom-design reference filenames / drive links
  details?: FulfillmentDetails;
}

const ACTION_TO_STATUS: Record<ReviewAction, ApprovalStatus> = { approve: "approved", reject: "rejected", hold: "on_hold", complete: "completed" };

export interface ActivityEntry { text: string; at: string; type: "call" | "status" | "note" | "system"; }

interface LeadOverlay {
  assignedTo?: string;
  leadStatus?: LeadStatus;
  fulfillment?: Fulfillment;
  activity?: ActivityEntry[];
}
type OverlayMap = Record<string, LeadOverlay>;

export interface OrderLead extends IncompleteOrder { fulfillment?: Fulfillment; activity: ActivityEntry[]; }
export interface ConsultLead extends IncompleteConsultation { fulfillment?: Fulfillment; activity: ActivityEntry[]; }
export type PendingApproval = { kind: LeadKind; id: string; customerName: string; assignedTo?: string; fulfillment: Fulfillment };

const STORAGE_KEY = "astro:leads:v3";
const SUBMISSIONS_KEY = "astro:leads:subs:v3";
const SEEN_KEY = "astro:leads:seen:v3";
const ACTIVE_EXECS = MOCK_SALES_MEMBERS.filter((m) => m.status === "active");

export function salesMemberName(id?: string): string {
  if (!id) return "Unassigned";
  return MOCK_SALES_MEMBERS.find((m) => m.id === id)?.name ?? "Unassigned";
}

/* Deterministic seed: round-robin any unassigned lead across active execs,
   plus a couple of pending fulfillments so the Approvals queue is populated. */
function buildSeed(): OverlayMap {
  const seed: OverlayMap = {};
  let rr = 0;
  for (const l of [...MOCK_INCOMPLETE_ORDERS, ...MOCK_INCOMPLETE_CONSULTATIONS]) {
    if (!l.assignedTo && ACTIVE_EXECS.length) {
      seed[l.id] = { assignedTo: ACTIVE_EXECS[rr % ACTIVE_EXECS.length].id };
      rr++;
    }
  }

  // Demo: two sales execs already fulfilled a lead — awaiting admin approval.
  seed["inc_ord_001"] = {
    ...seed["inc_ord_001"],
    leadStatus: "converted",
    fulfillment: { kind: "order", submittedBy: "sales_01", submittedAt: "2026-08-15T11:20:00+05:30", summary: "Emerald (Panna) — Colombian, 4.2r · 22K ring", subtotal: 245000, discount: 15000, total: 230000, note: "Customer negotiated a festive discount over call.", approval: "pending",
      details: {
        stone: { name: "Panna · Emerald", sub: "4.2 ratti · Colombian · Natural, Untreated", price: 210000, shadeHex: "#1f7a4d", custom: false },
        design: { name: DESIGNS.find((d) => d.name === "Surya Prabha")?.name ?? "Surya Prabha", sub: "22K Gold · Ring · From library", price: 35000, image: DESIGNS.find((d) => d.name === "Surya Prabha")?.image, custom: false },
        energisation: { name: "Shuddhi", fee: 0 },
        deliverTo: "Radhika Oberoi · New Delhi 110001",
        lineItems: [{ label: "Stone", amount: 210000 }, { label: "Making", amount: 35000 }, { label: "Energisation", amount: 0 }],
      } },
  };
  seed["inc_con_002"] = {
    ...seed["inc_con_002"],
    leadStatus: "converted",
    fulfillment: { kind: "consultation", submittedBy: "sales_02", submittedAt: "2026-08-16T09:05:00+05:30", summary: "Kundali analysis · Dr. Meenakshi Joshi", subtotal: 4500, discount: 500, total: 4000, note: "Applied first-time 500 off.", approval: "pending",
      details: {
        schedule: { expert: "Dr. Meenakshi Joshi", date: "18 Aug 2026", time: "6:45 PM", problem: "Career direction and marriage timing." },
        lineItems: [{ label: "Consultation fee", amount: 4500 }, { label: "Discount", amount: -500 }],
      } },
  };
  // Demo: one already approved (history).
  seed["inc_ord_007"] = {
    ...seed["inc_ord_007"],
    leadStatus: "converted",
    fulfillment: { kind: "order", submittedBy: "sales_01", submittedAt: "2026-08-11T15:40:00+05:30", summary: "Yellow Sapphire (Pukhraj) — Ceylon, 5.1r", subtotal: 275000, discount: 0, total: 275000, approval: "approved", reviewedBy: "admin", reviewedAt: "2026-08-12T10:00:00+05:30",
      details: {
        stone: { name: "Pukhraj · Yellow Sapphire", sub: "5.1 ratti · Ceylon (Sri Lanka) · Natural, Unheated", price: 275000, shadeHex: "#e7c14a", custom: false },
        design: { name: "Loose stone", sub: "No setting — ships loose", custom: false },
        energisation: { name: "Shuddhi", fee: 0 },
        deliverTo: "Vikram Singh Randhawa · Chandigarh 160017",
        lineItems: [{ label: "Stone", amount: 275000 }],
      } },
  };
  // Demo: a custom-design order awaiting approval — shows attached references + drive link.
  seed["inc_ord_005"] = {
    ...seed["inc_ord_005"],
    leadStatus: "converted",
    fulfillment: { kind: "order", submittedBy: "sales_02", submittedAt: "2026-08-17T10:00:00+05:30", summary: "Pukhraj Pendant · Custom Platinum", subtotal: 340000, discount: 0, total: 340000, note: "Customer shared a reference design via WhatsApp.", approval: "pending",
      details: {
        stone: { name: "Pukhraj · Yellow Sapphire", sub: "6.0 ratti · Ceylon (Sri Lanka) · Natural, Unheated", price: 305000, shadeHex: "#e7c14a", custom: true },
        design: { name: "Custom pendant", sub: "Platinum · 6 ct", price: 35000, custom: true, refs: ["ref-front.jpg", "ref-side.jpg"] },
        energisation: { name: "Shuddhi", fee: 0 },
        deliverTo: "Amit Khanna · Mumbai 400050",
        lineItems: [{ label: "Stone", amount: 305000 }, { label: "Making", amount: 35000 }, { label: "Energisation", amount: 0 }],
      } },
  };
  return seed;
}

function mergeOverlays(base: OverlayMap, over: OverlayMap): OverlayMap {
  const out: OverlayMap = { ...base };
  for (const id of Object.keys(over)) out[id] = { ...base[id], ...over[id] };
  return out;
}

interface LeadsState {
  orderLeads: OrderLead[];
  consultLeads: ConsultLead[];
  pendingApprovals: PendingApproval[];
  reviewedFulfillments: PendingApproval[];
  assign: (id: string, salesId: string) => void;
  setStatus: (id: string, status: LeadStatus) => void;
  logActivity: (id: string, entry: ActivityEntry) => void;
  submitFulfillment: (id: string, f: Omit<Fulfillment, "approval">) => void;
  reviewFulfillment: (id: string, action: ReviewAction, opts?: { discount?: number; total?: number; note?: string }) => void;
  /** Sales exec builds a brand-new order/consultation from scratch → straight into the approval queue. */
  createSubmission: (s: { kind: LeadKind; customerName: string; submittedBy: string; summary: string; subtotal: number; discount: number; total: number; note?: string; image?: string; isCustom?: boolean; refs?: string[]; details?: FulfillmentDetails }) => void;
  getById: (id: string) => PendingApproval | undefined;
  /** Fulfilments a sales exec submitted that were reviewed since they last looked. */
  salesReviewUpdates: (salesId: string) => PendingApproval[];
  isReviewUnseen: (salesId: string, row: PendingApproval) => boolean;
  markReviewSeen: (id: string, reviewedAt?: string) => void;
}

const LeadsContext = createContext<LeadsState | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<OverlayMap>(buildSeed);
  const hydrated = useState(() => ({ done: false }))[0];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setOverlay((prev) => mergeOverlays(prev, JSON.parse(raw) as OverlayMap));
    } catch { /* ignore malformed storage */ }
    hydrated.done = true;
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated.done) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay)); } catch { /* full/unavailable */ }
  }, [overlay, hydrated]);

  // Standalone, from-scratch fulfilments a sales exec built (not tied to an incomplete lead).
  const [submissions, setSubmissions] = useState<PendingApproval[]>([]);
  useEffect(() => {
    try { const raw = localStorage.getItem(SUBMISSIONS_KEY); if (raw) setSubmissions(JSON.parse(raw) as PendingApproval[]); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!hydrated.done) return;
    try { localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions)); } catch { /* full/unavailable */ }
  }, [submissions, hydrated]);

  // Per-fulfilment "seen" marker (keyed to the reviewedAt so a re-decision re-notifies).
  const [seen, setSeen] = useState<Record<string, string>>({});
  useEffect(() => {
    try { const raw = localStorage.getItem(SEEN_KEY); if (raw) setSeen(JSON.parse(raw) as Record<string, string>); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    if (!hydrated.done) return;
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch { /* full/unavailable */ }
  }, [seen, hydrated]);
  const markReviewSeen = useCallback((id: string, reviewedAt?: string) => {
    setSeen((prev) => (prev[id] === (reviewedAt ?? "seen") ? prev : { ...prev, [id]: reviewedAt ?? "seen" }));
  }, []);

  const patch = useCallback((id: string, p: LeadOverlay) => {
    setOverlay((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));
  }, []);

  const assign = useCallback((id: string, salesId: string) => patch(id, { assignedTo: salesId }), [patch]);
  const setStatus = useCallback((id: string, status: LeadStatus) => patch(id, { leadStatus: status }), [patch]);
  const logActivity = useCallback((id: string, entry: ActivityEntry) => {
    setOverlay((prev) => ({ ...prev, [id]: { ...prev[id], activity: [entry, ...(prev[id]?.activity ?? [])] } }));
  }, []);
  const submitFulfillment = useCallback((id: string, f: Omit<Fulfillment, "approval">) => {
    patch(id, { fulfillment: { ...f, approval: "pending" }, leadStatus: "converted" });
  }, [patch]);
  const decide = (f: Fulfillment, action: ReviewAction, opts?: { discount?: number; total?: number; note?: string }): Fulfillment => ({
    ...f,
    discount: opts?.discount ?? f.discount,
    total: opts?.total ?? f.total,
    approval: ACTION_TO_STATUS[action],
    reviewedBy: "admin",
    reviewedAt: new Date().toISOString(),
    reviewNote: opts?.note,
  });
  // Re-runnable: admin can approve, reject, hold, complete, or change a prior decision at any time.
  const reviewFulfillment = useCallback((id: string, action: ReviewAction, opts?: { discount?: number; total?: number; note?: string }) => {
    if (id.startsWith("sub_")) {
      setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, fulfillment: decide(s.fulfillment, action, opts) } : s)));
      return;
    }
    setOverlay((prev) => {
      const f = prev[id]?.fulfillment;
      if (!f) return prev;
      return { ...prev, [id]: { ...prev[id], fulfillment: decide(f, action, opts), leadStatus: action === "reject" ? "follow_up" : action === "hold" ? "contacted" : "converted" } };
    });
  }, []);

  const createSubmission = useCallback((s: { kind: LeadKind; customerName: string; submittedBy: string; summary: string; subtotal: number; discount: number; total: number; note?: string; image?: string; isCustom?: boolean; refs?: string[]; details?: FulfillmentDetails }) => {
    const id = `sub_${Date.now()}`;
    const fulfillment: Fulfillment = { kind: s.kind, submittedBy: s.submittedBy, submittedAt: new Date().toISOString(), summary: s.summary, subtotal: s.subtotal, discount: s.discount, total: s.total, note: s.note, image: s.image, isCustom: s.isCustom, refs: s.refs, details: s.details, approval: "pending" };
    setSubmissions((prev) => [{ kind: s.kind, id, customerName: s.customerName, assignedTo: s.submittedBy, fulfillment }, ...prev]);
  }, []);

  const orderLeads = useMemo<OrderLead[]>(() => MOCK_INCOMPLETE_ORDERS.map((o) => {
    const ov = overlay[o.id] ?? {};
    return { ...o, assignedTo: ov.assignedTo ?? o.assignedTo, leadStatus: ov.leadStatus ?? o.leadStatus, fulfillment: ov.fulfillment, activity: ov.activity ?? [] };
  }), [overlay]);

  const consultLeads = useMemo<ConsultLead[]>(() => MOCK_INCOMPLETE_CONSULTATIONS.map((c) => {
    const ov = overlay[c.id] ?? {};
    return { ...c, assignedTo: ov.assignedTo ?? c.assignedTo, leadStatus: ov.leadStatus ?? c.leadStatus, fulfillment: ov.fulfillment, activity: ov.activity ?? [] };
  }), [overlay]);

  const allWithFulfillment = useMemo<PendingApproval[]>(() => {
    const rows: PendingApproval[] = [];
    for (const o of orderLeads) if (o.fulfillment) rows.push({ kind: "order", id: o.id, customerName: o.customerName, assignedTo: o.assignedTo, fulfillment: o.fulfillment });
    for (const c of consultLeads) if (c.fulfillment) rows.push({ kind: "consultation", id: c.id, customerName: c.customerName, assignedTo: c.assignedTo, fulfillment: c.fulfillment });
    rows.push(...submissions);
    return rows;
  }, [orderLeads, consultLeads, submissions]);

  const pendingApprovals = useMemo(() => allWithFulfillment.filter((r) => r.fulfillment.approval === "pending"), [allWithFulfillment]);
  const reviewedFulfillments = useMemo(() => allWithFulfillment.filter((r) => r.fulfillment.approval !== "pending"), [allWithFulfillment]);
  const getById = useCallback((id: string) => allWithFulfillment.find((r) => r.id === id), [allWithFulfillment]);
  const isReviewUnseen = useCallback((salesId: string, row: PendingApproval) => row.fulfillment.submittedBy === salesId && row.fulfillment.approval !== "pending" && seen[row.id] !== (row.fulfillment.reviewedAt ?? "seen"), [seen]);
  const salesReviewUpdates = useCallback((salesId: string) => allWithFulfillment.filter((r) => isReviewUnseen(salesId, r)), [allWithFulfillment, isReviewUnseen]);

  const value: LeadsState = { orderLeads, consultLeads, pendingApprovals, reviewedFulfillments, assign, setStatus, logActivity, submitFulfillment, reviewFulfillment, createSubmission, getById, salesReviewUpdates, isReviewUnseen, markReviewSeen };
  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be inside LeadsProvider");
  return ctx;
}
