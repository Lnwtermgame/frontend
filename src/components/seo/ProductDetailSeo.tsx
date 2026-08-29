import { fetchProductForSeo, buildProductJsonLd } from "@/lib/seo/product-seo";
import { JsonLd } from "@/components/seo/JsonLd";

const SEGMENT_PARAMS = ["gameId", "cardId", "slug"] as const;

type SegmentParams = Partial<Record<(typeof SEGMENT_PARAMS)[number], string>>;

/**
 * Server-side SEO for the product detail routes (games/card/mobile-recharge
 * share one client page). Emits Product JSON-LD in the initial HTML.
 */
export async function ProductDetailSeo({
  params,
}: {
  params: Promise<SegmentParams>;
}) {
  const resolved = await params;
  const slug = SEGMENT_PARAMS.map((key) => resolved[key]).find(
    (value) => typeof value === "string",
  );

  if (!slug) return null;

  const product = await fetchProductForSeo(slug);
  if (!product) return null;

  return <JsonLd data={buildProductJsonLd(product)} />;
}
