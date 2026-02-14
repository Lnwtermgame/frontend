"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { orderApi, Order } from "@/lib/services/order-api";
import {
  ShoppingBag,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  FileText,
  Eye,
  Calendar,
  Package,
  XCircle,
  Check,
} from "lucide-react";
import { motion } from "@/lib/framer-exports";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";

export default function OrdersPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch orders from API
  useEffect(() => {
    if (isInitialized && user) {
      fetchOrders();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isInitialized, user, statusFilter]);

  const fetchOrders = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const response = await orderApi.getOrders(
        1,
        50,
        statusFilter,
        controller.signal,
      );
      if (response.success) {
        setOrders(response.data);
        setFilteredOrders(response.data);
      }
    } catch (error: any) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        toast.error("ไม่สามารถโหลดคำสั่งซื้อได้");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Filter orders based on search term
  useEffect(() => {
    if (searchTerm) {
      setFilteredOrders(
        orders.filter(
          (order) =>
            order.orderNumber
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            order.items.some((item) =>
              item.productName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()),
            ),
        ),
      );
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

  // Set view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? "card" : "table");
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper to get safe image URL
  const getSafeImageUrl = (url?: string | null) => {
    if (!url) return null;
    return url.replace(/`/g, "").trim();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-brutal-green text-black thai-font whitespace-nowrap shadow-[2px_2px_0_0_#000]">
            <CheckCircle className="w-3 h-3 mr-1" /> สำเร็จ
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-brutal-yellow text-black thai-font whitespace-nowrap shadow-[2px_2px_0_0_#000]">
            <Clock className="w-3 h-3 mr-1" /> รอดำเนินการ
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-brutal-blue text-black thai-font whitespace-nowrap shadow-[2px_2px_0_0_#000]">
            <Clock className="w-3 h-3 mr-1" /> กำลังดำเนินการ
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-gray-300 text-black thai-font whitespace-nowrap shadow-[2px_2px_0_0_#000]">
            <XCircle className="w-3 h-3 mr-1" /> ยกเลิกแล้ว
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-gray-200 text-gray-600 thai-font whitespace-nowrap shadow-[2px_2px_0_0_#000]">
            <AlertCircle className="w-3 h-3 mr-1" /> คืนเงินแล้ว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 border-[2px] border-black text-xs font-bold bg-gray-200 text-black thai-font whitespace-nowrap shadow-[2px_2px_0_0_#000]">
            {status}
          </span>
        );
    }
  };

  const STATUS_OPTIONS = [
    { value: "", label: "ทั้งหมด" },
    { value: "PENDING", label: "รอดำเนินการ" },
    { value: "PROCESSING", label: "กำลังดำเนินการ" },
    { value: "COMPLETED", label: "สำเร็จ" },
    { value: "CANCELLED", label: "ยกเลิก" },
  ];

  // Render card view for mobile
  const renderCardView = () => {
    return (
      <div className="grid grid-cols-1 gap-4 p-4">
        {filteredOrders.map((order) => (
          <motion.div
            key={order.id}
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
            whileHover={{ y: -3 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start p-4">
              <div className="h-16 w-16 border-[2px] border-black mr-4 flex-shrink-0 bg-gray-100 overflow-hidden relative shadow-[2px_2px_0_0_#000]">
                {getSafeImageUrl(order.items[0]?.product?.imageUrl) ? (
                  <img
                    src={getSafeImageUrl(order.items[0]?.product?.imageUrl)!}
                    alt={order.items[0].product?.name || "Product"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-black" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-black font-bold text-sm line-clamp-1">
                    {order.items[0]?.product?.name
                      ? order.items[0]?.productType?.name
                        ? `${order.items[0].product.name} - ${order.items[0].productType.name}`
                        : order.items[0].product.name
                      : order.items[0]?.productName || "สินค้า"}
                  </h3>
                  <div>{renderStatusBadge(order.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600 thai-font">รหัสคำสั่งซื้อ</p>
                    <p className="text-black font-medium">
                      {order.orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 thai-font">จำนวนเงิน</p>
                    <p className="text-black font-bold">
                      {formatCurrency(order.finalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 thai-font">วันที่</p>
                    <p className="text-gray-600">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end mt-3">
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <Button size="sm" className="text-xs h-8">
                       <Eye className="h-3 w-3 mr-1.5" />
                       ดูรายละเอียด
                    </Button>
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
          <Input
            placeholder="ค้นหาคำสั่งซื้อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={18} />}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop Filter */}
          <div className="hidden md:block">
             <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border-[2px] border-black text-black text-sm focus:outline-none shadow-[2px_2px_0_0_#000] thai-font h-10 md:h-12"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          {/* Mobile Filter Button */}
          <Button 
             variant="outline" 
             className="md:hidden"
             onClick={() => setIsFilterOpen(true)}
          >
             <Filter size={16} className="mr-2" /> ตัวกรอง
          </Button>

          <div className="hidden md:flex bg-white border-[2px] border-black p-1 shadow-[2px_2px_0_0_#000]">
            <button
              className={`px-3 py-1 text-sm font-medium transition-colors thai-font ${viewMode === "table" ? "bg-black text-white" : "text-gray-600 hover:text-black"}`}
              onClick={() => setViewMode("table")}
            >
              ตาราง
            </button>
            <button
              className={`px-3 py-1 text-sm font-medium transition-colors thai-font ${viewMode === "card" ? "bg-black text-white" : "text-gray-600 hover:text-black"}`}
              onClick={() => setViewMode("card")}
            >
              การ์ด
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Mobile Filter Sheet */}
      <Sheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="ตัวกรองคำสั่งซื้อ"
      >
         <div className="space-y-6">
            <div>
               <h3 className="font-bold mb-3 flex items-center">
                  <Filter size={18} className="mr-2"/> สถานะคำสั่งซื้อ
               </h3>
               <div className="space-y-2">
                  {STATUS_OPTIONS.map((option) => (
                     <button
                        key={option.value}
                        onClick={() => {
                           setStatusFilter(option.value);
                           setIsFilterOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 border-[2px] border-black font-bold transition-all ${
                           statusFilter === option.value 
                              ? "bg-brutal-yellow text-black shadow-[2px_2px_0_0_#000]" 
                              : "bg-white text-gray-700"
                        }`}
                     >
                        <span>{option.label}</span>
                        {statusFilter === option.value && <Check size={18} />}
                     </button>
                  ))}
               </div>
            </div>
            
            <Button fullWidth onClick={() => setIsFilterOpen(false)}>
               ดูผลลัพธ์
            </Button>
         </div>
      </Sheet>

      {/* Orders list */}
      <motion.div
        className="bg-white border-[3px] border-black overflow-hidden"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b-[3px] border-black">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 thai-font">
                    รหัสคำสั่งซื้อ
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 thai-font">
                    สินค้า
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 thai-font">
                    วันที่
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 thai-font">
                    จำนวนเงิน
                  </th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-700 thai-font">
                    สถานะ
                  </th>
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
                      <td className="px-6 py-4 text-sm font-bold text-black">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 border-[2px] border-black mr-3 bg-gray-100 overflow-hidden relative shadow-[1px_1px_0_0_#000]">
                            {getSafeImageUrl(order.items[0]?.product?.imageUrl) ? (
                              <img
                                src={getSafeImageUrl(order.items[0]?.product?.imageUrl)!}
                                alt={order.items[0].product?.name || "Product"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-black" />
                              </div>
                            )}
                          </div>
                          <span className="text-black text-sm line-clamp-1">
                            {order.items[0]?.product?.name
                              ? order.items[0]?.productType?.name
                                ? `${order.items[0].product.name} - ${order.items[0].productType.name}`
                                : order.items[0].product.name
                              : order.items[0]?.productName || "สินค้า"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-black font-bold">
                        {formatCurrency(order.finalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        {renderStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/orders/${order.id}`}>
                           <Button size="sm" className="text-xs h-8 px-3">
                              <Eye className="h-3 w-3 mr-1.5" />
                              ดู
                           </Button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-600">
                        <ShoppingBag className="h-12 w-12 mx-auto opacity-50 mb-4" />
                        <p className="text-black text-lg font-bold mb-1 thai-font">
                          ไม่พบคำสั่งซื้อ
                        </p>
                        <p className="text-sm max-w-md mx-auto thai-font">
                          {searchTerm
                            ? `ไม่พบผลลัพธ์สำหรับ "${searchTerm}"`
                            : "คุณยังไม่มีคำสั่งซื้อใดๆ"}
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
