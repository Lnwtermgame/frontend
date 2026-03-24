"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  supportApi,
  Ticket,
  TicketDetail,
  CreateTicketData,
  TicketCategory,
  TicketStatus,
} from "@/lib/services";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePublicSettings } from "@/lib/context/public-settings-context";
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Send,
  X,
  Loader2,
  RefreshCcw,
  Tag,
  FileText,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function TicketsPage() {
  const t = useTranslations("SupportTickets");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { settings: publicSettings } = usePublicSettings();
  const supportTicketsEnabled =
    publicSettings?.features.enableSupportTickets ?? true;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");

  const categoryLabels: Record<TicketCategory, string> = {
    ORDER_ISSUE: t("create.categories.order"),
    PAYMENT_ISSUE: t("create.categories.payment"),
    PRODUCT_ISSUE: t("create.categories.product"),
    ACCOUNT_ISSUE: t("create.categories.account"),
    TECHNICAL_SUPPORT: t("create.categories.technical"),
    REFUND_REQUEST: t("create.categories.refund"),
    GENERAL_INQUIRY: t("create.categories.general"),
  };

  const statusLabels: Record<TicketStatus, { label: string; color: string }> = {
    OPEN: {
      label: t("status.open"),
      color: "bg-site-accent border-black text-white",
    },
    IN_PROGRESS: {
      label: t("status.pending"),
      color: "bg-yellow-500 border-black text-white",
    },
    WAITING_USER: {
      label: t("status.waiting_user"),
      color: "bg-pink-500 border-black text-white",
    },
    WAITING_ADMIN: {
      label: t("status.waiting_admin"),
      color: "bg-site-accent border-black text-white",
    },
    RESOLVED: {
      label: t("status.resolved"),
      color: "bg-green-500 border-black text-white",
    },
    CLOSED: {
      label: t("status.closed"),
      color: "bg-gray-300 border-black text-white",
    },
  };

  // New ticket form state
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState<CreateTicketData>({
    category: "GENERAL_INQUIRY",
    subject: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply state
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  useEffect(() => {
    if (!supportTicketsEnabled) return;
    // Wait for auth to initialize before checking authentication
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=/support/tickets");
      return;
    }
    loadTickets();
  }, [isInitialized, isAuthenticated, statusFilter, supportTicketsEnabled]);

  const loadTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await supportApi.getUserTickets(
        1,
        50,
        statusFilter === "ALL" ? undefined : statusFilter,
      );
      if (response.success) {
        setTickets(response.data);
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsLoading(false);
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.description.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await supportApi.createTicket(newTicket);
      if (response.success) {
        setShowNewTicketModal(false);
        setNewTicket({
          category: "GENERAL_INQUIRY",
          subject: "",
          description: "",
        });
        loadTickets();
        // Open the newly created ticket
        loadTicketDetail(response.data.id);
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
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
        // Reload ticket detail to show new message
        loadTicketDetail(selectedTicket.id);
      }
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      await supportApi.closeTicket(selectedTicket.id);
      loadTicketDetail(selectedTicket.id);
      loadTickets();
    } catch (err) {
      setError(supportApi.getErrorMessage(err));
    }
  };

  const filteredTickets = tickets;

  if (!supportTicketsEnabled) {
    return (
      <div className="page-container bg-transparent">
        <div
          className="mx-auto max-w-2xl border border-site-border rounded-[12px] bg-[#1A1C20] p-8 text-center"
          
        >
          <h1 className="text-2xl font-black text-white">
            {t("disabled.title")}
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            {t("disabled.description")}
          </p>
          <div className="mt-6">
            <Link
              href="/support/contact"
              className="inline-flex border border-site-border rounded-[12px] bg-yellow-500 px-4 py-2 font-bold text-white"
            >
              {t("disabled.cta")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-transparent">
      {/* Header */}
      <motion.div
        className="bg-[#1A1C20] border border-site-border rounded-[16px] p-6 md:p-8 mb-8"
        
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center mb-2">
              <Link
                href="/support"
                className="text-gray-600 hover:text-white mr-4 flex items-center font-medium"
              >
                <ArrowLeft size={18} className="mr-1" />
                {t("back")}
              </Link>
              <div className="bg-site-accent p-2 border border-site-border rounded-[12px] mr-3">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black uppercase text-white">
                {t("title")}
              </h1>
            </div>
            <p className="text-gray-600 font-bold uppercase text-xs">{t("subtitle")}</p>
          </div>
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="bg-black text-white border border-site-border rounded-[12px] px-6 py-3 font-black flex items-center justify-center hover:bg-gray-800 transition-colors uppercase text-xs"
            
          >
            <Plus size={18} className="mr-2" />
            {t("create_new")}
          </button>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-pink-500 border border-site-border rounded-[12px] p-4 mb-6 flex items-center"
          
        >
          <AlertCircle className="text-white mr-3" size={20} />
          <span className="text-white">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-white hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1">
          <div
            className="bg-[#1A1C20] border border-site-border rounded-[16px] overflow-hidden"
            
          >
            {/* Filter Tabs */}
            <div className="p-4 border-b-[3px] border-black">
              <div className="flex flex-wrap gap-2">
                {[
                  "ALL",
                  "OPEN",
                  "IN_PROGRESS",
                  "WAITING_USER",
                  "RESOLVED",
                  "CLOSED",
                ].map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      setStatusFilter(status as TicketStatus | "ALL")
                    }
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border transition-colors ${statusFilter === status
                      ? "bg-black text-white border-black"
                      : "bg-[#1A1C20] text-gray-700 border-black hover:bg-[#2A2C30]"
                      }`}
                  >
                    {status === "ALL"
                      ? t("status.all")
                      : statusLabels[status as TicketStatus].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket List */}
            <div className="max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2
                    className="animate-spin mx-auto text-white mb-3"
                    size={32}
                  />
                  <p className="text-gray-600">{tCommon("loading")}</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-600 mb-2">{t("no_tickets")}</p>
                  <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="text-white hover:underline font-medium"
                  >
                    {t("create_new")}
                  </button>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => loadTicketDetail(ticket.id)}
                    className={`w-full text-left p-4 border-b-[2px] border-black hover:bg-[#2A2C30] transition-colors ${selectedTicket?.id === ticket.id
                      ? "bg-yellow-500 border-l-4 border-l-black"
                      : ""
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-gray-600 font-black uppercase">
                        {ticket.ticketNumber}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase shadow-sm ${statusLabels[ticket.status].color}`}
                      >
                        {statusLabels[ticket.status].label}
                      </span>
                    </div>
                    <h4 className="text-white font-bold text-sm mb-1 uppercase line-clamp-1">
                      {ticket.subject}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-600 font-black uppercase">
                        {categoryLabels[ticket.category]}
                      </span>
                      <span className="text-[10px] text-gray-600 font-black uppercase">
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
              className="bg-[#1A1C20] border border-site-border rounded-[16px] overflow-hidden h-full flex flex-col"
              
            >
              {isDetailLoading ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <Loader2 className="animate-spin text-white" size={32} />
                </div>
              ) : (
                <>
                  {/* Ticket Header */}
                  <div className="p-6 border-b-[3px] border-black">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-xs text-gray-600 font-black uppercase">
                          {selectedTicket.ticketNumber}
                        </span>
                        <h2 className="text-xl font-black uppercase text-white mt-1">
                          {selectedTicket.subject}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${statusLabels[selectedTicket.status].color}`}
                        >
                          {statusLabels[selectedTicket.status].label}
                        </span>
                        {!["CLOSED", "RESOLVED"].includes(
                          selectedTicket.status,
                        ) && (
                            <button
                              onClick={handleCloseTicket}
                              className="p-2 text-gray-600 hover:text-white hover:bg-[#2A2C30] transition-colors"
                              title={t("detail.closed_notice")}
                            >
                              <X size={18} />
                            </button>
                          )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-[10px] text-gray-600 font-black uppercase">
                      <div className="flex items-center">
                        <Tag size={14} className="mr-1.5" />
                        {categoryLabels[selectedTicket.category]}
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1.5" />
                        {t("created_at", {
                          date: new Date(
                            selectedTicket.createdAt,
                          ).toLocaleString(),
                        })}
                      </div>
                      {selectedTicket.orderId && (
                        <Link
                          href={`/dashboard/orders/${selectedTicket.orderId}`}
                          className="text-white hover:underline flex items-center font-medium"
                        >
                          <FileText size={14} className="mr-1.5" />
                          {t("order_ref_label", { id: selectedTicket.orderId })}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-6 overflow-y-auto max-h-[500px] space-y-4">
                    {/* Initial Message */}
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-site-accent border border-site-border flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-black uppercase text-[10px]">
                            {t("user_you")}
                          </span>
                          <span className="text-[10px] text-gray-600 font-black uppercase">
                            {new Date(
                              selectedTicket.createdAt,
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-[#2A2C30] border border-site-border p-3 text-white font-bold uppercase text-xs">
                          {selectedTicket.description}
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {selectedTicket.messages.map((message) => (
                      <div key={message.id} className="flex gap-4">
                        <div
                          className={`w-8 h-8 border border-site-border flex items-center justify-center flex-shrink-0 ${message.sender === "admin"
                            ? "bg-green-500"
                            : message.sender === "system"
                              ? "bg-gray-300"
                              : "bg-site-accent"
                            }`}
                        >
                          {message.sender === "admin" ? (
                            <span className="text-white text-xs font-bold">
                              S
                            </span>
                          ) : message.sender === "system" ? (
                            <span className="text-white text-xs">@</span>
                          ) : (
                            <User size={16} className="text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-black uppercase text-[10px]">
                              {message.sender === "admin"
                                ? message.senderName || t("support_team")
                                : message.sender === "system"
                                  ? t("system")
                                  : t("user_you")}
                            </span>
                            <span className="text-[10px] font-black uppercase text-gray-600">
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div
                            className={`p-3 border border-site-border font-bold uppercase text-xs ${message.sender === "admin"
                              ? "bg-green-500 text-white"
                              : message.sender === "system"
                                ? "bg-[#1A1C20] text-white"
                                : "bg-[#2A2C30] text-white"
                              }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Form */}
                  {!["CLOSED", "RESOLVED"].includes(selectedTicket.status) && (
                    <div className="p-4 border-t-[3px] border-black">
                      <form onSubmit={handleSendReply} className="flex gap-3">
                        <input
                          type="text"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder={t("detail.reply") + "..."}
                          className="flex-1 py-2 px-4 bg-[#1A1C20] border border-site-border text-white font-bold uppercase placeholder-gray-500 focus:outline-none focus:bg-[#2A2C30] transition-colors text-xs"
                        />
                        <button
                          type="submit"
                          disabled={isSendingReply || !replyMessage.trim()}
                          className="bg-black text-white border border-site-border rounded-[12px] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 font-black uppercase flex items-center hover:bg-gray-800 transition-colors text-[10px]"
                          
                        >
                          {isSendingReply ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <>
                              <Send size={18} className="mr-2" />
                              {t("detail.send_reply")}
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
            <div
              className="bg-[#1A1C20] border border-site-border rounded-[16px] p-12 text-center h-full flex flex-col items-center justify-center"
              
            >
              <MessageSquare className="text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-bold text-white mb-2">
                {t("select_ticket")}
              </h3>
              <p className="text-gray-600 max-w-sm">
                {t("select_ticket_desc")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNewTicketModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1C20] border border-site-border rounded-[16px] w-full max-w-lg max-h-[90vh] overflow-y-auto"
              
            >
              <div className="p-6 border-b-[3px] border-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-1.5 h-5 bg-site-accent mr-2"></span>
                    <h2 className="text-xl font-black uppercase text-white">
                      {t("create.title")}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewTicketModal(false)}
                    className="text-gray-600 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                <div>
                  <label className="block text-gray-500 mb-2 font-black uppercase text-[10px]">
                    {t("create.category")}
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket({
                        ...newTicket,
                        category: e.target.value as TicketCategory,
                      })
                    }
                    className="w-full xl:w-2/3 py-2.5 px-4 bg-[#1A1C20] border border-site-border text-white focus:outline-none focus:bg-[#2A2C30] transition-colors font-bold uppercase text-xs"
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-2 font-black uppercase text-[10px]">
                    {t("create.description")}
                  </label>
                  <input
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, subject: e.target.value })
                    }
                    placeholder={t("create.subject_placeholder")}
                    required
                    className="w-full py-2.5 px-4 bg-[#1A1C20] border border-site-border text-white font-bold uppercase placeholder-gray-500 focus:outline-none focus:bg-[#2A2C30] transition-colors text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-2 font-black uppercase text-[10px]">
                    {t("create.description_label")}
                  </label>
                  <textarea
                    value={newTicket.description}
                    onChange={(e) =>
                      setNewTicket({
                        ...newTicket,
                        description: e.target.value,
                      })
                    }
                    placeholder={t("create.description_placeholder")}
                    required
                    rows={5}
                    className="w-full py-2.5 px-4 bg-[#1A1C20] border border-site-border text-white font-bold uppercase placeholder-gray-500 focus:outline-none focus:bg-[#2A2C30] transition-colors text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 mb-2 font-black uppercase text-[10px]">
                    {t("create.order_ref")}
                  </label>
                  <input
                    type="text"
                    value={newTicket.orderId || ""}
                    onChange={(e) =>
                      setNewTicket({
                        ...newTicket,
                        orderId: e.target.value || undefined,
                      })
                    }
                    placeholder={t("create.order_ref_placeholder")}
                    className="w-full py-2.5 px-4 bg-[#1A1C20] border border-site-border text-white font-bold uppercase placeholder-gray-500 focus:outline-none focus:bg-[#2A2C30] transition-colors text-xs"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(false)}
                    className="flex-1 py-2.5 px-4 border border-site-border rounded-[12px] text-white hover:bg-[#2A2C30] transition-colors font-black uppercase text-xs"
                  >
                    {t("create.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !newTicket.subject.trim() ||
                      !newTicket.description.trim()
                    }
                    className="flex-1 py-2.5 px-4 bg-black text-white border border-site-border rounded-[12px] disabled:opacity-50 disabled:cursor-not-allowed font-black uppercase text-xs hover:bg-gray-800 transition-colors"
                    
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <Loader2 size={18} className="animate-spin mr-2" />
                        {tCommon("loading")}
                      </span>
                    ) : (
                      t("create.submit")
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
