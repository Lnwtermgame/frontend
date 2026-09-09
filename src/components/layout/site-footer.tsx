import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("helpTitle")}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/support/faq" className="hover:text-primary">{t("faq")}</Link></li>
            <li><Link href="/support/contact" className="hover:text-primary">{t("contact")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("infoTitle")}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/terms" className="hover:text-primary">{t("terms")}</Link></li>
            <li><Link href="/privacy" className="hover:text-primary">{t("privacy")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t("payTitle")}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{t("payPromptpay")}</li>
            <li>{t("payTruemoney")}</li>
            <li>{t("payCard")}</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
