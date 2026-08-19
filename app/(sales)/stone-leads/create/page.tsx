"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderCreateFlow, type OrderFlowSubmit } from "@/components/create/OrderCreateFlow";
import { useLeads } from "@/lib/store/leads";
import { useAuth } from "@/lib/store/auth";

/*
 * Sales executive builds an order — from scratch or from a lead — and the
 * final CTA sends it for admin approval.
 * When a leadId is present the fulfilment is attached to that lead (it turns
 * "Converted" and its detail shows the approval status); otherwise it lands
 * in the approval queue as a standalone submission.
 */
function SalesCreateOrderInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { createSubmission, submitFulfillment } = useLeads();
  const { user } = useAuth();
  const leadId = params.get("leadId") || undefined;
  const customerId = params.get("customerId") || undefined;
  const stoneSku = params.get("sku") || undefined;

  const handleSubmit = (p: OrderFlowSubmit) => {
    if (leadId) {
      submitFulfillment(leadId, {
        kind: "order",
        submittedBy: user?.id ?? "sales",
        submittedAt: new Date().toISOString(),
        summary: p.summary,
        subtotal: p.subtotal,
        discount: p.discount,
        total: p.total,
        image: p.image,
        isCustom: p.isCustom,
        refs: p.refs,
        details: p.details,
      });
      return;
    }
    createSubmission({ kind: "order", customerName: p.customerName, submittedBy: user?.id ?? "sales", summary: p.summary, subtotal: p.subtotal, discount: p.discount, total: p.total, image: p.image, isCustom: p.isCustom, refs: p.refs, details: p.details });
  };

  return (
    <OrderCreateFlow
      headerTitle="Create order"
      submitLabel="Send for approval"
      successMessage="Sent for admin approval"
      prefill={{ customerId, stoneSku }}
      onBack={() => router.push(leadId ? `/stone-leads/${leadId}` : "/stone-leads")}
      onSubmit={handleSubmit}
      onDone={() => router.push(leadId ? `/stone-leads/${leadId}` : "/stone-leads")}
    />
  );
}

export default function SalesCreateOrderPage() {
  return <Suspense fallback={null}><SalesCreateOrderInner /></Suspense>;
}
