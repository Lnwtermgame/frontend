"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCreditBalance, useCreditTransactions } from "@/lib/query/hooks";
import { formatTHB } from "@/lib/pricing";
import { Skeleton } from "@/components/ui/skeleton";
import { Pager, DashErrorState, DashEmptyState, formatDateTime } from "@/components/dashboard/shared";

export default function DashboardCreditsPage() {
  const t = useTranslations("dashboard");
  const [page, setPage] = useState(1);
  const balance = useCreditBalance();
  const tx = useCreditTransactions({ page, limit: 10 });

  return (
    <div className="space-y-6">
      <div className="rounded-[14px] border bg-card p-6">
        <p className="text-sm font-semibold text-muted-foreground">{t("creditBalance")}</p>
        {balance.isLoading ? (
          <Skeleton className="mt-2 h-9 w-32" />
        ) : balance.isError ? (
          <p className="mt-2 text-sm text-destructive">{t("error")}</p>
        ) : (
          <p className="num mt-2 text-3xl font-extrabold text-primary">
            {formatTHB(balance.data?.balance ?? 0)}
          </p>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-base font-bold">{t("credits")}</h2>
        {tx.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-[10px]" />
            ))}
          </div>
        ) : tx.isError ? (
          <DashErrorState onRetry={() => tx.refetch()} />
        ) : !tx.data?.data.length ? (
          <DashEmptyState title={t("emptyCredits")} />
        ) : (
          <div className="space-y-2">
            {tx.data.data.map((item) => {
              const positive = item.type === "TOPUP" || item.type === "REFUND" || item.type === "BONUS";
              const typeKey = `type_${item.type}` as const;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-[10px] border bg-card p-3 text-sm"
                >
                  <div>
                    <p className="font-semibold">{t(typeKey as never)}</p>
                    {item.description ? (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                    <p className="num text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`num ml-auto font-bold ${
                      positive ? "text-status-success" : "text-foreground"
                    }`}
                  >
                    {positive ? "+" : "−"}
                    {formatTHB(Math.abs(item.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!tx.isLoading && !tx.isError && tx.data?.meta ? (
          <Pager
            page={tx.data.meta.page}
            totalPages={tx.data.meta.totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        ) : null}
      </section>
    </div>
  );
}
