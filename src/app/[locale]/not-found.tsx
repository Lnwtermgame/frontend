import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

/** หน้า 404 ของทุกโลแคล — จับ notFound() ที่โยนจากทุกส่วนภายใน [locale] (เช่น หน้า CMS ที่ไม่มี slug) */
export default function LocaleNotFound() {
  const t = useTranslations("errors");
  const tc = useTranslations("common");
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-24 text-center">
      <div className="grid size-14 place-items-center rounded-[14px] border bg-card shadow-(--shadow-tile)">
        <SearchX className="size-7 text-muted-foreground-strong" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-bold sm:text-3xl">{t("notFoundTitle")}</h1>
      <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
        {t("notFoundDesc")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        <Button asChild className="h-11 md:h-9">
          <Link href="/">{tc("backHome")}</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 md:h-9">
          <Link href="/games">{t("viewAllGames")}</Link>
        </Button>
      </div>
    </div>
  );
}
