"use client";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Chip, StatCard, Tabs, SearchFilter, Pagination, Select, BackLink } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_SALES_MEMBERS, MOCK_INCOMPLETE_ORDERS, MOCK_INCOMPLETE_CONSULTATIONS } from "@/lib/mock";
import type { IncompleteOrderStatus, IncompleteConsultationStatus } from "@/lib/mock";
import { inr } from "@/lib/types";

const PAGE_SIZE = 8;

const LEAD_TABS = [
  { key: "stone", label: "Stone Leads" },
  { key: "consultation", label: "Consultation Leads" },
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
  const [stonePage, setStonePage] = useState(0);
  const [conPage, setConPage] = useState(0);
  const [stoneStatusFilter, setStoneStatusFilter] = useState("");
  const [conStatusFilter, setConStatusFilter] = useState("");
  const [toast, setToast] = useState("");

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

  const activeLeads = [...stoneLeads, ...consultationLeads].filter(
    (l) => l.leadStatus === "new" || l.leadStatus === "contacted" || l.leadStatus === "follow_up",
  ).length;
  const converted = [...stoneLeads, ...consultationLeads].filter((l) => l.leadStatus === "converted").length;
  const lost = [...stoneLeads, ...consultationLeads].filter((l) => l.leadStatus === "lost").length;

  const filteredStoneLeads = stoneLeads.filter((o) => {
    if (stoneSearch) {
      const q = stoneSearch.toLowerCase();
      if (!o.customerName.toLowerCase().includes(q) && !o.itemName.toLowerCase().includes(q)) return false;
    }
    if (stoneStatusFilter && o.leadStatus !== stoneStatusFilter) return false;
    return true;
  });

  const filteredConLeads = consultationLeads.filter((c) => {
    if (conSearch) {
      const q = conSearch.toLowerCase();
      if (!c.customerName.toLowerCase().includes(q) && !c.expertName.toLowerCase().includes(q)) return false;
    }
    if (conStatusFilter && c.leadStatus !== conStatusFilter) return false;
    return true;
  });

  const stoneTotalPages = Math.max(1, Math.ceil(filteredStoneLeads.length / PAGE_SIZE));
  const conTotalPages = Math.max(1, Math.ceil(filteredConLeads.length / PAGE_SIZE));
  const pagedStone = filteredStoneLeads.slice(stonePage * PAGE_SIZE, (stonePage + 1) * PAGE_SIZE);
  const pagedCon = filteredConLeads.slice(conPage * PAGE_SIZE, (conPage + 1) * PAGE_SIZE);

  const statusOptions = [
    { value: "", label: "All statuses" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "follow_up", label: "Follow up" },
    { value: "converted", label: "Converted" },
    { value: "lost", label: "Lost" },
  ];

  const handleDeactivate = () => {
    setIsActive(!isActive);
    setShowMenu(false);
    setToast(isActive ? "Sales member deactivated" : "Sales member activated");
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <>
      <BackLink href="/sales" label="Sales" />

      {/* Profile card */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-semibold shrink-0"
              style={{ background: `${T.accent}18`, border: `1.5px solid ${T.accent}40`, color: T.accent }}
            >
              {member.name[0]}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-semibold" style={{ color: T.text }}>{member.name}</h2>
                <Chip tone={isActive ? "good" : "muted"}>{isActive ? "Active" : "Inactive"}</Chip>
              </div>
              <div className="text-[13px] mt-0.5" style={{ color: T.muted }}>{member.role}</div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[13px]" style={{ color: T.faint }}>{member.phone}</span>
                <span className="text-[12px]" style={{ color: T.faint }}>·</span>
                <span className="text-[13px]" style={{ color: T.faint }}>{member.email}</span>
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
                  onClick={() => { router.push(`/sales/${id}/edit`); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] hover:opacity-80 cursor-pointer"
                  style={{ color: T.text }}
                >
                  Edit details
                </button>
                <div style={{ borderTop: `1px solid ${T.borderSoft}`, margin: "2px 0" }} />
                <button
                  onClick={handleDeactivate}
                  className="w-full text-left px-3 py-2 text-[13px] hover:opacity-80 cursor-pointer"
                  style={{ color: isActive ? T.danger : T.good }}
                >
                  {isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total leads" value={stoneLeads.length + consultationLeads.length} />
        <StatCard label="Active" value={activeLeads} />
        <StatCard label="Converted" value={converted} />
        <StatCard label="Lost" value={lost} />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={LEAD_TABS.map((t) => ({
          ...t,
          label: `${t.label} (${t.key === "stone" ? stoneLeads.length : consultationLeads.length})`,
        }))}
        active={activeTab}
        onChange={(k) => { setActiveTab(k); setStonePage(0); setConPage(0); }}
      />

      {/* Stone Leads Tab */}
      {activeTab === "stone" && (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <SearchFilter search={stoneSearch} onSearchChange={(v) => { setStoneSearch(v); setStonePage(0); }} placeholder="Search customer, item…" />
            </div>
            <div className="w-[160px]">
              <Select value={stoneStatusFilter} onChange={(v) => { setStoneStatusFilter(v); setStonePage(0); }} options={statusOptions} placeholder="Status" />
            </div>
          </div>

          {/* Table header */}
          <div
            className="hidden sm:grid grid-cols-[1fr_1fr_100px_120px_100px_100px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase"
            style={{ color: T.faint }}
          >
            <span>Customer</span>
            <span>Item</span>
            <span>Date</span>
            <span>Reason</span>
            <span>Status</span>
            <span className="text-right">Amount</span>
          </div>

          <div className="space-y-1">
            {pagedStone.length === 0 && (
              <div className="text-center py-10 text-[13px]" style={{ color: T.muted }}>No stone leads found.</div>
            )}
            {pagedStone.map((o) => (
              <Link key={o.id} href={`/orders/incomplete/${o.id}`}>
                <div
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_120px_100px_100px] gap-3 items-center px-3 py-2.5 rounded-[8px] row-interactive cursor-pointer"
                  style={{ borderBottom: `1px solid ${T.borderSoft}` }}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{o.customerName}</div>
                    <div className="text-[11px] truncate" style={{ color: T.faint }}>{o.customerPhone}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] truncate" style={{ color: T.text }}>{o.itemName}</div>
                  </div>
                  <div className="text-[12px]" style={{ color: T.muted }}>{fmtDate(o.failedAt)}</div>
                  <div><Chip tone={ORDER_REASON_TONE[o.reason] || "muted"}>{ORDER_REASON_LABEL[o.reason] || o.reason}</Chip></div>
                  <div><Chip tone={STATUS_TONE[o.leadStatus] || "muted"}>{STATUS_LABEL[o.leadStatus] || o.leadStatus}</Chip></div>
                  <div className="text-[13px] text-right font-medium" style={{ color: T.text }}>{inr(o.amount)}</div>
                </div>
              </Link>
            ))}
          </div>

          {filteredStoneLeads.length > PAGE_SIZE && (
            <div className="mt-4">
              <Pagination page={stonePage} totalPages={stoneTotalPages} onPageChange={setStonePage} perPage={PAGE_SIZE} totalItems={filteredStoneLeads.length} />
            </div>
          )}
        </div>
      )}

      {/* Consultation Leads Tab */}
      {activeTab === "consultation" && (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <SearchFilter search={conSearch} onSearchChange={(v) => { setConSearch(v); setConPage(0); }} placeholder="Search customer, astrologer…" />
            </div>
            <div className="w-[160px]">
              <Select value={conStatusFilter} onChange={(v) => { setConStatusFilter(v); setConPage(0); }} options={statusOptions} placeholder="Status" />
            </div>
          </div>

          <div
            className="hidden sm:grid grid-cols-[1fr_1fr_100px_120px_100px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase"
            style={{ color: T.faint }}
          >
            <span>Customer</span>
            <span>Astrologer</span>
            <span>Date</span>
            <span>Reason</span>
            <span>Status</span>
          </div>

          <div className="space-y-1">
            {pagedCon.length === 0 && (
              <div className="text-center py-10 text-[13px]" style={{ color: T.muted }}>No consultation leads found.</div>
            )}
            {pagedCon.map((c) => (
              <Link key={c.id} href={`/consultations/incomplete/${c.id}`}>
                <div
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_120px_100px] gap-3 items-center px-3 py-2.5 rounded-[8px] row-interactive cursor-pointer"
                  style={{ borderBottom: `1px solid ${T.borderSoft}` }}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{c.customerName}</div>
                    <div className="text-[11px] truncate" style={{ color: T.faint }}>{c.customerPhone}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] truncate" style={{ color: T.text }}>{c.expertName}</div>
                  </div>
                  <div className="text-[12px]" style={{ color: T.muted }}>{fmtDate(c.date)}</div>
                  <div><Chip tone={CON_REASON_TONE[c.reason] || "muted"}>{CON_REASON_LABEL[c.reason] || c.reason}</Chip></div>
                  <div><Chip tone={STATUS_TONE[c.leadStatus] || "muted"}>{STATUS_LABEL[c.leadStatus] || c.leadStatus}</Chip></div>
                </div>
              </Link>
            ))}
          </div>

          {filteredConLeads.length > PAGE_SIZE && (
            <div className="mt-4">
              <Pagination page={conPage} totalPages={conTotalPages} onPageChange={setConPage} perPage={PAGE_SIZE} totalItems={filteredConLeads.length} />
            </div>
          )}
        </div>
      )}

      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium animate-in"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
