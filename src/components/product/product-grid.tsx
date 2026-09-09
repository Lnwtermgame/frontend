import type { Product } from "@/lib/api/products";
import { ProductTile } from "./product-tile";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductTile key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[14px] border bg-card">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-2.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GridEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[14px] border bg-card p-10 text-center">
      <p className="font-semibold">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
