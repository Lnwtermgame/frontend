"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/routing";
import { getPaymentStatus } from "@/lib/api/payments";
import { cancelOrder } from "@/lib/api/orders";

const POLL_MS = 5000;
const EXPIRY_MS = 15 * 60_000;

function PendingInner() {
  const t = useTranslations("payments");
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const referenceNo = searchParams.get("referenceNo") ?? "";
  const [expired, setExpired] = useState(false);
  const [remainSec, setRemainSec] = useState(EXPIRY_MS / 1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const qr = typeof window !== "undefined" ? sessionStorage.getItem(`qr_${orderId}`) : null;

  useEffect(() => {
    if (!orderId) return;
    const deadline = Date.now() + EXPIRY_MS;
    const countdown = setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemainSec(left);
      if (left <= 0) {
        setExpired(true);
        cancelOrder(orderId).catch(() => {});
      }
    }, 1000);

    const poll = setInterval(async () => {
      try {
        const status = await getPaymentStatus(orderId);
        if (status.status === "COMPLETED" || status.status === "PROCESSING") {
          clearInterval(poll);
          clearInterval(countdown);
          if (timerRef.current) clearInterval(timerRef.current);
          router.push(`/payments/success?orderId=${orderId}&referenceNo=${referenceNo}`);
        }
        if (status.status === "FAILED" || status.status === "REFUNDED") {
          clearInterval(poll);
          clearInterval(countdown);
          setExpired(true);
        }
      } catch {
        // transient poll error — keep polling
      }
    }, POLL_MS);

    timerRef.current = poll;
    return () => {
      clearInterval(poll);
      clearInterval(countdown);
    };
  }, [orderId, referenceNo, router]);

  const mm = String(Math.floor(remainSec / 60)).padStart(2, "0");
  const ss = String(remainSec % 60).padStart(2, "0");

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 text-center">
      <h1 className="text-xl font-bold">{expired ? t("expiredTitle") : t("pendingTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {expired ? t("expiredDesc") : t("pendingDesc")}
      </p>

      {!expired && qr ? (
        <div className="mx-auto mt-6 w-64 rounded-[14px] border bg-card p-4 shadow-(--shadow-tile)">
          <Image
            src={qr}
            alt="PromptPay QR"
            width={232}
            height={232}
            unoptimized
            className="mx-auto"
          />
        </div>
      ) : !expired ? (
        <Skeleton className="mx-auto mt-6 size-64 rounded-[14px]" />
      ) : null}

      {!expired ? (
        <>
          <p className="num mt-4 text-sm text-muted-foreground" role="status">
            {t("checking")} · {mm}:{ss}
          </p>
          {referenceNo ? (
            <p className="num mt-1 text-xs text-muted-foreground">REF: {referenceNo}</p>
          ) : null}
        </>
      ) : (
        <Button className="mt-6" onClick={() => router.push("/games")}>
          {t("backHome")}
        </Button>
      )}
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={null}>
      <PendingInner />
    </Suspense>
  );
}
