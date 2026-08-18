"use client";
import { PageHeader } from "@/components/ui";
import { AvailabilityEditor } from "@/components/availability-editor";

const EXPERT_ID = "usr_expert_01";

export default function AvailabilityPage() {
  return (
    <>
      <PageHeader title="Availability" />
      <AvailabilityEditor expertId={EXPERT_ID} />
    </>
  );
}
