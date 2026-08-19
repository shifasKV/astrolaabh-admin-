"use client";
import { useRouter } from "next/navigation";
import { ConsultationCreateFlow } from "@/components/create/ConsultationCreateFlow";
import { useLeads } from "@/lib/store/leads";
import { useAuth } from "@/lib/store/auth";

/* Sales executive builds a consultation from scratch — the final CTA sends it for admin approval. */
export default function SalesCreateConsultationPage() {
  const router = useRouter();
  const { createSubmission } = useLeads();
  const { user } = useAuth();
  return (
    <ConsultationCreateFlow
      headerTitle="Create consultation"
      submitLabel="Send for approval"
      successMessage="Sent for admin approval"
      footNote="This booking is sent to admin for approval before it's confirmed."
      onBack={() => router.push("/consultation-leads")}
      onSubmit={(p) => createSubmission({ kind: "consultation", customerName: p.customerName, submittedBy: user?.id ?? "sales", summary: p.summary, subtotal: p.subtotal, discount: p.discount, total: p.total, details: p.details })}
      onDone={() => router.push("/consultation-leads")}
    />
  );
}
