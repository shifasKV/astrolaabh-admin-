"use client";
import { useRouter } from "next/navigation";
import { ConsultationCreateFlow } from "@/components/create/ConsultationCreateFlow";

/* Admin books a consultation directly — no approval. */
export default function CreateConsultationPage() {
  const router = useRouter();
  return (
    <ConsultationCreateFlow
      headerTitle="Book consultation"
      submitLabel="Book consultation"
      successMessage="Consultation booked successfully"
      onBack={() => router.push("/consultations")}
      onSubmit={() => { /* admin: commit directly (mock) */ }}
      onDone={() => router.push("/consultations")}
    />
  );
}
