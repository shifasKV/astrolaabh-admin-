"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, SearchFilter, Pagination, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { useAuth } from "@/lib/store/auth";
import { MOCK_INCOMPLETE_CONSULTATIONS, MOCK_SALES_MEMBERS } from "@/lib/mock";

const PAGE_SIZE = 10;

const REASON_LABEL: Record<string, string> = { slot_check: "Slot check", payment_failed: "Payment failed", requested_call: "Requested call" };
const REASON_TONE: Record<string, "danger" | "gold" | "muted"> = { slot_check: "gold", payment_failed: "danger", requested_call: "gold" };
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
  { value: "slot_check", label: "Slot check" },
  { value: "payment_failed", label: "Payment failed" },
  { value: "requested_call", label: "Requested call" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

export default function ConsultationLeadsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "sales_admin";
  const myId = user?.id;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);

  const assigneeOptions = useMemo(() => [
    { value: "", label: "All assignees" },
    { value: "__unassigned", label: "Unassigned" },
    ...MOCK_SALES_MEMBERS.filter((m) => m.status === "active").map((m) => ({ value: m.id, label: m.name })),
  ], []);

  const baseLeads = useMemo(() => {
    if (isAdmin) return MOCK_INCOMPLETE_CONSULTATIONS;
    return MOCK_INCOMPLETE_CONSULTATIONS.filter((c) => c.assignedTo === myId);
  }, [isAdmin, myId]);

  const filtered = useMemo(() => {
    let items = [...baseLeads];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((c) => c.customerName.toLowerCase().includes(q) || c.expertName.toLowerCase().includes(q) || c.customerPhone.includes(q));
    }
    if (statusFilter) items = items.filter((c) => c.leadStatus === statusFilter);
    if (reasonFilter) items = items.filter((c) => c.reason === reasonFilter);
    if (assigneeFilter === "__unassigned") items = items.filter((c) => !c.assignedTo);
    else if (assigneeFilter) items = items.filter((c) => c.assignedTo === assigneeFilter);

    if (sort === "newest") items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    else items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
      <PageHeader title="Consultation Leads" sub={isAdmin ? "All incomplete consultation bookings across the team" : "Your assigned consultation leads"} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <SearchFilter search={search} onSearchChange={(v) => { setSearch(v); setPage(0); }} placeholder="Search customer, astrologer, phone…" />
        </div>
        <div className="w-[140px]"><Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(0); }} options={STATUS_OPTIONS} placeholder="Status" /></div>
        <div className="w-[150px]"><Select value={reasonFilter} onChange={(v) => { setReasonFilter(v); setPage(0); }} options={REASON_OPTIONS} placeholder="Reason" /></div>
        {isAdmin && <div className="w-[160px]"><Select value={assigneeFilter} onChange={(v) => { setAssigneeFilter(v); setPage(0); }} options={assigneeOptions} placeholder="Assignee" /></div>}
        <div className="w-[130px]"><Select value={sort} onChange={setSort} options={SORT_OPTIONS} placeholder="Sort" /></div>
      </div>

      <Card>
        <div className={`hidden sm:grid ${isAdmin ? "grid-cols-[1fr_1fr_90px_120px_100px_100px]" : "grid-cols-[1fr_1fr_90px_120px_100px]"} gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase`} style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
          <span>Customer</span>
          <span>Astrologer</span>
          <span>Date</span>
          <span>Reason</span>
          <span>Status</span>
          {isAdmin && <span>Assignee</span>}
        </div>

        {paged.length === 0 && <div className="text-center py-10 text-[13px]" style={{ color: T.muted }}>No consultation leads found.</div>}
        {paged.map((c) => (
          <Link key={c.id} href={`/consultation-leads/${c.id}`}
            className={`grid grid-cols-1 ${isAdmin ? "sm:grid-cols-[1fr_1fr_90px_120px_100px_100px]" : "sm:grid-cols-[1fr_1fr_90px_120px_100px]"} gap-3 items-center px-3 py-3 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]`}
            style={{ borderBottom: `1px solid ${T.borderSoft}` }}
          >
            <div className="min-w-0">
              <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{c.customerName}</div>
              <div className="text-[11px] truncate" style={{ color: T.faint }}>{c.customerPhone}</div>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] truncate" style={{ color: T.text }}>{c.expertName}</div>
              <div className="text-[11px] truncate" style={{ color: T.faint }}>{c.consultationType}</div>
            </div>
            <div className="text-[12px]" style={{ color: T.muted }}>{fmtDate(c.date)}</div>
            <div><Chip tone={REASON_TONE[c.reason] || "muted"}>{REASON_LABEL[c.reason]}</Chip></div>
            <div><Chip tone={STATUS_TONE[c.leadStatus] || "muted"}>{STATUS_LABEL[c.leadStatus]}</Chip></div>
            {isAdmin && <div className="text-[12px]" style={{ color: T.muted }}>{getAssigneeName(c.assignedTo)}</div>}
          </Link>
        ))}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} perPage={PAGE_SIZE} totalItems={filtered.length} />
      </Card>
    </>
  );
}
