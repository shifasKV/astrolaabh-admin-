"use client";
import { useState } from "react";
import { PageHeader, Card, Chip, Tabs, ToolbarSearch, GoldBtn, GhostBtn, Modal, Input, FileInput, Pagination, EmptyState, TableSkeleton, MobileListCard, MobileToolbar } from "@/components/ui";
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { MOCK_CERTIFICATES } from "@/lib/mock";
import * as V from "@/lib/validators";

const TABS = [
  { key: "all", label: "All" },
  { key: "missing", label: "Missing" },
  { key: "uploaded", label: "Uploaded" },
];

export default function CertificatesPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [certNumber, setCertNumber] = useState("");
  const [authority, setAuthority] = useState("");
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const clearUploadErr = (k: string) => setUploadErrors((p) => (p[k] ? { ...p, [k]: "" } : p));

  const loading = useSimulatedLoad();

  const viewCert = MOCK_CERTIFICATES.find((c) => c.id === viewId) || null;

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
    const e: Record<string, string> = {
      certNumber: V.required(certNumber, "Certificate number"),
      authority: V.required(authority, "Issuing authority"),
    };
    setUploadErrors(e);
    if (!V.isClean(e)) return;
    setUploadId(null);
    setCertNumber("");
    setAuthority("");
    setUploadErrors({});
  };

  const PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader
        title="Order certificates"
      />

      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => ({ ...t, count: MOCK_CERTIFICATES.filter((c) => t.key === "all" ? true : t.key === "missing" ? c.status === "missing" : (c.status === "uploaded" || c.status === "verified")).length }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* Mobile: collapsed toolbar row (expanding search) */}
      <MobileToolbar
        className="sm:hidden"
        filterCount={0}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search order, certificate number…"
      />

      <div className="hidden sm:flex flex-wrap items-center gap-2 mb-3">
        <ToolbarSearch value={search} onChange={setSearch} placeholder="Search order, certificate number…" />
      </div>

      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        {loading ? (
          <TableSkeleton cols={4} rows={8} />
        ) : (
          <>
        <div
          className="hidden sm:grid grid-cols-[1fr_130px_110px_140px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
          style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <span>Certificate</span>
          <span>Order</span>
          <span>Type</span>
          <span className="text-right">Status</span>
        </div>
        <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
        {filtered.length === 0 ? (
          <EmptyState inline icon="search" title="No certificates" description="No certificates match your search or filter." />
        ) : (
          paginated.map((c, i, arr) => {
            const isLab = c.type === "lab_authenticity";
            return (
              <div key={c.id}>
              <MobileListCard
                className="sm:hidden"
                onClick={c.status !== "missing" ? () => setViewId(c.id) : () => setUploadId(c.id)}
                title={c.certificateNumber ?? "No certificate yet"}
                sub={`${isLab ? "Lab certificate" : "Energisation certificate"} · ${c.orderNumber}`}
                status={c.status === "missing" ? { label: "Missing", tone: "danger" } : { label: "Uploaded", tone: statusTone(c.status) }}
                time={c.uploadedAt ?? undefined}
              />
              <div
                onClick={c.status !== "missing" ? () => setViewId(c.id) : undefined}
                className={`hidden sm:grid sm:grid-cols-[1fr_130px_110px_140px] gap-2 sm:gap-3 items-center px-4 py-2.5 ${c.status !== "missing" ? "cursor-pointer hover:!bg-[rgba(119,123,98,0.08)] transition-colors" : ""}`}
                style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
              >
                {/* Certificate — file icon + number over filename */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: c.status === "missing" ? "rgba(163,73,63,0.08)" : T.accentFaint, border: `1px solid ${T.borderSoft}` }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" style={{ color: c.status === "missing" ? T.danger : T.accent }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: c.certificateNumber ? T.text : T.faint }}>
                      {c.certificateNumber ?? "No certificate yet"}
                    </div>
                    <div className="text-[12px] truncate mt-px" style={{ color: T.muted }}>
                      {c.fileName || (c.issuingAuthority ? c.issuingAuthority : "Awaiting upload")}
                    </div>
                  </div>
                </div>
                <span className="text-[11.5px] tracking-[0.05em] uppercase tabular-nums md:pl-0 pl-12" style={{ color: T.accent }}>{c.orderNumber}</span>
                <div className="md:pl-0 pl-12">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-[6px]" style={{ background: "rgba(89,82,54,0.06)", color: T.muted }}>
                    {isLab ? "Lab" : "Energisation"}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2.5 md:pl-0 pl-12">
                  {c.status === "missing" ? (
                    <GoldBtn onClick={() => setUploadId(c.id)} className="!h-8 !px-3.5 !text-[12px]">Upload</GoldBtn>
                  ) : (
                    <>
                      <Chip tone={statusTone(c.status)}>Uploaded</Chip>
                      <button
                        onClick={(e) => { e.stopPropagation(); setViewId(c.id); }}
                        aria-label="View certificate"
                        title="View certificate"
                        className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.12)]"
                        style={{ color: T.muted, border: `1px solid ${T.borderSoft}` }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
              </div>
            );
          })
        )}
        </div>
          </>
        )}
      </Card>
      <Pagination page={currentPage - 1} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={(p) => setPage(p + 1)} />

      <Modal open={!!uploadId} onClose={() => setUploadId(null)} title="Upload certificate">
        <div className="space-y-3">
          <Input value={certNumber} onChange={(v) => { setCertNumber(v); clearUploadErr("certNumber"); }} onBlur={() => setUploadErrors((p) => ({ ...p, certNumber: V.required(certNumber, "Certificate number") }))} error={uploadErrors.certNumber} label="Certificate number" placeholder="e.g. GRS-2026-08154" />
          <Input value={authority} onChange={(v) => { setAuthority(v); clearUploadErr("authority"); }} onBlur={() => setUploadErrors((p) => ({ ...p, authority: V.required(authority, "Issuing authority") }))} error={uploadErrors.authority} label="Issuing authority" placeholder="e.g. GRS Gemresearch" />
          <FileInput label="Certificate file" accept=".pdf,.jpg,.png" onSelect={() => {}} />
        </div>
        <div className="flex gap-2.5 mt-5">
          <GoldBtn onClick={handleUploadSubmit}>Upload certificate</GoldBtn>
          <GhostBtn onClick={() => setUploadId(null)}>Cancel</GhostBtn>
        </div>
      </Modal>

      <Modal open={!!viewCert} onClose={() => setViewId(null)} title={viewCert?.certificateNumber || "Certificate"} wide>
        {viewCert && (
          <div className="space-y-4">
            {/* Document preview */}
            <div
              className="rounded-[12px] flex flex-col items-center justify-center text-center py-10 px-6"
              style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}
            >
              <span className="w-14 h-14 rounded-[14px] flex items-center justify-center mb-3" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
              </span>
              <div className="text-[13.5px] font-medium" style={{ color: T.text }}>{viewCert.fileName}</div>
              <div className="text-[12px] mt-1" style={{ color: T.muted }}>PDF document · preview</div>
              <div className="flex items-center gap-2 mt-4">
                <a
                  href={`/certs/${viewCert.fileName}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[9px] text-[12.5px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110"
                  style={{ background: T.accent, color: T.accentInk }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
                  Open PDF
                </a>
                <button
                  onClick={() => {}}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[9px] text-[12.5px] font-medium cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.1)]"
                  style={{ color: T.text, border: `1px solid ${T.border}` }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
                  Download
                </button>
              </div>
            </div>
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
              {[
                ["Type", viewCert.type === "lab_authenticity" ? "Lab authenticity" : "Energisation"],
                ["Order", viewCert.orderNumber],
                ["Issuing authority", viewCert.issuingAuthority || "—"],
                ["Issue date", viewCert.issueDate ? new Date(viewCert.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"],
                ["Applicable SKU", viewCert.applicableSku || "—"],
                ["Uploaded", viewCert.uploadedAt ? `${new Date(viewCert.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}${viewCert.uploadedBy ? ` · ${viewCert.uploadedBy}` : ""}` : "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>{k}</div>
                  <div className="text-[13px] font-medium" style={{ color: T.text }}>{v}</div>
                </div>
              ))}
            </div>
            {viewCert.verificationNotes && (
              <div className="pt-3.5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>Verification notes</div>
                <p className="text-[12.5px] leading-relaxed" style={{ color: T.text }}>{viewCert.verificationNotes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
      </div>
    </>
  );
}
