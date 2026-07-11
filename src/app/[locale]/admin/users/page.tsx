"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users as UsersIcon, RefreshCw, Trash2 } from "lucide-react";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
  FilterBar,
  DataTable,
  StatCard,
  ConfirmDialog,
  type Column,
} from "@/components/admin";
import {
  adminUserApi,
  AdminUser,
  UserStats,
} from "@/lib/services/admin-user-api";
import { useAuth } from "@/lib/hooks/use-auth";

const PAGE_LIMIT = 10;

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(n);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const DEFAULT_META = { total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 };

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, isInitialized, isSessionChecked } = useAuth();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);

  // Debounced search (350ms) — resets to first page when query changes.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [search]);

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      setError(null);
      const [listRes, statsRes] = await Promise.all([
        adminUserApi.getUsers({
          page,
          limit: PAGE_LIMIT,
          search: debouncedSearch || undefined,
          role: roleFilter !== "all" ? roleFilter.toUpperCase() : undefined,
          isActive:
            statusFilter === "all" ? undefined : statusFilter === "active",
        }),
        adminUserApi.getUserStats(),
      ]);
      setUsers(listRes.data.users);
      setMeta(listRes.data.meta ?? DEFAULT_META);
      setStats(statsRes.data ?? null);
      // Prune selection to rows still present on the current page.
      setSelectedIds((prev) =>
        prev.filter((id) => listRes.data.users.some((u) => u.id === id)),
      );
    } catch (err) {
      setError(adminUserApi.getErrorMessage(err));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    if (isInitialized && isSessionChecked && isAdmin) fetchData();
  }, [fetchData, isInitialized, isSessionChecked, isAdmin]);

  const runMutation = async (fn: () => Promise<void>) => {
    try {
      setMutating(true);
      await fn();
      await fetchData();
    } catch (err) {
      setError(adminUserApi.getErrorMessage(err));
    } finally {
      setMutating(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmDelete(selectedIds);
  };

  const confirmBulkDelete = async () => {
    if (!confirmDelete) return;
    const ids = confirmDelete;
    await runMutation(async () => {
      await Promise.all(ids.map((id) => adminUserApi.deleteUser(id)));
      setSelectedIds([]);
      setConfirmDelete(null);
    });
  };

  // Toggle active/banned — there is no toggleUserStatus; updateUser handles it.
  const toggleStatus = async (id: string, currentActive: boolean) => {
    await runMutation(async () => {
      await adminUserApi.updateUser(id, { isActive: !currentActive });
    });
  };

  const columns: Column<AdminUser>[] = [
    {
      key: "user",
      header: "ผู้ใช้",
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-site-raised border border-site-border flex items-center justify-center text-[10px] font-bold text-site-muted uppercase shrink-0">
            {(u.username ?? u.email ?? "?").charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-site-text truncate">
              {u.username}
            </div>
            <div className="text-[10px] text-site-dim truncate">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "บทบาท",
      render: (u) => (
        <span
          className={
            u.role === "ADMIN"
              ? "text-[11px] font-bold text-site-accent"
              : "text-[11px] text-site-muted"
          }
        >
          {u.role === "ADMIN" ? "ผู้ดูแล" : "ผู้ใช้ทั่วไป"}
        </span>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (u) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(u.id, u.isActive);
          }}
          disabled={mutating}
          className="text-[11px] disabled:opacity-40"
        >
          {u.isActive ? "🟢 ใช้งาน" : "🔴 ระงับ"}
        </button>
      ),
    },
    {
      key: "totalSpent",
      header: "ใช้จ่าย",
      align: "right",
      sortable: true,
      sortAccessor: (u) => u.totalSpent ?? 0,
      render: (u) => (
        <span className="font-medium">{formatCurrency(u.totalSpent ?? 0)}</span>
      ),
    },
    {
      key: "createdAt",
      header: "สมัครเมื่อ",
      sortable: true,
      sortAccessor: (u) => new Date(u.createdAt).getTime(),
      render: (u) => (
        <span className="text-site-dim text-[11px]">
          {formatDate(u.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (u) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/users/${u.id}`);
          }}
          className="text-[11px] text-site-accent hover:underline"
        >
          ดู
        </button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageContainer>
        <AdminPageHeader
          title="จัดการผู้ใช้"
          description={`${meta.total} รายการ`}
          actions={
            <button
              onClick={fetchData}
              disabled={loading || mutating}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-site-border text-site-muted hover:bg-site-raised disabled:opacity-40 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> รีเฟรช
            </button>
          }
        />

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard
              title="ทั้งหมด"
              value={stats.totalUsers.toLocaleString()}
              semantic="blue"
            />
            <StatCard
              title="แอดมิน"
              value={stats.totalAdmins.toLocaleString()}
              semantic="violet"
            />
            <StatCard
              title="ใช้งานอยู่"
              value={stats.activeUsers.toLocaleString()}
              semantic="green"
            />
            <StatCard
              title="ระงับ"
              value={stats.inactiveUsers.toLocaleString()}
              semantic="rose"
            />
            <StatCard
              title="ใหม่เดือนนี้"
              value={stats.newThisMonth.toLocaleString()}
              semantic="amber"
            />
          </div>
        )}

        {error && (
          <div className="bg-semantic-rose/10 border border-semantic-rose/30 rounded-lg text-semantic-rose px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-site-surface border border-site-border-soft rounded-12">
            <span className="text-sm text-site-muted">
              เลือก {selectedIds.length} รายการ
            </span>
            <div className="flex-1" />
            <button
              onClick={handleBulkDelete}
              disabled={mutating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-semantic-rose/10 text-semantic-rose border border-semantic-rose/20 hover:bg-semantic-rose/20 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> ลบที่เลือก
            </button>
          </div>
        )}

        <FilterBar
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "ค้นหาชื่อผู้ใช้ หรืออีเมล...",
          }}
          filters={[
            {
              key: "role",
              value: roleFilter,
              onChange: (v) => {
                setRoleFilter(v);
                setPage(1);
              },
              options: [
                { value: "all", label: "ทุกบทบาท" },
                { value: "user", label: "ผู้ใช้ทั่วไป" },
                { value: "admin", label: "ผู้ดูแลระบบ" },
              ],
            },
            {
              key: "status",
              value: statusFilter,
              onChange: (v) => {
                setStatusFilter(v);
                setPage(1);
              },
              options: [
                { value: "all", label: "ทุกสถานะ" },
                { value: "active", label: "ใช้งานปกติ" },
                { value: "inactive", label: "ระงับการใช้งาน" },
              ],
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={users}
          rowKey={(u) => u.id}
          loading={loading}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
          pagination={{
            page: meta.page,
            totalPages: meta.totalPages,
            total: meta.total,
            pageSize: PAGE_LIMIT,
          }}
          onPageChange={setPage}
          empty={{ icon: UsersIcon, title: "ไม่พบผู้ใช้" }}
        />

        <ConfirmDialog
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={confirmBulkDelete}
          title="ยืนยันการลบผู้ใช้"
          description={`คุณกำลังจะลบผู้ใช้ ${confirmDelete?.length ?? 0} รายการ การกระทำนี้ไม่สามารถย้อนกลับได้`}
          confirmLabel="ลบถาวร"
          destructive
          loading={mutating}
        />
      </PageContainer>
    </AdminLayout>
  );
}
