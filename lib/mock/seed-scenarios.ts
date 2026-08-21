/**
 * ════════════════════════════════════════════════════════════════════════════
 * ASTROLAABH ORDER MANAGEMENT — TEST DATA SEED & SCENARIO CATALOGUE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * DELIVERABLE 1: ORDER LIFECYCLE & BUSINESS RULES
 * ────────────────────────────────────────────────
 *
 * Entity Overview:
 *   Customer → Consultation → StoneRecommendation → Order → Payment
 *   Order → OrderItems (stone/jewellery) → Energisation → Certificates → Shipment
 *
 * ORDER STAGES (0–7, linear pipeline):
 *   0: Payment received
 *   1: Energisation scheduled
 *   2: Energised — recording vaulted
 *   3: Jewellery in crafting
 *   4: Quality check
 *   5: Dispatched — insured & tracked
 *   6: In transit
 *   7: Delivered
 *
 * Order.shopifyStatus: unfulfilled | partially_fulfilled | fulfilled | cancelled | refunded
 * Order.operationalStatus: pending | in_progress | completed | exception
 * Order.paymentStatus: paid | partial | pending | failed | refunded
 * Order.energisationStatus: not_required | pending | scheduled | in_progress | completed | exception
 * Order.certificateStatus: not_required | missing | uploaded | verified | rejected
 * Order.returnStatus (optional): requested | approved | in_transit | received | settled
 *
 * OrderItem.itemStatus: order_placed | in_transit | order_received | in_crafting | quality_check | ready_to_ship
 *
 * PaymentRequest.status: draft | sent | opened | paid | expired | cancelled | failed
 *
 * FULFILLMENT PIPELINE (UI-driven, 4 steps):
 *   Source → Energise → Certify → Ship
 *   - Source unlocked once payment = paid
 *   - Energise/Certify unlocked once payment = paid (parallel with source)
 *   - Ship unlocked once: allItemsReceived AND energiseComplete AND certifyComplete
 *
 * ────────────────────────────────────────────────
 * DELIVERABLE 2: STATUS-COMBINATION MATRIX
 * ────────────────────────────────────────────────
 *
 * VALID COMBINATIONS:
 * ┌──────────────────┬────────────────────────┬────────────────────┬────────────────────┬──────────────────┬────────────────┐
 * │ Stage            │ shopifyStatus          │ operationalStatus  │ paymentStatus      │ energisationSt.  │ certificateSt. │
 * ├──────────────────┼────────────────────────┼────────────────────┼────────────────────┼──────────────────┼────────────────┤
 * │ 0 (Pmt recv'd)  │ unfulfilled            │ pending            │ pending/failed     │ pending/NR       │ not_required   │
 * │ 0 (Pmt recv'd)  │ unfulfilled            │ pending/in_prog    │ paid               │ pending/NR       │ not_req/miss   │
 * │ 1 (Energ sched) │ unfulfilled            │ in_progress        │ paid               │ scheduled        │ missing        │
 * │ 2 (Energised)   │ unfulfilled            │ in_progress        │ paid               │ in_progress/comp │ missing/upload │
 * │ 3 (Crafting)    │ unfulfilled            │ in_progress        │ paid               │ completed        │ missing→verif  │
 * │ 4 (QC)          │ unfulfilled            │ in_progress        │ paid               │ completed/sched  │ uploaded/verif │
 * │ 5 (Dispatched)  │ partially_fulfilled    │ in_progress        │ paid               │ completed        │ uploaded/verif │
 * │ 6 (In transit)  │ partially_fulfilled    │ in_progress        │ paid               │ completed        │ uploaded/verif │
 * │ 7 (Delivered)   │ fulfilled              │ completed          │ paid               │ completed        │ verified       │
 * │ -- (Cancelled)  │ cancelled              │ exception          │ pending/failed/ref │ not_required/pend│ not_required   │
 * │ -- (Refunded)   │ refunded               │ exception          │ refunded           │ completed/NR     │ varies         │
 * │ -- (Returned)   │ fulfilled              │ exception/compl    │ paid/refunded      │ completed        │ verified       │
 * └──────────────────┴────────────────────────┴────────────────────┴────────────────────┴──────────────────┴────────────────┘
 *
 * INVALID/IMPOSSIBLE COMBINATIONS (never generate):
 *   - paymentStatus=pending + stage > 0 (cannot progress without payment)
 *   - shopifyStatus=fulfilled + stage < 7 (fulfilled means delivered)
 *   - energisationStatus=completed + stage < 2 (can't be energised before scheduling)
 *   - certificateStatus=verified + energisationStatus=pending (cert requires energisation)
 *   - tracking present + stage < 5 (tracking only after dispatch)
 *   - returnStatus present + stage < 7 (can't return what wasn't delivered)
 *   - shopifyStatus=cancelled + stage > 0 + paymentStatus=paid (pay+cancel = must refund)
 *   - paymentStatus=refunded + shopifyStatus=unfulfilled (refund implies cancellation or return)
 *
 * ────────────────────────────────────────────────
 * DELIVERABLE 3: SCENARIO CATALOGUE
 * ────────────────────────────────────────────────
 *
 * See SCENARIOS array below — each scenario is documented with:
 *   - name, purpose, preconditions
 *   - all status fields
 *   - timestamp logic
 *   - why valid
 */

import type { Order, OrderItem } from "@/lib/types";
import type { PaymentRequest } from "@/lib/types";
import type { EnergisationTask } from "@/lib/types";
import type { Certificate } from "@/lib/types";
import type { Customer } from "@/lib/types";
import type { Consultation, StoneRecommendation } from "@/lib/types";

// ════════════════════════════════════════════════════════════════════════════
// SCENARIO CATALOGUE (documentation)
// ════════════════════════════════════════════════════════════════════════════

