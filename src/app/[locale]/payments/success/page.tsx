"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { verifyPaymentPublic } from "@/lib/api/payments";

function SuccessInner() {
  const t = useTranslations("payments");
  const ts = useTranslations("support");
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const referenceNo = searchParams.get("referenceNo") ?? "";
  const [state, setState] = useState<"checking" | "ok" | "failed">("checking");
  /* param ขาด = failed ตั้งแต่ตอน render (derive) ไม่ต้อง setState ใน effect —
     ทั้งเร็วกว่าและไม่ทำ cascade render */
  const view = !orderId || !referenceNo ? "failed" : state;

  useEffect(() => {
    if (!orderId || !referenceNo) return;
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
      {view === "checking" ? (
        <>
          <Skeleton className="mx-auto size-16 rounded-full" />
          <p className="mt-4 text-sm text-muted-foreground" role="status">
            {t("checking")}
          </p>
        </>
      ) : view === "ok" ? (
        <>
          <h1 className="text-2xl font-bold text-status-success">{t("successTitle")}</h1>
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
          <h1 className="text-2xl font-bold text-destructive">{t("failedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("failedDesc")}</p>
          {/* ตายทางเดิมมีแค่ปุ่มกลับหน้าแรก — ผู้ใช้ที่จ่ายแล้วติดตรงนี้ต้องไปไล่คำสั่งซื้อ
              หรือเปิดตั๋วกับซัพพอร์ตต่อได้ทันที */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href={orderId ? `/dashboard/orders/${orderId}` : "/dashboard/orders"}>
                {t("viewOrder")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/support/tickets">{ts("reportIssue")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">{t("backHome")}</Link>
            </Button>
          </div>
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
