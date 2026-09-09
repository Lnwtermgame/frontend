"use client";

import { Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

function QrInner() {
  const t = useTranslations("payments");
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const qr = typeof window !== "undefined" ? sessionStorage.getItem(`qr_${orderId}`) : null;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 text-center">
      <h1 className="text-xl font-bold">{t("pendingTitle")}</h1>
      {qr ? (
        <div className="mx-auto mt-6 w-72 rounded-[14px] border bg-card p-4">
          <Image
            src={qr}
            alt="PromptPay QR"
            width={264}
            height={264}
            unoptimized
            className="mx-auto"
          />
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">{t("failedDesc")}</p>
      )}
    </div>
  );
}

export default function PaymentQrPage() {
  return (
    <Suspense fallback={null}>
      <QrInner />
    </Suspense>
  );
}
