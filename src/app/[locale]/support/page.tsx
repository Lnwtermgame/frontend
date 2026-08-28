"use client";

import { useState, useEffect } from "react";
import {
  PanelRight,
  Clock,
  AlertCircle,
  ChevronRight,
  Headphones,
  HelpCircle,
  Loader2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import { useTranslations, useLocale } from "next-intl";
import { supportApi, FaqArticleListItem } from "@/lib/services";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function SupportPage() {
  const t = useTranslations("Support");
  const locale = useLocale();
  const { settings } = usePublicSettings();
  const supportTicketsEnabled = settings?.features.enableSupportTickets ?? true;

  const [topArticles, setTopArticles] = useState<FaqArticleListItem[]>([]);
  const [isLoadingFaq, setIsLoadingFaq] = useState(true);

  useEffect(() => {
    loadTopArticles();
  }, [locale]);

  const loadTopArticles = async () => {
    setIsLoadingFaq(true);
    try {
      const response = await supportApi.getFaqArticles(1, 50, undefined, undefined, undefined, locale);
      if (response.success) {
        // Sort by viewCount descending, take top 6
        const sorted = [...response.data].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        setTopArticles(sorted.slice(0, 6));
      }
    } catch (err) {
      console.error("Failed to load top FAQ articles:", err);
    } finally {
      setIsLoadingFaq(false);
    }
  };

  // Support category tiles
  const supportCategories = [
    {
      icon: <HelpCircle className="h-6 w-6 text-site-bg" />,
      title: t("categories.faq.title"),
      description: t("categories.faq.description"),
      link: "/support/faq",
      isExternal: false,
    },
    {
      icon: <PanelRight className="h-6 w-6 text-site-bg" />,
      title: t("categories.tickets.title"),
      description: t("categories.tickets.description"),
      link: "/support/tickets",
      isExternal: false,
    },
  ];

  const visibleSupportCategories = supportCategories.filter((category) => {
    if (!supportTicketsEnabled && category.link === "/support/tickets")
      return false;
    return true;
  });

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="site-card p-8 mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <div>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-site-accent p-3 border border-site-border rounded-8 mr-3">
                <Headphones className="h-8 w-8 text-site-bg" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-site-text">
                {t("title")}
              </h1>
            </div>
            <p className="text-site-muted mb-6">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Support Options */}
      <section className="mb-12">
        <SectionHeader level={2} title={t("contact_methods")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleSupportCategories.map((category, index) => (
            <div
              key={index}
              className="site-card overflow-hidden group"
            >
              <Link href={category.link} className="block p-5">
                <div className="flex items-start">
                  <div className="bg-site-accent p-3 border border-site-border rounded-8">
                    {category.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-site-text font-bold text-lg">
                      {category.title}
                    </h3>
                    <p className="text-site-muted mt-1">{category.description}</p>
                    <div className="flex items-center mt-3 text-site-accent transition-colors">
                      <span className="text-sm font-medium">{t("visit")}</span>
                      <ChevronRight size={16} className="ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Support hours + Popular FAQ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="site-card p-5 md:p-8">
            <div className="flex items-center mb-4">
              <Clock className="text-site-muted mr-3" />
              <h2 className="text-xl font-bold text-site-text">{t("working_hours.title")}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-site-muted font-medium mb-2">
                  {t("working_hours.mon_fri")}
                </h3>
                <p className="text-site-text">{t("working_hours.time_mon_fri")}</p>
              </div>

              <div>
                <h3 className="text-site-muted font-medium mb-2">
                  {t("working_hours.sat_sun")}
                </h3>
                <p className="text-site-text">{t("working_hours.time_sat_sun")}</p>
              </div>

              <p className="text-site-dim text-sm">{t("working_hours.timezone")}</p>
            </div>

            <div className="mt-6 border-t border-site-border-soft pt-6">
              <div className="flex items-center">
                <AlertCircle size={18} className="text-site-muted mr-2" />
                <span className="text-site-text font-medium">
                  {t("urgent_help.title")}
                </span>
              </div>
              <p className="mt-2 text-site-muted">
                {t("urgent_help.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Popular FAQ Topics - dynamic from API */}
        <div className="lg:col-span-2">
          <div className="site-card p-5 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <SectionHeader level={2} title={t("common_issues.title")} />
              <Link
                href="/support/faq"
                className="text-[12px] text-site-accent hover:text-site-accent-hover flex items-center transition-colors font-semibold"
              >
                {t("visit")}
                <ChevronRight size={14} className="ml-0.5" />
              </Link>
            </div>

            {isLoadingFaq ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-site-muted" size={28} />
              </div>
            ) : topArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/support/faq`}
                    className="site-card p-4 flex justify-between items-center group hover:border-site-accent transition-colors"
                  >
                    <span className="text-site-text text-sm line-clamp-1 flex-1">{article.title}</span>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="text-[10px] text-site-dim flex items-center">
                        <Eye size={10} className="mr-0.5" />
                        {article.viewCount || 0}
                      </span>
                      <ChevronRight size={18} className="text-site-muted group-hover:text-site-accent transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-site-dim">
                <HelpCircle size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">ยังไม่มีบทความ FAQ</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
