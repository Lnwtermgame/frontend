"use client";

import { useTranslations } from "next-intl";
import { Gamepad2, LifeBuoy, Smartphone, Ticket } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useFeatured, useBestsellers } from "@/lib/query/hooks";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { ProductShelf } from "@/components/home/product-shelf";

export default function HomePage() {
  const t = useTranslations("home");
  const tn = useTranslations("nav");
  const featured = useFeatured(10);
  const bestsellers = useBestsellers(10);

  const quickCats = [
    { href: "/games", label: tn("games"), icon: Gamepad2 },
    { href: "/card", label: tn("card"), icon: Ticket },
    { href: "/mobile-recharge", label: tn("mobile"), icon: Smartphone },
    { href: "/support", label: tn("support"), icon: LifeBuoy },
  ];

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
    </div>
  );
}
