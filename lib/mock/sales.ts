export interface SalesMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "active" | "inactive";
  joinedAt: string;
}

export const MOCK_SALES_MEMBERS: SalesMember[] = [
  { id: "sales_01", name: "Priya Sharma", email: "priya.sharma@astrolaabh.com", phone: "+91 98100 11223", role: "Sales Lead", status: "active", joinedAt: "2025-10-15" },
  { id: "sales_02", name: "Rahul Verma", email: "rahul.verma@astrolaabh.com", phone: "+91 99887 44556", role: "Sales Executive", status: "active", joinedAt: "2026-01-10" },
  { id: "sales_03", name: "Sneha Gupta", email: "sneha.gupta@astrolaabh.com", phone: "+91 88776 33221", role: "Sales Executive", status: "active", joinedAt: "2026-03-20" },
  { id: "sales_04", name: "Arjun Nair", email: "arjun.nair@astrolaabh.com", phone: "+91 77665 22110", role: "Sales Executive", status: "inactive", joinedAt: "2025-12-01" },
];
