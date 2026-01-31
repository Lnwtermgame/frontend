"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { orderApi } from "@/lib/services/order-api";
import { ShoppingBag, Search, Clock, CheckCircle, AlertCircle, Filter, FileText, Eye, Calendar, Package, XCircle } from "lucide-react";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import toast from "react-hot-toast";

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  finalAmount: number;
  status: string;
  items: {
    product: {
      name: string;
      imageUrl?: string;
    };
  }[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch orders from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchOrders();
    }
  }, [isInitialized, user, statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await orderApi.getOrders(1, 50, statusFilter);
      if (response.success) {
        setOrders(response.data);
        setFilteredOrders(response.data);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดคำสั่งซื้อได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?')) return;

    try {
      const response = await orderApi.cancelOrder(orderId);
      if (response.success) {
        toast.success('ยกเลิกคำสั่งซื้อสำเร็จ');
        fetchOrders();
      }
    } catch (error) {
      const message = orderApi.getErrorMessage(error);
      toast.error(message || 'ไม่สามารถยกเลิกคำสั่งซื้อได้');
    }
  };

  // If not logged in, redirect to login page
  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Filter orders based on search term
  useEffect(() => {
    if (searchTerm) {
      setFilteredOrders(
        orders.filter(order =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items.some(item => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

  // Set view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!isInitialized || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary thai-font">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mali-green/20 text-mali-green border border-mali-green/20 thai-font">
            <CheckCircle className="w-3 h-3 mr-1" /> สำเร็จ
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/20 text-yellow-400 border border-yellow-400/20 thai-font">
            <Clock className="w-3 h-3 mr-1" /> รอดำเนินการ
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-400/20 thai-font">
            <Clock className="w-3 h-3 mr-1" /> กำลังดำเนินการ
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mali-red/20 text-mali-red border border-mali-red/20 thai-font">
            <XCircle className="w-3 h-3 mr-1" /> ยกเลิกแล้ว
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900/20 text-gray-400 border border-gray-400/20 thai-font">
            <AlertCircle className="w-3 h-3 mr-1" /> คืนเงินแล้ว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mali-blue/20 text-mali-blue-accent border border-mali-blue/20 thai-font">
            {status}
          </span>
        );
    }
  };

  // Can cancel order?
  const canCancel = (status: string) => {
    return status === 'PENDING' || status === 'PROCESSING';
  };

  // Render card view for mobile
  const renderCardView = () => {
    return (
      <div className="grid grid-cols-1 gap-4 p-4">
        {filteredOrders.map((order) => (
          <motion.div
            key={order.id}
            className="bg-mali-blue/10 border border-mali-blue/20 rounded-lg overflow-hidden"
            whileHover={{ y: -3, boxShadow: "0 10px 30px -15px rgba(2, 12, 27, 0.7)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start p-4">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-mali-blue/20 mr-4 flex-shrink-0">
                {order.items[0]?.product?.imageUrl ? (
                  <img
                    src={order.items[0].product.imageUrl}
                    alt={order.items[0].product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-mali-blue-accent" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium text-sm line-clamp-1">
                    {order.items[0]?.product?.name || 'สินค้า'}
                  </h3>
                  <div>{renderStatusBadge(order.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-mali-text-secondary thai-font">รหัสคำสั่งซื้อ</p>
                    <p className="text-mali-blue-accent font-medium">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-mali-text-secondary thai-font">จำนวนเงิน</p>
                    <p className="text-white">{formatCurrency(order.finalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-mali-text-secondary thai-font">วันที่</p>
                    <p className="text-mali-text-secondary">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex justify-end mt-3 gap-2">
                  {canCancel(order.status) && (
                    <motion.button
                      className="text-mali-red flex items-center text-xs px-2 py-1 rounded hover:bg-mali-red/10"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      <span className="thai-font">ยกเลิก</span>
                    </motion.button>
                  )}
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <motion.button
                      className="text-mali-blue-accent flex items-center text-xs px-2 py-1 rounded hover:bg-mali-blue/10"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      <span className="thai-font">ดูรายละเอียด</span>
                    </motion.button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="relative mb-6">
        <motion.h2
          className="text-xl font-bold text-white mb-1 relative thai-font"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          คำสั่งซื้อของฉัน
        </motion.h2>
        <p className="text-mali-text-secondary text-sm relative thai-font">
          ติดตามและจัดการการสั่งซื้อของคุณ
        </p>
      </div>

      {/* Search and filter bar */}
      <motion.div
        className="flex flex-col md:flex-row gap-4 justify-between mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative md:w-80">
          <input
            type="text"
            placeholder="ค้นหาคำสั่งซื้อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-mali-blue/10 border border-mali-blue/20 rounded-full text-white placeholder-mali-text-secondary focus:outline-none focus:ring-1 focus:ring-mali-blue-accent focus:border-mali-blue-accent transition-all text-sm thai-font"
          />
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-mali-text-secondary h-4 w-4" />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white text-sm focus:outline-none focus:border-mali-blue-accent thai-font"
          >
            <option value="">ทั้งหมด</option>
            <option value="PENDING">รอดำเนินการ</option>
            <option value="PROCESSING">กำลังดำเนินการ</option>
            <option value="COMPLETED">สำเร็จ</option>
            <option value="CANCELLED">ยกเลิก</option>
          </select>

          <motion.div
            className="bg-mali-blue/10 border border-mali-blue/20 rounded-lg p-1"
            whileHover={{ scale: 1.03 }}
          >
            <button
              className={`px-3 py-1 rounded-md text-sm transition-colors thai-font ${viewMode === 'table' ? 'bg-mali-blue text-white shadow-sm' : 'text-mali-text-secondary hover:text-white'}`}
              onClick={() => setViewMode('table')}
            >
              ตาราง
            </button>
            <button
              className={`px-3 py-1 rounded-md text-sm transition-colors thai-font ${viewMode === 'card' ? 'bg-mali-blue text-white shadow-sm' : 'text-mali-text-secondary hover:text-white'}`}
              onClick={() => setViewMode('card')}
            >
              การ์ด
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Orders list */}
      <motion.div
        className="bg-mali-card rounded-xl border border-mali-blue/20 overflow-hidden shadow-card-hover"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-mali-blue/10 border-b border-mali-blue/20">
                <tr>
                  <th className="px-6 py-4 text-sm font-medium text-mali-text-secondary thai-font">รหัสคำสั่งซื้อ</th>
                  <th className="px-6 py-4 text-sm font-medium text-mali-text-secondary thai-font">สินค้า</th>
                  <th className="px-6 py-4 text-sm font-medium text-mali-text-secondary thai-font">วันที่</th>
                  <th className="px-6 py-4 text-sm font-medium text-mali-text-secondary thai-font">จำนวนเงิน</th>
                  <th className="px-6 py-4 text-sm font-medium text-mali-text-secondary thai-font">สถานะ</th>
                  <th className="px-6 py-4 text-sm font-medium text-mali-text-secondary"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mali-blue/10">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <motion.tr
                      key={order.id}
                      className="hover:bg-mali-blue/5 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-mali-blue-accent">{order.orderNumber}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded overflow-hidden mr-3 bg-mali-blue/10 border border-mali-blue/20">
                            {order.items[0]?.product?.imageUrl ? (
                              <img
                                src={order.items[0].product.imageUrl}
                                alt={order.items[0].product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-mali-blue-accent" />
                              </div>
                            )}
                          </div>
                          <span className="text-white text-sm line-clamp-1">{order.items[0]?.product?.name || 'สินค้า'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-mali-text-secondary">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-white">{formatCurrency(order.finalAmount)}</td>
                      <td className="px-6 py-4">{renderStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canCancel(order.status) && (
                            <motion.button
                              className="px-3 py-1.5 rounded-lg bg-mali-red/20 hover:bg-mali-red/30 text-mali-red text-xs flex items-center"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              <XCircle className="h-3 w-3 mr-1.5" />
                              <span className="thai-font">ยกเลิก</span>
                            </motion.button>
                          )}
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <motion.button
                              className="px-3 py-1.5 rounded-lg bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-light text-xs flex items-center"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Eye className="h-3 w-3 mr-1.5" />
                              <span className="thai-font">ดู</span>
                            </motion.button>
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-mali-text-secondary">
                        <ShoppingBag className="h-12 w-12 mx-auto opacity-50 mb-4" />
                        <p className="text-white text-lg font-medium mb-1 thai-font">ไม่พบคำสั่งซื้อ</p>
                        <p className="text-sm max-w-md mx-auto thai-font">
                          {searchTerm ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"` : "คุณยังไม่มีคำสั่งซื้อใดๆ"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          renderCardView()
        )}
      </motion.div>
    </div>
  );
}
