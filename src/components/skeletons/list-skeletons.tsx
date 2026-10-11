import { Fragment, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRegion } from "@/components/ui/skeleton-region";
import { cn } from "@/lib/utils";
import { TextLine, naturalWidth } from "./primitives";

/* ─────────────────────────────────────────────────────────────────────────────
 * Skeleton แถว/การ์ดในรายการ — mirror container class ของแถวจริงในแต่ละหน้า
 * ──────────────────────────────────────────────────────────────────────────── */

/** ป้ายสถานะ (StatusBadge: text-xs py-0.5 + border = 24px) */
function StatusPillSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-6 w-[84px] rounded-full", className)} />;
}

/** ทำซ้ำ n ครั้งใน SkeletonRegion — className = layout ของ list จริง (space-y / grid) */
export function SkeletonList({
  count,
  className,
  label,
  children,
}: {
  count: number;
  className?: string;
  label?: string;
  children: (index: number) => ReactNode;
}) {
  return (
    <SkeletonRegion label={label} className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Fragment key={i}>{children(i)}</Fragment>
      ))}
    </SkeletonRegion>
  );
}

/** dashboard/orders — ปก 52px + ชื่อ/แพ็กเกจ + ป้ายสถานะ/วันที่ + ยอด + chevron */
export function OrderRowSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[14px] border bg-card p-3 pr-4 shadow-(--shadow-tile)">
      <div className="w-[52px] shrink-0">
        <Skeleton className="aspect-square rounded-xl" />
      </div>
      <div className="min-w-0 flex-1">
        <TextLine size="sm" className={index % 2 ? "w-[48%]" : "w-[62%]"} />
        <TextLine size="xs" className="mt-0.5 w-[38%]" />
      </div>
      <div className="flex shrink-0 items-center gap-3.5">
        <div className="flex flex-col items-end">
          <StatusPillSkeleton />
          <TextLine size="2xs" className="mt-0.5 w-24" />
        </div>
        <TextLine size="base" className="w-16" />
        <span aria-hidden className="size-4" />
      </div>
    </div>
  );
}

/** dashboard/credits — ประเภทรายการ + คำอธิบาย / ยอด ± + วันที่ */
export function CreditRowSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border bg-card px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <TextLine size="sm" className="w-24" />
        <TextLine size="xs" className={naturalWidth(index + 1)} />
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <TextLine size="base" className="w-20" />
        <TextLine size="2xs" className="mt-0.5 w-24" />
      </div>
    </div>
  );
}

/** dashboard/invoice — เลขที่ใบกำกับ + เลขออเดอร์ + ยอด / วันที่ */
export function InvoiceRowSkeleton() {
  return (
    <div className="rounded-[14px] border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TextLine size="sm" className="w-28" />
        <TextLine size="xs" className="w-24" />
        <TextLine size="base" className="ml-auto w-20" />
      </div>
      <TextLine size="xs" className="mt-0.5 w-32" />
    </div>
  );
}

/** dashboard/notifications — ไอคอน 32px + หัวเรื่อง/เวลา + ข้อความ + ปุ่มลบ */
export function NotificationRowSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] border bg-card px-4 py-3">
      <Skeleton className="mt-0.5 size-8 shrink-0 rounded-[10px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TextLine size="sm" className={index % 2 ? "w-[42%]" : "w-[55%]"} />
          <TextLine size="xs" className="ml-auto w-24 shrink-0" />
        </div>
        <TextLine size="xs" className={cn("mt-0.5", naturalWidth(index))} />
      </div>
      <Skeleton className="size-7 shrink-0 rounded-md" />
    </div>
  );
}

/** support/tickets — หัวเรื่อง + ป้ายสถานะ / เลขที่ · หมวด · วันที่ */
export function TicketRowSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="w-full rounded-[14px] border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TextLine size="sm" className={index % 2 ? "w-[40%]" : "w-[52%]"} />
        <StatusPillSkeleton />
      </div>
      <TextLine size="xs" className="mt-1 w-[46%]" />
    </div>
  );
}

/** dashboard/coupons — มูลค่า + โค้ด/คำอธิบาย/วันหมดอายุ + ปุ่มรับ (ขอบซ้ายสีแบรนด์อ่อน) */
export function CouponCardSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-l-4 border-border border-l-primary/30 bg-card py-3 pr-3 pl-4 shadow-(--shadow-tile)">
      <TextLine size="lg" className="w-14" />
      <div className="min-w-0 flex-1">
        <TextLine size="sm" className="w-24" />
        <TextLine size="xs" className="mt-0.5 w-[70%]" />
        <TextLine size="xs" className="mt-0.5 w-28" />
      </div>
      <Skeleton className="h-8 w-16 rounded-md" />
    </div>
  );
}

/** news — badge + หัวเรื่อง 2 บรรทัด + excerpt 3 บรรทัด + วันที่ใต้เส้น */
export function NewsCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="flex flex-col justify-between rounded-[14px] border bg-card p-5 shadow-(--shadow-tile)">
      <div>
        <Skeleton className="h-5 w-16 rounded-4xl" />
        <div className="mt-3">
          <TextLine size="base" className="w-full" />
          <TextLine size="base" className={naturalWidth(index)} />
        </div>
        <div className="mt-2">
          <TextLine size="xs" className="h-[19.5px] w-full" />
          <TextLine size="xs" className="h-[19.5px] w-[92%]" />
          <TextLine size="xs" className="h-[19.5px] w-[60%]" />
        </div>
      </div>
      <div className="mt-4 border-t pt-3">
        <TextLine size="xs" className="w-28" />
      </div>
    </div>
  );
}

/** support/faq — แถว accordion ปิดอยู่ (trigger py-2.5 + chevron) */
export function FaqItemSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="rounded-[14px] border bg-card px-4 shadow-(--shadow-tile)">
      <div className="flex items-center justify-between gap-4 border border-transparent py-2.5">
        <TextLine size="sm" className={naturalWidth(index)} />
        <Skeleton className="size-4 shrink-0 rounded-sm" />
      </div>
    </div>
  );
}

/** nav-search dropdown — รูป 36px + ชื่อ + หมวด */
export function SearchResultSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] p-2">
      <Skeleton className="size-9 shrink-0 rounded-[8px]" />
      <div className="min-w-0 flex-1">
        <TextLine size="xs" className={index % 2 ? "w-[52%]" : "w-[66%]"} />
        <TextLine size="2xs" className="h-[17.25px] w-[34%]" />
      </div>
    </div>
  );
}
