"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  supportApi,
  Ticket,
  TicketDetail,
  TicketReplyData,
  TicketCategory,
  TicketStatus,
  TicketPriority,
  TicketStats,
} from "@/lib/services";
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
  BarChart3,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const categoryLabels: Record<TicketCategory, string> = {
  ORDER_ISSUE: "Order Issue",
  PAYMENT_ISSUE: "Payment Issue",
  PRODUCT_ISSUE: "Product Issue",
  ACCOUNT_ISSUE: "Account Issue",
  TECHNICAL_SUPPORT: "Technical Support",
  REFUND_REQUEST: "Refund Request",
  GENERAL_INQUIRY: "General Inquiry",
};

const statusLabels: Record<
  TicketStatus,
  { label: string; color: string; bgColor: string }
> = {
  OPEN: {
    label: "Open",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20 border-blue-500/30",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20 border-amber-500/30",
  },
  WAITING_USER: {
    label: "Waiting User",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20 border-purple-500/30",
  },
  WAITING_ADMIN: {
    label: "Waiting Admin",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20 border-cyan-500/30",
  },
  RESOLVED: {
    label: "Resolved",
    color: "text-green-400",
    bgColor: "bg-green-500/20 border-green-500/30",
  },
  CLOSED: {
    label: "Closed",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20 border-gray-500/30",
  },
};

const priorityLabels: Record<TicketPriority, { label: string; color: string }> =
  {
    LOW: { label: "Low", color: "text-gray-400" },
    MEDIUM: { label: "Medium", color: "text-blue-400" },
    HIGH: { label: "High", color: "text-orange-400" },
    URGENT: { label: "Urgent", color: "text-red-400" },
  };

