"use client";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Chip, StatCard, Tabs, Pagination, BackLink, ToolbarSearch, Toast, ConfirmDialog, InlineFilter, MultiCheck, SortMenu, CopyableContact } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_SALES_MEMBERS, MOCK_INCOMPLETE_ORDERS, MOCK_INCOMPLETE_CONSULTATIONS, MOCK_ORDERS, MOCK_CONSULTATIONS } from "@/lib/mock";
import type { IncompleteOrderStatus, IncompleteConsultationStatus } from "@/lib/mock";
import type { Order, Consultation } from "@/lib/types";
import { inr } from "@/lib/types";

const PAGE_SIZE = 8;
type SortKey = "date_desc" | "date_asc";

const LEAD_TABS = [
  { key: "stone", label: "Stone Leads" },
  { key: "consultation", label: "Consultation Leads" },
  { key: "created_orders", label: "Created Orders" },
  { key: "created_consultations", label: "Created Consultations" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest" },
  { value: "date_asc", label: "Oldest" },
];

const F_ICONS = {
  status: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>,
};

const LEAD_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "follow_up", label: "Follow up" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

const ORDER_STATUS_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Payment pending" },
  { value: "failed", label: "Payment failed" },
  { value: "partial", label: "Partial" },
  { value: "refunded", label: "Refunded" },
];

const CON_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "reschedule_requested", label: "Reschedule request" },
  { value: "summary_pending", label: "Recommendation due" },
  { value: "no_show", label: "No show" },
  { value: "completed", label: "Done" },
  { value: "payment_pending", label: "Payment pending" },
];

const ORDER_REASON_LABEL: Record<string, string> = {
  payment_failed: "Payment failed",
  abandoned_cart: "Abandoned cart",
  payment_expired: "Payment expired",
  card_declined: "Card declined",
  requested_call: "Requested call",
};
const ORDER_REASON_TONE: Record<string, "danger" | "gold" | "muted"> = {
  payment_failed: "danger",
  abandoned_cart: "gold",
  payment_expired: "danger",
  card_declined: "danger",
  requested_call: "gold",
};

