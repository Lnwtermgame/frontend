import type { Metadata } from "next";
import {
  fetchProductForSeo,
  buildProductMetadata,
} from "@/lib/seo/product-seo";
import { ProductDetailSeo } from "@/components/seo/ProductDetailSeo";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductForSeo(slug);
  if (!product) return {};
  return buildProductMetadata(product);
}

export default async function MobileRechargeDetailLayout({
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
