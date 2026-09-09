import { Gamepad2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const COL_LABEL = "text-[11.5px] font-bold tracking-wider text-muted-foreground/70 uppercase";
const LINK = "text-sm text-muted-foreground transition-colors hover:text-primary";

export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] border bg-secondary text-primary">
                <Gamepad2 className="size-4" />
              </span>
              <span className="text-sm font-extrabold tracking-wide whitespace-nowrap">
                LNW<span className="text-primary">TERMGAME</span>
              </span>
            </div>
            <p className="mt-3 max-w-[32ch] text-[13px] leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          <nav>
            <h3 className={COL_LABEL}>{t("helpTitle")}</h3>
            <ul className="mt-3 space-y-2.5">
              <li><Link href="/support/faq" className={LINK}>{t("faq")}</Link></li>
              <li><Link href="/support/contact" className={LINK}>{t("contact")}</Link></li>
              <li><Link href="/support/tickets" className={LINK}>{t("orderIssue")}</Link></li>
            </ul>
          </nav>

          <nav>
            <h3 className={COL_LABEL}>{t("infoTitle")}</h3>
            <ul className="mt-3 space-y-2.5">
              <li><Link href="/news" className={LINK}>{t("news")}</Link></li>
              <li><Link href="/terms" className={LINK}>{t("terms")}</Link></li>
              <li><Link href="/privacy" className={LINK}>{t("privacy")}</Link></li>
              <li><Link href="/refund" className={LINK}>{t("refund")}</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border/50 pt-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <span className="font-bold text-muted-foreground">{t("payTitle")}</span>
            {t("payPromptpay")}
            <span className="size-[3px] rounded-full bg-border" />
            {t("payTruemoney")}
            <span className="size-[3px] rounded-full bg-border" />
            {t("payCard")}
          </div>
          <p className="num text-xs text-muted-foreground/70">
            © {year} LNWTERMGAME — {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
