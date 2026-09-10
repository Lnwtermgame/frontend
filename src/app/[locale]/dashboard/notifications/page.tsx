"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCheck, Trash2, Bell, Package, Tag, Megaphone, SlidersHorizontal } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/lib/query/hooks";
import { markNotificationRead, markAllNotificationsRead, deleteNotification } from "@/lib/api/account";
import type { NotificationType } from "@/lib/api/account";
import { Pager, DashErrorState, DashEmptyState, DashPageHead, formatDateTime } from "@/components/dashboard/shared";

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  ORDER: Package,
  PAYMENT: Tag,
  PROMOTION: Megaphone,
  SYSTEM: Bell,
};

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
    <div className="space-y-3">
      <DashPageHead
        title={t("notifications")}
        description={t("notificationsDesc")}
        actions={
          <>
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
              {t("markAllRead")}
            </Button>
          </>
        }
      />

      <div className="space-y-2">
        {notifs.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[64px] rounded-[14px]" />
          ))
        ) : notifs.isError ? (
          <DashErrorState onRetry={() => notifs.refetch()} />
        ) : !notifs.data?.data.length ? (
          <DashEmptyState title={t("emptyNotifications")} description={t("emptyNotificationsDesc")} />
        ) : (
          notifs.data.data.map((item) => {
            const Icon = TYPE_ICON[item.type] ?? Bell;
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-[14px] border bg-card px-4 py-3 ${
                  item.isRead ? "opacity-70" : ""
                }`}
              >
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] bg-secondary text-muted-foreground">
                  <Icon className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!item.isRead ? (
                      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
                    ) : null}
                    <p className={`truncate text-sm ${item.isRead ? "font-semibold" : "font-bold"}`}>
                      {item.title}
                    </p>
                    <span className="num ml-auto shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.message}</p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {!item.isRead ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleMarkRead(item.id)}
                    >
                      {t("markRead")}
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("deleteNotification")}
                    className="h-7 w-7 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
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
