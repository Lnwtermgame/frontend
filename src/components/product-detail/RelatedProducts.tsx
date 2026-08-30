"use client";

import { useTranslations } from "next-intl";
import { PackageOpen } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GameTile } from "@/components/ui/GameTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { productImage } from "@/lib/product-image";
import type { Product } from "@/lib/services/product-api";

const isInstant = (p: Product) => p.productType === "DIRECT_TOPUP";

export function RelatedProducts({
  related,
  similar,
}: {
  related: Product[];
  similar: Product[];
}) {
  const t = useTranslations("ProductDetail");

  return (
    <>
      {/* Related products (by developer/publisher) */}
      {related.length > 0 && (
        <section className="mb-10">
          <SectionHeader
            title={t("related_products")}
            sublabel={t("related_products_sublabel")}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <GameTile
                key={p.id}
                slug={p.slug || p.id}
                name={p.name}
                image={productImage(p.name, p.imageUrl)}
                instant={isInstant(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Similar products */}
      <section className="mt-8 mb-10">
        <SectionHeader
          title={t("similar_products")}
          sublabel={t("similar_products_sublabel")}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {similar.length > 0 ? (
            similar.map((p) => (
              <GameTile
                key={p.id}
                slug={p.slug || p.id}
                name={p.name}
                image={productImage(p.name, p.imageUrl)}
                instant={isInstant(p)}
              />
            ))
          ) : (
            <EmptyState
              icon={PackageOpen}
              message={t("no_similar_found")}
            />
          )}
        </div>
      </section>
    </>
  );
}
