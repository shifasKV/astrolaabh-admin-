"use client";
import { useState } from "react";
import { PageHeader, Card, Chip, Tabs, SearchFilter, GoldBtn, GhostBtn, Modal, Input, FileInput } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CERTIFICATES } from "@/lib/mock";

const TABS = [
  { key: "all", label: "All" },
  { key: "missing", label: "Missing" },
  { key: "uploaded", label: "Uploaded" },
];

export default function CertificatesPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [certNumber, setCertNumber] = useState("");
  const [authority, setAuthority] = useState("");

  const filtered = MOCK_CERTIFICATES.filter((c) => {
    if (tab === "missing") return c.status === "missing";
    if (tab === "uploaded") return c.status === "uploaded" || c.status === "verified";
    return true;
  }).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.orderNumber.toLowerCase().includes(q) || c.certificateNumber?.toLowerCase().includes(q) || c.issuingAuthority?.toLowerCase().includes(q);
  });

  const statusTone = (s: string) => {
    if (s === "verified" || s === "uploaded") return "good" as const;
    if (s === "rejected") return "danger" as const;
    return "muted" as const;
  };

  const handleUploadSubmit = () => {
    setUploadId(null);
    setCertNumber("");
    setAuthority("");
  };

  return (
    <>
      <PageHeader
        title="Order certificates"
        sub="Lab authenticity and energisation certificates — upload and track"
      />

      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => ({ ...t, count: MOCK_CERTIFICATES.filter((c) => t.key === "all" ? true : t.key === "missing" ? c.status === "missing" : (c.status === "uploaded" || c.status === "verified")).length }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search order, certificate number…" />
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="text-[13px] text-center py-6" style={{ color: T.muted }}>No certificates match.</p>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] tracking-[0.06em] uppercase" style={{ color: T.accent }}>{c.orderNumber}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: T.bg, color: T.muted }}>
                    {c.type === "lab_authenticity" ? "Lab" : "Energisation"}
                  </span>
                </div>
                <div className="text-[13px] mt-0.5" style={{ color: T.text }}>
                  {c.certificateNumber ?? "No certificate number"} {c.issuingAuthority && `· ${c.issuingAuthority}`}
                </div>
                {c.fileName && <div className="text-[11.5px] mt-0.5" style={{ color: T.muted }}>{c.fileName}</div>}
              </div>
              <div className="flex items-center gap-2.5">
                <Chip tone={statusTone(c.status)}>{c.status === "verified" ? "uploaded" : c.status}</Chip>
                {c.status === "missing" && <GoldBtn onClick={() => setUploadId(c.id)}>Upload</GoldBtn>}
              </div>
            </div>
          ))
        )}
      </Card>

      <Modal open={!!uploadId} onClose={() => setUploadId(null)} title="Upload certificate">
        <div className="space-y-3">
          <Input value={certNumber} onChange={setCertNumber} label="Certificate number" placeholder="e.g. GRS-2026-08154" />
          <Input value={authority} onChange={setAuthority} label="Issuing authority" placeholder="e.g. GRS Gemresearch" />
          <FileInput label="Certificate file" accept=".pdf,.jpg,.png" onSelect={() => {}} />
        </div>
        <div className="flex gap-2.5 mt-5">
          <GoldBtn onClick={handleUploadSubmit}>Upload certificate</GoldBtn>
          <GhostBtn onClick={() => setUploadId(null)}>Cancel</GhostBtn>
        </div>
      </Modal>
    </>
  );
}
