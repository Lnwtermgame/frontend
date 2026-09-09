import { GATEWAY_URL } from "./client";

// Server-only helper for generateMetadata: plain fetch (public endpoint),
// returns null on any failure so metadata just falls back to defaults.
export async function fetchProductMeta(
  slug: string,
): Promise<{ name: string; description?: string } | null> {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/products/slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const env = (await res.json()) as {
      success: boolean;
      data?: { name: string; shortDescription?: string; description?: string };
    };
    if (!env.success || !env.data) return null;
    return {
      name: env.data.name,
      description: env.data.shortDescription ?? env.data.description,
    };
  } catch {
    return null;
  }
}
