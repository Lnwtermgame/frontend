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
      return "text-red-600 bg-red-100 border-red-500";
    case "success":
      return "text-green-600 bg-green-100 border-green-500";
    case "warning":
      return "text-yellow-600 bg-yellow-100 border-yellow-500";
    case "api_call":
      return "text-blue-600 bg-blue-100 border-blue-500";
    default:
      return "text-gray-600 bg-gray-100 border-gray-300";
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
        className="group relative inline-flex items-center gap-2 px-4 py-2 bg-brutal-pink text-white border-[3px] border-black font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden hover:-translate-y-0.5"
        style={{ boxShadow: '4px 4px 0 0 #000000' }}
      >
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
              className="bg-white border-[3px] border-black w-full max-w-2xl max-h-[85vh] overflow-hidden"
              style={{ boxShadow: '8px 8px 0 0 #000000' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b-[3px] border-black bg-brutal-pink">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border-[2px] border-black">
                    <Sparkles className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black">
                      AI Content Generator
                    </h3>
                    <p className="text-sm text-black/70">
                      กำลังสร้างเนื้อหาสำหรับ: {productName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {progress.isGenerating && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-[2px] border-black text-black text-sm font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsedTime}s</span>
                    </div>
                  )}
                  {!progress.isGenerating && (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-black/10 transition-colors border-[2px] border-transparent hover:border-black"
                    >
                      <X className="w-5 h-5 text-black" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Status */}
              <div className="px-5 py-4 border-b-[2px] border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600 font-medium">สถานะ:</span>
                  <span
                    className={`text-sm font-bold ${
                      progress.stage === "completed"
                        ? "text-green-600"
                        : progress.stage === "error"
                          ? "text-red-600"
                          : progress.stage === "idle"
                            ? "text-gray-500"
                            : "text-brutal-pink"
                    }`}
                  >
                    {getStageName(progress.stage)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-gray-200 border-[2px] border-black overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      progress.stage === "error"
                        ? "bg-red-500"
                        : progress.stage === "completed"
                          ? "bg-green-500"
                          : "bg-brutal-pink"
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
              <div className="px-5 py-2 border-b-[2px] border-gray-200 bg-gray-100">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-black transition-colors font-medium"
                >
                  <Terminal className="w-4 h-4" />
                  <span>Debug Console</span>
                  {showDebug ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <span className="ml-auto text-xs text-gray-500 bg-white px-2 py-0.5 border border-gray-300">
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
                    <div className="px-5 py-3 bg-gray-50 max-h-64 overflow-y-auto">
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
                              className={`flex items-start gap-2 p-2 border-[2px] text-sm ${getLogColor(
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
                                  <span className="text-xs font-bold uppercase opacity-80">
                                    {log.type}
                                  </span>
                                </div>
                                <p className="break-words">{log.message}</p>
                                {log.details && (
                                  <pre className="mt-1.5 p-2 bg-black/5 text-xs overflow-x-auto border border-black/10">
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
                      <div className="px-5 py-2 border-t-[2px] border-gray-200 bg-gray-100 flex items-center justify-between">
                        <button
                          onClick={copyLogs}
                          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-black transition-colors font-medium"
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
              <div className="p-5 border-t-[3px] border-black bg-white">
                {isConfigError ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-red-100 border-[3px] border-red-500">
                      <p className="text-sm text-red-600 font-medium">
                        กรุณาตั้งค่า NEXT_PUBLIC_ZAI_API_KEY ในไฟล์ .env.local
                      </p>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-black border-[3px] border-black font-bold transition-all"
                      style={{ boxShadow: '3px 3px 0 0 #000000' }}
                    >
                      ปิด
                    </button>
                  </div>
                ) : progress.stage === "completed" ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-green-100 border-[3px] border-green-500 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        สร้างเนื้อหาสำเร็จ! ข้อมูลถูกเติมลงในฟอร์มแล้ว
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRetry}
                        className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-black border-[3px] border-black font-bold transition-all flex items-center justify-center gap-2"
                        style={{ boxShadow: '3px 3px 0 0 #000000' }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>สร้างใหม่</span>
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="flex-1 py-2.5 bg-brutal-pink hover:bg-brutal-pink/90 text-white border-[3px] border-black font-bold transition-all"
                        style={{ boxShadow: '3px 3px 0 0 #000000' }}
                      >
                        เสร็จสิ้น
                      </button>
                    </div>
                  </div>
                ) : progress.stage === "error" ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-red-100 border-[3px] border-red-500">
                      <p className="text-sm text-red-600 font-medium">
                        {progress.error || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRetry}
                        className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-black border-[3px] border-black font-bold transition-all flex items-center justify-center gap-2"
                        style={{ boxShadow: '3px 3px 0 0 #000000' }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>ลองใหม่</span>
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="flex-1 py-2.5 bg-gray-400 hover:bg-gray-500 text-white border-[3px] border-black font-bold transition-all"
                        style={{ boxShadow: '3px 3px 0 0 #000000' }}
                      >
                        ปิด
                      </button>
                    </div>
                  </div>
                ) : progress.isGenerating ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-gray-100 text-gray-500 border-[3px] border-gray-300 font-bold cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังดำเนินการ... ({elapsedTime}s)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate}
                    className="w-full py-2.5 bg-brutal-pink hover:bg-brutal-pink/90 text-white border-[3px] border-black font-bold transition-all flex items-center justify-center gap-2"
                    style={{ boxShadow: '4px 4px 0 0 #000000' }}
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
