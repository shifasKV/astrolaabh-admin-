"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, Card, Chip, Tabs, Select, InlineFilter, MultiCheck, ToolbarSearch, SortMenu, EmptyState, Toast, MobileListCard, Monogram, MobileToolbar, SheetSection } from "@/components/ui";
import { T } from "@/lib/theme";
import { inr } from "@/lib/types";
import { MOCK_SALES_MEMBERS, MOCK_ORDERS } from "@/lib/mock";
import { useLeads, salesMemberName, submitterRole, type LeadStatus } from "@/lib/store/leads";

/* ─── label + tone maps ─── */
const STATUS_LABEL: Record<LeadStatus, string> = { new: "New", contacted: "Contacted", follow_up: "Follow up", converted: "Converted", lost: "Lost" };
const STATUS_TONE: Record<LeadStatus, "muted" | "gold" | "info" | "good" | "danger"> = { new: "muted", contacted: "gold", follow_up: "info", converted: "good", lost: "danger" };
const REASON_LABEL: Record<string, string> = { payment_failed: "Payment failed", abandoned_cart: "Abandoned cart", payment_expired: "Payment expired", card_declined: "Card declined", requested_call: "Requested call", slot_check: "Slot check" };
const REASON_TONE: Record<string, "danger" | "gold" | "info" | "muted"> = { payment_failed: "danger", abandoned_cart: "gold", payment_expired: "danger", card_declined: "danger", requested_call: "info", slot_check: "muted" };

const ACTIVE_EXECS = MOCK_SALES_MEMBERS.filter((m) => m.status === "active");
const ASSIGN_OPTIONS = [{ value: "", label: "Unassigned" }, ...ACTIVE_EXECS.map((m) => ({ value: m.id, label: m.name }))];
const STATUS_OPTIONS = (["new", "contacted", "follow_up", "converted", "lost"] as LeadStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }));

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const SORTS = [{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }, { value: "amount_high", label: "Amount: high" }, { value: "amount_low", label: "Amount: low" }];

const FunnelIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 5h18l-7 8v6l-4-2v-4z" /></svg>;
const UserIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" /></svg>;
const TagIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20.6 13.4 12 22l-9-9V4h9z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>;

/* Assignee dropdown used inside table rows */
function AssigneeCell({ id, value }: { id: string; value?: string }) {
  const { assign } = useLeads();
  return (
    <div onClick={(e) => e.preventDefault()}>
      <Select value={value ?? ""} onChange={(v) => assign(id, v)} options={ASSIGN_OPTIONS} compact placeholder="Unassigned" />
    </div>
  );
}

function LeadsPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initialTab = ((["stone", "consultation", "approvals", "payment"].includes(params.get("tab") || "") ? params.get("tab") : "approvals") as "stone" | "consultation" | "approvals" | "payment");
  const { orderLeads, consultLeads, pendingApprovals, reviewedFulfillments } = useLeads();
  const [tab, setTab] = useState<"stone" | "consultation" | "approvals" | "payment">(initialTab);

  const [statusF, setStatusF] = useState<string[]>([]);
  const [reasonF, setReasonF] = useState<string[]>([]);
  const [assigneeF, setAssigneeF] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [toast, setToast] = useState("");

  const stoneRows = useMemo(() => {
    let rows = orderLeads.filter((o) =>
      (!statusF.length || statusF.includes(o.leadStatus)) &&
      (!reasonF.length || reasonF.includes(o.reason)) &&
      (!assigneeF.length || assigneeF.includes(o.assignedTo || "__unassigned")) &&
      (!search || `${o.customerName} ${o.itemName} ${o.customerPhone}`.toLowerCase().includes(search.toLowerCase())),
    );
    rows = [...rows].sort((a, b) => sort === "amount_high" ? b.amount - a.amount : sort === "amount_low" ? a.amount - b.amount : sort === "oldest" ? +new Date(a.failedAt) - +new Date(b.failedAt) : +new Date(b.failedAt) - +new Date(a.failedAt));
    return rows;
  }, [orderLeads, statusF, reasonF, assigneeF, search, sort]);

  const consultRows = useMemo(() => {
    let rows = consultLeads.filter((c) =>
      (!statusF.length || statusF.includes(c.leadStatus)) &&
      (!reasonF.length || reasonF.includes(c.reason)) &&
      (!assigneeF.length || assigneeF.includes(c.assignedTo || "__unassigned")) &&
      (!search || `${c.customerName} ${c.expertName} ${c.consultationType}`.toLowerCase().includes(search.toLowerCase())),
    );
    rows = [...rows].sort((a, b) => sort === "oldest" ? +new Date(a.date) - +new Date(b.date) : +new Date(b.date) - +new Date(a.date));
    return rows;
  }, [consultLeads, statusF, reasonF, assigneeF, search, sort]);

  // ── Payment-pending orders (moved here from the Orders page) ──
  const paymentRows = useMemo(() => {
    let rows = MOCK_ORDERS.filter((o) => o.paymentStatus === "pending").filter((o) =>
      !search || `${o.id} ${o.customerName} ${o.items.map((i) => i.name).join(" ")}`.toLowerCase().includes(search.toLowerCase()),
    );
    rows = [...rows].sort((a, b) => sort === "amount_high" ? b.total - a.total : sort === "amount_low" ? a.total - b.total : sort === "oldest" ? +new Date(a.placedAt) - +new Date(b.placedAt) : +new Date(b.placedAt) - +new Date(a.placedAt));
    return rows;
  }, [search, sort]);

  // ── Approvals tab state ──
  const [apprTypeF, setApprTypeF] = useState<string[]>([]);
  const [apprStatusF, setApprStatusF] = useState<string[]>([]);
  const [apprSearch, setApprSearch] = useState("");
  const [apprSort, setApprSort] = useState("newest");

  const approvals = useMemo(() => {
    let rows = [...pendingApprovals, ...reviewedFulfillments].filter((r) =>
      (!apprTypeF.length || apprTypeF.includes(r.fulfillment.kind)) &&
      (!apprStatusF.length || apprStatusF.includes(r.fulfillment.approval)) &&
      (!apprSearch || `${r.customerName} ${salesMemberName(r.fulfillment.submittedBy)} ${r.fulfillment.summary}`.toLowerCase().includes(apprSearch.toLowerCase())),
    );
    rows = [...rows].sort((a, b) => apprSort === "amount_high" ? b.fulfillment.total - a.fulfillment.total : apprSort === "amount_low" ? a.fulfillment.total - b.fulfillment.total : apprSort === "oldest" ? +new Date(a.fulfillment.submittedAt) - +new Date(b.fulfillment.submittedAt) : +new Date(b.fulfillment.submittedAt) - +new Date(a.fulfillment.submittedAt));
    return rows;
  }, [pendingApprovals, reviewedFulfillments, apprTypeF, apprStatusF, apprSearch, apprSort]);
  const apprFilterCount = apprTypeF.length + apprStatusF.length;

  const reasonOptions = tab === "consultation"
    ? [{ value: "slot_check", label: "Slot check" }, { value: "payment_failed", label: "Payment failed" }, { value: "requested_call", label: "Requested call" }]
    : [{ value: "payment_failed", label: "Payment failed" }, { value: "abandoned_cart", label: "Abandoned cart" }, { value: "payment_expired", label: "Payment expired" }, { value: "card_declined", label: "Card declined" }, { value: "requested_call", label: "Requested call" }];
  const assigneeOptions = [{ value: "__unassigned", label: "Unassigned" }, ...ACTIVE_EXECS.map((m) => ({ value: m.id, label: m.name }))];

  const filterCount = statusF.length + reasonF.length + assigneeF.length;
  const clearAll = () => { setStatusF([]); setReasonF([]); setAssigneeF([]); };

  const TABS = [
    { key: "approvals", label: "Approvals", count: pendingApprovals.length },
    { key: "payment", label: "Payment pending", count: MOCK_ORDERS.filter((o) => o.paymentStatus === "pending").length },
    { key: "stone", label: "Stone leads", count: orderLeads.length },
    { key: "consultation", label: "Consultation leads", count: consultLeads.length },
  ];

  return (
    <>
      <PageHeader title="Leads" />

      <div className="mb-4"><Tabs tabs={TABS} active={tab} onChange={(k) => setTab(k as typeof tab)} /></div>

      {/* Toolbar (leads tabs only) — mobile: collapsed MobileToolbar row */}
      {(tab === "stone" || tab === "consultation") && (
        <>
          <MobileToolbar
            className="sm:hidden"
            filterCount={filterCount}
            onClearAll={clearAll}
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search customer, item, phone…"
            sort={<SortMenu value={sort} onChange={setSort} options={SORTS} />}
            filters={
              <>
                <SheetSection label="Status">
                  <MultiCheck options={STATUS_OPTIONS} value={statusF} onChange={setStatusF} />
                </SheetSection>
                <SheetSection label="Reason">
                  <MultiCheck options={reasonOptions} value={reasonF} onChange={setReasonF} />
                </SheetSection>
                <SheetSection label="Assignee">
                  <MultiCheck options={assigneeOptions} value={assigneeF} onChange={setAssigneeF} />
                </SheetSection>
              </>
            }
          />
          <div className="hidden sm:flex items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <InlineFilter label="Status" icon={FunnelIcon} count={statusF.length}><MultiCheck options={STATUS_OPTIONS} value={statusF} onChange={setStatusF} /></InlineFilter>
              <InlineFilter label="Reason" icon={TagIcon} count={reasonF.length}><MultiCheck options={reasonOptions} value={reasonF} onChange={setReasonF} /></InlineFilter>
              <InlineFilter label="Assignee" icon={UserIcon} count={assigneeF.length}><MultiCheck options={assigneeOptions} value={assigneeF} onChange={setAssigneeF} /></InlineFilter>
              {filterCount > 0 && <button onClick={clearAll} className="shrink-0 text-[12px] font-medium h-8 px-2.5 rounded-[8px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]" style={{ color: T.muted }}>Clear all</button>}
            </div>
            <div className="flex items-center gap-2">
              <ToolbarSearch value={search} onChange={setSearch} placeholder="Search customer, item, phone…" />
              <SortMenu value={sort} onChange={setSort} options={SORTS} />
            </div>
          </div>
        </>
      )}

      {/* STONE LEADS */}
      {tab === "stone" && (
        <Card className="!p-0 overflow-hidden">
          <div className="hidden lg:grid grid-cols-[1.3fr_1.6fr_120px_180px_110px_120px] gap-3 px-4 h-10 items-center text-[11px] tracking-[0.06em] uppercase sticky top-0 z-10" style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}>
            <span>Customer</span><span>Item</span><span>Reason</span><span>Assignee</span><span>Status</span><span className="text-right">Amount</span>
          </div>
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            {stoneRows.map((o) => (
              <div key={o.id}>
                <MobileListCard
                  className="lg:hidden"
                  href={`/orders/incomplete/${o.id}`}
                  leading={<Monogram name={o.customerName} />}
                  title={o.customerName}
                  right={inr(o.amount)}
                  sub={o.itemName}
                  status={{ label: STATUS_LABEL[o.leadStatus], tone: STATUS_TONE[o.leadStatus], extra: REASON_LABEL[o.reason] }}
                  time={o.failedAt}
                  facts={[{ label: "with", value: salesMemberName(o.assignedTo) }]}
                />
                <div className="hidden lg:grid lg:grid-cols-[1.3fr_1.6fr_120px_180px_110px_120px] gap-3 px-4 py-3 lg:items-center transition-colors hover:bg-[rgba(119,123,98,0.05)]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <Link href={`/orders/incomplete/${o.id}`} className="min-w-0"><span className="block text-[13.5px] font-medium truncate hover:underline underline-offset-2" style={{ color: T.text }}>{o.customerName}</span><span className="block text-[11.5px] truncate" style={{ color: T.faint }}>{fmtDate(o.failedAt)} · {o.customerPhone}</span></Link>
                  <Link href={`/orders/incomplete/${o.id}`} className="min-w-0"><span className="block text-[13px] truncate" style={{ color: T.muted }}>{o.itemName}</span></Link>
                  <span><Chip tone={REASON_TONE[o.reason]}>{REASON_LABEL[o.reason]}</Chip></span>
                  <AssigneeCell id={o.id} value={o.assignedTo} />
                  <span><Chip tone={STATUS_TONE[o.leadStatus]}>{STATUS_LABEL[o.leadStatus]}</Chip></span>
                  <span className="text-[13.5px] font-semibold tabular-nums lg:text-right" style={{ color: T.text }}>{inr(o.amount)}</span>
                </div>
              </div>
            ))}
            {stoneRows.length === 0 && <EmptyState inline icon="search" title="No leads found" description="Try clearing filters or search." />}
          </div>
        </Card>
      )}

      {/* CONSULTATION LEADS */}
      {tab === "consultation" && (
        <Card className="!p-0 overflow-hidden">
          <div className="hidden lg:grid grid-cols-[1.3fr_1.6fr_120px_180px_110px] gap-3 px-4 h-10 items-center text-[11px] tracking-[0.06em] uppercase sticky top-0 z-10" style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}>
            <span>Customer</span><span>Astrologer</span><span>Reason</span><span>Assignee</span><span>Status</span>
          </div>
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            {consultRows.map((c) => (
              <div key={c.id}>
                <MobileListCard
                  className="lg:hidden"
                  href={`/consultations/incomplete/${c.id}`}
                  leading={<Monogram name={c.customerName} />}
                  title={c.customerName}
                  sub={`${c.consultationType} with ${c.expertName}`}
                  status={{ label: STATUS_LABEL[c.leadStatus], tone: STATUS_TONE[c.leadStatus], extra: REASON_LABEL[c.reason] }}
                  time={c.date}
                  facts={[{ label: "with", value: salesMemberName(c.assignedTo) }]}
                />
                <div className="hidden lg:grid lg:grid-cols-[1.3fr_1.6fr_120px_180px_110px] gap-3 px-4 py-3 lg:items-center transition-colors hover:bg-[rgba(119,123,98,0.05)]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <Link href={`/consultations/incomplete/${c.id}`} className="min-w-0"><span className="block text-[13.5px] font-medium truncate hover:underline underline-offset-2" style={{ color: T.text }}>{c.customerName}</span><span className="block text-[11.5px] truncate" style={{ color: T.faint }}>{fmtDate(c.date)} · {c.customerPhone}</span></Link>
                  <Link href={`/consultations/incomplete/${c.id}`} className="min-w-0"><span className="block text-[13px] truncate" style={{ color: T.muted }}>{c.expertName}</span><span className="block text-[11.5px] truncate" style={{ color: T.faint }}>{c.consultationType}</span></Link>
                  <span><Chip tone={REASON_TONE[c.reason]}>{REASON_LABEL[c.reason]}</Chip></span>
                  <AssigneeCell id={c.id} value={c.assignedTo} />
                  <span><Chip tone={STATUS_TONE[c.leadStatus]}>{STATUS_LABEL[c.leadStatus]}</Chip></span>
                </div>
              </div>
            ))}
            {consultRows.length === 0 && <EmptyState inline icon="search" title="No leads found" description="Try clearing filters or search." />}
          </div>
        </Card>
      )}

      {/* PAYMENT PENDING — orders awaiting payment (moved from the Orders page) */}
      {tab === "payment" && (
        <>
          <MobileToolbar
            className="sm:hidden mb-3"
            filterCount={0}
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search order, customer…"
            sort={<SortMenu value={sort} onChange={setSort} options={SORTS} />}
          />
          <div className="hidden sm:flex items-center justify-end gap-2 mb-3">
            <ToolbarSearch value={search} onChange={setSearch} placeholder="Search order, customer…" />
            <SortMenu value={sort} onChange={setSort} options={SORTS} />
          </div>
          <Card className="!p-0 overflow-hidden">
            <div className="hidden lg:grid grid-cols-[80px_1.4fr_120px_140px_120px] gap-3 px-4 h-10 items-center text-[11px] tracking-[0.06em] uppercase sticky top-0 z-10" style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}>
              <span>Order</span><span>Customer</span><span>Created</span><span>Created by</span><span className="text-right">Amount</span>
            </div>
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {paymentRows.map((o) => (
                <div key={o.id}>
                  <MobileListCard
                    className="lg:hidden"
                    href={`/orders/${o.id}`}
                    leading={<Monogram name={o.customerName} />}
                    title={o.customerName}
                    right={inr(o.total)}
                    sub={o.items.length > 1 ? `${o.items[0]?.name} + ${o.items.length - 1} more` : o.items[0]?.name}
                    status={{ label: "Payment pending", tone: "gold", extra: o.id }}
                    time={o.placedAt}
                  />
                  <Link href={`/orders/${o.id}`} className="hidden lg:grid lg:grid-cols-[80px_1.4fr_120px_140px_120px] gap-3 px-4 py-3 lg:items-center transition-colors hover:bg-[rgba(119,123,98,0.05)]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                    <span className="text-[11.5px] tabular-nums" style={{ color: T.faint }}>#{o.id.replace("AL-ORD-", "")}</span>
                    <span className="min-w-0"><span className="block text-[13.5px] font-medium truncate" style={{ color: T.text }}>{o.customerName}</span><span className="block text-[11.5px] truncate" style={{ color: T.faint }}>{o.items[0]?.name}{o.items.length > 1 ? ` +${o.items.length - 1}` : ""}</span></span>
                    <span className="text-[12px] tabular-nums" style={{ color: T.muted }}>{fmtDate(o.placedAt)}</span>
                    <span className="text-[12px] truncate capitalize" style={{ color: T.muted }}>{o.placedBy ? o.placedBy.split("@")[0] : "Customer"}</span>
                    <span className="text-[13.5px] font-semibold tabular-nums lg:text-right" style={{ color: T.text }}>{inr(o.total)}</span>
                  </Link>
                </div>
              ))}
              {paymentRows.length === 0 && <EmptyState inline icon="check" title="No pending payments" description="Every order is paid up." />}
            </div>
          </Card>
        </>
      )}

      {/* APPROVALS TOOLBAR — mobile: collapsed MobileToolbar row */}
      {tab === "approvals" && (
        <>
          <MobileToolbar
            className="sm:hidden"
            filterCount={apprFilterCount}
            onClearAll={() => { setApprTypeF([]); setApprStatusF([]); }}
            search={apprSearch}
            onSearch={setApprSearch}
            searchPlaceholder="Search customer, exec, item…"
            sort={<SortMenu value={apprSort} onChange={setApprSort} options={SORTS} />}
            filters={
              <>
                <SheetSection label="Type">
                  <MultiCheck options={[{ value: "order", label: "Stone order" }, { value: "consultation", label: "Consultation" }]} value={apprTypeF} onChange={setApprTypeF} />
                </SheetSection>
                <SheetSection label="Status">
                  <MultiCheck options={[{ value: "pending", label: "Admin approval pending" }, { value: "approved", label: "Admin approved" }, { value: "on_hold", label: "On hold" }, { value: "completed", label: "Completed" }, { value: "rejected", label: "Rejected" }]} value={apprStatusF} onChange={setApprStatusF} />
                </SheetSection>
              </>
            }
          />
          <div className="hidden sm:flex items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <InlineFilter label="Type" icon={TagIcon} count={apprTypeF.length}><MultiCheck options={[{ value: "order", label: "Stone order" }, { value: "consultation", label: "Consultation" }]} value={apprTypeF} onChange={setApprTypeF} /></InlineFilter>
              <InlineFilter label="Status" icon={FunnelIcon} count={apprStatusF.length}><MultiCheck options={[{ value: "pending", label: "Admin approval pending" }, { value: "approved", label: "Admin approved" }, { value: "on_hold", label: "On hold" }, { value: "completed", label: "Completed" }, { value: "rejected", label: "Rejected" }]} value={apprStatusF} onChange={setApprStatusF} /></InlineFilter>
              {apprFilterCount > 0 && <button onClick={() => { setApprTypeF([]); setApprStatusF([]); }} className="shrink-0 text-[12px] font-medium h-8 px-2.5 rounded-[8px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]" style={{ color: T.muted }}>Clear all</button>}
            </div>
            <div className="flex items-center gap-2">
              <ToolbarSearch value={apprSearch} onChange={setApprSearch} placeholder="Search customer, exec, item…" />
              <SortMenu value={apprSort} onChange={setApprSort} options={SORTS} />
            </div>
          </div>
        </>
      )}

      {/* APPROVALS TABLE */}
      {tab === "approvals" && (
        <Card className="!p-0 overflow-hidden">
          <div className="hidden lg:grid grid-cols-[170px_minmax(0,1.6fr)_120px_100px_120px_110px] gap-3 px-4 h-10 items-center text-[11px] tracking-[0.06em] uppercase sticky top-0 z-10" style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}>
            <span>Submitted by</span><span>Customer · item</span><span>Type</span><span>Submitted</span><span className="text-right">Total</span><span>Status</span>
          </div>
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
            {approvals.map((r) => {
              const f = r.fulfillment;
              const p = f.approval;
              return (
                <div key={r.id}>
                <MobileListCard
                  className="lg:hidden"
                  href={`/leads/approvals/${r.id}`}
                  leading={<Monogram name={salesMemberName(f.submittedBy)} tone="muted" />}
                  title={r.customerName}
                  right={inr(f.total)}
                  sub={f.summary}
                  status={{
                    label: p === "pending" ? "Needs your review" : p === "approved" ? "Approved" : p === "completed" ? "Completed" : p === "on_hold" ? "On hold" : "Rejected",
                    tone: p === "pending" ? "gold" : p === "approved" || p === "completed" ? "good" : p === "on_hold" ? "info" : "danger",
                    extra: `by ${salesMemberName(f.submittedBy).split(" ")[0]}${submitterRole(f.submittedBy) ? ` · ${submitterRole(f.submittedBy)}` : ""}`,
                  }}
                  time={f.submittedAt}
                />
                <div onClick={() => router.push(`/leads/approvals/${r.id}`)} className="hidden lg:grid lg:grid-cols-[170px_minmax(0,1.6fr)_120px_100px_120px_110px] gap-3 px-4 py-3 lg:items-center cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.05)]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span className="flex items-center gap-2 min-w-0"><span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>{salesMemberName(f.submittedBy).split(" ").map((w) => w[0]).slice(0, 2).join("")}</span><span className="min-w-0"><span className="block text-[12.5px] font-medium truncate" style={{ color: T.text }}>{salesMemberName(f.submittedBy)}</span>{submitterRole(f.submittedBy) && <span className="block text-[10.5px] truncate" style={{ color: T.faint }}>{submitterRole(f.submittedBy)}</span>}</span></span>
                  <span className="min-w-0"><span className="block text-[13.5px] font-medium truncate" style={{ color: T.text }}>{r.customerName}</span><span className="block text-[11.5px] truncate" style={{ color: T.faint }}>{f.summary}</span></span>
                  <span><Chip tone={f.kind === "order" ? "info" : "muted"}>{f.kind === "order" ? "Stone order" : "Consultation"}</Chip></span>
                  <span className="text-[12px] tabular-nums" style={{ color: T.muted }}>{new Date(f.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  <span className="text-[13.5px] font-semibold tabular-nums lg:text-right" style={{ color: T.text }}>{inr(f.total)}</span>
                  <span><Chip tone={p === "pending" ? "gold" : p === "approved" || p === "completed" ? "good" : p === "on_hold" ? "info" : "danger"}>{p === "pending" ? "Pending" : p === "approved" ? "Approved" : p === "completed" ? "Completed" : p === "on_hold" ? "On hold" : "Rejected"}</Chip></span>
                </div>
                </div>
              );
            })}
            {approvals.length === 0 && <EmptyState inline icon="check" title="All caught up" description="No fulfilments match — nothing waiting for approval." />}
          </div>
        </Card>
      )}

      <Toast message={toast} tone={toast.includes("Reject") ? "info" : "success"} />
    </>
  );
}

export default function LeadsPage() {
  return <Suspense fallback={null}><LeadsPageInner /></Suspense>;
}

