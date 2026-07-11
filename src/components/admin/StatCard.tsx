"use client";

import { motion } from "@/lib/framer-exports";
import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SemanticColor } from "@/lib/admin/theme";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "flat";
  semantic?: SemanticColor;
  icon?: LucideIcon;
  subtitle?: string;
}

const GLYPH: Record<SemanticColor, string> = {
  blue: "bg-semantic-blue/12 text-semantic-blue",
  violet: "bg-semantic-violet/12 text-semantic-violet",
  green: "bg-semantic-green/12 text-semantic-green",
  amber: "bg-semantic-amber/12 text-semantic-amber",
  rose: "bg-semantic-rose/12 text-semantic-rose",
  dim: "bg-site-raised text-site-dim",
};

const TREND: Record<string, string> = {
  up: "text-semantic-green bg-semantic-green/10 border-semantic-green/20",
  down: "text-semantic-rose bg-semantic-rose/10 border-semantic-rose/20",
  flat: "text-site-muted bg-site-raised border-site-border",
};

export function StatCard({
  title,
  value,
  change,
  trend = "up",
  semantic = "dim",
  icon: Icon,
  subtitle,
}: StatCardProps) {
  return (
    <motion.div
      className="bg-site-surface border border-site-border-soft rounded-12 p-4 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-semibold text-site-dim uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <span className={cn("p-1.5 rounded-lg", GLYPH[semantic])}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="mt-3">
        <span className="text-xl font-extrabold text-site-text tracking-tight">
          {value}
        </span>
        {subtitle && (
          <p className="text-[11px] text-site-muted mt-1 font-mono">{subtitle}</p>
        )}
        {typeof change === "number" && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-site-border-soft">
            <span
              className={cn(
                "inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
                TREND[trend],
              )}
            >
              {trend === "up" ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : trend === "down" ? (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              ) : null}
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
