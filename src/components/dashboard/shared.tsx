"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

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
      ? "text-status-success border-status-success/40 bg-status-success/10"
      : status === "FAILED"
        ? "text-destructive border-destructive/40 bg-destructive/10"
        : status === "CANCELLED" || status === "REFUNDED"
          ? "text-muted-foreground border-border bg-secondary"
          : "text-status-warning border-status-warning/40 bg-status-warning/10";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
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
    <div className="mt-4 flex items-center justify-center gap-3">
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
    <div className="rounded-[14px] border bg-card p-10 text-center">
      <p className="font-semibold" role="alert">{t("error")}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}

export function DashEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-[14px] border bg-card p-10 text-center">
      <p className="font-semibold">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
