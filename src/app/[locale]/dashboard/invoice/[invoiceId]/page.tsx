"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { useInvoice } from "@/lib/query/hooks";
import { formatTHB } from "@/lib/pricing";
import { DashErrorState, formatDateTime } from "@/components/dashboard/shared";

export default function DashboardInvoiceDetailPage() {
  const t = useTranslations("dashboard");
  const routeParams = useParams<Record<string, string>>();
  const id = routeParams?.invoiceId ?? "";
  const invoice = useInvoice(id);

  if (invoice.isLoading) {
    return <Skeleton className="h-64 rounded-[14px]" />;
  }

  if (invoice.isError || !invoice.data) {
    return <DashErrorState onRetry={() => invoice.refetch()} />;
  }

  const inv = invoice.data;

  return (
    <div className="space-y-5">
      <div className="rounded-[14px] border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="num text-lg font-bold">{inv.invoiceNumber}</p>
          <p className="num ml-auto text-xs text-muted-foreground">
            {formatDateTime(inv.issuedAt)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{inv.orderNumber}</p>
      </div>

      <section className="rounded-[14px] border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t("items")}</h2>
        <div className="space-y-2">
          {inv.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="font-semibold">{item.productName}</span>
              <span className="num text-muted-foreground">×{item.quantity}</span>
              <span className="num ml-auto font-bold">{formatTHB(item.total)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span className="num">{formatTHB(inv.amount)}</span>
          </div>
          {inv.taxAmount ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT</span>
              <span className="num">{formatTHB(inv.taxAmount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between font-bold">
            <span>{t("total")}</span>
            <span className="num text-primary">{formatTHB(inv.totalAmount)}</span>
          </div>
        </div>
      </section>

      <div>
        <Link href="/dashboard/invoice" className="text-sm text-muted-foreground hover:text-primary">
          ← {t("invoices")}
        </Link>
      </div>
    </div>
  );
}
