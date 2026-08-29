import type { Metadata } from "next";
import {
  fetchProductForSeo,
  buildProductMetadata,
} from "@/lib/seo/product-seo";
import { ProductDetailSeo } from "@/components/seo/ProductDetailSeo";

type Params = Promise<{ locale: string; cardId: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { cardId } = await params;
  const product = await fetchProductForSeo(cardId);
  if (!product) return {};
  return buildProductMetadata(product);
}

export default async function CardDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  return (
    <>
      <ProductDetailSeo params={params} />
      {children}
    </>
  );
}
