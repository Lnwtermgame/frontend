"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCreditBalance, useCreditTransactions } from "@/lib/query/hooks";
import { formatTHB } from "@/lib/pricing";
import { Skeleton } from "@/components/ui/skeleton";
import { Pager, DashErrorState, DashEmptyState, DashPageHead, formatDateTime } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";

/* ผัง "แผงคู่" (mockup D · credits-directions) — แผงซ้ายตรึง: ยอด + เข้า/ออกล่าสุด + เครดิตคืออะไร
 * ขวา: รายการเข้า–ออก แถว PURCHASE ที่มี referenceId เป็นลิงก์เข้าออเดอร์ได้ (backend ส่งมาแล้ว)
 * เข้า/ออกล่าสุดคำนวณ client จากหน้าแรกของรายการ (เรียงใหม่ล่าสุดอยู่แล้ว) */

export default function DashboardCreditsPage() {
  const t = useTranslations("dashboard");
  const [page, setPage] = useState(1);
  const balance = useCreditBalance();
  const tx = useCreditTransactions({ page, limit: 10 });

  const rows = tx.data?.data ?? [];
  const lastIn = rows.find((r) => r.amount > 0);
  const lastOut = rows.find((r) => r.amount < 0);

  return (
    <div className="space-y-4">
      <DashPageHead title={t("credits")} description={t("creditsDesc")} />

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[288px_minmax(0,1fr)]">
        {/* แผงซ้าย — ตรึงบน desktop */}
        <aside className="flex min-w-0 flex-col gap-3 md:sticky md:top-20">
          <div className="rounded-[14px] border bg-card p-4">
            <p className="text-[11.5px] font-bold tracking-wide text-muted-foreground">
              {t("creditBalance")}
            </p>
            {balance.isLoading ? (
              <Skeleton className="mt-2 h-9 w-32" />
            ) : balance.isError ? (
              <p className="mt-2 text-sm font-semibold text-destructive">{t("error")}</p>
            ) : (
              <p className="num mt-2 text-3xl font-extrabold leading-tight text-primary">
                {formatTHB(balance.data?.balance ?? 0)}
              </p>
            )}
            <p className="mt-2 text-[12.5px] text-muted-foreground">{t("currencyNote")}</p>

            {!tx.isLoading && rows.length ? (
              <div className="mt-3 space-y-1.5 border-t border-dashed pt-3 text-[12.5px]">
                {lastIn ? (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-muted-foreground">{t("lastIn")}</span>
                    <span className="num font-bold text-status-success">
                      +{formatTHB(lastIn.amount)}
                    </span>
                  </div>
                ) : null}
                {lastOut ? (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-muted-foreground">{t("lastOut")}</span>
                    <span className="num font-bold">−{formatTHB(Math.abs(lastOut.amount))}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-[14px] border bg-card p-4">
            <p className="text-[11.5px] font-bold tracking-wide text-muted-foreground">
              {t("whatIsCredit")}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              {t("whatIsCreditDesc")}
            </p>
          </div>
        </aside>

        {/* รายการเข้า–ออก */}
        <section className="min-w-0" aria-label={t("credits")}>
          {tx.isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[62px] rounded-[14px]" />
              ))}
            </div>
          ) : tx.isError ? (
            <DashErrorState onRetry={() => tx.refetch()} />
          ) : !rows.length ? (
            <DashEmptyState title={t("emptyCredits")} description={t("emptyCreditsDesc")} />
          ) : (
            <div className="space-y-2.5">
              {rows.map((item) => {
                const positive =
                  item.type === "TOPUP" || item.type === "REFUND" || item.type === "BONUS";
                const typeKey = `type_${item.type}` as never;
                const row = (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{t(typeKey)}</p>
                      {item.description ? (
                        <p className="break-words text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={cn(
                          "num block text-[15px] font-bold",
                          positive ? "text-status-success" : "text-foreground",
                        )}
                      >
                        {positive ? "+" : "−"}
                        {formatTHB(Math.abs(item.amount))}
                      </span>
                      <span className="num mt-0.5 block text-[11.5px] text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                  </>
                );
                const rowClass =
                  "flex items-center gap-3 rounded-[14px] border bg-card px-4 py-3 text-sm";
                return item.referenceId ? (
                  <Link
                    key={item.id}
                    href={`/dashboard/orders/${item.referenceId}`}
                    className={cn(rowClass, "transition-colors hover:border-primary/50")}
                  >
                    {row}
                  </Link>
                ) : (
                  <div key={item.id} className={rowClass}>
                    {row}
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
    </div>
  );
}
