import type { Metadata } from "next";
import { fetchProductMeta } from "@/lib/api/product-meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): Promise<Metadata> {
  const { gameId } = await params;
  const meta = await fetchProductMeta(gameId);
  if (!meta) return { title: "Lnwtermgame" };
  return {
    title: meta.name,
    description: meta.description?.slice(0, 160),
  };
}

export default function GameProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
