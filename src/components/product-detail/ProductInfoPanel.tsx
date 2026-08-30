"use client";

import { DollarSign, Info, Package, Award, Calendar, Smartphone } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProductDescription from "@/components/products/ProductDescription";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PackageSelector } from "./PackageSelector";
import type { GameDetails, TopUpOption } from "./types";

export function ProductInfoPanel({
  game,
  options,
  selectedId,
  onSelect,
}: {
  game: GameDetails;
  options: TopUpOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("ProductDetail");
  const locale = useLocale();

  const infoContent = (
    <div className="space-y-6">
      <div>
        <SectionHeader
          title={t("about_product", { name: game.title })}
        />
        <ProductDescription
          description={game.longDescription || game.description}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
          <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
            <Package className="mr-2" size={16} />
            {t("developer")}
          </h4>
          <p className="text-site-text font-medium">
            {game.developer || t("unknown")}
          </p>
        </div>

        <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
          <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
            <Award className="mr-2" size={16} />
            {t("publisher")}
          </h4>
          <p className="text-site-text font-medium">
            {game.publisher || t("unknown")}
          </p>
        </div>

        {game.releaseDate && (
          <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
            <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
              <Calendar className="mr-2" size={16} />
              {t("release_date")}
            </h4>
            <p className="text-site-text font-medium">
              {new Date(game.releaseDate).toLocaleDateString(locale)}
            </p>
          </div>
        )}

        {game.platforms.length > 0 ? (
          <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
            <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
              <Smartphone className="mr-2" size={16} />
              {t("platforms")}
            </h4>
            <p className="text-site-text font-medium">
              {game.platforms.join(", ")}
            </p>
          </div>
        ) : (
          <div className="bg-site-surface border border-site-border-soft p-4 rounded-8">
            <h4 className="text-site-muted font-medium mb-2 flex items-center text-xs uppercase tracking-wider">
              <Smartphone className="mr-2" size={16} />
              {t("platforms")}
            </h4>
            <p className="text-site-text font-medium">
              {t("unknown")}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="site-card overflow-hidden mb-8">
      {/* Mobile: no tab bar, info always shows */}
      <div className="md:hidden py-3.5 px-6 text-sm font-semibold flex items-center w-full text-site-text border-b-2 border-site-accent">
        <Info size={18} className="mr-2" />
        {t("game_info")}
      </div>
      <div className="md:hidden p-5">{infoContent}</div>

      {/* Desktop tabs */}
      <Tabs defaultValue="topup" className="hidden md:block">
        <TabsList className="flex h-auto w-full items-stretch justify-start overflow-x-auto rounded-none border-b border-site-border-soft bg-transparent p-0 text-site-muted scrollbar-hide">
          <TabsTrigger
            value="topup"
            className="flex-shrink-0 items-center whitespace-nowrap rounded-none border-b-2 border-transparent px-6 py-3.5 text-sm font-semibold text-site-muted transition-colors hover:text-site-text data-[state=active]:border-site-accent data-[state=active]:bg-transparent data-[state=active]:text-site-text data-[state=active]:shadow-none"
          >
            <DollarSign size={18} className="mr-2" />
            {t("topup_options")}
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="flex-shrink-0 items-center whitespace-nowrap rounded-none border-b-2 border-transparent px-6 py-3.5 text-sm font-semibold text-site-muted transition-colors hover:text-site-text data-[state=active]:border-site-accent data-[state=active]:bg-transparent data-[state=active]:text-site-text data-[state=active]:shadow-none"
          >
            <Info size={18} className="mr-2" />
            {t("game_info")}
          </TabsTrigger>
        </TabsList>

        {/* Top-up tab — delegates entirely to PackageSelector (single source of truth) */}
        <TabsContent value="topup" className="mt-0 p-5 md:p-8">
          <PackageSelector
            options={options}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </TabsContent>

        {/* Info tab content (desktop instance) */}
        <TabsContent value="info" className="mt-0 p-5 md:p-8">
          {infoContent}
        </TabsContent>
      </Tabs>
    </div>
  );
}
