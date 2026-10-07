"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/routing";
import { getPaymentStatus, type PaymentStatusResult } from "@/lib/api/payments";
import { cancelOrder } from "@/lib/api/orders";
import { readPendingContext } from "@/lib/buy-flow";

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
  // แยก "ยังไม่ได้อ่าน sessionStorage" ออกจาก "อ่านแล้วไม่มี QR" —
  // กันแผงรหัสอ้างอิงแฟลชขึ้นมาแวบ ๆ ก่อน effect แรกทำงาน
  const [qrLoaded, setQrLoaded] = useState(false);
  // referenceNo จาก query หาย (ผู้ใช้ย้อนกลับจาก gateway แบบไม่มี query) —
  // เรียกคืนจากบริบทที่ buy-flow ฝากไว้ก่อนพาออกจากหน้า
  const [ctxRef, setCtxRef] = useState<string | null>(null);
  const [rechecking, setRechecking] = useState(false);
  const phaseRef = useRef<Phase>("pending");
  // เดดไลน์ provisional ฝั่ง client (null = ยังไม่ตั้ง) — ใช้จนกว่า payload แรกจาก server จะมา anchor
  const deadlineRef = useRef<number | null>(null);
  const anchoredRef = useRef(false);

  const setPhaseBoth = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  /* ยึดเดดไลน์กับ createdAt จาก server — set จาก payload แรกเท่านั้น
     (poll/recheck รอบถัดไป no-op เสมอ) เพื่อไม่ให้รีเฟรชรีเซ็ตนับถอยหลัง
     และไม่ให้ recheck ดันเวลากลับขึ้น ถ้า payload ไม่มี createdAt ที่อ่านได้
     ให้คง provisional เดิม (defensive) */
  const anchorDeadline = useCallback(
    (status: Pick<PaymentStatusResult, "createdAt">) => {
      const createdAtMs = status.createdAt ? Date.parse(status.createdAt) : NaN;
      if (!Number.isFinite(createdAtMs)) return;
      if (anchoredRef.current) return;
      anchoredRef.current = true;
      deadlineRef.current = createdAtMs + EXPIRY_MS;
      const left = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setRemainSec(left);
      if (left <= 0 && phaseRef.current !== "expired") {
        // หน้าต่างชำระเงินหมดไปแล้วจริง ๆ (เปิดหน้าช้า / กลับมาทีหลัง) — โดดเข้า expired ทันที
        setPhaseBoth("expired");
        cancelOrder(orderId).catch(() => {});
      }
    },
    [orderId, setPhaseBoth],
  );

  /* อ่าน sessionStorage หลัง mount — one-shot hydration read จาก external storage
     ต้อง setState ใน effect เพื่อไม่ให้ hydration mismatch (SSR เห็น null เสมอ) */
  useEffect(() => {
    if (orderId && typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read จาก sessionStorage หลัง hydrate
      setQr(sessionStorage.getItem(`qr_${orderId}`));
    }
    setQrLoaded(true);
  }, [orderId]);

  useEffect(() => {
    if (!orderId || referenceNo) return;
    const ctx = readPendingContext(orderId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read จาก sessionStorage หลัง hydrate
    if (ctx?.referenceNo) setCtxRef(ctx.referenceNo);
  }, [orderId, referenceNo]);

  const displayRef = referenceNo || ctxRef;

  useEffect(() => {
    if (!orderId) return;
    // Date.now ใน effect เท่านั้น (render ต้อง pure) — provisional จน payload แรกมา anchor
    if (deadlineRef.current === null) deadlineRef.current = Date.now() + EXPIRY_MS;
    const countdown = setInterval(() => {
      // anchorDeadline อาจโดดเข้า expired ไปก่อนแล้ว — ไม่ซ้ำ cancelOrder
      if (phaseRef.current === "expired") return;
      const left = Math.max(
        0,
        Math.round(((deadlineRef.current ?? 0) - Date.now()) / 1000),
      );
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
        anchorDeadline(status);
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
  }, [anchorDeadline, orderId, referenceNo, router, setPhaseBoth]);

  // ปุ่มตรวจสอบใหม่ = เรียก status API จริง (เดิมเป็นแค่ state flip ที่รอ poll
  // รอบถัดไปเฉย ๆ) — สะท้อนผลทันที: สำเร็จพาไปหน้า success, ยังไม่ผ่านกลับมารอ
  const manualRecheck = useCallback(async () => {
    if (!orderId || rechecking) return;
    setRechecking(true);
    try {
      const status = await getPaymentStatus(orderId);
      if (status.status === "COMPLETED") {
        router.push(`/payments/success?orderId=${orderId}&referenceNo=${referenceNo}`);
        return;
      }
      anchorDeadline(status);
      // หน้าต่างหมดอายุจริง (anchored) — expired ครอง UI ห้ามกลับไป failed/pending
      if (phaseRef.current === "expired") return;
      setPhaseBoth(status.status === "FAILED" || status.status === "REFUNDED" ? "failed" : "pending");
    } catch {
      toast.error(t("statusCheckFailed"));
    } finally {
      setRechecking(false);
    }
  }, [anchorDeadline, orderId, referenceNo, rechecking, router, setPhaseBoth, t]);

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
          ) : qrLoaded ? (
            /* เข้าหน้านี้แบบไม่มี QR ในเซสชัน (ชำระผ่านหน้า gateway แล้วย้อนกลับ /
               เปิดแท็บใหม่) — อย่างน้อยต้องมีรหัสอ้างอิงให้ไล่คำสั่งซื้อต่อได้ */
            <div className="mx-auto mt-6 w-full max-w-xs rounded-[14px] border bg-card p-4 text-left shadow-(--shadow-tile)">
              <p className="text-sm font-bold">{t("qrMissingTitle")}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("qrMissingDesc")}
              </p>
              {displayRef ? (
                <p className="num mt-3 rounded-[10px] bg-muted/60 px-3 py-2 text-center text-sm font-bold break-all">
                  REF: {displayRef}
                </p>
              ) : null}
              <Link
                href="/dashboard/orders"
                className="mt-3 block text-center text-xs font-semibold text-primary underline underline-offset-4"
              >
                {t("goToMyOrders")}
              </Link>
            </div>
          ) : (
            <Skeleton className="mx-auto mt-6 size-64 rounded-[14px]" />
          )}
          <p className="num mt-4 text-sm text-muted-foreground" role="status">
            {t("checking")} · {mm}:{ss}
          </p>
          {displayRef ? (
            <p className="num mt-1 text-xs text-muted-foreground break-all">REF: {displayRef}</p>
          ) : null}
        </>
      ) : phase === "failed" ? (
        <>
          <h1 className="text-xl font-bold text-destructive">{t("failedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("failedDesc")}</p>
          {displayRef ? (
            <p className="num mt-1 text-xs text-muted-foreground break-all">REF: {displayRef}</p>
          ) : null}
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => void manualRecheck()}
              disabled={rechecking}
              aria-busy={rechecking}
            >
              {rechecking ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {t("failedRetry")}
            </Button>
            {/* ปุ่มพาไป /games จริง — เลเบลเดิม "กลับหน้าแรก" คลาดกับปลายทาง */}
            <Button onClick={() => router.push("/games")}>{t("chooseAnotherGame")}</Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold">{t("expiredTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("expiredDesc")}</p>
          <Button className="mt-6" onClick={() => router.push("/games")}>
            {t("chooseAnotherGame")}
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
