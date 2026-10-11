"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonRegion } from "@/components/ui/skeleton-region";
import { TextLine } from "./primitives";

/* ─────────────────────────────────────────────────────────────────────────────
 * Skeleton ฝั่งสินค้า — ทุกตัว mirror container class ของ component จริง
 * (radius / border / padding / aspect เดียวกัน) เพื่อให้ข้อมูลมาแทนแล้วไม่มี layout shift
 * แก้หน้าตา component จริงเมื่อไร ให้แก้คู่กันที่นี่ด้วย
 * ──────────────────────────────────────────────────────────────────────────── */

/** mirror ของ ShelfTile — การ์ด + ปก square + pill ราคามุมล่างซ้าย + ชื่อ/หมวดใน p-2.5 pb-3 */
export function ShelfTileSkeleton() {
  return (
    <div className="min-w-0 overflow-hidden rounded-[14px] border border-border/60 bg-card shadow-(--shadow-tile)">
      <div className="relative">
        <Skeleton className="aspect-square rounded-none" />
        <Skeleton className="absolute bottom-1.5 left-1.5 h-[17px] w-[58%] rounded-full bg-card/85" />
      </div>
      <div className="min-w-0 p-2.5 pb-3">
        <TextLine size="xs" className="w-[78%]" />
        <TextLine size="2xs" className="w-1/2" />
      </div>
    </div>
  );
}

/** กริด ShelfTile — ต้องส่ง className กริดเดียวกับกริดจริงของหน้านั้น */
export function ShelfGridSkeleton({
  count,
  className,
  label,
}: {
  count: number;
  className: string;
  label?: string;
}) {
  return (
    <SkeletonRegion label={label} className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <ShelfTileSkeleton key={i} />
      ))}
    </SkeletonRegion>
  );
}

/** mirror ของ ProductTile (หน้า favorite) — ปก square + ชื่อ text-sm + ราคา text-xs ใน p-2.5 */
export function ProductTileSkeleton() {
  return (
    <div className="overflow-hidden rounded-[14px] border bg-card shadow-(--shadow-tile)">
      <Skeleton className="aspect-square rounded-none" />
      <div className="p-2.5">
        <TextLine size="sm" className="w-[80%]" />
        <TextLine size="xs" className="mt-0.5 w-[46%]" />
      </div>
    </div>
  );
}

/** mirror ของ ProductBand — แถบเต็มกว้าง (โทนเทาแทนสีเกมที่ยังไม่รู้) ปก + ชื่อ + ชิป + ปุ่ม 2 ปุ่ม */
export function ProductBandSkeleton() {
  // ชิ้นบน band ใช้ขาวโปร่งแทน bg-skeleton — พื้น band เข้มกว่า skeleton ปกติ
  const onBand = "bg-white/55";
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(100deg,var(--skeleton),oklch(0.9_0.012_255))]">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 py-5 sm:flex-row sm:items-center sm:gap-5 sm:py-6">
        <div className="flex min-w-0 items-center gap-4 sm:flex-1">
          <div className="w-[84px] shrink-0 sm:w-[92px]">
            <Skeleton className={cn("aspect-square rounded-xl", onBand)} />
          </div>
          <div className="min-w-0 flex-1">
            <TextLine size="xl" className="w-[min(70%,280px)] sm:h-[33px]" barClassName={onBand} />
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Skeleton className={cn("h-5 w-16 rounded-full", onBand)} />
              <Skeleton className={cn("h-5 w-20 rounded-full", onBand)} />
              <Skeleton className={cn("h-3 w-24 rounded-full bg-white/40")} />
            </div>
            <div className="mt-3 hidden gap-x-5 sm:flex">
              <TextLine size="2xs" className="w-28" barClassName="bg-white/40" />
              <TextLine size="2xs" className="w-32" barClassName="bg-white/40" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex shrink-0 items-center gap-2 sm:mt-0 sm:ml-auto">
          <Skeleton className={cn("h-11 flex-1 rounded-md sm:w-[92px] sm:flex-none md:h-7", onBand)} />
          <Skeleton className={cn("h-11 flex-1 rounded-md sm:w-[84px] sm:flex-none md:h-7", onBand)} />
        </div>
      </div>
    </div>
  );
}

/** mirror ของ DenomCard — แถวแนวนอน: ชื่อ (ซ้าย) + ราคา (ขวา) ในกรอบ inset-ring */
export function DenomCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-[10px] p-2.5 pr-3.5 inset-ring inset-ring-border">
      <div className="min-w-0 flex-1">
        <TextLine size="sm" className={index % 3 === 1 ? "w-[58%]" : index % 3 === 2 ? "w-[74%]" : "w-[66%]"} />
      </div>
      <TextLine size="sm" className="w-14 shrink-0" />
    </div>
  );
}

