"use client";
import { useState } from "react";
import { PageHeader, Card, Chip, Tabs, SearchFilter } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_STONE_RECOMMENDATIONS, MOCK_REMEDY_RECOMMENDATIONS } from "@/lib/mock";

const TABS = [
  { key: "stones", label: "Stone recommendations" },
  { key: "remedies", label: "Other remedies" },
];

export default function RecommendationsPage() {
  const [tab, setTab] = useState("stones");
  const [search, setSearch] = useState("");

  const statusTone = (s: string) => {
    if (s === "converted_to_order" || s === "approved") return "good" as const;
    if (s === "submitted" || s === "shared") return "gold" as const;
    if (s === "rejected" || s === "needs_clarification") return "danger" as const;
    return "muted" as const;
  };

  const filteredStones = MOCK_STONE_RECOMMENDATIONS.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.customerName.toLowerCase().includes(q) || r.gemstone.toLowerCase().includes(q);
  });

  return (
    <>
      <PageHeader title="Recommendations" sub="Stone and remedy recommendations — track status through to order conversion" />

      <div className="mb-4">
        <Tabs tabs={TABS.map((t) => ({ ...t, count: t.key === "stones" ? MOCK_STONE_RECOMMENDATIONS.length : MOCK_REMEDY_RECOMMENDATIONS.length }))} active={tab} onChange={setTab} />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search customer, gemstone…" />
      </div>

      {tab === "stones" && (
        <Card>
          {filteredStones.map((r) => (
            <div key={r.id} className="py-3.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium" style={{ color: T.text }}>{r.customerName}</div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: T.muted }}>{r.gemstone} · {r.weightRange} · {r.priority}</div>
                  <div className="text-[11.5px] mt-0.5 truncate" style={{ color: T.faint }}>{r.rationale}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Chip tone={statusTone(r.status)}>{r.status.replace(/_/g, " ")}</Chip>
                  {r.matchedSku && <span className="text-[11px]" style={{ color: T.accent }}>{r.matchedSku}</span>}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === "remedies" && (
        <Card>
          {MOCK_REMEDY_RECOMMENDATIONS.map((r) => (
            <div key={r.id} className="py-3.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-1.5 py-0.5 rounded capitalize" style={{ background: T.bg, color: T.muted }}>{r.type}</span>
                    <span className="text-[11px]" style={{ color: T.faint }}>{r.consultationId}</span>
                  </div>
                  <div className="text-[13px] mt-1 leading-relaxed" style={{ color: T.text }}>{r.instructions.substring(0, 120)}…</div>
                  {r.frequency && <div className="text-[11.5px] mt-0.5" style={{ color: T.muted }}>{r.frequency} · {r.duration}</div>}
                </div>
                <div className="shrink-0">
                  {r.followUpRequired && <Chip tone="gold">Follow-up needed</Chip>}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
