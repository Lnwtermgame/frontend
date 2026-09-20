import { Suspense } from "react";
import { MobileRechargePage } from "@/components/mobile-recharge/mobile-recharge-page";

export default function MobileRechargeCatalogPage() {
  return (
    <Suspense>
      <MobileRechargePage />
    </Suspense>
  );
}
