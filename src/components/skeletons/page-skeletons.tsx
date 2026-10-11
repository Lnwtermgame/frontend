"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRegion } from "@/components/ui/skeleton-region";
import { Paragraph, TextLine } from "./primitives";
import { CreditRowSkeleton } from "./list-skeletons";

/* ─────────────────────────────────────────────────────────────────────────────
 * Skeleton ระดับหน้า — ข้อความ static (ลิงก์ย้อนกลับ/หัวข้อส่วน) แสดงจริงตั้งแต่แรก
 * เฉพาะส่วนที่มาจาก API เท่านั้นที่เป็น skeleton
 * ──────────────────────────────────────────────────────────────────────────── */

/** ป้ายสถานะ (StatusBadge 24px) */
function Pill({ className }: { className?: string }) {
  return <Skeleton className={cn("h-6 w-[84px] rounded-full", className)} />;
}

/** news/[slug] — mirror article: badge + meta / หัวเรื่อง / excerpt / เนื้อหาใต้เส้น */
export function NewsArticleSkeleton() {
  const t = useTranslations("support");
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link
        href="/news"
        className="-mt-2 mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        {t("newsTitle")}
      </Link>
      <SkeletonRegion className="rounded-[14px] border bg-card p-6 shadow-(--shadow-tile) sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-4xl" />
          <TextLine size="xs" className="ml-auto w-36" />
        </div>
        <div className="mt-4">
          <TextLine size="2xl" className="w-[86%] sm:h-[39px]" />
          <TextLine size="2xl" className="w-[52%] sm:h-[39px]" />
        </div>
        <div className="mt-3 border-l-2 border-primary/30 pl-3">
          <Paragraph lines={2} />
        </div>
        <div className="mt-8 space-y-4 border-t pt-6">
          <Paragraph lines={4} />
          <Paragraph lines={3} />
        </div>
      </SkeletonRegion>
    </div>
  );
}

/** support/faq/[slug] — mirror article: หัวเรื่อง / วันที่ / เนื้อหา / แถว "มีประโยชน์ไหม" */
export function FaqArticleSkeleton() {
  const t = useTranslations("support");
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/support/faq"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        {t("faqTitle")}
      </Link>
      <SkeletonRegion className="rounded-[14px] border bg-card p-6 shadow-(--shadow-tile)">
        <TextLine size="xl" className="w-[72%] sm:h-[33px]" />
        <TextLine size="xs" className="mt-2 w-32" />
        <div className="mt-6 space-y-4">
          <Paragraph lines={3} />
          <Paragraph lines={2} />
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-4">
          <TextLine size="xs" className="w-28" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </SkeletonRegion>
    </div>
  );
}

