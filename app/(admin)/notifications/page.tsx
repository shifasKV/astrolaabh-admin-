"use client";
import { PageHeader, Card, NotificationItem, Tabs } from "@/components/ui";
import { useState } from "react";
import { T } from "@/lib/theme";
import { MOCK_NOTIFICATIONS } from "@/lib/mock";

export default function NotificationsPage() {
  const [tab, setTab] = useState("all");

  const filtered = MOCK_NOTIFICATIONS.filter((n) => {
    if (tab === "unread") return !n.read;
    return true;
  });

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
          onChange={setTab}
        />
      </div>

      <Card className="!p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-[13px] text-center py-8" style={{ color: T.muted }}>No notifications.</p>
        ) : (
          filtered.map((n) => (
            <NotificationItem
              key={n.id}
              title={n.title}
              description={n.description}
              time={n.time}
              read={n.read}
            />
          ))
        )}
      </Card>
    </>
  );
}
