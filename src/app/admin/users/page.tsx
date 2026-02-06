"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "@/lib/framer-exports";
import {
  Users,
  Search,
  Loader2,
  UserPlus,
  MoreHorizontal,
  Shield,
  User,
  Ban,
  CheckCircle,
  Trash2,
  Edit,
  X,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  adminUserApi,
  AdminUser,
  CreateUserData,
  UpdateUserData,
} from "@/lib/services/admin-user-api";

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, isInitialized, user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState<CreateUserData>({
    username: "",
    email: "",
    password: "",
    role: "USER",
    isActive: true,
  });

  // Edit form state
  const [editForm, setEditForm] = useState<UpdateUserData>({});

  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isInitialized, router]);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, isAdmin]);

  const fetchUsers = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      const params: {
        page: number;
        limit: number;
        role?: string;
        isActive?: boolean;
        search?: string;
      } = {
        page,
        limit: 20,
      };

      if (roleFilter !== "all") {
        params.role = roleFilter;
      }

      if (statusFilter !== "all") {
        params.isActive = statusFilter === "active";
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await adminUserApi.getUsers(params);
      setUsers(response.data.users);
      setTotalPages(response.data.meta.totalPages);
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await adminUserApi.createUser(createForm);
      setShowCreateModal(false);
      setCreateForm({
        username: "",
        email: "",
        password: "",
        role: "USER",
        isActive: true,
      });
      fetchUsers();
    } catch (err) {
      alert(adminUserApi.getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await adminUserApi.updateUser(selectedUser.id, editForm);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      alert(adminUserApi.getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUser?.id) {
      alert("ไม่สามารถปิดใช้งานบัญชีตัวเองได้");
      return;
    }

    if (!confirm(`คุณต้องการ${currentStatus ? "ปิด" : "เปิด"}ใช้งานบัญชีนี้หรือไม่?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminUserApi.updateUserStatus(userId, !currentStatus);
      fetchUsers();
    } catch (err) {
      alert(adminUserApi.getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    if (userId === currentUser?.id) {
      alert("ไม่สามารถเปลี่ยนบทบาทตัวเองได้");
      return;
    }

    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`คุณต้องการเปลี่ยนบทบาทเป็น ${newRole} หรือไม่?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminUserApi.updateUserRole(userId, newRole as "USER" | "ADMIN");
      fetchUsers();
    } catch (err) {
      alert(adminUserApi.getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      alert("ไม่สามารถลบบัญชีตัวเองได้");
      return;
    }

    if (!confirm("คุณต้องการลบผู้ใช้นี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      return;
    }

    try {
      setActionLoading(true);
      await adminUserApi.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      alert(adminUserApi.getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="จัดการผู้ใช้">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-mali-blue animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="จัดการผู้ใช้">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white thai-font">จัดการผู้ใช้</h1>
            <p className="text-gray-400 mt-1">จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึง</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-mali-blue hover:bg-mali-blue/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <UserPlus className="h-5 w-5" />
            <span className="thai-font">เพิ่มผู้ใช้ใหม่</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-mali-card border border-mali-blue/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-mali-blue"
            />
            <button
              onClick={handleSearch}
              className="bg-mali-blue hover:bg-mali-blue/80 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-mali-card border border-mali-blue/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-mali-blue"
          >
            <option value="all">ทุกบทบาท</option>
            <option value="USER">ผู้ใช้</option>
            <option value="ADMIN">แอดมิน</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-mali-card border border-mali-blue/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-mali-blue"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">ใช้งาน</option>
            <option value="inactive">ไม่ใช้งาน</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Users Table */}
        <motion.div
          className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 text-mali-blue animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-mali-blue/70 text-sm border-b border-mali-blue/20">
                      <th className="px-5 py-4 text-left">ผู้ใช้</th>
                      <th className="px-5 py-4 text-left">บทบาท</th>
                      <th className="px-5 py-4 text-center">สถานะ</th>
                      <th className="px-5 py-4 text-right">คำสั่งซื้อ</th>
                      <th className="px-5 py-4 text-right">ใช้จ่าย</th>
                      <th className="px-5 py-4 text-left">สมัครเมื่อ</th>
                      <th className="px-5 py-4 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mali-blue/10">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr
                          key={user.id}
                          className="text-sm hover:bg-mali-blue/5 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-mali-blue/20 flex items-center justify-center">
                                <User className="h-5 w-5 text-mali-blue" />
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {user.username}
                                </p>
                                <p className="text-xs text-gray-400">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                                user.role === "ADMIN"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {user.role === "ADMIN" ? (
                                <Shield className="h-3 w-3" />
                              ) : (
                                <User className="h-3 w-3" />
                              )}
                              <span>{user.role === "ADMIN" ? "แอดมิน" : "ผู้ใช้"}</span>
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                                user.isActive
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {user.isActive ? (
                                <>
                                  <CheckCircle className="h-3 w-3" />
                                  <span>ใช้งาน</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="h-3 w-3" />
                                  <span>ไม่ใช้งาน</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right text-white">
                            {user.orderCount.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-right text-mali-gold">
                            {formatCurrency(user.totalSpent)}
                          </td>
                          <td className="px-5 py-4 text-gray-400">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleToggleRole(user.id, user.role)}
                                disabled={actionLoading || user.id === currentUser?.id}
                                className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                                title="เปลี่ยนบทบาท"
                              >
                                <Shield className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(user.id, user.isActive)}
                                disabled={actionLoading || user.id === currentUser?.id}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  user.isActive
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                    : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                }`}
                                title={user.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                              >
                                {user.isActive ? (
                                  <Ban className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => openEditModal(user)}
                                disabled={actionLoading}
                                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                                title="แก้ไข"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={actionLoading || user.id === currentUser?.id}
                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                title="ลบ"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-8 text-center text-gray-400"
                        >
                          ไม่พบผู้ใช้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-mali-blue/20">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="px-4 py-2 bg-mali-background rounded-lg text-white disabled:opacity-50"
                  >
                    ก่อนหน้า
                  </button>
                  <span className="text-gray-400">
                    หน้า {page} จาก {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    className="px-4 py-2 bg-mali-background rounded-lg text-white disabled:opacity-50"
                  >
                    ถัดไป
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-mali-card rounded-xl border border-mali-blue/20 p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white thai-font">เพิ่มผู้ใช้ใหม่</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">ชื่อผู้ใช้</label>
                  <input
                    type="text"
                    required
                    value={createForm.username}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, username: e.target.value })
                    }
                    className="w-full bg-mali-background border border-mali-blue/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-mali-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">อีเมล</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                    className="w-full bg-mali-background border border-mali-blue/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-mali-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">รหัสผ่าน</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, password: e.target.value })
                    }
                    className="w-full bg-mali-background border border-mali-blue/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-mali-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">บทบาท</label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        role: e.target.value as "USER" | "ADMIN",
                      })
                    }
                    className="w-full bg-mali-background border border-mali-blue/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-mali-blue"
                  >
                    <option value="USER">ผู้ใช้</option>
                    <option value="ADMIN">แอดมิน</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={createForm.isActive}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, isActive: e.target.checked })
                    }
                    className="rounded bg-mali-background border-mali-blue/30"
                  />
                  <label htmlFor="isActive" className="text-gray-400">
                    เปิดใช้งานทันที
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-mali-blue text-white rounded-lg hover:bg-mali-blue/80 disabled:opacity-50"
                  >
                    {actionLoading ? "กำลังสร้าง..." : "สร้างผู้ใช้"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-mali-card rounded-xl border border-mali-blue/20 p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white thai-font">แก้ไขผู้ใช้</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">ชื่อผู้ใช้</label>
                  <input
                    type="text"
                    value={editForm.username || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="w-full bg-mali-background border border-mali-blue/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-mali-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full bg-mali-background border border-mali-blue/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-mali-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">บทบาท</label>
                  <select
                    value={editForm.role || "USER"}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        role: e.target.value as "USER" | "ADMIN",
                      })
                    }
                    className="w-full bg-mali-background border border-mali-blue/30 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-mali-blue"
                  >
                    <option value="USER">ผู้ใช้</option>
                    <option value="ADMIN">แอดมิน</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editForm.isActive}
                    onChange={(e) =>
                      setEditForm({ ...editForm, isActive: e.target.checked })
                    }
                    className="rounded bg-mali-background border-mali-blue/30"
                  />
                  <label htmlFor="editIsActive" className="text-gray-400">
                    เปิดใช้งาน
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-mali-blue text-white rounded-lg hover:bg-mali-blue/80 disabled:opacity-50"
                  >
                    {actionLoading ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
