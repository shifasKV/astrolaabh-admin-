"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, GoldBtn, ToolbarSearch, InlineFilter, MultiCheck, SortMenu, Pagination, EmptyState, MobileListCard, Monogram, MobileToolbar, SheetSection, MobileFab } from "@/components/ui";
import { T } from "@/lib/theme";
import { useAuth } from "@/lib/store/auth";
import { MOCK_SALES_MEMBERS } from "@/lib/mock";
import { useLeads, salesMemberName } from "@/lib/store/leads";
import { inr } from "@/lib/types";

const APPROVAL_LABEL: Record<string, string> = { pending: "Pending approval", approved: "Approved", rejected: "Rejected", on_hold: "On hold", completed: "Completed" };
const APPROVAL_TONE: Record<string, "gold" | "good" | "danger" | "info" | "muted"> = { pending: "gold", approved: "good", rejected: "danger", on_hold: "info", completed: "good" };

const PAGE_SIZE = 10;

const REASON_LABEL: Record<string, string> = { slot_check: "Slot check", payment_failed: "Payment failed", requested_call: "Requested call" };
const REASON_TONE: Record<string, "danger" | "gold" | "muted"> = { slot_check: "gold", payment_failed: "danger", requested_call: "gold" };
const STATUS_LABEL: Record<string, string> = { new: "New", contacted: "Contacted", follow_up: "Follow up", converted: "Converted", lost: "Lost" };
const STATUS_TONE: Record<string, "info" | "gold" | "good" | "muted"> = { new: "info", contacted: "gold", follow_up: "gold", converted: "good", lost: "muted" };

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STATUS_OPTIONS = [{ value: "new", label: "New" }, { value: "contacted", label: "Contacted" }, { value: "follow_up", label: "Follow up" }, { value: "converted", label: "Converted" }, { value: "lost", label: "Lost" }];
const REASON_OPTIONS = [{ value: "slot_check", label: "Slot check" }, { value: "payment_failed", label: "Payment failed" }, { value: "requested_call", label: "Requested call" }];
const SORT_OPTIONS = [{ value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }];

const FunnelIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 5h18l-7 8v6l-4-2v-4z" /></svg>;
const TagIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20.6 13.4 12 22l-9-9V4h9z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>;
const UserIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" /></svg>;