export default function AdminTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(
    null
  );
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">(
    "ALL"
  );
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "ALL">(
    "ALL"
  );
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "ALL">(
    "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Reply state
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Stats visibility
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const loadTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await supportApi.getAllTickets(1, 50, {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        priority: priorityFilter === "ALL" ? undefined : priorityFilter,
        category: categoryFilter === "ALL" ? undefined : categoryFilter,
      });
      if (response.success) {
        setTickets(response.data);
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await supportApi.getTicketStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const loadTicketDetail = async (ticketId: string) => {
    setIsDetailLoading(true);
    try {
      const response = await supportApi.getTicketDetail(ticketId);
      if (response.success) {
        setSelectedTicket(response.data);
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setIsSendingReply(true);
    try {
      const response = await supportApi.addReply(selectedTicket.id, {
        content: replyMessage,
      });
      if (response.success) {
        setReplyMessage("");
        loadTicketDetail(selectedTicket.id);
        loadTickets();
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateStatus = async (
    status: TicketStatus,
    priority?: TicketPriority
  ) => {
    if (!selectedTicket) return;

    setIsUpdatingStatus(true);
    try {
      const updateData: { status?: TicketStatus; priority?: TicketPriority } =
        {};
      if (status) updateData.status = status;
      if (priority) updateData.priority = priority;

      const response = await supportApi.updateTicket(
        selectedTicket.id,
        updateData
      );
      if (response.success) {
        loadTicketDetail(selectedTicket.id);
        loadTickets();
        loadStats();
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="ตั๋วสนับสนุน">
      <div className="space-y-6">
        {/* Stats Cards */}
        {showStats && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
          >
            {[
              { label: "ทั้งหมด", value: stats.total, color: "text-white" },
              { label: "เปิด", value: stats.open, color: "text-blue-400" },
              {
                label: "กำลังดำเนินการ",
                value: stats.inProgress,
                color: "text-amber-400",
              },
              {
                label: "รอลูกค้า",
                value: stats.waitingUser,
                color: "text-purple-400",
              },
              {
                label: "รอแอดมิน",
                value: stats.waitingAdmin,
                color: "text-cyan-400",
              },
              {
                label: "แก้ไขแล้ว",
                value: stats.resolved,
                color: "text-green-400",
              },
              { label: "ปิด", value: stats.closed, color: "text-gray-400" },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-mali-card border border-mali-blue/20 rounded-xl p-4 text-center"
              >
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-mali-text-secondary mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center"
          >
            <AlertCircle className="text-red-400 mr-3" size={20} />
            <span className="text-red-200">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket List */}
          <div className="lg:col-span-1">
            <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
              {/* Search & Filters */}
              <div className="p-4 border-b border-mali-blue/20 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mali-text-secondary"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="ค้นหาตั๋ว..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 pl-10 pr-4 bg-mali-blue/10 border border-mali-blue/30 rounded-lg text-white text-sm placeholder-mali-text-secondary focus:outline-none focus:border-mali-blue-accent"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as TicketStatus | "ALL")
                  }
                  className="w-full py-2 px-3 bg-mali-blue/10 border border-mali-blue/30 rounded-lg text-white text-sm focus:outline-none focus:border-mali-blue-accent"
                >
                  <option value="ALL" className="bg-mali-card">
                    ทุกสถานะ
                  </option>
                  {Object.entries(statusLabels).map(([value, { label }]) => (
                    <option key={value} value={value} className="bg-mali-card">
                      {label}
                    </option>
                  ))}
                </select>

                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value as TicketPriority | "ALL")
                  }
                  className="w-full py-2 px-3 bg-mali-blue/10 border border-mali-blue/30 rounded-lg text-white text-sm focus:outline-none focus:border-mali-blue-accent"
                >
                  <option value="ALL" className="bg-mali-card">
                    ทุกความสำคัญ
                  </option>
                  {Object.entries(priorityLabels).map(([value, { label }]) => (
                    <option key={value} value={value} className="bg-mali-card">
                      {label}
                    </option>
                  ))}
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as TicketCategory | "ALL")
                  }
                  className="w-full py-2 px-3 bg-mali-blue/10 border border-mali-blue/30 rounded-lg text-white text-sm focus:outline-none focus:border-mali-blue-accent"
                >
                  <option value="ALL" className="bg-mali-card">
                    ทุกหมวดหมู่
                  </option>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value} className="bg-mali-card">
                      {label}
                    </option>
                  ))}
                </select>

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    loadTickets();
                    loadStats();
                  }}
                  className="w-full py-2 px-3 bg-mali-blue/20 hover:bg-mali-blue/30 border border-mali-blue/30 rounded-lg text-mali-text-secondary text-sm flex items-center justify-center transition-colors"
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
                      className="animate-spin mx-auto text-mali-blue-accent mb-3"
                      size={32}
                    />
                    <p className="text-mali-text-secondary">
                      กำลังโหลดตั๋ว...
                    </p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText
                      className="mx-auto text-mali-text-secondary/50 mb-3"
                      size={48}
                    />
                    <p className="text-mali-text-secondary">ไม่พบตั๋ว</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => loadTicketDetail(ticket.id)}
                      className={`w-full text-left p-4 border-b border-mali-blue/10 hover:bg-mali-blue/5 transition-colors ${
                        selectedTicket?.id === ticket.id
                          ? "bg-mali-blue/10 border-l-4 border-l-mali-blue-accent"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-mali-text-secondary">
                          {ticket.ticketNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${statusLabels[ticket.status].bgColor} ${statusLabels[ticket.status].color}`}
                        >
                          {statusLabels[ticket.status].label}
                        </span>
                      </div>
                      <h4 className="text-white font-medium text-sm mb-1 line-clamp-1">
                        {ticket.subject}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-mali-text-secondary mb-2">
                        <span>{categoryLabels[ticket.category]}</span>
                        <span>•</span>
                        <span className={priorityLabels[ticket.priority].color}>
                          {priorityLabels[ticket.priority].label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-mali-text-secondary">
                          {ticket.user?.username || ticket.user?.email ||
                            "Unknown"}
                        </span>
                        <span className="text-mali-text-secondary">
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
                className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden h-full flex flex-col"
              >
                {isDetailLoading ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <Loader2
                      className="animate-spin text-mali-blue-accent"
                      size={32}
                    />
                  </div>
                ) : (
                  <>
                    {/* Ticket Header */}
                    <div className="p-6 border-b border-mali-blue/20">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-mali-text-secondary">
                              {selectedTicket.ticketNumber}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border ${statusLabels[selectedTicket.status].bgColor} ${statusLabels[selectedTicket.status].color}`}
                            >
                              {statusLabels[selectedTicket.status].label}
                            </span>
                          </div>
                          <h2 className="text-xl font-bold text-white">
                            {selectedTicket.subject}
                          </h2>
                        </div>
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className="p-2 text-mali-text-secondary hover:text-white hover:bg-mali-blue/20 rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center text-mali-text-secondary">
                            <User size={14} className="mr-2" />
                            <span>
                              {selectedTicket.user?.username ||
                                selectedTicket.user?.email ||
                                "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center text-mali-text-secondary">
                            <Tag size={14} className="mr-2" />
                            <span>
                              {categoryLabels[selectedTicket.category]}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-mali-text-secondary">
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
                              <span className="text-mali-blue-accent">
                                Order: {selectedTicket.orderId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status & Priority Controls */}
                      <div className="mt-4 pt-4 border-t border-mali-blue/20 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-mali-text-secondary mb-1">
                            อัปเดตสถานะ
                          </label>
                          <select
                            value={selectedTicket.status}
                            onChange={(e) =>
                              handleUpdateStatus(e.target.value as TicketStatus)
                            }
                            disabled={isUpdatingStatus}
                            className="w-full py-2 px-3 bg-mali-blue/10 border border-mali-blue/30 rounded-lg text-white text-sm focus:outline-none focus:border-mali-blue-accent disabled:opacity-50"
                          >
                            {Object.entries(statusLabels).map(
                              ([value, { label }]) => (
                                <option
                                  key={value}
                                  value={value}
                                  className="bg-mali-card"
                                >
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-mali-text-secondary mb-1">
                            ความสำคัญ
                          </label>
                          <select
                            value={selectedTicket.priority}
                            onChange={(e) =>
                              handleUpdateStatus(
                                selectedTicket.status,
                                e.target.value as TicketPriority
                              )
                            }
                            disabled={isUpdatingStatus}
                            className="w-full py-2 px-3 bg-mali-blue/10 border border-mali-blue/30 rounded-lg text-white text-sm focus:outline-none focus:border-mali-blue-accent disabled:opacity-50"
                          >
                            {Object.entries(priorityLabels).map(
                              ([value, { label }]) => (
                                <option
                                  key={value}
                                  value={value}
                                  className="bg-mali-card"
                                >
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-6 overflow-y-auto max-h-[500px] space-y-4">
                      {/* Initial Message */}
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-mali-blue/20 flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-mali-blue-accent" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium text-sm">
                              {selectedTicket.user?.username ||
                                selectedTicket.user?.email ||
                                "User"}
                            </span>
                            <span className="text-xs text-mali-text-secondary">
                              {new Date(
                                selectedTicket.createdAt
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-mali-blue/10 rounded-lg p-3 text-mali-text-secondary">
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
                                ? "bg-green-500/20"
                                : message.sender === "system"
                                ? "bg-gray-500/20"
                                : "bg-mali-blue/20"
                            }`}
                          >
                            {message.sender === "admin" ? (
                              <span className="text-green-400 text-xs font-bold">
                                A
                              </span>
                            ) : message.sender === "system" ? (
                              <span className="text-gray-400 text-xs">@</span>
                            ) : (
                              <User
                                size={16}
                                className="text-mali-blue-accent"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium text-sm">
                                {message.sender === "admin"
                                  ? message.senderName || "Admin"
                                  : message.sender === "system"
                                  ? "System"
                                  : selectedTicket.user?.username || "User"}
                              </span>
                              <span className="text-xs text-mali-text-secondary">
                                {new Date(message.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div
                              className={`rounded-lg p-3 ${
                                message.sender === "admin"
                                  ? "bg-green-500/10 text-green-100"
                                  : message.sender === "system"
                                  ? "bg-gray-500/10 text-gray-300"
                                  : "bg-mali-blue/10 text-mali-text-secondary"
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
                      <div className="p-4 border-t border-mali-blue/20">
                        <form onSubmit={handleSendReply} className="flex gap-3">
                          <input
                            type="text"
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="พิมพ์ข้อความตอบกลับ..."
                            className="flex-1 py-2 px-4 bg-mali-blue/10 border border-mali-blue/30 rounded-lg text-white placeholder-mali-text-secondary focus:outline-none focus:border-mali-blue-accent"
                          />
                          <button
                            type="submit"
                            disabled={isSendingReply || !replyMessage.trim()}
                            className="bg-mali-blue hover:bg-mali-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center"
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
              <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-12 text-center h-full flex flex-col items-center justify-center">
                <MessageSquare
                  className="text-mali-text-secondary/30 mb-4"
                  size={64}
                />
                <h3 className="text-xl font-bold text-white mb-2">
                  เลือกตั๋ว
                </h3>
                <p className="text-mali-text-secondary max-w-sm">
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
