"use client";
import { StaffProfilePage } from "@/components/profile/StaffProfilePage";

export default function SalesProfilePage() {
  return <StaffProfilePage expectedRoles={["sales_admin", "sales_exec"]} />;
}