/** mirror ของ PackageGrid (กลุ่มเดียว ไม่มีหัวกลุ่ม) — grid 1 → 2 คอลัมน์ */
export function PackageGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <DenomCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

/** mirror ของ OrderSummary aside — step chip 1-2-3 + เส้นนำสายตา + ยอด + ปุ่มซื้อ */
export function OrderSummarySkeleton() {
  const t = useTranslations("product");
  const chip = "size-[22px] shrink-0 rounded-full";
  return (
    <div className="rounded-[14px] border bg-card p-4 shadow-(--shadow-tile) lg:sticky lg:top-20">
      <div className="relative">
        <span aria-hidden className="absolute top-[22px] bottom-[22px] left-[10.5px] w-px bg-border" />
        <div className="flex items-center gap-2.5">
          <Skeleton className={chip} />
          <span className="text-sm font-bold">{t("selectPackage")}</span>
        </div>
        <div className="mt-2 pl-[32px]">
          <TextLine size="xs" className="w-[70%]" />
        </div>
        <div className="mt-5 flex items-center gap-2.5">
          <Skeleton className={chip} />
          <span className="text-sm font-bold">{t("stepPay")}</span>
        </div>
      </div>
      <div className="mt-3 pl-[32px]">
        <Skeleton className="h-11 w-full rounded-lg lg:h-8" />
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{t("subtotal")}</span>
          <Skeleton className="h-6 w-24 rounded-md" />
        </div>
        <Skeleton className="mt-3.5 h-12 w-full rounded-md lg:h-10" />
      </div>
    </div>
  );
}

/** หน้าสินค้าทั้งหน้า — ใช้ทั้งใน ProductPage (client loading) และ loading.tsx (route) ให้ต่อกันไร้รอย */
export function ProductPageSkeleton() {
  const t = useTranslations("product");
  return (
    <SkeletonRegion className="pb-8">
      <ProductBandSkeleton />
      <div className="mx-auto w-full max-w-6xl px-4 pt-6">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-4">
            <section className="rounded-[14px] border border-border/60 bg-card p-5 shadow-(--shadow-tile) sm:p-6">
              <h2 className="mb-4 text-2xs font-bold tracking-wider text-muted-foreground-strong uppercase">
                {t("selectPackage")}
              </h2>
              <PackageGridSkeleton count={8} />
            </section>
          </div>
          <OrderSummarySkeleton />
        </div>
      </div>
    </SkeletonRegion>
  );
}

/** mirror ของการ์ดใน OperatorList — โลโก้ 48px บนพื้นขาว + ชื่อ + "จาก ฿XX" */
export function OperatorCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[6px] bg-muted/60 p-2.5">
      <Skeleton className="size-12 shrink-0 rounded-[6px] bg-card" />
      <div className="min-w-0 flex-1">
        <TextLine size="sm" className="w-[72%]" />
        <TextLine size="xs" className="w-1/2" />
      </div>
    </div>
  );
}

/** หน้าเติมเงินมือถือ — หัวเรื่องเป็นข้อความจริง (static) ส่วนขั้นตอน/สรุปเป็น skeleton */
export function MobileRechargeSkeleton() {
  const t = useTranslations("mobileRecharge");
  const step = "text-sm font-bold";
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">{t("heroTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("heroSubtitle")}</p>
      <SkeletonRegion className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          <div>
            <h2 className={step}>{t("stepCountry")}</h2>
            <Skeleton className="mt-2.5 h-11 rounded-[10px]" />
          </div>
          <div>
            <h2 className={step}>{t("stepPhone")}</h2>
            <Skeleton className="mt-2.5 h-11 rounded-[10px]" />
          </div>
          <div>
            <h2 className={step}>{t("stepOperator")}</h2>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <OperatorCardSkeleton key={i} />
              ))}
            </div>
          </div>
          <div>
            <h2 className={step}>{t("stepDenomination")}</h2>
            <div className="mt-2.5">
              <PackageGridSkeleton count={4} />
            </div>
          </div>
        </div>
        <div className="rounded-[14px] border bg-card p-4 shadow-(--shadow-tile)">
          <TextLine size="sm" className="w-1/3" />
          <div className="mt-4 space-y-3">
            <TextLine size="xs" className="w-[80%]" />
            <TextLine size="xs" className="w-[64%]" />
            <TextLine size="xs" className="w-[72%]" />
          </div>
          <Skeleton className="mt-4 h-11 w-full rounded-lg lg:h-8" />
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <TextLine size="sm" className="w-20" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
          <Skeleton className="mt-3.5 h-12 w-full rounded-md lg:h-10" />
        </div>
      </SkeletonRegion>
    </div>
  );
}
