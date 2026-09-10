"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useInvoices } from "@/lib/query/hooks";
import { formatTHB } from "@/lib/pricing";
import { Skeleton } from "@/components/ui/skeleton";
import { Pager, DashErrorState, DashEmptyState, DashPageHead, formatDateTime } from "@/components/dashboard/shared";

export default function DashboardInvoicesPage() {
  const t = useTranslations("dashboard");
  const [page, setPage] = useState(1);
  const invoices = useInvoices({ page, limit: 10 });

  return (
    <div>
      <DashPageHead title={t("invoices")} description={t("invoicesDesc")} />

      <div className="mt-3 space-y-2">
        {invoices.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[62px] rounded-[14px]" />)
        ) : invoices.isError ? (
          <DashErrorState onRetry={() => invoices.refetch()} />
        ) : !invoices.data?.data.length ? (
          <DashEmptyState title={t("emptyInvoices")} description={t("emptyInvoicesDesc")} />
        ) : (
          invoices.data.data.map((inv) => (
            <Link
              key={inv.id}
              href={`/dashboard/invoice/${inv.id}`}
              className="block rounded-[14px] border bg-card px-4 py-3 transition-colors hover:border-primary/50"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="num text-sm font-bold">{inv.invoiceNumber}</span>
                <span className="num text-xs text-muted-foreground">{inv.orderNumber}</span>
                <span className="num ml-auto text-[15px] font-bold text-primary">
                  {formatTHB(inv.totalAmount)}
                </span>
              </div>
              <p className="num mt-0.5 text-xs text-muted-foreground">{formatDateTime(inv.issuedAt)}</p>
            </Link>
          ))
        )}
      </div>

      {!invoices.isLoading && !invoices.isError && invoices.data?.meta ? (
        <Pager
          page={invoices.data.meta.page}
          totalPages={invoices.data.meta.totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}
    </div>
  );
}
