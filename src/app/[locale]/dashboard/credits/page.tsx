"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCreditBalance, useCreditTransactions } from "@/lib/query/hooks";
import { formatTHB } from "@/lib/pricing";
import { Skeleton } from "@/components/ui/skeleton";
import { Pager, DashErrorState, DashEmptyState, DashPageHead, formatDateTime } from "@/components/dashboard/shared";

export default function DashboardCreditsPage() {
  const t = useTranslations("dashboard");
  const [page, setPage] = useState(1);
  const balance = useCreditBalance();
  const tx = useCreditTransactions({ page, limit: 10 });

  return (
    <div className="space-y-3">
      <DashPageHead title={t("credits")} description={t("creditsDesc")} />

      <div className="flex items-baseline gap-2 rounded-[14px] border bg-card px-4 py-3">
        <span className="text-[13px] font-semibold text-muted-foreground">{t("creditBalance")}</span>
        {balance.isLoading ? (
          <Skeleton className="h-6 w-24" />
        ) : balance.isError ? (
          <span className="text-sm font-semibold text-destructive">{t("error")}</span>
        ) : (
          <span className="num ml-auto text-xl font-bold text-primary">
            {formatTHB(balance.data?.balance ?? 0)}
          </span>
        )}
      </div>

      <section>
        {tx.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[58px] rounded-[14px]" />
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
                  className="flex items-center gap-3 rounded-[14px] border bg-card px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{t(typeKey as never)}</p>
                    <p className="num text-xs text-muted-foreground">
                      {item.description ? `${item.description} · ` : ""}
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`num ml-auto shrink-0 font-bold ${
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
