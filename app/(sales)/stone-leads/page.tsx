"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, GoldBtn, ToolbarSearch, InlineFilter, MultiCheck, SortMenu, Pagination, EmptyState, TableSkeleton, MobileListCard, Monogram, MobileToolbar, SheetSection, MobileFab } from "@/components/ui";
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { useAuth } from "@/lib/store/auth";
import { MOCK_SALES_MEMBERS } from "@/lib/mock";
import { useLeads, salesMemberName } from "@/lib/store/leads";
import { inr } from "@/lib/types";

const PAGE_SIZE = 10;

const REASON_LABEL: Record<string, string> = { payment_failed: "Payment failed", abandoned_cart: "Abandoned cart", payment_expired: "Payment expired", card_declined: "Card declined", requested_call: "Requested call" };
const REASON_TONE: Record<string, "danger" | "gold" | "muted"> = { payment_failed: "danger", abandoned_cart: "gold", payment_expired: "danger", card_declined: "danger", requested_call: "gold" };
const STATUS_LABEL: Record<string, string> = { new: "New", contacted: "Contacted", follow_up: "Follow up", converted: "Converted", lost: "Lost" };
const STATUS_TONE: Record<string, "info" | "gold" | "good" | "muted"> = { new: "info", contacted: "gold", follow_up: "gold", converted: "good", lost: "muted" };

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STATUS_OPTIONS = [{ value: "new", label: "New" }, { value: "contacted", label: "Contacted" }, { value: "follow_up", label: "Follow up" }, { value: "converted", label: "Converted" }, { value: "lost", label: "Lost" }];
const REASON_OPTIONS = [{ value: "payment_failed", label: "Payment failed" }, { value: "abandoned_cart", label: "Abandoned cart" }, { value: "payment_expired", label: "Payment expired" }, { value: "card_declined", label: "Card declined" }, { value: "requested_call", label: "Requested call" }];
const SORT_OPTIONS = [{ value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }, { value: "amount_high", label: "Amount: High" }, { value: "amount_low", label: "Amount: Low" }];

const FunnelIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 5h18l-7 8v6l-4-2v-4z" /></svg>;
const TagIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20.6 13.4 12 22l-9-9V4h9z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>;
const UserIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" /></svg>;

