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
      icon: <HelpCircle className="h-6 w-6 text-white" />,
      title: t("categories.faq.title"),
      description: t("categories.faq.description"),
      link: "/support/faq",
      isExternal: false,
    },
    {
      icon: <PanelRight className="h-6 w-6 text-white" />,
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
    <div className="page-container bg-transparent">
      {/* Hero Section */}
      <div
        className="bg-[#1A1C20] border border-site-border rounded-[16px] p-8 mb-8"
        
      >
        <div className="max-w-3xl mx-auto text-center">
          <div>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-site-accent p-3 border border-site-border rounded-[12px] mr-3">
                <Headphones className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {t("title")}
              </h1>
            </div>
            <p className="text-gray-600 mb-6">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Support Options */}
      <section className="mb-12">
        <div className="flex items-center mb-6">
          <span className="w-1.5 h-5 bg-site-accent mr-2"></span>
          <h2 className="text-2xl font-bold text-white">{t("contact_methods")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleSupportCategories.map((category, index) => (
            <div
              key={index}
              className="bg-[#1A1C20] border border-site-border rounded-[16px] overflow-hidden group hover:-translate-y-0.5 transition-transform"
              
            >
              <Link href={category.link} className="block p-6">
                <div className="flex items-start">
                  <div className="bg-yellow-500 p-3 border border-site-border rounded-[12px]">
                    {category.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-white font-bold text-lg">
                      {category.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{category.description}</p>
                    <div className="flex items-center mt-3 text-white group-hover:text-gray-700 transition-colors">
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
          <div
            className="bg-[#1A1C20] border border-site-border rounded-[16px] p-6 md:p-8"
            
          >
            <div className="flex items-center mb-4">
              <Clock className="text-white mr-3" />
              <h2 className="text-xl font-bold text-white">{t("working_hours.title")}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-gray-600 font-medium mb-2">
                  {t("working_hours.mon_fri")}
                </h3>
                <p className="text-white">{t("working_hours.time_mon_fri")}</p>
              </div>

              <div>
                <h3 className="text-gray-600 font-medium mb-2">
                  {t("working_hours.sat_sun")}
                </h3>
                <p className="text-white">{t("working_hours.time_sat_sun")}</p>
              </div>

              <p className="text-gray-600 text-sm">{t("working_hours.timezone")}</p>
            </div>

            <div className="mt-6 border-t-2 border-gray-200 pt-6">
              <div className="flex items-center">
                <AlertCircle size={18} className="text-white mr-2" />
                <span className="text-white font-medium">
                  {t("urgent_help.title")}
                </span>
              </div>
              <p className="mt-2 text-gray-600">
                {t("urgent_help.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Popular FAQ Topics - dynamic from API */}
        <div className="lg:col-span-2">
          <div
            className="bg-[#1A1C20] border border-site-border rounded-[16px] p-6 md:p-8"
            
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <span className="w-1.5 h-5 bg-pink-500 mr-2"></span>
                <h2 className="text-xl font-bold text-white">{t("common_issues.title")}</h2>
              </div>
              <Link
                href="/support/faq"
                className="text-sm font-medium text-white hover:text-gray-600 flex items-center transition-colors"
              >
                {t("visit")}
                <ChevronRight size={14} className="ml-0.5" />
              </Link>
            </div>

            {isLoadingFaq ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-gray-400" size={28} />
              </div>
            ) : topArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {topArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/support/faq`}
                    className="bg-[#2A2C30] hover:bg-site-border/30 border border-site-border p-4 flex justify-between items-center transition-colors group"
                  >
                    <span className="text-white text-sm line-clamp-1 flex-1">{article.title}</span>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="text-[10px] text-gray-500 flex items-center">
                        <Eye size={10} className="mr-0.5" />
                        {article.viewCount || 0}
                      </span>
                      <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
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
