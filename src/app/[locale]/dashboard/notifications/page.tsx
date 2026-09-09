"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCheck, Trash2, Bell, SlidersHorizontal } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/lib/query/hooks";
import { markNotificationRead, markAllNotificationsRead, deleteNotification } from "@/lib/api/account";
import { Pager, DashErrorState, DashEmptyState, formatDateTime } from "@/components/dashboard/shared";

export default function DashboardNotificationsPage() {
  const t = useTranslations("dashboard");
  const [page, setPage] = useState(1);
  const notifs = useNotifications({ page, limit: 15 });

  const [acting, setActing] = useState(false);

  const handleMarkAllRead = async () => {
    setActing(true);
    try {
      await markAllNotificationsRead();
      notifs.refetch();
    } finally {
      setActing(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      notifs.refetch();
    } catch {
      // noop
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      notifs.refetch();
    } catch {
      // noop
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{t("notifications")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">รายการแจ้งเตือนการสั่งซื้อและข่าวสาร</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
            <Link href="/dashboard/notifications/preferences">
              <SlidersHorizontal className="size-3.5" />
              {t("notificationPreferences")}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={acting || !notifs.data?.data.length}
            onClick={handleMarkAllRead}
            className="gap-1.5 text-xs"
          >
            <CheckCheck className="size-3.5" />
            อ่านทั้งหมด
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {notifs.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-[14px]" />
          ))
        ) : notifs.isError ? (
          <DashErrorState onRetry={() => notifs.refetch()} />
        ) : !notifs.data?.data.length ? (
          <DashEmptyState title="ยังไม่มีการแจ้งเตือน" description="การอัปเดตคำสั่งซื้อจะปรากฏที่นี่" />
        ) : (
          notifs.data.data.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-[14px] border p-4 transition-colors ${
                item.isRead ? "bg-card/50 opacity-80" : "bg-card border-primary/40 shadow-(--shadow-tile)"
              }`}
            >
              <div
                className={`mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full ${
                  item.isRead ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
                }`}
              >
                <Bell className="size-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate">{item.title}</p>
                  <span className="num shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.message}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!item.isRead ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleMarkRead(item.id)}
                  >
                    อ่านแล้ว
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {!notifs.isLoading && !notifs.isError && notifs.data?.meta ? (
        <Pager
          page={notifs.data.meta.page}
          totalPages={notifs.data.meta.totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}
    </div>
  );
}