export default function ConsultationLeadsPage() {
  const { user } = useAuth();
  const { consultLeads, pendingApprovals, reviewedFulfillments, isReviewUnseen } = useLeads();
  const isAdmin = user?.role === "sales_admin";
  const myId = user?.id;
  const rowUnseen = (c: (typeof consultLeads)[number]) => !!(myId && c.fulfillment && isReviewUnseen(myId, { kind: "consultation", id: c.id, customerName: c.customerName, assignedTo: c.assignedTo, fulfillment: c.fulfillment }));

  const [activeTab, setActiveTab] = useState("leads");
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<string[]>([]);

  const allSubmissions = useMemo(() => [...pendingApprovals, ...reviewedFulfillments], [pendingApprovals, reviewedFulfillments]);
  const myConsultations = useMemo(() => allSubmissions.filter((s) => s.fulfillment.kind === "consultation" && (!myId || s.fulfillment.submittedBy === myId)), [allSubmissions, myId]);
  const [reasonF, setReasonF] = useState<string[]>([]);
  const [assigneeF, setAssigneeF] = useState<string[]>([]);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);

  const assigneeOptions = useMemo(() => [{ value: "__unassigned", label: "Unassigned" }, ...MOCK_SALES_MEMBERS.filter((m) => m.status === "active").map((m) => ({ value: m.id, label: m.name }))], []);

  const baseLeads = useMemo(() => (isAdmin ? consultLeads : consultLeads.filter((c) => c.assignedTo === myId)), [consultLeads, isAdmin, myId]);

  const filtered = useMemo(() => {
    let items = [...baseLeads];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((c) => c.customerName.toLowerCase().includes(q) || c.expertName.toLowerCase().includes(q) || c.customerPhone.includes(q));
    }
    if (statusF.length) items = items.filter((c) => statusF.includes(c.leadStatus));
    if (reasonF.length) items = items.filter((c) => reasonF.includes(c.reason));
    if (assigneeF.length) items = items.filter((c) => assigneeF.includes(c.assignedTo || "__unassigned"));

    if (sort === "newest") items.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    else items.sort((a, b) => +new Date(a.date) - +new Date(b.date));
    return items;
  }, [baseLeads, search, statusF, reasonF, assigneeF, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const filterCount = statusF.length + reasonF.length + assigneeF.length;

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
        <PageHeader title="Consultation Leads" action={<span className="hidden sm:block"><Link href="/consultation-leads/create"><GoldBtn>+ Create consultation</GoldBtn></Link></span>} />

        <div className="mb-4">
          <Tabs
            tabs={[
              { key: "leads", label: "Consultation Leads", count: filtered.length },
              { key: "created_consultations", label: "Created Consultations", count: myConsultations.length },
            ]}
            active={activeTab}
            onChange={(k) => { setActiveTab(k); setPage(0); }}
          />
        </div>

        {activeTab === "leads" && <>
        <div className="hidden sm:flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <InlineFilter label="Status" icon={FunnelIcon} count={statusF.length}><MultiCheck options={STATUS_OPTIONS} value={statusF} onChange={(v) => { setStatusF(v); setPage(0); }} /></InlineFilter>
            <InlineFilter label="Reason" icon={TagIcon} count={reasonF.length}><MultiCheck options={REASON_OPTIONS} value={reasonF} onChange={(v) => { setReasonF(v); setPage(0); }} /></InlineFilter>
            {isAdmin && <InlineFilter label="Assignee" icon={UserIcon} count={assigneeF.length}><MultiCheck options={assigneeOptions} value={assigneeF} onChange={(v) => { setAssigneeF(v); setPage(0); }} /></InlineFilter>}
            {filterCount > 0 && <button onClick={() => { setStatusF([]); setReasonF([]); setAssigneeF([]); setPage(0); }} className="shrink-0 text-[12px] font-medium h-8 px-2.5 rounded-[8px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]" style={{ color: T.muted }}>Clear all</button>}
          </div>
          <div className="flex items-center gap-2">
            <ToolbarSearch value={search} onChange={(v) => { setSearch(v); setPage(0); }} placeholder="Search customer, astrologer, phone…" />
            <SortMenu value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>
        </div>

        <MobileToolbar
          className="sm:hidden mb-3"
          filterCount={filterCount}
          onClearAll={() => { setStatusF([]); setReasonF([]); setAssigneeF([]); setPage(0); }}
          search={search}
          onSearch={(v) => { setSearch(v); setPage(0); }}
          searchPlaceholder="Search customer, astrologer, phone…"
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
            <div className={`hidden sm:grid ${isAdmin ? "grid-cols-[1fr_1fr_90px_120px_100px_100px]" : "grid-cols-[1fr_1fr_90px_120px_100px]"} gap-3 px-4 h-10 items-center text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]`} style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}>
              <span>Customer</span><span>Astrologer</span><span>Date</span><span>Reason</span><span>Status</span>{isAdmin && <span>Assignee</span>}
            </div>

            {paged.length === 0 ? (
              <EmptyState inline icon="search" title="No consultation leads" description="Try a different search or clear the filters." />
            ) : (
              paged.map((c, i, arr) => (
                <div key={c.id}>
                <MobileListCard
                  className="sm:hidden"
                  href={`/consultation-leads/${c.id}`}
                  leading={<Monogram name={c.customerName} />}
                  title={<span className="flex items-center gap-1.5 min-w-0">{rowUnseen(c) && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: T.gold }} title="Approval updated" />}<span className="truncate">{c.customerName}</span></span>}
                  sub={`${c.consultationType} with ${c.expertName}`}
                  status={{ label: STATUS_LABEL[c.leadStatus], tone: STATUS_TONE[c.leadStatus] || "muted", extra: REASON_LABEL[c.reason] }}
                  time={c.date}
                />
                <Link href={`/consultation-leads/${c.id}`}
                  className={`hidden ${isAdmin ? "sm:grid-cols-[1fr_1fr_90px_120px_100px_100px]" : "sm:grid-cols-[1fr_1fr_90px_120px_100px]"} sm:grid gap-3 items-center px-4 py-2.5 transition-colors ${i % 2 === 0 ? "bg-[rgba(89,82,54,0.025)]" : ""} hover:!bg-[rgba(119,123,98,0.08)] ${i === arr.length - 1 ? "rounded-b-[15px]" : ""}`}
                  style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {rowUnseen(c) && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: T.gold }} title="Approval updated" />}
                      <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{c.customerName}</div>
                    </div>
                    <div className="text-[11px] truncate" style={{ color: T.faint }}>{c.customerPhone}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] truncate" style={{ color: T.text }}>{c.expertName}</div>
                    <div className="text-[11px] truncate" style={{ color: T.faint }}>{c.consultationType}</div>
                  </div>
                  <div className="text-[12px]" style={{ color: T.muted }}>{fmtDate(c.date)}</div>
                  <div><Chip tone={REASON_TONE[c.reason] || "muted"}>{REASON_LABEL[c.reason]}</Chip></div>
                  <div><Chip tone={STATUS_TONE[c.leadStatus] || "muted"}>{STATUS_LABEL[c.leadStatus]}</Chip></div>
                  {isAdmin && <div className="text-[12px] truncate" style={{ color: T.muted }}>{salesMemberName(c.assignedTo)}</div>}
                </Link>
                </div>
              ))
            )}
          </div>
        </Card>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} perPage={PAGE_SIZE} totalItems={filtered.length} />
        </>}

        {/* Created Consultations tab — read-only */}
        {activeTab === "created_consultations" && (
          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
            <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
              <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_120px] gap-3 px-4 h-10 items-center text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]" style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}>
                <span>Customer</span><span>Summary</span><span>Approval</span><span className="text-right">Amount</span>
              </div>
              {myConsultations.length === 0 ? (
                <EmptyState inline icon="inbox" title="No created consultations" description="Consultation leads you create will appear here." />
              ) : (
                myConsultations.map((s, i, arr) => (
                  <div
                    key={s.id}
                    className={`grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_120px] gap-2 sm:gap-3 items-center px-4 py-2.5 ${i % 2 === 0 ? "bg-[rgba(89,82,54,0.025)]" : ""} ${i === arr.length - 1 ? "rounded-b-[15px]" : ""}`}
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                  >
                    <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{s.customerName}</div>
                    <div className="text-[12px] truncate" style={{ color: T.muted }}>{s.fulfillment.summary}</div>
                    <div><Chip tone={APPROVAL_TONE[s.fulfillment.approval] || "muted"}>{APPROVAL_LABEL[s.fulfillment.approval]}</Chip></div>
                    <div className="text-[13px] text-right font-semibold tabular-nums" style={{ color: T.text }}>{inr(s.fulfillment.total)}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
      <MobileFab href="/consultation-leads/create" label="New booking" />
    </>
  );
}
