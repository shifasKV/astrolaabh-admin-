"use client";
import { use, useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, StatCard, Chip, GoldBtn, GhostBtn, Modal, Input, Tabs, Pagination, BackLink, SearchFilter, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES, MOCK_REFERRAL_EVENTS, MOCK_PAYOUTS, MOCK_ORDERS, MOCK_CONSULTATIONS, MOCK_CUSTOMERS } from "@/lib/mock";
import { inr } from "@/lib/types";

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

  const editForm = {
    phone: "+91 98765 43210",
    bankName: "HDFC Bank",
    accountNumber: "1234 5678 6789",
    ifsc: "HDFC0001234",
    upi: `${affiliate?.name.split(" ").pop()?.toLowerCase()}@upi`,
  };
  const [payoutForm, setPayoutForm] = useState({ amount: "", notes: "" });
  const [specificRates] = useState({ stone: "5", jewellery: "4", consultation: "10" });

  const [dataTab, setDataTab] = useState("purchases");
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

  const referredCustomers = useMemo(() => MOCK_CUSTOMERS.filter((c) => c.affiliateCode === affiliate.code), [affiliate.code]);
  const referredCustomerIds = useMemo(() => new Set(referredCustomers.map((c) => c.id)), [referredCustomers]);

  const allOrders = useMemo(() => MOCK_ORDERS.filter((o) => referredCustomerIds.has(o.customerId)), [referredCustomerIds]);
  const allConsultations = useMemo(() => MOCK_CONSULTATIONS.filter((c) => referredCustomerIds.has(c.customerId)), [referredCustomerIds]);
  const payouts = MOCK_PAYOUTS.filter((p) => p.affiliateId === affiliate.id);

  const commissionRate = affiliate.commissionRate / 100;
  const totalOrderCommission = allOrders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + Math.round(o.total * commissionRate), 0);
  const totalConsultationCommission = allConsultations.filter((c) => c.paymentStatus === "paid").reduce((sum, c) => sum + Math.round(c.fee * commissionRate), 0);
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
      <div className="mb-5">
        <BackLink label="Affiliates" href="/affiliates" />
      </div>

      {/* Profile + Commission + Account — combined card */}
      <div className="rounded-[14px] p-6 mb-6" style={{ background: `linear-gradient(135deg, ${T.card} 0%, ${T.panel} 100%)`, border: `1px solid ${T.border}` }}>
        {/* Affiliate info + 3-dot menu */}
        <div className="flex flex-wrap items-start gap-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-bold shrink-0" style={{ background: `${T.accent}15`, border: `2px solid ${T.accent}40`, color: T.accent }}>{affiliate.name[0]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-[17px] font-semibold" style={{ color: T.text }}>{affiliate.name}</span>
              <Chip tone={isActive ? "good" : "danger"}>{isActive ? "active" : "inactive"}</Chip>
            </div>
            <div className="text-[13.5px] mt-1" style={{ color: T.accent }}>{affiliate.code}</div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-[12px]" style={{ color: T.faint }}>
              <span>{affiliate.email}</span><span>·</span><span>{editForm.phone}</span><span>·</span><span>Joined {affiliate.joinedAt}</span>
            </div>
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button type="button" onClick={() => setShowMenu((v) => !v)} className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-colors hover:bg-[rgba(89,82,54,0.08)] cursor-pointer" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-[10px] overflow-hidden shadow-lg py-1 min-w-[190px]" style={{ background: T.popover, border: `1px solid ${T.border}` }}>
                <button type="button" onClick={() => { setShowMenu(false); router.push(`/affiliates/create?edit=${id}`); }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(160,125,56,0.08)] cursor-pointer" style={{ color: T.text }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>
                  Edit details
                </button>
                <button type="button" onClick={() => { setShowMenu(false); setShowPayoutModal(true); }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(160,125,56,0.08)] cursor-pointer" style={{ color: T.text }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M6 6h9a3 3 0 0 1 0 6H5M7 12h8a3 3 0 0 1 0 6H6"/></svg>
                  Make payout
                </button>
                <div className="mx-2 my-1" style={{ borderTop: `1px solid ${T.borderSoft}` }} />
                <button type="button" onClick={() => { setShowMenu(false); setIsActive((v) => !v); flash(isActive ? "Affiliate deactivated" : "Affiliate activated"); }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(160,125,56,0.08)] cursor-pointer" style={{ color: isActive ? T.danger : T.good }}>
                  {isActive ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>Deactivate</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>Activate</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Commission rates */}
        <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] tracking-[0.08em] uppercase font-medium" style={{ color: T.faint }}>Commission rates</span>
            <GhostBtn className="!h-7 !px-3 !text-[11px]" onClick={() => router.push(`/affiliates/create?edit=${id}&scrollTo=commission`)}>Edit rates</GhostBtn>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(["stone", "jewellery", "consultation"] as const).map((cat) => (
              <div key={cat} className="rounded-[10px] p-3" style={{ background: "rgba(250,246,236,0.6)", border: `1px solid ${T.borderSoft}` }}>
                <div className="text-[10px] tracking-[0.06em] uppercase mb-1" style={{ color: T.faint }}>{cat}</div>
                <div className="text-[16px] font-semibold tabular-nums" style={{ color: T.text }}>{specificRates[cat]}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bank details */}
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div><div className="text-[10px] uppercase tracking-wider" style={{ color: T.faint }}>Bank</div><div className="text-[13px] mt-0.5" style={{ color: T.text }}>{editForm.bankName}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider" style={{ color: T.faint }}>Account</div><div className="text-[13px] mt-0.5" style={{ color: T.text }}>{editForm.accountNumber}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider" style={{ color: T.faint }}>IFSC</div><div className="text-[13px] mt-0.5" style={{ color: T.text }}>{editForm.ifsc}</div></div>
            <div><div className="text-[10px] uppercase tracking-wider" style={{ color: T.faint }}>UPI</div><div className="text-[13px] mt-0.5" style={{ color: T.accent }}>{editForm.upi}</div></div>
          </div>
        </div>
      </div>

      {/* KPIs — header / value / status */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Purchases", value: allOrders.length, status: "completed", tone: T.good },
          { label: "Consultations", value: allConsultations.length, status: "completed", tone: T.good },
          { label: "Registrations", value: referredCustomers.length, status: "referred", tone: T.good },
          { label: "Commission", value: inr(commissionDue), status: "due", tone: commissionDue > 0 ? T.accent : T.good },
          { label: "Commission", value: inr(totalCommission), status: "earned", tone: T.good },
        ].map((stat, i) => (
          <div key={i} className="rounded-[12px] p-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>{stat.label}</div>
            <div className="text-[20px] font-semibold mt-1 tabular-nums" style={{ color: T.text }}>{stat.value}</div>
            <div className="text-[11px] font-medium mt-1" style={{ color: stat.tone }}>{stat.status}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={[
            { key: "purchases", label: "Purchases", count: allOrders.length },
            { key: "consultations", label: "Consultations", count: allConsultations.length },
            { key: "registrations", label: "Registrations", count: referredCustomers.length },
            { key: "payments", label: "Payments", count: payouts.length },
          ]}
          active={dataTab}
          onChange={(k) => { setDataTab(k); clearFilters(); }}
        />
      </div>

      {/* Search + Filter + Sort */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="flex-1 min-w-[200px] max-w-[400px]">
          <SearchFilter search={search} onSearchChange={(v) => { setSearch(v); resetPages(); }} placeholder={dataTab === "purchases" ? "Search order, customer, stone…" : dataTab === "consultations" ? "Search customer, expert…" : dataTab === "registrations" ? "Search customer name, email…" : "Search period, reference…"} />
        </div>
        {(dataTab === "purchases" || dataTab === "consultations") && (
          <div className="w-[170px]">
            <Select value={customerFilter} onChange={(v) => { setCustomerFilter(v); resetPages(); }} compact placeholder="All customers" options={[{ value: "", label: "All customers" }, ...uniqueCustomerNames.map((n) => ({ value: n, label: n }))]} />
          </div>
        )}
        {dataTab === "purchases" && (
          <>
            <div className="w-[150px]">
              <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); resetPages(); }} compact placeholder="All status" options={[{ value: "", label: "All status" }, { value: "paid", label: "Paid" }, { value: "pending", label: "Payment pending" }, { value: "completed", label: "Completed" }, { value: "in_progress", label: "In progress" }]} />
            </div>
            <div className="w-[160px]">
              <Select value={stoneFilter} onChange={(v) => { setStoneFilter(v); resetPages(); }} compact placeholder="All stones" options={[{ value: "", label: "All stones" }, ...uniqueStones.map((s) => ({ value: s, label: s }))]} />
            </div>
          </>
        )}
        {dataTab === "consultations" && (
          <>
            <div className="w-[150px]">
              <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); resetPages(); }} compact placeholder="All status" options={[{ value: "", label: "All status" }, { value: "scheduled", label: "Scheduled" }, { value: "closed", label: "Done" }, { value: "summary_pending", label: "Recommendation due" }, { value: "no_show", label: "No show" }]} />
            </div>
            <div className="w-[180px]">
              <Select value={expertFilter} onChange={(v) => { setExpertFilter(v); resetPages(); }} compact placeholder="All experts" options={[{ value: "", label: "All experts" }, ...uniqueExperts.map((e) => ({ value: e, label: e }))]} />
            </div>
          </>
        )}
        {dataTab === "payments" && (
          <div className="w-[150px]">
            <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); resetPages(); }} compact placeholder="All status" options={[{ value: "", label: "All status" }, { value: "paid", label: "Paid" }, { value: "pending", label: "Pending" }, { value: "processing", label: "Processing" }]} />
          </div>
        )}
        <div className="ml-auto w-[160px]">
          <Select value={sortOrder} onChange={(v) => { setSortOrder(v as "newest" | "oldest"); resetPages(); }} compact prefix="Sort: " options={[{ value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }]} />
        </div>
      </div>

      {/* ===== PURCHASES TAB ===== */}
      {dataTab === "purchases" && (
        <Card>
          <div className="hidden sm:grid grid-cols-[minmax(120px,1fr)_1fr_120px_120px_100px_110px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
            <span>Order</span><span>Customer</span><span className="text-right">Amount</span><span className="text-right">Commission</span><span>Status</span><span>Date</span>
          </div>
          {purchasesData.paged.length === 0 && <div className="text-center py-8 text-[13px]" style={{ color: T.muted }}>No purchases found.</div>}
          {purchasesData.paged.map((o) => {
            const st = orderStatusLabel(o);
            const comm = o.paymentStatus === "paid" ? Math.round(o.total * commissionRate) : 0;
            return (
              <Link key={o.id} href={`/orders/${o.id}`} className="grid grid-cols-1 sm:grid-cols-[minmax(120px,1fr)_1fr_120px_120px_100px_110px] gap-3 items-center px-3 py-3 transition-all rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
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
          {filteredOrders.length > PER_PAGE && <div className="mt-4"><Pagination page={purchasesPage} totalPages={purchasesData.totalPages} onPageChange={setPurchasesPage} perPage={PER_PAGE} totalItems={purchasesData.total} /></div>}
        </Card>
      )}

      {/* ===== CONSULTATIONS TAB ===== */}
      {dataTab === "consultations" && (
        <Card>
          <div className="hidden sm:grid grid-cols-[minmax(100px,1fr)_1fr_1fr_100px_120px_110px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
            <span>Consultation</span><span>Customer</span><span>Expert</span><span className="text-right">Commission</span><span>Status</span><span>Date</span>
          </div>
          {consultationsData.paged.length === 0 && <div className="text-center py-8 text-[13px]" style={{ color: T.muted }}>No consultations found.</div>}
          {consultationsData.paged.map((c) => {
            const st = consStatusLabel(c.status);
            const comm = c.paymentStatus === "paid" ? Math.round(c.fee * commissionRate) : 0;
            return (
              <Link key={c.id} href={`/consultations/${c.id}`} className="grid grid-cols-1 sm:grid-cols-[minmax(100px,1fr)_1fr_1fr_100px_120px_110px] gap-3 items-center px-3 py-3 transition-all rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <div className="min-w-0">
                  <div className="text-[11px] tracking-[0.06em] uppercase font-medium" style={{ color: T.accent }}>{c.id}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{inr(c.fee)}</div>
                </div>
                <div className="text-[13px] truncate" style={{ color: T.text }}>{c.customerName}</div>
                <div className="text-[13px] truncate" style={{ color: T.muted }}>{c.expertName}</div>
                <div className="text-[13px] text-right tabular-nums" style={{ color: comm > 0 ? T.accent : T.faint }}>{comm > 0 ? inr(comm) : "—"}</div>
                <div><Chip tone={st.tone}>{st.label}</Chip></div>
                <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>{fmtDate(c.scheduledAt)}</div>
              </Link>
            );
          })}
          {filteredConsultations.length > PER_PAGE && <div className="mt-4"><Pagination page={consultationsPage} totalPages={consultationsData.totalPages} onPageChange={setConsultationsPage} perPage={PER_PAGE} totalItems={consultationsData.total} /></div>}
        </Card>
      )}

      {/* ===== REGISTRATIONS TAB ===== */}
      {dataTab === "registrations" && (
        <Card>
          <div className="hidden sm:grid grid-cols-[1fr_1fr_140px_140px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
            <span>Customer</span><span>Email</span><span>Phone</span><span>Registered</span>
          </div>
          {registrationsData.paged.length === 0 && <div className="text-center py-8 text-[13px]" style={{ color: T.muted }}>No registrations found.</div>}
          {registrationsData.paged.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_140px_140px] gap-3 items-center px-3 py-3 transition-all rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="text-[13px] font-medium" style={{ color: T.text }}>{c.name}</div>
              <div className="text-[12px] truncate" style={{ color: T.muted }}>{c.email}</div>
              <div className="text-[12px]" style={{ color: T.muted }}>{c.phone}</div>
              <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>{fmtDate(c.createdAt)}</div>
            </Link>
          ))}
          {filteredRegistrations.length > PER_PAGE && <div className="mt-4"><Pagination page={registrationsPage} totalPages={registrationsData.totalPages} onPageChange={setRegistrationsPage} perPage={PER_PAGE} totalItems={registrationsData.total} /></div>}
        </Card>
      )}

      {/* ===== PAYMENTS TAB ===== */}
      {dataTab === "payments" && (
        <Card>
          <div className="hidden sm:grid grid-cols-[1fr_140px_140px_100px_120px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
            <span>Period</span><span>Reference</span><span>Date</span><span>Status</span><span className="text-right">Amount</span>
          </div>
          {payoutsData.paged.length === 0 && <div className="text-center py-8 text-[13px]" style={{ color: T.muted }}>No payouts found.</div>}
          {payoutsData.paged.map((p) => (
            <div key={p.id} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_140px_100px_120px] gap-3 items-center px-3 py-2.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="text-[13px] font-medium" style={{ color: T.text }}>{p.period}</div>
              <div className="text-[12px]" style={{ color: T.muted }}>{p.reference}</div>
              <div className="text-[12px]" style={{ color: T.muted }}>{p.paidAt ?? "—"}</div>
              <div><Chip tone={p.status === "paid" ? "good" : "gold"}>{p.status}</Chip></div>
              <div className="text-[13px] text-right font-semibold tabular-nums" style={{ color: T.text }}>{inr(p.amount)}</div>
            </div>
          ))}
          {filteredPayouts.length > PER_PAGE && <div className="mt-4"><Pagination page={payoutsPage} totalPages={payoutsData.totalPages} onPageChange={setPayoutsPage} perPage={PER_PAGE} totalItems={payoutsData.total} /></div>}
        </Card>
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

      {toast && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium animate-in" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
