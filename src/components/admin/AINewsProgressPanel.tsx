"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CheckCircle2,
  AlertCircle,
  Info,
  Zap,
  Loader2,
  X,
} from "lucide-react";
import { aiService, DebugLog } from "@/lib/services/ai-api";

// News generation stages with their display info
const NEWS_STAGES = [
  { key: "idle", label: "รอการเริ่มต้น", icon: "clock" },
  { key: "preparing", label: "กำลังวิเคราะห์และสร้างมุมมองข่าว", icon: "settings" },
  { key: "searching", label: "กำลังค้นหาข้อมูลจาก TheNewsAPI", icon: "search" },
  { key: "parsing", label: "กำลังประมวลผลผลลัพธ์", icon: "file" },
  { key: "images", label: "กำลังค้นหารูปภาพและวิดีโอ", icon: "image" },
  { key: "completed", label: "สร้างเสร็จสมบูรณ์", icon: "check" },
  { key: "error", label: "เกิดข้อผิดพลาด", icon: "error" },
] as const;

type NewsStage = typeof NEWS_STAGES[number]["key"];

// Progress stage from callback
interface ProgressStage {
  stage: string;
  message: string;
}

// Extended progress with logs (similar to GenerationProgress)
interface NewsGenerationProgress {
  stage: NewsStage;
  currentField: string;
  logs: DebugLog[];
  isGenerating: boolean;
  error?: string;
  elapsed: number;
}

