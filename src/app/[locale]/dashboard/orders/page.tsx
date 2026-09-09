"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useOrders } from "@/lib/query/hooks";
import type { OrderStatus } from "@/lib/api/orders";
import { formatTHB } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, Pager, DashErrorState, DashEmptyState, formatDateTime } from "@/components/dashboard/shared";

const FILTERS: Array<{ key: string; value: OrderStatus | undefined }> = [
  { key: "all", value: undefined },
  { key: "status_PENDING", value: "PENDING" },
  { key: "status_PROCESSING", value: "PROCESSING" },
  { key: "status_COMPLETED", value: "COMPLETED" },
  { key: "status_CANCELLED", value: "CANCELLED" },
];

export default function DashboardOrdersPage() {
  const t = useTranslations("dashboard");
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const [page, setPage] = useState(1);

  const orders = useOrders({ status, page, limit: 10 });

  return (
    <div>
      <h1 className="text-xl font-bold">{t("orders")}</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={status === f.value ? "default" : "outline"}
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
          >
            {t(f.key as never)}
          </Button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {orders.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-[14px]" />
          ))
        ) : orders.isError ? (
          <DashErrorState onRetry={() => orders.refetch()} />
        ) : !orders.data?.data.length ? (
          <DashEmptyState title={t("emptyOrders")} description={t("emptyOrdersDesc")} />
        ) : (
          orders.data.data.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/orders/${order.id}`}
              className="block rounded-[14px] border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="num text-sm font-bold">{order.orderNumber}</span>
                <StatusBadge status={order.status} />
                <span className="num ml-auto text-base font-bold text-primary">
                  {formatTHB(order.finalAmount)}
                </span>
              </div>
              <p className="num mt-1 text-xs text-muted-foreground">
                {formatDateTime(order.createdAt)} · {order.items.length} {t("items")}
              </p>
            </Link>
          ))
        )}
      </div>

      {!orders.isLoading && !orders.isError && orders.data?.meta ? (
        <Pager
          page={orders.data.meta.page}
          totalPages={orders.data.meta.totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}
    </div>
  );
}
