"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useOrders } from "@/lib/query/hooks";
import type { OrderStatus } from "@/lib/api/orders";
import { formatTHB } from "@/lib/pricing";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, Pager, DashErrorState, DashEmptyState, DashPageHead, formatDateTime } from "@/components/dashboard/shared";

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
      <DashPageHead title={t("orders")} description={t("ordersDesc")} />

      <div className="mt-3 flex flex-wrap gap-x-1 gap-y-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setStatus(f.value);
              setPage(1);
            }}
            aria-pressed={status === f.value}
            className={`rounded-[8px] px-2.5 py-1 text-[13px] font-semibold transition-colors ${
              status === f.value
                ? "bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-card hover:text-foreground"
            }`}
          >
            {t(f.key as never)}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {orders.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px] rounded-[14px]" />
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
              className="block rounded-[14px] border bg-card px-4 py-3 transition-colors hover:border-primary/50"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="num text-sm font-bold">{order.orderNumber}</span>
                <StatusBadge status={order.status} />
                <span className="num ml-auto text-[15px] font-bold text-primary">
                  {formatTHB(order.finalAmount)}
                </span>
              </div>
              <p className="num mt-0.5 text-xs text-muted-foreground">
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
