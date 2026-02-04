"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { useAuth } from "@/lib/hooks/use-auth";
import { supportApi, Ticket, TicketDetail, CreateTicketData, TicketReplyData, TicketCategory, TicketStatus } from "@/lib/services";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  User
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

const statusLabels: Record<TicketStatus, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  WAITING_USER: { label: "Waiting for You", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  WAITING_ADMIN: { label: "Waiting for Support", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  RESOLVED: { label: "Resolved", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  CLOSED: { label: "Closed", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

export default function TicketsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");

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
    // Wait for auth to initialize before checking authentication
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=/support/tickets");
      return;
    }
    loadTickets();
  }, [isInitialized, isAuthenticated, statusFilter]);

  const loadTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await supportApi.getUserTickets(
        1,
        50,
        statusFilter === "ALL" ? undefined : statusFilter
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

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-mali-blue/30 rounded-xl p-6 md:p-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center mb-2">
              <Link
                href="/support"
                className="text-mali-text-secondary hover:text-white mr-4 flex items-center"
              >
                <ArrowLeft size={18} className="mr-1" />
                Back
              </Link>
              <MessageSquare className="h-6 w-6 text-mali-blue-accent mr-3" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">My Support Tickets</h1>
            </div>
            <p className="text-mali-text-secondary">
              View and manage your support requests
            </p>
          </div>
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="bg-mali-blue hover:bg-mali-blue/90 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center"
          >
            <Plus size={18} className="mr-2" />
            New Ticket
          </button>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center"
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
            {/* Filter Tabs */}
            <div className="p-4 border-b border-mali-blue/20">
              <div className="flex flex-wrap gap-2">
                {["ALL", "OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as TicketStatus | "ALL")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      statusFilter === status
                        ? "bg-mali-blue text-white"
                        : "bg-mali-blue/10 text-mali-text-secondary hover:bg-mali-blue/20"
                    }`}
                  >
                    {status === "ALL" ? "All" : statusLabels[status as TicketStatus].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket List */}
            <div className="max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="animate-spin mx-auto text-mali-blue-accent mb-3" size={32} />
                  <p className="text-mali-text-secondary">Loading tickets...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="mx-auto text-mali-text-secondary/50 mb-3" size={48} />
                  <p className="text-mali-text-secondary mb-2">No tickets found</p>
                  <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="text-mali-blue-accent hover:underline"
                  >
                    Create your first ticket
                  </button>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => loadTicketDetail(ticket.id)}
                    className={`w-full text-left p-4 border-b border-mali-blue/10 hover:bg-mali-blue/5 transition-colors ${
                      selectedTicket?.id === ticket.id ? "bg-mali-blue/10 border-l-4 border-l-mali-blue-accent" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-mali-text-secondary">{ticket.ticketNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusLabels[ticket.status].color}`}>
                        {statusLabels[ticket.status].label}
                      </span>
                    </div>
                    <h4 className="text-white font-medium text-sm mb-1 line-clamp-1">{ticket.subject}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-mali-text-secondary">
                        {categoryLabels[ticket.category]}
                      </span>
                      <span className="text-xs text-mali-text-secondary">
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
                  <Loader2 className="animate-spin text-mali-blue-accent" size={32} />
                </div>
              ) : (
                <>
                  {/* Ticket Header */}
                  <div className="p-6 border-b border-mali-blue/20">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-sm text-mali-text-secondary">{selectedTicket.ticketNumber}</span>
                        <h2 className="text-xl font-bold text-white mt-1">{selectedTicket.subject}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusLabels[selectedTicket.status].color}`}>
                          {statusLabels[selectedTicket.status].label}
                        </span>
                        {!["CLOSED", "RESOLVED"].includes(selectedTicket.status) && (
                          <button
                            onClick={handleCloseTicket}
                            className="p-2 text-mali-text-secondary hover:text-white hover:bg-mali-blue/20 rounded-lg transition-colors"
                            title="Close Ticket"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-mali-text-secondary">
                      <div className="flex items-center">
                        <Tag size={14} className="mr-1.5" />
                        {categoryLabels[selectedTicket.category]}
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1.5" />
                        Created {new Date(selectedTicket.createdAt).toLocaleString()}
                      </div>
                      {selectedTicket.orderId && (
                        <Link
                          href={`/dashboard/orders/${selectedTicket.orderId}`}
                          className="text-mali-blue-accent hover:underline flex items-center"
                        >
                          <FileText size={14} className="mr-1.5" />
                          Order: {selectedTicket.orderId}
                        </Link>
                      )}
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
                          <span className="text-white font-medium text-sm">You</span>
                          <span className="text-xs text-mali-text-secondary">
                            {new Date(selectedTicket.createdAt).toLocaleString()}
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
                            <span className="text-green-400 text-xs font-bold">S</span>
                          ) : message.sender === "system" ? (
                            <span className="text-gray-400 text-xs">@</span>
                          ) : (
                            <User size={16} className="text-mali-blue-accent" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium text-sm">
                              {message.sender === "admin"
                                ? message.senderName || "Support Team"
                                : message.sender === "system"
                                ? "System"
                                : "You"}
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
                  {!["CLOSED", "RESOLVED"].includes(selectedTicket.status) && (
                    <div className="p-4 border-t border-mali-blue/20">
                      <form onSubmit={handleSendReply} className="flex gap-3">
                        <input
                          type="text"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your reply..."
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
                              Send
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
              <MessageSquare className="text-mali-text-secondary/30 mb-4" size={64} />
              <h3 className="text-xl font-bold text-white mb-2">Select a Ticket</h3>
              <p className="text-mali-text-secondary max-w-sm">
                Choose a ticket from the list to view details and continue the conversation
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
              className="bg-mali-card border border-mali-blue/30 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-mali-blue/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Create New Ticket</h2>
                  <button
                    onClick={() => setShowNewTicketModal(false)}
                    className="text-mali-text-secondary hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                <div>
                  <label className="block text-mali-text-secondary mb-2">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as TicketCategory })}
                    className="w-full py-2.5 px-4 bg-mali-blue/10 border border-mali-blue/30 rounded-lg text-white focus:outline-none focus:border-mali-blue-accent"
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value} className="bg-mali-card">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-mali-text-secondary mb-2">Subject</label>
                  <input
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="Brief summary of your issue"
                    required
                    className="w-full py-2.5 px-4 bg-mali-blue/10 border border-mali-blue/30 rounded-lg text-white placeholder-mali-text-secondary focus:outline-none focus:border-mali-blue-accent"
                  />
                </div>

                <div>
                  <label className="block text-mali-text-secondary mb-2">Description</label>
                  <textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Please describe your issue in detail..."
                    required
                    rows={5}
                    className="w-full py-2.5 px-4 bg-mali-blue/10 border border-mali-blue/30 rounded-lg text-white placeholder-mali-text-secondary focus:outline-none focus:border-mali-blue-accent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-mali-text-secondary mb-2">Order ID (Optional)</label>
                  <input
                    type="text"
                    value={newTicket.orderId || ""}
                    onChange={(e) => setNewTicket({ ...newTicket, orderId: e.target.value || undefined })}
                    placeholder="If this is about a specific order"
                    className="w-full py-2.5 px-4 bg-mali-blue/10 border border-mali-blue/30 rounded-lg text-white placeholder-mali-text-secondary focus:outline-none focus:border-mali-blue-accent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(false)}
                    className="flex-1 py-2.5 px-4 border border-mali-blue/30 text-mali-text-secondary rounded-lg hover:bg-mali-blue/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newTicket.subject.trim() || !newTicket.description.trim()}
                    className="flex-1 py-2.5 px-4 bg-mali-blue hover:bg-mali-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <Loader2 size={18} className="animate-spin mr-2" />
                        Creating...
                      </span>
                    ) : (
                      "Create Ticket"
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
