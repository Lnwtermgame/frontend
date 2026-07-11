"use client";

import { LucideIcon } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: LucideIcon;
}

export function AdminPageHeader({
  title,
  description,
  actions,
  icon: Icon,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h1 className="text-lg font-bold text-site-text tracking-tight flex items-center gap-2.5">
          {Icon && <Icon className="w-5 h-5 text-site-accent" />}
          {title}
        </h1>
        {description && (
          <p className="text-xs text-site-muted mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
