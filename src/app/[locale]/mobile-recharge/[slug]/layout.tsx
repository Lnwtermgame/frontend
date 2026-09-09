import type { Metadata } from "next";
import { fetchProductMeta } from "@/lib/api/product-meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = await fetchProductMeta(slug);
  if (!meta) return { title: "Lnwtermgame" };
  return {
    title: meta.name,
    description: meta.description?.slice(0, 160),
  };
}

export default function MobileProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
