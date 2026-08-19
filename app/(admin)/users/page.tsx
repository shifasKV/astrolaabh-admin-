"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, GoldBtn, GhostBtn, Modal, Input, Select, Tabs, ToolbarSearch, Pagination, EmptyState, MobileListCard, Monogram } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS, MOCK_AFFILIATES, EXPERT_PROFILES } from "@/lib/mock";
import type { User } from "@/lib/types";
import * as V from "@/lib/validators";

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

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "expert", label: "Astro-Gemologist" },
  { value: "affiliate", label: "Affiliate" },
  { value: "customer", label: "Customer" },
];

export default function UsersPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "expert" });
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});
  const clearInviteErr = (k: string) => setInviteErrors((p) => (p[k] ? { ...p, [k]: "" } : p));
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<UnifiedUser | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [toast, setToast] = useState("");

  const openEdit = (u: UnifiedUser) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditStatus(u.status);
    setMenuFor(null);
  };
  const saveEdit = () => {
    setEditUser(null);
    setToast("User updated");
    setTimeout(() => setToast(""), 2500);
  };

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

  const PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader
        title="User management"
        action={<GoldBtn onClick={() => setShowModal(true)}>+ Invite user</GoldBtn>}
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

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <ToolbarSearch value={search} onChange={setSearch} placeholder="Search name or email…" />
      </div>

      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        <div
          className="hidden sm:grid grid-cols-[1fr_150px_100px_150px_44px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
          style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span>Last active</span>
          <span />
        </div>
        <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
        {filtered.length === 0 ? (
          <EmptyState inline icon="search" title="No users found" description="No users match your search." />
        ) : (
          paginated.map((u, i, arr) => (
            <div key={u.id}>
            <MobileListCard
              className="sm:hidden"
              href={u.href}
              leading={<Monogram name={u.name} />}
              title={u.name}
              sub={`${roleLabel(u.role)} · ${u.email}`}
              status={{
                label: u.status.replace(/^./, (ch) => ch.toUpperCase()),
                tone: u.status === "active" ? "good" : u.status === "suspended" ? "danger" : "muted",
              }}
              time={u.lastLoginAt}
            />
            <div
              className="hidden sm:grid sm:grid-cols-[1fr_150px_100px_150px_44px] gap-2 sm:gap-3 items-center px-4 py-2.5 even:bg-[rgba(89,82,54,0.025)] last:rounded-b-[15px]"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[12px] font-semibold shrink-0"
                  style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}`, color: T.accent }}
                >
                  {u.name.split(" ").map((w) => w[0]).slice(-2).join("")}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{u.name}</div>
                  <div className="text-[12px] truncate" style={{ color: T.muted }}>{u.email}</div>
                </div>
              </div>
              <div className="md:pl-0 pl-12"><Chip tone={roleTone(u.role)}>{roleLabel(u.role)}</Chip></div>
              <div className="md:pl-0 pl-12">
                <Chip tone={u.status === "active" ? "good" : u.status === "suspended" ? "danger" : "muted"}>{u.status}</Chip>
              </div>
              <span className="text-[12px] tabular-nums md:pl-0 pl-12" style={{ color: T.faint }}>{u.lastLoginAt ?? "—"}</span>
              <div className="relative flex justify-end md:pl-0 pl-12">
                <button
                  onClick={() => setMenuFor(menuFor === u.id ? null : u.id)}
                  aria-label="Edit user"
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.08)]"
                  style={{ border: `1px solid ${menuFor === u.id ? T.accentBorder : T.borderSoft}`, color: T.muted, background: menuFor === u.id ? T.accentFaint : "transparent" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                </button>
                {menuFor === u.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuFor(null)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-[170px] rounded-[12px] p-1.5" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
                      <button onClick={() => openEdit(u)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[12.5px] font-medium text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.10)]" style={{ color: T.text }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" style={{ color: T.muted }}><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></svg>
                        Edit role & status
                      </button>
                      {u.href && (
                        <Link href={u.href} onClick={() => setMenuFor(null)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[12.5px] font-medium text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.10)]" style={{ color: T.text }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" style={{ color: T.muted }}><path d="M7 17L17 7M17 7H9M17 7v8" /></svg>
                          Open profile
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            </div>
          ))
        )}
        </div>
      </Card>
      <Pagination page={currentPage - 1} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={(p) => setPage(p + 1)} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Invite user">
        <div className="space-y-4">
          <Input value={newUser.name} onChange={(v) => { setNewUser((p) => ({ ...p, name: v })); clearInviteErr("name"); }} onBlur={() => setInviteErrors((p) => ({ ...p, name: V.required(newUser.name, "Full name") }))} error={inviteErrors.name} label="Full name" placeholder="Name" />
          <Input value={newUser.email} onChange={(v) => { setNewUser((p) => ({ ...p, email: v })); clearInviteErr("email"); }} onBlur={() => setInviteErrors((p) => ({ ...p, email: V.email(newUser.email) }))} error={inviteErrors.email} label="Email" type="email" placeholder="email@astrolaabh.house" />
          <Select value={newUser.role} onChange={(v) => setNewUser((p) => ({ ...p, role: v }))} label="Role" options={ROLE_OPTIONS.filter((o) => o.value !== "customer")} />
          <div className="flex items-start gap-2.5 p-3 rounded-[10px]" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mt-px shrink-0" style={{ color: T.accent }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>
            <p className="text-[12px] leading-relaxed" style={{ color: T.muted }}>We&apos;ll email an invite link. The user sets their own password and lands on their dashboard — no password is created here.</p>
          </div>
          <div className="pt-1 flex items-center justify-end gap-2">
            <GhostBtn onClick={() => setShowModal(false)}>Cancel</GhostBtn>
            <GoldBtn
              onClick={() => {
                const e: Record<string, string> = {
                  name: V.required(newUser.name, "Full name"),
                  email: V.email(newUser.email),
                };
                setInviteErrors(e);
                if (!V.isClean(e)) return;
                const email = newUser.email.trim();
                setShowModal(false);
                setNewUser({ name: "", email: "", role: "expert" });
                setInviteErrors({});
                setToast(`Invite link sent to ${email}`);
                setTimeout(() => setToast(""), 3000);
              }}
            >
              Send invite
            </GoldBtn>
          </div>
        </div>
      </Modal>

      {/* Edit role & status */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit user">
        {editUser && (
          <>
            <div className="flex items-center gap-3.5 mb-5">
              <span className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[15px] font-semibold shrink-0" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>
                {editUser.name.split(" ").map((w) => w[0]).slice(-2).join("")}
              </span>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold" style={{ color: T.text }}>{editUser.name}</div>
                <div className="text-[12.5px] truncate" style={{ color: T.muted }}>{editUser.email}</div>
              </div>
            </div>
            <div className="space-y-4">
              <Select value={editRole} onChange={setEditRole} label="Role" options={ROLE_OPTIONS} />
              <div>
                <label className="block text-[11px] tracking-[0.12em] uppercase mb-1.5" style={{ color: T.faint }}>Status</label>
                <div className="flex gap-1.5">
                  {[
                    { value: "active", label: "Active", tone: T.good },
                    { value: "inactive", label: "Inactive", tone: T.faint },
                    { value: "suspended", label: "Suspended", tone: T.danger },
                  ].map((s) => {
                    const on = editStatus === s.value;
                    return (
                      <button
                        key={s.value}
                        onClick={() => setEditStatus(s.value)}
                        className="flex-1 h-9 rounded-[9px] text-[12.5px] font-medium cursor-pointer transition-colors"
                        style={on ? { background: `${s.tone}1e`, border: `1px solid ${s.tone}`, color: s.tone } : { background: T.bg, border: `1px solid ${T.border}`, color: T.muted }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-2.5 mt-6">
              <GoldBtn onClick={saveEdit}>Save changes</GoldBtn>
              <GhostBtn onClick={() => setEditUser(null)}>Cancel</GhostBtn>
            </div>
          </>
        )}
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] text-[13.5px] font-medium" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good, boxShadow: T.shadowLift }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
      </div>
    </>
  );
}
