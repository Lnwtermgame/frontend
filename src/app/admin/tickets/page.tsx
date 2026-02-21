"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCheck,
  Download,
  Loader2,
  RefreshCcw,
  Send,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
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

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "เปิด",
  IN_PROGRESS: "กำลังดำเนินการ",
  WAITING_USER: "รอผู้ใช้",
  WAITING_ADMIN: "รอแอดมิน",
  RESOLVED: "แก้ไขแล้ว",
  CLOSED: "ปิด",
};

const categoryLabels: Record<TicketCategory, string> = {
  ORDER_ISSUE: "ปัญหาคำสั่งซื้อ",
  PAYMENT_ISSUE: "ปัญหาการชำระเงิน",
  PRODUCT_ISSUE: "ปัญหาสินค้า",
  ACCOUNT_ISSUE: "ปัญหาบัญชี",
  TECHNICAL_SUPPORT: "สนับสนุนทางเทคนิค",
  REFUND_REQUEST: "ขอคืนเงิน",
  GENERAL_INQUIRY: "สอบถามทั่วไป",
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

function toCsvCell(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replace(/\"/g, '""')}"`;
  }
  return text;
}

export default function AdminTicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, isInitialized } = useAuth();
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
  const replyInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isInitialized, isAdmin, router]);

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
    for (const ticket of tickets) {
      const level = getSlaLevel(ticket);
      if (level === "24h") {
        over24 += 1;
        over8 += 1;
      } else if (level === "8h") {
        over8 += 1;
      }
    }
    return { over8, over24 };
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

  if (!isInitialized || !isAdmin) {
    return isMonitorMode ? (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex h-64 items-center justify-center rounded border-[3px] border-black bg-white">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    ) : (
      <AdminLayout title="ตั๋วซัพพอร์ต">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const content = (
    <div className={isMonitorMode ? "space-y-4 p-4" : "space-y-4"}>
      {isMonitorMode && (
        <div className="flex items-center justify-between rounded border-[2px] border-black bg-white px-3 py-2 text-sm">
          <span className="font-medium text-black">
            หน้าต่างมอนิเตอร์ทิกเก็ต
          </span>
          <Link href="/admin/tickets" className="text-blue-600 hover:underline">
            เปิดหน้าแอดมินแบบเต็ม
          </Link>
        </div>
      )}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">จัดการทิกเก็ต</h1>
          <div className="flex items-center gap-2">
            {!isMonitorMode && (
              <button
                onClick={openMonitorWindow}
                className="border-[2px] border-black bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-100"
                title="เปิดหน้าต่างมอนิเตอร์แบบป๊อปอัป"
              >
                เปิดหน้าต่างมอนิเตอร์
              </button>
            )}
            <div className="text-right text-xs text-gray-500">
              <div>
                อัปเดตล่าสุด:{" "}
                {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString() : "-"}
              </div>
              <div>
                ความเสี่ยง SLA (หน้านี้): &gt;8ชม. {breachedCount.over8} |
                &gt;24ชม. {breachedCount.over24}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center border-[3px] border-red-500 bg-red-100 p-3 text-red-700">
            <AlertCircle className="mr-2" size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
          {[
            { label: "ทั้งหมด", value: stats.total, key: "ALL" },
            { label: "เปิด", value: stats.open, key: "OPEN" },
            {
              label: "กำลังดำเนินการ",
              value: stats.inProgress,
              key: "IN_PROGRESS",
            },
            {
              label: "รอผู้ใช้",
              value: stats.waitingUser,
              key: "WAITING_USER",
            },
            {
              label: "รอแอดมิน",
              value: stats.waitingAdmin,
              key: "WAITING_ADMIN",
            },
            { label: "แก้ไขแล้ว", value: stats.resolved, key: "RESOLVED" },
            { label: "ปิด", value: stats.closed, key: "CLOSED" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setStatus(item.key);
                setPage(1);
              }}
              className={`border-[2px] p-2 text-sm ${
                status === item.key
                  ? "border-black bg-yellow-100"
                  : "border-gray-300 bg-white"
              }`}
            >
              <div className="font-bold">{item.value}</div>
              <div className="text-xs">{item.label}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 border-[3px] border-black bg-white p-3 md:grid-cols-2 lg:grid-cols-6">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="ค้นหาจากเลขทิกเก็ต หัวข้อ หรือผู้ใช้"
            className="border-[2px] border-gray-300 px-2 py-1.5"
          />

          <select
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value);
              setPage(1);
            }}
            className="border-[2px] border-gray-300 px-2 py-1.5"
          >
            <option value="ALL">ทุกระดับความสำคัญ</option>
            <option value="LOW">ต่ำ</option>
            <option value="MEDIUM">ปานกลาง</option>
            <option value="HIGH">สูง</option>
            <option value="URGENT">เร่งด่วน</option>
          </select>

          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="border-[2px] border-gray-300 px-2 py-1.5"
          >
            <option value="ALL">ทุกหมวดหมู่</option>
            {Object.entries(categoryLabels).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={(event) => {
              setAssigneeFilter(event.target.value);
              setPage(1);
            }}
            className="border-[2px] border-gray-300 px-2 py-1.5"
          >
            <option value="ALL">ผู้รับผิดชอบทั้งหมด</option>
            <option value="UNASSIGNED">ยังไม่มอบหมาย</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.username}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value as
                  | "updatedAt"
                  | "createdAt"
                  | "priority"
                  | "status",
              )
            }
            className="border-[2px] border-gray-300 px-2 py-1.5"
          >
            <option value="updatedAt">เรียงตามเวลาอัปเดต</option>
            <option value="createdAt">เรียงตามเวลาสร้าง</option>
            <option value="priority">เรียงตามความสำคัญ</option>
            <option value="status">เรียงตามสถานะ</option>
          </select>

          <div className="flex gap-2">
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as "asc" | "desc")
              }
              className="flex-1 border-[2px] border-gray-300 px-2 py-1.5"
            >
              <option value="desc">ใหม่ไปเก่า</option>
              <option value="asc">เก่าไปใหม่</option>
            </select>
            <button
              onClick={loadTickets}
              className="border-[2px] border-black px-3"
              title="รีเฟรชทันที"
            >
              <RefreshCcw size={14} />
            </button>
          </div>

          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="border-[2px] border-gray-300 px-2 py-1.5"
          >
            <option value={20}>20 / หน้า</option>
            <option value={50}>50 / หน้า</option>
            <option value={100}>100 / หน้า</option>
          </select>

          <input
            type="date"
            value={createdFrom}
            onChange={(event) => {
              setCreatedFrom(event.target.value);
              setPage(1);
            }}
            className="border-[2px] border-gray-300 px-2 py-1.5"
          />

          <input
            type="date"
            value={createdTo}
            onChange={(event) => {
              setCreatedTo(event.target.value);
              setPage(1);
            }}
            className="border-[2px] border-gray-300 px-2 py-1.5"
          />

          <div className="flex gap-2 lg:col-span-2">
            <button
              onClick={() => setQueuePreset("ALL")}
              className={`border-[2px] px-3 py-1.5 text-sm ${status === "ALL" ? "border-black bg-yellow-100" : "border-gray-300"}`}
            >
              คิวทั้งหมด
            </button>
            <button
              onClick={() => setQueuePreset("WAITING_ADMIN")}
              className={`border-[2px] px-3 py-1.5 text-sm ${status === "WAITING_ADMIN" ? "border-black bg-yellow-100" : "border-gray-300"}`}
            >
              ต้องตอบกลับ
            </button>
            <button
              onClick={() => setQueuePreset("UNASSIGNED")}
              className={`border-[2px] px-3 py-1.5 text-sm ${assigneeFilter === "UNASSIGNED" ? "border-black bg-yellow-100" : "border-gray-300"}`}
            >
              คิวยังไม่มอบหมาย
            </button>
          </div>

          <div className="flex gap-2 lg:col-span-2">
            <button
              onClick={() => {
                setSlaPreset("ALL");
                setPage(1);
              }}
              className={`border-[2px] px-3 py-1.5 text-sm ${slaPreset === "ALL" ? "border-black bg-yellow-100" : "border-gray-300"}`}
            >
              SLA ทั้งหมด
            </button>
            <button
              onClick={() => {
                setSlaPreset("SLA_8");
                setPage(1);
              }}
              className={`border-[2px] px-3 py-1.5 text-sm ${slaPreset === "SLA_8" ? "border-black bg-yellow-100" : "border-gray-300"}`}
            >
              SLA &gt; 8h
            </button>
            <button
              onClick={() => {
                setSlaPreset("SLA_24");
                setPage(1);
              }}
              className={`border-[2px] px-3 py-1.5 text-sm ${slaPreset === "SLA_24" ? "border-black bg-yellow-100" : "border-gray-300"}`}
            >
              SLA &gt; 24h
            </button>
          </div>

          <div className="flex gap-2 lg:col-span-2">
            <button
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`border-[2px] px-3 py-1.5 text-sm ${autoRefresh ? "border-black bg-green-100" : "border-gray-300"}`}
            >
              รีเฟรชอัตโนมัติ 30 วินาที: {autoRefresh ? "เปิด" : "ปิด"}
            </button>
            <button
              onClick={resetFilters}
              className="border-[2px] border-gray-400 px-3 py-1.5 text-sm"
            >
              รีเซ็ตตัวกรอง
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-[3px] border-black bg-white p-3">
          <button
            onClick={toggleSelectAllVisible}
            className="border-[2px] border-gray-400 px-3 py-1.5 text-sm"
            disabled={tickets.length === 0}
          >
            {allVisibleSelected ? "ยกเลิกเลือกทั้งหน้า" : "เลือกทั้งหน้า"}
          </button>

          <span className="text-sm font-medium text-gray-700">
            เลือกรายการ: {selectedIds.length}
          </span>

          <button
            onClick={() => runBulkUpdate({ status: "IN_PROGRESS" })}
            disabled={selectedIds.length === 0 || bulkUpdating}
            className="border-[2px] border-gray-400 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {bulkUpdating ? "กำลังดำเนินการ..." : "เปลี่ยนเป็นกำลังดำเนินการ"}
          </button>

          <button
            onClick={() => runBulkUpdate({ status: "RESOLVED" })}
            disabled={selectedIds.length === 0 || bulkUpdating}
            className="border-[2px] border-gray-400 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            เปลี่ยนเป็นแก้ไขแล้ว
          </button>

          <button
            onClick={() => runBulkUpdate({ priority: "URGENT" })}
            disabled={selectedIds.length === 0 || bulkUpdating}
            className="border-[2px] border-gray-400 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            เปลี่ยนเป็นเร่งด่วน
          </button>

          <button
            onClick={() => runBulkUpdate({ assignedTo: null })}
            disabled={selectedIds.length === 0 || bulkUpdating}
            className="border-[2px] border-gray-400 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            ยกเลิกมอบหมาย
          </button>

          <select
            value={bulkAssigneeId}
            onChange={(event) => setBulkAssigneeId(event.target.value)}
            className="border-[2px] border-gray-400 px-2 py-1.5 text-sm"
          >
            <option value="">เลือกแอดมิน</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.username}
              </option>
            ))}
          </select>

          <button
            onClick={() => runBulkUpdate({ assignedTo: bulkAssigneeId })}
            disabled={
              selectedIds.length === 0 || bulkUpdating || !bulkAssigneeId
            }
            className="border-[2px] border-gray-400 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            มอบหมายแบบกลุ่ม
          </button>

          <button
            onClick={exportCsv}
            disabled={exporting}
            className="ml-auto flex items-center gap-2 border-[2px] border-black px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            ส่งออก CSV
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="border-[3px] border-black bg-white xl:col-span-1">
            <div className="max-h-[640px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`border-b p-3 ${selectedTicket?.id === ticket.id ? "border-l-4 border-l-black bg-gray-100" : "hover:bg-gray-50"}`}
                  >
                    <div className="mb-2 flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(ticket.id)}
                        onChange={() => toggleSelectOne(ticket.id)}
                        className="mt-1"
                      />
                      <button
                        onClick={() => loadDetail(ticket.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="text-xs text-gray-500">
                          {ticket.ticketNumber}
                        </div>
                        <div className="line-clamp-2 text-sm font-medium text-black">
                          {ticket.subject}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {statusLabels[ticket.status]} | {ticket.priority} |{" "}
                          {new Date(ticket.updatedAt).toLocaleString()}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          {ticket.assignedTo && (
                            <span className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-gray-700">
                              @
                              {adminNameById.get(ticket.assignedTo) ??
                                ticket.assignedTo}
                            </span>
                          )}
                          {getSlaLevel(ticket) === "8h" && (
                            <span className="rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-amber-800">
                              SLA &gt; 8h
                            </span>
                          )}
                          {getSlaLevel(ticket) === "24h" && (
                            <span className="rounded border border-red-300 bg-red-100 px-1.5 py-0.5 text-red-800">
                              SLA &gt; 24h
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {ticket.user?.username || ticket.user?.email}
                        </div>
                      </button>
                    </div>
                  </div>
                ))
              )}
              {!loading && tickets.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  ไม่พบทิกเก็ต
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t-[2px] border-gray-200 p-3">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="border-[2px] border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              <span className="text-xs text-gray-600">
                หน้า {page}/{Math.max(totalPages, 1)}
              </span>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= totalPages}
                className="border-[2px] border-gray-300 px-2 py-1 text-sm disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>

          <div className="border-[3px] border-black bg-white xl:col-span-2">
            {!selectedTicket ? (
              <div className="h-full p-10 text-center text-gray-500">
                เลือกทิกเก็ตเพื่อดูรายละเอียด
              </div>
            ) : detailLoading ? (
              <div className="p-10 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4 p-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">
                    {selectedTicket.ticketNumber}
                  </div>
                  <h2 className="text-xl font-bold text-black">
                    {selectedTicket.subject}
                  </h2>
                  <div className="text-sm text-gray-600">
                    {selectedTicket.user?.username ||
                      selectedTicket.user?.email}{" "}
                    |{" "}
                    {categoryLabels[selectedTicket.category as TicketCategory]}
                  </div>
                  {selectedTicket.orderId && (
                    <div className="text-sm">
                      คำสั่งซื้อ:{" "}
                      <Link
                        className="font-medium text-blue-600 hover:underline"
                        href={`/admin/orders/${selectedTicket.orderId}`}
                      >
                        {selectedTicket.orderId}
                      </Link>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(event) =>
                      updateSelectedTicket({
                        status: event.target.value as TicketStatus,
                      })
                    }
                    disabled={updating}
                    className="border-[2px] border-gray-300 px-2 py-1.5"
                  >
                    {Object.entries(statusLabels).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedTicket.priority}
                    onChange={(event) =>
                      updateSelectedTicket({
                        priority: event.target.value as TicketPriority,
                      })
                    }
                    disabled={updating}
                    className="border-[2px] border-gray-300 px-2 py-1.5"
                  >
                    <option value="LOW">ต่ำ</option>
                    <option value="MEDIUM">ปานกลาง</option>
                    <option value="HIGH">สูง</option>
                    <option value="URGENT">เร่งด่วน</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <select
                    value={selectedTicket.assignedTo || ""}
                    onChange={(event) =>
                      updateSelectedTicket({
                        assignedTo: event.target.value || null,
                      })
                    }
                    disabled={updating}
                    className="border-[2px] border-gray-300 px-2 py-1.5"
                  >
                    <option value="">ยังไม่มอบหมาย</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.username}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center text-xs text-gray-600">
                    คีย์ลัด: `J/K` เลื่อนรายการ | `R` โฟกัสช่องตอบกลับ |
                    `Ctrl+Enter` ส่งข้อความ
                  </div>
                </div>

                <div className="border-[2px] border-gray-200 bg-gray-50 p-3 text-gray-700">
                  {selectedTicket.description}
                </div>

                <div className="max-h-[360px] space-y-2 overflow-y-auto">
                  {selectedTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`border-[2px] p-3 ${
                        message.sender === "admin"
                          ? "border-green-300 bg-green-50"
                          : message.sender === "system"
                            ? "border-gray-300 bg-gray-50"
                            : "border-gray-300 bg-white"
                      }`}
                    >
                      <div className="mb-1 text-xs text-gray-500">
                        {message.senderName || message.sender} |{" "}
                        {new Date(message.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-800">
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>

                {!(["CLOSED", "RESOLVED"] as TicketStatus[]).includes(
                  selectedTicket.status,
                ) && (
                  <form onSubmit={sendReply} className="flex gap-2">
                    <input
                      ref={replyInputRef}
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      className="flex-1 border-[2px] border-gray-300 px-3 py-2"
                      placeholder="พิมพ์ข้อความตอบกลับลูกค้า"
                    />
                    <button
                      disabled={sending || !reply.trim()}
                      className="border-[2px] border-black bg-black px-3 py-2 text-white disabled:opacity-50"
                    >
                      {sending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </form>
                )}

                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2 border-[2px] border-green-300 bg-green-50 p-2 text-sm text-green-900">
                    <CheckCheck size={16} />
                    เลือกไว้สำหรับการจัดการแบบกลุ่ม {selectedIds.length} รายการ
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return isMonitorMode ? (
    <div className="min-h-screen bg-gray-50">{content}</div>
  ) : (
    <AdminLayout title="ตั๋วซัพพอร์ต">{content}</AdminLayout>
  );
}
