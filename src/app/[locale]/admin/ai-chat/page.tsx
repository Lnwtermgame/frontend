"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AdminLayout,
  AdminPageHeader,
  PageContainer,
} from "@/components/admin";
import { useAuth } from "@/lib/hooks/use-auth";
import { getAccessToken } from "@/lib/client/gateway";
import { Bot, Loader2, Send, ShieldAlert, Sparkles, User } from "lucide-react";
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

const EXAMPLE_QUESTIONS = [
  "สรุปสินค้าที่ขายดีตอนนี้ให้หน่อย",
  "ค้นหาสินค้าที่เกี่ยวกับ Roblox",
  "มีสินค้าไหนที่ยังไม่ active บ้าง",
  "ช่วยอธิบายความต่างระหว่าง CARD กับ DIRECT_TOPUP",
];

export default function AdminAiChatPage() {
  const { isAdmin, isInitialized } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "สวัสดีครับ ผมเป็น AI Assistant สำหรับแอดมิน คุณสามารถถามเกี่ยวกับข้อมูลสินค้า สถานะการใช้งาน หรือการวิเคราะห์เบื้องต้นได้เลย",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [models, setModels] = useState<ModelItem[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("");

  const canSend = useMemo(() => {
    return (
      input.trim().length > 0 &&
      input.trim().length <= 1200 &&
      !loading &&
      selectedModel.length > 0
    );
  }, [input, loading, selectedModel]);

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
    const safeText = text.trim().slice(0, 1200);
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

  return (
    <AdminLayout>
      <PageContainer>
        <AdminPageHeader title="AI Chat (Admin)" icon={Bot} />
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100 text-sm">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 h-4 w-4" />
            <p>
              ระบบนี้เปิดให้เฉพาะแอดมินเท่านั้น, มี rate limit และกรองข้อความอัตโนมัติ เพื่อป้องกันข้อมูลสำคัญรั่วไหล
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-site-surface p-4 lg:col-span-1">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-site-accent" />
              ตัวอย่างคำถาม
            </h3>

            <label className="mb-2 block text-xs text-gray-400">เลือกโมเดล</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={modelsLoading || models.length === 0}
              className="mb-3 w-full rounded-lg border border-white/15 bg-site-raised px-2 py-2 text-xs text-white"
            >
              {modelsLoading && <option value="">กำลังโหลดโมเดล...</option>}
              {!modelsLoading && models.length === 0 && (
                <option value="">ไม่พบโมเดลที่ใช้งานได้</option>
              )}
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </select>

            <div className="space-y-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setInput(q)}
                  className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-gray-300 transition hover:border-site-accent/30 hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-site-surface lg:col-span-3">
            <div className="h-[56vh] space-y-3 overflow-y-auto bg-site-surface/80 p-4">
              {messages.map((m, idx) => (
                <div
                  key={`${m.role}-${idx}`}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-xl border px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "border-site-accent/30 bg-site-accent/20 text-white"
                        : "border-white/10 bg-site-raised text-gray-100"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] opacity-80">
                      {m.role === "user" ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Bot className="h-3 w-3" />
                      )}
                      <span>{m.role === "user" ? "คุณ" : "AI"}</span>
                    </div>
                    {m.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none leading-relaxed prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-pre:my-2 prose-pre:rounded-md prose-pre:bg-black/40 prose-code:text-site-accent">
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
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-site-raised px-3 py-2 text-sm text-gray-100">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI กำลังประมวลผล...
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={onSubmit}
              className="border-t border-white/10 bg-site-surface p-3"
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={3}
                  maxLength={1200}
                  placeholder="พิมพ์คำถามเกี่ยวกับ product หรือข้อมูลที่ต้องการวิเคราะห์..."
                  className="w-full resize-none rounded-xl border border-white/15 bg-site-raised px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-site-accent/50"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="inline-flex h-[42px] items-center gap-2 rounded-xl bg-site-accent px-4 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  ส่ง
                </button>
              </div>

              <div className="mt-1 text-[11px] text-gray-500">
                {input.length}/1200 ตัวอักษร
              </div>
              {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
            </form>
          </div>
        </div>
      </PageContainer>
    </AdminLayout>
  );
}
