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
  AvailableCategory,
  AIModel,
} from "@/lib/services/ai-api";

interface AIGenerateButtonProps {
  productName: string;
  productType: string;
  categoryName?: string;
  categories?: { name: string; slug: string }[];
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

// Get stage display name
const getStageName = (stage: GenerationProgress["stage"]) => {
  const stages: Record<string, string> = {
    idle: "รอการเริ่มต้น",
    preparing: "กำลังเตรียมข้อมูล",
    generating_classification: "กำลังจัดหมวดหมู่",
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
  categories,
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

  // AI Model selection state
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Fetch available models on mount
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const models = await aiService.fetchModels();
        setAvailableModels(models);
        if (models.length > 0 && !selectedModel) {
          const defaultModel = aiService.getSelectedModel() || models[0].id;
          setSelectedModel(defaultModel);
          aiService.setModel(defaultModel);
        }
      } catch (error) {
        console.error("[AIGenerateButton] Failed to fetch models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, [selectedModel]);

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

  // Open modal (without starting generation)
  const handleOpenModal = () => {
    setIsOpen(true);
  };

  // Start generation (called from inside modal)
  const handleStartGeneration = async () => {
    if (!aiService.isConfigured()) {
      setProgress({
        stage: "error",
        currentField: "Configuration Error",
        logs: [
          {
            id: "config-error",
            timestamp: new Date(),
            type: "error",
            message:
              "AI service not configured. Please set LITELLM_API_KEY in your server .env file.",
          },
        ],
        isGenerating: false,
        error: "API Key not configured",
      });
      return;
    }

    // Set the selected model before generating
    if (selectedModel) {
      aiService.setModel(selectedModel);
    }

    setStartTime(new Date());
    setElapsedTime(0);

    // Reset progress
    setProgress({
      stage: "preparing",
      currentField: "Initializing",
      logs: [],
      isGenerating: true,
    });

    try {
      // Build available categories for AI classification
      const availableCategories: AvailableCategory[] | undefined =
        categories?.map((c) => ({
          name: c.name,
          slug: c.slug,
        }));

      await aiService.generateProductContent(
        productName,
        productType,
        categoryName,
        handleProgress,
        availableCategories,
      );
    } catch (error) {
      // Error is already handled in progress callback
      console.error("Generation failed:", error);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    if (!progress.isGenerating) {
      setIsOpen(false);
      setProgress({
        stage: "idle",
        currentField: "",
        logs: [],
        isGenerating: false,
      });
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
    handleStartGeneration();
  };

  const isConfigError = progress.error?.includes("API key not configured");

  return (
    <>
      {/* Main Generate Button */}
      <button
        onClick={handleOpenModal}
        disabled={disabled || progress.isGenerating}
        className="group relative inline-flex items-center gap-2 px-4 py-2 bg-site-accent text-white border border-site-border/30 rounded-[12px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden hover:-translate-y-0.5"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
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
              className="bg-site-raised border border-site-border/30 rounded-[16px] w-full max-w-2xl max-h-[85vh] overflow-hidden"
              style={{ boxShadow: "8px 8px 0 0 #000000" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b-[3px] border-black bg-site-accent">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-site-raised border-[2px] border-black">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      AI Content Generator
                    </h3>
                    <p className="text-sm text-white/70">
                      กำลังสร้างเนื้อหาสำหรับ: {productName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {progress.isGenerating && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-site-raised border-[2px] border-black text-white text-sm font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsedTime}s</span>
                    </div>
                  )}
                  {!progress.isGenerating && (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-black/10 transition-colors border-[2px] border-transparent hover:border-black"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Status */}
              <div className="px-5 py-4 border-b-[2px] border-gray-200 bg-site-surface">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600 font-medium">
                    สถานะ:
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      progress.stage === "completed"
                        ? "text-green-600"
                        : progress.stage === "error"
                          ? "text-red-600"
                          : progress.stage === "idle"
                            ? "text-gray-500"
                            : "text-site-accent"
                    }`}
                  >
                    {getStageName(progress.stage)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-site-border/30 border-[2px] border-black overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      progress.stage === "error"
                        ? "bg-red-500"
                        : progress.stage === "completed"
                          ? "bg-green-500"
                          : "bg-site-accent"
                    }`}
                    initial={{ width: "0%" }}
                    animate={{
                      width:
                        progress.stage === "idle"
                          ? "0%"
                          : progress.stage === "preparing"
                            ? "5%"
                            : progress.stage === "generating_classification"
                              ? "15%"
                              : progress.stage === "generating_description"
                                ? "30%"
                                : progress.stage ===
                                    "generating_short_description"
                                  ? "50%"
                                  : progress.stage === "generating_meta"
                                    ? "65%"
                                    : progress.stage ===
                                        "generating_game_details"
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
              <div className="px-5 py-2 border-b-[2px] border-gray-200 bg-site-raised">
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-white transition-colors font-medium"
                >
                  <Terminal className="w-4 h-4" />
                  <span>Debug Console</span>
                  {showDebug ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <span className="ml-auto text-xs text-gray-500 bg-site-raised px-2 py-0.5 border border-gray-300">
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
                    <div className="px-5 py-3 bg-site-surface max-h-64 overflow-y-auto">
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
                      <div className="px-5 py-2 border-t-[2px] border-gray-200 bg-site-raised flex items-center justify-between">
                        <button
                          onClick={copyLogs}
                          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-white transition-colors font-medium"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>คัดลอก Logs</span>
                        </button>
                        <span className="text-xs text-gray-500">
                          LiteLLM API | Model: {selectedModel || "default"}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Model Selector */}
              <div className="px-5 py-3 border-b-[2px] border-gray-200 bg-site-surface">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  เลือก AI Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    setSelectedModel(e.target.value);
                    aiService.setModel(e.target.value);
                  }}
                  disabled={isLoadingModels || availableModels.length === 0}
                  className="w-full py-2 px-3 bg-site-raised border-[2px] border-gray-300 text-white text-sm focus:outline-none focus:border-black disabled:opacity-50"
                >
                  {isLoadingModels ? (
                    <option value="">กำลังโหลด models...</option>
                  ) : availableModels.length === 0 ? (
                    <option value="">ไม่พบ model ที่ใช้ได้</option>
                  ) : (
                    availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name || model.id}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Footer / Actions */}
              <div className="p-5 border-t-[3px] border-black bg-site-raised">
                {isConfigError ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-red-500/10 border-[3px] border-red-500/30">
                      <p className="text-sm text-red-600 font-medium">
                        กรุณาตั้งค่า LITELLM_API_KEY ในไฟล์ .env ของ server
                      </p>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-full py-2.5 bg-site-border/30 hover:bg-gray-300 text-white border border-site-border/30 rounded-[12px] font-bold transition-all"
                      style={{ boxShadow: "3px 3px 0 0 #000000" }}
                    >
                      ปิด
                    </button>
                  </div>
                ) : progress.stage === "completed" ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-green-500/10 border-[3px] border-green-500/30 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        สร้างเนื้อหาสำเร็จ! ข้อมูลถูกเติมลงในฟอร์มแล้ว
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRetry}
                        className="flex-1 py-2.5 bg-site-border/30 hover:bg-gray-300 text-white border border-site-border/30 rounded-[12px] font-bold transition-all flex items-center justify-center gap-2"
                        style={{ boxShadow: "3px 3px 0 0 #000000" }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>สร้างใหม่</span>
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="flex-1 py-2.5 bg-site-accent hover:bg-site-accent/90 text-white border border-site-border/30 rounded-[12px] font-bold transition-all"
                        style={{ boxShadow: "3px 3px 0 0 #000000" }}
                      >
                        เสร็จสิ้น
                      </button>
                    </div>
                  </div>
                ) : progress.stage === "error" ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-red-500/10 border-[3px] border-red-500/30">
                      <p className="text-sm text-red-600 font-medium">
                        {progress.error || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRetry}
                        className="flex-1 py-2.5 bg-site-border/30 hover:bg-gray-300 text-white border border-site-border/30 rounded-[12px] font-bold transition-all flex items-center justify-center gap-2"
                        style={{ boxShadow: "3px 3px 0 0 #000000" }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>ลองใหม่</span>
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="flex-1 py-2.5 bg-gray-400 hover:bg-site-surface0 text-white border border-site-border/30 rounded-[12px] font-bold transition-all"
                        style={{ boxShadow: "3px 3px 0 0 #000000" }}
                      >
                        ปิด
                      </button>
                    </div>
                  </div>
                ) : progress.isGenerating ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-site-raised text-gray-500 border-[3px] border-gray-300 font-bold cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังดำเนินการ... ({elapsedTime}s)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartGeneration}
                    className="w-full py-2.5 bg-site-accent hover:bg-site-accent/90 text-white border border-site-border/30 rounded-[12px] font-bold transition-all flex items-center justify-center gap-2"
                    style={{ boxShadow: "4px 4px 0 0 #000000" }}
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
