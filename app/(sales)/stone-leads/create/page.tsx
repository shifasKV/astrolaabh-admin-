"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderCreateFlow } from "@/components/create/OrderCreateFlow";
import { useLeads } from "@/lib/store/leads";
import { useAuth } from "@/lib/store/auth";

/* Sales executive builds an order from scratch (or from a lead) — the final CTA sends it for admin approval. */
function SalesCreateOrderInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { createSubmission } = useLeads();
  const { user } = useAuth();
  const customerId = params.get("customerId") || undefined;
  const stoneSku = params.get("sku") || undefined;
  return (
    <OrderCreateFlow
      headerTitle="Create order"
      submitLabel="Send for approval"
      successMessage="Sent for admin approval"
      prefill={{ customerId, stoneSku }}
      onBack={() => router.push("/stone-leads")}
      onSubmit={(p) => createSubmission({ kind: "order", customerName: p.customerName, submittedBy: user?.id ?? "sales", summary: p.summary, subtotal: p.subtotal, discount: p.discount, total: p.total, image: p.image, isCustom: p.isCustom, refs: p.refs, details: p.details })}
      onDone={() => router.push("/stone-leads")}
    />
  );
}

export default function SalesCreateOrderPage() {
  return <Suspense fallback={null}><SalesCreateOrderInner /></Suspense>;
}
