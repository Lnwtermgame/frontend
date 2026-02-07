"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Send,
  X,
  Loader2,
  RefreshCcw,
  Tag,
  FileText,
  User,
} from "lucide-react";

// Types
interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_USER" | "WAITING_ADMIN" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  createdAt: string;
  user?: { username?: string; email?: string };
}

interface TicketDetail extends Ticket {
  description: string;
  orderId?: string;
  messages: Array<{
    id: string;
    content: string;
    sender: "user" | "admin" | "system";
    senderName?: string;
    createdAt: string;
  }>;
}

const categoryLabels: Record<string, string> = {
  ORDER_ISSUE: "ปัญหาคำสั่งซื้อ",
  PAYMENT_ISSUE: "ปัญหาการชำระเงิน",
  PRODUCT_ISSUE: "ปัญหาสินค้า",
  ACCOUNT_ISSUE: "ปัญหาบัญชี",
  TECHNICAL_SUPPORT: "สนับสนุนทางเทคนิค",
  REFUND_REQUEST: "ขอคืนเงิน",
  GENERAL_INQUIRY: "สอบถามทั่วไป",
};

const statusLabels: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  OPEN: {
    label: "เปิด",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-500",
  },
  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-500",
  },
  WAITING_USER: {
    label: "รอลูกค้า",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-500",
  },
  WAITING_ADMIN: {
    label: "รอแอดมิน",
    color: "text-cyan-700",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-500",
  },
  RESOLVED: {
    label: "แก้ไขแล้ว",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-500",
  },
  CLOSED: {
    label: "ปิด",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-500",
  },
};

const priorityLabels: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> =
  {
    LOW: { label: "ต่ำ", color: "text-gray-700", bgColor: "bg-gray-100", borderColor: "border-gray-500" },
    MEDIUM: { label: "ปานกลาง", color: "text-blue-700", bgColor: "bg-blue-100", borderColor: "border-blue-500" },
    HIGH: { label: "สูง", color: "text-orange-700", bgColor: "bg-orange-100", borderColor: "border-orange-500" },
    URGENT: { label: "เร่งด่วน", color: "text-red-700", bgColor: "bg-red-100", borderColor: "border-red-500" },
  };

// Mock data for tickets
const mockTickets: Ticket[] = [
  {
    id: "1",
    ticketNumber: "TKT-001",
    subject: "ไม่ได้รับสินค้า",
    category: "ORDER_ISSUE",
    status: "OPEN",
    priority: "HIGH",
    createdAt: new Date().toISOString(),
    user: { username: "customer1", email: "customer1@example.com" },
  },
  {
    id: "2",
    ticketNumber: "TKT-002",
    subject: "ขอคืนเงิน",
    category: "REFUND_REQUEST",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    createdAt: new Date().toISOString(),
    user: { username: "customer2", email: "customer2@example.com" },
  },
];

const mockTicketDetail: TicketDetail = {
  id: "1",
  ticketNumber: "TKT-001",
  subject: "ไม่ได้รับสินค้า",
  description: "ฉันสั่งซื้อ PUBG Mobile UC แต่ยังไม่ได้รับสินค้า",
  category: "ORDER_ISSUE",
  status: "OPEN",
  priority: "HIGH",
  createdAt: new Date().toISOString(),
  orderId: "ORD-12345",
  user: { username: "customer1", email: "customer1@example.com" },
  messages: [],
};

