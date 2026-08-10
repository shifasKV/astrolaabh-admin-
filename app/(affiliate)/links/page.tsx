"use client";
import { useState } from "react";
import { PageHeader, Card, Chip, GoldBtn, GhostBtn, Modal, Input, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATE_LINKS } from "@/lib/mock";

export default function LinksPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newLink, setNewLink] = useState({ destination: "homepage", campaign: "" });

  const myLinks = MOCK_AFFILIATE_LINKS.filter((l) => l.affiliateCode === "SANDEEP108");

  return (
    <>
      <PageHeader
        title="Affiliate links"
        sub="Create trackable links for approved destinations"
        action={<GoldBtn onClick={() => setShowCreate(true)}>+ New link</GoldBtn>}
      />

      <Card>
        {myLinks.map((link) => (
          <div key={link.id} className="py-4" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-1.5 py-0.5 rounded capitalize" style={{ background: T.bg, color: T.muted }}>{link.destinationType}</span>
                  {link.campaign && <span className="text-[11px]" style={{ color: T.faint }}>{link.campaign}</span>}
                </div>
                <div className="text-[13px] font-medium mt-1 break-all" style={{ color: T.accent }}>{link.shortUrl}</div>
                <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{link.destination}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[13px] font-semibold tabular-nums" style={{ color: T.text }}>{link.clicks.toLocaleString()} clicks</div>
                  <div className="text-[11.5px]" style={{ color: T.muted }}>{link.conversions} conversions</div>
                </div>
                <Chip tone={link.active ? "good" : "muted"}>{link.active ? "Active" : "Inactive"}</Chip>
              </div>
            </div>
            <div className="flex gap-2 mt-2.5">
              <GhostBtn onClick={() => navigator.clipboard.writeText(link.shortUrl)}>Copy link</GhostBtn>
              {link.active && <GhostBtn>Deactivate</GhostBtn>}
            </div>
          </div>
        ))}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create affiliate link">
        <div className="space-y-4">
          <Select
            value={newLink.destination}
            onChange={(v) => setNewLink((l) => ({ ...l, destination: v }))}
            label="Destination"
            options={[
              { value: "homepage", label: "Homepage" },
              { value: "consultation", label: "Consultation booking" },
              { value: "collection", label: "Gemstone collection" },
              { value: "product", label: "Specific product" },
              { value: "campaign", label: "Campaign landing page" },
            ]}
          />
          <Input
            value={newLink.campaign}
            onChange={(v) => setNewLink((l) => ({ ...l, campaign: v }))}
            label="Campaign name (optional)"
            placeholder="e.g. youtube-aug, insta-reel"
          />
          <div className="pt-2 flex gap-2.5">
            <GoldBtn onClick={() => setShowCreate(false)}>Generate link</GoldBtn>
            <GhostBtn onClick={() => setShowCreate(false)}>Cancel</GhostBtn>
          </div>
        </div>
      </Modal>
    </>
  );
}
