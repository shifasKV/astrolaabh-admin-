/**
 * Navigation configuration for all three portals.
 */
import type { NavGroup } from "@/components/ui/Sidebar";

/* SVG icon fragments — reusable across portals */
const ICONS = {
  dashboard: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  orders: <><path d="M5 8.5h14l-1.2 11a1.8 1.8 0 0 1-1.8 1.6H8a1.8 1.8 0 0 1-1.8-1.6z" strokeLinejoin="round" /><path d="M9 10.5V6.8a3 3 0 0 1 6 0v3.7" strokeLinecap="round" /></>,
  energisation: <path d="M12 3c2 3.5 5 5.5 5 9a5 5 0 0 1-10 0c0-3.5 3-5.5 5-9z" />,
  packages: <><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M3 8l2.5-4h13L21 8M12 4v17M8.5 12h7" /></>,
  certificate: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" /></>,
  payments: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><path d="M7 15h4" strokeLinecap="round" /></>,
  consultations: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" strokeLinecap="round" /></>,
  stones: <><path d="M12 2L3 9l9 13 9-13z" strokeLinejoin="round" /><path d="M3 9h18" /><path d="M7.5 2L12 9l4.5-7" strokeLinejoin="round" /></>,
  jewellery: <><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" /><path d="M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" strokeLinecap="round" /></>,
  customers: <><circle cx="8.5" cy="9" r="2.8" /><circle cx="16" cy="10.5" r="2.2" /><path d="M3.5 19c1-2.6 2.9-4 5-4s4 1.4 5 4M13.5 18.5c.7-1.8 2-2.8 3.5-2.8s2.8 1 3.5 2.8" strokeLinecap="round" /></>,
  users: <><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20c0-3 3-5.5 6.5-5.5s6.5 2.5 6.5 5.5" /><path d="M16 4.5c1.2.8 2 2.2 2 3.5s-.8 2.7-2 3.5" strokeLinecap="round" /></>,
  affiliates: <><circle cx="8.5" cy="9" r="2.8" /><circle cx="16" cy="10.5" r="2.2" /><path d="M3.5 19c1-2.6 2.9-4 5-4s4 1.4 5 4" strokeLinecap="round" /></>,
  notifications: <><path d="M12 3a6 6 0 0 1 6 6v4l2 2H4l2-2V9a6 6 0 0 1 6-6z" /><path d="M9 17a3 3 0 0 0 6 0" /></>,
  audit: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M12 8v4M12 15h.01" strokeLinecap="round" /></>,
  links: <><path d="M10 14a4 4 0 0 1-1-5.6l2.5-3a4 4 0 0 1 5.6 0v0a4 4 0 0 1 0 5.6l-1.5 1.5" strokeLinecap="round" /><path d="M14 10a4 4 0 0 1 1 5.6l-2.5 3a4 4 0 0 1-5.6 0v0a4 4 0 0 1 0-5.6l1.5-1.5" strokeLinecap="round" /></>,
  earnings: <><path d="M12 2v20M6 6h9a3 3 0 0 1 0 6H5M7 12h8a3 3 0 0 1 0 6H6" strokeLinecap="round" strokeLinejoin="round" /></>,
  referrals: <><path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" /></>,
  profile: <><circle cx="12" cy="10" r="4" /><path d="M4 20c0-3 4-5 8-5s8 2 8 5" strokeLinecap="round" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 9h18" strokeLinecap="round" /></>,
  recommendation: <><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" strokeLinejoin="round" /></>,
  activity: <><path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" /></>,
  astroGemologist: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" /></>,
  sales: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" /><path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" /></>,
  leads: <><path d="M3 5h18l-7 8v6l-4-2v-4z" strokeLinejoin="round" /></>,
};

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Operate",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: ICONS.dashboard },
      { key: "orders", label: "Orders", href: "/orders", icon: ICONS.orders },
      { key: "energisation", label: "Energisation", href: "/energisation", icon: ICONS.energisation },
      { key: "consultations", label: "Consultations", href: "/consultations", icon: ICONS.consultations },
      { key: "leads", label: "Leads", href: "/leads", icon: ICONS.leads },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { key: "stones", label: "Stones", href: "/inventory?tab=stones", icon: ICONS.stones },
      { key: "jewellery", label: "Jewellery", href: "/inventory?tab=designs", icon: ICONS.jewellery },
      { key: "energisation-catalogue", label: "Energisation Packages", href: "/inventory?tab=energisation", icon: ICONS.packages },
    ],
  },
  {
    label: "People",
    items: [
      { key: "customers", label: "Customers", href: "/customers", icon: ICONS.customers },
      { key: "astro-gemologists", label: "Astro-Gemologists", href: "/astro-gemologists", icon: ICONS.astroGemologist },
      { key: "sales", label: "Sales Team", href: "/sales", icon: ICONS.sales },
      { key: "affiliates", label: "Affiliates", href: "/affiliates", icon: ICONS.affiliates },
    ],
  },
  {
    label: "Admin",
    items: [
      { key: "payments", label: "Payments", href: "/payments", icon: ICONS.payments },
      { key: "notification-settings", label: "Notification Settings", href: "/notification-settings", icon: ICONS.notifications },
    ],
  },
];

export const EXPERT_NAV: NavGroup[] = [
  {
    label: "Work",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/expert-dashboard", icon: ICONS.dashboard },
      { key: "appointments", label: "Appointments", href: "/appointments", icon: ICONS.calendar },
      { key: "availability", label: "Availability", href: "/availability", icon: ICONS.calendar },
      { key: "recommendations", label: "My Recommendations", href: "/recommendations", icon: ICONS.recommendation },
      { key: "expert-orders", label: "Orders", href: "/expert-orders", icon: ICONS.orders },
      { key: "payments", label: "Payments", href: "/expert-payments", icon: ICONS.payments },
    ],
  },
];

export const SALES_NAV: NavGroup[] = [
  {
    label: "Leads",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/sales-dashboard", icon: ICONS.dashboard },
      { key: "stone-leads", label: "Stone Leads", href: "/stone-leads", icon: ICONS.stones },
      { key: "consultation-leads", label: "Consultation Leads", href: "/consultation-leads", icon: ICONS.consultations },
    ],
  },
];

export const AFFILIATE_NAV: NavGroup[] = [
  {
    label: "Performance",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/aff-dashboard", icon: ICONS.dashboard },
      { key: "links", label: "Links", href: "/links", icon: ICONS.links },
      { key: "referrals", label: "Referrals", href: "/referrals", icon: ICONS.referrals },
      { key: "earnings", label: "Earnings", href: "/earnings", icon: ICONS.earnings },
    ],
  },
  {
    label: "Account",
    items: [
      { key: "profile", label: "Profile", href: "/profile", icon: ICONS.profile },
    ],
  },
];
