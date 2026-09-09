"use client";

import { useTranslations } from "next-intl";
import {
  ChevronRight,
  Gamepad2,
  LifeBuoy,
  MessagesSquare,
  ShieldCheck,
  Smartphone,
  Ticket,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useFeatured, useBestsellers } from "@/lib/query/hooks";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { ProductShelf } from "@/components/home/product-shelf";

export default function HomePage() {
  const t = useTranslations("home");
  const tn = useTranslations("nav");
  const tf = useTranslations("footer");
  const featured = useFeatured(10);
  const bestsellers = useBestsellers(10);

  const quickCats = [
    { href: "/games", label: tn("games"), icon: Gamepad2 },
    { href: "/card", label: tn("card"), icon: Ticket },
    { href: "/mobile-recharge", label: tn("mobile"), icon: Smartphone },
    { href: "/support", label: tn("support"), icon: LifeBuoy },
  ];

  const steps = [t("stepsShort1"), t("stepsShort2"), t("stepsShort3")];

  return (
    <div className="pb-6">
      {/* โปรเปิดหน้า */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-6">
        <BannerCarousel />
      </div>

      {/* ทางลัดหมวด */}
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3 py-6">
          {quickCats.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 text-[13.5px] font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="grid size-[38px] place-items-center rounded-[11px] border border-border/60 bg-card text-primary">
                <Icon className="size-[17px]" />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </div>

      <ProductShelf
        title={t("popularTitle")}
        moreHref="/games"
        products={featured.data}
        isLoading={featured.isLoading}
        isError={featured.isError}
        onRetry={() => featured.refetch()}
      />

      <ProductShelf
        title={t("bestsellerTitle")}
        moreHref="/games?sort=bestseller"
        products={bestsellers.data}
        isLoading={bestsellers.isLoading}
        isError={bestsellers.isError}
        onRetry={() => bestsellers.refetch()}
      />

      {/* trust + steps + ช่องทางชำระเงิน (แบบแถบเรียบ ไม่มีกล่อง) */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3 text-[12.5px] font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Zap className="size-3.5 text-primary" />
            {t("trustAuto")}
          </span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-primary" />
            {t("trustReal")}
          </span>
          <span className="inline-flex items-center gap-2">
            <MessagesSquare className="size-3.5 text-primary" />
            {t("trustSupport")}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 py-3 text-[13px]">
          <span className="mr-1 text-[11.5px] font-bold tracking-wider text-muted-foreground/70 uppercase">
            {t("howTitle")}
          </span>
          {steps.map((label, i) => (
            <span key={label} className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-2 font-semibold text-muted-foreground">
                <span className="num grid size-[22px] place-items-center rounded-[7px] bg-primary/15 text-[11.5px] font-bold text-primary">
                  {i + 1}
                </span>
                {label}
              </span>
              {i < steps.length - 1 && <ChevronRight className="size-3.5 text-muted-foreground/50" />}
            </span>
          ))}
          <Link
            href="/support"
            className="ml-auto text-[12.5px] font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            {tf("faq")} →
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border/50 py-4 text-xs text-muted-foreground">
          <span className="font-bold text-muted-foreground">{t("payVia")}</span>
          {tf("payPromptpay")}
          <span className="size-[3px] rounded-full bg-border" />
          {tf("payTruemoney")}
          <span className="size-[3px] rounded-full bg-border" />
          {tf("payCard")}
        </div>
      </div>
    </div>
  );
}
