"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Flame,
  Loader2,
  Monitor,
  RefreshCcw,
  Search,
  Send,
  UserPlus,
  X,
} from "lucide-react";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
} from "@/components/admin";
import { useAuth } from "@/lib/hooks/use-auth";
import { AdminUser, adminUserApi } from "@/lib/services/admin-user-api";
import {
  supportApi,
  Ticket,
  TicketCategory,
  TicketDetail,
  TicketPriority,
  TicketStats,
  TicketStatus,
} from "@/lib/services/support-api";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusKeyMap: Record<TicketStatus, string> = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  WAITING_USER: "waiting_user",
  WAITING_ADMIN: "waiting_admin",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

const categoryKeyMap: Record<TicketCategory, string> = {
  ORDER_ISSUE: "order_issue",
  PAYMENT_ISSUE: "payment_issue",
  PRODUCT_ISSUE: "product_issue",
  ACCOUNT_ISSUE: "account_issue",
  TECHNICAL_SUPPORT: "technical_support",
  REFUND_REQUEST: "refund_request",
  GENERAL_INQUIRY: "general_inquiry",
};

const EMPTY_STATS: TicketStats = {
  total: 0,
  open: 0,
  inProgress: 0,
  waitingUser: 0,
  waitingAdmin: 0,
  resolved: 0,
  closed: 0,
};

type SlaPreset = "ALL" | "SLA_8" | "SLA_24";

function getHoursSince(dateInput: string): number {
  const diffMs = Date.now() - new Date(dateInput).getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60));
}

function getSlaLevel(ticket: Ticket): "none" | "8h" | "24h" {
  if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
    return "none";
  }
  const ageHours = getHoursSince(ticket.updatedAt);
  if (ageHours >= 24) return "24h";
  if (ageHours >= 8) return "8h";
  return "none";
}

function formatAge(dateInput: string): string {
  const totalMinutes = Math.floor(getHoursSince(dateInput) * 60);
  if (totalMinutes < 1) return "< 1 นาที";
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}วัน ${hours}ชม.`;
  if (hours > 0) return `${hours}ชม. ${minutes}นาที`;
  return `${minutes} นาที`;
}

function timeAgo(dateInput: string): string {
  const totalMinutes = Math.floor(getHoursSince(dateInput) * 60);
  if (totalMinutes < 1) return "เมื่อสักครู่";
  if (totalMinutes < 60) return `${totalMinutes} นาทีที่แล้ว`;
  const hours = Math.floor(totalMinutes / 60);
  if (hours < 24) return `${hours} ชม.ที่แล้ว`;
  return `${Math.floor(hours / 24)} วันที่แล้ว`;
}

function toCsvCell(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replace(/\"/g, '""')}"`;
  }
  return text;
}

const PIPELINE_STAGES: {
  key: "ALL" | TicketStatus;
  statsField: keyof TicketStats;
}[] = [
  { key: "ALL", statsField: "total" },
  { key: "OPEN", statsField: "open" },
  { key: "IN_PROGRESS", statsField: "inProgress" },
  { key: "WAITING_USER", statsField: "waitingUser" },
  { key: "WAITING_ADMIN", statsField: "waitingAdmin" },
  { key: "RESOLVED", statsField: "resolved" },
];

const STATUS_PILL_STYLES: Record<
  TicketStatus,
  { chip: string; dot: string }
> = {
  OPEN: {
    chip: "border-[rgb(var(--status-info-rgb)/0.3)] bg-[rgb(var(--status-info-rgb)/0.1)] text-[rgb(var(--status-info-rgb))]",
    dot: "bg-[rgb(var(--status-info-rgb))]",
  },
  IN_PROGRESS: {
    chip: "border-site-accent/30 bg-site-accent/10 text-site-accent",
    dot: "bg-site-accent",
  },
  WAITING_USER: {
    chip: "border-[rgb(var(--status-info-rgb)/0.3)] bg-[rgb(var(--status-info-rgb)/0.1)] text-[rgb(var(--status-info-rgb))]",
    dot: "bg-[rgb(var(--status-info-rgb))]",
  },
  WAITING_ADMIN: {
    chip: "border-[rgb(var(--status-warning-rgb)/0.3)] bg-[rgb(var(--status-warning-rgb)/0.1)] text-[rgb(var(--status-warning-rgb))]",
    dot: "bg-[rgb(var(--status-warning-rgb))]",
  },
  RESOLVED: {
    chip: "border-[rgb(var(--status-success-rgb)/0.3)] bg-[rgb(var(--status-success-rgb)/0.1)] text-[rgb(var(--status-success-rgb))]",
    dot: "bg-[rgb(var(--status-success-rgb))]",
  },
  CLOSED: {
    chip: "border-site-border bg-site-raised text-site-dim",
    dot: "bg-site-dim",
  },
};

const PRIORITY_PILL_STYLES: Record<
  TicketPriority,
  { chip: string }
> = {
  URGENT: {
    chip: "border-[rgb(var(--status-danger-rgb)/0.45)] bg-[rgb(var(--status-danger-rgb)/0.18)] text-[rgb(var(--status-danger-rgb))]",
  },
  HIGH: {
    chip: "border-[rgb(var(--status-warning-rgb)/0.35)] bg-[rgb(var(--status-warning-rgb)/0.12)] text-[rgb(var(--status-warning-rgb))]",
  },
  MEDIUM: {
    chip: "border-site-border bg-site-raised text-site-muted",
  },
  LOW: {
    chip: "border-site-border-soft bg-site-raised text-site-dim",
  },
};

function StatusPill({ status }: { status: TicketStatus }) {
  const t = useTranslations("AdminPage");
  const style = STATUS_PILL_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {t(`tickets.status.${statusKeyMap[status]}`)}
    </span>
  );
}

