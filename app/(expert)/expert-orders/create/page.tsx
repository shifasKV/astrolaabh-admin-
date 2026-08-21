"use client";
import { useRouter } from "next/navigation";
import { OrderCreateFlow, type OrderFlowSubmit } from "@/components/create/OrderCreateFlow";
import { useLeads } from "@/lib/store/leads";
import { useAuth } from "@/lib/store/auth";

/*
 * Astro-gemologist places an order for a customer — same stepper as admin and
 * sales; the final CTA sends it to the admin approval queue (Leads → Approvals).
 */
export default function ExpertCreateOrderPage() {
  const router = useRouter();
  const { createSubmission } = useLeads();
  const { user } = useAuth();

  const handleSubmit = (p: OrderFlowSubmit) => {
    createSubmission({
      kind: "order",
      customerName: p.customerName,
      submittedBy: user?.id ?? "usr_expert_01",
      summary: p.summary,
      subtotal: p.subtotal,
      discount: p.discount,
      total: p.total,
      image: p.image,
      isCustom: p.isCustom,
      refs: p.refs,
      details: p.details,
    });
  };

  return (
    <OrderCreateFlow
      headerTitle="Create order"
      submitLabel="Send for approval"
      successMessage="Sent for admin approval"
      onBack={() => router.push("/expert-orders")}
      onSubmit={handleSubmit}
      onDone={() => router.push("/expert-orders")}
    />
  );
}
