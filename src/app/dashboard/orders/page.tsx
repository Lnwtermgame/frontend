"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { orderApi, Order } from "@/lib/services/order-api";
import { ShoppingBag, Search, Clock, CheckCircle, AlertCircle, Filter, FileText, Eye, Calendar, Package, XCircle } from "lucide-react";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import toast from "react-hot-toast";

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
          order.items.some(item => item.productName?.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 thai-font">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-brutal-green text-black thai-font">
            <CheckCircle className="w-3 h-3 mr-1" /> สำเร็จ
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-brutal-yellow text-black thai-font">
            <Clock className="w-3 h-3 mr-1" /> รอดำเนินการ
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-brutal-blue text-black thai-font">
            <Clock className="w-3 h-3 mr-1" /> กำลังดำเนินการ
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-gray-300 text-black thai-font">
            <XCircle className="w-3 h-3 mr-1" /> ยกเลิกแล้ว
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-gray-200 text-gray-600 thai-font">
            <AlertCircle className="w-3 h-3 mr-1" /> คืนเงินแล้ว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-gray-200 text-black thai-font">
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
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: '4px 4px 0 0 #000000' }}
            whileHover={{ y: -3 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start p-4">
              <div className="h-16 w-16 border-[2px] border-black mr-4 flex-shrink-0 bg-gray-100">
                {order.items[0]?.productId ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-black" />
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-black" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-black font-bold text-sm line-clamp-1">
                    {order.items[0]?.productName || 'สินค้า'}
                  </h3>
                  <div>{renderStatusBadge(order.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600 thai-font">รหัสคำสั่งซื้อ</p>
                    <p className="text-black font-medium">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 thai-font">จำนวนเงิน</p>
                    <p className="text-black font-bold">{formatCurrency(order.finalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 thai-font">วันที่</p>
                    <p className="text-gray-600">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex justify-end mt-3 gap-2">
                  {canCancel(order.status) && (
                    <motion.button
                      className="text-red-600 flex items-center text-xs px-2 py-1 border-[2px] border-red-600 hover:bg-red-50"
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
                      className="text-black flex items-center text-xs px-2 py-1 border-[2px] border-black bg-brutal-blue hover:bg-brutal-blue/80"
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
          className="text-xl font-bold text-black mb-1 relative flex items-center thai-font"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
          คำสั่งซื้อของฉัน
        </motion.h2>
        <p className="text-gray-600 text-sm relative thai-font">
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
            className="w-full pl-10 pr-4 py-2 bg-white border-[2px] border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-black transition-all text-sm thai-font"
          />
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border-[2px] border-gray-300 rounded-lg text-black text-sm focus:outline-none focus:border-black thai-font"
          >
            <option value="">ทั้งหมด</option>
            <option value="PENDING">รอดำเนินการ</option>
            <option value="PROCESSING">กำลังดำเนินการ</option>
            <option value="COMPLETED">สำเร็จ</option>
            <option value="CANCELLED">ยกเลิก</option>
          </select>

          <motion.div
            className="bg-white border-[2px] border-black p-1"
            style={{ boxShadow: '2px 2px 0 0 #000000' }}
            whileHover={{ scale: 1.03 }}
          >
            <button
              className={`px-3 py-1 text-sm font-medium transition-colors thai-font ${viewMode === 'table' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'}`}
              onClick={() => setViewMode('table')}
            >
              ตาราง
            </button>
            <button
              className={`px-3 py-1 text-sm font-medium transition-colors thai-font ${viewMode === 'card' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'}`}
              onClick={() => setViewMode('card')}
            >
              การ์ด
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Orders list */}
      <motion.div
        className="bg-white border-[3px] border-black overflow-hidden"
        style={{ boxShadow: '4px 4px 0 0 #000000' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b-[3px] border-black">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 thai-font">รหัสคำสั่งซื้อ</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 thai-font">สินค้า</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 thai-font">วันที่</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 thai-font">จำนวนเงิน</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 thai-font">สถานะ</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <motion.tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 text-sm font-bold text-black">{order.orderNumber}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 border-[2px] border-black mr-3 bg-gray-100">
                            {order.items[0]?.productId ? (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-black" />
                              </div>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-black" />
                              </div>
                            )}
                          </div>
                          <span className="text-black text-sm line-clamp-1">{order.items[0]?.productName || 'สินค้า'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 text-sm text-black font-bold">{formatCurrency(order.finalAmount)}</td>
                      <td className="px-6 py-4">{renderStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canCancel(order.status) && (
                            <motion.button
                              className="px-3 py-1.5 border-[2px] border-red-600 text-red-600 text-xs flex items-center hover:bg-red-50"
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
                              className="px-3 py-1.5 border-[2px] border-black bg-brutal-blue text-black text-xs flex items-center hover:bg-brutal-blue/80"
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
                      <div className="text-gray-600">
                        <ShoppingBag className="h-12 w-12 mx-auto opacity-50 mb-4" />
                        <p className="text-black text-lg font-bold mb-1 thai-font">ไม่พบคำสั่งซื้อ</p>
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
