import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton — canonical shadcn base (`animate-pulse rounded-md bg-muted`;
 * `bg-muted` resolves to site-raised via the token mirrors).
 * The project's composed skeletons keep their named export API.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function SkeletonOfferCard() {
  return (
    <div className="site-card p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-6 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCouponCard() {
  return (
    <div className="site-card p-3">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-full mt-2" />
      <Skeleton className="h-7 w-full mt-3" />
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

export function SkeletonNewsCard() {
  return (
    <div className="site-card overflow-hidden">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
    </div>
  );
}
