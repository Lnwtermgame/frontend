"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function DashPageHead({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {description ? (
          <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("dashboard");
  const key = `status_${status}` as const;
  let label: string = status;
  try {
    label = t(key as never);
  } catch {
    label = status;
  }
  const tone =
    status === "COMPLETED"
      ? "text-status-success"
      : status === "FAILED"
        ? "text-destructive"
        : status === "CANCELLED" || status === "REFUNDED"
          ? "text-muted-foreground"
          : "text-status-warning";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${tone}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function Pager({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("dashboard");
  if (totalPages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
        {t("prev")}
      </Button>
      <span className="num text-sm text-muted-foreground">
        {t("page", { page, totalPages })}
      </span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={page >= totalPages}>
        {t("next")}
      </Button>
    </div>
  );
}

export function DashErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("dashboard");
  return (
    <div className="rounded-[14px] border bg-card p-8 text-center">
      <p className="text-sm font-semibold" role="alert">{t("error")}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}

export function DashEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-[14px] border bg-card p-8 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {description ? (
        <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export { formatDateTime } from "@/lib/format";
