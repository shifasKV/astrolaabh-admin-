"use client";
import { useParams } from "next/navigation";
import { T } from "@/lib/theme";
import { Breadcrumb } from "@/components/ui";
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
      <Breadcrumb
        items={[
          { label: expert.name, href: `/astro-gemologists/${id}` },
          { label: "Availability" },
        ]}
      />

      <div className="flex items-center gap-3.5 mb-6">
        <span
          className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[15px] font-semibold shrink-0"
          style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
        >
          {expert.name.split(" ").map((w) => w[0]).slice(-2).join("")}
        </span>
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Availability</h1>
          <p className="text-[13px] mt-0.5" style={{ color: T.muted }}>Consultation schedule for {expert.name}</p>
        </div>
      </div>

      <AvailabilityEditor expertId={id} />
    </>
  );
}
