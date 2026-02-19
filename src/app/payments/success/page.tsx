"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CircleX,
  Clock3,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/Button";
import { paymentApi } from "@/lib/services/payment-api";

type PaymentStatus = "loading" | "success" | "processing" | "failed";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const sessionId = searchParams.get("session_id") || "";

  const [status, setStatus] = useState<PaymentStatus>("loading");

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let isStopped = false;
    let attempts = 0;

    const load = async () => {
      if (!orderId) {
        setStatus("failed");
        return true;
      }

      try {
        const res = await paymentApi.getStatus(orderId);

        if (!res.success) {
          setStatus("failed");
          return true;
        }

        const currentStatus = res.data.status;

        if (currentStatus === "COMPLETED") {
          setStatus("success");
          return true;
        }

        if (currentStatus === "PROCESSING" || currentStatus === "PENDING") {
          setStatus("processing");
          return false;
        }

        setStatus("failed");
        return true;
      } catch {
        setStatus("failed");
        return true;
      }
    };

    const bootstrap = async () => {
      const done = await load();
      if (done || isStopped) {
        return;
      }

      timer = setInterval(async () => {
        if (isStopped) {
          return;
        }

        attempts += 1;
        const isDone = await load();

        if (isDone || attempts >= 20) {
          if (timer) {
            clearInterval(timer);
          }
        }
      }, 3000);
    };

    bootstrap();

    return () => {
      isStopped = true;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [orderId]);

  const statusConfig = {
    success: {
      label: "ชำระเงินสำเร็จ",
      title: "ชำระเงินสำเร็จ!",
      description:
        "คำสั่งซื้อของคุณถูกบันทึกเรียบร้อยแล้ว สามารถดูรายละเอียดได้ที่หน้าประวัติคำสั่งซื้อ",
      icon: <CheckCircle2 className="h-10 w-10 text-emerald-600" />,
      accent: "bg-emerald-100",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      panelTitle: "ออเดอร์ของคุณพร้อมดำเนินการแล้ว",
    },
    processing: {
      label: "กำลังตรวจสอบ",
      title: "กำลังตรวจสอบสถานะการชำระเงิน",
      description:
        "เรากำลังยืนยันรายการจากผู้ให้บริการชำระเงิน โปรดรอสักครู่หรือรีเฟรชหน้านี้อีกครั้ง",
      icon: <Clock3 className="h-10 w-10 text-amber-600" />,
      accent: "bg-amber-100",
      badge: "bg-amber-100 text-amber-800 border-amber-300",
      panelTitle: "ระบบกำลังประมวลผลคำสั่งซื้อ",
    },
    failed: {
      label: "ตรวจสอบไม่สำเร็จ",
      title: "ไม่พบสถานะการชำระเงิน",
      description:
        "ไม่สามารถดึงข้อมูลการชำระเงินได้ กรุณาติดต่อฝ่ายบริการลูกค้าหรือเริ่มทำรายการใหม่อีกครั้ง",
      icon: <CircleX className="h-10 w-10 text-rose-600" />,
      accent: "bg-rose-100",
      badge: "bg-rose-100 text-rose-800 border-rose-300",
      panelTitle: "ต้องการความช่วยเหลือเพิ่มเติมหรือไม่",
    },
    loading: {
      label: "กำลังโหลด",
      title: "กำลังตรวจสอบสถานะ...",
      description: "กรุณารอสักครู่ ระบบกำลังซิงก์ข้อมูลคำสั่งซื้อของคุณ",
      icon: <Loader2 className="h-10 w-10 animate-spin text-slate-600" />,
      accent: "bg-slate-100",
      badge: "bg-slate-100 text-slate-800 border-slate-300",
      panelTitle: "กำลังดึงข้อมูลล่าสุดของรายการ",
    },
  }[status];

  return (
    <main className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[radial-gradient(circle_at_15%_10%,#fde68a_0,transparent_35%),radial-gradient(circle_at_85%_15%,#99f6e4_0,transparent_35%),linear-gradient(180deg,#f9fafb_0%,#eef2ff_100%)]">
      <div className="pointer-events-none absolute -left-24 top-20 h-56 w-56 rounded-full border-[3px] border-black bg-brutal-yellow/70" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-44 w-44 rounded-full border-[3px] border-black bg-brutal-blue/60" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full overflow-hidden border-[3px] border-black bg-white shadow-[8px_8px_0_0_#000000]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-black bg-gray-50 px-4 py-3 sm:px-6">
            <Link
              href="/games"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 transition-colors hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับไปเลือกเกม
            </Link>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusConfig.badge}`}
            >
              {statusConfig.label}
            </span>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6 p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-[3px] border-black ${statusConfig.accent}`}
                >
                  {statusConfig.icon}
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-extrabold text-black sm:text-3xl">
                    {statusConfig.title}
                  </h1>
                  <p className="max-w-xl text-sm text-gray-700 sm:text-base">
                    {statusConfig.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {orderId && (
                  <div className="rounded-xl border-2 border-black bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Order ID
                    </p>
                    <p className="mt-1 break-all text-sm font-bold text-black">
                      {orderId}
                    </p>
                  </div>
                )}
                {sessionId && (
                  <div className="rounded-xl border-2 border-black bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Session
                    </p>
                    <p className="mt-1 break-all text-sm font-bold text-black">
                      {sessionId}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard/orders"
                  className={buttonVariants({ variant: "primary", size: "md" })}
                >
                  ดูคำสั่งซื้อของฉัน
                </Link>
                <Link
                  href="/games"
                  className={buttonVariants({
                    variant: "secondary",
                    size: "md",
                  })}
                >
                  กลับไปหน้าเกม
                </Link>
              </div>
            </div>

            <aside className="border-t-[3px] border-black bg-gradient-to-b from-white to-gray-50 p-5 sm:p-7 lg:border-l-[3px] lg:border-t-0">
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 border-2 border-black bg-brutal-yellow px-3 py-1 text-xs font-bold uppercase tracking-wide text-black">
                  <Sparkles className="h-3.5 w-3.5" />
                  Payment Flow
                </p>
                <h2 className="text-lg font-extrabold text-black">
                  {statusConfig.panelTitle}
                </h2>

                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3 rounded-lg border-2 border-black bg-white p-3">
                    <ReceiptText className="mt-0.5 h-4 w-4 shrink-0 text-black" />
                    <p>ตรวจสอบคำสั่งซื้อได้ตลอดเวลาที่หน้าแดชบอร์ด</p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border-2 border-black bg-white p-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-black" />
                    <p>ชำระเงินผ่านระบบที่เข้ารหัสและปลอดภัย</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
