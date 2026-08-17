"use client";
import { PageHeader, Card, NotificationItem, Tabs, Pagination, TableSkeleton } from "@/components/ui";
import { useState, useEffect } from "react";
import { T } from "@/lib/theme";
import { MOCK_NOTIFICATIONS } from "@/lib/mock";

const PER_PAGE = 8;

export default function NotificationsPage() {
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []);

  const filtered = MOCK_NOTIFICATIONS.filter((n) => {
    if (tab === "unread") return !n.read;
    return true;
  });

  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <>
      <PageHeader title="Notifications" sub="In-app alerts for assignments, exceptions, and important updates" />

      <div className="mb-4">
        <Tabs
          tabs={[
            { key: "all", label: "All", count: MOCK_NOTIFICATIONS.length },
            { key: "unread", label: "Unread", count: MOCK_NOTIFICATIONS.filter((n) => !n.read).length },
          ]}
          active={tab}
          onChange={(k) => { setTab(k); setPage(0); }}
        />
      </div>

      {loading ? (
        <Card className="!p-0 overflow-hidden"><TableSkeleton rows={5} cols={3} /></Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-[13.5px] text-center py-8" style={{ color: T.muted }}>No notifications.</p>
          ) : (
            paged.map((n) => (
              <NotificationItem
                key={n.id}
                title={n.title}
                description={n.description}
                time={n.time}
                read={n.read}
              />
            ))
          )}
          {filtered.length > PER_PAGE && (
            <div className="px-4 pb-4">
              <Pagination page={page} totalPages={Math.ceil(filtered.length / PER_PAGE)} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
            </div>
          )}
        </Card>
      )}
    </>
  );
}
