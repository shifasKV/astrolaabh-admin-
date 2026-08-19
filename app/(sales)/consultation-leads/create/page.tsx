"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConsultationCreateFlow, type ConsultationFlowSubmit } from "@/components/create/ConsultationCreateFlow";
import { useLeads } from "@/lib/store/leads";
import { useAuth } from "@/lib/store/auth";

/*
 * Sales executive books a consultation — from scratch or from a lead — and
 * the final CTA sends it for admin approval. A leadId attaches the fulfilment
 * to that lead; otherwise it's a standalone submission in the queue.
 * (ConsultationCreateFlow already reads ?customerId= & ?expertId= itself.)
 */
function SalesCreateConsultationInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { createSubmission, submitFulfillment } = useLeads();
  const { user } = useAuth();
  const leadId = params.get("leadId") || undefined;

  const handleSubmit = (p: ConsultationFlowSubmit) => {
    if (leadId) {
      submitFulfillment(leadId, {
        kind: "consultation",
        submittedBy: user?.id ?? "sales",
        submittedAt: new Date().toISOString(),
        summary: p.summary,
        subtotal: p.subtotal,
        discount: p.discount,
        total: p.total,
        details: p.details,
      });
      return;
    }
    createSubmission({ kind: "consultation", customerName: p.customerName, submittedBy: user?.id ?? "sales", summary: p.summary, subtotal: p.subtotal, discount: p.discount, total: p.total, details: p.details });
  };

  return (
    <ConsultationCreateFlow
      headerTitle="Create consultation"
      submitLabel="Send for approval"
      successMessage="Sent for admin approval"
      footNote="This booking is sent to admin for approval before it's confirmed."
      onBack={() => router.push(leadId ? `/consultation-leads/${leadId}` : "/consultation-leads")}
      onSubmit={handleSubmit}
      onDone={() => router.push(leadId ? `/consultation-leads/${leadId}` : "/consultation-leads")}
    />
  );
}

export default function SalesCreateConsultationPage() {
  return <Suspense fallback={null}><SalesCreateConsultationInner /></Suspense>;
}
