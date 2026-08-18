"use client";
import { use, useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, StatCard, Chip, GoldBtn, GhostBtn, DangerBtn, Modal, Input, Textarea, Tabs, Pagination, BackLink, Select, ToolbarSearch, FiltersPopover, FilterField, FilterChip, Toast, ConfirmDialog } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES, MOCK_REFERRAL_EVENTS, MOCK_PAYOUTS, MOCK_ORDERS, MOCK_CONSULTATIONS, MOCK_CUSTOMERS } from "@/lib/mock";
import { inr } from "@/lib/types";

/* ─── Review UI for pending affiliates — single page, approve / reject with feedback ─── */
function ReviewRow({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>{k}</div>
      <div className="text-[13px] font-medium break-words" style={{ color: T.text }}>{v}</div>
    </div>
  );
}

function AffiliateReviewView({ affiliate }: { affiliate: typeof MOCK_AFFILIATES[number] }) {
  const router = useRouter();
  const [toast, setToast] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [stoneRate, setStoneRate] = useState("5");
  const [jewelleryRate, setJewelleryRate] = useState("4");
  const [consultationRate, setConsultationRate] = useState("10");
  const [stoneDiscount, setStoneDiscount] = useState("3");
  const [jewelleryDiscount, setJewelleryDiscount] = useState("2");
  const [consultationDiscount, setConsultationDiscount] = useState("5");

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const rejectAffiliate = () => {
    setShowReject(false);
    flash("Application rejected — feedback sent to the applicant");
    setTimeout(() => router.push("/affiliates"), 1800);
  };

  const approveAndCreate = () => {
    flash("Affiliate approved — account created and invite sent");
    setTimeout(() => router.push("/affiliates"), 1800);
  };

  const applicant = {
    name: affiliate.name,
    email: affiliate.email,
    phone: "+91 98765 43210",
    city: "New Delhi",
    appliedAt: affiliate.joinedAt,
    holderName: affiliate.name,
    bankName: "HDFC Bank",
    accountNumber: "50100123456789",
    ifsc: "HDFC0001234",
    upiId: `${affiliate.name.split(" ").pop()?.toLowerCase()}@upi`,
    panFile: "PAN_Card_Sandeep.pdf",
  };

  const rateInput = (label: string, val: string, setter: (v: string) => void) => (
    <div className="rounded-[12px] p-3.5" style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}` }}>
      <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>{label}</div>
      <div className="flex items-center gap-1.5">
        <input type="number" value={val} onChange={(e) => setter(e.target.value)} className="w-full h-9 px-3 rounded-[8px] text-[13px] font-semibold tabular-nums outline-none" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }} />
        <span className="text-[13px] font-medium shrink-0" style={{ color: T.muted }}>%</span>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-4"><BackLink label="Affiliates" href="/affiliates" /></div>

      {/* Identity header */}
      <Card className="!p-6 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="w-12 h-12 rounded-[15px] flex items-center justify-center text-[17px] font-semibold shrink-0" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>
            {affiliate.name[0]}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[18px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>{affiliate.name}</h1>
              <Chip tone="gold">Pending review</Chip>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12.5px]" style={{ color: T.muted }}>
              <span>{affiliate.email}</span>
              <span style={{ color: T.faint }}>·</span>
              <span>Applied {affiliate.joinedAt}</span>
            </div>
          </div>
        </div>
        <p className="text-[12.5px] mt-4 pt-4 leading-relaxed" style={{ color: T.muted, borderTop: `1px solid ${T.borderSoft}` }}>
          These details were shared by the applicant during onboarding. Review them, set the commission &amp; discount, then approve to create their account — or reject with feedback.
        </p>
      </Card>

      {/* Submitted information — one seamless surface */}
      <Card className="!p-0 overflow-hidden mb-4">
        <div className="p-6">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Personal details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
            <ReviewRow k="Full name" v={applicant.name} />
            <ReviewRow k="Email" v={applicant.email} />
            <ReviewRow k="Phone" v={applicant.phone} />
            <ReviewRow k="City" v={applicant.city} />
            <ReviewRow k="Applied on" v={applicant.appliedAt} />
          </div>
        </div>
        <div className="p-6" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Bank details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
            <ReviewRow k="Account holder" v={applicant.holderName} />
            <ReviewRow k="Bank name" v={applicant.bankName} />
            <ReviewRow k="Account number" v={`••••${applicant.accountNumber.slice(-4)}`} />
            <ReviewRow k="IFSC code" v={applicant.ifsc} />
            <ReviewRow k="UPI ID" v={applicant.upiId} />
          </div>
        </div>
        <div className="p-6" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Documents</h2>
          <div className="flex items-center justify-between gap-3 rounded-[12px] p-3.5" style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}` }}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, color: T.accent }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              </span>
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium truncate" style={{ color: T.text }}>{applicant.panFile}</div>
                <div className="text-[12px]" style={{ color: T.muted }}>PAN Card · uploaded {applicant.appliedAt}</div>
              </div>
            </div>
            <GhostBtn className="!h-8 !px-3.5 !text-[12px]">View</GhostBtn>
          </div>
        </div>
      </Card>

      {/* Configure commission & discount */}
      <Card className="!p-6 mb-4">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Commission &amp; discount</h2>
        <p className="text-[12.5px] mt-1 mb-5" style={{ color: T.muted }}>Set the commission this affiliate earns and the discount their referred customers receive.</p>
        <div className="text-[11px] font-medium tracking-[0.1em] uppercase mb-2.5" style={{ color: T.faint }}>Commission rates</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rateInput("Stone", stoneRate, setStoneRate)}
          {rateInput("Jewellery", jewelleryRate, setJewelleryRate)}
          {rateInput("Consultation", consultationRate, setConsultationRate)}
        </div>
        <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          <div className="text-[11px] font-medium tracking-[0.1em] uppercase mb-2.5" style={{ color: T.faint }}>Customer discount</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {rateInput("Stone", stoneDiscount, setStoneDiscount)}
            {rateInput("Jewellery", jewelleryDiscount, setJewelleryDiscount)}
            {rateInput("Consultation", consultationDiscount, setConsultationDiscount)}
          </div>
          <p className="text-[11.5px] mt-2.5" style={{ color: T.faint }}>Customers referred by this affiliate get this discount on their first purchase.</p>
        </div>
      </Card>

      {/* Sticky decision bar */}
      <div className="sticky bottom-0 -mx-5 md:-mx-10 px-5 md:px-10 py-3.5 flex items-center justify-between gap-3" style={{ background: "rgba(248,245,238,0.9)", backdropFilter: "blur(6px)", borderTop: `1px solid ${T.borderSoft}` }}>
        <span className="text-[12px] hidden sm:block" style={{ color: T.faint }}>Approving creates their account and sends an invite link.</span>
        <div className="flex items-center gap-2.5 ml-auto">
          <button onClick={() => setShowReject(true)} className="h-10 px-5 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer hover:bg-[rgba(163,73,63,0.06)]" style={{ border: `1px solid rgba(163,73,63,0.3)`, color: T.danger }}>Reject</button>
          <GoldBtn onClick={approveAndCreate}>Approve &amp; create account</GoldBtn>
        </div>
      </div>

      {/* Reject with feedback */}
      <Modal open={showReject} onClose={() => setShowReject(false)} title="Reject application">
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed" style={{ color: T.muted }}>
            Share why <span className="font-medium" style={{ color: T.text }}>{affiliate.name}</span>&apos;s application is being rejected. This feedback is emailed to them so they can correct and re-apply.
          </p>
          <Textarea value={rejectReason} onChange={setRejectReason} label="Reason / feedback" placeholder="e.g. The PAN document is blurry — please re-upload a clear copy." rows={4} />
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <GhostBtn onClick={() => setShowReject(false)}>Cancel</GhostBtn>
            <DangerBtn onClick={rejectAffiliate} disabled={!rejectReason.trim()}>Reject application</DangerBtn>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} />}
    </>
  );
}

