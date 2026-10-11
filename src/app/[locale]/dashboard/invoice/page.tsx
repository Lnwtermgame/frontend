"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useInvoices } from "@/lib/query/hooks";
import { formatTHB } from "@/lib/pricing";
import { FadeIn } from "@/components/ui/skeleton-region";
import { SkeletonList, InvoiceRowSkeleton } from "@/components/skeletons";
import { Pager, DashErrorState, DashEmptyState, DashPageHead, formatDateTime } from "@/components/dashboard/shared";

export default function DashboardInvoicesPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const invoices = useInvoices({ page, limit: 10 });

  return (
    <div>
      <DashPageHead title={t("invoices")} description={t("invoicesDesc")} />

      <div className="mt-3">
        {invoices.isLoading ? (
          <SkeletonList count={4} className="space-y-2">
            {() => <InvoiceRowSkeleton />}
          </SkeletonList>
        ) : invoices.isError ? (
          <DashErrorState onRetry={() => invoices.refetch()} />
        ) : !invoices.data?.data.length ? (
          <DashEmptyState
            title={t("emptyInvoices")}
            description={t("emptyInvoicesDesc")}
            actionHref="/dashboard/orders"
            actionLabel={t("viewOrders")}
          />
        ) : (
          <FadeIn
            className={`space-y-2 transition-opacity duration-150 ease-soft ${
              invoices.isPlaceholderData ? "pointer-events-none opacity-60" : ""
            }`}
          >
          {invoices.data.data.map((inv) => (
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
              <p className="num mt-0.5 text-xs text-muted-foreground">{formatDateTime(inv.issuedAt, locale)}</p>
            </Link>
          ))}
          </FadeIn>
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
