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
      await Promise.all(selectedUsers.map((userId) => adminUserApi.deleteUser(userId)));
      setSelectedUsers([]);
    });
  };

  const roleBadge = (role: AdminUser["role"]) =>
    role === "ADMIN"
      ? "bg-purple-100 text-purple-700 border-purple-500"
      : "bg-gray-100 text-gray-700 border-gray-500";

  const statusBadge = (isActive: boolean) =>
    isActive
      ? "bg-green-100 text-green-700 border-green-500"
      : "bg-red-100 text-red-700 border-red-500";

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
          <Loader2 className="h-8 w-8 text-brutal-pink animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="ผู้ใช้">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <span className="w-1.5 h-6 bg-brutal-yellow mr-2"></span>
            <h1 className="text-2xl font-bold text-black">จัดการผู้ใช้</h1>
          </div>
          <button
            onClick={fetchData}
            disabled={loading || isMutating}
            className="bg-white text-black border-[3px] border-black px-4 py-2 hover:bg-gray-50 transition-colors flex items-center font-medium disabled:opacity-60"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border-[3px] border-black p-4" style={{ boxShadow: "4px 4px 0 0 #000000" }}>
              <p className="text-xs text-gray-500">ผู้ใช้ทั้งหมด</p>
              <p className="text-xl font-bold text-black">{stats.totalUsers.toLocaleString()}</p>
            </div>
            <div className="bg-white border-[3px] border-black p-4" style={{ boxShadow: "4px 4px 0 0 #000000" }}>
              <p className="text-xs text-gray-500">แอดมิน</p>
              <p className="text-xl font-bold text-black">{stats.totalAdmins.toLocaleString()}</p>
            </div>
            <div className="bg-white border-[3px] border-black p-4" style={{ boxShadow: "4px 4px 0 0 #000000" }}>
              <p className="text-xs text-gray-500">ใช้งานอยู่</p>
              <p className="text-xl font-bold text-green-700">{stats.activeUsers.toLocaleString()}</p>
            </div>
            <div className="bg-white border-[3px] border-black p-4" style={{ boxShadow: "4px 4px 0 0 #000000" }}>
              <p className="text-xs text-gray-500">ไม่ใช้งาน</p>
              <p className="text-xl font-bold text-red-700">{stats.inactiveUsers.toLocaleString()}</p>
            </div>
            <div className="bg-white border-[3px] border-black p-4" style={{ boxShadow: "4px 4px 0 0 #000000" }}>
              <p className="text-xs text-gray-500">ใหม่เดือนนี้</p>
              <p className="text-xl font-bold text-black">{stats.newThisMonth.toLocaleString()}</p>
            </div>
          </div>
        )}

        <motion.div
          className="bg-white border-[3px] border-black p-4"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="ค้นหาผู้ใช้..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border-[2px] border-gray-300 text-black focus:border-black focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 bg-white border-[2px] border-gray-300 text-black focus:border-black focus:outline-none"
              >
                <option value="all">ทุกบทบาท</option>
                <option value="user">ผู้ใช้</option>
                <option value="admin">แอดมิน</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white border-[2px] border-gray-300 text-black focus:border-black focus:outline-none"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="active">ใช้งาน</option>
                <option value="inactive">ไม่ใช้งาน</option>
              </select>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white border-[3px] border-black overflow-hidden"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-[2px] border-black">
                <tr>
                  <th className="py-3 px-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={toggleAllSelection}
                      className="w-4 h-4 border-[2px] border-black text-brutal-purple focus:ring-black"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">ผู้ใช้</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">บทบาท</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">สถานะ</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">วันที่สมัคร</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-black">คำสั่งซื้อ</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-black">ยอดใช้จ่าย</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-black">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center">
                      <div className="inline-flex items-center text-gray-600">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        กำลังโหลดข้อมูลผู้ใช้...
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="w-4 h-4 border-[2px] border-black text-brutal-purple focus:ring-black"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brutal-purple flex items-center justify-center text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="text-sm font-medium text-black hover:underline"
                              title="เปิดหน้า User Manager"
                            >
                              {user.username}
                            </Link>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border-[2px] ${roleBadge(user.role)}`}>
                          {user.role === "ADMIN" ? "แอดมิน" : "ผู้ใช้"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border-[2px] ${statusBadge(user.isActive)}`}>
                          {user.isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-4 text-sm text-black">{user.orderCount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-black text-right font-medium">
                        {formatCurrency(user.totalSpent)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isMutating}
                            className="p-2 text-gray-600 hover:text-brutal-blue hover:bg-blue-50 transition-colors border-[2px] border-transparent hover:border-brutal-blue disabled:opacity-50"
                            title={user.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
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
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors border-[2px] border-transparent hover:border-red-500 disabled:opacity-50"
                            title="ปิดใช้งานผู้ใช้"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 transition-colors border-[2px] border-transparent hover:border-black"
                            title="จัดการผู้ใช้แบบเต็ม"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-gray-500">
                      ไม่พบข้อมูลผู้ใช้ตามเงื่อนไขที่เลือก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t-[2px] border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">{summaryText}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!canGoPrev || loading}
                className="p-2 border-[2px] border-gray-300 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 text-sm text-black font-medium">
                หน้า {meta.page} / {Math.max(meta.totalPages, 1)}
              </span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!canGoNext || loading}
                className="p-2 border-[2px] border-gray-300 hover:border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {selectedUsers.length > 0 && (
          <motion.div
            className="bg-brutal-yellow border-[3px] border-black p-4 flex items-center justify-between"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-black font-medium">เลือก {selectedUsers.length} รายการ</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkStatus(true)}
                disabled={isMutating}
                className="px-4 py-2 bg-white border-[2px] border-black text-black hover:bg-gray-100 transition-colors flex items-center text-sm font-medium disabled:opacity-50"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                เปิดใช้งาน
              </button>
              <button
                onClick={() => handleBulkStatus(false)}
                disabled={isMutating}
                className="px-4 py-2 bg-white border-[2px] border-black text-black hover:bg-gray-100 transition-colors flex items-center text-sm font-medium disabled:opacity-50"
              >
                <UserX className="h-4 w-4 mr-2" />
                ปิดใช้งาน
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isMutating}
                className="px-4 py-2 bg-red-500 border-[2px] border-black text-white hover:bg-red-600 transition-colors flex items-center text-sm font-medium disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                ปิดใช้งานผู้ใช้
              </button>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="bg-red-100 border-[3px] border-red-500 text-red-700 px-4 py-3">
            ไม่สามารถดำเนินการได้: {error}
          </div>
        )}

        {isMutating && (
          <div className="fixed bottom-5 right-5 bg-black text-white px-4 py-2 border-[3px] border-black flex items-center z-50">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            กำลังอัปเดตข้อมูลผู้ใช้...
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