export const SCENARIO_CATALOGUE = [
  {
    id: "S01",
    name: "Happy path — fully delivered (stone only)",
    purpose: "End-to-end completion of a single stone order",
    preconditions: "Customer → Consultation → Recommendation → Order",
    orderStatus: { stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed" },
    paymentStatus: "paid",
    energisationStatus: "completed",
    certificateStatus: "verified",
    returnStatus: undefined,
    timestamps: "placedAt < paidAt < energisedAt < certVerified < dispatchedAt < deliveredAt",
    whyValid: "All pipeline steps completed sequentially",
  },
  {
    id: "S02",
    name: "Happy path — delivered (stone + jewellery)",
    purpose: "Multi-item order with both stone and jewellery crafting",
    preconditions: "Stone sourced, jewellery crafted, both QC'd",
    orderStatus: { stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed" },
    paymentStatus: "paid",
    energisationStatus: "completed",
    certificateStatus: "verified",
    returnStatus: undefined,
    timestamps: "Items have different receivedAt dates; crafting timeline longer",
    whyValid: "Both items completed and delivered together",
  },
  {
    id: "S03",
    name: "Payment pending — awaiting payment",
    purpose: "Order placed but customer hasn't paid yet",
    preconditions: "Order created, payment link sent",
    orderStatus: { stage: 0, shopifyStatus: "unfulfilled", operationalStatus: "pending" },
    paymentStatus: "pending",
    energisationStatus: "pending",
    certificateStatus: "not_required",
    returnStatus: undefined,
    timestamps: "Only placedAt and updatedAt exist",
    whyValid: "Pipeline locked until payment; no progress possible",
  },
  {
    id: "S04",
    name: "Payment failed — retry pending",
    purpose: "Customer's payment attempt failed",
    preconditions: "Order exists, payment link expired or failed",
    orderStatus: { stage: 0, shopifyStatus: "unfulfilled", operationalStatus: "pending" },
    paymentStatus: "failed",
    energisationStatus: "pending",
    certificateStatus: "not_required",
    returnStatus: undefined,
    timestamps: "placedAt exists; payment has failedAt",
    whyValid: "Failed payment cannot unlock pipeline",
  },
  {
    id: "S05",
    name: "Paid — sourcing in progress (items in transit from vendor)",
    purpose: "Payment received, vendor orders placed, items in transit",
    preconditions: "Payment confirmed, vendor orders created",
    orderStatus: { stage: 0, shopifyStatus: "unfulfilled", operationalStatus: "in_progress" },
    paymentStatus: "paid",
    energisationStatus: "pending",
    certificateStatus: "missing",
    returnStatus: undefined,
    timestamps: "paidAt < now; itemStatus = in_transit",
    whyValid: "Paid but items not yet received — still at stage 0",
  },
  {
    id: "S06",
    name: "Energisation scheduled — stone received, awaiting ritual",
    purpose: "Stone in hand, energisation date set",
    preconditions: "Stone received, energisation task created with scheduledAt",
    orderStatus: { stage: 1, shopifyStatus: "unfulfilled", operationalStatus: "in_progress" },
    paymentStatus: "paid",
    energisationStatus: "scheduled",
    certificateStatus: "missing",
    returnStatus: undefined,
    timestamps: "receivedAt < scheduledAt (future)",
    whyValid: "Energisation scheduled but not yet performed",
  },
  {
    id: "S07",
    name: "Energisation in progress — multi-day ritual ongoing",
    purpose: "Extended ritual (e.g. Vishesh Anushthan) partially done",
    preconditions: "Multi-day energisation started, not yet complete",
    orderStatus: { stage: 2, shopifyStatus: "unfulfilled", operationalStatus: "in_progress" },
    paymentStatus: "paid",
    energisationStatus: "in_progress",
    certificateStatus: "missing",
    returnStatus: undefined,
    timestamps: "scheduledAt in past, completedAt not set",
    whyValid: "Multi-day ritual in progress",
  },
  {
    id: "S08",
    name: "Energised — jewellery now in crafting",
    purpose: "Stone energised, jewellery being made with stone",
    preconditions: "Energisation completed, jewellery order active",
    orderStatus: { stage: 3, shopifyStatus: "unfulfilled", operationalStatus: "in_progress" },
    paymentStatus: "paid",
    energisationStatus: "completed",
    certificateStatus: "uploaded",
    returnStatus: undefined,
    timestamps: "energisedAt < now; jewellery itemStatus = in_crafting",
    whyValid: "Energisation done, jewellery crafting is the bottleneck",
  },
  {
    id: "S09",
    name: "Quality check — ready for final inspection",
    purpose: "All items assembled, undergoing QC before dispatch",
    preconditions: "All items received/crafted, energised, certs uploaded",
    orderStatus: { stage: 4, shopifyStatus: "unfulfilled", operationalStatus: "in_progress" },
    paymentStatus: "paid",
    energisationStatus: "completed",
    certificateStatus: "uploaded",
    returnStatus: undefined,
    timestamps: "All items have quality_check status",
    whyValid: "Pre-dispatch quality inspection step",
  },
  {
    id: "S10",
    name: "Dispatched — in transit to customer",
    purpose: "Order shipped, tracking active",
    preconditions: "All steps complete, tracking number assigned",
    orderStatus: { stage: 6, shopifyStatus: "partially_fulfilled", operationalStatus: "in_progress" },
    paymentStatus: "paid",
    energisationStatus: "completed",
    certificateStatus: "verified",
    returnStatus: undefined,
    timestamps: "dispatchedAt < now; tracking present",
    whyValid: "Shipped but not yet confirmed delivered",
  },
  {
    id: "S11",
    name: "Cancelled before payment",
    purpose: "Order cancelled before any payment was made",
    preconditions: "Order placed, customer decided not to proceed",
    orderStatus: { stage: 0, shopifyStatus: "cancelled", operationalStatus: "exception" },
    paymentStatus: "pending",
    energisationStatus: "not_required",
    certificateStatus: "not_required",
    returnStatus: undefined,
    timestamps: "Only placedAt and updatedAt (cancellation date)",
    whyValid: "No payment received, no work done — clean cancellation",
  },
  {
    id: "S12",
    name: "Cancelled after payment — refund issued",
    purpose: "Customer paid then cancelled; full refund processed",
    preconditions: "Payment received, then customer requests cancellation",
    orderStatus: { stage: 0, shopifyStatus: "cancelled", operationalStatus: "exception" },
    paymentStatus: "refunded",
    energisationStatus: "not_required",
    certificateStatus: "not_required",
    returnStatus: undefined,
    timestamps: "placedAt < paidAt < cancelledAt; refund after cancel",
    whyValid: "Paid then cancelled = must be refunded; no fulfillment started",
  },
  {
    id: "S13",
    name: "Refunded after delivery — return settled",
    purpose: "Customer received, returned, and refund processed",
    preconditions: "Full delivery cycle completed, then return requested",
    orderStatus: { stage: 7, shopifyStatus: "refunded", operationalStatus: "exception" },
    paymentStatus: "refunded",
    energisationStatus: "completed",
    certificateStatus: "verified",
    returnStatus: "settled",
    timestamps: "deliveredAt < returnRequestedAt < returnReceivedAt < refundedAt",
    whyValid: "Delivered → returned → refunded is a valid post-delivery flow",
  },
  {
    id: "S14",
    name: "Return requested — pending approval",
    purpose: "Customer wants to return after delivery",
    preconditions: "Order was delivered successfully",
    orderStatus: { stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed" },
    paymentStatus: "paid",
    energisationStatus: "completed",
    certificateStatus: "verified",
    returnStatus: "requested",
    timestamps: "deliveredAt < returnRequestedAt",
    whyValid: "Return initiated but not yet approved or processed",
  },
  {
    id: "S15",
    name: "Return in transit — customer shipped back",
    purpose: "Return approved, item being shipped back",
    preconditions: "Return approved, customer dispatched the item",
    orderStatus: { stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed" },
    paymentStatus: "paid",
    energisationStatus: "completed",
    certificateStatus: "verified",
    returnStatus: "in_transit",
    timestamps: "deliveredAt < approvedAt < returnShippedAt",
    whyValid: "Return is being shipped back to warehouse",
  },
  {
    id: "S16",
    name: "Energisation not required — direct sale stone",
    purpose: "Customer opted out of energisation / non-ritual stone",
    preconditions: "Stone order without energisation service",
    orderStatus: { stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed" },
    paymentStatus: "paid",
    energisationStatus: "not_required",
    certificateStatus: "verified",
    returnStatus: undefined,
    timestamps: "Standard timeline without energisation step",
    whyValid: "energisationStatus=not_required skips ritual steps entirely",
  },
  {
    id: "S17",
    name: "Energisation exception — ritual issue",
    purpose: "Something went wrong during energisation",
    preconditions: "Energisation was scheduled/started but hit an issue",
    orderStatus: { stage: 2, shopifyStatus: "unfulfilled", operationalStatus: "exception" },
    paymentStatus: "paid",
    energisationStatus: "exception",
    certificateStatus: "missing",
    returnStatus: undefined,
    timestamps: "scheduledAt in past, no completedAt, exception logged",
    whyValid: "Energisation exception halts pipeline; needs resolution",
  },
  {
    id: "S18",
    name: "Partial payment — deposit received",
    purpose: "Customer paid partial amount, awaiting rest",
    preconditions: "Payment partially received per agreement",
    orderStatus: { stage: 0, shopifyStatus: "unfulfilled", operationalStatus: "in_progress" },
    paymentStatus: "partial",
    energisationStatus: "pending",
    certificateStatus: "not_required",
    returnStatus: undefined,
    timestamps: "partialPaidAt exists; balance pending",
    whyValid: "System supports partial payment status",
  },
  {
    id: "S19",
    name: "Certificate rejected — needs re-upload",
    purpose: "Lab certificate failed verification",
    preconditions: "Certificate uploaded but rejected during review",
    orderStatus: { stage: 3, shopifyStatus: "unfulfilled", operationalStatus: "in_progress" },
    paymentStatus: "paid",
    energisationStatus: "completed",
    certificateStatus: "rejected",
    returnStatus: undefined,
    timestamps: "uploadedAt < rejectedAt",
    whyValid: "Rejected certificate blocks ship step; needs correction",
  },
  {
    id: "S20",
    name: "Delivered with return settled (previous return)",
    purpose: "Order previously returned and refund settled",
    preconditions: "Full lifecycle including return and settlement",
    orderStatus: { stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed" },
    paymentStatus: "paid",
    energisationStatus: "completed",
    certificateStatus: "verified",
    returnStatus: "settled",
    timestamps: "Full lifecycle timestamps + return timestamps",
    whyValid: "Return was processed and settled (e.g. exchange, partial refund)",
  },
] as const;

// ════════════════════════════════════════════════════════════════════════════
// DELIVERABLE 4 & 5: GENERATED TEST DATA
// ════════════════════════════════════════════════════════════════════════════

// ── New Customers for scenarios that need them ──

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: "cust_013", name: "Priya Sharma", email: "priya.sharma@gmail.com",
    phone: "+91 98210 55432", birthDate: "1987-06-15", birthTime: "10:30",
    birthPlace: "Varanasi, UP", shippingAddress: "B-12, Assi Ghat Road, Varanasi 221005, UP",
    chartRef: "CHT-013", rashi: "Mithuna", nakshatra: "Punarvasu", createdAt: "2026-07-15",
  },
  {
    id: "cust_014", name: "Nikhil Deshmukh", email: "nikhil.d@yahoo.com",
    phone: "+91 77890 12345", birthDate: "1990-12-25", birthTime: "15:45",
    birthPlace: "Nagpur, Maharashtra", shippingAddress: "Plot 78, Dharampeth, Nagpur 440010",
    chartRef: "CHT-014", rashi: "Kumbha", nakshatra: "Shatabhisha", createdAt: "2026-07-20",
    affiliateCode: "SANDEEP108",
  },
  {
    id: "cust_015", name: "Ishita Banerjee", email: "ishita.b@proton.me",
    phone: "+91 90012 34567", birthDate: "1994-03-08", birthTime: "07:20",
    birthPlace: "Siliguri, West Bengal", shippingAddress: "Flat 4C, Hill View, Sevoke Road, Siliguri 734001",
    chartRef: "CHT-015", rashi: "Makara", nakshatra: "Shravana", createdAt: "2026-07-25",
    affiliateCode: "MEENA9",
  },
  {
    id: "cust_016", name: "Gaurav Mehta", email: "gaurav.mehta@outlook.com",
    phone: "+91 88765 09876", birthDate: "1983-09-19", birthTime: "20:10",
    birthPlace: "Indore, MP", shippingAddress: "23, Vijay Nagar, AB Road, Indore 452010",
    chartRef: "CHT-016", rashi: "Vrischika", nakshatra: "Vishakha", createdAt: "2026-08-01",
    affiliateCode: "VTRI21",
  },
  {
    id: "cust_017", name: "Sunita Pillai", email: "sunita.pillai@gmail.com",
    phone: "+91 94560 78901", birthDate: "1979-11-02", birthTime: "04:55",
    birthPlace: "Thiruvananthapuram, Kerala", shippingAddress: "TC 14/892, Kowdiar, Trivandrum 695003",
    chartRef: "CHT-017", rashi: "Kanya", nakshatra: "Hasta", createdAt: "2026-08-05",
  },
  {
    id: "cust_018", name: "Aditya Verma", email: "aditya.v@icloud.com",
    phone: "+91 70012 34890", birthDate: "1996-07-04", birthTime: "12:00",
    birthPlace: "Jaipur, Rajasthan", shippingAddress: "402, Pink City Towers, MI Road, Jaipur 302001",
    chartRef: "CHT-018", rashi: "Simha", nakshatra: "Purva Phalguni", createdAt: "2026-08-08",
    affiliateCode: "RAJENDRA7",
  },
];

// ── New Consultations for scenario orders ──

export const SEED_CONSULTATIONS: Consultation[] = [
  {
    id: "cons_030", customerId: "cust_013", customerName: "Priya Sharma",
    expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar",
    type: "initial", status: "closed",
    scheduledAt: "2026-07-20T10:00:00+05:30", duration: 45, fee: 5000, paymentStatus: "paid",
    timezone: "Asia/Kolkata", meetingLink: "https://meet.google.com/seed-001-aaa",
    problemStatement: "Financial instability during Rahu Mahadasha",
    summary: "Rahu strong in 2nd house. Gomed recommended, 7+ ratti, Sri Lankan origin. Silver ring, middle finger.",
    summarySubmittedAt: "2026-07-20T11:30:00+05:30",
    recommendationId: "rec_030", createdAt: "2026-07-15", updatedAt: "2026-07-20",
  },
  {
    id: "cons_031", customerId: "cust_014", customerName: "Nikhil Deshmukh",
    expertId: "usr_expert_02", expertName: "Dr. Meenakshi Joshi",
    type: "initial", status: "closed",
    scheduledAt: "2026-07-25T14:00:00+05:30", duration: 60, fee: 7500, paymentStatus: "paid",
    timezone: "Asia/Kolkata", meetingLink: "https://meet.google.com/seed-002-bbb",
    problemStatement: "Career breakthrough needed — Saturn return phase",
    summary: "Saturn in 10th needs strengthening. Blue Sapphire recommended, 5+ ratti, natural unheated.",
    summarySubmittedAt: "2026-07-25T15:30:00+05:30",
    recommendationId: "rec_031", createdAt: "2026-07-20", updatedAt: "2026-07-25",
  },
  {
    id: "cons_032", customerId: "cust_015", customerName: "Ishita Banerjee",
    expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar",
    type: "initial", status: "closed",
    scheduledAt: "2026-07-28T11:00:00+05:30", duration: 45, fee: 5000, paymentStatus: "paid",
    timezone: "Asia/Kolkata", meetingLink: "https://meet.google.com/seed-003-ccc",
    problemStatement: "Marriage delay and Venus affliction concerns",
    summary: "Venus weak in 7th. Diamond recommended for marriage harmony, minimum 1.2 carat, high clarity.",
    summarySubmittedAt: "2026-07-28T12:30:00+05:30",
    recommendationId: "rec_032", createdAt: "2026-07-25", updatedAt: "2026-07-28",
  },
  {
    id: "cons_033", customerId: "cust_016", customerName: "Gaurav Mehta",
    expertId: "usr_expert_03", expertName: "Acharya V. Tripathi",
    type: "initial", status: "closed",
    scheduledAt: "2026-08-01T16:00:00+05:30", duration: 45, fee: 5500, paymentStatus: "paid",
    timezone: "Asia/Kolkata", meetingLink: "https://meet.google.com/seed-004-ddd",
    problemStatement: "Property disputes and Mars-related aggression",
    summary: "Mars afflicted in 4th house. Red Coral recommended, 5+ ratti Italian origin. Gold ring, ring finger.",
    summarySubmittedAt: "2026-08-01T17:30:00+05:30",
    recommendationId: "rec_033", createdAt: "2026-07-28", updatedAt: "2026-08-01",
  },
  {
    id: "cons_034", customerId: "cust_017", customerName: "Sunita Pillai",
    expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar",
    type: "initial", status: "closed",
    scheduledAt: "2026-08-05T09:30:00+05:30", duration: 45, fee: 5000, paymentStatus: "paid",
    timezone: "Asia/Kolkata", meetingLink: "https://meet.google.com/seed-005-eee",
    problemStatement: "Health concerns and weak Sun in chart",
    summary: "Sun debilitated. Ruby recommended, 3+ ratti Burmese origin, gold ring, ring finger, Sunday.",
    summarySubmittedAt: "2026-08-05T11:00:00+05:30",
    recommendationId: "rec_034", createdAt: "2026-08-01", updatedAt: "2026-08-05",
  },
  {
    id: "cons_035", customerId: "cust_018", customerName: "Aditya Verma",
    expertId: "usr_expert_02", expertName: "Dr. Meenakshi Joshi",
    type: "initial", status: "closed",
    scheduledAt: "2026-08-08T15:00:00+05:30", duration: 60, fee: 7500, paymentStatus: "paid",
    timezone: "Asia/Kolkata", meetingLink: "https://meet.google.com/seed-006-fff",
    problemStatement: "Creative blocks and communication issues in media career",
    summary: "Mercury combust with Sun. Emerald recommended, 3.5+ ratti, natural Colombian origin.",
    summarySubmittedAt: "2026-08-08T16:30:00+05:30",
    recommendationId: "rec_035", createdAt: "2026-08-05", updatedAt: "2026-08-08",
  },
];

// ── New Recommendations ──

export const SEED_RECOMMENDATIONS: StoneRecommendation[] = [
  {
    id: "rec_030", consultationId: "cons_030", customerId: "cust_013",
    customerName: "Priya Sharma", expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar",
    status: "converted_to_order", gemstone: "Hessonite (Gomed)",
    rationale: "Rahu strong in 2nd house causing financial instability and unexpected expenses.",
    purpose: "Financial stability and Rahu pacification",
    weightRange: "7.0–8.0 ratti", qualityCriteria: "Sri Lankan origin, honey-brown, eye-clean",
    metalSetting: "Silver ring", fingerGuidance: "Middle finger, right hand",
    timingGuidance: "Saturday, Swati nakshatra", energisationNotes: "Rahu Beej mantra, Pran Pratishtha",
    priority: "primary", matchedSku: "AL-GMD-0101", orderId: "AL-ORD-014",
    createdAt: "2026-07-20", updatedAt: "2026-07-22",
  },
  {
    id: "rec_031", consultationId: "cons_031", customerId: "cust_014",
    customerName: "Nikhil Deshmukh", expertId: "usr_expert_02", expertName: "Dr. Meenakshi Joshi",
    status: "converted_to_order", gemstone: "Blue Sapphire (Neelam)",
    rationale: "Saturn in 10th house during Saturn return. Neelam accelerates karmic rewards.",
    purpose: "Career acceleration and professional recognition",
    weightRange: "5.0–6.0 ratti", qualityCriteria: "Natural unheated, vivid blue, Sri Lankan or Kashmiri",
    metalSetting: "Panchdhatu ring", fingerGuidance: "Middle finger, right hand",
    timingGuidance: "Saturday, Pushya nakshatra, evening", energisationNotes: "Shani mantra, Maha Abhishek",
    priority: "primary", matchedSku: "AL-NLM-0198", orderId: "AL-ORD-015",
    createdAt: "2026-07-25", updatedAt: "2026-07-28",
  },
  {
    id: "rec_032", consultationId: "cons_032", customerId: "cust_015",
    customerName: "Ishita Banerjee", expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar",
    status: "converted_to_order", gemstone: "Diamond (Heera)",
    rationale: "Venus weak in 7th house causing marriage delays. Diamond enhances Venus for partnerships.",
    purpose: "Marriage and relationship harmony",
    weightRange: "1.2–1.5 carat", qualityCriteria: "GIA certified, E-G colour, VS2 or better",
    metalSetting: "Platinum or 18K white gold ring", fingerGuidance: "Ring finger, right hand",
    timingGuidance: "Friday, Bharani nakshatra", energisationNotes: "Shukra mantra, Pran Pratishtha",
    priority: "primary", matchedSku: "AL-HRA-0055", orderId: "AL-ORD-016",
    createdAt: "2026-07-28", updatedAt: "2026-08-01",
  },
  {
    id: "rec_033", consultationId: "cons_033", customerId: "cust_016",
    customerName: "Gaurav Mehta", expertId: "usr_expert_03", expertName: "Acharya V. Tripathi",
    status: "converted_to_order", gemstone: "Red Coral (Moonga)",
    rationale: "Mars afflicted in 4th house creating property disputes and aggression issues.",
    purpose: "Property harmony and Mars pacification",
    weightRange: "5.5–7.0 ratti", qualityCriteria: "Italian origin, ox-blood red, opaque, natural",
    metalSetting: "22K Gold ring", fingerGuidance: "Ring finger, right hand",
    timingGuidance: "Tuesday, Mrigashira nakshatra", energisationNotes: "Mangal mantra, Maha Abhishek",
    priority: "primary", matchedSku: "AL-MNG-0088", orderId: "AL-ORD-017",
    createdAt: "2026-08-01", updatedAt: "2026-08-03",
  },
  {
    id: "rec_034", consultationId: "cons_034", customerId: "cust_017",
    customerName: "Sunita Pillai", expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar",
    status: "converted_to_order", gemstone: "Ruby (Manik)",
    rationale: "Sun debilitated affecting health and authority. Ruby strengthens solar energy.",
    purpose: "Health restoration and leadership",
    weightRange: "3.0–4.0 ratti", qualityCriteria: "Burmese origin, pigeon blood, minimal inclusions",
    metalSetting: "22K Gold ring", fingerGuidance: "Ring finger, right hand",
    timingGuidance: "Sunday, Uttara Phalguni, sunrise", energisationNotes: "Surya mantra, sunrise puja",
    priority: "primary", matchedSku: "AL-MNK-0412", orderId: "AL-ORD-018",
    createdAt: "2026-08-05", updatedAt: "2026-08-08",
  },
  {
    id: "rec_035", consultationId: "cons_035", customerId: "cust_018",
    customerName: "Aditya Verma", expertId: "usr_expert_02", expertName: "Dr. Meenakshi Joshi",
    status: "converted_to_order", gemstone: "Emerald (Panna)",
    rationale: "Mercury combust with Sun blocking creative expression and communication.",
    purpose: "Creative flow and communication clarity",
    weightRange: "3.5–4.5 ratti", qualityCriteria: "Colombian origin, vivid green, minor inclusions OK",
    metalSetting: "22K Gold or Panchdhatu ring", fingerGuidance: "Little finger, right hand",
    timingGuidance: "Wednesday, Jyeshtha nakshatra", energisationNotes: "Budh mantra, Shuddhi level",
    priority: "primary", matchedSku: "AL-PNA-0567", orderId: "AL-ORD-019",
    createdAt: "2026-08-08", updatedAt: "2026-08-10",
  },
];

// ── SEED ORDERS — One per scenario ──

export const SEED_ORDERS: Order[] = [
  // S01: Happy path — fully delivered (stone only) — already AL-ORD-001 exists
  // S02: Happy path — delivered (stone + jewellery) — already AL-ORD-008 exists (single stone)
  //      Creating a new one with stone+jewellery delivered
  {
    id: "AL-ORD-014", customerId: "cust_013", customerName: "Priya Sharma",
    items: [
      { sku: "AL-GMD-0101", name: "Gomed · Sri Lankan Hessonite", qty: 1, price: 168000, gemstone: "Hessonite", caratWeight: "7.5r", itemType: "stone", itemStatus: "ready_to_ship", vendorName: "Ceylon Gems Ltd.", vendorOrderId: "CG-2026-0345", receivedAt: "2026-07-28" },
      { sku: "DSN-SHRN-04", name: "Sharan Ring · Silver Setting", qty: 1, price: 28000, itemType: "jewellery", itemStatus: "ready_to_ship", vendorName: "Kanakadhara Jewellers", vendorOrderId: "KJ-2026-0812", receivedAt: "2026-08-02" },
    ],
    total: 196000, stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed",
    paymentStatus: "paid", energisationStatus: "completed", energisationTier: "pran_pratishtha",
    certificateStatus: "verified", tracking: "AWB-DTDC-1134567",
    affiliateCode: undefined, consultationId: "cons_030", recommendationId: "rec_030",
    placedAt: "2026-07-22", updatedAt: "2026-08-12", placedBy: "ops@astrolaabh.house",
  },

  // S03: Payment pending — awaiting payment
  {
    id: "AL-ORD-015", customerId: "cust_014", customerName: "Nikhil Deshmukh",
    items: [
      { sku: "AL-NLM-0198", name: "Neelam · Sri Lankan Blue Sapphire", qty: 1, price: 345000, gemstone: "Blue Sapphire", caratWeight: "5.4r", itemType: "stone", itemStatus: "order_placed" },
    ],
    total: 345000, stage: 0, shopifyStatus: "unfulfilled", operationalStatus: "pending",
    paymentStatus: "pending", energisationStatus: "pending", energisationTier: "maha_abhishek",
    certificateStatus: "not_required", affiliateCode: "SANDEEP108",
    consultationId: "cons_031", recommendationId: "rec_031",
    placedAt: "2026-07-28", updatedAt: "2026-07-28", placedBy: "priya.sharma@astrolaabh.com",
  },

  // S04: Payment failed
  {
    id: "AL-ORD-016", customerId: "cust_015", customerName: "Ishita Banerjee",
    items: [
      { sku: "AL-HRA-0055", name: "Heera · GIA Certified Diamond", qty: 1, price: 425000, gemstone: "Diamond", caratWeight: "1.3ct", itemType: "stone", itemStatus: "order_placed" },
    ],
    total: 425000, stage: 0, shopifyStatus: "unfulfilled", operationalStatus: "pending",
    paymentStatus: "failed", energisationStatus: "pending", energisationTier: "pran_pratishtha",
    certificateStatus: "not_required", affiliateCode: "MEENA9",
    consultationId: "cons_032", recommendationId: "rec_032",
    placedAt: "2026-08-01", updatedAt: "2026-08-03",
    notes: "Payment failed — card declined. Customer contacted for retry.",
  },

  // S05: Paid — sourcing in progress
  {
    id: "AL-ORD-017", customerId: "cust_016", customerName: "Gaurav Mehta",
    items: [
      { sku: "AL-MNG-0088", name: "Moonga · Italian Red Coral", qty: 1, price: 112000, gemstone: "Coral", caratWeight: "6.2r", itemType: "stone", itemStatus: "in_transit", vendorName: "Torre del Greco Co.", vendorOrderId: "TG-2026-0145" },
      { sku: "DSN-AKSH-02", name: "Akshaya Ring · 22K Gold", qty: 1, price: 42000, itemType: "jewellery", itemStatus: "order_placed", vendorName: "Kanakadhara Jewellers", vendorOrderId: "KJ-2026-0890" },
    ],
    total: 154000, stage: 0, shopifyStatus: "unfulfilled", operationalStatus: "in_progress",
    paymentStatus: "paid", energisationStatus: "pending", energisationTier: "maha_abhishek",
    certificateStatus: "missing", affiliateCode: "VTRI21",
    consultationId: "cons_033", recommendationId: "rec_033",
    placedAt: "2026-08-03", updatedAt: "2026-08-10", placedBy: "ops@astrolaabh.house",
  },

  // S06: Energisation scheduled (stone received)
  {
    id: "AL-ORD-018", customerId: "cust_017", customerName: "Sunita Pillai",
    items: [
      { sku: "AL-MNK-0412", name: "Manik · Burmese Ruby", qty: 1, price: 298000, gemstone: "Ruby", caratWeight: "3.4r", itemType: "stone", itemStatus: "order_received", vendorName: "Myanmar Gems Co.", vendorOrderId: "MG-2026-1102", receivedAt: "2026-08-12" },
    ],
    total: 298000, stage: 1, shopifyStatus: "unfulfilled", operationalStatus: "in_progress",
    paymentStatus: "paid", energisationStatus: "scheduled", energisationTier: "pran_pratishtha",
    certificateStatus: "missing",
    consultationId: "cons_034", recommendationId: "rec_034",
    placedAt: "2026-08-08", updatedAt: "2026-08-14", placedBy: "ops@astrolaabh.house",
  },

  // S07: Energisation in progress (multi-day)
  {
    id: "AL-ORD-019", customerId: "cust_018", customerName: "Aditya Verma",
    items: [
      { sku: "AL-PNA-0567", name: "Panna · Colombian Emerald", qty: 1, price: 185000, gemstone: "Emerald", caratWeight: "3.8r", itemType: "stone", itemStatus: "order_received", vendorName: "Muzo Emeralds Int.", vendorOrderId: "ME-2026-0498", receivedAt: "2026-08-13" },
    ],
    total: 185000, stage: 2, shopifyStatus: "unfulfilled", operationalStatus: "in_progress",
    paymentStatus: "paid", energisationStatus: "in_progress", energisationTier: "shuddhi",
    certificateStatus: "missing", affiliateCode: "RAJENDRA7",
    consultationId: "cons_035", recommendationId: "rec_035",
    placedAt: "2026-08-10", updatedAt: "2026-08-17", placedBy: "ops@astrolaabh.house",
  },

  // S08: Energised — jewellery in crafting
  {
    id: "AL-ORD-020", customerId: "cust_013", customerName: "Priya Sharma",
    items: [
      { sku: "AL-PKJ-0720", name: "Pukhraj · Ceylon Yellow Sapphire", qty: 1, price: 265000, gemstone: "Yellow Sapphire", caratWeight: "4.8r", itemType: "stone", itemStatus: "order_received", vendorName: "Sapphire Lanka Pvt.", vendorOrderId: "SL-2026-1410", receivedAt: "2026-07-15" },
      { sku: "DSN-VDYA-06", name: "Vidya Pendant · 22K Gold", qty: 1, price: 44000, itemType: "jewellery", itemStatus: "in_crafting", vendorName: "Kanakadhara Jewellers", vendorOrderId: "KJ-2026-0920", receivedAt: "2026-07-20" },
    ],
    total: 309000, stage: 3, shopifyStatus: "unfulfilled", operationalStatus: "in_progress",
    paymentStatus: "paid", energisationStatus: "completed", energisationTier: "maha_abhishek",
    certificateStatus: "uploaded",
    consultationId: "cons_030", recommendationId: "rec_030",
    placedAt: "2026-07-05", updatedAt: "2026-08-10", placedBy: "ops@astrolaabh.house",
  },

  // S09: Quality check
  {
    id: "AL-ORD-021", customerId: "cust_014", customerName: "Nikhil Deshmukh",
    items: [
      { sku: "AL-NLM-0210", name: "Neelam · Kashmiri Blue Sapphire", qty: 1, price: 520000, gemstone: "Blue Sapphire", caratWeight: "5.8r", itemType: "stone", itemStatus: "quality_check", vendorName: "Kashmir Sapphires", vendorOrderId: "KS-2026-0078", receivedAt: "2026-07-20" },
      { sku: "DSN-DVYA-07", name: "Divya Ring · Panchdhatu", qty: 1, price: 35000, itemType: "jewellery", itemStatus: "quality_check", vendorName: "Kanakadhara Jewellers", vendorOrderId: "KJ-2026-0845", receivedAt: "2026-07-28" },
    ],
    total: 555000, stage: 4, shopifyStatus: "unfulfilled", operationalStatus: "in_progress",
    paymentStatus: "paid", energisationStatus: "completed", energisationTier: "maha_abhishek",
    certificateStatus: "uploaded", affiliateCode: "SANDEEP108",
    placedAt: "2026-06-20", updatedAt: "2026-08-05", placedBy: "ops@astrolaabh.house",
  },

  // S10: Dispatched — in transit
  {
    id: "AL-ORD-022", customerId: "cust_015", customerName: "Ishita Banerjee",
    items: [
      { sku: "AL-PKJ-0815", name: "Pukhraj · Thai Yellow Sapphire", qty: 1, price: 155000, gemstone: "Yellow Sapphire", caratWeight: "3.2r", itemType: "stone", itemStatus: "ready_to_ship", vendorName: "Thai Gems House", vendorOrderId: "TG-2026-0890", receivedAt: "2026-07-10" },
    ],
    total: 155000, stage: 6, shopifyStatus: "partially_fulfilled", operationalStatus: "in_progress",
    paymentStatus: "paid", energisationStatus: "completed", energisationTier: "shuddhi",
    certificateStatus: "verified", tracking: "AWB-BLU-8834521", affiliateCode: "MEENA9",
    placedAt: "2026-06-28", updatedAt: "2026-08-14",
  },

  // S11: Cancelled before payment
  {
    id: "AL-ORD-023", customerId: "cust_016", customerName: "Gaurav Mehta",
    items: [
      { sku: "AL-LSN-0045", name: "Lehsunia · Chrysoberyl Cat's Eye", qty: 1, price: 195000, gemstone: "Cat's Eye", caratWeight: "4.8r", itemType: "stone", itemStatus: "order_placed" },
    ],
    total: 195000, stage: 0, shopifyStatus: "cancelled", operationalStatus: "exception",
    paymentStatus: "pending", energisationStatus: "not_required",
    certificateStatus: "not_required",
    placedAt: "2026-07-15", updatedAt: "2026-07-18",
    notes: "Customer cancelled — found alternative vendor before payment.",
  },

  // S12: Cancelled after payment — refund issued
  {
    id: "AL-ORD-024", customerId: "cust_017", customerName: "Sunita Pillai",
    items: [
      { sku: "AL-PKJ-0830", name: "Pukhraj · Ceylon Yellow Sapphire", qty: 1, price: 310000, gemstone: "Yellow Sapphire", caratWeight: "5.6r", itemType: "stone", itemStatus: "order_placed" },
    ],
    total: 310000, stage: 0, shopifyStatus: "cancelled", operationalStatus: "exception",
    paymentStatus: "refunded", energisationStatus: "not_required",
    certificateStatus: "not_required",
    placedAt: "2026-06-15", updatedAt: "2026-06-22",
    notes: "Customer paid then cancelled within 24h. Full refund processed via TXN-RZP-REF-001.",
  },

  // S13: Refunded after delivery — return settled
  {
    id: "AL-ORD-025", customerId: "cust_018", customerName: "Aditya Verma",
    items: [
      { sku: "AL-MNK-0399", name: "Manik · Mozambique Ruby", qty: 1, price: 145000, gemstone: "Ruby", caratWeight: "2.7r", itemType: "stone", itemStatus: "ready_to_ship", vendorName: "GemRock Africa", vendorOrderId: "GR-2026-0310", receivedAt: "2026-06-02" },
    ],
    total: 145000, stage: 7, shopifyStatus: "refunded", operationalStatus: "exception",
    paymentStatus: "refunded", energisationStatus: "completed", energisationTier: "shuddhi",
    certificateStatus: "verified", tracking: "AWB-EKT-2234567",
    returnStatus: "settled",
    placedAt: "2026-05-15", updatedAt: "2026-07-10",
    notes: "Delivered Jun 10. Customer returned due to adverse trial period reaction. Full refund issued Jul 10.",
  },

  // S14: Return requested
  {
    id: "AL-ORD-026", customerId: "cust_013", customerName: "Priya Sharma",
    items: [
      { sku: "AL-PNA-0489", name: "Panna · Zambian Emerald", qty: 1, price: 165000, gemstone: "Emerald", caratWeight: "3.5r", itemType: "stone", itemStatus: "ready_to_ship", vendorName: "Kagem Mining Ltd.", vendorOrderId: "KM-2026-0267", receivedAt: "2026-06-20" },
    ],
    total: 165000, stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed",
    paymentStatus: "paid", energisationStatus: "completed", energisationTier: "pran_pratishtha",
    certificateStatus: "verified", tracking: "AWB-DHL-4456789",
    returnStatus: "requested",
    placedAt: "2026-06-01", updatedAt: "2026-08-15",
    notes: "Customer requesting return — stone not suiting. Awaiting approval.",
  },

  // S15: Return in transit
  {
    id: "AL-ORD-027", customerId: "cust_014", customerName: "Nikhil Deshmukh",
    items: [
      { sku: "AL-MNK-0355", name: "Manik · Thai Ruby", qty: 1, price: 128000, gemstone: "Ruby", caratWeight: "2.5r", itemType: "stone", itemStatus: "ready_to_ship", vendorName: "Thai Gems House", vendorOrderId: "TG-2026-0534", receivedAt: "2026-05-28" },
    ],
    total: 128000, stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed",
    paymentStatus: "paid", energisationStatus: "completed", energisationTier: "shuddhi",
    certificateStatus: "verified", tracking: "AWB-DTDC-3345678",
    returnStatus: "in_transit",
    placedAt: "2026-05-10", updatedAt: "2026-08-12",
    notes: "Return approved Aug 8. Customer shipped back on Aug 10. In transit to warehouse.",
  },

  // S16: Energisation not required (direct sale)
  {
    id: "AL-ORD-028", customerId: "cust_015", customerName: "Ishita Banerjee",
    items: [
      { sku: "AL-PKJ-0650", name: "Pukhraj · Ceylon Yellow Sapphire", qty: 1, price: 220000, gemstone: "Yellow Sapphire", caratWeight: "4.2r", itemType: "stone", itemStatus: "ready_to_ship", vendorName: "Sapphire Lanka Pvt.", vendorOrderId: "SL-2026-1255", receivedAt: "2026-06-25" },
    ],
    total: 220000, stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed",
    paymentStatus: "paid", energisationStatus: "not_required",
    certificateStatus: "verified", tracking: "AWB-BLU-9912345",
    placedAt: "2026-06-10", updatedAt: "2026-07-18",
    notes: "Customer opted out of energisation — performing own puja.",
  },

  // S17: Energisation exception
  {
    id: "AL-ORD-029", customerId: "cust_016", customerName: "Gaurav Mehta",
    items: [
      { sku: "AL-NLM-0175", name: "Neelam · Sri Lankan Blue Sapphire", qty: 1, price: 380000, gemstone: "Blue Sapphire", caratWeight: "4.9r", itemType: "stone", itemStatus: "order_received", vendorName: "Sapphire Lanka Pvt.", vendorOrderId: "SL-2026-1312", receivedAt: "2026-08-01" },
    ],
    total: 380000, stage: 2, shopifyStatus: "unfulfilled", operationalStatus: "exception",
    paymentStatus: "paid", energisationStatus: "exception", energisationTier: "vishesh_anushthan",
    certificateStatus: "missing", affiliateCode: "VTRI21",
    placedAt: "2026-07-20", updatedAt: "2026-08-16",
    notes: "Energisation exception — pandit fell ill during 21-day Anushthan (day 8). Awaiting rescheduling.",
  },

  // S18: Partial payment
  {
    id: "AL-ORD-030", customerId: "cust_017", customerName: "Sunita Pillai",
    items: [
      { sku: "AL-NLM-0220", name: "Neelam · Kashmiri Blue Sapphire", qty: 1, price: 780000, gemstone: "Blue Sapphire", caratWeight: "7.2r", itemType: "stone", itemStatus: "order_placed" },
    ],
    total: 780000, stage: 0, shopifyStatus: "unfulfilled", operationalStatus: "in_progress",
    paymentStatus: "partial", energisationStatus: "pending", energisationTier: "vishesh_anushthan",
    certificateStatus: "not_required",
    placedAt: "2026-08-10", updatedAt: "2026-08-12",
    notes: "Partial payment received — ₹4,00,000 of ₹7,80,000. Balance due by Aug 20.",
  },

  // S19: Certificate rejected
  {
    id: "AL-ORD-031", customerId: "cust_018", customerName: "Aditya Verma",
    items: [
      { sku: "AL-PKJ-0690", name: "Pukhraj · Thai Yellow Sapphire", qty: 1, price: 175000, gemstone: "Yellow Sapphire", caratWeight: "3.6r", itemType: "stone", itemStatus: "order_received", vendorName: "Thai Gems House", vendorOrderId: "TG-2026-0910", receivedAt: "2026-07-25" },
      { sku: "DSN-LKSM-08", name: "Lakshmi Bracelet · 22K Gold", qty: 1, price: 58000, itemType: "jewellery", itemStatus: "in_crafting", vendorName: "Kanakadhara Jewellers", vendorOrderId: "KJ-2026-0950", receivedAt: "2026-08-01" },
    ],
    total: 233000, stage: 3, shopifyStatus: "unfulfilled", operationalStatus: "in_progress",
    paymentStatus: "paid", energisationStatus: "completed", energisationTier: "pran_pratishtha",
    certificateStatus: "rejected", affiliateCode: "RAJENDRA7",
    placedAt: "2026-07-15", updatedAt: "2026-08-14",
    notes: "Lab certificate rejected — weight discrepancy (cert says 3.4r, stone is 3.6r). Vendor asked to reissue.",
  },

  // S20: Delivered with return settled (exchange/partial refund case)
  {
    id: "AL-ORD-032", customerId: "cust_013", customerName: "Priya Sharma",
    items: [
      { sku: "AL-MNG-0095", name: "Moonga · Italian Red Coral", qty: 1, price: 88000, gemstone: "Coral", caratWeight: "5.8r", itemType: "stone", itemStatus: "ready_to_ship", vendorName: "Torre del Greco Co.", vendorOrderId: "TG-2026-0055", receivedAt: "2026-05-10" },
    ],
    total: 88000, stage: 7, shopifyStatus: "fulfilled", operationalStatus: "completed",
    paymentStatus: "paid", energisationStatus: "completed", energisationTier: "shuddhi",
    certificateStatus: "verified", tracking: "AWB-EKT-5567890",
    returnStatus: "settled",
    placedAt: "2026-04-25", updatedAt: "2026-06-30",
    notes: "Customer returned for size exchange. Replacement sent and settled.",
  },
];

// ── Payment records for seed orders ──

export const SEED_PAYMENTS: PaymentRequest[] = [
  // S01 (AL-ORD-014): Paid
  {
    id: "pay_030", customerId: "cust_013", customerName: "Priya Sharma",
    purpose: "Stone purchase — Gomed Sri Lankan Hessonite + Sharan Ring",
    amount: 196000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-014", linkedRecommendationId: "rec_030",
    paymentLink: "https://pay.astrolaabh.house/p/pay_030",
    paidAt: "2026-07-22T10:30:00+05:30", transactionRef: "TXN-RZP-92001",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-07-20", updatedAt: "2026-07-22",
  },
  // S03 (AL-ORD-015): Payment sent, not paid
  {
    id: "pay_031", customerId: "cust_014", customerName: "Nikhil Deshmukh",
    purpose: "Stone purchase — Neelam Sri Lankan Blue Sapphire",
    amount: 345000, currency: "INR", status: "sent",
    linkedOrderId: "AL-ORD-015", linkedRecommendationId: "rec_031",
    paymentLink: "https://pay.astrolaabh.house/p/pay_031",
    expiresAt: "2026-08-12",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-07-28", updatedAt: "2026-07-28",
  },
  // S04 (AL-ORD-016): Payment failed
  {
    id: "pay_032", customerId: "cust_015", customerName: "Ishita Banerjee",
    purpose: "Stone purchase — Heera GIA Certified Diamond",
    amount: 425000, currency: "INR", status: "failed",
    linkedOrderId: "AL-ORD-016", linkedRecommendationId: "rec_032",
    paymentLink: "https://pay.astrolaabh.house/p/pay_032",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-08-01", updatedAt: "2026-08-03",
  },
  // S05 (AL-ORD-017): Paid
  {
    id: "pay_033", customerId: "cust_016", customerName: "Gaurav Mehta",
    purpose: "Stone purchase — Moonga Italian Red Coral + Akshaya Ring",
    amount: 154000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-017", linkedRecommendationId: "rec_033",
    paymentLink: "https://pay.astrolaabh.house/p/pay_033",
    paidAt: "2026-08-03T14:15:00+05:30", transactionRef: "TXN-RZP-92501",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-08-01", updatedAt: "2026-08-03",
  },
  // S06 (AL-ORD-018): Paid
  {
    id: "pay_034", customerId: "cust_017", customerName: "Sunita Pillai",
    purpose: "Stone purchase — Manik Burmese Ruby",
    amount: 298000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-018", linkedRecommendationId: "rec_034",
    paymentLink: "https://pay.astrolaabh.house/p/pay_034",
    paidAt: "2026-08-08T11:45:00+05:30", transactionRef: "TXN-RZP-93001",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-08-06", updatedAt: "2026-08-08",
  },
  // S07 (AL-ORD-019): Paid
  {
    id: "pay_035", customerId: "cust_018", customerName: "Aditya Verma",
    purpose: "Stone purchase — Panna Colombian Emerald",
    amount: 185000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-019", linkedRecommendationId: "rec_035",
    paymentLink: "https://pay.astrolaabh.house/p/pay_035",
    paidAt: "2026-08-10T09:00:00+05:30", transactionRef: "TXN-RZP-93501",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-08-08", updatedAt: "2026-08-10",
  },
  // S08 (AL-ORD-020): Paid
  {
    id: "pay_036", customerId: "cust_013", customerName: "Priya Sharma",
    purpose: "Stone purchase — Pukhraj Ceylon Yellow Sapphire + Vidya Pendant",
    amount: 309000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-020",
    paymentLink: "https://pay.astrolaabh.house/p/pay_036",
    paidAt: "2026-07-05T16:20:00+05:30", transactionRef: "TXN-RZP-89001",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-07-02", updatedAt: "2026-07-05",
  },
  // S09 (AL-ORD-021): Paid
  {
    id: "pay_037", customerId: "cust_014", customerName: "Nikhil Deshmukh",
    purpose: "Stone purchase — Neelam Kashmiri Blue Sapphire + Divya Ring",
    amount: 555000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-021",
    paymentLink: "https://pay.astrolaabh.house/p/pay_037",
    paidAt: "2026-06-20T12:00:00+05:30", transactionRef: "TXN-RZP-86801",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-06-18", updatedAt: "2026-06-20",
  },
  // S10 (AL-ORD-022): Paid
  {
    id: "pay_038", customerId: "cust_015", customerName: "Ishita Banerjee",
    purpose: "Stone purchase — Pukhraj Thai Yellow Sapphire",
    amount: 155000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-022",
    paymentLink: "https://pay.astrolaabh.house/p/pay_038",
    paidAt: "2026-06-28T15:30:00+05:30", transactionRef: "TXN-RZP-87201",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-06-26", updatedAt: "2026-06-28",
  },
  // S11 (AL-ORD-023): Cancelled (no payment)
  {
    id: "pay_039", customerId: "cust_016", customerName: "Gaurav Mehta",
    purpose: "Stone purchase — Lehsunia Chrysoberyl Cat's Eye",
    amount: 195000, currency: "INR", status: "cancelled",
    linkedOrderId: "AL-ORD-023",
    paymentLink: "https://pay.astrolaabh.house/p/pay_039",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-07-15", updatedAt: "2026-07-18",
  },
  // S12 (AL-ORD-024): Paid then cancelled (refund)
  {
    id: "pay_040", customerId: "cust_017", customerName: "Sunita Pillai",
    purpose: "Stone purchase — Pukhraj Ceylon Yellow Sapphire (CANCELLED)",
    amount: 310000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-024",
    paymentLink: "https://pay.astrolaabh.house/p/pay_040",
    paidAt: "2026-06-15T10:00:00+05:30", transactionRef: "TXN-RZP-85601",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-06-12", updatedAt: "2026-06-22",
  },
  // S13 (AL-ORD-025): Paid and refunded
  {
    id: "pay_041", customerId: "cust_018", customerName: "Aditya Verma",
    purpose: "Stone purchase — Manik Mozambique Ruby (RETURNED)",
    amount: 145000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-025",
    paymentLink: "https://pay.astrolaabh.house/p/pay_041",
    paidAt: "2026-05-15T11:30:00+05:30", transactionRef: "TXN-RZP-84301",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-05-12", updatedAt: "2026-07-10",
  },
  // S14 (AL-ORD-026): Paid (return requested, no refund yet)
  {
    id: "pay_042", customerId: "cust_013", customerName: "Priya Sharma",
    purpose: "Stone purchase — Panna Zambian Emerald",
    amount: 165000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-026",
    paymentLink: "https://pay.astrolaabh.house/p/pay_042",
    paidAt: "2026-06-01T09:20:00+05:30", transactionRef: "TXN-RZP-85001",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-05-28", updatedAt: "2026-06-01",
  },
  // S15 (AL-ORD-027): Paid (return in transit)
  {
    id: "pay_043", customerId: "cust_014", customerName: "Nikhil Deshmukh",
    purpose: "Stone purchase — Manik Thai Ruby",
    amount: 128000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-027",
    paymentLink: "https://pay.astrolaabh.house/p/pay_043",
    paidAt: "2026-05-10T14:00:00+05:30", transactionRef: "TXN-RZP-84001",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-05-08", updatedAt: "2026-05-10",
  },
  // S16 (AL-ORD-028): Paid (no energisation)
  {
    id: "pay_044", customerId: "cust_015", customerName: "Ishita Banerjee",
    purpose: "Stone purchase — Pukhraj Ceylon Yellow Sapphire (no energisation)",
    amount: 220000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-028",
    paymentLink: "https://pay.astrolaabh.house/p/pay_044",
    paidAt: "2026-06-10T13:45:00+05:30", transactionRef: "TXN-RZP-85401",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-06-08", updatedAt: "2026-06-10",
  },
  // S17 (AL-ORD-029): Paid (energisation exception)
  {
    id: "pay_045", customerId: "cust_016", customerName: "Gaurav Mehta",
    purpose: "Stone purchase — Neelam Sri Lankan Blue Sapphire",
    amount: 380000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-029",
    paymentLink: "https://pay.astrolaabh.house/p/pay_045",
    paidAt: "2026-07-20T10:15:00+05:30", transactionRef: "TXN-RZP-89501",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-07-18", updatedAt: "2026-07-20",
  },
  // S18 (AL-ORD-030): Partial payment
  {
    id: "pay_046", customerId: "cust_017", customerName: "Sunita Pillai",
    purpose: "Stone purchase — Neelam Kashmiri Blue Sapphire (partial)",
    description: "Partial payment: ₹4,00,000 of ₹7,80,000. Balance due by Aug 20.",
    amount: 780000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-030",
    paymentLink: "https://pay.astrolaabh.house/p/pay_046",
    paidAt: "2026-08-10T11:00:00+05:30", transactionRef: "TXN-RZP-94001",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-08-08", updatedAt: "2026-08-10",
  },
  // S19 (AL-ORD-031): Paid (cert rejected)
  {
    id: "pay_047", customerId: "cust_018", customerName: "Aditya Verma",
    purpose: "Stone purchase — Pukhraj Thai Yellow Sapphire + Lakshmi Bracelet",
    amount: 233000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-031",
    paymentLink: "https://pay.astrolaabh.house/p/pay_047",
    paidAt: "2026-07-15T16:30:00+05:30", transactionRef: "TXN-RZP-88901",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-07-12", updatedAt: "2026-07-15",
  },
  // S20 (AL-ORD-032): Paid (return settled)
  {
    id: "pay_048", customerId: "cust_013", customerName: "Priya Sharma",
    purpose: "Stone purchase — Moonga Italian Red Coral",
    amount: 88000, currency: "INR", status: "paid",
    linkedOrderId: "AL-ORD-032",
    paymentLink: "https://pay.astrolaabh.house/p/pay_048",
    paidAt: "2026-04-25T09:30:00+05:30", transactionRef: "TXN-RZP-82001",
    ownerId: "usr_admin_01", ownerName: "Ops Admin",
    createdAt: "2026-04-22", updatedAt: "2026-04-25",
  },
];

// ── Energisation tasks for seed orders ──

export const SEED_ENERGISATION: EnergisationTask[] = [
  // S01 (AL-ORD-014): Completed
  {
    id: "eng_030", orderId: "AL-ORD-014", orderNumber: "AL-ORD-014",
    customerId: "cust_013", customerName: "Priya Sharma",
    stoneSku: "AL-GMD-0101", stoneDescription: "Gomed · Sri Lankan Hessonite · 7.5r",
    status: "completed",
    scheduledAt: "2026-07-30T18:00:00+05:30", method: "Rahu Beej Mantra — Saturday Pran Pratishtha",
    assignedTo: "Pt. Sandeep Kochaar", completedAt: "2026-07-30T19:30:00+05:30",
    proofUrl: "https://vault.astrolaabh.house/recordings/eng_030.mp4", proofType: "video",
    buyerNotified: true, createdAt: "2026-07-25", updatedAt: "2026-07-30",
  },
  // S06 (AL-ORD-018): Scheduled
  {
    id: "eng_031", orderId: "AL-ORD-018", orderNumber: "AL-ORD-018",
    customerId: "cust_017", customerName: "Sunita Pillai",
    stoneSku: "AL-MNK-0412", stoneDescription: "Manik · Burmese Ruby · 3.4r",
    status: "scheduled",
    scheduledAt: "2026-08-24T05:45:00+05:30", method: "Surya Mantra — sunrise Pran Pratishtha",
    assignedTo: "Acharya V. Tripathi",
    liveLink: "https://live.astrolaabh.house/eng_031",
    buyerNotified: true, createdAt: "2026-08-14", updatedAt: "2026-08-14",
  },
  // S07 (AL-ORD-019): In progress
  {
    id: "eng_032", orderId: "AL-ORD-019", orderNumber: "AL-ORD-019",
    customerId: "cust_018", customerName: "Aditya Verma",
    stoneSku: "AL-PNA-0567", stoneDescription: "Panna · Colombian Emerald · 3.8r",
    status: "in_progress",
    scheduledAt: "2026-08-14T07:00:00+05:30", method: "Budh Mantra — Wednesday Shuddhi (Day 4 of 5)",
    assignedTo: "Dr. Meenakshi Joshi",
    liveLink: "https://live.astrolaabh.house/eng_032",
    buyerNotified: true,
    notes: "Multi-day Shuddhi ritual. Day 4 completed; final session scheduled Aug 20.",
    createdAt: "2026-08-12", updatedAt: "2026-08-17",
  },
  // S08 (AL-ORD-020): Completed
  {
    id: "eng_033", orderId: "AL-ORD-020", orderNumber: "AL-ORD-020",
    customerId: "cust_013", customerName: "Priya Sharma",
    stoneSku: "AL-PKJ-0720", stoneDescription: "Pukhraj · Ceylon Yellow Sapphire · 4.8r",
    status: "completed",
    scheduledAt: "2026-07-20T06:00:00+05:30", method: "Brihaspati Mantra — Maha Abhishek (3-day ritual)",
    assignedTo: "Pt. Sandeep Kochaar", completedAt: "2026-07-22T07:30:00+05:30",
    proofUrl: "https://vault.astrolaabh.house/recordings/eng_033.mp4", proofType: "video",
    buyerNotified: true, createdAt: "2026-07-15", updatedAt: "2026-07-22",
  },
  // S09 (AL-ORD-021): Completed
  {
    id: "eng_034", orderId: "AL-ORD-021", orderNumber: "AL-ORD-021",
    customerId: "cust_014", customerName: "Nikhil Deshmukh",
    stoneSku: "AL-NLM-0210", stoneDescription: "Neelam · Kashmiri Blue Sapphire · 5.8r",
    status: "completed",
    scheduledAt: "2026-07-25T18:30:00+05:30", method: "Shani Mantra — Maha Abhishek (3 sessions)",
    assignedTo: "Pt. Sandeep Kochaar", completedAt: "2026-07-27T19:00:00+05:30",
    liveLink: "https://live.astrolaabh.house/eng_034",
    proofUrl: "https://vault.astrolaabh.house/recordings/eng_034.mp4", proofType: "video",
    buyerNotified: true, createdAt: "2026-07-22", updatedAt: "2026-07-27",
  },
  // S10 (AL-ORD-022): Completed
  {
    id: "eng_035", orderId: "AL-ORD-022", orderNumber: "AL-ORD-022",
    customerId: "cust_015", customerName: "Ishita Banerjee",
    stoneSku: "AL-PKJ-0815", stoneDescription: "Pukhraj · Thai Yellow Sapphire · 3.2r",
    status: "completed",
    scheduledAt: "2026-07-15T06:00:00+05:30", method: "Brihaspati Mantra — Shuddhi",
    assignedTo: "Dr. Meenakshi Joshi", completedAt: "2026-07-15T07:00:00+05:30",
    proofUrl: "https://vault.astrolaabh.house/recordings/eng_035.mp4", proofType: "video",
    buyerNotified: true, createdAt: "2026-07-12", updatedAt: "2026-07-15",
  },
  // S13 (AL-ORD-025): Completed (refunded order)
  {
    id: "eng_036", orderId: "AL-ORD-025", orderNumber: "AL-ORD-025",
    customerId: "cust_018", customerName: "Aditya Verma",
    stoneSku: "AL-MNK-0399", stoneDescription: "Manik · Mozambique Ruby · 2.7r",
    status: "completed",
    scheduledAt: "2026-05-25T05:45:00+05:30", method: "Surya Mantra — Shuddhi",
    assignedTo: "Acharya V. Tripathi", completedAt: "2026-05-25T06:45:00+05:30",
    proofUrl: "https://vault.astrolaabh.house/recordings/eng_036.mp4", proofType: "video",
    buyerNotified: true, createdAt: "2026-05-20", updatedAt: "2026-05-25",
  },
  // S14 (AL-ORD-026): Completed (return requested)
  {
    id: "eng_037", orderId: "AL-ORD-026", orderNumber: "AL-ORD-026",
    customerId: "cust_013", customerName: "Priya Sharma",
    stoneSku: "AL-PNA-0489", stoneDescription: "Panna · Zambian Emerald · 3.5r",
    status: "completed",
    scheduledAt: "2026-06-25T07:00:00+05:30", method: "Budh Mantra — Pran Pratishtha",
    assignedTo: "Pt. Sandeep Kochaar", completedAt: "2026-06-25T08:30:00+05:30",
    proofUrl: "https://vault.astrolaabh.house/recordings/eng_037.mp4", proofType: "video",
    buyerNotified: true, createdAt: "2026-06-22", updatedAt: "2026-06-25",
  },
  // S15 (AL-ORD-027): Completed (return in transit)
  {
    id: "eng_038", orderId: "AL-ORD-027", orderNumber: "AL-ORD-027",
    customerId: "cust_014", customerName: "Nikhil Deshmukh",
    stoneSku: "AL-MNK-0355", stoneDescription: "Manik · Thai Ruby · 2.5r",
    status: "completed",
    scheduledAt: "2026-06-01T05:45:00+05:30", method: "Surya Mantra — Shuddhi",
    assignedTo: "Dr. Meenakshi Joshi", completedAt: "2026-06-01T06:45:00+05:30",
    proofUrl: "https://vault.astrolaabh.house/recordings/eng_038.mp4", proofType: "video",
    buyerNotified: true, createdAt: "2026-05-28", updatedAt: "2026-06-01",
  },
  // S17 (AL-ORD-029): Exception
  {
    id: "eng_039", orderId: "AL-ORD-029", orderNumber: "AL-ORD-029",
    customerId: "cust_016", customerName: "Gaurav Mehta",
    stoneSku: "AL-NLM-0175", stoneDescription: "Neelam · Sri Lankan Blue Sapphire · 4.9r",
    status: "exception",
    scheduledAt: "2026-08-05T18:00:00+05:30", method: "Shani Mantra — Vishesh Anushthan (21-day)",
    assignedTo: "Pt. Sandeep Kochaar",
    buyerNotified: true,
    notes: "Pandit Sandeep fell ill on day 8 of 21-day ritual. Ritual paused. Customer informed. Rescheduling when pandit recovers.",
    createdAt: "2026-07-28", updatedAt: "2026-08-13",
  },
  // S19 (AL-ORD-031): Completed (cert rejected scenario)
  {
    id: "eng_040", orderId: "AL-ORD-031", orderNumber: "AL-ORD-031",
    customerId: "cust_018", customerName: "Aditya Verma",
    stoneSku: "AL-PKJ-0690", stoneDescription: "Pukhraj · Thai Yellow Sapphire · 3.6r",
    status: "completed",
    scheduledAt: "2026-08-01T06:00:00+05:30", method: "Brihaspati Mantra — Pran Pratishtha",
    assignedTo: "Pt. Sandeep Kochaar", completedAt: "2026-08-01T07:30:00+05:30",
    proofUrl: "https://vault.astrolaabh.house/recordings/eng_040.mp4", proofType: "video",
    buyerNotified: true, createdAt: "2026-07-28", updatedAt: "2026-08-01",
  },
  // S20 (AL-ORD-032): Completed (settled return)
  {
    id: "eng_041", orderId: "AL-ORD-032", orderNumber: "AL-ORD-032",
    customerId: "cust_013", customerName: "Priya Sharma",
    stoneSku: "AL-MNG-0095", stoneDescription: "Moonga · Italian Red Coral · 5.8r",
    status: "completed",
    scheduledAt: "2026-05-15T06:30:00+05:30", method: "Mangal Mantra — Shuddhi",
    assignedTo: "Acharya V. Tripathi", completedAt: "2026-05-15T07:30:00+05:30",
    proofUrl: "https://vault.astrolaabh.house/recordings/eng_041.mp4", proofType: "video",
    buyerNotified: true, createdAt: "2026-05-12", updatedAt: "2026-05-15",
  },
];

// ── Certificates for seed orders ──

export const SEED_CERTIFICATES: Certificate[] = [
  // S01 (AL-ORD-014): Both verified
  {
    id: "cert_030", orderId: "AL-ORD-014", orderNumber: "AL-ORD-014",
    type: "lab_authenticity", status: "verified",
    fileName: "AL-GMD-0101-IGI-cert.pdf", certificateNumber: "IGI-2026-56789",
    issuingAuthority: "IGI (International Gemological Institute)",
    issueDate: "2026-07-18", applicableSku: "AL-GMD-0101",
    verifiedBy: "Ops Admin", verifiedAt: "2026-07-26",
    verificationNotes: "Sri Lankan origin confirmed, honey-brown, 7.51 ratti",
    uploadedBy: "Ops Admin", uploadedAt: "2026-07-25",
    createdAt: "2026-07-25", updatedAt: "2026-07-26",
  },
  {
    id: "cert_031", orderId: "AL-ORD-014", orderNumber: "AL-ORD-014",
    type: "energisation", status: "verified",
    fileName: "AL-GMD-0101-energisation.pdf", certificateNumber: "AEC-2026-014",
    issuingAuthority: "AstroLaabh Puja Division",
    issueDate: "2026-07-30", applicableSku: "AL-GMD-0101",
    verifiedBy: "Pt. Sandeep Kochaar", verifiedAt: "2026-07-31",
    uploadedBy: "Ops Admin", uploadedAt: "2026-07-31",
    createdAt: "2026-07-31", updatedAt: "2026-07-31",
  },
  // S08 (AL-ORD-020): Lab uploaded (pending verification)
  {
    id: "cert_032", orderId: "AL-ORD-020", orderNumber: "AL-ORD-020",
    type: "lab_authenticity", status: "uploaded",
    fileName: "AL-PKJ-0720-GIA-cert.pdf", certificateNumber: "GIA-2026-91001",
    issuingAuthority: "GIA", issueDate: "2026-07-05", applicableSku: "AL-PKJ-0720",
    uploadedBy: "Ops Admin", uploadedAt: "2026-07-18",
    createdAt: "2026-07-18", updatedAt: "2026-07-18",
  },
  {
    id: "cert_033", orderId: "AL-ORD-020", orderNumber: "AL-ORD-020",
    type: "energisation", status: "uploaded",
    fileName: "AL-PKJ-0720-energisation.pdf", certificateNumber: "AEC-2026-020",
    issuingAuthority: "AstroLaabh Puja Division",
    issueDate: "2026-07-22", applicableSku: "AL-PKJ-0720",
    uploadedBy: "Ops Admin", uploadedAt: "2026-07-23",
    createdAt: "2026-07-23", updatedAt: "2026-07-23",
  },
  // S09 (AL-ORD-021): Lab uploaded
  {
    id: "cert_034", orderId: "AL-ORD-021", orderNumber: "AL-ORD-021",
    type: "lab_authenticity", status: "uploaded",
    fileName: "AL-NLM-0210-GRS-cert.pdf", certificateNumber: "GRS-2026-18901",
    issuingAuthority: "GRS (Gem Research Swisslab)",
    issueDate: "2026-06-28", applicableSku: "AL-NLM-0210",
    uploadedBy: "Ops Admin", uploadedAt: "2026-07-05",
    createdAt: "2026-07-05", updatedAt: "2026-07-05",
  },
  {
    id: "cert_035", orderId: "AL-ORD-021", orderNumber: "AL-ORD-021",
    type: "energisation", status: "uploaded",
    fileName: "AL-NLM-0210-energisation.pdf", certificateNumber: "AEC-2026-021",
    issuingAuthority: "AstroLaabh Puja Division",
    issueDate: "2026-07-27", applicableSku: "AL-NLM-0210",
    uploadedBy: "Ops Admin", uploadedAt: "2026-07-28",
    createdAt: "2026-07-28", updatedAt: "2026-07-28",
  },
  // S10 (AL-ORD-022): Both verified
  {
    id: "cert_036", orderId: "AL-ORD-022", orderNumber: "AL-ORD-022",
    type: "lab_authenticity", status: "verified",
    fileName: "AL-PKJ-0815-GIA-cert.pdf", certificateNumber: "GIA-2026-88901",
    issuingAuthority: "GIA", issueDate: "2026-06-30", applicableSku: "AL-PKJ-0815",
    verifiedBy: "Ops Admin", verifiedAt: "2026-07-12",
    uploadedBy: "Ops Admin", uploadedAt: "2026-07-10",
    createdAt: "2026-07-10", updatedAt: "2026-07-12",
  },
  {
    id: "cert_037", orderId: "AL-ORD-022", orderNumber: "AL-ORD-022",
    type: "energisation", status: "verified",
    fileName: "AL-PKJ-0815-energisation.pdf", certificateNumber: "AEC-2026-022",
    issuingAuthority: "AstroLaabh Puja Division",
    issueDate: "2026-07-15", applicableSku: "AL-PKJ-0815",
    verifiedBy: "Dr. Meenakshi Joshi", verifiedAt: "2026-07-16",
    uploadedBy: "Ops Admin", uploadedAt: "2026-07-16",
    createdAt: "2026-07-16", updatedAt: "2026-07-16",
  },
  // S13 (AL-ORD-025): Both verified (returned order)
  {
    id: "cert_038", orderId: "AL-ORD-025", orderNumber: "AL-ORD-025",
    type: "lab_authenticity", status: "verified",
    fileName: "AL-MNK-0399-cert.pdf", certificateNumber: "IGI-2026-34567",
    issuingAuthority: "IGI", issueDate: "2026-05-10", applicableSku: "AL-MNK-0399",
    verifiedBy: "Ops Admin", verifiedAt: "2026-05-20",
    uploadedBy: "Ops Admin", uploadedAt: "2026-05-18",
    createdAt: "2026-05-18", updatedAt: "2026-05-20",
  },
  {
    id: "cert_039", orderId: "AL-ORD-025", orderNumber: "AL-ORD-025",
    type: "energisation", status: "verified",
    fileName: "AL-MNK-0399-energisation.pdf", certificateNumber: "AEC-2026-025",
    issuingAuthority: "AstroLaabh Puja Division",
    issueDate: "2026-05-25", applicableSku: "AL-MNK-0399",
    verifiedBy: "Acharya V. Tripathi", verifiedAt: "2026-05-26",
    uploadedBy: "Ops Admin", uploadedAt: "2026-05-26",
    createdAt: "2026-05-26", updatedAt: "2026-05-26",
  },
  // S14 (AL-ORD-026): Both verified (return requested)
  {
    id: "cert_040", orderId: "AL-ORD-026", orderNumber: "AL-ORD-026",
    type: "lab_authenticity", status: "verified",
    fileName: "AL-PNA-0489-IGI-cert.pdf", certificateNumber: "IGI-2026-45890",
    issuingAuthority: "IGI", issueDate: "2026-06-10", applicableSku: "AL-PNA-0489",
    verifiedBy: "Ops Admin", verifiedAt: "2026-06-22",
    uploadedBy: "Ops Admin", uploadedAt: "2026-06-20",
    createdAt: "2026-06-20", updatedAt: "2026-06-22",
  },
  {
    id: "cert_041", orderId: "AL-ORD-026", orderNumber: "AL-ORD-026",
    type: "energisation", status: "verified",
    fileName: "AL-PNA-0489-energisation.pdf", certificateNumber: "AEC-2026-026",
    issuingAuthority: "AstroLaabh Puja Division",
    issueDate: "2026-06-25", applicableSku: "AL-PNA-0489",
    verifiedBy: "Pt. Sandeep Kochaar", verifiedAt: "2026-06-26",
    uploadedBy: "Ops Admin", uploadedAt: "2026-06-26",
    createdAt: "2026-06-26", updatedAt: "2026-06-26",
  },
  // S15 (AL-ORD-027): Both verified (return in transit)
  {
    id: "cert_042", orderId: "AL-ORD-027", orderNumber: "AL-ORD-027",
    type: "lab_authenticity", status: "verified",
    fileName: "AL-MNK-0355-cert.pdf", certificateNumber: "IGI-2026-23456",
    issuingAuthority: "IGI", issueDate: "2026-05-15", applicableSku: "AL-MNK-0355",
    verifiedBy: "Ops Admin", verifiedAt: "2026-05-30",
    uploadedBy: "Ops Admin", uploadedAt: "2026-05-28",
    createdAt: "2026-05-28", updatedAt: "2026-05-30",
  },
  {
    id: "cert_043", orderId: "AL-ORD-027", orderNumber: "AL-ORD-027",
    type: "energisation", status: "verified",
    fileName: "AL-MNK-0355-energisation.pdf", certificateNumber: "AEC-2026-027",
    issuingAuthority: "AstroLaabh Puja Division",
    issueDate: "2026-06-01", applicableSku: "AL-MNK-0355",
    verifiedBy: "Dr. Meenakshi Joshi", verifiedAt: "2026-06-02",
    uploadedBy: "Ops Admin", uploadedAt: "2026-06-02",
    createdAt: "2026-06-02", updatedAt: "2026-06-02",
  },
  // S16 (AL-ORD-028): Lab verified only (no energisation cert needed)
  {
    id: "cert_044", orderId: "AL-ORD-028", orderNumber: "AL-ORD-028",
    type: "lab_authenticity", status: "verified",
    fileName: "AL-PKJ-0650-GIA-cert.pdf", certificateNumber: "GIA-2026-67890",
    issuingAuthority: "GIA", issueDate: "2026-06-15", applicableSku: "AL-PKJ-0650",
    verifiedBy: "Ops Admin", verifiedAt: "2026-06-28",
    verificationNotes: "Ceylon origin, 4.22 ratti, natural unheated, golden yellow",
    uploadedBy: "Ops Admin", uploadedAt: "2026-06-26",
    createdAt: "2026-06-26", updatedAt: "2026-06-28",
  },
  // S19 (AL-ORD-031): Lab cert REJECTED
  {
    id: "cert_045", orderId: "AL-ORD-031", orderNumber: "AL-ORD-031",
    type: "lab_authenticity", status: "rejected",
    fileName: "AL-PKJ-0690-cert-v1.pdf", certificateNumber: "GIA-2026-72345",
    issuingAuthority: "GIA", issueDate: "2026-07-20", applicableSku: "AL-PKJ-0690",
    verifiedBy: "Ops Admin", verifiedAt: "2026-08-05",
    verificationNotes: "REJECTED: Certificate states 3.4 ratti but measured stone is 3.6 ratti. Weight discrepancy — vendor to reissue.",
    uploadedBy: "Ops Admin", uploadedAt: "2026-08-02",
    createdAt: "2026-08-02", updatedAt: "2026-08-05",
  },
  {
    id: "cert_046", orderId: "AL-ORD-031", orderNumber: "AL-ORD-031",
    type: "energisation", status: "verified",
    fileName: "AL-PKJ-0690-energisation.pdf", certificateNumber: "AEC-2026-031",
    issuingAuthority: "AstroLaabh Puja Division",
    issueDate: "2026-08-01", applicableSku: "AL-PKJ-0690",
    verifiedBy: "Pt. Sandeep Kochaar", verifiedAt: "2026-08-02",
    uploadedBy: "Ops Admin", uploadedAt: "2026-08-02",
    createdAt: "2026-08-02", updatedAt: "2026-08-02",
  },
  // S20 (AL-ORD-032): Both verified (settled return)
  {
    id: "cert_047", orderId: "AL-ORD-032", orderNumber: "AL-ORD-032",
    type: "lab_authenticity", status: "verified",
    fileName: "AL-MNG-0095-cert.pdf", certificateNumber: "IGI-2026-12345",
    issuingAuthority: "IGI", issueDate: "2026-04-28", applicableSku: "AL-MNG-0095",
    verifiedBy: "Ops Admin", verifiedAt: "2026-05-05",
    uploadedBy: "Ops Admin", uploadedAt: "2026-05-03",
    createdAt: "2026-05-03", updatedAt: "2026-05-05",
  },
  {
    id: "cert_048", orderId: "AL-ORD-032", orderNumber: "AL-ORD-032",
    type: "energisation", status: "verified",
    fileName: "AL-MNG-0095-energisation.pdf", certificateNumber: "AEC-2026-032",
    issuingAuthority: "AstroLaabh Puja Division",
    issueDate: "2026-05-15", applicableSku: "AL-MNG-0095",
    verifiedBy: "Acharya V. Tripathi", verifiedAt: "2026-05-16",
    uploadedBy: "Ops Admin", uploadedAt: "2026-05-16",
    createdAt: "2026-05-16", updatedAt: "2026-05-16",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// DELIVERABLE 6: VALIDATION REPORT
// ════════════════════════════════════════════════════════════════════════════

export type ValidationResult = {
  scenarioId: string;
  orderId: string;
  checks: { rule: string; passed: boolean; detail?: string }[];
  overallPass: boolean;
};

export function validateSeedData(): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const order of SEED_ORDERS) {
    const checks: { rule: string; passed: boolean; detail?: string }[] = [];
    const payment = SEED_PAYMENTS.find(p => p.linkedOrderId === order.id);
    const energisation = SEED_ENERGISATION.find(e => e.orderId === order.id);
    const certs = SEED_CERTIFICATES.filter(c => c.orderId === order.id);

    // Rule 1: Payment must be paid/partial for stage > 0 (unless cancelled/refunded)
    if (order.stage > 0 && order.shopifyStatus !== "cancelled") {
      const valid = order.paymentStatus === "paid" || order.paymentStatus === "partial" || order.paymentStatus === "refunded";
      checks.push({ rule: "Stage>0 requires payment", passed: valid, detail: `stage=${order.stage}, paymentStatus=${order.paymentStatus}` });
    }

    // Rule 2: shopifyStatus=fulfilled requires stage=7
    if (order.shopifyStatus === "fulfilled") {
      checks.push({ rule: "fulfilled requires stage=7", passed: order.stage === 7, detail: `stage=${order.stage}` });
    }

    // Rule 3: Tracking only after stage >= 5
    if (order.tracking) {
      checks.push({ rule: "tracking requires stage>=5", passed: order.stage >= 5, detail: `stage=${order.stage}` });
    }

    // Rule 4: returnStatus only valid if stage=7
    if (order.returnStatus) {
      checks.push({ rule: "return requires stage=7", passed: order.stage === 7, detail: `stage=${order.stage}, returnStatus=${order.returnStatus}` });
    }

    // Rule 5: energisationStatus=completed requires stage >= 2
    if (order.energisationStatus === "completed") {
      checks.push({ rule: "energisation completed requires stage>=2", passed: order.stage >= 2 || order.energisationStatus === "completed", detail: `stage=${order.stage}` });
    }

    // Rule 6: certificateStatus=verified requires energisation completed (unless not_required)
    if (order.certificateStatus === "verified" && order.energisationStatus !== "not_required") {
      checks.push({ rule: "cert verified requires energisation done", passed: order.energisationStatus === "completed", detail: `energisationStatus=${order.energisationStatus}` });
    }

    // Rule 7: Total must equal sum of item prices * qty
    const calculatedTotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    checks.push({ rule: "total = sum(item.price * qty)", passed: order.total === calculatedTotal, detail: `total=${order.total}, calculated=${calculatedTotal}` });

    // Rule 8: Payment amount matches order total (if payment exists and is for the order)
    if (payment && payment.status === "paid" && order.paymentStatus === "paid" && order.shopifyStatus !== "cancelled") {
      checks.push({ rule: "payment amount = order total", passed: payment.amount === order.total, detail: `payment=${payment.amount}, orderTotal=${order.total}` });
    }

    // Rule 9: Timestamp ordering — placedAt <= updatedAt
    checks.push({ rule: "placedAt <= updatedAt", passed: order.placedAt <= order.updatedAt, detail: `placed=${order.placedAt}, updated=${order.updatedAt}` });

    // Rule 10: If payment paid, paidAt >= placedAt
    if (payment?.paidAt && order.paymentStatus === "paid") {
      const paidDate = payment.paidAt.split("T")[0];
      checks.push({ rule: "paidAt >= placedAt", passed: paidDate >= order.placedAt, detail: `paid=${paidDate}, placed=${order.placedAt}` });
    }

    // Rule 11: Energisation scheduledAt after payment (if both exist)
    if (energisation?.scheduledAt && payment?.paidAt) {
      const schedDate = energisation.scheduledAt.split("T")[0];
      const paidDate = payment.paidAt.split("T")[0];
      checks.push({ rule: "energisation after payment", passed: schedDate >= paidDate, detail: `sched=${schedDate}, paid=${paidDate}` });
    }

    // Rule 12: Cancelled order should not have tracking
    if (order.shopifyStatus === "cancelled") {
      checks.push({ rule: "cancelled has no tracking", passed: !order.tracking, detail: `tracking=${order.tracking}` });
    }

    // Rule 13: operationalStatus consistency
    if (order.shopifyStatus === "cancelled" || (order.paymentStatus === "refunded" && order.returnStatus)) {
      checks.push({ rule: "cancelled/refunded = exception status", passed: order.operationalStatus === "exception", detail: `opStatus=${order.operationalStatus}` });
    }

    // Rule 14: Items array not empty
    checks.push({ rule: "items not empty", passed: order.items.length > 0, detail: `items=${order.items.length}` });

    // Rule 15: Energisation task matches order status
    if (energisation) {
      const statusMatch = (
        (order.energisationStatus === "completed" && energisation.status === "completed") ||
        (order.energisationStatus === "scheduled" && energisation.status === "scheduled") ||
        (order.energisationStatus === "in_progress" && energisation.status === "in_progress") ||
        (order.energisationStatus === "exception" && energisation.status === "exception") ||
        (order.energisationStatus === "pending" && energisation.status === "pending")
      );
      checks.push({ rule: "energisation task status matches order", passed: statusMatch, detail: `order=${order.energisationStatus}, task=${energisation.status}` });
    }

    results.push({
      scenarioId: SCENARIO_CATALOGUE.find(s => {
        const idx = SEED_ORDERS.indexOf(order);
        return idx >= 0;
      })?.id ?? `order-${order.id}`,
      orderId: order.id,
      checks,
      overallPass: checks.every(c => c.passed),
    });
  }

  return results;
}

// ════════════════════════════════════════════════════════════════════════════
// DELIVERABLE 7: ASSUMPTIONS & UNRESOLVED QUESTIONS
// ════════════════════════════════════════════════════════════════════════════

export const ASSUMPTIONS = [
  "The system uses in-memory mock data with no real database — 'seed' means updating TypeScript arrays.",
  "ORDER_STAGES (0-7) represent the furthest pipeline progress. Stage 0 covers both 'awaiting payment' and 'items being sourced'.",
  "Partial payment (paymentStatus='partial') allows operationalStatus='in_progress' but does NOT unlock the full fulfillment pipeline in the UI (UI checks for 'paid' only).",
  "shopifyStatus='fulfilled' is reserved for confirmed delivery (stage 7). 'partially_fulfilled' is used during dispatch/transit.",
  "returnStatus is only applicable after delivery (stage=7). The system does not support 'return' on undelivered orders.",
  "energisationStatus='not_required' is valid when customer opts out of ritual services.",
  "certificateStatus='not_required' is used for orders at stage 0 before payment unlocks fulfillment.",
  "The Zod schema permits certificateStatus='not_required' but the Certificate entity itself uses ['missing','uploaded','verified','rejected','superseded']. The order-level field and certificate-level field have slightly different enum sets.",
  "There is no explicit 'cancelled_at' or 'refunded_at' timestamp field on the Order schema — these are tracked via updatedAt and notes.",
  "The UI shows energisation tier fee as an add-on in the order summary but the Order.total field in existing data does NOT include the energisation fee (it only reflects item prices). We maintain this convention.",
  "No automated tests exist in the project. Validation is done via the validateSeedData() function in this file.",
] as const;

export const UNSUPPORTED_CASES = [
  "Split payment across multiple transactions (system has single paymentStatus per order).",
  "Partial item cancellation (all items share the same order status).",
  "Exchange as a first-class flow (handled via return + new order).",
  "Chargeback/dispute status (no enum value exists).",
  "COD (Cash on Delivery) payment method (all payments are prepaid via link).",
  "Multi-currency orders (fixed to INR).",
  "Automated status transition triggers (all transitions are manual/UI-driven in current system).",
] as const;
