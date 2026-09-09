"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/routing";
import { verifyPaymentPublic } from "@/lib/api/payments";

function SuccessInner() {
  const t = useTranslations("payments");
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const referenceNo = searchParams.get("referenceNo") ?? "";
  const [state, setState] = useState<"checking" | "ok" | "failed">("checking");

  useEffect(() => {
    if (!orderId || !referenceNo) {
      setState("failed");
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        // Reconcile server-side, then read status. Retry briefly while PENDING —
        // the webhook may land a moment after the browser redirect.
        for (let attempt = 0; attempt < 6; attempt++) {
          const result = await verifyPaymentPublic(orderId, referenceNo);
          if (result.status === "COMPLETED") {
            if (!cancelled) setState("ok");
            return;
          }
          if (!cancelled) setState("checking");
          await new Promise((r) => setTimeout(r, 2500));
        }
        if (!cancelled) setState("failed");
      } catch {
        if (!cancelled) setState("failed");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [orderId, referenceNo]);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
      {state === "checking" ? (
        <>
          <Skeleton className="mx-auto size-16 rounded-full" />
          <p className="mt-4 text-sm text-muted-foreground" role="status">
            {t("checking")}
          </p>
        </>
      ) : state === "ok" ? (
        <>
          <h1 className="text-2xl font-extrabold text-status-success">{t("successTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("successDesc")}</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild>
              <Link href="/dashboard/orders">{t("myOrders")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">{t("backHome")}</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold text-destructive">{t("failedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("failedDesc")}</p>
          <Button className="mt-6" onClick={() => router.push("/")}>
            {t("backHome")}
          </Button>
        </>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessInner />
    </Suspense>
  );
}
