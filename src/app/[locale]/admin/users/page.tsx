"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  adminUserApi,
  AdminUser,
  UserStats,
} from "@/lib/services/admin-user-api";
import {
  Search,
  Trash2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Eye,
} from "lucide-react";

interface UserMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DEFAULT_META: UserMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, isInitialized } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [meta, setMeta] = useState<UserMeta>(DEFAULT_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isInitialized, router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, statusFilter]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;

    const params: {
      page: number;
      limit: number;
      role?: string;
      isActive?: boolean;
      search?: string;
    } = {
      page: currentPage,
      limit: 10,
    };

    if (roleFilter !== "all") {
      params.role = roleFilter.toUpperCase();
    }

    if (statusFilter !== "all") {
      params.isActive = statusFilter === "active";
    }

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    const response = await adminUserApi.getUsers(params);
    setUsers(response.data.users);
    setMeta(response.data.meta);
    setSelectedUsers((prev) =>
      prev.filter((id) => response.data.users.some((u) => u.id === id)),
    );
  }, [currentPage, debouncedSearch, isAdmin, roleFilter, statusFilter]);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    const response = await adminUserApi.getUserStats();
    setStats(response.data);
  }, [isAdmin]);

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchUsers(), fetchStats()]);
    } catch (err) {
      setError(adminUserApi.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchUsers, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const toggleAllSelection = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const runMutation = async (fn: () => Promise<void>) => {
    try {
      setIsMutating(true);
      setError(null);
      await fn();
      await fetchData();
    } catch (err) {
      setError(adminUserApi.getErrorMessage(err));
    } finally {
      setIsMutating(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    await runMutation(async () => {
      await adminUserApi.updateUserStatus(user.id, !user.isActive);
    });
  };

  const handleDeleteUser = async (userId: string) => {
    await runMutation(async () => {
      await adminUserApi.deleteUser(userId);
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    });
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selectedUsers.length === 0) return;
    await runMutation(async () => {
      await Promise.all(
        selectedUsers.map((userId) =>
          adminUserApi.updateUserStatus(userId, isActive),
        ),
      );
      setSelectedUsers([]);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    await runMutation(async () => {
      await Promise.all(
        selectedUsers.map((userId) => adminUserApi.deleteUser(userId)),
      );
      setSelectedUsers([]);
    });
  };

  const roleBadge = (role: AdminUser["role"]) =>
    role === "ADMIN"
      ? "bg-site-accent/10 text-site-accent border-site-accent"
      : "bg-site-raised text-gray-300 border-gray-500";

  const statusBadge = (isActive: boolean) =>
    isActive
      ? "bg-green-500/10 text-green-400 border-green-500/30/30"
      : "bg-red-500/10 text-red-400 border-red-500/30/30";

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < meta.totalPages;

  const summaryText = useMemo(() => {
    if (meta.total === 0) return "ไม่พบผู้ใช้";
    const start = (meta.page - 1) * meta.limit + 1;
    const end = Math.min(meta.page * meta.limit, meta.total);
    return `แสดง ${start}-${end} จาก ${meta.total} รายการ`;
  }, [meta]);

  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="ผู้ใช้">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-site-accent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="ผู้ใช้">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <div className="w-1.5 h-6 bg-gradient-to-b from-site-accent to-site-accent/50 rounded-full mr-3 shadow-accent-glow"></div>
            <h1 className="text-2xl font-black text-white tracking-tight">จัดการผู้ใช้</h1>
          </div>
          <button
            onClick={fetchData}
            disabled={loading || isMutating}
            className="bg-site-raised text-white border border-white/5 rounded-xl px-4 py-2.5 hover:bg-[#2a2d35] hover:border-white/10 transition-all flex items-center font-bold text-[13px] disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4 mr-2 text-gray-400" />
            รีเฟรชข้อมูล
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-site-surface border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-site-accent/10 rounded-full blur-xl group-hover:bg-site-accent/20 transition-colors"></div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 relative z-10">ผู้ใช้ทั้งหมด</p>
              <p className="text-2xl font-black text-white relative z-10">
                {stats.totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="bg-site-surface border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-site-accent/10 rounded-full blur-xl group-hover:bg-site-accent/20 transition-colors"></div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 relative z-10">แอดมิน</p>
              <p className="text-2xl font-black text-white relative z-10">
                {stats.totalAdmins.toLocaleString()}
              </p>
            </div>
            <div className="bg-site-surface border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-site-accent/10 rounded-full blur-xl group-hover:bg-site-accent/20 transition-colors"></div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 relative z-10">ใช้งานอยู่</p>
              <p className="text-2xl font-black text-site-accent relative z-10">
                {stats.activeUsers.toLocaleString()}
              </p>
            </div>
            <div className="bg-site-surface border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-colors"></div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 relative z-10">ระงับการใช้งาน</p>
              <p className="text-2xl font-black text-rose-400 relative z-10">
                {stats.inactiveUsers.toLocaleString()}
              </p>
            </div>
            <div className="bg-site-surface border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-site-accent/10 rounded-full blur-xl group-hover:bg-site-accent/20 transition-colors"></div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 relative z-10">ใหม่เดือนนี้</p>
              <p className="text-2xl font-black text-white relative z-10">
                {stats.newThisMonth.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        <motion.div
          className="bg-site-surface border border-white/5 rounded-2xl p-5 shadow-lg"

          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้ใช้ หรืออีเมล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-site-raised border border-white/5 rounded-xl shadow-inner text-[13px] text-white focus:border-site-accent/50 focus:ring-1 focus:ring-site-accent/50 focus:outline-none transition-all placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 bg-site-raised border border-white/5 rounded-xl shadow-inner text-[13px] font-medium text-white focus:border-site-accent/50 focus:outline-none transition-all cursor-pointer">
                <option value="all">ทุกบทบาท</option>
                <option value="user">ผู้ใช้ทั่วไป</option>
                <option value="admin">ผู้ดูแลระบบ</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-site-raised border border-white/5 rounded-xl shadow-inner text-[13px] font-medium text-white focus:border-site-accent/50 focus:outline-none transition-all cursor-pointer">
                <option value="all">ทุกสถานะ</option>
                <option value="active">ใช้งานปกติ</option>
                <option value="inactive">ระงับการใช้งาน</option>
              </select>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-site-surface border border-white/5 rounded-2xl overflow-hidden shadow-xl"

          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-site-raised/50 border-b border-white/5">
                <tr className="text-[11px] text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-5 text-left w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length === users.length &&
                        users.length > 0
                      }
                      onChange={toggleAllSelection}
                      className="w-4 h-4 rounded-md border-white/10 bg-site-raised text-site-accent focus:ring-site-accent/50 focus:ring-offset-0 transition-all cursor-pointer"
                    />
                  </th>
                  <th className="text-left py-4 px-5 font-bold">
                    ผู้ใช้
                  </th>
                  <th className="text-left py-4 px-5 font-bold">
                    บทบาท
                  </th>
                  <th className="text-left py-4 px-5 font-bold">
                    สถานะ
                  </th>
                  <th className="text-left py-4 px-5 font-bold">
                    วันที่สมัคร
                  </th>
                  <th className="text-left py-4 px-5 font-bold">
                    คำสั่งซื้อ
                  </th>
                  <th className="text-right py-4 px-5 font-bold">
                    ยอดใช้จ่าย
                  </th>
                  <th className="text-center py-4 px-5 font-bold">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading && (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="inline-flex flex-col items-center justify-center text-gray-400 space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-site-accent" />
                        <span className="text-[13px] font-medium tracking-wide">กำลังโหลดข้อมูลผู้ใช้...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-site-raised transition-colors group">
                      <td className="py-3 px-5">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 rounded-md border-white/10 bg-site-raised text-site-accent focus:ring-site-accent/50 focus:ring-offset-0 transition-all cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-site-raised border border-white/5 flex items-center justify-center text-gray-300 font-bold group-hover:border-white/10 group-hover:bg-[#2a2d35] transition-all shadow-inner">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="text-[13px] font-bold text-white group-hover:text-site-accent transition-colors"
                              title="เปิดหน้า User Manager"
                            >
                              {user.username}
                            </Link>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md border tracking-wide uppercase ${roleBadge(user.role)}`}>
                          {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md border tracking-wide ${statusBadge(user.isActive)}`}>
                          {user.isActive ? "ใช้งานปกติ" : "ระงับการใช้งาน"}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-[12px] text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3 px-5 text-[13px] font-bold text-white">
                        {user.orderCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-5 text-[13px] text-white text-right font-black tracking-wide">
                        {formatCurrency(user.totalSpent)}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isMutating}
                            className={`p-2 rounded-lg transition-all border ${user.isActive ? "text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border-transparent" : "text-gray-400 hover:text-site-accent hover:bg-site-accent/10 hover:border-site-accent/20 border-transparent"} disabled:opacity-50`}
                            title={user.isActive ? "ระงับการใช้งาน" : "เปิดการใช้งาน"}
                          >
                            {user.isActive ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isMutating}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent rounded-lg hover:border-red-500/20 disabled:opacity-50"
                            title="ลบผู้ใช้ออกจากระบบ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent rounded-lg hover:border-white/10"
                            title="ดูโปรไฟล์และจัดการข้อมูล"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-16 text-center text-[13px] text-gray-400">
                      ไม่พบข้อมูลผู้ใช้ตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between bg-site-surface">
            <p className="text-[12px] font-bold text-gray-400 tracking-wide">{summaryText}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!canGoPrev || loading}
                className="p-2 bg-site-raised border border-white/5 rounded-xl text-gray-400 hover:text-white hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-[12px] text-white font-bold bg-site-raised rounded-xl border border-white/5 shadow-inner">
                {meta.page} / {Math.max(meta.totalPages, 1)}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!canGoNext || loading}
                className="p-2 bg-site-raised border border-white/5 rounded-xl text-gray-400 hover:text-white hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {selectedUsers.length > 0 && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+120px)] bg-site-surface border border-white/10 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-50 gap-4 min-w-[320px] md:min-w-[500px]"

            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
          >
            <span className="text-white font-bold text-[13px] tracking-wide px-3">
              เลือก <span className="text-site-accent mx-1">{selectedUsers.length}</span> รายการ
            </span>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => handleBulkStatus(true)}
                disabled={isMutating}
                className="flex-1 md:flex-none px-4 py-2 bg-site-accent/10 border border-site-accent/20 rounded-xl text-site-accent hover:bg-site-accent/20 transition-all flex justify-center items-center text-[12px] font-bold disabled:opacity-50">
                <UserCheck className="h-4 w-4 mr-2" />
                ปกตื
              </button>
              <button
                onClick={() => handleBulkStatus(false)}
                disabled={isMutating}
                className="flex-1 md:flex-none px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-all flex justify-center items-center text-[12px] font-bold disabled:opacity-50">
                <UserX className="h-4 w-4 mr-2" />
                ระงับ
              </button>
              <div className="w-[1px] h-6 bg-white/10 md:block hidden mx-1"></div>
              <button
                onClick={handleBulkDelete}
                disabled={isMutating}
                className="flex-1 md:flex-none px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 hover:border-red-500/40 transition-all flex justify-center items-center text-[12px] font-bold disabled:opacity-50">
                <Trash2 className="h-4 w-4 mr-2" />
                ลบ
              </button>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30/30 rounded-xl text-red-400 px-4 py-3">
            ไม่สามารถดำเนินการได้: {error}
          </div>
        )}

        {isMutating && (
          <div className="fixed bottom-5 right-5 bg-black text-white px-4 py-2 border border-white/5 rounded-xl flex items-center z-50">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            กำลังอัปเดตข้อมูลผู้ใช้...
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
