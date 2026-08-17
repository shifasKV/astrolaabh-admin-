"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, SearchFilter, Pagination, Select, TableSkeleton } from "@/components/ui";
import { T } from "@/lib/theme";
import { useAuth } from "@/lib/store/auth";
import { MOCK_INCOMPLETE_ORDERS, MOCK_SALES_MEMBERS } from "@/lib/mock";
import { inr } from "@/lib/types";

const PAGE_SIZE = 10;

const REASON_LABEL: Record<string, string> = {
  payment_failed: "Payment failed",
  abandoned_cart: "Abandoned cart",
  payment_expired: "Payment expired",
  card_declined: "Card declined",
  requested_call: "Requested call",
};
const REASON_TONE: Record<string, "danger" | "gold" | "muted"> = {
  payment_failed: "danger",
  abandoned_cart: "gold",
  payment_expired: "danger",
  card_declined: "danger",
  requested_call: "gold",
};
const STATUS_LABEL: Record<string, string> = { new: "New", contacted: "Contacted", follow_up: "Follow up", converted: "Converted", lost: "Lost" };
const STATUS_TONE: Record<string, "info" | "gold" | "good" | "muted"> = { new: "info", contacted: "gold", follow_up: "gold", converted: "good", lost: "muted" };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "follow_up", label: "Follow up" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

const REASON_OPTIONS = [
  { value: "", label: "All reasons" },
  { value: "payment_failed", label: "Payment failed" },
  { value: "abandoned_cart", label: "Abandoned cart" },
  { value: "payment_expired", label: "Payment expired" },
  { value: "card_declined", label: "Card declined" },
  { value: "requested_call", label: "Requested call" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "amount_high", label: "Amount: High" },
  { value: "amount_low", label: "Amount: Low" },
];

export default function StoneLeadsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "sales_admin";
  const myId = user?.id;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const assigneeOptions = useMemo(() => [
    { value: "", label: "All assignees" },
    { value: "__unassigned", label: "Unassigned" },
    ...MOCK_SALES_MEMBERS.filter((m) => m.status === "active").map((m) => ({ value: m.id, label: m.name })),
  ], []);

  const baseLeads = useMemo(() => {
    if (isAdmin) return MOCK_INCOMPLETE_ORDERS;
    return MOCK_INCOMPLETE_ORDERS.filter((o) => o.assignedTo === myId);
  }, [isAdmin, myId]);

  const filtered = useMemo(() => {
    let items = [...baseLeads];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((o) => o.customerName.toLowerCase().includes(q) || o.itemName.toLowerCase().includes(q) || o.customerPhone.includes(q));
    }
    if (statusFilter) items = items.filter((o) => o.leadStatus === statusFilter);
    if (reasonFilter) items = items.filter((o) => o.reason === reasonFilter);
    if (assigneeFilter === "__unassigned") items = items.filter((o) => !o.assignedTo);
    else if (assigneeFilter) items = items.filter((o) => o.assignedTo === assigneeFilter);

    if (sort === "newest") items.sort((a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime());
    else if (sort === "oldest") items.sort((a, b) => new Date(a.failedAt).getTime() - new Date(b.failedAt).getTime());
    else if (sort === "amount_high") items.sort((a, b) => b.amount - a.amount);
    else if (sort === "amount_low") items.sort((a, b) => a.amount - b.amount);

    return items;
  }, [baseLeads, search, statusFilter, reasonFilter, assigneeFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getAssigneeName = (id?: string) => {
    if (!id) return "—";
    return MOCK_SALES_MEMBERS.find((m) => m.id === id)?.name || "—";
  };

  return (
    <>
      <PageHeader title="Stone Leads" sub={isAdmin ? "All incomplete stone orders across the team" : "Your assigned stone order leads"} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <SearchFilter search={search} onSearchChange={(v) => { setSearch(v); setPage(0); }} placeholder="Search customer, item, phone…" />
        </div>
        <div className="w-[140px]"><Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(0); }} options={STATUS_OPTIONS} placeholder="Status" /></div>
        <div className="w-[150px]"><Select value={reasonFilter} onChange={(v) => { setReasonFilter(v); setPage(0); }} options={REASON_OPTIONS} placeholder="Reason" /></div>
        {isAdmin && <div className="w-[160px]"><Select value={assigneeFilter} onChange={(v) => { setAssigneeFilter(v); setPage(0); }} options={assigneeOptions} placeholder="Assignee" /></div>}
        <div className="w-[150px]"><Select value={sort} onChange={setSort} options={SORT_OPTIONS} placeholder="Sort" /></div>
      </div>

      {loading ? (
        <Card><TableSkeleton rows={5} cols={5} /></Card>
      ) : (
      <Card>
        <div className={`hidden sm:grid ${isAdmin ? "grid-cols-[1fr_1fr_90px_120px_100px_100px_100px]" : "grid-cols-[1fr_1fr_90px_120px_100px_100px]"} gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase`} style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
          <span>Customer</span>
          <span>Item</span>
          <span>Date</span>
          <span>Reason</span>
          <span>Status</span>
          {isAdmin && <span>Assignee</span>}
          <span className="text-right">Amount</span>
        </div>

        {paged.length === 0 && <div className="text-center py-10 text-[13px]" style={{ color: T.muted }}>No stone leads found.</div>}
        {paged.map((o) => (
          <Link key={o.id} href={`/stone-leads/${o.id}`}
            className={`grid grid-cols-1 ${isAdmin ? "sm:grid-cols-[1fr_1fr_90px_120px_100px_100px_100px]" : "sm:grid-cols-[1fr_1fr_90px_120px_100px_100px]"} gap-3 items-center px-3 py-3 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]`}
            style={{ borderBottom: `1px solid ${T.borderSoft}` }}
          >
            <div className="min-w-0">
              <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{o.customerName}</div>
              <div className="text-[11px] truncate" style={{ color: T.faint }}>{o.customerPhone}</div>
            </div>
            <div className="min-w-0"><div className="text-[13px] truncate" style={{ color: T.text }}>{o.itemName}</div></div>
            <div className="text-[12px]" style={{ color: T.muted }}>{fmtDate(o.failedAt)}</div>
            <div><Chip tone={REASON_TONE[o.reason] || "muted"}>{REASON_LABEL[o.reason]}</Chip></div>
            <div><Chip tone={STATUS_TONE[o.leadStatus] || "muted"}>{STATUS_LABEL[o.leadStatus]}</Chip></div>
            {isAdmin && <div className="text-[12px]" style={{ color: T.muted }}>{getAssigneeName(o.assignedTo)}</div>}
            <div className="text-[13px] text-right font-medium tabular-nums" style={{ color: T.text }}>{inr(o.amount)}</div>
          </Link>
        ))}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} perPage={PAGE_SIZE} totalItems={filtered.length} />
      </Card>
      )}
    </>
  );
}
