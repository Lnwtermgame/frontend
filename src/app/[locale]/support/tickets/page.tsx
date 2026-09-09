"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Send, XCircle, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTickets, useTicketDetail } from "@/lib/query/hooks";
import { createTicket, replyTicket, closeTicket } from "@/lib/api/support";
import type { Ticket, TicketCategory } from "@/lib/api/support";
import { StatusBadge, DashEmptyState, DashErrorState, formatDateTime } from "@/components/dashboard/shared";

const CATEGORIES: TicketCategory[] = [
  "ORDER_ISSUE",
  "PAYMENT_ISSUE",
  "PRODUCT_ISSUE",
  "ACCOUNT_ISSUE",
  "TECHNICAL_SUPPORT",
  "REFUND_REQUEST",
  "GENERAL_INQUIRY",
];

export default function SupportTicketsPage() {
  const t = useTranslations("support");
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const router = useRouter();
  const pathname = usePathname();

  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Form states
  const [category, setCategory] = useState<TicketCategory>("ORDER_ISSUE");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reply states
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Auth gate
  useEffect(() => {
    if (status !== "bootstrapping" && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, user, router, pathname]);

  const tickets = useTickets({ limit: 50 });
  const activeTicket = useTicketDetail(activeTicketId ?? "");

  if (status === "bootstrapping" || !user) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">กำลังโหลด…</p>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setFormError("กรุณากรอกหัวข้อและรายละเอียดปัญหา");
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      const created = await createTicket({
        category,
        subject: subject.trim(),
        description: description.trim(),
        orderId: orderId.trim() || undefined,
      });
      setCreateOpen(false);
      setSubject("");
      setDescription("");
      setOrderId("");
      tickets.refetch();
      setActiveTicketId(created.id);
    } catch (err: any) {
      setFormError(err?.message || "เกิดข้อผิดพลาดในการส่งเรื่อง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !replyText.trim()) return;
    setIsReplying(true);
    try {
      await replyTicket(activeTicketId, replyText.trim());
      setReplyText("");
      activeTicket.refetch();
    } finally {
      setIsReplying(false);
    }
  };

  const handleClose = async () => {
    if (!activeTicketId) return;
    try {
      await closeTicket(activeTicketId);
      activeTicket.refetch();
      tickets.refetch();
    } catch {
      // noop
    }
  };

  // View Ticket Thread
  if (activeTicketId) {
    const tkt = activeTicket.data;
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 gap-1.5"
          onClick={() => setActiveTicketId(null)}
        >
          <ArrowLeft className="size-4" />
          {t("ticketsTitle")}
        </Button>

        {activeTicket.isLoading ? (
          <Skeleton className="h-64 rounded-[14px]" />
        ) : activeTicket.isError || !tkt ? (
          <DashErrorState onRetry={() => activeTicket.refetch()} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-[14px] border bg-card p-5 shadow-(--shadow-tile)">
              <div>
                <div className="flex items-center gap-2">
                  <span className="num text-xs text-muted-foreground">{tkt.ticketNumber}</span>
                  <StatusBadge status={tkt.status} />
                </div>
                <h1 className="mt-1.5 text-xl font-bold">{tkt.subject}</h1>
                <p className="num mt-1 text-xs text-muted-foreground">
                  {formatDateTime(tkt.createdAt)} · {t(`cat_${tkt.category}` as never)}
                  {tkt.orderId ? ` · Order: ${tkt.orderId}` : ""}
                </p>
              </div>

              {tkt.status !== "CLOSED" && (
                <Button variant="outline" size="sm" className="gap-1" onClick={handleClose}>
                  <XCircle className="size-4" />
                  {t("closeTicket")}
                </Button>
              )}
            </div>

            {/* Description as initial message */}
            <div className="space-y-3">
              <div className="rounded-[12px] border bg-card p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{user.username} (ผู้แจ้ง)</span>
                  <span className="num">{formatDateTime(tkt.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm">{tkt.description}</p>
              </div>

              {/* Thread messages */}
              {tkt.messages?.map((msg) => {
                const isAdmin = msg.user?.role === "ADMIN";
                return (
                  <div
                    key={msg.id}
                    className={`rounded-[12px] border p-4 ${
                      isAdmin ? "border-primary/40 bg-primary/5" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className={`font-semibold ${isAdmin ? "text-primary" : "text-foreground"}`}>
                        {isAdmin ? "ทีมงาน Lnwtermgame" : msg.user?.username ?? "ผู้ใช้"}
                      </span>
                      <span className="num">{formatDateTime(msg.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm">{msg.content}</p>
                  </div>
                );
              })}
            </div>

            {/* Reply Box */}
            {tkt.status !== "CLOSED" ? (
              <form onSubmit={handleReply} className="flex gap-2">
                <textarea
                  className="flex-1 rounded-[10px] border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder={t("replyPlaceholder")}
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <Button type="submit" disabled={isReplying || !replyText.trim()} className="self-end gap-1">
                  <Send className="size-4" />
                  {t("reply")}
                </Button>
              </form>
            ) : (
              <p className="text-center text-sm text-muted-foreground">{t("closed")}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Tickets List View
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("ticketsTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("ticketsSubtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          {t("newTicket")}
        </Button>
      </div>

      <div className="mt-6">
        {tickets.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-[14px]" />
            ))}
          </div>
        ) : tickets.isError ? (
          <DashErrorState onRetry={() => tickets.refetch()} />
        ) : !tickets.data?.data.length ? (
          <DashEmptyState title={t("emptyTickets")} description={t("emptyTicketsDesc")} />
        ) : (
          <div className="space-y-3">
            {tickets.data.data.map((tkt) => (
              <button
                key={tkt.id}
                type="button"
                onClick={() => setActiveTicketId(tkt.id)}
                className="block w-full rounded-[14px] border bg-card p-4 text-left transition-colors hover:border-primary/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold">{tkt.subject}</span>
                  <StatusBadge status={tkt.status} />
                </div>
                <p className="num mt-1 text-xs text-muted-foreground">
                  {tkt.ticketNumber} · {t(`cat_${tkt.category}` as never)} · {formatDateTime(tkt.createdAt)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>{t("createTicketTitle")}</DialogTitle>
              <DialogDescription>{t("createTicketDesc")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">{t("category")}</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t(`cat_${cat}` as never)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject">{t("subject")} *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="เช่น ไม่ได้รับเพชรในเกม, สลิปโอนเงินซ้ำ"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="orderId">{t("orderIdOptional")}</Label>
                <Input
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="ORD-..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">{t("description")} *</Label>
                <textarea
                  id="description"
                  className="w-full rounded-[10px] border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ระบุวันเวลาที่ทำรายการ เลขที่อ้างอิง หรือปัญหาที่พบ..."
                  required
                />
              </div>

              {formError ? (
                <p role="alert" className="text-xs text-destructive">
                  {formError}
                </p>
              ) : null}
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {t("cancel", { defaultMessage: "ยกเลิก" })}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("sending") : t("send")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