export default function StoneLeadsPage() {
  const loading = useSimulatedLoad();
  const { user } = useAuth();
  const { orderLeads, isReviewUnseen } = useLeads();
  const isAdmin = user?.role === "sales_admin";
  const myId = user?.id;
  const rowUnseen = (o: (typeof orderLeads)[number]) => !!(myId && o.fulfillment && isReviewUnseen(myId, { kind: "order", id: o.id, customerName: o.customerName, assignedTo: o.assignedTo, fulfillment: o.fulfillment }));

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<string[]>([]);
  const [reasonF, setReasonF] = useState<string[]>([]);
  const [assigneeF, setAssigneeF] = useState<string[]>([]);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);

  const assigneeOptions = useMemo(() => [{ value: "__unassigned", label: "Unassigned" }, ...MOCK_SALES_MEMBERS.filter((m) => m.status === "active").map((m) => ({ value: m.id, label: m.name }))], []);

  const baseLeads = useMemo(() => (isAdmin ? orderLeads : orderLeads.filter((o) => o.assignedTo === myId)), [orderLeads, isAdmin, myId]);

  const filtered = useMemo(() => {
    let items = [...baseLeads];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((o) => o.customerName.toLowerCase().includes(q) || o.itemName.toLowerCase().includes(q) || o.customerPhone.includes(q));
    }
    if (statusF.length) items = items.filter((o) => statusF.includes(o.leadStatus));
    if (reasonF.length) items = items.filter((o) => reasonF.includes(o.reason));
    if (assigneeF.length) items = items.filter((o) => assigneeF.includes(o.assignedTo || "__unassigned"));

    if (sort === "newest") items.sort((a, b) => +new Date(b.failedAt) - +new Date(a.failedAt));
    else if (sort === "oldest") items.sort((a, b) => +new Date(a.failedAt) - +new Date(b.failedAt));
    else if (sort === "amount_high") items.sort((a, b) => b.amount - a.amount);
    else if (sort === "amount_low") items.sort((a, b) => a.amount - b.amount);
    return items;
  }, [baseLeads, search, statusF, reasonF, assigneeF, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const filterCount = statusF.length + reasonF.length + assigneeF.length;

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
        <PageHeader title="Stone Leads" action={<span className="hidden sm:block"><Link href="/stone-leads/create"><GoldBtn>+ Create order</GoldBtn></Link></span>} />

        <div className="hidden sm:flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <InlineFilter label="Status" icon={FunnelIcon} count={statusF.length}><MultiCheck options={STATUS_OPTIONS} value={statusF} onChange={(v) => { setStatusF(v); setPage(0); }} /></InlineFilter>
            <InlineFilter label="Reason" icon={TagIcon} count={reasonF.length}><MultiCheck options={REASON_OPTIONS} value={reasonF} onChange={(v) => { setReasonF(v); setPage(0); }} /></InlineFilter>
            {isAdmin && <InlineFilter label="Assignee" icon={UserIcon} count={assigneeF.length}><MultiCheck options={assigneeOptions} value={assigneeF} onChange={(v) => { setAssigneeF(v); setPage(0); }} /></InlineFilter>}
            {filterCount > 0 && <button onClick={() => { setStatusF([]); setReasonF([]); setAssigneeF([]); setPage(0); }} className="shrink-0 text-[12px] font-medium h-8 px-2.5 rounded-[8px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]" style={{ color: T.muted }}>Clear all</button>}
          </div>
          <div className="flex items-center gap-2">
            <ToolbarSearch value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Search customer, item, phone…" />
            <SortMenu value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>
        </div>

        <MobileToolbar
          className="sm:hidden mb-3"
          filterCount={filterCount}
          onClearAll={() => { setStatusF([]); setReasonF([]); setAssigneeF([]); setPage(0); }}
          search={search}
          onSearch={(v) => { setSearch(v); setPage(0); }}
          searchPlaceholder="Search customer, item, phone…"
          sort={<SortMenu value={sort} onChange={setSort} options={SORT_OPTIONS} />}
          filters={
            <>
              <SheetSection label="Status">
                <MultiCheck options={STATUS_OPTIONS} value={statusF} onChange={(v) => { setStatusF(v); setPage(0); }} />
              </SheetSection>
              <SheetSection label="Reason">
                <MultiCheck options={REASON_OPTIONS} value={reasonF} onChange={(v) => { setReasonF(v); setPage(0); }} />
              </SheetSection>
              {isAdmin && (
                <SheetSection label="Assignee">
                  <MultiCheck options={assigneeOptions} value={assigneeF} onChange={(v) => { setAssigneeF(v); setPage(0); }} />
                </SheetSection>
              )}
            </>
          }
        />

        <Card className="!p-0 md:flex md:flex-col md:min-h-0">
          <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
            {loading ? <TableSkeleton cols={isAdmin ? 7 : 6} rows={8} /> : <>
              <div className={`hidden sm:grid ${isAdmin ? "grid-cols-[1fr_1fr_90px_120px_100px_100px_100px]" : "grid-cols-[1fr_1fr_90px_120px_100px_100px]"} gap-3 px-4 h-10 items-center text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]`} style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}>
                <span>Customer</span><span>Item</span><span>Date</span><span>Reason</span><span>Status</span>{isAdmin && <span>Assignee</span>}<span className="text-right">Amount</span>
              </div>

              {paged.length === 0 ? (
                <EmptyState inline icon="search" title="No stone leads" description="Try a different search or clear the filters." />
              ) : (
                paged.map((o, i, arr) => (
                  <div key={o.id}>
                  <MobileListCard
                    className="sm:hidden"
                    href={`/stone-leads/${o.id}`}
                    leading={<Monogram name={o.customerName} />}
                    title={<span className="flex items-center gap-1.5 min-w-0">{rowUnseen(o) && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: T.gold }} title="Approval updated" />}<span className="truncate">{o.customerName}</span></span>}
                    right={inr(o.amount)}
                    sub={o.itemName}
                    status={{ label: STATUS_LABEL[o.leadStatus], tone: STATUS_TONE[o.leadStatus] || "muted", extra: REASON_LABEL[o.reason] }}
                    time={o.failedAt}
                  />
                  <Link href={`/stone-leads/${o.id}`}
                    className={`hidden ${isAdmin ? "sm:grid-cols-[1fr_1fr_90px_120px_100px_100px_100px]" : "sm:grid-cols-[1fr_1fr_90px_120px_100px_100px]"} sm:grid gap-3 items-center px-4 py-2.5 transition-colors ${i % 2 === 0 ? "bg-[rgba(89,82,54,0.025)]" : ""} hover:!bg-[rgba(119,123,98,0.08)] ${i === arr.length - 1 ? "rounded-b-[15px]" : ""}`}
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {rowUnseen(o) && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: T.gold }} title="Approval updated" />}
                        <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{o.customerName}</div>
                      </div>
                      <div className="text-[11px] truncate" style={{ color: T.faint }}>{o.customerPhone}</div>
                    </div>
                    <div className="min-w-0"><div className="text-[13px] truncate" style={{ color: T.text }}>{o.itemName}</div></div>
                    <div className="text-[12px]" style={{ color: T.muted }}>{fmtDate(o.failedAt)}</div>
                    <div><Chip tone={REASON_TONE[o.reason] || "muted"}>{REASON_LABEL[o.reason]}</Chip></div>
                    <div><Chip tone={STATUS_TONE[o.leadStatus] || "muted"}>{STATUS_LABEL[o.leadStatus]}</Chip></div>
                    {isAdmin && <div className="text-[12px] truncate" style={{ color: T.muted }}>{salesMemberName(o.assignedTo)}</div>}
                    <div className="text-[13px] text-right font-medium tabular-nums" style={{ color: T.text }}>{inr(o.amount)}</div>
                  </Link>
                  </div>
                ))
              )}
            </>}
          </div>
        </Card>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} perPage={PAGE_SIZE} totalItems={filtered.length} />
      </div>
      <MobileFab href="/stone-leads/create" label="New order" />
    </>
  );
}
