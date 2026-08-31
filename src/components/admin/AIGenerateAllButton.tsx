"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Sparkles,
  Wand2,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  RefreshCw,
  Save,
  XCircle,
  Play,
  Pause,
  Eye,
  SkipForward,
  Star,
  TrendingUp,
  Layers,
  ChevronDown,
} from "lucide-react";
import {
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { AdminHeaderButton, ModelSelect } from "@/components/admin";
import { cn } from "@/lib/utils";
import {
  aiService,
  GeneratedContent,
  GenerationProgress,
  AvailableCategory,
  AIModel,
} from "@/lib/services/ai-api";
import { productApi, Product, Category } from "@/lib/services/product-api";
import toast from "react-hot-toast";

// Check which fields a product is missing
function getMissingFields(product: Product): string[] {
  const missing: string[] = [];
  if (!product.description?.trim()) missing.push("คำอธิบาย");
  if (!product.shortDescription?.trim()) missing.push("คำอธิบายสั้น");
  if (!product.metaTitle?.trim()) missing.push("Meta Title");
  if (!product.metaDescription?.trim()) missing.push("Meta Desc");
  if (!product.metaKeywords?.trim()) missing.push("Keywords");
  if (!product.gameDetails?.developer?.trim()) missing.push("Developer");
  if (!product.gameDetails?.publisher?.trim()) missing.push("Publisher");
  if (
    !product.gameDetails?.platforms ||
    product.gameDetails.platforms.length === 0
  )
    missing.push("Platforms");
  return missing;
}

// Check if product has any existing data worth viewing
function hasAnyData(product: Product): boolean {
  return (
    !!product.description?.trim() ||
    !!product.shortDescription?.trim() ||
    !!product.metaTitle?.trim() ||
    !!product.metaDescription?.trim() ||
    !!product.metaKeywords?.trim() ||
    !!product.gameDetails?.developer?.trim() ||
    !!product.gameDetails?.publisher?.trim() ||
    (product.gameDetails?.platforms &&
      product.gameDetails.platforms.length > 0) ||
    false
  );
}

// Build a display object from existing product data (same shape as GeneratedContent)
function productToDisplayData(product: Product): GeneratedContent {
  return {
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    metaTitle: product.metaTitle || "",
    metaDescription: product.metaDescription || "",
    metaKeywords: product.metaKeywords || "",
    gameDetails: {
      developer: product.gameDetails?.developer || "",
      publisher: product.gameDetails?.publisher || "",
      platforms: product.gameDetails?.platforms || [],
    },
  };
}

// Per-product generation state
interface ProductGenerationState {
  product: Product;
  categoryName?: string;
  status:
  | "pending"
  | "generating"
  | "completed"
  | "saved"
  | "error"
  | "skipped"
  | "cancelled";
  progress?: GenerationProgress;
  results?: GeneratedContent;
  error?: string;
  expanded: boolean;
  elapsedTime: number;
  missingFields: string[];
  isComplete: boolean;
}

interface AIGenerateAllButtonProps {
  products: Product[];
  categories: Category[];
}

type AutoSavePolicy = "manual" | "auto";

type PreflightStatus = {
  configured: boolean;
  networkOk: boolean;
  modelReady: boolean;
  ready: boolean;
  message: string;
};

export default function AIGenerateAllButton({
  products,
  categories,
}: AIGenerateAllButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [productStates, setProductStates] = useState<ProductGenerationState[]>(
    [],
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [skipComplete, setSkipComplete] = useState(true);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const abortRef = useRef(false);
  const pauseRef = useRef(false);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // AI Model selection state
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isCheckingPreflight, setIsCheckingPreflight] = useState(false);
  const [showPreflight, setShowPreflight] = useState(false);
  const [preflight, setPreflight] = useState<PreflightStatus>({
    configured: false,
    networkOk: false,
    modelReady: false,
    ready: false,
    message: "ยังไม่ได้ตรวจสอบ",
  });
  const [autoSavePolicy, setAutoSavePolicy] = useState<AutoSavePolicy>("manual");

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
        console.error("[AIGenerateAllButton] Failed to fetch models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, [selectedModel]);

  const runPreflight = useCallback(async () => {
    setIsCheckingPreflight(true);
    try {
      const configured = await aiService.isConfigured();
      let models = availableModels;
      if (models.length === 0) {
        models = await aiService.fetchModels();
        setAvailableModels(models);
      }

      const modelReady = Boolean(
        (selectedModel && models.some((m) => m.id === selectedModel)) ||
        models.length > 0
      );
      if (!selectedModel && models.length > 0) {
        const defaultModel = aiService.getSelectedModel() || models[0].id;
        setSelectedModel(defaultModel);
        aiService.setModel(defaultModel);
      }

      const status: PreflightStatus = {
        configured,
        networkOk: true,
        modelReady,
        ready: configured && modelReady,
        message: configured
          ? modelReady
            ? "พร้อมใช้งาน"
            : "ยังไม่พบโมเดลที่ใช้งานได้"
          : "ยังไม่ได้ตั้งค่า AI service",
      };
      setPreflight(status);
      return status;
    } catch {
      const status: PreflightStatus = {
        configured: false,
        networkOk: false,
        modelReady: false,
        ready: false,
        message: "ไม่สามารถเชื่อมต่อ AI service ได้",
      };
      setPreflight(status);
      return status;
    } finally {
      setIsCheckingPreflight(false);
    }
  }, [availableModels, selectedModel]);

  // Initialize product states when modal opens
  const initializeStates = useCallback(() => {
    const states: ProductGenerationState[] = products.map((product) => {
      const missing = getMissingFields(product);
      return {
        product,
        categoryName: categories.find((c) => c.id === product.categoryId)?.name,
        status: "pending" as const,
        expanded: false,
        elapsedTime: 0,
        missingFields: missing,
        isComplete: missing.length === 0,
      };
    });
    setProductStates(states);
    setIsRunning(false);
    setIsPaused(false);
    setTotalElapsed(0);
    abortRef.current = false;
    pauseRef.current = false;
  }, [products, categories]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, []);

  // Open modal
  const handleOpen = () => {
    initializeStates();
    setIsOpen(true);
    void runPreflight();
  };

  // Close modal request
  const requestClose = () => {
    if (isRunning) {
      setShowCloseConfirm(true);
    } else {
      setIsOpen(false);
      setIsRunning(false);
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    }
  };

  const handleConfirmClose = () => {
    abortRef.current = true;
    setShowCloseConfirm(false);
    setIsOpen(false);
    setIsRunning(false);
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
  };

  // Update a single product state
  const updateProductState = useCallback(
    (
      index: number,
      updater: (prev: ProductGenerationState) => ProductGenerationState,
    ) => {
      setProductStates((prev) =>
        prev.map((s, i) => (i === index ? updater(s) : s)),
      );
    },
    [],
  );

  // Save single product to database
  const saveProduct = async (index: number, silent = false) => {
    const state = productStates[index];
    if (!state || !state.results) return;

    try {
      let categoryId = state.product.categoryId;
      if (state.results.categorySlug) {
        const matchedCategory = categories.find(
          (c) => c.slug === state.results!.categorySlug,
        );
        if (matchedCategory) {
          categoryId = matchedCategory.id;
        }
      }

      const updateData: Record<string, unknown> = {
        description: state.results.description,
        shortDescription: state.results.shortDescription,
        metaTitle: state.results.metaTitle,
        metaDescription: state.results.metaDescription,
        metaKeywords: state.results.metaKeywords,
        gameDetails: {
          developer: state.results.gameDetails?.developer || "",
          publisher: state.results.gameDetails?.publisher || "",
          platforms: state.results.gameDetails?.platforms || [],
        },
        categoryId,
      };

      if (state.results.isFeatured !== undefined) {
        updateData.isFeatured = state.results.isFeatured;
      }
      if (state.results.isBestseller !== undefined) {
        updateData.isBestseller = state.results.isBestseller;
      }

      const response = await productApi.updateProduct(
        state.product.id,
        updateData,
      );
      if (response.success) {
        updateProductState(index, (prev) => ({
          ...prev,
          status: "saved",
        }));
        if (!silent) toast.success(`บันทึก ${state.product.name} สำเร็จ!`);
      } else {
        if (!silent) toast.error(`ไม่สามารถบันทึก ${state.product.name} ได้`);
      }
    } catch {
      if (!silent) toast.error(`เกิดข้อผิดพลาดในการบันทึก ${state.product.name}`);
    }
  };

  // Start batch generation
  const startGeneration = useCallback(async () => {
    const status = await runPreflight();
    if (!status.ready) {
      toast.error(`ยังไม่พร้อมเริ่มงาน: ${status.message}`);
      return;
    }

    if (selectedModel) {
      aiService.setModel(selectedModel);
    }

    setIsRunning(true);
    setIsPaused(false);
    abortRef.current = false;
    pauseRef.current = false;
    startTimeRef.current = Date.now();

    totalTimerRef.current = setInterval(() => {
      setTotalElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    for (let i = 0; i < products.length; i++) {
      if (abortRef.current) break;

      while (pauseRef.current && !abortRef.current) {
        await new Promise((r) => setTimeout(r, 500));
      }

      if (abortRef.current) break;

      const currentState = await new Promise<ProductGenerationState>(
        (resolve) => {
          setProductStates((prev) => {
            resolve(prev[i]);
            return prev;
          });
        },
      );

      if (
        currentState.status === "saved" ||
        currentState.status === "skipped"
      ) {
        continue;
      }

      if (skipComplete && currentState.isComplete) {
        setProductStates((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "skipped" as const } : s,
          ),
        );
        continue;
      }

      const productStartTime = Date.now();
      let productTimer: NodeJS.Timeout | null = null;

      productTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - productStartTime) / 1000);
        setProductStates((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, elapsedTime: elapsed } : s,
          ),
        );
      }, 1000);

      setProductStates((prev) =>
        prev.map((s, idx) =>
          idx === i
            ? {
              ...s,
              status: "generating" as const,
              error: undefined,
              results: undefined,
              elapsedTime: 0,
            }
            : s,
        ),
      );

      try {
        const product = products[i];
        const categoryName = categories.find(
          (c) => c.id === product.categoryId,
        )?.name;

        const availableCategories: AvailableCategory[] = categories.map(
          (c) => ({
            name: c.name,
            slug: c.slug,
          }),
        );

        const handleProgress = (progress: GenerationProgress) => {
          setProductStates((prev) =>
            prev.map((s, idx) => {
              if (idx !== i) return s;
              const newState = { ...s, progress };
              if (progress.stage === "completed" && progress.results) {
                newState.status = "completed";
                newState.results = progress.results;
              }
              return newState;
            }),
          );
        };

        await aiService.generateProductContent(
          product.name,
          product.productType,
          categoryName,
          handleProgress,
          availableCategories,
        );

        if (autoSavePolicy === "auto") {
          await saveProduct(i, true);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        setProductStates((prev) =>
          prev.map((s, idx) =>
            idx === i
              ? { ...s, status: "error" as const, error: errorMessage }
              : s,
          ),
        );
      }

      if (productTimer) clearInterval(productTimer);

      if (i < products.length - 1 && !abortRef.current) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    setIsRunning(false);
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
  }, [products, categories, skipComplete, selectedModel, runPreflight, autoSavePolicy]);

  // Pause/Resume
  const togglePause = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(pauseRef.current);
  };

  // Cancel generation
  const cancelGeneration = () => {
    abortRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
  };

  // Save all completed products
  const saveAllCompleted = async () => {
    const completedIndexes = productStates
      .map((s, i) => (s.status === "completed" ? i : -1))
      .filter((i) => i >= 0);

    if (completedIndexes.length === 0) {
      toast.error("ไม่มีสินค้าที่พร้อมบันทึก");
      return;
    }

    for (const index of completedIndexes) {
      await saveProduct(index);
    }
  };

  // Regenerate single product
  const regenerateProduct = async (index: number) => {
    const state = productStates[index];
    if (!state) return;

    const status = await runPreflight();
    if (!status.ready) {
      toast.error(`ยังไม่พร้อมเริ่มงาน: ${status.message}`);
      return;
    }

    if (selectedModel) {
      aiService.setModel(selectedModel);
    }

    const productStartTime = Date.now();
    let productTimer: NodeJS.Timeout | null = null;

    productTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - productStartTime) / 1000);
      setProductStates((prev) =>
        prev.map((s, idx) =>
          idx === index ? { ...s, elapsedTime: elapsed } : s,
        ),
      );
    }, 1000);

    setProductStates((prev) =>
      prev.map((s, idx) =>
        idx === index
          ? {
            ...s,
            status: "generating" as const,
            error: undefined,
            results: undefined,
            progress: undefined,
            elapsedTime: 0,
          }
          : s,
      ),
    );

    try {
      const handleProgress = (progress: GenerationProgress) => {
        setProductStates((prev) =>
          prev.map((s, idx) => {
            if (idx !== index) return s;
            const newState = { ...s, progress };
            if (progress.stage === "completed" && progress.results) {
              newState.status = "completed";
              newState.results = progress.results;
            }
            return newState;
          }),
        );
      };

      const availableCategories: AvailableCategory[] = categories.map((c) => ({
        name: c.name,
        slug: c.slug,
      }));

      await aiService.generateProductContent(
        state.product.name,
        state.product.productType,
        state.categoryName,
        handleProgress,
        availableCategories,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setProductStates((prev) =>
        prev.map((s, idx) =>
          idx === index
            ? { ...s, status: "error" as const, error: errorMessage }
            : s,
        ),
      );
    }

    if (productTimer) clearInterval(productTimer);
  };

  // Skip single product
  const skipProduct = (index: number) => {
    updateProductState(index, (prev) => ({
      ...prev,
      status: "skipped",
    }));
  };

  // Cancel single product (discard results)
  const cancelProduct = (index: number) => {
    updateProductState(index, (prev) => ({
      ...prev,
      status: "cancelled",
      results: undefined,
    }));
  };

  // Toggle expand
  const toggleExpand = (index: number) => {
    updateProductState(index, (prev) => ({
      ...prev,
      expanded: !prev.expanded,
    }));
  };

  // Stats
  const stats = {
    total: productStates.length,
    pending: productStates.filter((s) => s.status === "pending").length,
    generating: productStates.filter((s) => s.status === "generating").length,
    completed: productStates.filter((s) => s.status === "completed").length,
    saved: productStates.filter((s) => s.status === "saved").length,
    error: productStates.filter((s) => s.status === "error").length,
    skipped: productStates.filter(
      (s) => s.status === "skipped" || s.status === "cancelled",
    ).length,
    completeProducts: productStates.filter((s) => s.isComplete).length,
    incompleteProducts: productStates.filter((s) => !s.isComplete).length,
  };

  const progressPercent =
    stats.total > 0
      ? Math.round(
        ((stats.completed + stats.saved + stats.error + stats.skipped) /
          stats.total) *
        100,
      )
      : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyDebugInfo = async (index: number) => {
    const state = productStates[index];
    if (!state) return;

    const debugInfo = {
      productId: state.product.id,
      productName: state.product.name,
      status: state.status,
      error: state.error,
      progressStage: state.progress?.stage,
      model: selectedModel || aiService.getSelectedModel(),
      preflight,
      timestamp: new Date().toISOString(),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
      toast.success("คัดลอก debug info แล้ว");
    } catch {
      toast.error("คัดลอก debug info ไม่สำเร็จ");
    }
  };

  const retryFailedOnly = async () => {
    const failedIndexes = productStates
      .map((state, index) => ({ state, index }))
      .filter(({ state }) => state.status === "error")
      .map(({ index }) => index);

    if (failedIndexes.length === 0) {
      toast.error("ไม่มีรายการที่ล้มเหลวให้ลองใหม่");
      return;
    }

    for (const index of failedIndexes) {
      await regenerateProduct(index);
    }
  };

  const getStatusBadge = (
    status: ProductGenerationState["status"],
    isComplete?: boolean,
  ) => {
    switch (status) {
      case "pending":
        return <Badge variant="neutral">รอดำเนินการ</Badge>;
      case "generating":
        return (
          <Badge variant="info" className="animate-pulse">
            กำลัง Generate...
          </Badge>
        );
      case "completed":
        return <Badge variant="warning">รอยืนยัน</Badge>;
      case "saved":
        return <Badge variant="success">บันทึกแล้ว</Badge>;
      case "error":
        return <Badge variant="danger">ผิดพลาด</Badge>;
      case "skipped":
        return isComplete ? (
          <Badge variant="success">
            <CheckCircle2 className="w-3 h-3" />
            ข้อมูลครบ - ข้าม
          </Badge>
        ) : (
          <Badge variant="neutral">ข้าม</Badge>
        );
      case "cancelled":
        return <Badge variant="neutral">ยกเลิก</Badge>;
    }
  };

  const getStageName = (stage?: string) => {
    const stages: Record<string, string> = {
      idle: "รอเริ่มต้น",
      preparing: "เตรียมข้อมูล",
      generating_classification: "จัดหมวดหมู่",
      generating_description: "สร้างคำอธิบาย",
      generating_short_description: "สร้างคำอธิบายสั้น",
      generating_meta: "สร้าง SEO Meta",
      generating_game_details: "สร้างข้อมูลเกม",
      parsing: "ประมวลผล",
      completed: "เสร็จสมบูรณ์",
      error: "ผิดพลาด",
    };
    return stages[stage || "idle"] || stage || "";
  };

  const getStageProgress = (stage?: string) => {
    const stagePercents: Record<string, number> = {
      idle: 0,
      preparing: 5,
      generating_classification: 15,
      generating_description: 30,
      generating_short_description: 50,
      generating_meta: 65,
      generating_game_details: 80,
      parsing: 90,
      completed: 100,
      error: 100,
    };
    return stagePercents[stage || "idle"] || 0;
  };

  return (
    <>
      {/* Trigger Button */}
      <AdminHeaderButton
        variant="accentSoft"
        onClick={handleOpen}
        disabled={products.length === 0}
      >
        <Wand2 className="h-4 w-4" />
        <span>AI Generate ทั้งหมด</span>
        <Sparkles className="h-3.5 w-3.5 opacity-70" />
      </AdminHeaderButton>

      {/* Modal */}
      <DialogPrimitive.Root
        open={isOpen}
        onOpenChange={(next) => {
          if (!next) requestClose();
        }}
      >
        <DialogPortal>
          <DialogOverlay className="bg-black/60 backdrop-blur-sm z-[80]" />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col max-h-[90vh] bg-site-surface border border-site-border rounded-12 shadow-2xl focus:outline-none overflow-hidden",
            )}
            onEscapeKeyDown={(e) => {
              e.preventDefault();
              requestClose();
            }}
            onPointerDownOutside={(e) => {
              if (isRunning) e.preventDefault();
            }}
            aria-describedby={undefined}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-site-border-soft bg-site-surface shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-8 bg-site-accent/10 border border-site-accent/20 text-site-accent">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <DialogPrimitive.Title className="text-base font-bold text-site-text">
                    AI Generate ทุกเกม
                  </DialogPrimitive.Title>
                  <p className="text-xs text-site-muted">
                    สร้างเนื้อหาอัตโนมัติสำหรับ{" "}
                    {skipComplete
                      ? `${stats.incompleteProducts} จาก ${stats.total}`
                      : stats.total}{" "}
                    สินค้า
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isRunning && (
                  <Badge variant="info" className="gap-1.5 px-3 py-1 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(totalElapsed)}</span>
                  </Badge>
                )}
                <button
                  onClick={requestClose}
                  className="p-1.5 rounded-lg text-site-dim hover:bg-site-raised hover:text-site-text transition-colors focus:outline-none"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="px-6 py-4 border-b border-site-border-soft bg-site-raised/30 shrink-0 space-y-4">
              {/* Model Selector + Auto Save */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-site-muted uppercase tracking-wider">
                    เลือก AI Model
                  </label>
                  <ModelSelect
                    models={availableModels}
                    value={selectedModel}
                    onValueChange={(v) => {
                      setSelectedModel(v);
                      aiService.setModel(v);
                    }}
                    disabled={isLoadingModels || availableModels.length === 0 || isRunning}
                    loading={isLoadingModels}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-site-muted uppercase tracking-wider">
                    Auto-save policy
                  </label>
                  <Select
                    value={autoSavePolicy}
                    onValueChange={(v) => setAutoSavePolicy(v as AutoSavePolicy)}
                    disabled={isRunning}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">รอยืนยันทีละรายการ</SelectItem>
                      <SelectItem value="auto">บันทึกทันทีเมื่อเสร็จ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preflight (collapsed by default, toggle to expand) */}
              <div className="p-3.5 rounded-8 border border-site-border-soft bg-site-surface/80 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowPreflight((v) => !v)}
                  className="w-full flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none text-left"
                  aria-expanded={showPreflight}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        preflight.ready
                          ? "bg-status-success"
                          : "bg-status-warning"
                      )}
                    />
                    <span className="text-xs font-semibold text-site-text uppercase tracking-wider">
                      Preflight Check
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        preflight.ready
                          ? "text-status-success"
                          : "text-status-warning"
                      )}
                    >
                      · {preflight.message}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-site-dim transition-transform",
                      showPreflight && "rotate-180"
                    )}
                  />
                </button>
                {showPreflight && (
                  <>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void runPreflight()}
                        disabled={isCheckingPreflight || isRunning}
                        className="h-7 text-xs"
                      >
                        {isCheckingPreflight
                          ? "กำลังตรวจสอบ..."
                          : "ตรวจสอบอีกครั้ง"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Badge
                        variant={preflight.configured ? "success" : "danger"}
                        className="justify-center py-1 w-full text-xs"
                      >
                        Config: {preflight.configured ? "พร้อม" : "ไม่พร้อม"}
                      </Badge>
                      <Badge
                        variant={preflight.modelReady ? "success" : "warning"}
                        className="justify-center py-1 w-full text-xs"
                      >
                        Model: {preflight.modelReady ? "พร้อม" : "ยังไม่พร้อม"}
                      </Badge>
                      <Badge
                        variant={preflight.networkOk ? "success" : "danger"}
                        className="justify-center py-1 w-full text-xs"
                      >
                        Network:{" "}
                        {preflight.networkOk ? "เชื่อมต่อได้" : "เชื่อมต่อไม่ได้"}
                      </Badge>
                    </div>
                    <p
                      className={cn(
                        "text-xs font-medium",
                        preflight.ready
                          ? "text-status-success"
                          : "text-status-warning"
                      )}
                    >
                      สถานะ: {preflight.message}
                    </p>
                  </>
                )}
              </div>

              {/* Skip complete checkbox + completeness summary */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <Checkbox
                    checked={skipComplete}
                    onCheckedChange={(checked) => setSkipComplete(!!checked)}
                    disabled={isRunning}
                  />
                  <span className="text-xs font-medium text-site-text">
                    ข้ามสินค้าที่มีข้อมูลครบแล้ว
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    ข้อมูลครบ: {stats.completeProducts}
                  </Badge>
                  <Badge variant="neutral" className="text-xs">
                    <AlertCircle className="w-3 h-3" />
                    ข้อมูลไม่ครบ: {stats.incompleteProducts}
                  </Badge>
                </div>
              </div>

              {/* Progress Summary & Overall Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-site-muted">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span>
                      ทั้งหมด: <strong className="text-site-text">{stats.total}</strong>
                    </span>
                    {stats.completed > 0 && (
                      <span className="text-status-warning">
                        รอยืนยัน: <strong>{stats.completed}</strong>
                      </span>
                    )}
                    {stats.saved > 0 && (
                      <span className="text-status-success">
                        บันทึกแล้ว: <strong>{stats.saved}</strong>
                      </span>
                    )}
                    {stats.error > 0 && (
                      <span className="text-status-danger">
                        ผิดพลาด: <strong>{stats.error}</strong>
                      </span>
                    )}
                    {stats.generating > 0 && (
                      <span className="text-status-info">
                        กำลังทำ: <strong>{stats.generating}</strong>
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-site-text">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full bg-site-raised rounded-full overflow-hidden border border-site-border-soft">
                  <div
                    className="h-full bg-site-accent transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto divide-y divide-site-border-soft">
              {productStates.map((state, index) => (
                <div
                  key={state.product.id}
                  className={cn(
                    "transition-colors",
                    state.status === "generating"
                      ? "bg-status-info/5"
                      : state.status === "saved"
                      ? "bg-status-success/5"
                      : state.status === "skipped" && state.isComplete
                      ? "bg-site-surface opacity-75"
                      : "hover:bg-site-raised/30"
                  )}
                >
                  {/* Product Row */}
                  <div className="px-6 py-3.5 flex items-center gap-4">
                    {/* Index */}
                    <span className="text-xs text-site-dim font-mono w-6 text-right shrink-0">
                      {index + 1}
                    </span>

                    {/* Product Image */}
                    {state.product.imageUrl ? (
                      <img
                        src={state.product.imageUrl}
                        alt={state.product.name}
                        className="w-9 h-9 object-cover rounded-6 border border-site-border-soft shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-site-raised rounded-6 border border-site-border-soft shrink-0" />
                    )}

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-site-text text-sm truncate">
                          {state.product.name}
                        </span>
                        {getStatusBadge(state.status, state.isComplete)}
                        {/* Completeness badge */}
                        {state.status === "pending" && state.isComplete && (
                          <Badge variant="success" className="text-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            ข้อมูลครบ
                          </Badge>
                        )}
                        {state.status === "pending" &&
                          !state.isComplete && (
                            <Badge variant="neutral" className="text-xs">
                              <AlertCircle className="w-3 h-3" />
                              ขาด {state.missingFields.length} ฟิลด์
                            </Badge>
                          )}
                      </div>

                      {/* Missing fields detail */}
                      {state.status === "pending" &&
                        !state.isComplete &&
                        state.missingFields.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {state.missingFields.map((field) => (
                              <Badge
                                key={field}
                                variant="neutral"
                                className="text-[10px] py-0 px-1.5"
                              >
                                {field}
                              </Badge>
                            ))}
                          </div>
                        )}

                      {/* Mini Progress for generating state */}
                      {state.status === "generating" && state.progress && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-site-raised rounded-full overflow-hidden border border-site-border-soft">
                            <div
                              className="h-full bg-site-accent transition-all duration-300"
                              style={{
                                width: `${getStageProgress(state.progress.stage)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-status-info font-medium shrink-0">
                            {getStageName(state.progress.stage)}
                          </span>
                          <span className="text-xs text-site-dim shrink-0">
                            {state.elapsedTime}s
                          </span>
                        </div>
                      )}

                      {/* Error message */}
                      {state.status === "error" && state.error && (
                        <div className="mt-2 p-2.5 rounded-6 border border-status-danger/30 bg-status-danger/10 text-xs text-status-danger space-y-0.5">
                          <p><strong>เกิดอะไรขึ้น:</strong> {state.error}</p>
                          <p><strong>กระทบอะไร:</strong> รายการนี้ยังไม่ถูก Generate/บันทึก</p>
                          <p><strong>ต้องทำอะไรต่อ:</strong> กด Retry หรือคัดลอก debug info ส่งทีม dev</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* View Details button */}
                      {(state.results || hasAnyData(state.product)) &&
                        state.status !== "generating" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(index)}
                            className={cn(
                              "h-8 w-8 p-0 rounded-6",
                              state.expanded && "bg-site-raised text-site-text"
                            )}
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}

                      {/* Save button */}
                      {state.status === "completed" && state.results && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => saveProduct(index)}
                          className="h-8 w-8 p-0 rounded-6 bg-status-success text-site-bg hover:bg-status-success/90"
                          title="ยืนยัน - บันทึกลง Database"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Regenerate button */}
                      {state.status !== "generating" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateProduct(index)}
                          className="h-8 w-8 p-0 rounded-6"
                          title="Regenerate"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Copy debug info for failed */}
                      {state.status === "error" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyDebugInfo(index)}
                          className="h-8 w-8 p-0 rounded-6 text-status-danger hover:text-status-danger"
                          title="คัดลอก debug info"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Cancel/Discard button */}
                      {state.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelProduct(index)}
                          className="h-8 w-8 p-0 rounded-6 text-status-danger hover:text-status-danger"
                          title="ยกเลิก - ไม่ใช้ผลลัพธ์"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Skip button (only when pending and batch running) */}
                      {state.status === "pending" && isRunning && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => skipProduct(index)}
                          className="h-8 w-8 p-0 rounded-6"
                          title="ข้ามสินค้านี้"
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {state.expanded &&
                    (state.results || hasAnyData(state.product)) &&
                    (() => {
                      const isShowingDbData = !state.results;
                      const displayData =
                        state.results ||
                        productToDisplayData(state.product);
                      const headerLabel = isShowingDbData
                        ? "ข้อมูลปัจจุบัน (DB)"
                        : "ข้อมูลที่ AI สร้าง";
                      const headerVariant: BadgeVariant = isShowingDbData
                        ? "neutral"
                        : "info";

                      return (
                        <div className="px-6 pb-4 pt-1 ml-14 space-y-3 bg-site-surface/50 border-t border-site-border-soft">
                          {/* Source label */}
                          <div className="flex items-center gap-2">
                            <Badge variant={headerVariant} className="text-xs">
                              {isShowingDbData ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <Sparkles className="w-3 h-3" />
                              )}
                              {headerLabel}
                            </Badge>
                          </div>

                          {/* Diff view: DB vs AI */}
                          {!isShowingDbData && hasAnyData(state.product) && (
                            <div className="p-3 rounded-8 border border-site-border bg-site-raised/40">
                              <h5 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-2">
                                เปรียบเทียบก่อนบันทึก (เดิม vs AI ใหม่)
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="p-2.5 rounded-6 border border-site-border bg-site-surface">
                                  <p className="text-xs font-semibold text-site-muted mb-1">
                                    ของเดิม (DB)
                                  </p>
                                  <p className="text-site-text line-clamp-3 leading-relaxed">
                                    {state.product.description || "-"}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-6 border border-status-success/40 bg-status-success/10">
                                  <p className="text-xs font-semibold text-status-success mb-1">
                                    AI ใหม่
                                  </p>
                                  <p className="text-site-text line-clamp-3 leading-relaxed">
                                    {displayData.description || "-"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Description */}
                          <div className="p-3 rounded-8 border border-site-border bg-site-surface">
                            <h5 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-1.5">
                              คำอธิบาย
                            </h5>
                            <p className="text-xs text-site-text whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
                              {displayData.description || (
                                <span className="text-site-dim italic">
                                  ไม่มีข้อมูล
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Short Description */}
                          <div className="p-3 rounded-8 border border-site-border bg-site-surface">
                            <h5 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-1.5">
                              คำอธิบายสั้น
                            </h5>
                            <p className="text-xs text-site-text leading-relaxed">
                              {displayData.shortDescription || (
                                <span className="text-site-dim italic">
                                  ไม่มีข้อมูล
                                </span>
                              )}
                            </p>
                          </div>

                          {/* SEO Meta */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 rounded-8 border border-site-border bg-site-surface">
                              <h5 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-1">
                                Meta Title
                              </h5>
                              <p className="text-xs text-site-text">
                                {displayData.metaTitle || (
                                  <span className="text-site-dim italic">
                                    ไม่มีข้อมูล
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="p-3 rounded-8 border border-site-border bg-site-surface">
                              <h5 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-1">
                                Meta Description
                              </h5>
                              <p className="text-xs text-site-text">
                                {displayData.metaDescription || (
                                  <span className="text-site-dim italic">
                                    ไม่มีข้อมูล
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="p-3 rounded-8 border border-site-border bg-site-surface">
                              <h5 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-1">
                                Meta Keywords
                              </h5>
                              <p className="text-xs text-site-text">
                                {displayData.metaKeywords || (
                                  <span className="text-site-dim italic">
                                    ไม่มีข้อมูล
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Game Details */}
                          {displayData.gameDetails && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="p-3 rounded-8 border border-site-border bg-site-surface">
                                <h5 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-1">
                                  Developer
                                </h5>
                                <p className="text-xs text-site-text">
                                  {displayData.gameDetails.developer || (
                                    <span className="text-site-dim italic">
                                      ไม่มีข้อมูล
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="p-3 rounded-8 border border-site-border bg-site-surface">
                                <h5 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-1">
                                  Publisher
                                </h5>
                                <p className="text-xs text-site-text">
                                  {displayData.gameDetails.publisher || (
                                    <span className="text-site-dim italic">
                                      ไม่มีข้อมูล
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="p-3 rounded-8 border border-site-border bg-site-surface">
                                <h5 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-1">
                                  Platforms
                                </h5>
                                {displayData.gameDetails.platforms.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {displayData.gameDetails.platforms.map((p) => (
                                      <Badge
                                        key={p}
                                        variant="neutral"
                                        className="text-[10px]"
                                      >
                                        {p}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-site-dim italic">
                                    ไม่มีข้อมูล
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* AI Classification */}
                          {!isShowingDbData &&
                            (displayData.categorySlug ||
                              displayData.isFeatured !== undefined ||
                              displayData.isBestseller !== undefined) && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-3 rounded-8 border border-site-border bg-site-surface">
                                  <h5 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Layers className="w-3 h-3" />
                                    AI หมวดหมู่
                                  </h5>
                                  <p className="text-xs text-site-text font-medium">
                                    {displayData.categoryName ||
                                      displayData.categorySlug || (
                                        <span className="text-site-dim italic">
                                          ไม่มีข้อมูล
                                        </span>
                                      )}
                                  </p>
                                  {displayData.categorySlug && (
                                    <p className="text-[10px] text-site-dim mt-0.5">
                                      {displayData.categorySlug}
                                    </p>
                                  )}
                                </div>
                                <div className="p-3 rounded-8 border border-site-border bg-site-surface">
                                  <h5 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    สินค้าแนะนำ
                                  </h5>
                                  <Badge
                                    variant={displayData.isFeatured ? "warning" : "neutral"}
                                    className="text-xs"
                                  >
                                    {displayData.isFeatured ? "Featured" : "ไม่ใช่"}
                                  </Badge>
                                </div>
                                <div className="p-3 rounded-8 border border-site-border bg-site-surface">
                                  <h5 className="text-[11px] font-bold text-site-dim uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    สินค้าขายดี
                                  </h5>
                                  <Badge
                                    variant={displayData.isBestseller ? "success" : "neutral"}
                                    className="text-xs"
                                  >
                                    {displayData.isBestseller ? "Bestseller" : "ไม่ใช่"}
                                  </Badge>
                                </div>
                              </div>
                            )}

                          {/* Per-item actions */}
                          {!isShowingDbData && state.status === "completed" && (
                            <div className="flex gap-2 pt-1">
                              <Button
                                size="sm"
                                onClick={() => saveProduct(index)}
                                className="gap-1.5 bg-status-success text-site-bg hover:bg-status-success/90"
                              >
                                <Save className="w-3.5 h-3.5" />
                                ยืนยัน - บันทึก
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => regenerateProduct(index)}
                                className="gap-1.5"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Regenerate
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelProduct(index)}
                                className="gap-1.5 text-status-danger hover:text-status-danger"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                ยกเลิก
                              </Button>
                            </div>
                          )}

                          {isShowingDbData && state.status !== "generating" && (
                            <div className="flex gap-2 pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => regenerateProduct(index)}
                                className="gap-1.5"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Generate ใหม่ด้วย AI
                              </Button>
                            </div>
                          )}

                          {state.status === "saved" && (
                            <div className="p-2.5 rounded-6 bg-status-success/10 border border-status-success/20 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-status-success" />
                              <span className="text-xs text-status-success font-medium">
                                บันทึกลง Database เรียบร้อยแล้ว
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-site-border-soft bg-site-surface shrink-0 flex flex-wrap items-center justify-between gap-3">
              {/* Left side */}
              <div className="flex items-center gap-2 flex-wrap">
                {!isRunning &&
                  stats.pending > 0 &&
                  stats.completed === 0 &&
                  stats.saved === 0 && (
                    <Button
                      onClick={startGeneration}
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>เริ่ม Generate ทั้งหมด</span>
                    </Button>
                  )}

                {!isRunning &&
                  (stats.completed > 0 || stats.error > 0) &&
                  stats.pending > 0 && (
                    <Button
                      onClick={startGeneration}
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>ดำเนินการต่อ</span>
                    </Button>
                  )}

                {!isRunning && stats.error > 0 && (
                  <Button
                    variant="outline"
                    onClick={retryFailedOnly}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>ลองใหม่เฉพาะที่ล้มเหลว ({stats.error})</span>
                  </Button>
                )}

                {isRunning && (
                  <>
                    <Button
                      variant={isPaused ? "default" : "secondary"}
                      onClick={togglePause}
                      className="gap-2"
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-4 h-4" />
                          <span>ดำเนินการต่อ</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>หยุดชั่วคราว</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={cancelGeneration}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span>หยุดทั้งหมด</span>
                    </Button>
                  </>
                )}
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2">
                {stats.completed > 0 && !isRunning && (
                  <Button
                    onClick={saveAllCompleted}
                    className="gap-2 bg-status-success text-site-bg hover:bg-status-success/90"
                  >
                    <Save className="w-4 h-4" />
                    <span>บันทึกทั้งหมด ({stats.completed})</span>
                  </Button>
                )}

                {!isRunning && (
                  <Button
                    variant="outline"
                    onClick={requestClose}
                  >
                    ปิด
                  </Button>
                )}
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </DialogPrimitive.Root>

      {/* Confirm Close while running */}
      <ConfirmDialog
        open={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleConfirmClose}
        title="หยุดการ Generate ทั้งหมด?"
        description="กำลัง Generate อยู่ หากปิดหน้าต่างนี้ การ Generate ทั้งหมดจะหยุดทันที"
        confirmLabel="หยุดและปิด"
        cancelLabel="ทำรายการต่อ"
        destructive
      />
    </>
  );
}
