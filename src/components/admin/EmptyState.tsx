"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-site-raised border border-site-border flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-site-dim" />
        </div>
      )}
      <p className="text-sm font-semibold text-site-text">{title}</p>
      {description && <p className="text-xs text-site-muted mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