interface AINewsProgressPanelProps {
  progress: ProgressStage | null;
  isGenerating: boolean;
  error?: string;
  onClose?: () => void;
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
      return "text-red-600 bg-red-500/10 border-red-500/30";
    case "success":
      return "text-green-600 bg-green-500/10 border-green-500/30";
    case "warning":
      return "text-yellow-600 bg-yellow-500/10 border-yellow-500/30";
    case "api_call":
      return "text-blue-600 bg-blue-100 border-blue-500";
    default:
      return "text-gray-600 bg-site-raised border-gray-300";
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

// Get stage icon
const getStageIcon = (stage: NewsStage) => {
  switch (stage) {
    case "idle":
      return <Clock className="w-5 h-5" />;
    case "preparing":
      return <Loader2 className="w-5 h-5 animate-spin" />;
    case "searching":
      return <Zap className="w-5 h-5" />;
    case "parsing":
      return <Terminal className="w-5 h-5" />;
    case "images":
      return <Loader2 className="w-5 h-5 animate-spin" />;
    case "completed":
      return <CheckCircle2 className="w-5 h-5" />;
    case "error":
      return <AlertCircle className="w-5 h-5" />;
    default:
      return <Info className="w-5 h-5" />;
  }
};

// Get stage color
const getStageColor = (stage: NewsStage) => {
  switch (stage) {
    case "idle":
      return "text-gray-500 bg-site-raised border-gray-300";
    case "preparing":
      return "text-blue-600 bg-blue-100 border-blue-500";
    case "searching":
      return "text-site-accent bg-site-accent/10 border-site-accent";
    case "parsing":
      return "text-site-accent bg-site-accent/10 border-site-accent";
    case "images":
      return "text-site-accent bg-site-accent/10 border-site-accent";
    case "completed":
      return "text-green-600 bg-green-500/10 border-green-500/30";
    case "error":
      return "text-red-600 bg-red-500/10 border-red-500/30";
    default:
      return "text-gray-600 bg-site-raised border-gray-300";
  }
};

export default function AINewsProgressPanel({
  progress,
  isGenerating,
  error,
  onClose,
}: AINewsProgressPanelProps) {
  const [showDebug, setShowDebug] = useState(true);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [currentStage, setCurrentStage] = useState<NewsStage>("idle");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Update stage from progress
  useEffect(() => {
    if (progress?.stage) {
      setCurrentStage(progress.stage as NewsStage);
    }
  }, [progress]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Capture console logs during generation
  useEffect(() => {
    if (!isGenerating) {
      setElapsed(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (
      type: DebugLog["type"],
      message: string,
      details?: Record<string, unknown>
    ) => {
      const log: DebugLog = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        type,
        message,
        details,
      };
      setLogs((prev) => {
        const updated = [...prev, log];
        // Cap at 500 entries to prevent unbounded memory growth
        return updated.length > 500 ? updated.slice(-500) : updated;
      });
    };

    console.log = (...args) => {
      originalLog(...args);
      const message = args
        .map((a) =>
          typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
        )
        .join(" ");
      if (message.includes("[AI News]") || message.includes("[News]") || message.includes("[TheNewsAPI") || message.includes("[Generate AI")) {
        addLog("info", message);
      }
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args
        .map((a) =>
          typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
        )
        .join(" ");
      addLog("error", message);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args
        .map((a) =>
          typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
        )
        .join(" ");
      addLog("warning", message);
    };

    return () => {
      clearInterval(interval);
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [isGenerating]);

  // Reset logs when starting new generation
  useEffect(() => {
    if (isGenerating && logs.length === 0) {
      setLogs([
        {
          id: "start",
          timestamp: new Date(),
          type: "info",
          message: "Starting news content generation...",
        },
      ]);
    } else if (!isGenerating && currentStage === "idle") {
      setLogs([]);
    }
  }, [isGenerating, currentStage, logs.length]);

  // Copy logs to clipboard
  const copyLogs = () => {
    const logText = logs
      .map(
        (log) =>
          `[${formatTime(log.timestamp)}] [${log.type.toUpperCase()}] ${log.message}`
      )
      .join("\n");
    navigator.clipboard.writeText(logText);
  };

  // Get completed stages
  const getStageStatus = (stageKey: NewsStage) => {
    const stageIndex = NEWS_STAGES.findIndex((s) => s.key === stageKey);
    const currentIndex = NEWS_STAGES.findIndex((s) => s.key === currentStage);

    if (stageKey === "error" && currentStage === "error") return "current";
    if (stageKey === "completed" && currentStage === "completed") return "completed";
    if (stageIndex < currentIndex) return "completed";
    if (stageIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="bg-site-raised border border-site-border/30 rounded-[16px] w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-[3px] border-black bg-gradient-to-r from-site-accent to-site-accent/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-site-raised border-[2px] border-black">
            {getStageIcon(currentStage)}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">AI News Generator</h3>
            <p className="text-xs text-white/70">
              {progress?.message || NEWS_STAGES.find((s) => s.key === currentStage)?.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isGenerating && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-site-raised border-[2px] border-black text-white text-sm font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{elapsed}s</span>
            </div>
          )}
          {onClose && !isGenerating && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/10 transition-colors border-[2px] border-transparent hover:border-black"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 bg-site-surface">
        <div className="space-y-2">
          {NEWS_STAGES.filter((s) => s.key !== "error").map((stage, index) => {
            const status = getStageStatus(stage.key);
            const isLast = index === NEWS_STAGES.filter((s) => s.key !== "error").length - 1;

            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                {/* Icon */}
                <div
                  className={`flex items-center justify-center w-10 h-10 border-[2px] shrink-0 ${status === "completed"
                    ? "bg-green-500 border-green-600 text-white"
                    : status === "current"
                      ? "bg-site-accent border-site-accent text-white animate-pulse"
                      : "bg-site-raised border-gray-300 text-gray-400"
                    }`}
                >
                  {status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : status === "current" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${status === "completed"
                      ? "text-green-400"
                      : status === "current"
                        ? "text-site-accent"
                        : "text-gray-500"
                      }`}
                  >
                    {stage.label}
                  </p>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="absolute left-9 mt-10 w-0.5 h-6 -z-10">
                    <div
                      className={`w-full h-full ${status === "completed" ? "bg-green-400" : "bg-gray-300"
                        }`}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Error state */}
          {currentStage === "error" && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center justify-center w-10 h-10 border-[2px] bg-red-500 border-red-600 text-white shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-400">
                  เกิดข้อผิดพลาด: {error || "Unknown error"}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Debug Panel Toggle */}
      <div className="px-4 py-2 border-b-[2px] border-gray-200 bg-site-raised">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-white transition-colors font-medium w-full"
        >
          <Terminal className="w-4 h-4" />
          <span>Debug Console</span>
          {showDebug ? (
            <ChevronUp className="w-4 h-4 ml-auto" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-auto" />
          )}
          <span className="ml-auto text-xs text-gray-500 bg-site-raised px-2 py-0.5 border border-gray-300">
            {logs.length} logs
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
            <div className="p-3 bg-gray-900 max-h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  ยังไม่มี log
                </p>
              ) : (
                <div className="space-y-1.5">
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-start gap-2 p-2 border-l-2 text-xs font-mono ${log.type === "error"
                        ? "bg-red-950 border-red-500/30 text-red-300"
                        : log.type === "success"
                          ? "bg-green-950 border-green-500/30 text-green-300"
                          : log.type === "warning"
                            ? "bg-yellow-950 border-yellow-500/30 text-yellow-300"
                            : log.type === "api_call"
                              ? "bg-blue-950 border-blue-500 text-blue-300"
                              : "bg-gray-800 border-gray-600 text-gray-300"
                        }`}
                    >
                      <span className="shrink-0 mt-0.5 opacity-70">
                        {getLogIcon(log.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 opacity-60">
                          <span className="text-[10px]">
                            {formatTime(log.timestamp)}
                          </span>
                          <span className="text-[10px] font-bold uppercase">
                            {log.type}
                          </span>
                        </div>
                        <p className="break-words whitespace-pre-wrap">
                          {log.message}
                        </p>
                        {log.details && (
                          <pre className="mt-1.5 p-2 bg-black/30 text-[10px] overflow-x-auto">
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
            {logs.length > 0 && (
              <div className="px-4 py-2 border-t-[2px] border-gray-700 bg-gray-800 flex items-center justify-between">
                <button
                  onClick={copyLogs}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอก Logs</span>
                </button>
                <span className="text-xs text-gray-500">
                  TheNewsAPI | News Aggregation
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="h-2 bg-site-border/30">
        <motion.div
          className={`h-full ${currentStage === "error"
            ? "bg-red-500"
            : currentStage === "completed"
              ? "bg-green-500"
              : "bg-gradient-to-r from-site-accent to-site-accent/80"
            }`}
          initial={{ width: "0%" }}
          animate={{
            width:
              currentStage === "idle"
                ? "0%"
                : currentStage === "preparing"
                  ? "15%"
                  : currentStage === "searching"
                    ? "40%"
                    : currentStage === "parsing"
                      ? "65%"
                      : currentStage === "images"
                        ? "85%"
                        : currentStage === "completed"
                          ? "100%"
                          : currentStage === "error"
                            ? "100%"
                            : "0%",
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
