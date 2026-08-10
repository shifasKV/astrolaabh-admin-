"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, GoldBtn, Modal, Input, Select, Tabs, SearchFilter } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS, MOCK_AFFILIATES, EXPERT_PROFILES } from "@/lib/mock";
import type { User } from "@/lib/types";

const MOCK_ADMINS: User[] = [
  { id: "usr_admin_01", name: "Ops Admin", email: "ops@astrolaabh.house", role: "admin", status: "active", lastLoginAt: "2026-08-07 09:00", createdAt: "2025-10-01", createdBy: "System" },
];

interface UnifiedUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "expert" | "affiliate" | "customer";
  status: "active" | "inactive" | "suspended";
  lastLoginAt?: string;
  href?: string;
}

function buildUnifiedList(): UnifiedUser[] {
  const admins: UnifiedUser[] = MOCK_ADMINS.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: "admin" as const,
    status: u.status as "active" | "inactive" | "suspended",
    lastLoginAt: u.lastLoginAt,
  }));

  const experts: UnifiedUser[] = EXPERT_PROFILES.map((ep) => ({
    id: ep.id,
    name: ep.name,
    email: `${ep.name.split(" ").pop()?.toLowerCase()}@astrolaabh.house`,
    role: "expert" as const,
    status: ep.status === "active" ? "active" as const : "inactive" as const,
    href: `/astro-gemologists/${ep.id}`,
  }));

  const affiliates: UnifiedUser[] = MOCK_AFFILIATES.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: "affiliate" as const,
    status: a.status === "active" ? "active" as const : a.status === "under_review" ? "suspended" as const : "inactive" as const,
    href: `/affiliates/${a.id}`,
  }));

  const customers: UnifiedUser[] = MOCK_CUSTOMERS.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    role: "customer" as const,
    status: "active" as const,
    href: `/customers/${c.id}`,
  }));

  return [...admins, ...experts, ...affiliates, ...customers];
}

const TABS = [
  { key: "all", label: "All" },
  { key: "customer", label: "Customers" },
  { key: "expert", label: "Astro-Gemologists" },
  { key: "affiliate", label: "Affiliates" },
  { key: "admin", label: "Admins" },
];

export default function UsersPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "expert" });

  const allUsers = buildUnifiedList();

  const filtered = allUsers
    .filter((u) => tab === "all" || u.role === tab)
    .filter((u) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

  const roleTone = (role: string) => {
    if (role === "admin") return "gold" as const;
    if (role === "expert") return "good" as const;
    if (role === "affiliate") return "muted" as const;
    return undefined;
  };

  const roleLabel = (role: string) => {
    if (role === "expert") return "Astro-Gemologist";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <>
      <PageHeader
        title="User management"
        sub="All users across the platform — customers, experts, affiliates, and admins"
        action={<GoldBtn onClick={() => setShowModal(true)}>+ Add user</GoldBtn>}
      />

      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => ({
            ...t,
            count: allUsers.filter((u) => t.key === "all" || u.role === t.key).length,
          }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search name or email…" />
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="text-[13px] text-center py-6" style={{ color: T.muted }}>No users found.</p>
        ) : (
          filtered.map((u) => {
            const inner = (
              <div className="flex flex-wrap items-center justify-between gap-3 py-3.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
                      style={{ background: T.panel, border: `1px solid ${T.border}`, color: T.accent }}
                    >
                      {u.name[0]}
                    </span>
                    <div>
                      <div className="text-[13.5px] font-medium" style={{ color: T.text }}>{u.name}</div>
                      <div className="text-[12px]" style={{ color: T.muted }}>{u.email}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <Chip tone={roleTone(u.role)}>{roleLabel(u.role)}</Chip>
                  <Chip tone={u.status === "active" ? "good" : u.status === "suspended" ? "danger" : "muted"}>
                    {u.status}
                  </Chip>
                  {u.lastLoginAt && <span className="text-[11px]" style={{ color: T.faint }}>Last: {u.lastLoginAt}</span>}
                  {u.href && <span style={{ color: T.faint }}>→</span>}
                </div>
              </div>
            );

            if (u.href) {
              return (
                <Link key={u.id} href={u.href} className="block row-interactive rounded-[9px]">
                  {inner}
                </Link>
              );
            }
            return <div key={u.id}>{inner}</div>;
          })
        )}
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add user">
        <div className="space-y-4">
          <Input value={newUser.name} onChange={(v) => setNewUser((p) => ({ ...p, name: v }))} label="Full name" placeholder="Name" />
          <Input value={newUser.email} onChange={(v) => setNewUser((p) => ({ ...p, email: v }))} label="Email" type="email" placeholder="email@astrolaabh.house" />
          <Select value={newUser.role} onChange={(v) => setNewUser((p) => ({ ...p, role: v }))} label="Role" options={[{ value: "admin", label: "Admin" }, { value: "expert", label: "Astro-Gemologist" }, { value: "affiliate", label: "Affiliate" }]} />
          <div className="pt-2">
            <GoldBtn onClick={() => setShowModal(false)}>Create user</GoldBtn>
          </div>
        </div>
      </Modal>
    </>
  );
}
