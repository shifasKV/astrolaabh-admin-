"use client";
import { useMemo, useState } from "react";
import { PageHeader, Card, NotificationItem, Tabs, Pagination, EmptyState } from "@/components/ui";
import { getExpertNotifications } from "@/lib/expertNotifications";

const EXPERT_ID = "usr_expert_01";
const PER_PAGE = 10;

export default function ExpertNotificationsPage() {
  const all = useMemo(() => getExpertNotifications(EXPERT_ID), []);
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = all.filter((n) => (tab === "unread" ? !n.read : true));
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
              { key: "all", label: "All", count: all.length },
              { key: "unread", label: "Unread", count: all.filter((n) => !n.read).length },
            ]}
            active={tab}
            onChange={(k) => { setTab(k); setPage(1); }}
          />
        </div>

        <Card className="!p-0 md:flex md:flex-col md:min-h-0 overflow-hidden">
          <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
            {filtered.length === 0 ? (
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
