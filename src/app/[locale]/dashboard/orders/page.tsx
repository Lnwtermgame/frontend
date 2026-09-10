"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useOrders, useOrderCounts } from "@/lib/query/hooks";
import type { Order, OrderStatus } from "@/lib/api/orders";
import { formatTHB } from "@/lib/pricing";
import { Skeleton } from "@/components/ui/skeleton";
import { GameCover } from "@/components/product/game-cover";
import { StatusBadge, Pager, DashErrorState, DashEmptyState, DashPageHead, formatDateTime } from "@/components/dashboard/shared";

const FILTERS: Array<{ key: string; value: OrderStatus | undefined }> = [
  { key: "all", value: undefined },
  { key: "status_PENDING", value: "PENDING" },
  { key: "status_PROCESSING", value: "PROCESSING" },
  { key: "status_COMPLETED", value: "COMPLETED" },
  { key: "status_CANCELLED", value: "CANCELLED" },
];

function uidLine(order: Order): string {
  const vals: string[] = [];
  for (const item of order.items) {
    if (!item.playerInfo) continue;
    for (const v of Object.values(item.playerInfo)) {
      if (typeof v === "string" && v.trim()) vals.push(v.trim());
      if (vals.length >= 2) return vals.join(" · ");
    }
  }
  return vals.join(" · ");
}

export default function DashboardOrdersPage() {
  const t = useTranslations("dashboard");
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const [page, setPage] = useState(1);

  const orders = useOrders({ status, page, limit: 10 });
  const counts = useOrderCounts();

  return (
    <div>
      <DashPageHead
        title={t("ordersMy")}
        description={t("ordersDesc")}
        actions={
          <Link href="/dashboard/coupons" className="text-[13px] font-semibold text-primary hover:underline">
            {t("claimCoupons")} →
          </Link>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = status === f.value;
          const count =
            f.value === undefined
              ? counts.all
              : (counts as Partial<Record<OrderStatus, number | undefined>>)[f.value];
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setStatus(f.value);
                setPage(1);
              }}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
              }`}
            >
              {t(f.key as never)}
              {typeof count === "number" ? (
                <span className="num ml-1.5 text-[11px] opacity-70">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3.5 space-y-2.5">
        {orders.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[78px] rounded-[14px]" />
          ))
        ) : orders.isError ? (
          <DashErrorState onRetry={() => orders.refetch()} />
        ) : !orders.data?.data.length ? (
          <DashEmptyState title={t("emptyOrders")} description={t("emptyOrdersDesc")} />
        ) : (
          orders.data.data.map((order) => {
            const first = order.items[0];
            const extra = order.items.length - 1;
            const uid = uidLine(order);
            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center gap-3.5 rounded-[14px] border bg-card p-3 pr-4 shadow-(--shadow-tile) transition-colors hover:border-primary/50"
              >
                <div className="w-[52px] shrink-0">
                  <GameCover
                    name={first?.product?.name ?? "?"}
                    imageUrl={first?.product?.imageUrl}
                    fallbackSub={first?.productType?.name ?? "TOP-UP"}
                    sizes="52px"
                    compact
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {first?.product?.name ?? order.orderNumber}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {first?.productType?.name ?? "—"}
                    <span className="num"> ×{first?.quantity ?? 1}</span>
                    {extra > 0 ? (
                      <span className="ml-1 font-semibold text-primary">
                        {t("moreItems", { count: extra })}
                      </span>
                    ) : null}
                  </p>
                  {uid ? (
                    <p className="num mt-0.5 truncate text-[11px] text-muted-foreground/80">{uid}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3.5 text-right">
                  <div>
                    <StatusBadge status={order.status} />
                    <span className="num mt-0.5 block text-[11px] text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>
                  <span className="num text-[15px] font-bold text-primary">
                    {formatTHB(order.finalAmount)}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </div>
              </Link>
            );
          })
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