function PriorityPill({ priority }: { priority: TicketPriority }) {
  const t = useTranslations("AdminPage");
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-lg border px-2 py-0.5 text-[10px] font-bold ${PRIORITY_PILL_STYLES[priority]?.chip ?? PRIORITY_PILL_STYLES.MEDIUM.chip}`}>
      {priority === "URGENT"
        ? t("tickets.priorities.urgent")
        : priority === "HIGH"
          ? t("tickets.priorities.high")
          : priority === "MEDIUM"
            ? "ปานกลาง"
            : "ต่ำ"}
    </span>
  );
}

function SlaBar({ ticket }: { ticket: Ticket }) {
  if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
    return (
      <div className="flex min-w-[92px] flex-col gap-1">
        <div className="h-1 overflow-hidden rounded-full bg-site-raised">
          <div className="h-full w-full rounded-full bg-[rgb(var(--status-success-rgb))]" />
        </div>
        <span className="font-mono text-[10px] text-site-dim">ปิดแล้ว</span>
      </div>
    );
  }

  const ageHours = getHoursSince(ticket.updatedAt);
  const level = getSlaLevel(ticket);
  const ratio = Math.min(1, ageHours / 24);
  const fillClass =
    level === "24h"
      ? "bg-[rgb(var(--status-danger-rgb))]"
      : level === "8h"
        ? "bg-[rgb(var(--status-warning-rgb))]"
        : "bg-[rgb(var(--status-success-rgb))]";
  const textClass =
    level === "24h"
      ? "text-[rgb(var(--status-danger-rgb))]"
      : level === "8h"
        ? "text-[rgb(var(--status-warning-rgb))]"
        : "text-site-dim";

  return (
    <div className="flex min-w-[92px] flex-col gap-1">
      <div className="h-1 overflow-hidden rounded-full bg-site-raised">
        <div
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${Math.max(4, ratio * 100)}%` }}
        />
      </div>
      <span className={`font-mono text-[10px] ${textClass}`}>
        {level === "24h" ? `${formatAge(ticket.updatedAt)} ⚠` : formatAge(ticket.updatedAt)}
      </span>
    </div>
  );
}

