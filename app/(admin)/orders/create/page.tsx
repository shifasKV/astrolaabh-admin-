"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderCreateFlow } from "@/components/create/OrderCreateFlow";

/* Admin creates an order directly — no approval; it lands in the orders list.
   Accepts ?customerId= & ?sku= so lead pages can prefill the flow. */
function CreateOrderInner() {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <OrderCreateFlow
      headerTitle="Create order"
      submitLabel="Create order"
      successMessage="Order created successfully"
      prefill={{ customerId: params.get("customerId") || undefined, stoneSku: params.get("sku") || undefined }}
      onBack={() => router.push("/orders")}
      onSubmit={() => { /* admin: commit directly (mock) */ }}
      onDone={() => router.push("/orders")}
    />
  );
}

export default function CreateOrderPage() {
  return <Suspense fallback={null}><CreateOrderInner /></Suspense>;
}
