import type { Metadata } from "next";
import {
  fetchProductForSeo,
  buildProductMetadata,
} from "@/lib/seo/product-seo";
import { ProductDetailSeo } from "@/components/seo/ProductDetailSeo";

type Params = Promise<{ locale: string; gameId: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { gameId } = await params;
  const product = await fetchProductForSeo(gameId);
  if (!product) return {};
  return buildProductMetadata(product);
}

export default async function GameDetailLayout({
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
