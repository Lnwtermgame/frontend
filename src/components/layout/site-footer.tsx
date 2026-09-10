import Image from "next/image";
import { CreditCard, QrCode, ShieldCheck, Wallet, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const COL_LABEL = "text-[11.5px] font-bold tracking-wider text-muted-foreground/70 uppercase";
const LINK = "block py-[3.5px] text-[13.5px] text-muted-foreground transition-colors hover:text-primary";

export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  const payChips = [
    { icon: QrCode, label: t("payPromptpay") },
    { icon: Wallet, label: t("payTruemoney") },
    { icon: CreditCard, label: t("payCard") },
  ];

  return (
    <footer className="mt-12 border-t border-border/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Image
                src="/brand/logo-mark.png"
                alt=""
                width={1105}
                height={910}
                className="h-8 w-auto"
              />
              <span className="text-sm font-extrabold tracking-wide whitespace-nowrap">
                LNW<span className="text-primary">TERMGAME</span>
              </span>
            </div>
            <p className="mt-3 max-w-[30ch] text-[13px] leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-muted-foreground">
                <Zap className="size-3.5 text-primary" />
                {t("trustAuto")}
              </span>
              <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                {t("trustReal")}
              </span>
            </div>
          </div>

          <nav>
            <h3 className={COL_LABEL}>{t("servicesTitle")}</h3>
            <div className="mt-2.5">
              <Link href="/games" className={LINK}>{t("catGames")}</Link>
              <Link href="/card" className={LINK}>{t("catCard")}</Link>
              <Link href="/mobile-recharge" className={LINK}>{t("catMobile")}</Link>
              <Link href="/news" className={LINK}>{t("news")}</Link>
            </div>
          </nav>

          <nav>
            <h3 className={COL_LABEL}>{t("helpTitle")}</h3>
            <div className="mt-2.5">
              <Link href="/support/faq" className={LINK}>{t("faq")}</Link>
              <Link href="/support/contact" className={LINK}>{t("contact")}</Link>
              <Link href="/support/tickets" className={LINK}>{t("orderIssue")}</Link>
            </div>
          </nav>

          <nav>
            <h3 className={COL_LABEL}>{t("infoTitle")}</h3>
            <div className="mt-2.5">
              <Link href="/terms" className={LINK}>{t("terms")}</Link>
              <Link href="/privacy" className={LINK}>{t("privacy")}</Link>
              <Link href="/refund" className={LINK}>{t("refund")}</Link>
            </div>
          </nav>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border/50 pt-5">
          <div className="flex flex-wrap items-center gap-2.5">
            {payChips.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground"
              >
                <Icon className="size-3.5" />
                {label}
              </span>
            ))}
          </div>
          <p className="num text-xs text-muted-foreground/70">
            © {year} LNWTERMGAME — {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
