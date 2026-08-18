"use client";
import { PageHeader, Card, NotificationItem, Tabs, Pagination, EmptyState, TableSkeleton } from "@/components/ui";
import { useState } from "react";
import { T } from "@/lib/theme";
import { MOCK_NOTIFICATIONS } from "@/lib/mock";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";

export default function NotificationsPage() {
  const loading = useSimulatedLoad();
  const [tab, setTab] = useState("all");

  const filtered = MOCK_NOTIFICATIONS.filter((n) => {
    if (tab === "unread") return !n.read;
    return true;
  });

  const PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader title="Notifications" />

      <div className="mb-4">
        <Tabs
          tabs={[
            { key: "all", label: "All", count: MOCK_NOTIFICATIONS.length },
            { key: "unread", label: "Unread", count: MOCK_NOTIFICATIONS.filter((n) => !n.read).length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <Card className="!p-0 md:flex md:flex-col md:min-h-0 overflow-hidden">
        <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
        {loading ? (
          <TableSkeleton cols={2} rows={8} />
        ) : filtered.length === 0 ? (
          <EmptyState inline icon="check" title="You're all caught up" description="New notifications will show up here." />
        ) : (
          paginated.map((n) => (
            <NotificationItem
              key={n.id}
              title={n.title}
              description={n.description}
              time={n.time}
              read={n.read}
              href={n.linkTo}
            />
          ))
        )}
        </div>
      </Card>
      <Pagination page={currentPage - 1} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={(p) => setPage(p + 1)} />
      </div>
    </>
  );
}
