"use client";
import { useRouter } from "next/navigation";
import { OrderCreateFlow } from "@/components/create/OrderCreateFlow";

/* Admin creates an order directly — no approval; it lands in the orders list. */
export default function CreateOrderPage() {
  const router = useRouter();
  return (
    <OrderCreateFlow
      headerTitle="Create order"
      submitLabel="Create order"
      successMessage="Order created successfully"
      onBack={() => router.push("/orders")}
      onSubmit={() => { /* admin: commit directly (mock) */ }}
      onDone={() => router.push("/orders")}
    />
  );
}