const mockStats = {
  total: 50,
  open: 10,
  inProgress: 15,
  waitingUser: 8,
  waitingAdmin: 5,
  resolved: 10,
  closed: 2,
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [stats, setStats] = useState(mockStats);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Reply state
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === "ALL" || ticket.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const loadTicketDetail = async (ticketId: string) => {
    setIsDetailLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSelectedTicket(mockTicketDetail);
    setIsDetailLoading(false);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setIsSendingReply(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setReplyMessage("");
    setIsSendingReply(false);
  };

  const handleUpdateStatus = async (
    status: string,
    priority?: string
  ) => {
    if (!selectedTicket) return;

    setIsUpdatingStatus(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsUpdatingStatus(false);
  };

  return (
    <AdminLayout title="ตั๋วสนับสนุน">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center">
          <span className="w-1.5 h-6 bg-brutal-purple mr-2"></span>
          <h1 className="text-2xl font-bold text-black">จัดการตั๋วสนับสนุน</h1>
        </div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
        >
          {[
            { label: "ทั้งหมด", value: stats.total, color: "bg-gray-100 text-gray-700 border-gray-500" },
            { label: "เปิด", value: stats.open, color: "bg-blue-100 text-blue-700 border-blue-500" },
            { label: "กำลังดำเนินการ", value: stats.inProgress, color: "bg-amber-100 text-amber-700 border-amber-500" },
            { label: "รอลูกค้า", value: stats.waitingUser, color: "bg-purple-100 text-purple-700 border-purple-500" },
            { label: "รอแอดมิน", value: stats.waitingAdmin, color: "bg-cyan-100 text-cyan-700 border-cyan-500" },
            { label: "แก้ไขแล้ว", value: stats.resolved, color: "bg-green-100 text-green-700 border-green-500" },
            { label: "ปิด", value: stats.closed, color: "bg-gray-100 text-gray-700 border-gray-500" },
          ].map((stat, index) => (
            <div
              key={index}
              className={`rounded-xl p-4 text-center border-[3px] ${stat.color}`}
              style={{ boxShadow: '4px 4px 0 0 #000000' }}
            >
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border-[3px] border-red-500 rounded-lg p-4 flex items-center"
          >
            <AlertCircle className="text-red-600 mr-3" size={20} />
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket List */}
          <div className="lg:col-span-1">
            <div className="bg-white border-[3px] border-black rounded-xl overflow-hidden"
              style={{ boxShadow: '4px 4px 0 0 #000000' }}>
              {/* Search & Filters */}
              <div className="p-4 border-b-[2px] border-gray-200 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="ค้นหาตั๋ว..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 pl-10 pr-4 bg-white border-[2px] border-gray-300 rounded-lg text-black text-sm placeholder-gray-400 focus:outline-none focus:border-black"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                  className="w-full py-2 px-3 bg-white border-[2px] border-gray-300 rounded-lg text-black text-sm focus:outline-none focus:border-black"
                >
                  <option value="ALL">ทุกสถานะ</option>
                  {Object.entries(statusLabels).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value)
                  }
                  className="w-full py-2 px-3 bg-white border-[2px] border-gray-300 rounded-lg text-black text-sm focus:outline-none focus:border-black"
                >
                  <option value="ALL">ทุกความสำคัญ</option>
                  {Object.entries(priorityLabels).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value)
                  }
                  className="w-full py-2 px-3 bg-white border-[2px] border-gray-300 rounded-lg text-black text-sm focus:outline-none focus:border-black"
                >
                  <option value="ALL">ทุกหมวดหมู่</option>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                {/* Refresh Button */}
                <button
                  className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 border-[2px] border-gray-300 rounded-lg text-black text-sm flex items-center justify-center transition-colors"
                >
                  <RefreshCcw size={14} className="mr-2" />
                  รีเฟรช
                </button>
              </div>

              {/* Ticket List */}
              <div className="max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <Loader2
                      className="animate-spin mx-auto text-brutal-purple mb-3"
                      size={32}
                    />
                    <p className="text-gray-600">กำลังโหลดตั๋ว...</p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText
                      className="mx-auto text-gray-300 mb-3"
                      size={48}
                    />
                    <p className="text-gray-600">ไม่พบตั๋ว</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => loadTicketDetail(ticket.id)}
                      className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        selectedTicket?.id === ticket.id
                          ? "bg-gray-100 border-l-4 border-l-brutal-purple"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {ticket.ticketNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border-[2px] ${statusLabels[ticket.status].bgColor} ${statusLabels[ticket.status].color} ${statusLabels[ticket.status].borderColor}`}
                        >
                          {statusLabels[ticket.status].label}
                        </span>
                      </div>
                      <h4 className="text-black font-medium text-sm mb-1 line-clamp-1">
                        {ticket.subject}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                        <span>{categoryLabels[ticket.category]}</span>
                        <span>•</span>
                        <span className={`${priorityLabels[ticket.priority].color} font-medium`}>
                          {priorityLabels[ticket.priority].label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          {ticket.user?.username || ticket.user?.email || "Unknown"}
                        </span>
                        <span className="text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Ticket Detail */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border-[3px] border-black rounded-xl overflow-hidden h-full flex flex-col"
                style={{ boxShadow: '4px 4px 0 0 #000000' }}
              >
                {isDetailLoading ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <Loader2
                      className="animate-spin text-brutal-purple"
                      size={32}
                    />
                  </div>
                ) : (
                  <>
                    {/* Ticket Header */}
                    <div className="p-6 border-b-[2px] border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-500">
                              {selectedTicket.ticketNumber}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border-[2px] ${statusLabels[selectedTicket.status].bgColor} ${statusLabels[selectedTicket.status].color} ${statusLabels[selectedTicket.status].borderColor}`}
                            >
                              {statusLabels[selectedTicket.status].label}
                            </span>
                          </div>
                          <h2 className="text-xl font-bold text-black">
                            {selectedTicket.subject}
                          </h2>
                        </div>
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors border-[2px] border-transparent hover:border-gray-300"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-600">
                            <User size={14} className="mr-2" />
                            <span>
                              {selectedTicket.user?.username ||
                                selectedTicket.user?.email ||
                                "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Tag size={14} className="mr-2" />
                            <span>
                              {categoryLabels[selectedTicket.category]}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-600">
                            <Clock size={14} className="mr-2" />
                            <span>
                              สร้าง:{" "}
                              {new Date(
                                selectedTicket.createdAt
                              ).toLocaleString()}
                            </span>
                          </div>
                          {selectedTicket.orderId && (
                            <div className="flex items-center">
                              <FileText size={14} className="mr-2" />
                              <span className="text-brutal-purple font-medium">
                                คำสั่งซื้อ: {selectedTicket.orderId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status & Priority Controls */}
                      <div className="mt-4 pt-4 border-t-[2px] border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1 font-medium">
                            อัปเดตสถานะ
                          </label>
                          <select
                            value={selectedTicket.status}
                            onChange={(e) =>
                              handleUpdateStatus(e.target.value)
                            }
                            disabled={isUpdatingStatus}
                            className="w-full py-2 px-3 bg-white border-[2px] border-gray-300 rounded-lg text-black text-sm focus:outline-none focus:border-black disabled:opacity-50"
                          >
                            {Object.entries(statusLabels).map(
                              ([value, { label }]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1 font-medium">
                            ความสำคัญ
                          </label>
                          <select
                            value={selectedTicket.priority}
                            onChange={(e) =>
                              handleUpdateStatus(
                                selectedTicket.status,
                                e.target.value
                              )
                            }
                            disabled={isUpdatingStatus}
                            className="w-full py-2 px-3 bg-white border-[2px] border-gray-300 rounded-lg text-black text-sm focus:outline-none focus:border-black disabled:opacity-50"
                          >
                            {Object.entries(priorityLabels).map(
                              ([value, { label }]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-6 overflow-y-auto max-h-[500px] space-y-4 bg-gray-50">
                      {/* Initial Message */}
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-brutal-purple flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-black font-medium text-sm">
                              {selectedTicket.user?.username || "User"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(
                                selectedTicket.createdAt
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-white border-[2px] border-gray-300 rounded-lg p-3 text-gray-700">
                            {selectedTicket.description}
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {selectedTicket.messages.map((message) => (
                        <div key={message.id} className="flex gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.sender === "admin"
                                ? "bg-green-500"
                                : message.sender === "system"
                                ? "bg-gray-500"
                                : "bg-brutal-purple"
                            }`}
                          >
                            {message.sender === "admin" ? (
                              <span className="text-white text-xs font-bold">
                                A
                              </span>
                            ) : message.sender === "system" ? (
                              <span className="text-white text-xs">@</span>
                            ) : (
                              <User size={16} className="text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-black font-medium text-sm">
                                {message.sender === "admin"
                                  ? "Admin"
                                  : message.sender === "system"
                                  ? "System"
                                  : selectedTicket.user?.username || "User"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div
                              className={`rounded-lg p-3 border-[2px] ${
                                message.sender === "admin"
                                  ? "bg-green-100 border-green-500 text-green-800"
                                  : message.sender === "system"
                                  ? "bg-gray-100 border-gray-500 text-gray-800"
                                  : "bg-white border-gray-300 text-gray-700"
                              }`}
                            >
                              {message.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    {!["CLOSED", "RESOLVED"].includes(
                      selectedTicket.status
                    ) && (
                      <div className="p-4 border-t-[2px] border-gray-200 bg-white">
                        <form onSubmit={handleSendReply} className="flex gap-3">
                          <input
                            type="text"
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="พิมพ์ข้อความตอบกลับ..."
                            className="flex-1 py-2 px-4 bg-white border-[2px] border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black"
                          />
                          <button
                            type="submit"
                            disabled={isSendingReply || !replyMessage.trim()}
                            className="bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center border-[3px] border-black"
                            style={{ boxShadow: '4px 4px 0 0 #000000' }}
                          >
                            {isSendingReply ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <>
                                <Send size={18} className="mr-2" />
                                ส่ง
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <div className="bg-white border-[3px] border-black rounded-xl p-12 text-center h-full flex flex-col items-center justify-center"
                style={{ boxShadow: '4px 4px 0 0 #000000' }}>
                <MessageSquare
                  className="text-gray-300 mb-4"
                  size={64}
                />
                <h3 className="text-xl font-bold text-black mb-2">
                  เลือกตั๋ว
                </h3>
                <p className="text-gray-600 max-w-sm">
                  เลือกตั๋วจากรายการเพื่อดูรายละเอียดและตอบกลับลูกค้า
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
