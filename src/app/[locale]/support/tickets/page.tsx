"use client";

import { useState, useEffect } from "react";
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
  AlertCircle,
  ArrowLeft,
  Send,
  X,
  Loader2,
  Tag,
  FileText,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TicketsPage() {
  const t = useTranslations("SupportTickets");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuth();
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
      color: "bg-site-accent/15 text-site-accent border-site-accent/30",
    },
    IN_PROGRESS: {
      label: t("status.pending"),
      color: "bg-status-warning/15 text-status-warning border-status-warning/30",
    },
    WAITING_USER: {
      label: t("status.waiting_user"),
      color: "bg-site-accent/15 text-site-accent border-site-accent/30",
    },
    WAITING_ADMIN: {
      label: t("status.waiting_admin"),
      color: "bg-site-accent/15 text-site-accent border-site-accent/30",
    },
    RESOLVED: {
      label: t("status.resolved"),
      color: "bg-status-success/15 text-status-success border-status-success/30",
    },
    CLOSED: {
      label: t("status.closed"),
      color: "bg-site-raised text-site-muted border-site-border-soft",
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
        <div className="site-card mx-auto max-w-2xl p-8 text-center my-8">
          <h1 className="text-xl font-bold text-site-text">
            {t("disabled.title")}
          </h1>
          <p className="mt-3 text-sm text-site-muted">
            {t("disabled.description")}
          </p>
          <div className="mt-6">
            <Link
              href="/support/contact"
              className="inline-flex bg-status-warning/15 border border-status-warning/30 rounded-10 px-4 py-2 font-semibold text-status-warning text-sm hover:bg-status-warning/20 transition-colors"
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
      {/* Back link — own line, like the product page */}
      <div className="mb-4">
        <Link
          href="/support"
          className="text-site-muted hover:text-site-text transition-colors inline-flex items-center font-medium"
        >
          <ArrowLeft size={18} className="mr-1" />
          {t("back")}
        </Link>
      </div>

      {/* Page header — airy, no wrapping card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-12 bg-site-accent/10 border border-site-accent/20 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-5 w-5 text-site-accent" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-site-text leading-tight">
              {t("title")}
            </h1>
            <p className="text-[12px] text-site-muted mt-0.5">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowNewTicketModal(true)} size="md">
          <Plus size={16} className="mr-2" />
          {t("create_new")}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-status-danger/15 border border-status-danger/20 rounded-10 p-4 mb-6 flex items-center">
          <AlertCircle className="text-status-danger mr-3" size={20} />
          <span className="text-site-text text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-site-text hover:text-site-muted"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1">
          <div className="site-card overflow-hidden">
            {/* Filter pills */}
            <div className="p-4 border-b border-site-border-soft">
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
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === status
                      ? "bg-site-accent/15 text-site-accent border-site-accent/40"
                      : "bg-transparent text-site-muted border-site-border-soft hover:text-site-text hover:border-site-border"
                      }`}
                  >
                    {status === "ALL"
                      ? t("status.all")
                      : statusLabels[status as TicketStatus].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket rows */}
            <div className="max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2
                    className="animate-spin mx-auto text-site-accent mb-3"
                    size={28}
                  />
                  <p className="text-site-muted text-sm">{tCommon("loading")}</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-site-raised flex items-center justify-center mx-auto mb-3">
                    <FileText className="text-site-dim" size={22} />
                  </div>
                  <p className="text-site-muted text-sm mb-2">
                    {t("no_tickets")}
                  </p>
                  <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="text-site-accent hover:text-site-accent-hover text-sm font-medium"
                  >
                    {t("create_new")}
                  </button>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => loadTicketDetail(ticket.id)}
                    className={`w-full text-left px-4 py-3 border-b border-site-border-soft last:border-b-0 transition-colors ${selectedTicket?.id === ticket.id
                      ? "bg-site-accent/10 border-l-2 border-l-site-accent"
                      : "hover:bg-site-raised/60"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] text-site-dim font-medium">
                        {ticket.ticketNumber}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusLabels[ticket.status].color}`}
                      >
                        {statusLabels[ticket.status].label}
                      </span>
                    </div>
                    <h4 className="text-site-text font-medium text-sm mb-1 line-clamp-1">
                      {ticket.subject}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-site-muted">
                      <span>{categoryLabels[ticket.category]}</span>
                      <span className="tabular-nums">
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
            <div className="site-card overflow-hidden h-full flex flex-col">
              {isDetailLoading ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <Loader2 className="animate-spin text-site-accent" size={28} />
                </div>
              ) : (
                <>
                  {/* Ticket header */}
                  <div className="p-5 md:p-6 border-b border-site-border-soft">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <span className="text-[11px] text-site-dim font-medium">
                          {selectedTicket.ticketNumber}
                        </span>
                        <h2 className="text-lg font-bold text-site-text mt-0.5 leading-snug">
                          {selectedTicket.subject}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusLabels[selectedTicket.status].color}`}
                        >
                          {statusLabels[selectedTicket.status].label}
                        </span>
                        {!["CLOSED", "RESOLVED"].includes(
                          selectedTicket.status,
                        ) && (
                            <button
                              onClick={handleCloseTicket}
                              className="p-2 text-site-muted hover:text-site-text hover:bg-site-raised rounded-full transition-colors"
                              title={t("detail.closed_notice")}
                            >
                              <X size={16} />
                            </button>
                          )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-site-muted">
                      <span className="flex items-center">
                        <Tag size={13} className="mr-1.5" />
                        {categoryLabels[selectedTicket.category]}
                      </span>
                      <span className="flex items-center tabular-nums">
                        <Clock size={13} className="mr-1.5" />
                        {t("created_at", {
                          date: new Date(
                            selectedTicket.createdAt,
                          ).toLocaleString(),
                        })}
                      </span>
                      {selectedTicket.orderId && (
                        <Link
                          href={`/dashboard/orders/${selectedTicket.orderId}`}
                          className="text-site-accent hover:text-site-accent-hover flex items-center font-medium"
                        >
                          <FileText size={13} className="mr-1.5" />
                          {t("order_ref_label", { id: selectedTicket.orderId })}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-5 md:p-6 overflow-y-auto max-h-[500px] space-y-4">
                    {/* Initial message */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-site-accent/15 flex items-center justify-center flex-shrink-0">
                        <User size={15} className="text-site-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-site-text font-semibold text-xs">
                            {t("user_you")}
                          </span>
                          <span className="text-[11px] text-site-dim tabular-nums">
                            {new Date(
                              selectedTicket.createdAt,
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-site-raised rounded-10 rounded-tl-sm p-3 text-site-text text-sm leading-relaxed">
                          {selectedTicket.description}
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {selectedTicket.messages.map((message) => (
                      <div key={message.id} className="flex gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${message.sender === "admin"
                            ? "bg-status-success/15 text-status-success"
                            : message.sender === "system"
                              ? "bg-site-raised text-site-muted"
                              : "bg-site-accent/15 text-site-accent"
                            }`}
                        >
                          {message.sender === "admin"
                            ? (message.senderName || "S").charAt(0).toUpperCase()
                            : message.sender === "system"
                              ? "@"
                              : (
                                <User size={15} />
                              )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-site-text font-semibold text-xs">
                              {message.sender === "admin"
                                ? message.senderName || t("support_team")
                                : message.sender === "system"
                                  ? t("system")
                                  : t("user_you")}
                            </span>
                            <span className="text-[11px] text-site-dim tabular-nums">
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div
                            className={`p-3 rounded-10 text-sm leading-relaxed ${message.sender === "admin"
                              ? "bg-status-success/10 border border-status-success/20 text-site-text rounded-tl-sm"
                              : message.sender === "system"
                                ? "bg-site-surface border border-site-border-soft text-site-muted rounded-tl-sm"
                                : "bg-site-raised text-site-text rounded-tl-sm"
                              }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply form */}
                  {!["CLOSED", "RESOLVED"].includes(selectedTicket.status) && (
                    <div className="p-4 border-t border-site-border-soft">
                      <form onSubmit={handleSendReply} className="flex gap-3">
                        <input
                          type="text"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder={t("detail.reply") + "..."}
                          className="flex-1 site-input"
                        />
                        <Button
                          type="submit"
                          disabled={isSendingReply || !replyMessage.trim()}
                          size="md"
                        >
                          {isSendingReply ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <>
                              <Send size={15} className="mr-2" />
                              {t("detail.send_reply")}
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="site-card p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-site-accent/10 border border-site-accent/20 flex items-center justify-center mb-4">
                <MessageSquare className="text-site-accent" size={24} />
              </div>
              <h3 className="text-base font-bold text-site-text mb-1.5">
                {t("select_ticket")}
              </h3>
              <p className="text-sm text-site-muted max-w-sm">
                {t("select_ticket_desc")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Dialog */}
      <Dialog
        open={showNewTicketModal}
        onOpenChange={(o) => setShowNewTicketModal(o)}
      >
        <DialogContent className="bg-site-surface border-site-border rounded-12 sm:rounded-12 max-w-lg gap-0 p-0 overflow-hidden">
          <DialogHeader className="p-5 border-b border-site-border-soft">
            <DialogTitle className="text-base font-bold text-site-text">
              {t("create.title")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-site-muted mb-1.5">
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
                className="site-input w-full xl:w-2/3"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-site-muted mb-1.5">
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
                className="site-input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-site-muted mb-1.5">
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
                className="site-input w-full resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-site-muted mb-1.5">
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
                className="site-input w-full"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                className="flex-1 py-2.5 px-4 border border-site-border-soft rounded-10 text-site-muted hover:text-site-text hover:border-site-border transition-colors font-medium text-sm"
              >
                {t("create.cancel")}
              </button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !newTicket.subject.trim() ||
                  !newTicket.description.trim()
                }
                className="flex-1"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    {tCommon("loading")}
                  </span>
                ) : (
                  t("create.submit")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
