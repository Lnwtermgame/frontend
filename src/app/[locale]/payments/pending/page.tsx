"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/routing";
import { getPaymentStatus } from "@/lib/api/payments";
import { cancelOrder } from "@/lib/api/orders";

const POLL_MS = 5000;
const FAILED_POLL_MS = 15000; // slower background re-check after a reported failure
const EXPIRY_MS = 15 * 60_000;

type Phase = "pending" | "failed" | "expired";

function PendingInner() {
  const t = useTranslations("payments");
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const referenceNo = searchParams.get("referenceNo") ?? "";
  const [phase, setPhase] = useState<Phase>("pending");
  const [remainSec, setRemainSec] = useState(EXPIRY_MS / 1000);
  const [qr, setQr] = useState<string | null>(null);
  const phaseRef = useRef<Phase>("pending");

  const setPhaseBoth = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  useEffect(() => {
    if (orderId && typeof window !== "undefined") {
      setQr(sessionStorage.getItem(`qr_${orderId}`));
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const deadline = Date.now() + EXPIRY_MS;
    const countdown = setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemainSec(left);
      if (left <= 0) {
        clearInterval(countdown);
        setPhaseBoth("expired");
        cancelOrder(orderId).catch(() => {});
      }
    }, 1000);

    return () => clearInterval(countdown);
  }, [orderId, setPhaseBoth]);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const check = async () => {
      try {
        const status = await getPaymentStatus(orderId);
        if (cancelled) return;

        if (status.status === "COMPLETED") {
          router.push(`/payments/success?orderId=${orderId}&referenceNo=${referenceNo}`);
          return;
        }
        if (status.status === "FAILED" || status.status === "REFUNDED") {
          // A FAILED report is often just "window closed / provider said no
          // yet". If the money actually landed (late webhook, delayed bank),
          // the sweeper completes the payment — so keep re-checking slowly
          // and flip back to success if it recovers.
          if (phaseRef.current === "pending") setPhaseBoth("failed");
        } else if (phaseRef.current === "failed") {
          // Recovered: provider re-opened / payment is being retried — go
          // back to the waiting view and keep polling.
          setPhaseBoth("pending");
        }
      } catch {
        // transient poll error — keep polling
      }
      if (!cancelled) {
        timer = setTimeout(check, phaseRef.current === "failed" ? FAILED_POLL_MS : POLL_MS);
      }
    };

    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, referenceNo, router, setPhaseBoth]);

  const manualRecheck = useCallback(() => {
    // Immediate one-shot re-check: clears failed and lets the poll loop
    // continue at the pending cadence.
    setPhaseBoth("pending");
  }, [setPhaseBoth]);

  const mm = String(Math.floor(remainSec / 60)).padStart(2, "0");
  const ss = String(remainSec % 60).padStart(2, "0");

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 text-center">
      {phase === "pending" ? (
        <>
          <h1 className="text-xl font-bold">{t("pendingTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("pendingDesc")}</p>
          {qr ? (
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
          ) : (
            <Skeleton className="mx-auto mt-6 size-64 rounded-[14px]" />
          )}
          <p className="num mt-4 text-sm text-muted-foreground" role="status">
            {t("checking")} · {mm}:{ss}
          </p>
          {referenceNo ? (
            <p className="num mt-1 text-xs text-muted-foreground">REF: {referenceNo}</p>
          ) : null}
        </>
      ) : phase === "failed" ? (
        <>
          <h1 className="text-xl font-bold text-destructive">{t("failedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("failedDesc")}</p>
          {referenceNo ? (
            <p className="num mt-1 text-xs text-muted-foreground">REF: {referenceNo}</p>
          ) : null}
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={manualRecheck}>
              {t("failedRetry")}
            </Button>
            <Button onClick={() => router.push("/games")}>{t("backHome")}</Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold">{t("expiredTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("expiredDesc")}</p>
          <Button className="mt-6" onClick={() => router.push("/games")}>
            {t("backHome")}
          </Button>
        </>
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
