"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Loader2,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  Copy,
  RefreshCw,
} from "lucide-react";
import {
  aiService,
  GeneratedContent,
  GenerationProgress,
  DebugLog,
} from "@/lib/services/ai-api";

interface AIGenerateButtonProps {
  productName: string;
  productType: string;
  categoryName?: string;
  onGenerated: (content: GeneratedContent) => void;
  disabled?: boolean;
}

// Format timestamp for display
const formatTime = (date: Date) => {
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Get color for log type
const getLogColor = (type: DebugLog["type"]) => {
  switch (type) {
    case "error":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    case "success":
      return "text-green-400 bg-green-500/10 border-green-500/20";
    case "warning":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    case "api_call":
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    default:
      return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  }
};

// Get icon for log type
const getLogIcon = (type: DebugLog["type"]) => {
  switch (type) {
    case "error":
      return <AlertCircle className="w-3.5 h-3.5" />;
    case "success":
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case "warning":
      return <AlertCircle className="w-3.5 h-3.5" />;
    case "api_call":
      return <Zap className="w-3.5 h-3.5" />;
    default:
      return <Info className="w-3.5 h-3.5" />;
  }
};

// Get stage display name
const getStageName = (stage: GenerationProgress["stage"]) => {
  const stages: Record<string, string> = {
    idle: "รอการเริ่มต้น",
    preparing: "กำลังเตรียมข้อมูล",
    generating_description: "กำลังสร้างคำอธิบาย",
    generating_short_description: "กำลังสร้างคำอธิบายสั้น",
    generating_meta: "กำลังสร้าง SEO Meta",
    generating_game_details: "กำลังสร้างข้อมูลเกม",
    parsing: "กำลังประมวลผล",
    completed: "เสร็จสมบูรณ์",
    error: "เกิดข้อผิดพลาด",
  };
  return stages[stage] || stage;
};

export default function AIGenerateButton({
  productName,
  productType,
  categoryName,
  onGenerated,
  disabled = false,
}: AIGenerateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    stage: "idle",
    currentField: "",
    logs: [],
    isGenerating: false,
  });
  const [showDebug, setShowDebug] = useState(true);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [progress.logs]);

  // Update elapsed time
  useEffect(() => {
    if (progress.isGenerating && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [progress.isGenerating, startTime]);

  // Handle progress updates
  const handleProgress = useCallback(
    (newProgress: GenerationProgress) => {
      setProgress(newProgress);

      if (newProgress.stage === "completed" && newProgress.results) {
        onGenerated(newProgress.results);
      }
    },
    [onGenerated],
  );

  // Start generation
  const handleGenerate = async () => {
    if (!aiService.isConfigured()) {
      setIsOpen(true);
      setProgress({
        stage: "error",
        currentField: "Configuration Error",
        logs: [
          {
            id: "config-error",
            timestamp: new Date(),
            type: "error",
            message:
              "Z.ai API key not configured. Please add NEXT_PUBLIC_ZAI_API_KEY to your .env.local file.",
          },
        ],
        isGenerating: false,
        error: "API Key not configured",
      });
      return;
    }

    setIsOpen(true);
    setStartTime(new Date());
    setElapsedTime(0);

    try {
      await aiService.generateProductContent(
        productName,
        productType,
        categoryName,
        handleProgress,
      );
    } catch (error) {
      // Error is already handled in progress callback
      console.error("Generation failed:", error);
    }
  };

  // Copy logs to clipboard
  const copyLogs = () => {
    const logText = progress.logs
      .map(
        (log) =>
          `[${formatTime(log.timestamp)}] [${log.type.toUpperCase()}] ${log.message}`,
      )
      .join("\n");
    navigator.clipboard.writeText(logText);
  };

  // Retry generation
  const handleRetry = () => {
    setProgress({
      stage: "idle",
      currentField: "",
      logs: [],
      isGenerating: false,
    });
    handleGenerate();
  };

  const isConfigError = progress.error?.includes("API key not configured");

  return (
    <>
      {/* Main Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={disabled || progress.isGenerating}
        className="group relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
        {progress.isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>กำลังสร้าง...</span>
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            <span>สร้างด้วย AI</span>
            <Sparkles className="w-3.5 h-3.5 opacity-70" />
          </>
        )}
      </button>

      {/* Debug Panel Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !progress.isGenerating && setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-mali-card border border-mali-blue/30 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl shadow-purple-900/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-mali-blue/20 bg-gradient-to-r from-purple-600/10 to-pink-600/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      AI Content Generator
                    </h3>
                    <p className="text-sm text-gray-400">
                      กำลังสร้างเนื้อหาสำหรับ: {productName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {progress.isGenerating && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 rounded-lg text-purple-400 text-sm">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsedTime}s</span>
                    </div>
                  )}
                  {!progress.isGenerating && (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Status */}
              <div className="px-5 py-4 border-b border-mali-blue/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">สถานะ:</span>
                  <span
                    className={`text-sm font-medium ${
                      progress.stage === "completed"
                        ? "text-green-400"
                        : progress.stage === "error"
                          ? "text-red-400"
                          : progress.stage === "idle"
                            ? "text-gray-400"
                            : "text-purple-400"
                    }`}
                  >
                    {getStageName(progress.stage)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-mali-dark rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      progress.stage === "error"
                        ? "bg-red-500"
                        : progress.stage === "completed"
                          ? "bg-green-500"
                          : "bg-gradient-to-r from-purple-500 to-pink-500"
                    }`}
                    initial={{ width: "0%" }}
                    animate={{
                      width:
                        progress.stage === "idle"
                          ? "0%"
                          : progress.stage === "preparing"
                            ? "10%"
                            : progress.stage === "generating_description"
                              ? "20%"
                              : progress.stage ===
                                  "generating_short_description"
                                ? "40%"
                                : progress.stage === "generating_meta"
                                  ? "60%"
                                  : progress.stage === "generating_game_details"
                                    ? "80%"
                                    : progress.stage === "parsing"
                                      ? "90%"
                                      : progress.stage === "completed"
                                        ? "100%"
                                        : progress.stage === "error"
                                          ? "100%"
                                          : "0%",
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </div>

                {progress.currentField &&
                  progress.stage !== "idle" &&
                  progress.stage !== "completed" &&
                  progress.stage !== "error" && (
                    <p className="text-xs text-gray-500 mt-2">
                      กำลังดำเนินการ: {progress.currentField}
                    </p>
                  )}
              </div>

              {/* Debug Panel Toggle */}
              <div className="px-5 py-2 border-b border-mali-blue/10 bg-mali-dark/30">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <Terminal className="w-4 h-4" />
                  <span>Debug Console</span>
                  {showDebug ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <span className="ml-auto text-xs text-gray-500">
                    {progress.logs.length} logs
                  </span>
                </button>
              </div>

              {/* Debug Logs */}
              <AnimatePresence>
                {showDebug && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 py-3 bg-black/40 max-h-64 overflow-y-auto">
                      {progress.logs.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          ยังไม่มี log - กดปุ่มสร้างเพื่อเริ่มต้น
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {progress.logs.map((log) => (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`flex items-start gap-2 p-2 rounded-lg border text-sm ${getLogColor(
                                log.type,
                              )}`}
                            >
                              <span className="shrink-0 mt-0.5">
                                {getLogIcon(log.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs opacity-60">
                                    {formatTime(log.timestamp)}
                                  </span>
                                  <span className="text-xs font-medium uppercase opacity-80">
                                    {log.type}
                                  </span>
                                </div>
                                <p className="break-words">{log.message}</p>
                                {log.details && (
                                  <pre className="mt-1.5 p-2 bg-black/30 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </motion.div>
                          ))}
                          <div ref={logsEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Debug Actions */}
                    {progress.logs.length > 0 && (
                      <div className="px-5 py-2 border-t border-mali-blue/10 bg-mali-dark/30 flex items-center justify-between">
                        <button
                          onClick={copyLogs}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>คัดลอก Logs</span>
                        </button>
                        <span className="text-xs text-gray-500">
                          API Endpoint: api.z.ai/api/coding/paas/v4
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer / Actions */}
              <div className="p-5 border-t border-mali-blue/20">
                {isConfigError ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-400">
                        กรุณาตั้งค่า NEXT_PUBLIC_ZAI_API_KEY ในไฟล์ .env.local
                      </p>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-full py-2.5 bg-mali-dark hover:bg-mali-dark/70 text-white rounded-xl transition-colors"
                    >
                      ปิด
                    </button>
                  </div>
                ) : progress.stage === "completed" ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-green-400">
                        สร้างเนื้อหาสำเร็จ! ข้อมูลถูกเติมลงในฟอร์มแล้ว
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRetry}
                        className="flex-1 py-2.5 bg-mali-dark hover:bg-mali-dark/70 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>สร้างใหม่</span>
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all"
                      >
                        เสร็จสิ้น
                      </button>
                    </div>
                  </div>
                ) : progress.stage === "error" ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-400">
                        {progress.error || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRetry}
                        className="flex-1 py-2.5 bg-mali-dark hover:bg-mali-dark/70 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>ลองใหม่</span>
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
                      >
                        ปิด
                      </button>
                    </div>
                  </div>
                ) : progress.isGenerating ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-mali-dark/50 text-gray-500 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังดำเนินการ... ({elapsedTime}s)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>เริ่มสร้างเนื้อหา</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
