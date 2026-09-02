"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
} from "@/components/admin";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/hooks/use-auth";
import { getAccessToken } from "@/lib/client/gateway";
import {
  Bot,
  Check,
  ChevronDown,
  Cpu,
  Loader2,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  User,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ModelItem = {
  id: string;
};

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "สวัสดีครับ ผมเป็น AI Assistant สำหรับแอดมิน คุณสามารถถามเกี่ยวกับข้อมูลสินค้า สถานะการใช้งาน หรือการวิเคราะห์เบื้องต้นได้เลย",
};

const EXAMPLE_QUESTIONS = [
  {
    label: "สรุปสินค้าขายดี",
    question: "สรุปสินค้าที่ขายดีตอนนี้ให้หน่อย",
  },
  {
    label: "ค้นหาสินค้า Roblox",
    question: "ค้นหาสินค้าที่เกี่ยวกับ Roblox",
  },
  {
    label: "สินค้าที่ยังไม่ active",
    question: "มีสินค้าไหนที่ยังไม่ active บ้าง",
  },
  {
    label: "เทียบ CARD vs DIRECT_TOPUP",
    question: "ช่วยอธิบายความต่างระหว่าง CARD กับ DIRECT_TOPUP",
  },
];

const CHAT_LIMIT = 1200;

