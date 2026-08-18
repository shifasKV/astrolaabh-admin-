"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card, GoldBtn, EmptyState, TableSkeleton } from "@/components/ui";
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { MOCK_AFFILIATE_LINKS, MOCK_REFERRAL_EVENTS, MOCK_AFFILIATES } from "@/lib/mock";
import { inr } from "@/lib/types";

export default function LinksPage() {
  const loading = useSimulatedLoad();
  const router = useRouter();
  const affiliate = MOCK_AFFILIATES[0];
  const [codeCopied, setCodeCopied] = useState(false);
  const myLinks = MOCK_AFFILIATE_LINKS.filter((l) => l.affiliateCode === affiliate.code);
  const [activeState, setActiveState] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    myLinks.forEach((l) => { map[l.id] = l.active; });
    return map;
  });

  const commissionByLink = (linkId: string) =>
    MOCK_REFERRAL_EVENTS.filter((r) => r.linkId === linkId && r.commissionAmount).reduce((s, r) => s + (r.commissionAmount || 0), 0);

  const ordersByLink = (linkId: string) =>
    MOCK_REFERRAL_EVENTS.filter((r) => r.linkId === linkId && r.eventType === "order").length;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cols = "grid-cols-[1fr_120px_100px_80px_110px_90px_60px]";

  return (
    <>
      <PageHeader
        title="Affiliate links"
        sub={
          <span className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-[6px]" style={{ background: `${T.accent}12`, border: `1px solid ${T.accent}30`, color: T.accent }}>
              Referral code: {affiliate.code}
              <button
                className="cursor-pointer ml-0.5 transition-opacity hover:opacity-70"
                onClick={() => { navigator.clipboard.writeText(affiliate.code); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
              >
                {codeCopied ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.good} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                )}
              </button>
            </span>
          </span>
        }
        action={<GoldBtn onClick={() => router.push("/links/create")}>+ New link</GoldBtn>}
      />

      <Card className="!p-0">
        {loading ? <TableSkeleton cols={7} rows={8} /> : <>
        {/* Header */}
        <div className={`grid ${cols} gap-3 px-4 h-10 items-center rounded-t-[15px]`} style={{ background: T.card, borderBottom: `1px solid ${T.border}` }}>
          {["Product", "Campaign", "Type", "Orders", "Commission", "", "Active"].map((h, i) => (
            <div key={i} className={`text-[11px] font-medium tracking-[0.06em] uppercase ${i === 6 ? "text-right" : ""}`} style={{ color: T.faint }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {myLinks.map((link, idx, arr) => {
          const isActive = activeState[link.id] ?? link.active;
          const orders = ordersByLink(link.id);
          const commission = commissionByLink(link.id);
          return (
            <div
              key={link.id}
              className={`grid ${cols} gap-3 px-4 py-2.5 items-center even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)] transition-colors ${idx === arr.length - 1 ? "rounded-b-[15px]" : ""}`}
              style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
            >
              {/* Product name */}
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{link.productName || "—"}</div>
                <div className="text-[11px] mt-0.5 truncate" style={{ color: T.faint }}>{link.shortUrl}</div>
              </div>

              {/* Campaign name */}
              <div className="text-[12px] truncate" style={{ color: link.campaign ? T.text : T.faint }}>
                {link.campaign || "—"}
              </div>

              {/* Type */}
              <div>
                <span className="text-[11px] px-2 py-1 rounded-[6px] capitalize" style={{ background: T.panel, color: T.muted, border: `1px solid ${T.borderSoft}` }}>
                  {link.destinationType === "stone" ? "Stone" : "Consultation"}
                </span>
              </div>

              {/* Orders */}
              <div className="text-[13px] font-semibold tabular-nums" style={{ color: T.text }}>{orders}</div>

              {/* Commission */}
              <div className="text-[13px] font-semibold tabular-nums" style={{ color: T.accent }}>{inr(commission)}</div>

              {/* Copy link — text-only button */}
              <div>
                <button
                  onClick={() => copyLink(link.id, link.shortUrl)}
                  className="h-8 px-3 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer hover:bg-[rgba(119,123,98,0.1)]"
                  style={{ color: copiedId === link.id ? T.good : T.text, border: `1px solid ${T.border}` }}
                >
                  {copiedId === link.id ? "Copied" : "Copy link"}
                </button>
              </div>

              {/* Active toggle */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveState((prev) => ({ ...prev, [link.id]: !prev[link.id] }))}
                  aria-label={isActive ? "Deactivate link" : "Activate link"}
                  className="relative w-10 h-[22px] rounded-full transition-all duration-200 cursor-pointer"
                  style={{ background: isActive ? T.accent : T.borderSoft }}
                >
                  <div
                    className="absolute top-[2px] w-[18px] h-[18px] rounded-full transition-all duration-200 shadow-sm"
                    style={{ left: isActive ? 20 : 2, background: "#fff" }}
                  />
                </button>
              </div>
            </div>
          );
        })}

        {myLinks.length === 0 && (
          <EmptyState inline icon="table" title="No links yet" description="Create your first affiliate link to start earning commission." />
        )}
        </>}
      </Card>
    </>
  );
}
