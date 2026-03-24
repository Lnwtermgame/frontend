"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
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
} from "lucide-react";
import {
  aiService,
  GeneratedContent,
  GenerationProgress,
  AvailableCategory,
  AIModel,
} from "@/lib/services/ai-api";
import { productApi, Product, Category } from "@/lib/services/product-api";
import toast from "react-hot-toast";

// Fields that AI generates - used for completeness checking
const AI_FIELDS = [
  { key: "description", label: "คำอธิบาย" },
  { key: "shortDescription", label: "คำอธิบายสั้น" },
  { key: "metaTitle", label: "Meta Title" },
  { key: "metaDescription", label: "Meta Desc" },
  { key: "metaKeywords", label: "Keywords" },
  { key: "developer", label: "Developer" },
  { key: "publisher", label: "Publisher" },
  { key: "platforms", label: "Platforms" },
] as const;

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

// Check if product has all AI-generated fields complete
function isProductComplete(product: Product): boolean {
  return getMissingFields(product).length === 0;
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

export default function AIGenerateAllButton({
  products,
  categories,
}: AIGenerateAllButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [productStates, setProductStates] = useState<ProductGenerationState[]>(
    [],
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [skipComplete, setSkipComplete] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const abortRef = useRef(false);
  const pauseRef = useRef(false);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

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
        console.error("[AIGenerateAllButton] Failed to fetch models:", error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    fetchModels();
  }, [selectedModel]);

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
    setCurrentIndex(-1);
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Open modal
  const handleOpen = () => {
    initializeStates();
    setIsOpen(true);
  };

  // Close modal
  const handleClose = () => {
    if (isRunning) {
      if (
        !confirm(
          "กำลัง Generate อยู่ คุณแน่ใจหรือไม่ที่จะปิด? การ Generate จะหยุดทันที",
        )
      )
        return;
      abortRef.current = true;
    }
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

  // Generate content for a single product
  const generateForProduct = useCallback(
    async (index: number): Promise<boolean> => {
      return new Promise(async (resolve) => {
        const state = productStates[index];
        if (!state) {
          resolve(false);
          return;
        }

        const productStartTime = Date.now();
        let productTimer: NodeJS.Timeout | null = null;

        // Start per-product timer
        productTimer = setInterval(() => {
          const elapsed = Math.floor((Date.now() - productStartTime) / 1000);
          updateProductState(index, (prev) => ({
            ...prev,
            elapsedTime: elapsed,
          }));
        }, 1000);

        updateProductState(index, (prev) => ({
          ...prev,
          status: "generating",
          error: undefined,
          results: undefined,
        }));

        try {
          const handleProgress = (progress: GenerationProgress) => {
            updateProductState(index, (prev) => ({
              ...prev,
              progress,
            }));

            if (progress.stage === "completed" && progress.results) {
              updateProductState(index, (prev) => ({
                ...prev,
                status: "completed",
                results: progress.results,
              }));
            }
          };

          await aiService.generateProductContent(
            state.product.name,
            state.product.productType,
            state.categoryName,
            handleProgress,
          );

          if (productTimer) clearInterval(productTimer);
          resolve(true);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          updateProductState(index, (prev) => ({
            ...prev,
            status: "error",
            error: errorMessage,
          }));
          if (productTimer) clearInterval(productTimer);
          resolve(false);
        }
      });
    },
    [productStates, updateProductState],
  );

  // Start batch generation
  const startGeneration = useCallback(async () => {
    if (!aiService.isConfigured()) {
      toast.error("กรุณาตั้งค่า NEXT_PUBLIC_LITELLM_API_KEY ในไฟล์ .env");
      return;
    }

    // Set the selected model before generating
    if (selectedModel) {
      aiService.setModel(selectedModel);
    }

    setIsRunning(true);
    setIsPaused(false);
    abortRef.current = false;
    pauseRef.current = false;
    startTimeRef.current = Date.now();

    // Start total timer
    totalTimerRef.current = setInterval(() => {
      setTotalElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    // We need to get the latest states and iterate
    // Use a ref-based approach to avoid stale closure issues
    for (let i = 0; i < products.length; i++) {
      if (abortRef.current) break;

      // Wait while paused
      while (pauseRef.current && !abortRef.current) {
        await new Promise((r) => setTimeout(r, 500));
      }

      if (abortRef.current) break;

      // Check if this product already has results (skip if saved/completed and user hasn't reset)
      setCurrentIndex(i);

      // Check the current state of this product
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

      // Skip products that already have complete data (if checkbox enabled)
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

        // Build available categories list for AI classification
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

      // Small delay between products to avoid rate limiting
      if (i < products.length - 1 && !abortRef.current) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    setIsRunning(false);
    setCurrentIndex(-1);
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
  }, [products, categories, skipComplete, selectedModel]);

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

  // Save single product to database
  const saveProduct = async (index: number) => {
    const state = productStates[index];
    if (!state || !state.results) return;

    try {
      // Resolve categoryId from AI-selected categorySlug
      let categoryId = state.product.categoryId; // default to existing
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

      // Include isFeatured/isBestseller if AI provided them
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
        toast.success(`บันทึก ${state.product.name} สำเร็จ!`);
      } else {
        toast.error(`ไม่สามารถบันทึก ${state.product.name} ได้`);
      }
    } catch (error) {
      toast.error(`เกิดข้อผิดพลาดในการบันทึก ${state.product.name}`);
    }
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

    if (!aiService.isConfigured()) {
      toast.error("กรุณาตั้งค่า NEXT_PUBLIC_LITELLM_API_KEY ในไฟล์ .env");
      return;
    }

    // Set the selected model before generating
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

      // Build available categories list for AI classification
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

  const getStatusBadge = (
    status: ProductGenerationState["status"],
    isComplete?: boolean,
  ) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-[#1A1C1E] text-gray-600 border border-gray-300">
            รอดำเนินการ
          </span>
        );
      case "generating":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300 animate-pulse">
            กำลัง Generate...
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-300">
            รอยืนยัน
          </span>
        );
      case "saved":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-400 border border-green-300">
            บันทึกแล้ว
          </span>
        );
      case "error":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-300">
            ผิดพลาด
          </span>
        );
      case "skipped":
        return (
          <span
            className={`px-2 py-0.5 text-xs font-medium border flex items-center gap-1 ${isComplete
                ? "bg-green-50 text-green-600 border-green-300"
                : "bg-[#1A1C1E] text-gray-500 border-gray-300"
              }`}
          >
            {isComplete && <CheckCircle2 className="w-3 h-3" />}
            {isComplete ? "ข้อมูลครบ - ข้าม" : "ข้าม"}
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-600 border border-orange-300">
            ยกเลิก
          </span>
        );
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

  if (typeof window === "undefined") return null;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        disabled={products.length === 0}
        className="bg-pink-500 border border-site-border/30 rounded-[12px] text-white flex items-center justify-center gap-2 px-4 py-2 hover:bg-pink-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        <Wand2 className="h-5 w-5" />
        <span>AI Generate ทั้งหมด</span>
        <Sparkles className="h-4 w-4 opacity-70" />
      </button>

      {/* Modal */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => !isRunning && handleClose()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-[#212328] border border-site-border/30 rounded-[16px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
              style={{ boxShadow: "8px 8px 0 0 #000000" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b-[3px] border-black bg-pink-500 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#212328] border-[2px] border-black">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      AI Generate ทุกเกม
                    </h3>
                    <p className="text-sm text-white/70">
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
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#212328] border-[2px] border-black text-white text-sm font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(totalElapsed)}</span>
                    </div>
                  )}
                  {!isRunning && (
                    <button
                      onClick={handleClose}
                      className="p-2 hover:bg-black/10 transition-colors border-[2px] border-transparent hover:border-black"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="px-5 py-3 border-b-[2px] border-gray-200 bg-[#181A1D] shrink-0">
                {/* Model Selector */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เลือก AI Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      aiService.setModel(e.target.value);
                    }}
                    disabled={
                      isLoadingModels ||
                      availableModels.length === 0 ||
                      isRunning
                    }
                    className="w-full py-2 px-3 bg-[#212328] border-[2px] border-gray-300 text-white text-sm focus:outline-none focus:border-black disabled:opacity-50"
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

                {/* Skip complete checkbox + completeness summary */}
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={skipComplete}
                      onChange={(e) => setSkipComplete(e.target.checked)}
                      disabled={isRunning}
                      className="w-4 h-4 border-2 border-black text-pink-500 focus:ring-pink-500/50 cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-white transition-colors">
                      ข้ามสินค้าที่มีข้อมูลครบแล้ว
                    </span>
                  </label>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-400 border border-green-300">
                      <CheckCircle2 className="w-3 h-3" />
                      ข้อมูลครบ: {stats.completeProducts}
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-orange-100 text-orange-700 border border-orange-300">
                      <AlertCircle className="w-3 h-3" />
                      ข้อมูลไม่ครบ: {stats.incompleteProducts}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      ทั้งหมด:{" "}
                      <strong className="text-white">{stats.total}</strong>
                    </span>
                    {stats.completed > 0 && (
                      <span className="text-yellow-600">
                        รอยืนยัน: <strong>{stats.completed}</strong>
                      </span>
                    )}
                    {stats.saved > 0 && (
                      <span className="text-green-600">
                        บันทึกแล้ว: <strong>{stats.saved}</strong>
                      </span>
                    )}
                    {stats.error > 0 && (
                      <span className="text-red-600">
                        ผิดพลาด: <strong>{stats.error}</strong>
                      </span>
                    )}
                    {stats.generating > 0 && (
                      <span className="text-blue-600">
                        กำลังทำ: <strong>{stats.generating}</strong>
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    {progressPercent}%
                  </span>
                </div>
                {/* Overall Progress Bar */}
                <div className="h-2.5 bg-site-border/30 border-[2px] border-black overflow-hidden">
                  <motion.div
                    className="h-full bg-pink-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Product List */}
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {productStates.map((state, index) => (
                    <div
                      key={state.product.id}
                      className={`transition-colors ${state.status === "generating"
                          ? "bg-blue-50"
                          : state.status === "saved"
                            ? "bg-green-50/50"
                            : state.status === "skipped" && state.isComplete
                              ? "bg-[#181A1D]/50"
                              : ""
                        }`}
                    >
                      {/* Product Row */}
                      <div className="px-5 py-3 flex items-center gap-4">
                        {/* Index */}
                        <span className="text-xs text-gray-400 font-mono w-6 text-right shrink-0">
                          {index + 1}
                        </span>

                        {/* Product Image */}
                        {state.product.imageUrl ? (
                          <img
                            src={state.product.imageUrl}
                            alt={state.product.name}
                            className="w-8 h-8 object-cover border-[2px] border-black shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-site-border/30 border-[2px] border-gray-300 shrink-0" />
                        )}

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white text-sm truncate">
                              {state.product.name}
                            </span>
                            {getStatusBadge(state.status, state.isComplete)}
                            {/* Completeness badge */}
                            {state.status === "pending" && state.isComplete && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-400 border border-green-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                ข้อมูลครบ
                              </span>
                            )}
                            {state.status === "pending" &&
                              !state.isComplete && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-600 border border-orange-300 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  ขาด {state.missingFields.length} ฟิลด์
                                </span>
                              )}
                          </div>

                          {/* Missing fields detail (show when pending and incomplete) */}
                          {state.status === "pending" &&
                            !state.isComplete &&
                            state.missingFields.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {state.missingFields.map((field) => (
                                  <span
                                    key={field}
                                    className="px-1.5 py-0.5 text-[10px] bg-orange-50 text-orange-500 border border-orange-200"
                                  >
                                    {field}
                                  </span>
                                ))}
                              </div>
                            )}

                          {/* Mini Progress for generating state */}
                          {state.status === "generating" && state.progress && (
                            <div className="mt-1 flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-site-border/30 overflow-hidden">
                                <motion.div
                                  className="h-full bg-blue-500"
                                  animate={{
                                    width: `${getStageProgress(state.progress.stage)}%`,
                                  }}
                                  transition={{ duration: 0.3 }}
                                />
                              </div>
                              <span className="text-xs text-blue-600 shrink-0">
                                {getStageName(state.progress.stage)}
                              </span>
                              <span className="text-xs text-gray-400 shrink-0">
                                {state.elapsedTime}s
                              </span>
                            </div>
                          )}

                          {/* Error message */}
                          {state.status === "error" && state.error && (
                            <p className="text-xs text-red-500 mt-0.5 truncate">
                              {state.error}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* View Details button - show for any product with data (AI results OR existing DB data) */}
                          {(state.results || hasAnyData(state.product)) &&
                            state.status !== "generating" && (
                              <button
                                onClick={() => toggleExpand(index)}
                                className={`p-1.5 border transition-all ${state.expanded
                                    ? "text-white bg-site-border/30 border-gray-400"
                                    : "text-gray-500 hover:text-white hover:bg-[#1A1C1E] border-transparent hover:border-gray-300"
                                  }`}
                                title="ดูรายละเอียด"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                          {/* Save button */}
                          {state.status === "completed" && state.results && (
                            <button
                              onClick={() => saveProduct(index)}
                              className="p-1.5 text-green-600 hover:text-white hover:bg-green-600 border border-green-300 hover:border-green-600 transition-all"
                              title="ยืนยัน - บันทึกลง Database"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Regenerate button - available for all non-generating statuses */}
                          {state.status !== "generating" && (
                            <button
                              onClick={() => regenerateProduct(index)}
                              className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-300 hover:border-blue-600 transition-all"
                              title="Regenerate"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Cancel/Discard button */}
                          {state.status === "completed" && (
                            <button
                              onClick={() => cancelProduct(index)}
                              className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 border border-red-300 hover:border-red-500/30 transition-all"
                              title="ยกเลิก - ไม่ใช้ผลลัพธ์"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Skip button (only when pending and batch running) */}
                          {state.status === "pending" && isRunning && (
                            <button
                              onClick={() => skipProduct(index)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-[#1A1C1E] border border-transparent hover:border-gray-300 transition-all"
                              title="ข้ามสินค้านี้"
                            >
                              <SkipForward className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
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
                            const headerColor = isShowingDbData
                              ? "bg-cyan-100 text-cyan-800 border-cyan-300"
                              : "bg-pink-100 text-pink-800 border-pink-300";

                            return (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-4 ml-14 space-y-3">
                                  {/* Source label */}
                                  <div
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border ${headerColor}`}
                                  >
                                    {isShowingDbData ? (
                                      <Eye className="w-3 h-3" />
                                    ) : (
                                      <Sparkles className="w-3 h-3" />
                                    )}
                                    {headerLabel}
                                  </div>

                                  {/* Description */}
                                  <div
                                    className={`border-[2px] p-3 ${isShowingDbData ? "bg-cyan-50/40 border-cyan-200" : "bg-[#181A1D] border-gray-200"}`}
                                  >
                                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                      คำอธิบาย
                                    </h5>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                      {displayData.description || (
                                        <span className="text-gray-400 italic">
                                          ไม่มีข้อมูล
                                        </span>
                                      )}
                                    </p>
                                  </div>

                                  {/* Short Description */}
                                  <div
                                    className={`border-[2px] p-3 ${isShowingDbData ? "bg-cyan-50/40 border-cyan-200" : "bg-[#181A1D] border-gray-200"}`}
                                  >
                                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                      คำอธิบายสั้น
                                    </h5>
                                    <p className="text-sm text-gray-800">
                                      {displayData.shortDescription || (
                                        <span className="text-gray-400 italic">
                                          ไม่มีข้อมูล
                                        </span>
                                      )}
                                    </p>
                                  </div>

                                  {/* SEO Meta */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div
                                      className={`border-[2px] p-3 ${isShowingDbData ? "bg-cyan-50/40 border-cyan-200" : "bg-blue-50 border-blue-200"}`}
                                    >
                                      <h5
                                        className={`text-xs font-bold uppercase tracking-wider mb-1 ${isShowingDbData ? "text-cyan-600" : "text-blue-500"}`}
                                      >
                                        Meta Title
                                      </h5>
                                      <p className="text-sm text-gray-800">
                                        {displayData.metaTitle || (
                                          <span className="text-gray-400 italic">
                                            ไม่มีข้อมูล
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div
                                      className={`border-[2px] p-3 ${isShowingDbData ? "bg-cyan-50/40 border-cyan-200" : "bg-blue-50 border-blue-200"}`}
                                    >
                                      <h5
                                        className={`text-xs font-bold uppercase tracking-wider mb-1 ${isShowingDbData ? "text-cyan-600" : "text-blue-500"}`}
                                      >
                                        Meta Description
                                      </h5>
                                      <p className="text-sm text-gray-800">
                                        {displayData.metaDescription || (
                                          <span className="text-gray-400 italic">
                                            ไม่มีข้อมูล
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div
                                      className={`border-[2px] p-3 ${isShowingDbData ? "bg-cyan-50/40 border-cyan-200" : "bg-blue-50 border-blue-200"}`}
                                    >
                                      <h5
                                        className={`text-xs font-bold uppercase tracking-wider mb-1 ${isShowingDbData ? "text-cyan-600" : "text-blue-500"}`}
                                      >
                                        Meta Keywords
                                      </h5>
                                      <p className="text-sm text-gray-800">
                                        {displayData.metaKeywords || (
                                          <span className="text-gray-400 italic">
                                            ไม่มีข้อมูล
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Game Details */}
                                  {displayData.gameDetails && (
                                    <div className="grid grid-cols-3 gap-3">
                                      <div
                                        className={`border-[2px] p-3 ${isShowingDbData ? "bg-cyan-50/40 border-cyan-200" : "bg-purple-50 border-purple-200"}`}
                                      >
                                        <h5
                                          className={`text-xs font-bold uppercase tracking-wider mb-1 ${isShowingDbData ? "text-cyan-600" : "text-purple-500"}`}
                                        >
                                          Developer
                                        </h5>
                                        <p className="text-sm text-gray-800">
                                          {displayData.gameDetails
                                            .developer || (
                                              <span className="text-gray-400 italic">
                                                ไม่มีข้อมูล
                                              </span>
                                            )}
                                        </p>
                                      </div>
                                      <div
                                        className={`border-[2px] p-3 ${isShowingDbData ? "bg-cyan-50/40 border-cyan-200" : "bg-purple-50 border-purple-200"}`}
                                      >
                                        <h5
                                          className={`text-xs font-bold uppercase tracking-wider mb-1 ${isShowingDbData ? "text-cyan-600" : "text-purple-500"}`}
                                        >
                                          Publisher
                                        </h5>
                                        <p className="text-sm text-gray-800">
                                          {displayData.gameDetails
                                            .publisher || (
                                              <span className="text-gray-400 italic">
                                                ไม่มีข้อมูล
                                              </span>
                                            )}
                                        </p>
                                      </div>
                                      <div
                                        className={`border-[2px] p-3 ${isShowingDbData ? "bg-cyan-50/40 border-cyan-200" : "bg-purple-50 border-purple-200"}`}
                                      >
                                        <h5
                                          className={`text-xs font-bold uppercase tracking-wider mb-1 ${isShowingDbData ? "text-cyan-600" : "text-purple-500"}`}
                                        >
                                          Platforms
                                        </h5>
                                        {displayData.gameDetails.platforms
                                          .length > 0 ? (
                                          <div className="flex flex-wrap gap-1">
                                            {displayData.gameDetails.platforms.map(
                                              (p) => (
                                                <span
                                                  key={p}
                                                  className={`px-1.5 py-0.5 text-xs border ${isShowingDbData ? "bg-cyan-100 text-cyan-800 border-cyan-300" : "bg-purple-200 text-purple-800 border-purple-300"}`}
                                                >
                                                  {p}
                                                </span>
                                              ),
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-sm text-gray-400 italic">
                                            ไม่มีข้อมูล
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* AI Classification: Category + Featured/Bestseller */}
                                  {!isShowingDbData &&
                                    (displayData.categorySlug ||
                                      displayData.isFeatured !== undefined ||
                                      displayData.isBestseller !==
                                      undefined) && (
                                      <div className="grid grid-cols-3 gap-3">
                                        <div className="border-[2px] p-3 bg-amber-50 border-amber-200">
                                          <h5 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Layers className="w-3 h-3" />
                                            AI หมวดหมู่
                                          </h5>
                                          <p className="text-sm text-gray-800 font-medium">
                                            {displayData.categoryName ||
                                              displayData.categorySlug || (
                                                <span className="text-gray-400 italic">
                                                  ไม่มีข้อมูล
                                                </span>
                                              )}
                                          </p>
                                          {displayData.categorySlug && (
                                            <p className="text-xs text-amber-500 mt-0.5">
                                              {displayData.categorySlug}
                                            </p>
                                          )}
                                        </div>
                                        <div className="border-[2px] p-3 bg-amber-50 border-amber-200">
                                          <h5 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Star className="w-3 h-3" />
                                            สินค้าแนะนำ
                                          </h5>
                                          <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold border ${displayData.isFeatured
                                                ? "bg-yellow-200 text-yellow-800 border-yellow-400"
                                                : "bg-[#1A1C1E] text-gray-500 border-gray-300"
                                              }`}
                                          >
                                            {displayData.isFeatured
                                              ? "Featured"
                                              : "ไม่ใช่"}
                                          </span>
                                        </div>
                                        <div className="border-[2px] p-3 bg-amber-50 border-amber-200">
                                          <h5 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            สินค้าขายดี
                                          </h5>
                                          <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold border ${displayData.isBestseller
                                                ? "bg-green-200 text-green-800 border-green-400"
                                                : "bg-[#1A1C1E] text-gray-500 border-gray-300"
                                              }`}
                                          >
                                            {displayData.isBestseller
                                              ? "Bestseller"
                                              : "ไม่ใช่"}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                  {/* Per-item action buttons: AI results -> Save/Regenerate/Cancel */}
                                  {!isShowingDbData &&
                                    state.status === "completed" && (
                                      <div className="flex gap-2 pt-1">
                                        <button
                                          onClick={() => saveProduct(index)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white border-[2px] border-black text-sm font-medium hover:bg-green-700 transition-colors"
                                          style={{
                                            boxShadow:
                                              "2px 2px 0 0 rgba(0,0,0,1)",
                                          }}
                                        >
                                          <Save className="w-3.5 h-3.5" />
                                          ยืนยัน - บันทึก
                                        </button>
                                        <button
                                          onClick={() =>
                                            regenerateProduct(index)
                                          }
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white border-[2px] border-black text-sm font-medium hover:bg-blue-700 transition-colors"
                                          style={{
                                            boxShadow:
                                              "2px 2px 0 0 rgba(0,0,0,1)",
                                          }}
                                        >
                                          <RefreshCw className="w-3.5 h-3.5" />
                                          Regenerate
                                        </button>
                                        <button
                                          onClick={() => cancelProduct(index)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white border-[2px] border-black text-sm font-medium hover:bg-red-600 transition-colors"
                                          style={{
                                            boxShadow:
                                              "2px 2px 0 0 rgba(0,0,0,1)",
                                          }}
                                        >
                                          <XCircle className="w-3.5 h-3.5" />
                                          ยกเลิก
                                        </button>
                                      </div>
                                    )}

                                  {/* DB data view -> only Regenerate button */}
                                  {isShowingDbData &&
                                    state.status !== "generating" && (
                                      <div className="flex gap-2 pt-1">
                                        <button
                                          onClick={() =>
                                            regenerateProduct(index)
                                          }
                                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white border-[2px] border-black text-sm font-medium hover:bg-blue-700 transition-colors"
                                          style={{
                                            boxShadow:
                                              "2px 2px 0 0 rgba(0,0,0,1)",
                                          }}
                                        >
                                          <RefreshCw className="w-3.5 h-3.5" />
                                          Generate ใหม่ด้วย AI
                                        </button>
                                      </div>
                                    )}

                                  {state.status === "saved" && (
                                    <div className="p-2 bg-green-500/10 border-[2px] border-green-400 flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      <span className="text-sm text-green-400 font-medium">
                                        บันทึกลง Database เรียบร้อยแล้ว
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })()}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t-[3px] border-black bg-[#181A1D] shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Left side */}
                  <div className="flex items-center gap-2">
                    {!isRunning &&
                      stats.pending > 0 &&
                      stats.completed === 0 &&
                      stats.saved === 0 && (
                        <button
                          onClick={startGeneration}
                          className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 text-white border border-site-border/30 rounded-[12px] font-bold transition-all hover:bg-pink-600"
                          style={{ boxShadow: "4px 4px 0 0 #000000" }}
                        >
                          <Play className="w-4 h-4" />
                          <span>เริ่ม Generate ทั้งหมด</span>
                        </button>
                      )}

                    {!isRunning &&
                      (stats.completed > 0 || stats.error > 0) &&
                      stats.pending > 0 && (
                        <button
                          onClick={startGeneration}
                          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white border border-site-border/30 rounded-[12px] font-bold transition-all hover:bg-pink-600"
                          style={{ boxShadow: "3px 3px 0 0 #000000" }}
                        >
                          <Play className="w-4 h-4" />
                          <span>ดำเนินการต่อ</span>
                        </button>
                      )}

                    {isRunning && (
                      <>
                        <button
                          onClick={togglePause}
                          className={`flex items-center gap-2 px-4 py-2 border border-site-border/30 rounded-[12px] font-bold transition-all ${isPaused
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "bg-yellow-400 text-white hover:bg-yellow-500"
                            }`}
                          style={{ boxShadow: "3px 3px 0 0 #000000" }}
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
                        </button>
                        <button
                          onClick={cancelGeneration}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white border border-site-border/30 rounded-[12px] font-bold transition-all hover:bg-red-600"
                          style={{ boxShadow: "3px 3px 0 0 #000000" }}
                        >
                          <X className="w-4 h-4" />
                          <span>หยุดทั้งหมด</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2">
                    {stats.completed > 0 && !isRunning && (
                      <button
                        onClick={saveAllCompleted}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white border border-site-border/30 rounded-[12px] font-bold transition-all hover:bg-green-700"
                        style={{ boxShadow: "3px 3px 0 0 #000000" }}
                      >
                        <Save className="w-4 h-4" />
                        <span>บันทึกทั้งหมด ({stats.completed})</span>
                      </button>
                    )}

                    {!isRunning && (
                      <button
                        onClick={handleClose}
                        className="flex items-center gap-2 px-4 py-2 bg-[#212328] text-white border border-site-border/30 rounded-[12px] font-bold transition-all hover:bg-[#1A1C1E]"
                        style={{ boxShadow: "3px 3px 0 0 #000000" }}
                      >
                        ปิด
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}
    </>
  );
}
