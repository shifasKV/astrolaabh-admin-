"use client";
import { useParams } from "next/navigation";
import { T } from "@/lib/theme";
import { BackLink } from "@/components/ui";
import { EXPERT_PROFILES } from "@/lib/mock";
import { AvailabilityEditor } from "@/components/availability-editor";

export default function AdminAvailabilityPage() {
  const { id } = useParams<{ id: string }>();
  const expert = EXPERT_PROFILES.find((e) => e.id === id);

  if (!expert) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[14px]" style={{ color: T.muted }}>Expert not found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5">
        <BackLink label={expert.name} href={`/astro-gemologists/${id}`} />
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0"
            style={{ background: `${T.accent}15`, border: `2px solid ${T.accent}40`, color: T.accent }}
          >
            {expert.name[0]}
          </div>
          <div>
            <h1 className="text-[18px] font-semibold" style={{ color: T.text }}>
              Availability — {expert.name}
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.muted }}>
              Manage consultation schedule for {expert.name}
            </p>
          </div>
        </div>
      </div>

      <AvailabilityEditor expertId={id} />
    </>
  );
}
