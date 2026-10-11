import { Suspense } from "react";
import { MobileRechargePage } from "@/components/mobile-recharge/mobile-recharge-page";
import { MobileRechargeSkeleton } from "@/components/skeletons";

export default function MobileRechargeCatalogPage() {
  return (
    // fallback = โครงเดียวกับ skeleton ฝั่ง client (useSearchParams ยังไม่ resolve) — เดิมว่างทั้งหน้า
    <Suspense fallback={<MobileRechargeSkeleton />}>
      <MobileRechargePage />
    </Suspense>
  );
}