function AdminTicketsPageContent() {
  const t = useTranslations("AdminPage");
  const searchParams = useSearchParams();
  const { isAdmin } = useAuth();
  const isMonitorMode = searchParams.get("monitor") === "1";

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stats, setStats] = useState<TicketStats>(EMPTY_STATS);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [bulkAssigneeId, setBulkAssigneeId] = useState("");

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [priority, setPriority] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<
    "updatedAt" | "createdAt" | "priority" | "status"
  >("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [slaPreset, setSlaPreset] = useState<SlaPreset>("ALL");

  const [reply, setReply] = useState("");
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const resolvedSlaHours = useMemo<number | undefined>(() => {
    if (slaPreset === "SLA_8") return 8;
    if (slaPreset === "SLA_24") return 24;
    return undefined;
  }, [slaPreset]);

  const adminNameById = useMemo(() => {
    return new Map(admins.map((admin) => [admin.id, admin.username]));
  }, [admins]);

  const breachedCount = useMemo(() => {
    let over8 = 0;
    let over24 = 0;
    let unassigned = 0;
    for (const ticket of tickets) {
      const level = getSlaLevel(ticket);
      if (level === "24h") {
        over24 += 1;
        over8 += 1;
      } else if (level === "8h") {
        over8 += 1;
      }
      if (!ticket.assignedTo && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
        unassigned += 1;
      }
    }
    return { over8, over24, unassigned };
  }, [tickets]);

  const loadTickets = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        supportApi.getAllTickets(page, limit, {
          status: status !== "ALL" ? (status as TicketStatus) : undefined,
          priority:
            priority !== "ALL" ? (priority as TicketPriority) : undefined,
          category:
            category !== "ALL" ? (category as TicketCategory) : undefined,
          assignedTo:
            assigneeFilter !== "ALL" && assigneeFilter !== "UNASSIGNED"
              ? assigneeFilter
              : undefined,
          unassignedOnly: assigneeFilter === "UNASSIGNED",
          search: search || undefined,
          sortBy,
          sortOrder,
          createdFrom: createdFrom || undefined,
          createdTo: createdTo || undefined,
          slaHours: resolvedSlaHours,
        }),
        supportApi.getTicketStats(),
      ]);

      setTickets(listRes.data);
      setTotalPages(listRes.meta?.totalPages || 1);
      setStats(statsRes.data);
      setSelectedIds((prev) =>
        prev.filter((id) => listRes.data.some((t) => t.id === id)),
      );
      setLastRefreshedAt(new Date());
      setError(null);
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [
    isAdmin,
    page,
    limit,
    status,
    priority,
    category,
    assigneeFilter,
    search,
    sortBy,
    sortOrder,
    createdFrom,
    createdTo,
    resolvedSlaHours,
  ]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (!isAdmin) return;
    const loadAdmins = async () => {
      try {
        const response = await adminUserApi.getUsers({
          role: "ADMIN",
          isActive: true,
          page: 1,
          limit: 100,
        });
        setAdmins(response.data.users);
      } catch {
        setAdmins([]);
      }
    };
    loadAdmins();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !autoRefresh) return;
    const timer = setInterval(() => {
      loadTickets();
    }, 30000);
    return () => clearInterval(timer);
  }, [isAdmin, autoRefresh, loadTickets]);

  const loadDetail = useCallback(async (ticketId: string) => {
    try {
      setDetailLoading(true);
      const res = await supportApi.getTicketDetail(ticketId);
      setSelectedTicket(res.data);
      setError(null);
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const updateSelectedTicket = async (payload: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedTo?: string | null;
  }) => {
    if (!selectedTicket) return;
    try {
      setUpdating(true);
      await supportApi.updateTicket(selectedTicket.id, payload);
      await Promise.all([loadTickets(), loadDetail(selectedTicket.id)]);
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const sendReplyNow = useCallback(async () => {
    if (!selectedTicket || !reply.trim()) return;

    try {
      setSending(true);
      await supportApi.addReply(selectedTicket.id, { content: reply.trim() });
      setReply("");
      await Promise.all([loadTickets(), loadDetail(selectedTicket.id)]);
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }, [loadDetail, loadTickets, reply, selectedTicket]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const targetTag = target?.tagName.toLowerCase();
      const editing =
        targetTag === "input" ||
        targetTag === "textarea" ||
        targetTag === "select";
      if (editing && !(event.ctrlKey && event.key === "Enter")) return;

      if (event.key === "/") {
        event.preventDefault();
        document.getElementById("ticket-search-input")?.focus();
        return;
      }

      if (event.key === "j" || event.key === "J") {
        event.preventDefault();
        if (tickets.length === 0) return;
        const currentIndex = tickets.findIndex(
          (t) => t.id === selectedTicket?.id,
        );
        const nextIndex =
          currentIndex < 0 ? 0 : Math.min(tickets.length - 1, currentIndex + 1);
        void loadDetail(tickets[nextIndex].id);
      }

      if (event.key === "k" || event.key === "K") {
        event.preventDefault();
        if (tickets.length === 0) return;
        const currentIndex = tickets.findIndex(
          (t) => t.id === selectedTicket?.id,
        );
        const prevIndex = currentIndex < 0 ? 0 : Math.max(0, currentIndex - 1);
        void loadDetail(tickets[prevIndex].id);
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        replyInputRef.current?.focus();
      }

      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        if (!selectedTicket || !reply.trim() || sending) return;
        void sendReplyNow();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loadDetail, reply, selectedTicket, sendReplyNow, sending, tickets]);

  const sendReply = (event: React.FormEvent) => {
    event.preventDefault();
    void sendReplyNow();
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const allVisibleSelected =
    tickets.length > 0 &&
    tickets.every((ticket) => selectedIds.includes(ticket.id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !tickets.some((ticket) => ticket.id === id));
      }
      const merged = new Set(prev);
      tickets.forEach((ticket) => merged.add(ticket.id));
      return Array.from(merged);
    });
  };

  const runBulkUpdate = async (payload: {
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedTo?: string | null;
  }) => {
    if (selectedIds.length === 0) return;

    try {
      setBulkUpdating(true);
      await Promise.all(
        selectedIds.map((ticketId) =>
          supportApi.updateTicket(ticketId, payload),
        ),
      );
      const selectedDetailId = selectedTicket?.id;
      setSelectedIds([]);

      if (selectedDetailId && selectedIds.includes(selectedDetailId)) {
        await Promise.all([loadTickets(), loadDetail(selectedDetailId)]);
      } else {
        await loadTickets();
      }
      setError(null);
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setBulkUpdating(false);
    }
  };

  const exportCsv = async () => {
    if (!isAdmin) return;

    try {
      setExporting(true);
      const exportLimit = 100;
      let currentPage = 1;
      let maxPages = 1;
      const rows: Ticket[] = [];

      while (currentPage <= maxPages) {
        const response = await supportApi.getAllTickets(
          currentPage,
          exportLimit,
          {
            status: status !== "ALL" ? (status as TicketStatus) : undefined,
            priority:
              priority !== "ALL" ? (priority as TicketPriority) : undefined,
            category:
              category !== "ALL" ? (category as TicketCategory) : undefined,
            assignedTo:
              assigneeFilter !== "ALL" && assigneeFilter !== "UNASSIGNED"
                ? assigneeFilter
                : undefined,
            unassignedOnly: assigneeFilter === "UNASSIGNED",
            search: search || undefined,
            sortBy,
            sortOrder,
            createdFrom: createdFrom || undefined,
            createdTo: createdTo || undefined,
            slaHours: resolvedSlaHours,
          },
        );

        rows.push(...response.data);
        maxPages = response.meta?.totalPages || 1;
        currentPage += 1;
      }

      const headers = [
        "ticketNumber",
        "subject",
        "status",
        "priority",
        "category",
        "username",
        "email",
        "assignedTo",
        "orderId",
        "createdAt",
        "updatedAt",
      ];

      const csv = [
        headers.join(","),
        ...rows.map((ticket) =>
          [
            ticket.ticketNumber,
            ticket.subject,
            ticket.status,
            ticket.priority,
            ticket.category,
            ticket.user?.username ?? "",
            ticket.user?.email ?? "",
            ticket.assignedTo
              ? (adminNameById.get(ticket.assignedTo) ?? ticket.assignedTo)
              : "",
            ticket.orderId ?? "",
            ticket.createdAt,
            ticket.updatedAt,
          ]
            .map(toCsvCell)
            .join(","),
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `tickets-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setStatus("ALL");
    setPriority("ALL");
    setCategory("ALL");
    setAssigneeFilter("ALL");
    setSortBy("updatedAt");
    setSortOrder("desc");
    setCreatedFrom("");
    setCreatedTo("");
    setSlaPreset("ALL");
    setPage(1);
  };

  const setQueuePreset = (preset: "ALL" | "WAITING_ADMIN" | "UNASSIGNED") => {
    if (preset === "UNASSIGNED") {
      setAssigneeFilter("UNASSIGNED");
      setStatus("ALL");
      setPage(1);
      return;
    }
    setAssigneeFilter("ALL");
    setStatus(preset);
    setPage(1);
  };

  const openMonitorWindow = useCallback(() => {
    const monitorUrl = `${window.location.origin}/admin/tickets?monitor=1`;
    window.open(
      monitorUrl,
      "ticket-monitor-window",
      "popup=yes,width=1500,height=920,toolbar=no,location=yes,status=no,menubar=no,scrollbars=yes,resizable=yes",
    );
  }, []);

  const pipelineStages = PIPELINE_STAGES.map((stage) => {
    const count =
      stage.key === "ALL" ? stats.total : (stats[stage.statsField] as number);
    const stageTickets =
      stage.key === "ALL"
        ? tickets
        : tickets.filter((ticket) => ticket.status === stage.key);
    const over8 = stageTickets.filter(
      (ticket) => getSlaLevel(ticket) === "8h",
    ).length;
    const over24 = stageTickets.filter(
      (ticket) => getSlaLevel(ticket) === "24h",
    ).length;
    return { ...stage, count, over8, over24 };
  });

  const isStageActive = (stageKey: string) => {
    if (stageKey === "ALL") return status === "ALL" && slaPreset === "ALL";
    return status === stageKey;
  };

  const selectStage = (stageKey: string) => {
    if (stageKey === "ALL") {
      setStatus("ALL");
      setSlaPreset("ALL");
    } else {
      setStatus(stageKey);
    }
    setPage(1);
  };

  const content = (
    <div className={isMonitorMode ? "space-y-3 p-3" : "space-y-3"}>
      {isMonitorMode && (
        <div className="flex items-center justify-between rounded-xl border border-site-border-soft bg-site-raised px-3 py-2 text-sm">
          <span className="font-medium text-site-text">
            หน้าต่างมอนิเตอร์ทิกเก็ต
          </span>
          <Link href="/admin/tickets" className="text-site-accent hover:underline">
            เปิดหน้าแอดมินแบบเต็ม
          </Link>
        </div>
      )}

      {/* ===== Page head: title + SLA summary boxes ===== */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <AdminPageHeader title="จัดการทิกเก็ต" />
        <div className="flex flex-wrap items-stretch gap-2">
          <div className="rounded-xl border border-site-border-soft bg-site-surface px-3.5 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-site-dim">
              SLA &gt; 8ชม. (หน้านี้)
            </div>
            <div className="font-mono text-base font-bold text-[rgb(var(--status-warning-rgb))]">
              {breachedCount.over8}
            </div>
          </div>
          <div className="rounded-xl border border-site-border-soft bg-site-surface px-3.5 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-site-dim">
              SLA &gt; 24ชม. (หน้านี้)
            </div>
            <div className="font-mono text-base font-bold text-[rgb(var(--status-danger-rgb))]">
              {breachedCount.over24}
            </div>
          </div>
          <div className="rounded-xl border border-site-border-soft bg-site-surface px-3.5 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-site-dim">
              ยังไม่มอบหมาย (หน้านี้)
            </div>
            <div className="font-mono text-base font-bold text-site-text">
              {breachedCount.unassigned}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center rounded-xl border border-[rgb(var(--status-danger-rgb)/0.3)] bg-[rgb(var(--status-danger-rgb)/0.1)] p-3 text-[rgb(var(--status-danger-rgb))]">
          <AlertCircle className="mr-2" size={16} />
          {error}
        </div>
      )}

      {/* ===== Status pipeline ===== */}
      <div className="flex items-center gap-0 overflow-x-auto px-2 pt-2.5 pb-1">
        {pipelineStages.map((stage, index) => (
          <div key={stage.key} className="flex items-center">
            {index > 0 && (
              <ArrowRight
                className="mx-1.5 h-3.5 w-3.5 flex-shrink-0 text-site-dim"
                aria-hidden
              />
            )}
            <button
              onClick={() => selectStage(stage.key)}
              className={`relative flex min-w-[110px] flex-col items-start gap-0.5 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                isStageActive(stage.key)
                  ? "border-site-accent/50 bg-site-accent/10"
                  : "border-site-border-soft bg-site-surface hover:border-site-border"
              }`}>
              {(stage.over8 > 0 || stage.over24 > 0) && (
                <span className="absolute -right-1.5 -top-2 flex gap-1">
                  {stage.over8 > 0 && (
                    <span className="rounded-md bg-[rgb(var(--status-warning-rgb))] px-1.5 py-0.5 font-mono text-[9px] font-bold text-site-bg">
                      {stage.over8}
                    </span>
                  )}
                  {stage.over24 > 0 && (
                    <span className="rounded-md bg-[rgb(var(--status-danger-rgb))] px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                      {stage.over24}
                    </span>
                  )}
                </span>
              )}
              <span className="font-mono text-lg font-bold leading-none text-site-text">
                {stage.count}
              </span>
              <span className="whitespace-nowrap text-[10.5px] font-bold text-site-muted">
                {stage.key === "ALL"
                  ? "ทั้งหมด"
                  : t(`tickets.status.${statusKeyMap[stage.key as TicketStatus]}`)}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* ===== Filter row ===== */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex w-full max-w-xs items-center gap-2 rounded-xl border border-site-border bg-site-raised px-3 py-1.5">
          <Search className="h-3.5 w-3.5 flex-shrink-0 text-site-dim" />
          <input
            id="ticket-search-input"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="ค้นหาเลขทิกเก็ต / หัวข้อ / ผู้ใช้…"
            className="w-full flex-1 bg-transparent text-[13px] text-site-text outline-none placeholder:text-site-dim"
          />
          <kbd className="rounded border border-site-border bg-site-surface px-1.5 py-0.5 font-mono text-[10px] text-site-dim">
            /
          </kbd>
        </div>

        <button
          onClick={() => setQueuePreset("WAITING_ADMIN")}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
            status === "WAITING_ADMIN"
              ? "border-[rgb(var(--status-warning-rgb)/0.4)] bg-[rgb(var(--status-warning-rgb)/0.1)] text-[rgb(var(--status-warning-rgb))]"
              : "border-site-border bg-site-raised text-site-muted hover:border-site-dim"
          }`}>
          <Flame size={12} />
          ต้องตอบกลับ
        </button>

        <button
          onClick={() => setQueuePreset("UNASSIGNED")}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
            assigneeFilter === "UNASSIGNED"
              ? "border-site-accent/40 bg-site-accent/10 text-site-accent"
              : "border-site-border bg-site-raised text-site-muted hover:border-site-dim"
          }`}>
          <UserPlus size={12} />
          ยังไม่มอบหมาย
        </button>

        <Select value={priority} onValueChange={(value) => { setPriority(value); setPage(1); }}>
          <SelectTrigger className="h-[34px] w-[140px] rounded-lg border-site-border bg-site-raised text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทุกระดับความสำคัญ</SelectItem>
            <SelectItem value="LOW">ต่ำ</SelectItem>
            <SelectItem value="MEDIUM">ปานกลาง</SelectItem>
            <SelectItem value="HIGH">{t("tickets.priorities.high")}</SelectItem>
            <SelectItem value="URGENT">{t("tickets.priorities.urgent")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(value) => { setCategory(value); setPage(1); }}>
          <SelectTrigger className="h-[34px] w-[170px] rounded-lg border-site-border bg-site-raised text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("tickets.categories.all")}</SelectItem>
            {Object.entries(categoryKeyMap).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {t(`tickets.categories.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={assigneeFilter} onValueChange={(value) => { setAssigneeFilter(value); setPage(1); }}>
          <SelectTrigger className="h-[34px] w-[150px] rounded-lg border-site-border bg-site-raised text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("tickets.all_assignees")}</SelectItem>
            <SelectItem value="UNASSIGNED">{t("tickets.unassigned")}</SelectItem>
            {admins.map((admin) => (
              <SelectItem key={admin.id} value={admin.id}>
                {admin.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={slaPreset} onValueChange={(value) => { setSlaPreset(value as SlaPreset); setPage(1); }}>
          <SelectTrigger className="h-[34px] w-[130px] rounded-lg border-site-border bg-site-raised text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">SLA ทั้งหมด</SelectItem>
            <SelectItem value="SLA_8">SLA &gt; 8ชม.</SelectItem>
            <SelectItem value="SLA_24">SLA &gt; 24ชม.</SelectItem>
          </SelectContent>
        </Select>

        <Input
          size="sm"
          type="date"
          className="h-[34px] w-[140px] rounded-lg border-site-border bg-site-raised text-xs"
          value={createdFrom}
          onChange={(event) => { setCreatedFrom(event.target.value); setPage(1); }}
        />
        <Input
          size="sm"
          type="date"
          className="h-[34px] w-[140px] rounded-lg border-site-border bg-site-raised text-xs"
          value={createdTo}
          onChange={(event) => { setCreatedTo(event.target.value); setPage(1); }}
        />

        <div className="ml-auto flex items-center gap-2">
          <Select value={String(limit)} onValueChange={(value) => { setLimit(Number(value)); setPage(1); }}>
            <SelectTrigger className="h-[34px] w-[100px] rounded-lg border-site-border bg-site-raised text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 / หน้า</SelectItem>
              <SelectItem value="50">50 / หน้า</SelectItem>
              <SelectItem value="100">100 / หน้า</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as "updatedAt" | "createdAt" | "priority" | "status")}>
            <SelectTrigger className="h-[34px] w-[160px] rounded-lg border-site-border bg-site-raised text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">เรียง: เวลาอัปเดต</SelectItem>
              <SelectItem value="createdAt">เรียง: เวลาสร้าง</SelectItem>
              <SelectItem value="priority">เรียง: ความสำคัญ</SelectItem>
              <SelectItem value="status">เรียง: สถานะ</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
            <SelectTrigger className="h-[34px] w-[110px] rounded-lg border-site-border bg-site-raised text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">ใหม่ไปเก่า</SelectItem>
              <SelectItem value="asc">เก่าไปใหม่</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={loadTickets}
            title="รีเฟรชทันที"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-site-border bg-site-raised text-site-muted transition-colors hover:text-site-text"
          >
            <RefreshCcw size={14} />
          </button>
          <button
            onClick={() => setAutoRefresh((prev) => !prev)}
            title="รีเฟรชอัตโนมัติทุก 30 วินาที"
            className={`inline-flex h-[34px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold transition-colors ${
              autoRefresh
                ? "border-[rgb(var(--status-success-rgb)/0.4)] bg-[rgb(var(--status-success-rgb)/0.1)] text-[rgb(var(--status-success-rgb))]"
                : "border-site-border bg-site-raised text-site-muted"
            }`}>
            <span className="relative flex h-2 w-2">
              {autoRefresh && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[rgb(var(--status-success-rgb))] opacity-60" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${autoRefresh ? "bg-[rgb(var(--status-success-rgb))]" : "bg-site-dim"}`}
              />
            </span>
            LIVE
          </button>
        </div>
      </div>

      {/* ===== Advanced filter chips ===== */}
      <div className="flex flex-wrap items-center gap-2">
        {(status !== "ALL" || priority !== "ALL" || category !== "ALL" || assigneeFilter !== "ALL" || slaPreset !== "ALL" || search || createdFrom || createdTo) && (
          <>
            <span className="text-[11px] font-bold text-site-dim">ตัวกรองที่ใช้งาน:</span>
            {search && (
              <button
                onClick={() => setSearchInput("")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-site-accent/40 bg-site-accent/10 px-2.5 py-1 text-[11px] font-bold text-site-accent">
                ค้นหา: {search} <X size={11} />
              </button>
            )}
            {status !== "ALL" && (
              <button
                onClick={() => { setStatus("ALL"); setPage(1); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-site-accent/40 bg-site-accent/10 px-2.5 py-1 text-[11px] font-bold text-site-accent">
                {status === "WAITING_ADMIN" ? "ต้องตอบกลับ" : t(`tickets.status.${statusKeyMap[status as TicketStatus]}`)} <X size={11} />
              </button>
            )}
            {priority !== "ALL" && (
              <button
                onClick={() => { setPriority("ALL"); setPage(1); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-site-accent/40 bg-site-accent/10 px-2.5 py-1 text-[11px] font-bold text-site-accent">
                {priority === "URGENT" ? t("tickets.priorities.urgent") : priority === "HIGH" ? t("tickets.priorities.high") : priority === "MEDIUM" ? "ปานกลาง" : "ต่ำ"} <X size={11} />
              </button>
            )}
            {category !== "ALL" && (
              <button
                onClick={() => { setCategory("ALL"); setPage(1); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-site-accent/40 bg-site-accent/10 px-2.5 py-1 text-[11px] font-bold text-site-accent">
                {t(`tickets.categories.${categoryKeyMap[category as TicketCategory]}`)} <X size={11} />
              </button>
            )}
            {assigneeFilter !== "ALL" && (
              <button
                onClick={() => { setAssigneeFilter("ALL"); setPage(1); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-site-accent/40 bg-site-accent/10 px-2.5 py-1 text-[11px] font-bold text-site-accent">
                {assigneeFilter === "UNASSIGNED"
                  ? t("tickets.unassigned")
                  : `แอดมิน: ${adminNameById.get(assigneeFilter) ?? assigneeFilter}`} <X size={11} />
              </button>
            )}
            {slaPreset !== "ALL" && (
              <button
                onClick={() => { setSlaPreset("ALL"); setPage(1); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--status-danger-rgb)/0.4)] bg-[rgb(var(--status-danger-rgb)/0.1)] px-2.5 py-1 text-[11px] font-bold text-[rgb(var(--status-danger-rgb))]">
                {slaPreset === "SLA_8" ? "SLA > 8ชม." : "SLA > 24ชม."} <X size={11} />
              </button>
            )}
            {(createdFrom || createdTo) && (
              <button
                onClick={() => { setCreatedFrom(""); setCreatedTo(""); setPage(1); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-site-accent/40 bg-site-accent/10 px-2.5 py-1 text-[11px] font-bold text-site-accent">
                วันที่: {createdFrom || "…"} → {createdTo || "…"} <X size={11} />
              </button>
            )}
            <button
              onClick={resetFilters}
              className="ml-1 text-[11px] font-bold text-site-dim underline-offset-2 hover:text-site-muted hover:underline">
              ล้างทั้งหมด
            </button>
          </>
        )}
      </div>

      {/* ===== Bulk action bar (appears when selecting) ===== */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-site-accent/30 bg-site-accent/10 px-3.5 py-2 text-[12.5px]">
          <span>
            เลือกไว้{" "}
            <span className="font-mono text-sm font-bold text-site-accent">
              {selectedIds.length}
            </span>{" "}
            รายการ
          </span>
          <button
            onClick={() => runBulkUpdate({ status: "IN_PROGRESS" })}
            disabled={bulkUpdating}
            className="rounded-lg border border-site-border bg-site-surface px-2.5 py-1 text-xs font-bold transition-colors hover:border-site-accent/40 hover:text-site-accent disabled:opacity-50">
            → กำลังดำเนินการ
          </button>
          <button
            onClick={() => runBulkUpdate({ status: "RESOLVED" })}
            disabled={bulkUpdating}
            className="rounded-lg border border-site-border bg-site-surface px-2.5 py-1 text-xs font-bold transition-colors hover:border-site-accent/40 hover:text-site-accent disabled:opacity-50">
            ✓ แก้ไขแล้ว
          </button>
          <button
            onClick={() => runBulkUpdate({ priority: "URGENT" })}
            disabled={bulkUpdating}
            className="rounded-lg border border-site-border bg-site-surface px-2.5 py-1 text-xs font-bold text-[rgb(var(--status-danger-rgb))] transition-colors hover:border-[rgb(var(--status-danger-rgb)/0.4)] disabled:opacity-50">
            ⚡ เร่งด่วน
          </button>
          <div className="flex items-center gap-1.5">
            <Select value={bulkAssigneeId} onValueChange={setBulkAssigneeId}>
              <SelectTrigger className="h-7 w-[130px] rounded-lg border-site-border bg-site-surface text-xs">
                <SelectValue placeholder="เลือกแอดมิน" />
              </SelectTrigger>
              <SelectContent>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => runBulkUpdate({ assignedTo: bulkAssigneeId })}
              disabled={selectedIds.length === 0 || bulkUpdating || !bulkAssigneeId}
              className="rounded-lg border border-site-border bg-site-surface px-2.5 py-1 text-xs font-bold transition-colors hover:border-site-accent/40 hover:text-site-accent disabled:opacity-50">
              มอบหมาย
            </button>
          </div>
          <button
            onClick={() => runBulkUpdate({ assignedTo: null })}
            disabled={bulkUpdating}
            className="rounded-lg border border-site-border bg-site-surface px-2.5 py-1 text-xs font-bold text-[rgb(var(--status-danger-rgb))] transition-colors hover:border-[rgb(var(--status-danger-rgb)/0.4)] disabled:opacity-50">
            ยกเลิกมอบหมาย
          </button>
          <span className="flex-1" />
          <button
            onClick={() => setSelectedIds([])}
            className="inline-flex items-center gap-1 text-xs text-site-dim hover:text-site-muted">
            <X size={12} /> ยกเลิกการเลือก
          </button>
        </div>
      )}

      {/* ===== Main split: queue table + detail drawer ===== */}
      <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[1fr_460px]">
        {/* Queue table */}
        <div className="overflow-hidden rounded-2xl border border-site-border-soft bg-site-surface">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-10 bg-site-raised px-3 py-2.5 text-left">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleSelectAllVisible}
                      disabled={tickets.length === 0}
                    />
                  </th>
                  <th className="whitespace-nowrap bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    เลขที่
                  </th>
                  <th className="bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    หัวข้อ / ผู้ใช้
                  </th>
                  <th className="whitespace-nowrap bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    สถานะ
                  </th>
                  <th className="whitespace-nowrap bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    ความสำคัญ
                  </th>
                  <th className="whitespace-nowrap bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    SLA
                  </th>
                  <th className="whitespace-nowrap bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    ผู้รับผิดชอบ
                  </th>
                  <th className="whitespace-nowrap bg-site-raised px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-site-dim">
                    อัปเดต
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center">
                      <Loader2 className="mx-auto h-7 w-7 animate-spin text-site-accent" />
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-site-dim">
                      ไม่พบทิกเก็ต
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => {
                    const isSelected = selectedTicket?.id === ticket.id;
                    const slaLevel = getSlaLevel(ticket);
                    const assigneeName = ticket.assignedTo
                      ? (adminNameById.get(ticket.assignedTo) ?? ticket.assignedTo)
                      : null;
                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => loadDetail(ticket.id)}
                        className={`cursor-pointer border-b border-site-border-soft transition-colors ${
                          isSelected
                            ? "bg-site-accent/10 shadow-[inset_3px_0_0_rgb(var(--site-accent-rgb))]"
                            : "hover:bg-site-accent/[0.04]"
                        }`}>
                        <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(ticket.id)}
                            onCheckedChange={() => toggleSelectOne(ticket.id)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[11px] text-site-dim">
                          {ticket.ticketNumber}
                        </td>
                        <td className="max-w-[260px] px-3.5 py-2.5">
                          <div className="truncate text-[13px] font-bold text-site-text">
                            {ticket.subject}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-site-border bg-site-raised text-[9px] font-bold text-site-muted">
                              {(ticket.user?.username || ticket.user?.email || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                            <span className="text-[11px] text-site-muted">
                              {ticket.user?.username || ticket.user?.email}
                            </span>
                            {ticket.orderId && (
                              <Link
                                href={`/admin/orders/${ticket.orderId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-site-accent hover:underline">
                                ออเดอร์ ↗
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <StatusPill status={ticket.status} />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <PriorityPill priority={ticket.priority} />
                        </td>
                        <td className="px-3.5 py-2.5">
                          <SlaBar ticket={ticket} />
                        </td>
                        <td className="px-3.5 py-2.5">
                          {assigneeName ? (
                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-site-border bg-site-raised px-2 py-0.5 text-[11px] text-site-muted">
                              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-site-border bg-site-raised text-[8px] font-bold">
                                {assigneeName.charAt(0).toUpperCase()}
                              </span>
                              {assigneeName}
                            </span>
                          ) : (
                            <span className="inline-flex whitespace-nowrap rounded-lg border border-dashed border-[rgb(var(--status-warning-rgb)/0.5)] px-2 py-0.5 text-[11px] text-[rgb(var(--status-warning-rgb))]">
                              + มอบหมาย
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[11px] text-site-dim">
                          {timeAgo(ticket.updatedAt)}
                          {slaLevel === "24h" && (
                            <span className="ml-1 text-[rgb(var(--status-danger-rgb))]">⚠</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer: pager */}
          <div className="flex items-center justify-between px-4 py-3 text-xs text-site-dim">
            <span>
              แสดง{" "}
              <b className="font-mono text-site-muted">
                {(page - 1) * limit + 1}–{(page - 1) * limit + tickets.length}
              </b>{" "}
              จาก{" "}
              <b className="font-mono text-site-muted">{stats.total}</b>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-site-border bg-site-raised px-2 text-site-muted transition-colors hover:text-site-text disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <span className="px-1 font-mono font-bold text-site-muted">
                {page}/{Math.max(totalPages, 1)}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-site-border bg-site-raised px-2 text-site-muted transition-colors hover:text-site-text disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Detail drawer */}
        <div className="sticky top-4 flex max-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-2xl border border-site-border-soft bg-site-surface xl:max-h-[calc(100vh-180px)]">
          {!selectedTicket ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 p-10 text-center text-site-dim">
              <ChevronRight className="h-6 w-6 text-site-border" />
              เลือกทิกเก็ตจากตารางเพื่อตอบกลับด้านนี้
              <span className="text-[11px]">
                (คีย์ลัด <kbd className="rounded border border-site-border bg-site-raised px-1 font-mono text-[10px]">J</kbd>
                /<kbd className="rounded border border-site-border bg-site-raised px-1 font-mono text-[10px]">K</kbd> เลื่อนรายการ)
              </span>
            </div>
          ) : detailLoading ? (
            <div className="flex h-full min-h-[320px] items-center justify-center p-10">
              <Loader2 className="h-7 w-7 animate-spin text-site-accent" />
            </div>
          ) : (
            <>
              {/* Drawer head */}
              <div className="border-b border-site-border-soft px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-site-dim">
                    {selectedTicket.ticketNumber} · เปิด{" "}
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {selectedTicket.orderId && (
                      <Link
                        href={`/admin/orders/${selectedTicket.orderId}`}
                        title="เปิดคำสั่งซื้อ"
                        className="flex h-[26px] items-center gap-1 rounded-lg border border-site-border bg-site-raised px-2 text-[11px] font-bold text-site-muted transition-colors hover:border-site-accent/40 hover:text-site-accent">
                        ออเดอร์ ↗
                      </Link>
                    )}
                    {!(["CLOSED", "RESOLVED"] as TicketStatus[]).includes(
                      selectedTicket.status,
                    ) && (
                      <button
                        onClick={() =>
                          updateSelectedTicket({ status: "RESOLVED" })
                        }
                        disabled={updating}
                        title="ปิดทิกเก็ต (แก้ไขแล้ว)"
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-site-border bg-site-raised text-site-muted transition-colors hover:border-[rgb(var(--status-success-rgb)/0.4)] hover:text-[rgb(var(--status-success-rgb))] disabled:opacity-50">
                        <CheckCheck size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <h2 className="mt-1.5 text-base font-bold leading-snug text-site-text">
                  {selectedTicket.subject}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusPill status={selectedTicket.status} />
                  <PriorityPill priority={selectedTicket.priority} />
                  <span className="rounded-lg border border-site-border px-2 py-0.5 text-[10.5px] font-bold text-site-muted">
                    {t(
                      `tickets.categories.${categoryKeyMap[selectedTicket.category as TicketCategory]}`,
                    )}
                  </span>
                  <span className="text-[11px] text-site-dim">
                    · {selectedTicket.user?.username || selectedTicket.user?.email}
                  </span>
                </div>
              </div>

              {/* Quick controls: status / priority / assignee */}
              <div className="grid grid-cols-2 gap-2 border-b border-site-border-soft px-4 py-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9.5px] font-bold uppercase tracking-wider text-site-dim">
                    สถานะ
                  </label>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(v) =>
                      updateSelectedTicket({ status: v as TicketStatus })
                    }
                    disabled={updating}>
                    <SelectTrigger className="h-8 rounded-lg border-site-border bg-site-raised text-xs font-bold">
                      <SelectValue />
                      <ChevronDown size={12} className="text-site-dim" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusKeyMap).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {t(`tickets.status.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9.5px] font-bold uppercase tracking-wider text-site-dim">
                    ความสำคัญ
                  </label>
                  <Select
                    value={selectedTicket.priority}
                    onValueChange={(v) =>
                      updateSelectedTicket({ priority: v as TicketPriority })
                    }
                    disabled={updating}>
                    <SelectTrigger className="h-8 rounded-lg border-site-border bg-site-raised text-xs font-bold">
                      <SelectValue />
                      <ChevronDown size={12} className="text-site-dim" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">ต่ำ</SelectItem>
                      <SelectItem value="MEDIUM">ปานกลาง</SelectItem>
                      <SelectItem value="HIGH">สูง</SelectItem>
                      <SelectItem value="URGENT">เร่งด่วน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="text-[9.5px] font-bold uppercase tracking-wider text-site-dim">
                    ผู้รับผิดชอบ
                  </label>
                  <Select
                    value={selectedTicket.assignedTo || "UNASSIGNED"}
                    onValueChange={(v) =>
                      updateSelectedTicket({
                        assignedTo: v === "UNASSIGNED" ? null : v,
                      })
                    }
                    disabled={updating}>
                    <SelectTrigger className="h-8 rounded-lg border-site-border bg-site-raised text-xs font-bold">
                      <SelectValue placeholder="ยังไม่มอบหมาย" />
                      <ChevronDown size={12} className="text-site-dim" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNASSIGNED">ยังไม่มอบหมาย</SelectItem>
                      {admins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conversation */}
              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3.5">
                <div className="flex justify-center">
                  <span className="rounded-full border border-site-border-soft bg-site-raised px-3 py-0.5 font-mono text-[10px] text-site-dim">
                    คำอธิบายปัญหา
                  </span>
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-bl border border-site-border-soft bg-site-raised px-3 py-2.5 text-[12.5px] leading-relaxed text-site-text">
                  {selectedTicket.description}
                </div>

                {selectedTicket.messages.map((message) => {
                  if (message.sender === "system") {
                    return (
                      <div
                        key={message.id}
                        className="flex justify-center">
                        <span className="rounded-full border border-dashed border-site-border px-3 py-1 text-[11px] text-site-dim">
                          {message.content}
                        </span>
                      </div>
                    );
                  }
                  const isAdminMsg = message.sender === "admin";
                  return (
                    <div
                      key={message.id}
                      className={`max-w-[88%] rounded-2xl border px-3 py-2.5 text-[12.5px] leading-relaxed ${
                        isAdminMsg
                          ? "ml-auto rounded-br border-site-accent/25 bg-site-accent/10 text-site-text"
                          : "rounded-bl border-site-border-soft bg-site-raised text-site-text"
                      }`}>
                      <div
                        className={`mb-1 flex items-center gap-1.5 text-[10px] font-bold ${
                          isAdminMsg ? "text-site-accent" : "text-site-muted"
                        }`}>
                        {message.senderName || message.sender}
                        <time className="font-mono text-[9.5px] font-normal text-site-dim">
                          {new Date(message.createdAt).toLocaleString()}
                        </time>
                      </div>
                      {message.content}
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              {!(["CLOSED", "RESOLVED"] as TicketStatus[]).includes(
                selectedTicket.status,
              ) ? (
                <form
                  onSubmit={sendReply}
                  className="border-t border-site-border-soft px-4 py-3">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {[
                      { label: "📋 ได้รับเรียบร้อย", text: "รับทราบครับ กำลังตรวจสอบให้ทันทีครับ 🙏" },
                      { label: "⏳ กำลังตรวจสอบ", text: "กำลังตรวจสอบปัญหาให้อยู่ครับ ขอเวลาไม่นานครับ" },
                      { label: "✅ เติมสำเร็จแล้ว", text: "เติมเงินเข้าเรียบร้อยแล้วครับ รบกวนตรวจสอบที่บัญชีด้วยนะครับ ✅" },
                      { label: "🙏 ขออภัยในความล่าช้า", text: "ต้องขออภัยในความล่าช้าครับ ทีมงานกำลังเร่งดำเนินการให้ทันทีครับ 🙏" },
                    ].map((quick) => (
                      <button
                        key={quick.label}
                        type="button"
                        onClick={() => {
                          setReply(quick.text);
                          replyInputRef.current?.focus();
                        }}
                        className="rounded-lg border border-site-border bg-site-raised px-2.5 py-1 text-[10.5px] font-bold text-site-muted transition-colors hover:border-site-accent/40 hover:text-site-accent">
                        {quick.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={replyInputRef}
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder="พิมพ์ข้อความตอบกลับ…"
                      rows={2}
                      className="h-[58px] flex-1 resize-none rounded-xl border border-site-border bg-site-raised px-3 py-2 text-[13px] text-site-text outline-none transition-colors placeholder:text-site-dim focus:border-site-accent/40"
                    />
                    <button
                      type="submit"
                      disabled={sending || !reply.trim()}
                      title="ส่งข้อความ (Ctrl+Enter)"
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-site-accent text-site-bg transition hover:brightness-110 disabled:opacity-50">
                      {sending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                  <div className="mt-2 text-[10px] text-site-dim">
                    <kbd className="rounded border border-site-border bg-site-raised px-1 font-mono text-[9px]">J</kbd>
                    /
                    <kbd className="rounded border border-site-border bg-site-raised px-1 font-mono text-[9px]">K</kbd>{" "}
                    เลื่อนทิกเก็ต ·{" "}
                    <kbd className="rounded border border-site-border bg-site-raised px-1 font-mono text-[9px]">R</kbd>{" "}
                    ตอบกลับ ·{" "}
                    <kbd className="rounded border border-site-border bg-site-raised px-1 font-mono text-[9px]">Ctrl+↵</kbd>{" "}
                    ส่ง ·{" "}
                    <kbd className="rounded border border-site-border bg-site-raised px-1 font-mono text-[9px]">/</kbd>{" "}
                    ค้นหา
                  </div>
                </form>
              ) : (
                <div className="border-t border-site-border-soft px-4 py-3 text-center text-xs text-site-dim">
                  ทิกเก็ตนี้ปิดแล้ว — เปลี่ยนสถานะกลับเพื่อตอบกลับต่อได้
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== Bottom toolbar: export + monitor + refresh info ===== */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-site-border-soft bg-site-surface px-3.5 py-2.5">
        <button
          onClick={exportCsv}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-site-border bg-site-raised px-3 py-1.5 text-xs font-bold text-site-muted transition-colors hover:text-site-text disabled:opacity-50">
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          ส่งออก CSV (ตามตัวกรอง)
        </button>
        {!isMonitorMode && (
          <Button
            variant="secondary"
            size="sm"
            onClick={openMonitorWindow}
            title="เปิดหน้าต่างมอนิเตอร์แบบป๊อปอัป">
            <Monitor size={13} className="mr-1" />
            เปิดหน้าต่างมอนิเตอร์
          </Button>
        )}
        <span className="flex-1" />
        <span className="font-mono text-[11px] text-site-dim">
          อัปเดตล่าสุด:{" "}
          {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString() : "-"}
          {autoRefresh && " · รีเฟรชอัตโนมัติทุก 30 วินาที"}
        </span>
      </div>
    </div>
  );

  return isMonitorMode ? (
    <div className="min-h-screen bg-site-surface">{content}</div>
  ) : (
    <AdminLayout><PageContainer>{content}</PageContainer></AdminLayout>
  );
}

// Wrapper with Suspense boundary
export default function AdminTicketsPage() {
  return (
    <Suspense fallback={<AdminTicketsLoadingFallback />}>
      <AdminTicketsPageContent />
    </Suspense>
  );
}

function AdminTicketsLoadingFallback() {
  return (
    <AdminLayout>
      <PageContainer>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-site-accent" />
        </div>
      </PageContainer>
    </AdminLayout>
  );
}
