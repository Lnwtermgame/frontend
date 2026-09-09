import type { Metadata } from "next";
import { fetchProductMeta } from "@/lib/api/product-meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cardId: string }>;
}): Promise<Metadata> {
  const { cardId } = await params;
  const meta = await fetchProductMeta(cardId);
  if (!meta) return { title: "Lnwtermgame" };
  return {
    title: meta.name,
    description: meta.description?.slice(0, 160),
  };
}

export default function CardProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
