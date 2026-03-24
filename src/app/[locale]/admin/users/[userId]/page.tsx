"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  adminUserApi,
  AdminUserDetail,
  UserAuditActivity,
} from "@/lib/services/admin-user-api";
import { Order, orderApi } from "@/lib/services/order-api";
import { Invoice, invoiceApi } from "@/lib/services/invoice-api";
import { deliveryApi, OrderDeliveryStatus } from "@/lib/services/delivery-api";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  UserCheck,
  UserX,
  Shield,
  ShoppingCart,
  FileText,
  Eye,
  Truck,
  ShieldAlert,
} from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminUserManagerPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { isAdmin, isInitialized } = useAuth();

  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersMeta, setOrdersMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesMeta, setInvoicesMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [roleDraft, setRoleDraft] = useState<"USER" | "ADMIN">("USER");
  const [adminReason, setAdminReason] = useState("");

  const [deliveries, setDeliveries] = useState<OrderDeliveryStatus[]>([]);
  const [deliveriesMeta, setDeliveriesMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [auditTrail, setAuditTrail] = useState<UserAuditActivity[]>([]);
  const [auditMeta, setAuditMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [auditTypeFilter, setAuditTypeFilter] = useState("all");
  const [auditResolvedFilter, setAuditResolvedFilter] = useState("all");
  const [auditFromDate, setAuditFromDate] = useState("");
  const [auditToDate, setAuditToDate] = useState("");

  useEffect(() => {
    if (isInitialized && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isInitialized, router]);

  const fetchAll = useCallback(async () => {
    if (!isAdmin || !userId) return;

    try {
      setLoading(true);
      setError(null);

      const [userRes, ordersRes, invoicesRes, deliveriesRes, auditRes] =
        await Promise.all([
          adminUserApi.getUserById(userId),
          orderApi.getAllOrders(
            ordersMeta.page,
            ordersMeta.limit,
            undefined,
            userId,
          ),
          invoiceApi.getAdminInvoicesByUser(
            userId,
            invoicesMeta.page,
            invoicesMeta.limit,
          ),
          deliveryApi.getAllDeliveries({
            userId,
            page: deliveriesMeta.page,
            limit: deliveriesMeta.limit,
          }),
          adminUserApi.getUserAuditTrail(userId, {
            page: auditMeta.page,
            limit: auditMeta.limit,
            type: auditTypeFilter !== "all" ? auditTypeFilter : undefined,
            resolved:
              auditResolvedFilter === "all"
                ? undefined
                : auditResolvedFilter === "resolved",
            fromDate: auditFromDate || undefined,
            toDate: auditToDate || undefined,
          }),
        ]);

      setUserDetail(userRes.data);
      setRoleDraft(userRes.data.role);
      setOrders(ordersRes.data);
      setOrdersMeta((prev) => ({
        ...prev,
        total: ordersRes.meta?.total || 0,
        totalPages: ordersRes.meta?.totalPages || 1,
      }));
      setInvoices(invoicesRes.data);
      setInvoicesMeta((prev) => ({
        ...prev,
        total: invoicesRes.meta?.total || 0,
        totalPages: invoicesRes.meta?.totalPages || 1,
      }));
      setDeliveries(deliveriesRes.data);
      setDeliveriesMeta((prev) => ({
        ...prev,
        total: deliveriesRes.meta?.total || 0,
        totalPages: deliveriesRes.meta?.totalPages || 1,
      }));
      setAuditTrail(auditRes.data.activities);
      setAuditMeta(auditRes.data.meta);
    } catch (err) {
      setError(adminUserApi.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [
    auditMeta.limit,
    auditMeta.page,
    auditFromDate,
    auditResolvedFilter,
    auditToDate,
    auditTypeFilter,
    deliveriesMeta.limit,
    deliveriesMeta.page,
    invoicesMeta.limit,
    invoicesMeta.page,
    isAdmin,
    ordersMeta.limit,
    ordersMeta.page,
    userId,
  ]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const runMutation = async (fn: () => Promise<void>) => {
    try {
      setMutating(true);
      setError(null);
      await fn();
      await fetchAll();
    } catch (err) {
      setError(adminUserApi.getErrorMessage(err));
    } finally {
      setMutating(false);
    }
  };

  const handleToggleActive = async () => {
    if (!userDetail) return;
    await runMutation(async () => {
      await adminUserApi.updateUserStatus(
        userDetail.id,
        !userDetail.isActive,
        adminReason.trim() || undefined,
      );
      setAdminReason("");
    });
  };

  const handleSaveRole = async () => {
    if (!userDetail || roleDraft === userDetail.role) return;
    await runMutation(async () => {
      await adminUserApi.updateUserRoleWithReason(
        userDetail.id,
        roleDraft,
        adminReason.trim() || undefined,
      );
      setAdminReason("");
    });
  };

  const handleSuspendWithReason = async () => {
    if (!userDetail) return;
    if (!adminReason.trim()) {
      setError("กรุณาระบุเหตุผลในการระงับบัญชี");
      return;
    }

    await runMutation(async () => {
      await adminUserApi.suspendUser(userDetail.id, adminReason.trim());
      setAdminReason("");
    });
  };

  const handleResolveAuditActivity = async (activityId: string) => {
    await runMutation(async () => {
      await adminUserApi.resolveUserAuditActivity(
        userId,
        activityId,
        adminReason.trim() || undefined,
      );
    });
  };

  const orderSummary = useMemo(() => {
    if (!userDetail) return "-";
    return `${userDetail.orderCount.toLocaleString()} รายการ`;
  }, [userDetail]);

  if (!isInitialized || !isAdmin) {
    return (
      <AdminLayout title="จัดการผู้ใช้">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-pink-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="จัดการผู้ใช้">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-pink-400 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!userDetail) {
    return (
      <AdminLayout title="จัดการผู้ใช้">
        <div className="bg-red-500/10 border border-red-500/30/30 rounded-[12px] text-red-400 px-4 py-3">
          ไม่พบข้อมูลผู้ใช้
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="จัดการผู้ใช้">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="p-2 bg-[#212328] border border-site-border/30 rounded-[16px] hover:bg-[#212328]/5 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">User Manager</h1>
              <p className="text-sm text-gray-400">
                ดูข้อมูลทั้งหมดและจัดการบัญชีผู้ใช้
              </p>
            </div>
          </div>
          <button
            onClick={fetchAll}
            disabled={mutating}
            className="bg-[#212328] text-white border border-site-border/30 rounded-[12px] px-4 py-2 hover:bg-[#212328]/5 transition-colors flex items-center font-medium disabled:opacity-60">
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30/30 rounded-[12px] text-red-400 px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div
            className="bg-[#212328] border border-site-border/30 rounded-[16px] p-4 lg:col-span-2">
            <p className="text-xs text-gray-500">ชื่อผู้ใช้</p>
            <p className="text-lg font-bold text-white">
              {userDetail.username}
            </p>
            <p className="text-sm text-gray-400">{userDetail.email}</p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full border border-site-border/30 rounded-[12px] shadow-sm ${
                  userDetail.isActive
                    ? "bg-green-500/10 text-green-400 border-green-500/30/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30/30"
                }`}>
                {userDetail.isActive ? "ใช้งาน" : "ไม่ใช้งาน"}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full border border-site-border/30 rounded-[12px] shadow-sm ${
                  userDetail.role === "ADMIN"
                    ? "bg-purple-100 text-purple-700 border-purple-500"
                    : "bg-[#1A1C1E] text-gray-300 border-gray-500"
                }`}>
                {userDetail.role}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              สมัครเมื่อ: {formatDateTime(userDetail.createdAt)}
            </p>
          </div>

          <div
            className="bg-[#212328] border border-site-border/30 rounded-[16px] p-4">
            <p className="text-xs text-gray-500">คำสั่งซื้อทั้งหมด</p>
            <p className="text-2xl font-bold text-white">{orderSummary}</p>
            <p className="text-xs text-gray-500 mt-2">ยอดใช้จ่ายรวม</p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(userDetail.totalSpent)}
            </p>
          </div>

          <div
            className="bg-[#212328] border border-site-border/30 rounded-[16px] p-4">
            <p className="text-xs text-gray-500">เครดิตคงเหลือ</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(userDetail.creditBalance)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Invoice ทั้งหมด</p>
            <p className="text-lg font-semibold text-white">
              {invoicesMeta.total.toLocaleString()} รายการ
            </p>
          </div>
        </div>

        <motion.div
          className="bg-[#212328] border border-site-border/30 rounded-[16px] p-4"
          
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">จัดการบัญชี</h3>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleActive}
              disabled={mutating}
              className="px-4 py-2 bg-[#212328] border border-site-border/30 rounded-[12px] shadow-sm hover:bg-[#212328]/5 transition-colors flex items-center font-medium disabled:opacity-50">
              {userDetail.isActive ? (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  ปิดใช้งานบัญชี
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  เปิดใช้งานบัญชี
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <select
                value={roleDraft}
                onChange={(e) =>
                  setRoleDraft(e.target.value as "USER" | "ADMIN")
                }
                className="px-3 py-2 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 bg-[#212328] focus:border-site-accent focus:outline-none"
                disabled={mutating}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <button
                onClick={handleSaveRole}
                disabled={mutating || roleDraft === userDetail.role}
                className="px-4 py-2 bg-black text-white border border-site-border/30 rounded-[12px] shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-50">
                บันทึก role
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div
            className="bg-[#212328] border border-site-border/30 rounded-[16px] overflow-hidden"
            
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="p-4 border-b-[2px] border-site-border/50 bg-[#181A1D] flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2 text-pink-400" />
                ประวัติคำสั่งซื้อ
              </h3>
              <span className="text-xs text-gray-400">
                {ordersMeta.total.toLocaleString()} รายการ
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#181A1D] border-b-[2px] border-site-border/30">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-white">
                      Order
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-white">
                      สถานะ
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-white">
                      ยอดรวม
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-white">
                      ดู
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-site-border/30">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-2 px-3 text-sm text-white">
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-300">
                        {order.status}
                      </td>
                      <td className="py-2 px-3 text-sm text-right font-medium text-white">
                        {formatCurrency(order.finalAmount)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex p-2 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 hover:border-site-border/50 hover:bg-[#212328]/5">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-sm text-gray-500">
                        ไม่พบคำสั่งซื้อ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t-[2px] border-site-border/30 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                หน้า {ordersMeta.page} / {Math.max(ordersMeta.totalPages, 1)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setOrdersMeta((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  disabled={ordersMeta.page <= 1 || loading}
                  className="px-3 py-1 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 hover:border-site-border/50 disabled:opacity-50">
                  ก่อนหน้า
                </button>
                <button
                  onClick={() =>
                    setOrdersMeta((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={ordersMeta.page >= ordersMeta.totalPages || loading}
                  className="px-3 py-1 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 hover:border-site-border/50 disabled:opacity-50">
                  ถัดไป
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-[#212328] border border-site-border/30 rounded-[16px] overflow-hidden"
            
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-4 border-b-[2px] border-site-border/50 bg-[#181A1D] flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center">
                <FileText className="h-4 w-4 mr-2 text-site-accent" />
                Invoice ของผู้ใช้
              </h3>
              <span className="text-xs text-gray-400">
                {invoicesMeta.total.toLocaleString()} รายการ
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#181A1D] border-b-[2px] border-site-border/30">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-white">
                      Invoice
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-white">
                      สถานะ
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-white">
                      ยอดรวม
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-white">
                      Order
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-site-border/30">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="py-2 px-3 text-sm text-white">
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(invoice.issuedAt)}
                        </p>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-300">
                        {invoice.status}
                      </td>
                      <td className="py-2 px-3 text-sm text-right font-medium text-white">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Link
                          href={`/admin/orders/${invoice.orderId}`}
                          className="inline-flex p-2 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 hover:border-site-border/50 hover:bg-[#212328]/5">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-sm text-gray-500">
                        ไม่พบ invoice
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t-[2px] border-site-border/30 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                หน้า {invoicesMeta.page} /{" "}
                {Math.max(invoicesMeta.totalPages, 1)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setInvoicesMeta((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  disabled={invoicesMeta.page <= 1 || loading}
                  className="px-3 py-1 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 hover:border-site-border/50 disabled:opacity-50">
                  ก่อนหน้า
                </button>
                <button
                  onClick={() =>
                    setInvoicesMeta((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
                  }
                  disabled={
                    invoicesMeta.page >= invoicesMeta.totalPages || loading
                  }
                  className="px-3 py-1 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 hover:border-site-border/50 disabled:opacity-50">
                  ถัดไป
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <motion.div
            className="bg-[#212328] border border-site-border/30 rounded-[16px] overflow-hidden"
            
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <div className="p-4 border-b-[2px] border-site-border/50 bg-[#181A1D] flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center">
                <Truck className="h-4 w-4 mr-2 text-green-400" />
                Delivery / Fulfillment Logs
              </h3>
              <span className="text-xs text-gray-400">
                {deliveriesMeta.total.toLocaleString()} รายการ
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#181A1D] border-b-[2px] border-site-border/30">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-white">
                      Order
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-white">
                      สถานะ
                    </th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-white">
                      จำนวน Item
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-white">
                      ดู
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-site-border/30">
                  {deliveries.map((delivery) => (
                    <tr key={delivery.orderId}>
                      <td className="py-2 px-3 text-sm text-white">
                        <p className="font-medium">{delivery.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(delivery.updatedAt)}
                        </p>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-300">
                        {delivery.status}
                      </td>
                      <td className="py-2 px-3 text-sm text-right font-medium text-white">
                        {delivery.items.length.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Link
                          href={`/admin/orders/${delivery.orderId}`}
                          className="inline-flex p-2 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 hover:border-site-border/50 hover:bg-[#212328]/5">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {deliveries.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-sm text-gray-500">
                        ไม่พบ delivery logs
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t-[2px] border-site-border/30 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                หน้า {deliveriesMeta.page} /{" "}
                {Math.max(deliveriesMeta.totalPages, 1)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setDeliveriesMeta((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  disabled={deliveriesMeta.page <= 1 || loading}
                  className="px-3 py-1 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 hover:border-site-border/50 disabled:opacity-50">
                  ก่อนหน้า
                </button>
                <button
                  onClick={() =>
                    setDeliveriesMeta((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
                  }
                  disabled={
                    deliveriesMeta.page >= deliveriesMeta.totalPages || loading
                  }
                  className="px-3 py-1 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 hover:border-site-border/50 disabled:opacity-50">
                  ถัดไป
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-[#212328] border border-site-border/30 rounded-[16px] overflow-hidden"
            
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
          >
            <div className="p-4 border-b-[2px] border-site-border/50 bg-[#181A1D] flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center">
                <ShieldAlert className="h-4 w-4 mr-2 text-orange-400" />
                Audit Trail
              </h3>
              <span className="text-xs text-gray-400">
                {auditMeta.total.toLocaleString()} รายการ
              </span>
            </div>
            <div className="p-3 border-b-[2px] border-site-border/30 bg-[#181A1D]">
              <label
                htmlFor="adminReason"
                className="text-xs font-medium text-gray-300">
                เหตุผลการจัดการบัญชี
              </label>
              <textarea
                id="adminReason"
                value={adminReason}
                onChange={(e) => setAdminReason(e.target.value)}
                rows={2}
                placeholder="เช่น พบพฤติกรรมผิดปกติ / ตามคำขอผู้ใช้ / ความปลอดภัย"
                className="mt-1 w-full border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 focus:border-site-accent focus:outline-none px-3 py-2 text-sm bg-[#212328]"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={handleSuspendWithReason}
                  disabled={mutating}
                  className="px-3 py-1.5 text-xs bg-red-500/50 text-white border border-site-border/30 rounded-[12px] shadow-sm hover:bg-red-600 disabled:opacity-50">
                  ระงับพร้อมเหตุผล
                </button>
              </div>
            </div>
            <div className="p-3 border-b-[2px] border-site-border/30 bg-[#212328] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
              <select
                value={auditTypeFilter}
                onChange={(e) => {
                  setAuditMeta((prev) => ({ ...prev, page: 1 }));
                  setAuditTypeFilter(e.target.value);
                }}
                className="px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 text-xs bg-[#212328] focus:border-site-accent focus:outline-none">
                <option value="all">ทุกประเภท</option>
                <option value="admin-suspend">admin-suspend</option>
                <option value="admin-status-update">admin-status-update</option>
                <option value="admin-role-update">admin-role-update</option>
                <option value="admin-audit-resolve">admin-audit-resolve</option>
                <option value="login">login</option>
                <option value="payment">payment</option>
              </select>
              <select
                value={auditResolvedFilter}
                onChange={(e) => {
                  setAuditMeta((prev) => ({ ...prev, page: 1 }));
                  setAuditResolvedFilter(e.target.value);
                }}
                className="px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 text-xs bg-[#212328] focus:border-site-accent focus:outline-none">
                <option value="all">ทุกสถานะ</option>
                <option value="resolved">Resolved</option>
                <option value="unresolved">Unresolved</option>
              </select>
              <input
                type="date"
                value={auditFromDate}
                onChange={(e) => {
                  setAuditMeta((prev) => ({ ...prev, page: 1 }));
                  setAuditFromDate(e.target.value);
                }}
                className="px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 text-xs bg-[#212328] focus:border-site-accent focus:outline-none"
              />
              <input
                type="date"
                value={auditToDate}
                onChange={(e) => {
                  setAuditMeta((prev) => ({ ...prev, page: 1 }));
                  setAuditToDate(e.target.value);
                }}
                className="px-2 py-1.5 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 text-xs bg-[#212328] focus:border-site-accent focus:outline-none"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#181A1D] border-b-[2px] border-site-border/30">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-white">
                      เวลา
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-white">
                      ประเภท
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-white">
                      รายละเอียด
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-white">
                      สถานะ
                    </th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-white">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-site-border/30">
                  {auditTrail.map((activity) => (
                    <tr key={activity.id}>
                      <td className="py-2 px-3 text-xs text-gray-400">
                        {formatDateTime(activity.timestamp)}
                      </td>
                      <td className="py-2 px-3 text-xs text-white">
                        {activity.type}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-300">
                        {activity.description}
                      </td>
                      <td className="py-2 px-3 text-xs">
                        <span
                          className={`px-2 py-1 rounded border ${
                            activity.resolved
                              ? "bg-green-500/10 text-green-400 border-green-300"
                              : "bg-yellow-500/10 text-yellow-400 border-yellow-300"
                          }`}>
                          {activity.resolved ? "Resolved" : "Unresolved"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {!activity.resolved ? (
                          <button
                            onClick={() =>
                              handleResolveAuditActivity(activity.id)
                            }
                            disabled={mutating}
                            className="px-2 py-1 text-xs bg-black text-white border border-site-border/30 rounded-[12px] shadow-sm hover:bg-gray-800 disabled:opacity-50">
                            Resolve
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {auditTrail.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-sm text-gray-500">
                        ไม่พบ audit trail
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t-[2px] border-site-border/30 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                หน้า {auditMeta.page} / {Math.max(auditMeta.totalPages, 1)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setAuditMeta((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  disabled={auditMeta.page <= 1 || loading}
                  className="px-3 py-1 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 hover:border-site-border/50 disabled:opacity-50">
                  ก่อนหน้า
                </button>
                <button
                  onClick={() =>
                    setAuditMeta((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={auditMeta.page >= auditMeta.totalPages || loading}
                  className="px-3 py-1 border border-site-border/30 rounded-[12px] shadow-sm border-gray-300 hover:border-site-border/50 disabled:opacity-50">
                  ถัดไป
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {mutating && (
          <div className="fixed bottom-5 right-5 bg-black text-white px-4 py-2 border border-site-border/30 rounded-[12px] flex items-center z-50">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            กำลังอัปเดตข้อมูล...
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
