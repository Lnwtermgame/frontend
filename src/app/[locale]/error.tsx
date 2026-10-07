"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

/** error boundary ระดับ [locale] — แสดง reset (ลองใหม่) และทางกลับหน้าแรก */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const tc = useTranslations("common");

  useEffect(() => {
    // ส่งต่อให้ console / logging ที่มีอยู่ ไม่กลืน error เงียบๆ
    console.error("[locale-error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-24 text-center">
      <div className="grid size-14 place-items-center rounded-[14px] border border-destructive/40 bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-bold sm:text-3xl">{t("errorTitle")}</h1>
      <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
        {t("errorDesc")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        <Button onClick={reset} className="h-11 md:h-9">
          {t("retry")}
        </Button>
        <Button asChild variant="outline" className="h-11 md:h-9">
          <Link href="/">{tc("backHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
