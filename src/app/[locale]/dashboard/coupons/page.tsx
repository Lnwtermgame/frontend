"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCoupons, useMyCoupons } from "@/lib/query/hooks";
import { claimCoupon } from "@/lib/api/dashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashErrorState, DashEmptyState, DashPageHead, formatDateTime } from "@/components/dashboard/shared";

function couponValue(c: {
  discountPercentage: number;
  discountAmount?: number;
}): string {
  if (c.discountAmount) return `${c.discountAmount} ฿`;
  return `${c.discountPercentage}%`;
}

export default function DashboardCouponsPage() {
  const t = useTranslations("dashboard");
  const coupons = useCoupons({ limit: 50 });
  const myCoupons = useMyCoupons();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (id: string) => {
    setClaimingId(id);
    try {
      await claimCoupon(id);
      coupons.refetch();
      myCoupons.refetch();
    } finally {
      setClaimingId(null);
    }
  };

  const claimedIds = new Set((myCoupons.data ?? []).map((c) => c.id));

  return (
    <div className="space-y-7">
      <section>
        <DashPageHead title={t("coupons")} description={t("couponsDesc")} />

        <div className="mt-3">
          {coupons.isLoading ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px] rounded-[14px]" />
              ))}
            </div>
          ) : coupons.isError ? (
            <DashErrorState onRetry={() => coupons.refetch()} />
          ) : !coupons.data?.data.length ? (
            <DashEmptyState title={t("emptyCoupons")} />
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {coupons.data.data.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-[14px] border border-border border-l-4 border-l-primary bg-card py-3 pl-4 pr-3 shadow-(--shadow-tile)"
                >
                  <span className="num min-w-14 text-center text-lg font-bold text-primary">
                    {couponValue(c)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="num text-sm font-bold">{c.code}</p>
                    {c.description ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.description}</p>
                    ) : null}
                    <p className="num mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(c.endDate)}
                    </p>
                  </div>
                  <Button
                    variant={claimedIds.has(c.id) ? "outline" : "default"}
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={claimedIds.has(c.id) || claimingId === c.id}
                    onClick={() => handleClaim(c.id)}
                  >
                    {claimedIds.has(c.id) ? t("claimed") : t("claim")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {myCoupons.data?.length ? (
        <section>
          <h2 className="text-sm font-bold text-muted-foreground">{t("claimed")}</h2>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {myCoupons.data.map((c) => (
              <div
                key={c.userCouponId ?? c.id}
                className={`flex items-center gap-3 rounded-[14px] border border-border border-l-4 border-l-primary/60 bg-card py-3 pl-4 pr-3 ${c.isUsed ? "opacity-50" : ""}`}
              >
                <span className="num min-w-14 text-center text-lg font-bold text-primary">
                  {couponValue(c)}
                </span>
                <span className="num min-w-0 flex-1 truncate text-sm font-bold">{c.code}</span>
                {c.isUsed ? (
                  <span className="text-xs font-semibold text-muted-foreground">{t("used")}</span>
                ) : (
                  <span className="num text-xs text-muted-foreground">
                    {formatDateTime(c.endDate)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
