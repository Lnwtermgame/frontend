"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
  FilterBar,
  DataTable,
  EmptyState,
  type Column,
} from "@/components/admin";
import { FileClock } from "lucide-react";

interface AuditLogEntry {
  id: string;
  orderId: string | null;
  paymentId: string | null;
  eventType: string;
  source: string;
  severity: "INFO" | "WARN" | "ALERT";
  previousStatus: string | null;
  newStatus: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const SEVERITY_STYLE: Record<string, string> = {
  INFO: "text-semantic-blue bg-semantic-blue/10 border-semantic-blue/20",
  WARN: "text-semantic-amber bg-semantic-amber/10 border-semantic-amber/20",
  ALERT: "text-semantic-rose bg-semantic-rose/10 border-semantic-rose/20",
};

export default function AdminAuditLogPage() {
  const t = useTranslations();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 25;
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
      });
      if (filter !== "ALL") params.append("severity", filter);
      if (search) params.append("search", search);

      const gatewayUrl =
        process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3000";
      const res = await fetch(
        `${gatewayUrl}/api/payments/admin/audit-logs?${params}`,
        { credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        const rows: AuditLogEntry[] = data.data?.logs || data.data || [];
        setLogs(rows);
        setHasMore(rows.length === perPage);
      }
    } catch (err) {
      console.error("[AuditLog]", err);
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "createdAt",
      header: "Time",
      sortable: true,
      sortAccessor: (r) => new Date(r.createdAt).getTime(),
      render: (r) => (
        <span className="whitespace-nowrap text-[11px] text-site-muted font-mono">
          {new Date(r.createdAt).toLocaleString("th-TH")}
        </span>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase tracking-wide ${SEVERITY_STYLE[r.severity] ?? SEVERITY_STYLE.INFO}`}
        >
          {r.severity}
        </span>
      ),
    },
    {
      key: "eventType",
      header: "Event",
      render: (r) => (
        <span className="font-mono text-[11px] text-site-text">
          {r.eventType}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (r) => <span className="text-[11px] text-site-muted">{r.source}</span>,
    },
    {
      key: "message",
      header: "Message",
      render: (r) => (
        <span
          className="block max-w-xs truncate text-[11px] text-site-text"
          title={r.message}
        >
          {r.message}
        </span>
      ),
    },
    {
      key: "orderId",
      header: "Order",
      render: (r) =>
        r.orderId ? (
          <span className="font-mono text-[11px] text-site-accent">
            {r.orderId.slice(0, 12)}…
          </span>
        ) : (
          <span className="text-site-dim">—</span>
        ),
    },
    {
      key: "status",
      header: "Status Change",
      render: (r) =>
        r.previousStatus && r.newStatus ? (
          <span className="text-[11px]">
            <span className="text-site-muted">{r.previousStatus}</span>
            <span className="text-site-dim"> → </span>
            <span className="font-semibold text-site-text">{r.newStatus}</span>
          </span>
        ) : (
          <span className="text-site-dim">—</span>
        ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <AdminPageHeader
          title={t("audit_log", { defaultMessage: "Audit Log" })}
          description="Payment and order audit trail"
        />

        <FilterBar
          search={{
            value: search,
            onChange: (v) => {
              setSearch(v);
              setPage(1);
            },
            placeholder: "Search by order ID, event type...",
          }}
          filters={[
            {
              key: "severity",
              value: filter,
              onChange: (v) => {
                setFilter(v);
                setPage(1);
              },
              options: [
                { value: "ALL", label: "All" },
                { value: "INFO", label: "Info" },
                { value: "WARN", label: "Warn" },
                { value: "ALERT", label: "Alert" },
              ],
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={logs}
          rowKey={(r) => r.id}
          loading={loading}
          empty={{
            icon: FileClock,
            title: "No audit logs found",
          }}
        />

        <div className="flex justify-between items-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-site-border text-site-muted hover:bg-site-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs text-site-muted">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-site-border text-site-muted hover:bg-site-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}
