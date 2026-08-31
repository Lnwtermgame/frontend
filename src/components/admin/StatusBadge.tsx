"use client";

import { useTranslations } from "next-intl";
import { getStatusConfig } from "@/lib/admin/theme";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "pill" | "dot";
  className?: string;
}

/**
 * shadcn badge base, inlined (same reason as ui/Badge.tsx — the shadcn CLI
 * would collide with the existing `Badge.tsx` on this Windows checkout, so no
 * lowercase `badge.tsx` exists). The admin pill's original metrics are kept
 * (rounded-md, uppercase tracking-wide, text-[10px]); colors come from the
 * admin semantic map below.
 */
const badgeBase =
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide w-fit whitespace-nowrap shrink-0 [&>svg]:size-3";

const SEMANTIC_PILL: Record<string, string> = {
  blue: "text-semantic-blue bg-semantic-blue/10 border-semantic-blue/20",
  violet: "text-semantic-violet bg-semantic-violet/10 border-semantic-violet/20",
  green: "text-semantic-green bg-semantic-green/10 border-semantic-green/20",
  amber: "text-semantic-amber bg-semantic-amber/10 border-semantic-amber/20",
  rose: "text-semantic-rose bg-semantic-rose/10 border-semantic-rose/20",
  dim: "text-site-muted bg-site-raised border-site-border",
};

const SEMANTIC_DOT: Record<string, string> = {
  blue: "bg-semantic-blue",
  violet: "bg-semantic-violet",
  green: "bg-semantic-green",
  amber: "bg-semantic-amber",
  rose: "bg-semantic-rose",
  dim: "bg-site-dim",
};

export function StatusBadge({ status, variant = "pill", className }: StatusBadgeProps) {
  const t = useTranslations("Admin");
  const config = getStatusConfig(status);

  if (variant === "dot") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", SEMANTIC_DOT[config.semantic])} />
        <span className="text-xs font-medium text-site-text">
          {t(`status.${config.labelKey}`)}
        </span>
      </span>
    );
  }

  return (
    <span className={cn(badgeBase, SEMANTIC_PILL[config.semantic], className)}>
      {t(`status.${config.labelKey}`)}
    </span>
  );
}
