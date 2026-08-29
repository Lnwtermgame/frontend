import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge — thin adapter over the canonical shadcn badge base, keeping the
 * project's status variants. The shadcn base is inlined here (rather than
 * imported from a lowercase `badge.tsx`) because `Badge.tsx` already existed
 * on this Windows checkout and the shadcn CLI would have clobbered it.
 *
 * Base = standard shadcn badge cva (outline-style border); colors come from
 * the project variant map below.
 */
const badgeBase =
  "inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3";

const variantClass: Record<string, string> = {
  success: "border-status-success/40 bg-status-success/15 text-status-success",
  info: "border-status-info/40 bg-status-info/15 text-status-info",
  neutral: "border-site-border bg-site-raised text-site-muted",
  danger: "border-status-danger/40 bg-status-danger/15 text-status-danger",
  warning: "border-status-warning/40 bg-status-warning/15 text-status-warning",
};

export type BadgeVariant = keyof typeof variantClass;

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(badgeBase, variantClass[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
