"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { motion } from "@/lib/framer-exports";
import { 
  ShoppingCart, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  Clock, 
  Ban, 
  Edit, 
  Check, 
  X, 
  AlertCircle, 
  Filter, 
  Calendar, 
  ChevronDown, 
  Trash2 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Order statuses and their colors
const orderStatuses = {
  "pending": { label: "รอการชำระเงิน", color: "text-amber-400", bgColor: "bg-amber-400/20", borderColor: "border-amber-400/30" },
  "processing": { label: "กำลังดำเนินการ", color: "text-mali-blue-light", bgColor: "bg-mali-blue-light/20", borderColor: "border-mali-blue-light/30" },
  "completed": { label: "เสร็จสมบูรณ์", color: "text-mali-green", bgColor: "bg-mali-green/20", borderColor: "border-mali-green/30" },
  "cancelled": { label: "ยกเลิก", color: "text-mali-red", bgColor: "bg-mali-red/20", borderColor: "border-mali-red/30" },
};

// Mock order data
const mockOrders = [
  {
    id: "ORD-24601",
    date: "2025-04-20T10:30:00Z",
    status: "processing",
    items: [
      {
        id: "ITEM-1",
        name: "Mobile Legends: 500 Diamonds",
        image: "https://placehold.co/60x60/1E88E5/ffffff?text=ML",
        price: 9.99,
        quantity: 1
      }
    ],
    total: 9.99,
    paymentMethod: "credit_card",
    allowCancel: true,
    allowModify: true
  },
  {
    id: "ORD-24589",
    date: "2025-04-19T15:45:00Z",
    status: "pending",
    items: [
      {
        id: "ITEM-2",
        name: "PUBG Mobile: UC 600",
        image: "https://placehold.co/60x60/005C97/ffffff?text=PUBG",
        price: 12.99,
        quantity: 1
      }
    ],
    total: 12.99,
    paymentMethod: "bank_transfer",
    allowCancel: true,
    allowModify: true
  },
  {
    id: "ORD-24572",
    date: "2025-04-15T08:15:00Z",
    status: "completed",
    items: [
      {
        id: "ITEM-3",
        name: "Steam Gift Card $50",
        image: "https://placehold.co/60x60/000000/ffffff?text=Steam",
        price: 50.00,
        quantity: 1
      },
      {
        id: "ITEM-4",
        name: "Valorant Points: 1000 VP",
        image: "https://placehold.co/60x60/5E35B1/ffffff?text=VP",
        price: 10.00,
        quantity: 2
      }
    ],
    total: 70.00,
    paymentMethod: "paypal",
    allowCancel: false,
    allowModify: false
  },
  {
    id: "ORD-24550",
    date: "2025-04-10T21:20:00Z",
    status: "cancelled",
    items: [
      {
        id: "ITEM-5",
        name: "Free Fire: 1000 Diamonds",
        image: "https://placehold.co/60x60/FF5722/ffffff?text=FF",
        price: 20.00,
        quantity: 1
      }
    ],
    total: 20.00,
    paymentMethod: "credit_card",
    allowCancel: false,
    allowModify: false,
    cancellationReason: "ระบบชำระเงินมีปัญหา"
  }
];

// Define the filter and search options
type FilterStatus = "all" | "pending" | "processing" | "completed" | "cancelled";
type SortOption = "newest" | "oldest" | "high_value" | "low_value";

export default function OrderManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState(mockOrders);
  const [filteredOrders, setFilteredOrders] = useState(mockOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionStatus, setActionStatus] = useState<"idle" | "success" | "error">("idle");
  const [orderToModify, setOrderToModify] = useState<string | null>(null);
  
  // Date formatting helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // If not logged in, redirect to login page
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);
  
  // Apply filters and search
  useEffect(() => {
    let result = [...mockOrders];
    
    // Apply status filter
    if (filterStatus !== "all") {
      result = result.filter(order => order.status === filterStatus);
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        order => 
          order.id.toLowerCase().includes(query) || 
          order.items.some(item => item.name.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    switch (sortOption) {
      case "newest":
        result = result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "oldest":
        result = result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "high_value":
        result = result.sort((a, b) => b.total - a.total);
        break;
      case "low_value":
        result = result.sort((a, b) => a.total - b.total);
        break;
    }
    
    setFilteredOrders(result);
  }, [filterStatus, searchQuery, sortOption]);

  // Handler for order cancellation
  const handleCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
  };

  // Submit cancellation
  const submitCancellation = () => {
    if (!orderToCancel || !cancelReason) return;
    
    setIsCancelling(true);
    
    // Simulate API call
    setTimeout(() => {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderToCancel 
            ? { ...order, status: "cancelled", cancellationReason: cancelReason, allowCancel: false, allowModify: false } 
            : order
        )
      );
      
      // Update filtered orders
      setFilteredOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderToCancel 
            ? { ...order, status: "cancelled", cancellationReason: cancelReason, allowCancel: false, allowModify: false } 
            : order
        )
      );
      
      setActionStatus("success");
      setIsCancelling(false);
      
      // Close cancellation dialog
      setTimeout(() => {
        setOrderToCancel(null);
        setCancelReason("");
        setActionStatus("idle");
      }, 2000);
    }, 1500);
  };

  // Handler for order modification
  const handleModifyOrder = (orderId: string) => {
    setOrderToModify(orderId);
    // In a real app, navigate to a modification form
    router.push(`/orders/${orderId}/edit`);
  };

  // If the user is not loaded yet or not logged in, show loading
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg text-mali-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page header with back navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/account" className="mr-4 text-mali-text-secondary hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">จัดการคำสั่งซื้อ</h1>
            <p className="text-mali-text-secondary">ดูและจัดการคำสั่งซื้อของคุณ</p>
          </div>
        </div>
      </div>

      {/* Action status notification */}
      {actionStatus === "success" && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-mali-green/20 border border-mali-green/30 text-mali-green rounded-md p-3 mb-6 flex items-center"
        >
          <Check className="h-5 w-5 mr-2" />
          คำสั่งซื้อถูกอัปเดตเรียบร้อยแล้ว
        </motion.div>
      )}
      {actionStatus === "error" && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-mali-red/20 border border-mali-red/30 text-mali-red rounded-md p-3 mb-6 flex items-center"
        >
          <AlertCircle className="h-5 w-5 mr-2" />
          เกิดข้อผิดพลาดในการอัปเดตคำสั่งซื้อ โปรดลองอีกครั้ง
        </motion.div>
      )}

      {/* Search and Filter Bar */}
      <div className="glass-card mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-mali-text-secondary" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาจากรหัสคำสั่งซื้อหรือชื่อสินค้า"
                className="bg-mali-navy border border-mali-blue/30 rounded-lg pl-10 pr-3 py-2 w-full text-white focus:outline-none focus:ring-1 focus:ring-mali-blue-accent"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <button 
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="bg-mali-blue/20 border border-mali-blue/30 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  <span>
                    {filterStatus === "all" ? "ทั้งหมด" : orderStatuses[filterStatus as keyof typeof orderStatuses].label}
                  </span>
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isFilterDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {isFilterDropdownOpen && (
                  <div className="absolute z-10 mt-2 w-48 right-0 bg-mali-navy border border-mali-blue/30 rounded-lg shadow-lg py-1">
                    <button 
                      onClick={() => { setFilterStatus("all"); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-mali-blue/10 ${filterStatus === "all" ? 'text-mali-blue-light' : 'text-white'}`}
                    >
                      ทั้งหมด
                    </button>
                    {Object.entries(orderStatuses).map(([key, value]) => (
                      <button 
                        key={key}
                        onClick={() => { setFilterStatus(key as FilterStatus); setIsFilterDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 hover:bg-mali-blue/10 ${filterStatus === key ? 'text-mali-blue-light' : 'text-white'} flex items-center`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full ${value.bgColor} mr-2`}></span>
                        {value.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="bg-mali-blue/20 border border-mali-blue/30 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {sortOption === "newest" ? "ใหม่สุด" : 
                     sortOption === "oldest" ? "เก่าสุด" : 
                     sortOption === "high_value" ? "ราคาสูงสุด" : "ราคาต่ำสุด"}
                  </span>
                  <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isSortDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {isSortDropdownOpen && (
                  <div className="absolute z-10 mt-2 w-48 right-0 bg-mali-navy border border-mali-blue/30 rounded-lg shadow-lg py-1">
                    <button 
                      onClick={() => { setSortOption("newest"); setIsSortDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-mali-blue/10 ${sortOption === "newest" ? 'text-mali-blue-light' : 'text-white'}`}
                    >
                      ใหม่สุด
                    </button>
                    <button 
                      onClick={() => { setSortOption("oldest"); setIsSortDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-mali-blue/10 ${sortOption === "oldest" ? 'text-mali-blue-light' : 'text-white'}`}
                    >
                      เก่าสุด
                    </button>
                    <button 
                      onClick={() => { setSortOption("high_value"); setIsSortDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-mali-blue/10 ${sortOption === "high_value" ? 'text-mali-blue-light' : 'text-white'}`}
                    >
                      ราคาสูงสุด
                    </button>
                    <button 
                      onClick={() => { setSortOption("low_value"); setIsSortDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 hover:bg-mali-blue/10 ${sortOption === "low_value" ? 'text-mali-blue-light' : 'text-white'}`}
                    >
                      ราคาต่ำสุด
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <motion.div 
              key={order.id}
              className="glass-card overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="border-b border-mali-blue/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-lg font-semibold text-white">{order.id}</span>
                  <span className="text-sm text-mali-text-secondary">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {formatDate(order.date)}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${orderStatuses[order.status as keyof typeof orderStatuses].bgColor} ${orderStatuses[order.status as keyof typeof orderStatuses].color}`}>
                    {orderStatuses[order.status as keyof typeof orderStatuses].label}
                  </span>
                </div>
                
                <div className="mt-3 sm:mt-0">
                  <Link href={`/orders/${order.id}`}>
                    <button className="bg-mali-blue/20 hover:bg-mali-blue/30 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
                      รายละเอียด
                    </button>
                  </Link>
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-4 space-y-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md overflow-hidden relative mr-3">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-white">{item.name}</h4>
                          <p className="text-mali-text-secondary text-sm">จำนวน: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="text-white">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-mali-blue/20 pt-4 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-mali-text-secondary">ยอดรวม:</span>
                    <span className="text-white font-bold text-lg ml-2">${order.total.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {order.allowModify && (
                      <button
                        onClick={() => handleModifyOrder(order.id)}
                        className="bg-mali-blue-light/20 hover:bg-mali-blue-light/30 text-mali-blue-light text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        แก้ไข
                      </button>
                    )}
                    
                    {order.allowCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="bg-mali-red/20 hover:bg-mali-red/30 text-mali-red text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center"
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        ยกเลิก
                      </button>
                    )}
                  </div>
                </div>
                
                {order.status === "cancelled" && order.cancellationReason && (
                  <div className="mt-4 text-sm text-mali-text-secondary">
                    <span className="font-medium">เหตุผลที่ยกเลิก:</span>
                    <span className="ml-2">{order.cancellationReason}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="glass-card p-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-mali-blue/20 mb-4">
              <ShoppingCart className="h-8 w-8 text-mali-blue-light" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">ไม่พบคำสั่งซื้อ</h3>
            <p className="text-mali-text-secondary max-w-md mx-auto mb-6">
              {searchQuery || filterStatus !== "all"
                ? "ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไขการค้นหา โปรดลองเปลี่ยนตัวกรองหรือคำค้นหา"
                : "คุณยังไม่มีคำสั่งซื้อ เริ่มต้นด้วยการซื้อเครดิตเกมหรือบัตรของขวัญ"}
            </p>
            
            {(searchQuery || filterStatus !== "all") ? (
              <button 
                onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}
                className="btn-primary"
              >
                ล้างการค้นหา
              </button>
            ) : (
              <Link href="/games">
                <button className="btn-primary">
                  เริ่มเลือกซื้อ
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
      
      {/* Order Cancellation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-mali-dark/80">
          <motion.div 
            className="bg-mali-navy border border-mali-blue/30 rounded-xl max-w-md w-full p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">ยืนยันการยกเลิกคำสั่งซื้อ</h3>
              <button 
                onClick={() => setOrderToCancel(null)}
                className="text-mali-text-secondary hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-mali-text-secondary mb-4">
              คุณกำลังจะยกเลิกคำสั่งซื้อ {orderToCancel}. การดำเนินการนี้ไม่สามารถย้อนกลับได้.
            </p>
            
            <div className="mb-4">
              <label className="block text-mali-text-secondary mb-2">เหตุผลในการยกเลิก</label>
              <select 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-mali-dark border border-mali-blue/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-mali-blue-accent"
              >
                <option value="">เลือกเหตุผล</option>
                <option value="เปลี่ยนใจ">เปลี่ยนใจ</option>
                <option value="พบสินค้าที่ถูกกว่า">พบสินค้าที่ถูกกว่า</option>
                <option value="ระบบชำระเงินมีปัญหา">ระบบชำระเงินมีปัญหา</option>
                <option value="สั่งซื้อผิด">สั่งซื้อผิด</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
              
              {cancelReason === "อื่นๆ" && (
                <textarea 
                  placeholder="ระบุเหตุผล..."
                  className="w-full mt-2 bg-mali-dark border border-mali-blue/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-mali-blue-accent"
                  rows={3}
                ></textarea>
              )}
            </div>
            
            <div className="flex justify-between gap-4">
              <button 
                onClick={() => setOrderToCancel(null)} 
                className="flex-1 bg-mali-navy border border-mali-blue/30 hover:bg-mali-blue/10 text-white py-2 rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                onClick={submitCancellation}
                disabled={!cancelReason || isCancelling}
                className={`flex-1 bg-mali-red text-white py-2 rounded-lg flex items-center justify-center ${(!cancelReason || isCancelling) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-mali-red/90'}`}
              >
                {isCancelling ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังดำเนินการ
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" />
                    ยืนยันการยกเลิก
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Pagination (if needed) */}
      {filteredOrders.length > 0 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center gap-1">
            <button className="bg-mali-navy hover:bg-mali-blue/10 text-mali-text-secondary p-2 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="bg-mali-blue/20 text-white w-8 h-8 rounded-lg">1</button>
            <button className="bg-mali-navy hover:bg-mali-blue/10 text-mali-text-secondary w-8 h-8 rounded-lg transition-colors">2</button>
            <button className="bg-mali-navy hover:bg-mali-blue/10 text-mali-text-secondary p-2 rounded-lg transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
} 
