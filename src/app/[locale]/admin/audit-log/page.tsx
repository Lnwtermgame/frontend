"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

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

const SEVERITY_STYLES = {
    INFO: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", badge: "bg-blue-100" },
    WARN: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", badge: "bg-yellow-100" },
    ALERT: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100" },
};

export default function AdminAuditLogPage() {
    const t = useTranslations("Admin");
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const perPage = 25;

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: perPage.toString(),
            });
            if (filter !== "ALL") params.append("severity", filter);
            if (search) params.append("search", search);

            const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3000";
            const res = await fetch(
                `${gatewayUrl}/api/payments/admin/audit-logs?${params}`,
                { credentials: "include" },
            );
            if (res.ok) {
                const data = await res.json();
                setLogs(data.data?.logs || data.data || []);
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

    const filteredLogs = logs;

    return (
        <div className="page-container">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-black">{t("audit_log", { defaultMessage: "Audit Log" })}</h1>
                <p className="text-gray-600 text-sm mt-1">Payment and order audit trail</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input
                    type="text"
                    placeholder="Search by order ID, event type..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="input-clean flex-1 !text-sm"
                />
                <div className="flex gap-2">
                    {["ALL", "INFO", "WARN", "ALERT"].map((sev) => (
                        <button
                            key={sev}
                            onClick={() => { setFilter(sev); setPage(1); }}
                            className={`px-3 py-1.5 text-xs font-bold border-2 border-black transition-all ${filter === sev
                                    ? "bg-brutal-yellow shadow-[2px_2px_0_0_#000] -translate-x-[1px] -translate-y-[1px]"
                                    : "bg-white hover:bg-gray-50"
                                }`}
                        >
                            {sev}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="card-brutal overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-[3px] border-black bg-gray-50">
                                <th className="px-4 py-3 text-left font-bold">Time</th>
                                <th className="px-4 py-3 text-left font-bold">Severity</th>
                                <th className="px-4 py-3 text-left font-bold">Event</th>
                                <th className="px-4 py-3 text-left font-bold">Source</th>
                                <th className="px-4 py-3 text-left font-bold">Message</th>
                                <th className="px-4 py-3 text-left font-bold">Order</th>
                                <th className="px-4 py-3 text-left font-bold">Status Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                        No audit logs found
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => {
                                    const style = SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.INFO;
                                    return (
                                        <tr key={log.id} className={`border-b border-gray-200 hover:bg-gray-50 transition-colors`}>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">
                                                {new Date(log.createdAt).toLocaleString("th-TH")}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 text-xs font-bold border ${style.border} ${style.badge} ${style.text}`}>
                                                    {log.severity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{log.eventType}</td>
                                            <td className="px-4 py-3 text-xs">{log.source}</td>
                                            <td className="px-4 py-3 max-w-xs truncate" title={log.message}>
                                                {log.message}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-brutal-pink">
                                                {log.orderId ? log.orderId.slice(0, 12) + "…" : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                {log.previousStatus && log.newStatus ? (
                                                    <span>
                                                        <span className="text-gray-400">{log.previousStatus}</span>
                                                        {" → "}
                                                        <span className="font-bold">{log.newStatus}</span>
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn-brutal text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    ← Previous
                </button>
                <span className="text-sm text-gray-600">Page {page}</span>
                <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={filteredLogs.length < perPage}
                    className="btn-brutal text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
