"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, Chip, StatCard, GoldBtn, SearchFilter } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_SALES_MEMBERS, MOCK_INCOMPLETE_ORDERS, MOCK_INCOMPLETE_CONSULTATIONS } from "@/lib/mock";

function getMemberStats(memberId: string) {
  const stoneLeads = MOCK_INCOMPLETE_ORDERS.filter((o) => o.assignedTo === memberId);
  const consultationLeads = MOCK_INCOMPLETE_CONSULTATIONS.filter((c) => c.assignedTo === memberId);
  const totalLeads = stoneLeads.length + consultationLeads.length;
  const activeLeads = [...stoneLeads, ...consultationLeads].filter((l) => l.leadStatus === "new" || l.leadStatus === "contacted" || l.leadStatus === "follow_up").length;
  const converted = [...stoneLeads, ...consultationLeads].filter((l) => l.leadStatus === "converted").length;
  return { totalLeads, activeLeads, converted, stoneLeads: stoneLeads.length, consultationLeads: consultationLeads.length };
}

export default function SalesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const totalActiveLeads = [...MOCK_INCOMPLETE_ORDERS, ...MOCK_INCOMPLETE_CONSULTATIONS].filter(
    (l) => l.assignedTo && (l.leadStatus === "new" || l.leadStatus === "contacted" || l.leadStatus === "follow_up"),
  ).length;
  const totalConverted = [...MOCK_INCOMPLETE_ORDERS, ...MOCK_INCOMPLETE_CONSULTATIONS].filter(
    (l) => l.assignedTo && l.leadStatus === "converted",
  ).length;
  const unassigned = [...MOCK_INCOMPLETE_ORDERS, ...MOCK_INCOMPLETE_CONSULTATIONS].filter((l) => !l.assignedTo).length;

  return (
    <>
      <PageHeader
        title="Sales"
        sub="Manage sales team members and track their leads"
        action={<GoldBtn onClick={() => router.push("/sales/create")}>+ New Sales Member</GoldBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active members" value={MOCK_SALES_MEMBERS.filter((m) => m.status === "active").length} />
        <StatCard label="Active leads" value={totalActiveLeads} />
        <StatCard label="Converted" value={totalConverted} />
        <StatCard label="Unassigned leads" value={unassigned} />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search name, role…" />
      </div>

      <div className="grid gap-4">
        {MOCK_SALES_MEMBERS.filter((m) => {
          if (!search) return true;
          const q = search.toLowerCase();
          return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
        }).map((member) => {
          const stats = getMemberStats(member.id);
          return (
            <Link key={member.id} href={`/sales/${member.id}`}>
              <Card className="card-interactive cursor-pointer">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span
                      className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-semibold shrink-0"
                      style={{ background: `${T.accent}18`, border: `1.5px solid ${T.accent}40`, color: T.accent }}
                    >
                      {member.name[0]}
                    </span>
                    <div>
                      <div className="text-[14px] font-semibold" style={{ color: T.text }}>{member.name}</div>
                      <div className="text-[13px] mt-0.5" style={{ color: T.muted }}>{member.role}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[12px]" style={{ color: T.faint }}>{member.email}</span>
                        <span className="text-[12px]" style={{ color: T.faint }}>·</span>
                        <span className="text-[12px]" style={{ color: T.faint }}>{member.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Chip tone={member.status === "active" ? "good" : "muted"}>{member.status}</Chip>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Total leads</div>
                    <div className="text-[15px] font-semibold mt-0.5" style={{ color: T.text }}>{stats.totalLeads}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Active</div>
                    <div className="text-[15px] font-semibold mt-0.5" style={{ color: stats.activeLeads > 0 ? T.accent : T.text }}>{stats.activeLeads}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Stone leads</div>
                    <div className="text-[15px] font-semibold mt-0.5" style={{ color: T.text }}>{stats.stoneLeads}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Consultation leads</div>
                    <div className="text-[15px] font-semibold mt-0.5" style={{ color: T.text }}>{stats.consultationLeads}</div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
