"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Package } from "lucide-react";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
  FilterBar,
  DataTable,
  StatusBadge,
  type Column,
} from "@/components/admin";
import { orderApi, Order } from "@/lib/services/order-api";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTranslations } from "next-intl";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(n);
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });

export default function AdminOrders() {
  const t = useTranslations("AdminPage");
  const { isAdmin, isInitialized, isSessionChecked } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  useEffect(() => {
    if (!isInitialized || !isSessionChecked || !isAdmin) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await orderApi.getAllOrders(pagination.page, pagination.limit, status !== "all" ? status : undefined);
        setOrders(res.data);
        setPagination((p) => ({ ...p, total: res.meta?.total ?? 0, totalPages: res.meta?.totalPages ?? 1 }));
      } catch (err) {
        setError("ไม่สามารถโหลดคำสั่งซื้อได้");
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [pagination.page, pagination.limit, status, isInitialized, isSessionChecked, isAdmin]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await orderApi.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o)));
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const filtered = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((it) => (it.product?.name || it.productName)?.toLowerCase().includes(search.toLowerCase())),
  );

  const columns: Column<Order>[] = [
    {
      key: "id",
      header: t("orders.order_id"),
      sortable: true,
      sortAccessor: (o) => o.id,
      render: (o) => <span className="font-mono text-[11px] text-site-muted">#{o.id.slice(0, 8)}</span>,
    },
    {
      key: "customer",
      header: t("orders.customer"),
      render: (o) => (
        <div>
          <div className="font-medium text-site-text">{o.user?.username ?? "-"}</div>
          <div className="text-[10px] text-site-dim">{o.user?.email}</div>
        </div>
      ),
    },
    {
      key: "product",
      header: t("orders.product"),
      render: (o) => (
        <div>
          <div className="text-site-text">{o.items[0]?.product?.name ?? o.items[0]?.productName ?? `${o.items.length} ${t("order_detail.items")}`}</div>
          {o.items.length > 1 && <div className="text-[10px] text-site-dim">+{o.items.length - 1} {t("order_detail.items")}</div>}
        </div>
      ),
    },
    {
      key: "amount",
      header: t("orders.amount"),
      sortable: true,
      sortAccessor: (o) => o.totalAmount,
      align: "right",
      render: (o) => <span className="font-semibold">{formatCurrency(o.totalAmount)}</span>,
    },
    {
      key: "status",
      header: t("orders.status_text"),
      render: (o) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={o.status} />
          <select
            value={o.status}
            onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
            className="text-[10px] bg-transparent border border-site-border rounded px-1 py-0.5 text-site-dim cursor-pointer focus:outline-none focus:border-site-accent/60"
          >
            <option value="PENDING">{t("orders.status.pending")}</option>
            <option value="PROCESSING">{t("orders.status.processing")}</option>
            <option value="COMPLETED">{t("orders.status.completed")}</option>
            <option value="FAILED">{t("orders.status.failed")}</option>
            <option value="CANCELLED">{t("orders.status.cancelled")}</option>
            <option value="REFUNDED">{t("orders.status.refunded")}</option>
          </select>
        </div>
      ),
    },
    {
      key: "date",
      header: t("orders.date"),
      sortable: true,
      sortAccessor: (o) => new Date(o.createdAt).getTime(),
      render: (o) => <span className="text-site-dim text-[11px]">{formatDate(o.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (o) => (
        <Link href={`/admin/orders/${o.id}`}>
          <button className="p-1.5 rounded-lg border border-site-border text-site-muted hover:text-site-accent hover:border-site-accent transition-colors">
            <Eye className="w-3.5 h-3.5" />
          </button>
        </Link>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <AdminPageHeader title={t("orders.title")} description={t("orders.subtitle")} />

        {error && (
          <div className="bg-semantic-rose/10 border border-semantic-rose/30 rounded-lg text-semantic-rose px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <FilterBar
          search={{ value: search, onChange: setSearch, placeholder: t("orders.search_placeholder") }}
          filters={[
            {
              key: "status",
              value: status,
              onChange: (v) => { setStatus(v); setPagination((p) => ({ ...p, page: 1 })); },
              options: [
                { value: "all", label: t("orders.status.all") },
                { value: "PENDING", label: t("orders.status.pending") },
                { value: "PROCESSING", label: t("orders.status.processing") },
                { value: "COMPLETED", label: t("orders.status.completed") },
                { value: "FAILED", label: t("orders.status.failed") },
                { value: "CANCELLED", label: t("orders.status.cancelled") },
                { value: "REFUNDED", label: t("orders.status.refunded") },
              ],
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(o) => o.id}
          loading={loading}
          pagination={{
            page: pagination.page,
            totalPages: pagination.totalPages,
            total: pagination.total,
            pageSize: pagination.limit,
          }}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          empty={{ icon: Package, title: t("orders.no_orders") }}
        />
      </PageContainer>
    </AdminLayout>
  );
}
