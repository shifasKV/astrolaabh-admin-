"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, Select, SearchFilter } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_ENERGISATION } from "@/lib/mock";

const TABS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "not_scheduled", label: "Not scheduled" },
  { key: "link_pending", label: "Link pending" },
];

type SortKey = "scheduled_desc" | "scheduled_asc" | "order_desc" | "order_asc";
type DatePreset = "" | "today" | "tomorrow" | "this_week" | "next_week";

function getDateRange(preset: DatePreset): { from: Date | null; to: Date | null } {
  if (!preset) return { from: null, to: null };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === "today") {
    const end = new Date(today); end.setHours(23, 59, 59, 999);
    return { from: today, to: end };
  }
  if (preset === "tomorrow") {
    const tmrw = new Date(today); tmrw.setDate(tmrw.getDate() + 1);
    const end = new Date(tmrw); end.setHours(23, 59, 59, 999);
    return { from: tmrw, to: end };
  }
  if (preset === "this_week") {
    const day = today.getDay();
    const monday = new Date(today); monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
    return { from: monday, to: sunday };
  }
  if (preset === "next_week") {
    const day = today.getDay();
    const nextMon = new Date(today); nextMon.setDate(today.getDate() + (7 - (day === 0 ? 6 : day - 1)));
    const nextSun = new Date(nextMon); nextSun.setDate(nextMon.getDate() + 6); nextSun.setHours(23, 59, 59, 999);
    return { from: nextMon, to: nextSun };
  }
  return { from: null, to: null };
}

export default function EnergisationPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("scheduled_desc");
  const [datePreset, setDatePreset] = useState<DatePreset>("");
  const [filterStatus, setFilterStatus] = useState("");

  const { from, to } = getDateRange(datePreset);

  const filtered = MOCK_ENERGISATION.filter((e) => {
    if (tab === "upcoming") return e.status === "scheduled" && e.scheduledAt;
    if (tab === "not_scheduled") return e.status === "pending";
    if (tab === "link_pending") return e.status === "scheduled" && !e.liveLink;
    return e.status !== "not_required";
  }).filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.customerName.toLowerCase().includes(q) || e.orderNumber.toLowerCase().includes(q) || e.stoneDescription.toLowerCase().includes(q);
  }).filter((e) => {
    if (!filterStatus) return true;
    if (filterStatus === "scheduled") return e.status === "scheduled";
    if (filterStatus === "completed") return e.status === "completed";
    return true;
  }).filter((e) => {
    if (!from || !to) return true;
    if (!e.scheduledAt) return false;
    const d = new Date(e.scheduledAt);
    return d >= from && d <= to;
  }).sort((a, b) => {
    if (sort === "scheduled_desc") return (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? "");
    if (sort === "scheduled_asc") return (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "");
    if (sort === "order_desc") return b.orderNumber.localeCompare(a.orderNumber);
    if (sort === "order_asc") return a.orderNumber.localeCompare(b.orderNumber);
    return 0;
  });

  return (
    <>
      <PageHeader
        title="Energisation management"
        sub="Track preparation and completion of gemstone energisation rituals"
      />

      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => ({
            ...t,
            count: MOCK_ENERGISATION.filter((e) =>
              t.key === "all" ? (e.status !== "not_required") :
              t.key === "upcoming" ? (e.status === "scheduled" && !!e.scheduledAt) :
              t.key === "not_scheduled" ? (e.status === "pending") :
              (e.status === "scheduled" && !e.liveLink)
            ).length,
          }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* Filters & sort */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex-1 min-w-[200px]">
            <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search customer, order, stone…" />
          </div>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            compact
            placeholder="Status: All"
            prefix="Status: "
            options={[
              { value: "", label: "All" },
              { value: "scheduled", label: "Scheduled" },
              { value: "completed", label: "Completed" },
            ]}
            className="w-[170px]"
          />
          <Select
            value={datePreset}
            onChange={(val) => setDatePreset(val as DatePreset)}
            compact
            placeholder="Date: All"
            prefix="Date: "
            options={[
              { value: "", label: "All" },
              { value: "today", label: "Today" },
              { value: "tomorrow", label: "Tomorrow" },
              { value: "this_week", label: "This week" },
              { value: "next_week", label: "Next week" },
            ]}
            className="w-[165px]"
          />
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-[12px]" style={{ border: `1px solid ${T.borderSoft}`, color: T.muted }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M6 12h12M9 18h6"/></svg>
            <Select
              value={sort}
              onChange={(val) => setSort(val as SortKey)}
              compact
              options={[
                { value: "scheduled_desc", label: "Newest" },
                { value: "scheduled_asc", label: "Soonest" },
                { value: "order_desc", label: "Order ↓" },
                { value: "order_asc", label: "Order ↑" },
              ]}
              className="w-[110px]"
            />
          </div>
        </div>
      </div>

      {/* List view */}
      <Card>
        {filtered.length === 0 ? (
          <p className="text-[13px] text-center py-6" style={{ color: T.muted }}>No energisation tasks match your filters.</p>
        ) : (
          filtered.map((e) => (
            <Link
              key={e.id}
              href={`/energisation/${e.id}`}
              className="flex flex-wrap items-center justify-between gap-3 py-3.5 row-interactive rounded-[9px] px-2 -mx-2"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[11px] tracking-[0.06em] uppercase font-medium" style={{ color: T.accent }}>{e.orderNumber}</span>
                  <span className="text-[11px]" style={{ color: T.faint }}>·</span>
                  <span className="text-[11.5px]" style={{ color: T.muted }}>{e.stoneDescription} · {e.customerName}</span>
                  {e.status === "pending" && <Chip tone="danger">Not scheduled</Chip>}
                  {!e.liveLink && e.status === "scheduled" && <Chip tone="danger">Link pending</Chip>}
                </div>
                <div className="text-[13.5px] font-medium mt-0.5 truncate" style={{ color: T.text }}>
                  {e.method || "Method not assigned"}{e.assignedTo ? ` · ${e.assignedTo}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <Chip tone={e.status === "completed" ? "good" : "gold"}>
                    {e.status === "completed" ? "Done" : "Scheduled"}
                  </Chip>
                  <div className="text-[10.5px] mt-1" style={{ color: T.faint }}>
                    {e.scheduledAt ? new Date(e.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </Card>
    </>
  );
}
