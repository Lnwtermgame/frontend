"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  HelpCircle,
  MessageSquare,
  Headphones,
  FileText,
  Search,
  ArrowRight,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { useFaqCategories } from "@/lib/query/hooks";

type HubCard = {
  title: string;
  desc: string;
  href: string;
  icon: typeof HelpCircle;
  badge: string | null;
  cta: string;
};

export default function SupportHubPage() {
  const t = useTranslations("support");
  const router = useRouter();
  const [search, setSearch] = useState("");

  // นับจำนวนบทความจริงจากหมวดหมู่ FAQ — ไม่เคลมตัวเลขที่ตรวจสอบไม่ได้
  const faqCategories = useFaqCategories();
  const articleTotal =
    faqCategories.data?.reduce((sum, cat) => sum + (cat.articleCount ?? 0), 0) ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/support/faq?search=${encodeURIComponent(search.trim())}`);
  };

  const HUB_CARDS: HubCard[] = [
    {
      title: t("hubFaqTitle"),
      desc: t("hubFaqDesc"),
      href: "/support/faq",
      icon: HelpCircle,
      badge: articleTotal > 0 ? t("faqArticleCount", { count: articleTotal }) : null,
      cta: t("hubFaqCta"),
    },
    {
      title: t("hubTicketsTitle"),
      desc: t("hubTicketsDesc"),
      href: "/support/tickets",
      icon: MessageSquare,
      badge: t("hubTicketsBadge"),
      cta: t("reportIssue"),
    },
    {
      title: t("hubContactTitle"),
      desc: t("hubContactDesc"),
      href: "/support/contact",
      icon: Headphones,
      badge: t("hubContactBadge"),
      cta: t("contactUs"),
    },
    {
      title: t("hubRefundTitle"),
      desc: t("hubRefundDesc"),
      href: "/refund",
      icon: FileText,
      badge: t("hubRefundBadge"),
      cta: t("hubRefundCta"),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">{t("hubTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("hubSubtitle")}
        </p>

        <form onSubmit={handleSearch} className="relative mx-auto mt-6 max-w-lg">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("hubSearchPlaceholder")}
            className="pl-9"
          />
        </form>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {HUB_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col justify-between rounded-[14px] border bg-card p-6 shadow-(--shadow-tile) transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-primary"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="inline-flex size-10 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                  <card.icon className="size-5" />
                </div>
                {card.badge ? (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {card.badge}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-4 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                {card.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
            </div>

            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-primary">
              <span>{card.cta}</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* เมื่อค้นหาแล้วไม่พบคำตอบ — ทางเลือกถัดไปคือเปิดตั๋วกับทีมงาน */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t("hubNoAnswer")}{" "}
        <Link
          href="/support/tickets"
          className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline md:min-h-0"
        >
          {t("newTicket")}
        </Link>
      </p>
    </div>
  );
}
