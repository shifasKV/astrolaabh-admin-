"use client";
import { StaffProfilePage } from "@/components/profile/StaffProfilePage";

export default function AdminProfilePage() {
  return <StaffProfilePage expectedRoles={["admin"]} />;
}