const PER_PAGE = 5;

export default function AffiliateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const affiliate = MOCK_AFFILIATES.find((a) => a.id === id);

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [isActive, setIsActive] = useState(affiliate?.status === "active");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const editForm = {
    phone: "+91 98765 43210",
    bankName: "HDFC Bank",
    accountNumber: "1234 5678 6789",
    ifsc: "HDFC0001234",
    upi: `${affiliate?.name.split(" ").pop()?.toLowerCase()}@upi`,
  };
  const [payoutForm, setPayoutForm] = useState({ amount: "", notes: "" });
  const [specificRates] = useState({ stone: "5", jewellery: "4", consultation: "10" });

  const [dataTab, setDataTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [stoneFilter, setStoneFilter] = useState("");
  const [expertFilter, setExpertFilter] = useState("");
  const [purchasesPage, setPurchasesPage] = useState(0);
  const [consultationsPage, setConsultationsPage] = useState(0);
  const [registrationsPage, setRegistrationsPage] = useState(0);
  const [payoutsPage, setPayoutsPage] = useState(0);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  if (!affiliate) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Affiliate not found.</p>
        <div className="mt-3 flex justify-center"><BackLink label="Affiliates" href="/affiliates" /></div>
      </div>
    );
  }

  if (affiliate.status === "under_review") {
    return <AffiliateReviewView affiliate={affiliate} />;
  }

  const referredCustomers = useMemo(() => MOCK_CUSTOMERS.filter((c) => c.affiliateCode === affiliate.code), [affiliate.code]);
  const referredCustomerIds = useMemo(() => new Set(referredCustomers.map((c) => c.id)), [referredCustomers]);

  const allOrders = useMemo(() => MOCK_ORDERS.filter((o) => referredCustomerIds.has(o.customerId)), [referredCustomerIds]);
  const allConsultations = useMemo(() => MOCK_CONSULTATIONS.filter((c) => referredCustomerIds.has(c.customerId)), [referredCustomerIds]);
  const payouts = MOCK_PAYOUTS.filter((p) => p.affiliateId === affiliate.id);

  const commissionRate = affiliate.commissionRate / 100;
  const totalOrderCommission = allOrders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + Math.round(o.total * commissionRate), 0);
  const totalConsultationCommission = allConsultations.filter((c) => c.paymentStatus === "paid").reduce((sum, c) => sum + Math.round((c.fee ?? 0) * commissionRate), 0);
  const totalCommission = totalOrderCommission + totalConsultationCommission;
  const totalPaid = payouts.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const commissionDue = Math.max(0, totalCommission - totalPaid);

  const uniqueCustomerNames = [...new Set(referredCustomers.map((c) => c.name))].sort();
  const uniqueStones = [...new Set(allOrders.flatMap((o) => o.items.map((i) => i.gemstone ?? i.name)))].sort();
  const uniqueExperts = [...new Set(allConsultations.map((c) => c.expertName))].sort();

  const searchQ = search.toLowerCase();

  const filteredOrders = useMemo(() => {
    let items = allOrders;
    if (search) items = items.filter((o) => o.customerName.toLowerCase().includes(searchQ) || o.id.toLowerCase().includes(searchQ) || o.items.some((i) => i.name.toLowerCase().includes(searchQ)));
    if (statusFilter) items = items.filter((o) => o.paymentStatus === statusFilter || o.operationalStatus === statusFilter);
    if (customerFilter) items = items.filter((o) => o.customerName === customerFilter);
    if (stoneFilter) items = items.filter((o) => o.items.some((i) => (i.gemstone ?? i.name) === stoneFilter));
    return [...items].sort((a, b) => sortOrder === "newest" ? (b.placedAt ?? "").localeCompare(a.placedAt ?? "") : (a.placedAt ?? "").localeCompare(b.placedAt ?? ""));
  }, [allOrders, search, statusFilter, customerFilter, stoneFilter, sortOrder]);

  const filteredConsultations = useMemo(() => {
    let items = allConsultations;
    if (search) items = items.filter((c) => c.customerName.toLowerCase().includes(searchQ) || c.id.toLowerCase().includes(searchQ) || c.expertName.toLowerCase().includes(searchQ));
    if (statusFilter) items = items.filter((c) => c.status === statusFilter);
    if (customerFilter) items = items.filter((c) => c.customerName === customerFilter);
    if (expertFilter) items = items.filter((c) => c.expertName === expertFilter);
    return [...items].sort((a, b) => sortOrder === "newest" ? b.scheduledAt.localeCompare(a.scheduledAt) : a.scheduledAt.localeCompare(b.scheduledAt));
  }, [allConsultations, search, statusFilter, customerFilter, expertFilter, sortOrder]);

  const filteredRegistrations = useMemo(() => {
    let items = referredCustomers;
    if (search) items = items.filter((c) => c.name.toLowerCase().includes(searchQ) || c.email.toLowerCase().includes(searchQ));
    return [...items].sort((a, b) => sortOrder === "newest" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt));
  }, [referredCustomers, search, sortOrder]);

  const filteredPayouts = useMemo(() => {
    let items = payouts;
    if (search) items = items.filter((p) => p.period.toLowerCase().includes(searchQ) || (p.reference ?? "").toLowerCase().includes(searchQ));
    if (statusFilter) items = items.filter((p) => p.status === statusFilter);
    return [...items].sort((a, b) => sortOrder === "newest" ? (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt) : (a.paidAt ?? a.createdAt).localeCompare(b.paidAt ?? b.createdAt));
  }, [payouts, search, statusFilter, sortOrder]);

  const paginate = <T,>(items: T[], page: number) => ({
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / PER_PAGE)),
    paged: items.slice(page * PER_PAGE, (page + 1) * PER_PAGE),
  });

  const purchasesData = paginate(filteredOrders, purchasesPage);
  const consultationsData = paginate(filteredConsultations, consultationsPage);
  const registrationsData = paginate(filteredRegistrations, registrationsPage);
  const payoutsData = paginate(filteredPayouts, payoutsPage);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const resetPages = () => { setPurchasesPage(0); setConsultationsPage(0); setRegistrationsPage(0); setPayoutsPage(0); };
  const clearFilters = () => { setSearch(""); setStatusFilter(""); setCustomerFilter(""); setStoneFilter(""); setExpertFilter(""); resetPages(); };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ (\d{4})$/, ", $1");

  const orderStatusLabel = (o: typeof allOrders[0]) => {
    if (o.operationalStatus === "completed") return { label: "Completed", tone: "good" as const };
    if (o.paymentStatus === "pending") return { label: "Payment pending", tone: "gold" as const };
    return { label: "In progress", tone: "muted" as const };
  };

  const consStatusLabel = (s: string) => {
    if (s === "closed" || s === "completed") return { label: "Done", tone: "good" as const };
    if (s === "scheduled") return { label: "Scheduled", tone: "gold" as const };
    if (s === "summary_pending") return { label: "Recommendation due", tone: "danger" as const };
    if (s === "no_show") return { label: "No show", tone: "danger" as const };
    if (s === "reschedule_requested") return { label: "Scheduled", tone: "gold" as const };
    if (s === "cancelled") return { label: "Cancelled", tone: "muted" as const };
    return { label: s.replace(/_/g, " "), tone: "muted" as const };
  };

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <div className="mb-4">
        <BackLink label="Affiliates" href="/affiliates" />
      </div>

      {/* Identity */}
      <Card className="!p-6 mb-4">
        <div className="flex flex-wrap items-start gap-5">
          <div
            className="w-14 h-14 rounded-[16px] flex items-center justify-center text-[18px] font-semibold shrink-0"
            style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
          >
            {affiliate.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[18px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>{affiliate.name}</span>
              <Chip tone={isActive ? "good" : "danger"}>{isActive ? "active" : "inactive"}</Chip>
              <span
                className="text-[11px] font-semibold tracking-[0.06em] uppercase px-2 py-0.5 rounded-[6px]"
                style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
              >
                {affiliate.code}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[12.5px]" style={{ color: T.muted }}>
              <span>{affiliate.email}</span>
              <span style={{ color: T.faint }}>·</span>
              <span className="tabular-nums">{editForm.phone}</span>
              <span style={{ color: T.faint }}>·</span>
              <span>Joined {affiliate.joinedAt}</span>
            </div>
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button type="button" onClick={() => setShowMenu((v) => !v)} className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-colors hover:bg-[rgba(89,82,54,0.08)] cursor-pointer" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-[10px] overflow-hidden shadow-lg py-1 min-w-[190px]" style={{ background: T.popover, border: `1px solid ${T.border}` }}>
                <button type="button" onClick={() => { setShowMenu(false); router.push(`/affiliates/create?edit=${id}`); }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(119,123,98,0.08)] cursor-pointer" style={{ color: T.text }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>
                  Edit details
                </button>
                <button type="button" onClick={() => { setShowMenu(false); setShowPayoutModal(true); }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(119,123,98,0.08)] cursor-pointer" style={{ color: T.text }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M6 6h9a3 3 0 0 1 0 6H5M7 12h8a3 3 0 0 1 0 6H6"/></svg>
                  Make payout
                </button>
                <div className="mx-2 my-1" style={{ borderTop: `1px solid ${T.borderSoft}` }} />
                <button type="button" onClick={() => { setShowMenu(false); if (isActive) { setConfirmDeactivate(true); } else { setIsActive(true); flash("Affiliate activated"); } }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(119,123,98,0.08)] cursor-pointer" style={{ color: isActive ? T.danger : T.good }}>
                  {isActive ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>Deactivate</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>Activate</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={[
            { key: "overview", label: "Overview" },
            { key: "purchases", label: "Purchases", count: allOrders.length },
            { key: "consultations", label: "Consultations", count: allConsultations.length },
            { key: "registrations", label: "Registrations", count: referredCustomers.length },
            { key: "payments", label: "Payments", count: payouts.length },
          ]}
          active={dataTab}
          onChange={(k) => { setDataTab(k); clearFilters(); }}
        />
      </div>

      {/* Toolbar — search + Filters popover + sort (per-tab fields) */}
      {dataTab !== "overview" && (() => {
        const statusOpts = dataTab === "purchases"
          ? [{ value: "paid", label: "Paid" }, { value: "pending", label: "Payment pending" }, { value: "completed", label: "Completed" }, { value: "in_progress", label: "In progress" }]
          : dataTab === "consultations"
            ? [{ value: "scheduled", label: "Scheduled" }, { value: "closed", label: "Done" }, { value: "summary_pending", label: "Recommendation due" }, { value: "no_show", label: "No show" }]
            : dataTab === "payments"
              ? [{ value: "paid", label: "Paid" }, { value: "pending", label: "Pending" }, { value: "processing", label: "Processing" }]
              : [];
        const statusLabel = statusOpts.find((o) => o.value === statusFilter)?.label ?? statusFilter;
        const showCustomer = dataTab === "purchases" || dataTab === "consultations";
        const showStone = dataTab === "purchases";
        const showExpert = dataTab === "consultations";
        const showStatus = statusOpts.length > 0;
        const filterCount = [showCustomer && customerFilter, showStone && stoneFilter, showExpert && expertFilter, showStatus && statusFilter].filter(Boolean).length;
        const hasChips = filterCount > 0;
        return (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <ToolbarSearch
                value={search}
                onChange={(v) => { setSearch(v); resetPages(); }}
                placeholder={dataTab === "purchases" ? "Search order, customer, stone…" : dataTab === "consultations" ? "Search customer, expert…" : dataTab === "registrations" ? "Search customer, email…" : "Search period, reference…"}
              />
              <div className="ml-auto flex items-center gap-2">
                {(showCustomer || showStone || showExpert || showStatus) && (
                  <FiltersPopover count={filterCount} open={showFilters} onToggle={() => setShowFilters(!showFilters)}>
                    {showCustomer && (
                      <FilterField label="Customer">
                        <Select value={customerFilter} onChange={(v) => { setCustomerFilter(v); resetPages(); }} searchable compact placeholder="All customers" options={[{ value: "", label: "All customers" }, ...uniqueCustomerNames.map((n) => ({ value: n, label: n }))]} />
                      </FilterField>
                    )}
                    {showStatus && (
                      <FilterField label="Status">
                        <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); resetPages(); }} compact placeholder="All statuses" options={[{ value: "", label: "All statuses" }, ...statusOpts]} />
                      </FilterField>
                    )}
                    {showStone && (
                      <FilterField label="Stone">
                        <Select value={stoneFilter} onChange={(v) => { setStoneFilter(v); resetPages(); }} searchable compact placeholder="All stones" options={[{ value: "", label: "All stones" }, ...uniqueStones.map((s2) => ({ value: s2, label: s2 }))]} />
                      </FilterField>
                    )}
                    {showExpert && (
                      <FilterField label="Expert">
                        <Select value={expertFilter} onChange={(v) => { setExpertFilter(v); resetPages(); }} searchable compact placeholder="All experts" options={[{ value: "", label: "All experts" }, ...uniqueExperts.map((e) => ({ value: e, label: e }))]} />
                      </FilterField>
                    )}
                  </FiltersPopover>
                )}
                <div className="w-[150px]">
                  <Select value={sortOrder} onChange={(v) => { setSortOrder(v as "newest" | "oldest"); resetPages(); }} compact prefix="Sort: " options={[{ value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }]} />
                </div>
              </div>
            </div>
            {hasChips && (
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {showCustomer && customerFilter && <FilterChip label={`Customer: ${customerFilter}`} onClear={() => { setCustomerFilter(""); resetPages(); }} />}
                {showStatus && statusFilter && <FilterChip label={`Status: ${statusLabel}`} onClear={() => { setStatusFilter(""); resetPages(); }} />}
                {showStone && stoneFilter && <FilterChip label={`Stone: ${stoneFilter}`} onClear={() => { setStoneFilter(""); resetPages(); }} />}
                {showExpert && expertFilter && <FilterChip label={`Expert: ${expertFilter}`} onClear={() => { setExpertFilter(""); resetPages(); }} />}
                <button onClick={() => { setCustomerFilter(""); setStatusFilter(""); setStoneFilter(""); setExpertFilter(""); resetPages(); }} className="text-[12px] px-1.5 cursor-pointer hover:underline underline-offset-4" style={{ color: T.danger }}>Clear all</button>
              </div>
            )}
          </>
        );
      })()}

      {/* ===== OVERVIEW TAB ===== */}
      {dataTab === "overview" && (
        <div className="md:min-h-0 md:overflow-y-auto">
      {/* Rates + payout — two named cards, scannable */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card className="!p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Commission rates</h2>
            <GhostBtn className="!h-7 !px-3 !text-[11px]" onClick={() => router.push(`/affiliates/create?edit=${id}&scrollTo=commission`)}>Edit rates</GhostBtn>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["stone", "jewellery", "consultation"] as const).map((cat) => (
              <div key={cat}>
                <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{cat}</div>
                <div className="font-title text-[22px] font-semibold tabular-nums mt-1" style={{ color: T.text }}>{specificRates[cat]}%</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="!p-6">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Payout account</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              ["Bank", editForm.bankName],
              ["Account", editForm.accountNumber],
              ["IFSC", editForm.ifsc],
              ["UPI", editForm.upi],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{k}</div>
                <div className="text-[13px] font-medium tabular-nums mt-0.5" style={{ color: T.text }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* KPIs — header / value / status */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[
          { label: "Purchases", value: allOrders.length, status: "completed", tone: T.good, hero: false },
          { label: "Consultations", value: allConsultations.length, status: "completed", tone: T.good, hero: false },
          { label: "Registrations", value: referredCustomers.length, status: "referred", tone: T.good, hero: false },
          { label: "Commission due", value: inr(commissionDue), status: commissionDue > 0 ? "awaiting payout" : "all settled", tone: commissionDue > 0 ? "#8a6a2f" : T.good, hero: false },
          { label: "Commission earned", value: inr(totalCommission), status: "lifetime", tone: "#8a6a2f", hero: true },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-[16px] p-5"
            style={
              stat.hero
                ? { background: "linear-gradient(160deg, #faf0d8 0%, #efdfb8 100%)", border: "1px solid rgba(160,125,56,0.35)", boxShadow: T.shadow }
                : { background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }
            }
          >
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: stat.hero ? "#8a6a2f" : T.faint }}>{stat.label}</div>
            <div className="text-[20px] font-semibold mt-1 tabular-nums" style={{ color: T.text }}>{stat.value}</div>
            <div className="text-[11px] font-medium mt-1" style={{ color: stat.tone }}>{stat.status}</div>
          </div>
        ))}
      </div>

        </div>
      )}

      {/* ===== PURCHASES TAB ===== */}
      {dataTab === "purchases" && (
        <>
        <Card className="!p-0 md:flex md:flex-col md:min-h-0">
          <div className="hidden sm:grid grid-cols-[minmax(120px,1fr)_1fr_120px_120px_100px_110px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]" style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.border}` }}>
            <span>Order</span><span>Customer</span><span className="text-right">Amount</span><span className="text-right">Commission</span><span>Status</span><span>Date</span>
          </div>
          {purchasesData.paged.length === 0 && <div className="text-center py-8 text-[13px]" style={{ color: T.muted }}>No purchases found.</div>}
          {purchasesData.paged.map((o) => {
            const st = orderStatusLabel(o);
            const comm = o.paymentStatus === "paid" ? Math.round(o.total * commissionRate) : 0;
            return (
              <Link key={o.id} href={`/orders/${o.id}`} className="grid grid-cols-1 sm:grid-cols-[minmax(120px,1fr)_1fr_120px_120px_100px_110px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)] last:rounded-b-[15px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <div className="min-w-0">
                  <div className="text-[11px] tracking-[0.06em] uppercase font-medium" style={{ color: T.accent }}>{o.id}</div>
                  <div className="text-[12px] mt-0.5 truncate" style={{ color: T.muted }}>{o.items.map((i) => i.name.split("·")[0].trim()).join(", ")}</div>
                </div>
                <div className="text-[13px] truncate" style={{ color: T.text }}>{o.customerName}</div>
                <div className="text-[13px] text-right tabular-nums font-medium" style={{ color: T.text }}>{inr(o.total)}</div>
                <div className="text-[13px] text-right tabular-nums" style={{ color: comm > 0 ? T.accent : T.faint }}>{comm > 0 ? inr(comm) : "—"}</div>
                <div><Chip tone={st.tone}>{st.label}</Chip></div>
                <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>{fmtDate(o.placedAt)}</div>
              </Link>
            );
          })}
          </Card>
        <Pagination page={purchasesPage} totalPages={purchasesData.totalPages} onPageChange={setPurchasesPage} perPage={PER_PAGE} totalItems={purchasesData.total} />
        </>
      )}

      {/* ===== CONSULTATIONS TAB ===== */}
      {dataTab === "consultations" && (
        <>
        <Card className="!p-0 md:flex md:flex-col md:min-h-0">
          <div className="hidden sm:grid grid-cols-[minmax(100px,1fr)_1fr_1fr_100px_120px_110px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]" style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.border}` }}>
            <span>Consultation</span><span>Customer</span><span>Expert</span><span className="text-right">Commission</span><span>Status</span><span>Date</span>
          </div>
          {consultationsData.paged.length === 0 && <div className="text-center py-8 text-[13px]" style={{ color: T.muted }}>No consultations found.</div>}
          {consultationsData.paged.map((c) => {
            const st = consStatusLabel(c.status);
            const comm = c.paymentStatus === "paid" ? Math.round((c.fee ?? 0) * commissionRate) : 0;
            return (
              <Link key={c.id} href={`/consultations/${c.id}`} className="grid grid-cols-1 sm:grid-cols-[minmax(100px,1fr)_1fr_1fr_100px_120px_110px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)] last:rounded-b-[15px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <div className="min-w-0">
                  <div className="text-[11px] tracking-[0.06em] uppercase font-medium" style={{ color: T.accent }}>{c.id}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{inr(c.fee ?? 0)}</div>
                </div>
                <div className="text-[13px] truncate" style={{ color: T.text }}>{c.customerName}</div>
                <div className="text-[13px] truncate" style={{ color: T.muted }}>{c.expertName}</div>
                <div className="text-[13px] text-right tabular-nums" style={{ color: comm > 0 ? T.accent : T.faint }}>{comm > 0 ? inr(comm) : "—"}</div>
                <div><Chip tone={st.tone}>{st.label}</Chip></div>
                <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>{fmtDate(c.scheduledAt)}</div>
              </Link>
            );
          })}
          </Card>
        <Pagination page={consultationsPage} totalPages={consultationsData.totalPages} onPageChange={setConsultationsPage} perPage={PER_PAGE} totalItems={consultationsData.total} />
        </>
      )}

      {/* ===== REGISTRATIONS TAB ===== */}
      {dataTab === "registrations" && (
        <>
        <Card className="!p-0 md:flex md:flex-col md:min-h-0">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_140px_140px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]" style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.border}` }}>
            <span>Customer</span><span>Email</span><span>Phone</span><span>Registered</span>
          </div>
          {registrationsData.paged.length === 0 && <div className="text-center py-8 text-[13px]" style={{ color: T.muted }}>No registrations found.</div>}
          {registrationsData.paged.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_140px_140px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)] last:rounded-b-[15px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="text-[13px] font-medium" style={{ color: T.text }}>{c.name}</div>
              <div className="text-[12px] truncate" style={{ color: T.muted }}>{c.email}</div>
              <div className="text-[12px]" style={{ color: T.muted }}>{c.phone}</div>
              <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>{fmtDate(c.createdAt)}</div>
            </Link>
          ))}
          </Card>
        <Pagination page={registrationsPage} totalPages={registrationsData.totalPages} onPageChange={setRegistrationsPage} perPage={PER_PAGE} totalItems={registrationsData.total} />
        </>
      )}

      {/* ===== PAYMENTS TAB ===== */}
      {dataTab === "payments" && (
        <>
        <Card className="!p-0 md:flex md:flex-col md:min-h-0">
          <div className="hidden sm:grid grid-cols-[1fr_140px_140px_100px_120px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]" style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.border}` }}>
            <span>Period</span><span>Reference</span><span>Date</span><span>Status</span><span className="text-right">Amount</span>
          </div>
          {payoutsData.paged.length === 0 && <div className="text-center py-8 text-[13px]" style={{ color: T.muted }}>No payouts found.</div>}
          {payoutsData.paged.map((p) => (
            <div key={p.id} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_140px_100px_120px] gap-2 sm:gap-3 items-center px-4 py-2.5 even:bg-[rgba(89,82,54,0.025)] last:rounded-b-[15px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="text-[13px] font-medium" style={{ color: T.text }}>{p.period}</div>
              <div className="text-[12px]" style={{ color: T.muted }}>{p.reference}</div>
              <div className="text-[12px]" style={{ color: T.muted }}>{p.paidAt ?? "—"}</div>
              <div><Chip tone={p.status === "paid" ? "good" : "gold"}>{p.status}</Chip></div>
              <div className="text-[13px] text-right font-semibold tabular-nums" style={{ color: T.text }}>{inr(p.amount)}</div>
            </div>
          ))}
        </Card>
        <Pagination page={payoutsPage} totalPages={payoutsData.totalPages} onPageChange={setPayoutsPage} perPage={PER_PAGE} totalItems={payoutsData.total} />
        </>
      )}

      {/* Make Payout Modal */}
      <Modal open={showPayoutModal} onClose={() => setShowPayoutModal(false)} title="Initiate payout">
        <div className="space-y-5">
          <div className="p-4 rounded-[10px]" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13.5px] font-medium" style={{ color: T.text }}>{affiliate.name}</div>
                <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{editForm.upi}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Commission due</div>
                <div className="text-[16px] font-semibold" style={{ color: T.accent }}>{inr(commissionDue)}</div>
              </div>
            </div>
          </div>
          <Input value={payoutForm.amount} onChange={(v) => setPayoutForm((p) => ({ ...p, amount: v }))} label="Payout amount (₹)" placeholder={String(commissionDue)} />
          <Input value={payoutForm.notes} onChange={(v) => setPayoutForm((p) => ({ ...p, notes: v }))} label="Period / notes" placeholder="e.g. May – Jul 2026" />
          <div className="pt-2"><GoldBtn onClick={() => setShowPayoutModal(false)}>Proceed to payment →</GoldBtn></div>
          <p className="text-[11px] text-center" style={{ color: T.faint }}>You will be redirected to the payment gateway to complete the transfer.</p>
        </div>
      </Modal>

      {toast && <Toast message={toast} />}

      <ConfirmDialog
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() => { setIsActive(false); flash("Affiliate deactivated"); }}
        title={`Deactivate ${affiliate.name}?`}
        message="They'll lose portal access until reactivated."
        confirmLabel="Deactivate"
        tone="danger"
      />
      </div>
    </>
  );
}