export default function AdminAiChatPage() {
  const { isAdmin, isInitialized } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [models, setModels] = useState<ModelItem[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");

  // Model picker state (searchable combobox — 2,800+ models can't render at once)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [modelQuery, setModelQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(60);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const filteredModels = useMemo(() => {
    const query = modelQuery.trim().toLowerCase();
    if (!query) return models;
    return models.filter((m) => m.id.toLowerCase().includes(query));
  }, [models, modelQuery]);

  const visibleModels = useMemo(
    () => filteredModels.slice(0, visibleCount),
    [filteredModels, visibleCount],
  );

  // Reset paging when the query changes
  useEffect(() => {
    setVisibleCount(60);
  }, [modelQuery]);

  // Close picker on outside click / Escape
  useEffect(() => {
    if (!pickerOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pickerOpen]);

  const openPicker = () => {
    setModelQuery("");
    setVisibleCount(60);
    setPickerOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const pickModel = (id: string) => {
    setSelectedModel(id);
    setPickerOpen(false);
  };

  const streamRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const canSend = useMemo(() => {
    return (
      input.trim().length > 0 &&
      input.trim().length <= CHAT_LIMIT &&
      !loading &&
      selectedModel.length > 0
    );
  }, [input, loading, selectedModel]);

  // Auto-scroll to the newest message
  useEffect(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.scrollTop = stream.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const loadModels = async () => {
      setModelsLoading(true);
      try {
        const response = await fetch("/api/ai/models", { cache: "no-store" });
        const data = await response.json();

        const normalized: ModelItem[] = Array.isArray(data?.data)
          ? data.data
              .map((m: any) => ({ id: String(m?.id || "").trim() }))
              .filter((m: ModelItem) => m.id.length > 0)
          : [];

        setModels(normalized);

        if (normalized.length > 0) {
          setSelectedModel((prev) =>
            prev && normalized.some((m) => m.id === prev) ? prev : normalized[0].id,
          );
        }
      } catch {
        setError("โหลดรายการโมเดลไม่สำเร็จ");
      } finally {
        setModelsLoading(false);
      }
    };

    if (isInitialized && isAdmin) {
      loadModels();
    }
  }, [isInitialized, isAdmin]);

  const sendMessage = async (text: string) => {
    const safeText = text.trim().slice(0, CHAT_LIMIT);
    if (!safeText || loading || !selectedModel) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: safeText },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const accessToken = getAccessToken();
      const response = await fetch("/api/admin/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: nextMessages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "ไม่สามารถติดต่อ AI ได้");
      }

      const answer =
        typeof data?.answer === "string"
          ? data.answer
          : "ไม่พบข้อมูลในระบบตอนนี้";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (err: any) {
      setError(err?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (canSend) {
        void sendMessage(input);
      }
    }
  };

  const resetConversation = () => {
    if (loading) return;
    setMessages([GREETING]);
    setError(null);
  };

  const isEmptyConversation =
    messages.length === 1 && messages[0].content === GREETING.content;

  return (
    <AdminLayout>
      <PageContainer>
        <AdminPageHeader title="AI Assistant" description="ถามข้อมูลสินค้า สถานะระบบ หรือขอวิเคราะห์ — ตอบจากข้อมูลจริงในระบบ" icon={Bot} />

        <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[280px_1fr]">
          {/* ===== Left rail: model + examples ===== */}
          <div className="space-y-3.5">
            {/* Model picker — no overflow-hidden so the dropdown can extend past the card */}
            <div className="rounded-2xl border border-site-border-soft bg-site-surface">
              <div className="flex items-center gap-2 border-b border-site-border-soft bg-site-raised px-4 py-3">
                <Cpu size={14} className="text-site-accent" />
                <h3 className="text-sm font-bold text-site-text">โมเดลที่ใช้</h3>
              </div>
              <div className="p-3.5">
                <div ref={pickerRef} className="relative">
                  {/* Trigger */}
                  <button
                    type="button"
                    onClick={() =>
                      pickerOpen ? setPickerOpen(false) : openPicker()
                    }
                    disabled={modelsLoading || models.length === 0}
                    aria-expanded={pickerOpen}
                    aria-haspopup="listbox"
                    className="flex h-9 w-full items-center gap-2 rounded-lg border border-site-border bg-site-raised px-3 text-left transition-colors hover:border-site-dim disabled:opacity-60"
                  >
                    {modelsLoading ? (
                      <>
                        <Loader2 size={12} className="flex-shrink-0 animate-spin text-site-accent" />
                        <span className="truncate text-xs text-site-dim">กำลังโหลดโมเดล…</span>
                      </>
                    ) : models.length === 0 ? (
                      <span className="truncate text-xs text-site-dim">ไม่พบโมเดลที่ใช้งานได้</span>
                    ) : (
                      <>
                        <span className="truncate font-mono text-xs text-site-text">
                          {selectedModel || "เลือกโมเดล"}
                        </span>
                        <ChevronDown
                          size={13}
                          className={`ml-auto flex-shrink-0 text-site-dim transition-transform ${pickerOpen ? "rotate-180" : ""}`}
                        />
                      </>
                    )}
                  </button>

                  {/* Dropdown: search + virtualized list (opens downward — plenty of room below) */}
                  {pickerOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-site-border bg-site-surface shadow-2xl">
                      <div className="flex items-center gap-2 border-b border-site-border-soft px-3 py-2">
                        <Search size={13} className="flex-shrink-0 text-site-dim" />
                        <input
                          ref={searchInputRef}
                          value={modelQuery}
                          onChange={(e) => setModelQuery(e.target.value)}
                          placeholder="ค้นหาโมเดล…"
                          className="w-full bg-transparent text-xs text-site-text outline-none placeholder:text-site-dim"
                        />
                        <span className="flex-shrink-0 font-mono text-[10px] text-site-dim">
                          {filteredModels.length.toLocaleString()}
                        </span>
                      </div>
                      <div
                        role="listbox"
                        className="max-h-[240px] overflow-y-auto p-1"
                        onScroll={(e) => {
                          const el = e.currentTarget;
                          if (
                            el.scrollTop + el.clientHeight >=
                            el.scrollHeight - 40
                          ) {
                            setVisibleCount((prev) =>
                              Math.min(prev + 60, filteredModels.length),
                            );
                          }
                        }}
                      >
                        {visibleModels.length === 0 ? (
                          <p className="px-2.5 py-4 text-center text-xs text-site-dim">
                            ไม่พบโมเดลที่ตรงกับ &quot;{modelQuery}&quot;
                          </p>
                        ) : (
                          visibleModels.map((m) => {
                            const isSelected = m.id === selectedModel;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => pickModel(m.id)}
                                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                                  isSelected
                                    ? "bg-site-accent/15 text-site-accent"
                                    : "text-site-muted hover:bg-site-raised hover:text-site-text"
                                }`}
                              >
                                <span className="truncate font-mono text-[11px]">
                                  {m.id}
                                </span>
                                {isSelected && (
                                  <Check size={12} className="ml-auto flex-shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                        {visibleModels.length < filteredModels.length && (
                          <p className="px-2.5 py-1.5 text-center font-mono text-[9.5px] text-site-dim">
                            เลื่อนเพื่อดูเพิ่ม — แสดง {visibleModels.length.toLocaleString()} /{" "}
                            {filteredModels.length.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {models.length > 0 && (
                  <p className="mt-2 text-[11px] leading-snug text-site-dim">
                    พร้อมใช้ {models.length.toLocaleString()} โมเดล — พิมพ์เพื่อค้นหา
                    คำตอบถัดไปจะใช้โมเดลที่เลือก
                  </p>
                )}
              </div>
            </div>

            {/* Example questions */}
            <div className="overflow-hidden rounded-2xl border border-site-border-soft bg-site-surface">
              <div className="flex items-center gap-2 border-b border-site-border-soft bg-site-raised px-4 py-3">
                <Sparkles size={14} className="text-site-accent" />
                <h3 className="text-sm font-bold text-site-text">ลองถาม</h3>
              </div>
              <div className="space-y-1.5 p-2.5">
                {EXAMPLE_QUESTIONS.map((example) => (
                  <button
                    key={example.question}
                    onClick={() => {
                      void sendMessage(example.question);
                    }}
                    disabled={loading}
                    className="group flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-xs text-site-muted transition-colors hover:border-site-accent/30 hover:bg-site-accent/5 hover:text-site-text disabled:opacity-50"
                  >
                    <span className="leading-snug">{example.label}</span>
                    <Send
                      size={11}
                      className="flex-shrink-0 text-site-dim opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Security note — compact */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-[rgb(var(--status-warning-rgb)/0.3)] bg-[rgb(var(--status-warning-rgb)/0.06)] px-3.5 py-3">
              <ShieldAlert size={15} className="mt-0.5 flex-shrink-0 text-[rgb(var(--status-warning-rgb))]" />
              <div className="text-[11px] leading-relaxed text-site-muted">
                <span className="font-bold text-[rgb(var(--status-warning-rgb))]">
                  เฉพาะแอดมิน
                </span>
                <br />
                มี rate limit และกรองข้อความอัตโนมัติ เพื่อป้องกันข้อมูลสำคัญรั่วไหล
              </div>
            </div>
          </div>

          {/* ===== Chat panel ===== */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-site-border-soft bg-site-surface">
            {/* Conversation header */}
            <div className="flex items-center gap-2.5 border-b border-site-border-soft bg-site-raised px-4 py-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[rgb(var(--status-success-rgb))] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[rgb(var(--status-success-rgb))]" />
              </span>
              <h2 className="text-sm font-bold text-site-text">บทสนทนา</h2>
              <span className="font-mono text-[10px] text-site-dim">
                {messages.filter((m) => m.role === "user").length} คำถาม
              </span>
              <button
                onClick={resetConversation}
                disabled={loading || isEmptyConversation}
                title="เริ่มบทสนทนาใหม่"
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-site-border bg-site-surface px-2.5 py-1.5 text-[11px] font-bold text-site-muted transition-colors hover:text-site-text disabled:opacity-40"
              >
                <RotateCcw size={12} />
                เริ่มใหม่
              </button>
            </div>

            {/* Message stream */}
            <div
              ref={streamRef}
              className="flex h-[52vh] min-h-[360px] flex-col gap-3 overflow-y-auto p-4"
            >
              {messages.map((m, idx) => {
                const isUser = m.role === "user";
                const isGreeting =
                  idx === 0 && m.content === GREETING.content;
                return (
                  <div
                    key={`${m.role}-${idx}`}
                    className={`flex max-w-[85%] gap-2.5 ${isUser ? "ml-auto flex-row-reverse" : ""}`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border ${
                        isUser
                          ? "border-site-accent/40 bg-site-accent/15 text-site-accent"
                          : "border-site-border bg-site-raised text-site-muted"
                      }`}
                    >
                      {isUser ? <User size={13} /> : <Bot size={13} />}
                    </span>
                    <div
                      className={`rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? "rounded-tr-sm border-site-accent/30 bg-site-accent/15 text-site-text"
                          : "rounded-tl-sm border-site-border-soft bg-site-raised text-site-text"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-site-dim">
                        {isUser ? "คุณ" : isGreeting ? "AI Assistant" : "AI"}
                      </div>
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {m.content}
                        </p>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none leading-relaxed prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-pre:my-2 prose-pre:rounded-lg prose-pre:bg-black/40 prose-code:text-site-accent first:prose-p:mt-0">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}
                            components={{
                              a: ({ ...props }) => (
                                <a
                                  {...props}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-site-accent underline"
                                />
                              ),
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex max-w-[85%] gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-site-border bg-site-raised text-site-muted">
                    <Bot size={13} />
                  </span>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-site-border-soft bg-site-raised px-3.5 py-2.5 text-sm text-site-muted">
                    <Loader2 size={14} className="animate-spin text-site-accent" />
                    AI กำลังประมวลผล
                    <span className="flex gap-1">
                      <span className="h-1 w-1 animate-bounce rounded-full bg-site-accent [animation-delay:0ms]" />
                      <span className="h-1 w-1 animate-bounce rounded-full bg-site-accent [animation-delay:150ms]" />
                      <span className="h-1 w-1 animate-bounce rounded-full bg-site-accent [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}

              {/* Empty state hint */}
              {isEmptyConversation && !loading && (
                <div className="mt-auto pt-2 text-center text-[11px] text-site-dim">
                  พิมพ์คำถามด้านล่าง หรือเลือกจาก &quot;ลองถาม&quot; ทางซ้าย — กด{" "}
                  <kbd className="rounded border border-site-border bg-site-raised px-1 font-mono text-[9px]">
                    Ctrl
                  </kbd>
                  +
                  <kbd className="rounded border border-site-border bg-site-raised px-1 font-mono text-[9px]">
                    ↵
                  </kbd>{" "}
                  เพื่อส่ง
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={onSubmit}
              className="border-t border-site-border-soft bg-site-raised/50 p-3.5"
            >
              {error && (
                <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-[rgb(var(--status-danger-rgb)/0.3)] bg-[rgb(var(--status-danger-rgb)/0.1)] px-3 py-2 text-xs text-[rgb(var(--status-danger-rgb))]">
                  <span className="font-bold">ผิดพลาด:</span> {error}
                </div>
              )}
              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={2}
                  maxLength={CHAT_LIMIT}
                  placeholder="พิมพ์คำถามเกี่ยวกับ product หรือข้อมูลที่ต้องการวิเคราะห์…"
                  className="flex-1 resize-none rounded-xl border-site-border bg-site-surface px-3.5 py-2.5 text-sm placeholder:text-site-dim"
                />
                <Button
                  type="submit"
                  disabled={!canSend}
                  title="ส่งข้อความ (Ctrl+Enter)"
                  className="h-[46px] gap-2 rounded-xl px-5"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  ส่ง
                </Button>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-site-dim">
                <span>
                  <kbd className="rounded border border-site-border bg-site-surface px-1 font-mono text-[9px]">
                    Ctrl
                  </kbd>
                  +
                  <kbd className="rounded border border-site-border bg-site-surface px-1 font-mono text-[9px]">
                    ↵
                  </kbd>{" "}
                  ส่งข้อความ
                </span>
                <span
                  className={`font-mono ${
                    input.length > CHAT_LIMIT * 0.9
                      ? "text-[rgb(var(--status-warning-rgb))]"
                      : ""
                  }`}
                >
                  {input.length}/{CHAT_LIMIT}
                </span>
              </div>
            </form>
          </div>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}