const CON_REASON_LABEL: Record<string, string> = {
  slot_check: "Slot check",
  payment_failed: "Payment failed",
  requested_call: "Requested call",
};
const CON_REASON_TONE: Record<string, "danger" | "gold" | "muted"> = {
  slot_check: "gold",
  payment_failed: "danger",
  requested_call: "gold",
};

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow up",
  converted: "Converted",
  lost: "Lost",
};
const STATUS_TONE: Record<string, "gold" | "good" | "muted" | "danger" | "info"> = {
  new: "info",
  contacted: "gold",
  follow_up: "gold",
  converted: "good",
  lost: "muted",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function matchesSalesExec(field: string | undefined, email: string, memberId: string) {
  return field === email || field === memberId;
}

function sortByDate<T>(items: T[], key: SortKey, getDate: (item: T) => string) {
  return [...items].sort((a, b) => {
    const aT = new Date(getDate(a)).getTime();
    const bT = new Date(getDate(b)).getTime();
    return key === "date_asc" ? aT - bT : bT - aT;
  });
}

function orderStatusChip(o: Order) {
  const paid = o.paymentStatus === "paid";
  if (!paid) {
    const tone = o.paymentStatus === "failed" ? "danger" as const : "gold" as const;
    const label = o.paymentStatus === "failed" ? "Payment failed" : "Payment pending";
    return { tone, label };
  }
  if (o.shopifyStatus === "fulfilled") return { tone: "good" as const, label: "Completed" };
  if (o.tracking) return { tone: "info" as const, label: "In transit" };
  return { tone: "muted" as const, label: "In progress" };
}

function consultationStatusChip(c: Consultation) {
  if (c.paymentStatus === "pending") return { tone: "gold" as const, label: "Payment pending" };
  if (c.status === "reschedule_requested") return { tone: "gold" as const, label: "Reschedule request" };
  if (c.status === "summary_pending") return { tone: "danger" as const, label: "Recommendation due" };
  if (c.status === "no_show") return { tone: "danger" as const, label: "No show" };
  if (c.status === "closed" || c.status === "completed") return { tone: "good" as const, label: "Done" };
  if (c.status === "scheduled") return { tone: "info" as const, label: "Scheduled" };
  return { tone: "muted" as const, label: c.status.replace(/_/g, " ") };
}

function matchesConsultationStatus(c: Consultation, status: string) {
  if (status === "payment_pending") return c.paymentStatus === "pending";
  if (status === "completed") return c.status === "closed" || c.status === "completed";
  return c.status === status;
}

function FilterToolbar({
  search,
  onSearch,
  searchPlaceholder,
  statusFilter,
  onStatusFilter,
  statusOptions,
  sort,
  onSort,
  hasActiveFilters,
  onClearAll,
}: {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  statusFilter: string[];
  onStatusFilter: (v: string[]) => void;
  statusOptions: { value: string; label: string }[];
  sort: SortKey;
  onSort: (v: SortKey) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
}) {
  return (
    <div className="hidden sm:flex flex-wrap items-center gap-2 mb-3 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
      <div className="flex flex-wrap items-center gap-2">
        <InlineFilter label="Status" icon={F_ICONS.status} count={statusFilter.length}>
          <MultiCheck options={statusOptions} value={statusFilter} onChange={onStatusFilter} />
        </InlineFilter>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap"
            style={{ color: T.danger }}
          >
            Clear all
          </button>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ToolbarSearch value={search} onChange={onSearch} placeholder={searchPlaceholder} />
        <SortMenu value={sort} onChange={(v) => onSort(v as SortKey)} options={SORT_OPTIONS} />
      </div>
    </div>
  );
}

export default function SalesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const member = MOCK_SALES_MEMBERS.find((m) => m.id === id);

  const [isActive, setIsActive] = useState(member?.status === "active");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("stone");

  const [stoneSearch, setStoneSearch] = useState("");
  const [conSearch, setConSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [createdConSearch, setCreatedConSearch] = useState("");

  const [stonePage, setStonePage] = useState(0);
  const [conPage, setConPage] = useState(0);
  const [orderPage, setOrderPage] = useState(0);
  const [createdConPage, setCreatedConPage] = useState(0);

  const [stoneStatusFilter, setStoneStatusFilter] = useState<string[]>([]);
  const [conStatusFilter, setConStatusFilter] = useState<string[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string[]>([]);
  const [createdConStatusFilter, setCreatedConStatusFilter] = useState<string[]>([]);

  const [stoneSort, setStoneSort] = useState<SortKey>("date_desc");
  const [conSort, setConSort] = useState<SortKey>("date_desc");
  const [orderSort, setOrderSort] = useState<SortKey>("date_desc");
  const [createdConSort, setCreatedConSort] = useState<SortKey>("date_desc");

  const [toast, setToast] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!member) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[14px]" style={{ color: T.muted }}>Sales member not found.</p>
      </div>
    );
  }

  const stoneLeads = MOCK_INCOMPLETE_ORDERS.filter((o) => o.assignedTo === id);
  const consultationLeads = MOCK_INCOMPLETE_CONSULTATIONS.filter((c) => c.assignedTo === id);
  const createdOrders = MOCK_ORDERS.filter((o) => matchesSalesExec(o.placedBy, member.email, member.id));
  const createdConsultations = MOCK_CONSULTATIONS.filter((c) => matchesSalesExec(c.createdBy, member.email, member.id));

  const activeLeads = [...stoneLeads, ...consultationLeads].filter(
    (l) => l.leadStatus === "new" || l.leadStatus === "contacted" || l.leadStatus === "follow_up",
  ).length;
  const converted = [...stoneLeads, ...consultationLeads].filter((l) => l.leadStatus === "converted").length;
  const lost = [...stoneLeads, ...consultationLeads].filter((l) => l.leadStatus === "lost").length;

  const filteredStoneLeads = sortByDate(
    stoneLeads.filter((o) => {
      if (stoneSearch) {
        const q = stoneSearch.toLowerCase();
        if (!o.customerName.toLowerCase().includes(q) && !o.itemName.toLowerCase().includes(q)) return false;
      }
      if (stoneStatusFilter.length > 0 && !stoneStatusFilter.includes(o.leadStatus)) return false;
      return true;
    }),
    stoneSort,
    (o) => o.failedAt,
  );

  const filteredConLeads = sortByDate(
    consultationLeads.filter((c) => {
      if (conSearch) {
        const q = conSearch.toLowerCase();
        if (!c.customerName.toLowerCase().includes(q) && !c.expertName.toLowerCase().includes(q)) return false;
      }
      if (conStatusFilter.length > 0 && !conStatusFilter.includes(c.leadStatus)) return false;
      return true;
    }),
    conSort,
    (c) => c.date,
  );

  const filteredCreatedOrders = sortByDate(
    createdOrders.filter((o) => {
      if (orderSearch) {
        const q = orderSearch.toLowerCase();
        if (!o.customerName.toLowerCase().includes(q) && !o.id.toLowerCase().includes(q)) return false;
      }
      if (orderStatusFilter.length > 0 && !orderStatusFilter.includes(o.paymentStatus)) return false;
      return true;
    }),
    orderSort,
    (o) => o.placedAt,
  );

  const filteredCreatedConsultations = sortByDate(
    createdConsultations.filter((c) => {
      if (createdConSearch) {
        const q = createdConSearch.toLowerCase();
        if (!c.customerName.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false;
      }
      if (createdConStatusFilter.length > 0 && !createdConStatusFilter.some((s) => matchesConsultationStatus(c, s))) return false;
      return true;
    }),
    createdConSort,
    (c) => c.scheduledAt,
  );

  const stoneTotalPages = Math.max(1, Math.ceil(filteredStoneLeads.length / PAGE_SIZE));
  const conTotalPages = Math.max(1, Math.ceil(filteredConLeads.length / PAGE_SIZE));
  const orderTotalPages = Math.max(1, Math.ceil(filteredCreatedOrders.length / PAGE_SIZE));
  const createdConTotalPages = Math.max(1, Math.ceil(filteredCreatedConsultations.length / PAGE_SIZE));

  const pagedStone = filteredStoneLeads.slice(stonePage * PAGE_SIZE, (stonePage + 1) * PAGE_SIZE);
  const pagedCon = filteredConLeads.slice(conPage * PAGE_SIZE, (conPage + 1) * PAGE_SIZE);
  const pagedOrders = filteredCreatedOrders.slice(orderPage * PAGE_SIZE, (orderPage + 1) * PAGE_SIZE);
  const pagedCreatedCons = filteredCreatedConsultations.slice(createdConPage * PAGE_SIZE, (createdConPage + 1) * PAGE_SIZE);

  const handleDeactivate = () => {
    setShowMenu(false);
    if (isActive) {
      setConfirmDeactivate(true);
    } else {
      setIsActive(true);
      setToast("Sales member activated");
      setTimeout(() => setToast(""), 2500);
    }
  };

  const resetPages = () => {
    setStonePage(0);
    setConPage(0);
    setOrderPage(0);
    setCreatedConPage(0);
  };

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <div className="mb-4">
        <BackLink href="/sales" label="Sales" />
      </div>

      {/* Profile card */}
      <Card className="mb-4 !p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span
              className="w-14 h-14 rounded-[16px] flex items-center justify-center text-[18px] font-semibold shrink-0"
              style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
            >
              {member.name[0]}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[18px] font-semibold" style={{ color: T.text }}>{member.name}</h2>
                <Chip tone={isActive ? "good" : "muted"}>{isActive ? "Active" : "Inactive"}</Chip>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[13px]" style={{ color: T.muted }}>
                <CopyableContact type="email" value={member.email} onCopied={(msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); }} />
                <CopyableContact type="phone" value={member.phone} onCopied={(msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); }} />
              </div>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer"
              style={{ border: `1px solid ${T.border}`, color: T.muted }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-48 rounded-[10px] py-1 shadow-lg z-50"
                style={{ background: T.card, border: `1px solid ${T.border}` }}
              >
                <button
                  onClick={() => { router.push(`/sales/create?edit=${id}`); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(119,123,98,0.08)] cursor-pointer"
                  style={{ color: T.text }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                  Edit details
                </button>
                <div style={{ borderTop: `1px solid ${T.borderSoft}`, margin: "2px 0" }} />
                <button
                  onClick={handleDeactivate}
                  className="w-full text-left px-3 py-2 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(119,123,98,0.08)] cursor-pointer"
                  style={{ color: isActive ? T.danger : T.good }}
                >
                  {isActive ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>Deactivate</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Activate</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total leads" value={stoneLeads.length + consultationLeads.length} />
        <StatCard label="Active" value={activeLeads} />
        <StatCard label="Converted" value={converted} />
        <StatCard label="Lost" value={lost} />
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={LEAD_TABS.map((t) => ({
            ...t,
            count: t.key === "stone" ? stoneLeads.length
              : t.key === "consultation" ? consultationLeads.length
              : t.key === "created_orders" ? createdOrders.length
              : createdConsultations.length,
          }))}
          active={activeTab}
          onChange={(k) => { setActiveTab(k); resetPages(); }}
        />
      </div>

      {/* Stone Leads Tab */}
      {activeTab === "stone" && (
        <>
          <FilterToolbar
            search={stoneSearch}
            onSearch={(v) => { setStoneSearch(v); setStonePage(0); }}
            searchPlaceholder="Search customer, item…"
            statusFilter={stoneStatusFilter}
            onStatusFilter={(v) => { setStoneStatusFilter(v); setStonePage(0); }}
            statusOptions={LEAD_STATUS_OPTIONS}
            sort={stoneSort}
            onSort={(v) => { setStoneSort(v); setStonePage(0); }}
            hasActiveFilters={stoneStatusFilter.length > 0}
            onClearAll={() => { setStoneStatusFilter([]); setStonePage(0); }}
          />

          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
            <div
              className="hidden sm:grid grid-cols-[1fr_1fr_110px_130px_110px_110px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
              style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <span>Customer</span>
              <span>Item</span>
              <span>Date</span>
              <span>Reason</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
              {pagedStone.length === 0 && (
                <div className="text-center py-10 text-[13px]" style={{ color: T.muted }}>No stone leads found.</div>
              )}
              {pagedStone.map((o, i, arr) => (
                <Link
                  key={o.id}
                  href={`/orders/incomplete/${o.id}`}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_110px_130px_110px_110px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)] last:rounded-b-[15px]"
                  style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{o.customerName}</div>
                    <div className="text-[11.5px] truncate tabular-nums" style={{ color: T.faint }}>{o.customerPhone}</div>
                  </div>
                  <div className="text-[12.5px] truncate" style={{ color: T.muted }}>{o.itemName}</div>
                  <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>{fmtDate(o.failedAt)}</div>
                  <div><Chip tone={ORDER_REASON_TONE[o.reason] || "muted"}>{ORDER_REASON_LABEL[o.reason] || o.reason}</Chip></div>
                  <div><Chip tone={STATUS_TONE[o.leadStatus] || "muted"}>{STATUS_LABEL[o.leadStatus] || o.leadStatus}</Chip></div>
                  <div className="text-[13px] text-right font-semibold tabular-nums" style={{ color: T.text }}>{inr(o.amount)}</div>
                </Link>
              ))}
            </div>
          </Card>
          <Pagination page={stonePage} totalPages={stoneTotalPages} onPageChange={setStonePage} perPage={PAGE_SIZE} totalItems={filteredStoneLeads.length} />
        </>
      )}

      {/* Consultation Leads Tab */}
      {activeTab === "consultation" && (
        <>
          <FilterToolbar
            search={conSearch}
            onSearch={(v) => { setConSearch(v); setConPage(0); }}
            searchPlaceholder="Search customer, astrologer…"
            statusFilter={conStatusFilter}
            onStatusFilter={(v) => { setConStatusFilter(v); setConPage(0); }}
            statusOptions={LEAD_STATUS_OPTIONS}
            sort={conSort}
            onSort={(v) => { setConSort(v); setConPage(0); }}
            hasActiveFilters={conStatusFilter.length > 0}
            onClearAll={() => { setConStatusFilter([]); setConPage(0); }}
          />

          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
            <div
              className="hidden sm:grid grid-cols-[1fr_1fr_110px_130px_110px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
              style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <span>Customer</span>
              <span>Astrologer</span>
              <span>Date</span>
              <span>Reason</span>
              <span>Status</span>
            </div>
            <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
              {pagedCon.length === 0 && (
                <div className="text-center py-10 text-[13px]" style={{ color: T.muted }}>No consultation leads found.</div>
              )}
              {pagedCon.map((c, i, arr) => (
                <Link
                  key={c.id}
                  href={`/consultations/incomplete/${c.id}`}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_110px_130px_110px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)] last:rounded-b-[15px]"
                  style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{c.customerName}</div>
                    <div className="text-[11.5px] truncate tabular-nums" style={{ color: T.faint }}>{c.customerPhone}</div>
                  </div>
                  <div className="text-[12.5px] truncate" style={{ color: T.muted }}>{c.expertName}</div>
                  <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>{fmtDate(c.date)}</div>
                  <div><Chip tone={CON_REASON_TONE[c.reason] || "muted"}>{CON_REASON_LABEL[c.reason] || c.reason}</Chip></div>
                  <div><Chip tone={STATUS_TONE[c.leadStatus] || "muted"}>{STATUS_LABEL[c.leadStatus] || c.leadStatus}</Chip></div>
                </Link>
              ))}
            </div>
          </Card>
          <Pagination page={conPage} totalPages={conTotalPages} onPageChange={setConPage} perPage={PAGE_SIZE} totalItems={filteredConLeads.length} />
        </>
      )}

      {/* Created Orders Tab */}
      {activeTab === "created_orders" && (
        <>
          <FilterToolbar
            search={orderSearch}
            onSearch={(v) => { setOrderSearch(v); setOrderPage(0); }}
            searchPlaceholder="Search customer, order ID…"
            statusFilter={orderStatusFilter}
            onStatusFilter={(v) => { setOrderStatusFilter(v); setOrderPage(0); }}
            statusOptions={ORDER_STATUS_OPTIONS}
            sort={orderSort}
            onSort={(v) => { setOrderSort(v); setOrderPage(0); }}
            hasActiveFilters={orderStatusFilter.length > 0}
            onClearAll={() => { setOrderStatusFilter([]); setOrderPage(0); }}
          />

          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
            <div
              className="hidden sm:grid grid-cols-[120px_1fr_110px_130px_110px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
              style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <span>Order ID</span>
              <span>Customer</span>
              <span>Date</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
              {pagedOrders.length === 0 && (
                <div className="text-center py-10 text-[13px]" style={{ color: T.muted }}>No orders created by this executive.</div>
              )}
              {pagedOrders.map((o, i, arr) => {
                const st = orderStatusChip(o);
                return (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="grid grid-cols-1 sm:grid-cols-[120px_1fr_110px_130px_110px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)] last:rounded-b-[15px]"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                  >
                    <div className="text-[11px] tracking-[0.06em] uppercase font-medium" style={{ color: T.accent }}>{o.id}</div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{o.customerName}</div>
                    </div>
                    <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>{fmtDate(o.placedAt)}</div>
                    <div><Chip tone={st.tone}>{st.label}</Chip></div>
                    <div className="text-[13px] text-right font-semibold tabular-nums" style={{ color: T.text }}>{inr(o.total)}</div>
                  </Link>
                );
              })}
            </div>
          </Card>
          <Pagination page={orderPage} totalPages={orderTotalPages} onPageChange={setOrderPage} perPage={PAGE_SIZE} totalItems={filteredCreatedOrders.length} />
        </>
      )}

      {/* Created Consultations Tab */}
      {activeTab === "created_consultations" && (
        <>
          <FilterToolbar
            search={createdConSearch}
            onSearch={(v) => { setCreatedConSearch(v); setCreatedConPage(0); }}
            searchPlaceholder="Search customer, consultation ID…"
            statusFilter={createdConStatusFilter}
            onStatusFilter={(v) => { setCreatedConStatusFilter(v); setCreatedConPage(0); }}
            statusOptions={CON_STATUS_OPTIONS}
            sort={createdConSort}
            onSort={(v) => { setCreatedConSort(v); setCreatedConPage(0); }}
            hasActiveFilters={createdConStatusFilter.length > 0}
            onClearAll={() => { setCreatedConStatusFilter([]); setCreatedConPage(0); }}
          />

          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
            <div
              className="hidden sm:grid grid-cols-[120px_1fr_110px_130px_110px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
              style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <span>Consultation ID</span>
              <span>Customer</span>
              <span>Date</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
              {pagedCreatedCons.length === 0 && (
                <div className="text-center py-10 text-[13px]" style={{ color: T.muted }}>No consultations created by this executive.</div>
              )}
              {pagedCreatedCons.map((c, i, arr) => {
                const st = consultationStatusChip(c);
                return (
                  <Link
                    key={c.id}
                    href={`/consultations/${c.id}`}
                    className="grid grid-cols-1 sm:grid-cols-[120px_1fr_110px_130px_110px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)] last:rounded-b-[15px]"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                  >
                    <div className="text-[11px] tracking-[0.06em] uppercase font-medium" style={{ color: T.accent }}>{c.id}</div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{c.customerName}</div>
                    </div>
                    <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>{fmtDate(c.scheduledAt)}</div>
                    <div><Chip tone={st.tone}>{st.label}</Chip></div>
                    <div className="text-[13px] text-right font-semibold tabular-nums" style={{ color: T.text }}>{c.fee != null ? inr(c.fee) : "—"}</div>
                  </Link>
                );
              })}
            </div>
          </Card>
          <Pagination page={createdConPage} totalPages={createdConTotalPages} onPageChange={setCreatedConPage} perPage={PAGE_SIZE} totalItems={filteredCreatedConsultations.length} />
        </>
      )}

      {toast && <Toast message={toast} />}

      <ConfirmDialog
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() => { setIsActive(false); setToast("Sales member deactivated"); setTimeout(() => setToast(""), 2500); }}
        title={`Deactivate ${member.name}?`}
        message="They'll lose portal access until reactivated."
        confirmLabel="Deactivate"
        tone="danger"
      />
      </div>
    </>
  );
}
