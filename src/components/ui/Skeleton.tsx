import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-site-raised rounded-6", className)} />;
}

export function SkeletonHero() {
  return <Skeleton className="w-full h-[180px] md:h-[220px] rounded-8" />;
}

export function SkeletonOfferCard() {
  return (
    <div className="site-card p-3">
      <Skeleton className="h-9 rounded-6" />
      <Skeleton className="h-3 w-3/4 mt-2" />
      <Skeleton className="h-4 w-10 mt-2" />
    </div>
  );
}

export function SkeletonGameTile() {
  return (
    <div className="flex flex-col items-center">
      <Skeleton className="w-full aspect-square rounded-8" />
      <Skeleton className="h-3.5 w-3/4 mt-2" />
    </div>
  );
}

export function SkeletonListRow() {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Skeleton className="w-6 h-6 rounded-4" />
      <Skeleton className="h-3.5 flex-1" />
    </div>
  );
}
