"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCoupons, useMyCoupons } from "@/lib/query/hooks";
import { claimCoupon } from "@/lib/api/dashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashErrorState, DashEmptyState, formatDateTime } from "@/components/dashboard/shared";

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
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 text-xl font-bold">{t("coupons")}</h1>

        {coupons.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-[14px]" />
            ))}
          </div>
        ) : coupons.isError ? (
          <DashErrorState onRetry={() => coupons.refetch()} />
        ) : !coupons.data?.data.length ? (
          <DashEmptyState title={t("emptyCoupons")} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {coupons.data.data.map((c) => (
              <div key={c.id} className="rounded-[14px] border bg-card p-4">
                <div className="flex items-center gap-3">
                  <span className="num rounded-[10px] bg-primary/10 px-3 py-1.5 text-lg font-bold text-primary">
                    {couponValue(c)}
                  </span>
                  <span className="num text-sm font-bold">{c.code}</span>
                </div>
                {c.description ? (
                  <p className="mt-2 text-xs text-muted-foreground">{c.description}</p>
                ) : null}
                <p className="num mt-1 text-xs text-muted-foreground">
                  {formatDateTime(c.endDate)}
                </p>
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  disabled={claimedIds.has(c.id) || claimingId === c.id}
                  onClick={() => handleClaim(c.id)}
                >
                  {claimedIds.has(c.id) ? t("claimed") : t("claim")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {myCoupons.data?.length ? (
        <section>
          <h2 className="mb-3 text-base font-bold">{t("claimed")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {myCoupons.data.map((c) => (
              <div
                key={c.userCouponId ?? c.id}
                className={`rounded-[14px] border bg-card p-4 ${c.isUsed ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="num rounded-[10px] bg-primary/10 px-3 py-1.5 text-lg font-bold text-primary">
                    {couponValue(c)}
                  </span>
                  <span className="num text-sm font-bold">{c.code}</span>
                  {c.isUsed ? (
                    <span className="ml-auto text-xs font-semibold text-muted-foreground">
                      {t("used")}
                    </span>
                  ) : null}
                </div>
                <p className="num mt-1 text-xs text-muted-foreground">
                  {formatDateTime(c.endDate)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