/** dashboard/orders/[id] — หัว (เลขที่/สถานะ/ยอด) + แถบ 4 ขั้น + ไทม์ไลน์ 2 ขั้นแรก */
export function OrderDetailSkeleton() {
  const t = useTranslations("dashboard");
  return (
    <SkeletonRegion className="rounded-[14px] border bg-card shadow-(--shadow-tile)">
      <div className="p-4 pb-0">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {t("ordersMy")}
        </Link>
        <div className="mt-2.5 flex flex-wrap items-start gap-x-3 gap-y-2">
          <div className="min-w-0">
            <TextLine size="lg" className="h-[25.5px] w-44" />
            <TextLine size="xs" className="mt-0.5 w-40" />
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <Pill />
            <TextLine size="xl" className="w-24" />
          </div>
        </div>
      </div>

      <ol className="grid grid-cols-2 gap-y-5 px-2 pt-6 pb-1 sm:grid-cols-4" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className={cn(
              "relative min-w-0 px-1 pt-7 text-center",
              "before:absolute before:top-[15px] before:right-0 before:left-0 before:h-0.5 before:bg-border max-sm:before:hidden",
              i === 0 && "before:left-1/2",
              i === 3 && "before:right-1/2",
            )}
          >
            <Skeleton className="absolute top-1.5 left-1/2 z-10 size-5 -translate-x-1/2 rounded-full" />
            <TextLine size="xs" className="mx-auto w-16" />
            <TextLine size="2xs" className="mx-auto mt-0.5 w-12" />
          </li>
        ))}
      </ol>

      <div className="px-4 pt-3 pb-2">
        {[0, 1].map((i) => (
          <div key={i} className="grid grid-cols-[26px_minmax(0,1fr)] gap-3">
            <div className="flex flex-col items-center self-stretch" aria-hidden>
              <Skeleton className="size-[26px] shrink-0 rounded-full" />
              <span className="mt-1 w-0.5 flex-1 rounded-full bg-border" />
            </div>
            <div className="min-w-0 pb-5">
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <TextLine size="sm" className="w-28" />
                <TextLine size="xs" className="w-32" />
              </div>
              <div className="mt-2.5 rounded-[10px] border bg-background/60 p-3">
                {i === 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="w-[52px] shrink-0">
                      <Skeleton className="aspect-square rounded-xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <TextLine size="sm" className="w-[58%]" />
                      <TextLine size="xs" className="w-[36%]" />
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <TextLine size="xs" className="w-6" />
                      <TextLine size="sm" className="w-16" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <TextLine size="xs" className="w-[44%]" />
                    <TextLine size="xs" className="w-[62%]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** dashboard/invoice/[id] — การ์ดหัว + การ์ดรายการ/ยอด */
export function InvoiceDetailSkeleton() {
  const t = useTranslations("dashboard");
  return (
    <SkeletonRegion className="space-y-5">
      <div className="rounded-[14px] border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <TextLine size="lg" className="w-40" />
          <TextLine size="xs" className="ml-auto w-32" />
        </div>
        <TextLine size="xs" className="w-28" />
      </div>
      <section className="rounded-[14px] border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t("items")}</h2>
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <TextLine size="sm" className={i ? "w-32" : "w-44"} />
              <TextLine size="sm" className="w-6" />
              <TextLine size="sm" className="ml-auto w-16" />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <TextLine size="sm" className="w-16" />
          </div>
          <div className="flex justify-between font-bold">
            <span>{t("total")}</span>
            <TextLine size="sm" className="w-20" />
          </div>
        </div>
      </section>
    </SkeletonRegion>
  );
}

/** support/tickets (thread) — การ์ดหัว ticket + ข้อความ 2 กล่อง + ช่องตอบกลับ */
export function TicketThreadSkeleton() {
  return (
    <SkeletonRegion className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[14px] border bg-card p-5 shadow-(--shadow-tile)">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TextLine size="xs" className="w-24" />
            <Pill />
          </div>
          <TextLine size="xl" className="mt-1.5 w-[60%]" />
          <TextLine size="xs" className="mt-1 w-[44%]" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="space-y-3">
        {[3, 2].map((lines, i) => (
          <div key={i} className={cn("rounded-[12px] border p-4", i ? "border-primary/25 bg-primary/[0.03]" : "bg-card")}>
            <div className="flex items-center justify-between">
              <TextLine size="xs" className="w-24" />
              <TextLine size="xs" className="w-28" />
            </div>
            <Paragraph lines={lines} className="mt-2" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-[62px] flex-1 rounded-[10px]" />
        <Skeleton className="h-9 w-24 self-end rounded-md" />
      </div>
    </SkeletonRegion>
  );
}

/** หัวหน้า dashboard (DashPageHead) — ใช้เมื่อยังไม่รู้ว่าเป็นหน้าไหน (route loading) */
function DashHeadSkeleton() {
  return (
    <div>
      <TextLine size="xl" className="w-40" />
      <TextLine size="sm" className="mt-0.5 w-64 max-w-full" />
    </div>
  );
}

/** เนื้อหาฝั่งขวาของ dashboard — หัว + แถวรายการทั่วไป */
export function DashboardContentSkeleton() {
  return (
    <SkeletonRegion>
      <DashHeadSkeleton />
      <div className="mt-3.5 space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <CreditRowSkeleton key={i} index={i} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

/** mirror ของ DashboardSidebar — avatar + ชื่อ/อีเมล + กล่องยอดเครดิต + เมนู 7 รายการ */
function DashboardSidebarSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-3 px-2 pt-1 pb-3 lg:border-b lg:border-border/60">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <TextLine size="sm" className="w-24" />
          <TextLine size="xs" className="w-32" />
        </div>
      </div>
      <Skeleton className="mt-3 h-[38px] rounded-[10px]" />
      <div className="mt-2 flex gap-0.5 overflow-hidden lg:flex-col">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex shrink-0 items-center gap-2 rounded-[10px] px-3 py-2">
            <Skeleton className="size-4 rounded-sm" />
            <TextLine size="sm" className={i % 2 ? "w-16" : "w-20"} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** ระหว่างรอ auth bootstrapping — โครง dashboard ทั้งหน้า แทนข้อความ "กำลังโหลด" กลางจอ */
export function DashboardShellSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <SkeletonRegion className="grid max-w-full min-w-0 items-start gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="max-w-full min-w-0 rounded-[14px] border bg-card p-2.5">
          <DashboardSidebarSkeleton />
        </aside>
        <section className="min-w-0">
          <DashHeadSkeleton />
          <div className="mt-3.5 space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <CreditRowSkeleton key={i} index={i} />
            ))}
          </div>
        </section>
      </SkeletonRegion>
    </div>
  );
}
