import axios from "axios";

// Local slugify helper for URL-safe English slugs with fallback
const slugify = (text: string) => {
  const base = text
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base) return base;
  return `content-${Math.random().toString(36).slice(2, 8)}`;
};

// Z.ai API configuration - using Coding endpoint as requested
const ZAI_API_BASE_URL = "https://api.z.ai/api/coding/paas/v4";
const ZAI_API_KEY = process.env.NEXT_PUBLIC_ZAI_API_KEY || "";

// Debug log interface
export interface DebugLog {
  id: string;
  timestamp: Date;
  type: "info" | "success" | "error" | "warning" | "api_call";
  message: string;
  details?: Record<string, unknown>;
}

// Generation progress interface
export interface GenerationProgress {
  stage:
    | "idle"
    | "preparing"
    | "generating_classification"
    | "generating_description"
    | "generating_short_description"
    | "generating_meta"
    | "generating_game_details"
    | "parsing"
    | "completed"
    | "error";
  currentField: string;
  logs: DebugLog[];
  isGenerating: boolean;
  results?: GeneratedContent;
  error?: string;
}

// Game details result
export interface GeneratedGameDetails {
  developer: string;
  publisher: string;
  platforms: string[];
}

// Generated content result
export interface GeneratedContent {
  description: string;
  shortDescription: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  gameDetails: GeneratedGameDetails;
  // AI classification fields
  categorySlug?: string;
  categoryName?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
}

// Available category for AI classification
export interface AvailableCategory {
  name: string;
  slug: string;
}

export interface GeneratedEditorialContent {
  title: string;
  content: string;
  excerpt: string;
  slug?: string;
}

type ContentGenerationProgressCallback = (progress: {
  stage: string;
  message: string;
}) => void;

// Z.ai API request types
interface ZaiMessage {
  role: "system" | "user";
  content: string;
}

interface ZaiChatCompletionRequest {
  model: string;
  messages: ZaiMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ZaiChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// AI Service class with debug capabilities
class AiService {
  private client = axios.create({
    baseURL: ZAI_API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ZAI_API_KEY}`,
    },
    timeout: 120000, // 120 seconds timeout
  });

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private createLog(
    type: DebugLog["type"],
    message: string,
    details?: Record<string, unknown>,
  ): DebugLog {
    return {
      id: this.generateId(),
      timestamp: new Date(),
      type,
      message,
      details,
    };
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return (
      !!ZAI_API_KEY &&
      ZAI_API_KEY.length > 0 &&
      ZAI_API_KEY !== "your_api_key_here"
    );
  }

  // Get API configuration status for debugging
  getConfigStatus(): { hasKey: boolean; keyLength: number; baseUrl: string } {
    return {
      hasKey: !!ZAI_API_KEY && ZAI_API_KEY.length > 0,
      keyLength: ZAI_API_KEY?.length || 0,
      baseUrl: ZAI_API_BASE_URL,
    };
  }

  // Generate product content with progress tracking
  async generateProductContent(
    productName: string,
    productType: string,
    categoryName?: string,
    onProgress?: (progress: GenerationProgress) => void,
    availableCategories?: AvailableCategory[],
  ): Promise<GeneratedContent> {
    const logs: DebugLog[] = [];

    // Initial state
    let progress: GenerationProgress = {
      stage: "preparing",
      currentField: "Initializing",
      logs: [...logs],
      isGenerating: true,
    };
    onProgress?.(progress);

    // Check API configuration
    const configStatus = this.getConfigStatus();
    console.log("[AI Service] Config status:", configStatus);

    if (!this.isConfigured()) {
      const error =
        "Z.ai API key not configured. Please set NEXT_PUBLIC_ZAI_API_KEY in your .env file.";
      logs.push(this.createLog("error", error, { configStatus }));
      progress = {
        ...progress,
        stage: "error",
        logs: [...logs],
        isGenerating: false,
        error,
      };
      onProgress?.(progress);
      throw new Error(error);
    }

    logs.push(
      this.createLog("info", "API configuration verified", {
        keyLength: ZAI_API_KEY.length,
        baseUrl: ZAI_API_BASE_URL,
      }),
    );
    logs.push(
      this.createLog(
        "info",
        `Starting content generation for: ${productName}`,
        {
          productType,
          categoryName,
        },
      ),
    );
    onProgress?.({ ...progress, logs: [...logs] });

    try {
      // Classification results (will be populated if availableCategories is provided)
      let classificationResult: {
        categorySlug: string;
        categoryName: string;
        isFeatured: boolean;
        isBestseller: boolean;
      } | null = null;

      // Step 0: Classification (category + featured/bestseller)
      if (availableCategories && availableCategories.length > 0) {
        progress = {
          ...progress,
          stage: "generating_classification",
          currentField: "Classification",
        };
        logs.push(
          this.createLog(
            "api_call",
            "Classifying product (category, featured, bestseller)...",
            {
              model: "glm-4.7",
              categoriesCount: availableCategories.length,
            },
          ),
        );
        onProgress?.({ ...progress, logs: [...logs] });

        const classificationPrompt = this.buildClassificationPrompt(
          productName,
          productType,
          availableCategories,
        );
        const classificationResponse =
          await this.callZaiApi(classificationPrompt);
        const classificationChoice = classificationResponse.choices[0];
        let classificationText =
          classificationChoice.message.content?.trim() || "";

        // Handle reasoning models
        if (
          !classificationText &&
          (classificationChoice.message as any).reasoning_content
        ) {
          const reasoning = (classificationChoice.message as any)
            .reasoning_content as string;
          const slugMatch = reasoning.match(/CATEGORY_SLUG:\s*([^\n]+)/i);
          const nameMatch = reasoning.match(/CATEGORY_NAME:\s*([^\n]+)/i);
          const featuredMatch = reasoning.match(/IS_FEATURED:\s*([^\n]+)/i);
          const bestsellerMatch = reasoning.match(/IS_BESTSELLER:\s*([^\n]+)/i);
          if (slugMatch || nameMatch) {
            classificationText = [
              slugMatch ? `CATEGORY_SLUG: ${slugMatch[1].trim()}` : "",
              nameMatch ? `CATEGORY_NAME: ${nameMatch[1].trim()}` : "",
              featuredMatch
                ? `IS_FEATURED: ${featuredMatch[1].trim()}`
                : "IS_FEATURED: false",
              bestsellerMatch
                ? `IS_BESTSELLER: ${bestsellerMatch[1].trim()}`
                : "IS_BESTSELLER: false",
            ]
              .filter(Boolean)
              .join("\n");
          }
        }

        classificationResult = this.parseClassificationContent(
          classificationText,
          availableCategories,
        );

        // Use the AI-selected category for subsequent prompts
        categoryName = classificationResult.categoryName;

        logs.push(
          this.createLog("success", "Classification completed", {
            categorySlug: classificationResult.categorySlug,
            categoryName: classificationResult.categoryName,
            isFeatured: classificationResult.isFeatured,
            isBestseller: classificationResult.isBestseller,
          }),
        );
        onProgress?.({ ...progress, logs: [...logs] });
      }

      // Step 1: Generate full description
      progress = {
        ...progress,
        stage: "generating_description",
        currentField: "Description",
      };
      logs.push(
        this.createLog("api_call", "Generating full description...", {
          model: "glm-4.7",
        }),
      );
      onProgress?.({ ...progress, logs: [...logs] });

      const descriptionPrompt = this.buildDescriptionPrompt(
        productName,
        productType,
        categoryName,
      );
      const descriptionResponse = await this.callZaiApi(descriptionPrompt);
      const choice = descriptionResponse.choices[0];
      let description = choice.message.content?.trim() || "";

      // Handle reasoning models - always try to extract better content from reasoning
      const reasoning = (choice.message as any).reasoning_content as
        | string
        | undefined;
      if (reasoning) {
        // Check if content is too short, empty, or ends abruptly (truncated)
        const contentTooShort = !description || description.length < 150;
        const contentEndsAbruptly =
          description &&
          (description.endsWith("...") ||
            description.endsWith("   ") ||
            /\d+\.$/.test(description) || // Ends with a number (like "1. ")
            /:$/.test(description)); // Ends with colon
        const needsExtraction = contentTooShort || contentEndsAbruptly;

        if (needsExtraction) {
          logs.push(
            this.createLog(
              "warning",
              "Content incomplete, extracting from reasoning",
              {
                contentLength: description?.length || 0,
                contentEndsAbruptly,
                reasoningLength: reasoning.length,
              },
            ),
          );
          onProgress?.({ ...progress, logs: [...logs] });

          // Try to extract from "Final Polish", "Final Selection", or "Refined Draft"
          const finalPolishMatch = reasoning.match(
            /\*Final Polish\*:\s*([\s\S]*?)(?=\n\n|$)/i,
          );
          const finalSelectionMatch = reasoning.match(
            /\*Final Selection\*:\s*"?([\s\S]*?)(?:"?\s*\n\n|$)/i,
          );
          const refinedMatch = reasoning.match(
            /\*Refined Draft\*:\s*([\s\S]*?)(?=\n\n\d+\.|$)/i,
          );

          let extractedContent = "";
          if (finalPolishMatch) {
            extractedContent = finalPolishMatch[1].trim();
            logs.push(
              this.createLog(
                "success",
                "Extracted content from 'Final Polish' section",
              ),
            );
          } else if (finalSelectionMatch) {
            extractedContent = finalSelectionMatch[1].trim();
            logs.push(
              this.createLog(
                "success",
                "Extracted content from 'Final Selection' section",
              ),
            );
          } else if (refinedMatch) {
            extractedContent = refinedMatch[1].trim();
            logs.push(
              this.createLog(
                "success",
                "Extracted content from 'Refined Draft' section",
              ),
            );
          } else {
            // Try to extract from any numbered draft section
            const draftMatch = reasoning.match(
              /\d+\.\s*\*\*[^*]+\*\*:\s*([\s\S]*?)(?=\n\n\d+\.|$)/,
            );
            if (draftMatch) {
              extractedContent = draftMatch[1].trim();
              logs.push(
                this.createLog(
                  "success",
                  "Extracted content from draft section",
                ),
              );
            } else {
              // Last resort: use the last substantial paragraph of reasoning
              const paragraphs = reasoning
                .split("\n\n")
                .filter((p) => p.trim().length > 100);
              if (paragraphs.length > 0) {
                extractedContent = paragraphs[paragraphs.length - 1].trim();
                logs.push(
                  this.createLog(
                    "success",
                    "Extracted content from last paragraph",
                  ),
                );
              }
            }
          }

          // Use extracted content if it's better
          if (
            extractedContent &&
            extractedContent.length > (description?.length || 0)
          ) {
            description = extractedContent;
          }
        }
      }

      // Ensure description is not empty
      if (!description || description.length === 0) {
        console.error("[AI Service] Empty description response:", {
          finishReason: choice.finish_reason,
          hasContent: !!choice.message.content,
          hasReasoning: !!(choice.message as any).reasoning_content,
          contentPreview: choice.message.content?.substring(0, 100),
        });
        throw new Error("AI returned empty description. Please try again.");
      }

      logs.push(
        this.createLog("success", "Description generated", {
          length: description.length,
          preview: description.substring(0, 100) + "...",
        }),
      );
      onProgress?.({ ...progress, logs: [...logs] });

      // Step 2: Generate short description
      progress = {
        ...progress,
        stage: "generating_short_description",
        currentField: "Short Description",
      };
      logs.push(this.createLog("api_call", "Generating short description..."));
      onProgress?.({ ...progress, logs: [...logs] });

      const shortDescPrompt = this.buildShortDescriptionPrompt(
        productName,
        productType,
        categoryName,
        description,
      );
      const shortDescResponse = await this.callZaiApi(shortDescPrompt);
      const shortDescChoice = shortDescResponse.choices[0];
      let shortDescription = (
        shortDescChoice.message.content?.trim() || ""
      ).substring(0, 255);

      // Handle reasoning models
      if (
        !shortDescription &&
        (shortDescChoice.message as any).reasoning_content
      ) {
        const reasoning = (shortDescChoice.message as any)
          .reasoning_content as string;
        const draftMatch = reasoning.match(
          /\d+\.\s*\*?[^*]+\*?:\s*([\s\S]*?)(?=\n\n\d+\.|$)/,
        );
        if (draftMatch) {
          shortDescription = draftMatch[1].trim().substring(0, 255);
        }
      }

      if (!shortDescription) {
        // Fallback: create from full description
        shortDescription = description.substring(0, 252) + "...";
      }

      logs.push(
        this.createLog("success", "Short description generated", {
          length: shortDescription.length,
        }),
      );
      onProgress?.({ ...progress, logs: [...logs] });

      // Step 3: Generate meta content
      progress = {
        ...progress,
        stage: "generating_meta",
        currentField: "Meta Tags",
      };
      logs.push(this.createLog("api_call", "Generating SEO meta content..."));
      onProgress?.({ ...progress, logs: [...logs] });

      const metaPrompt = this.buildMetaPrompt(
        productName,
        productType,
        categoryName,
        description,
      );
      const metaResponse = await this.callZaiApi(metaPrompt);
      const metaChoice = metaResponse.choices[0];
      let metaText = metaChoice.message.content?.trim() || "";

      // Handle reasoning models
      if (!metaText && (metaChoice.message as any).reasoning_content) {
        const reasoning = (metaChoice.message as any)
          .reasoning_content as string;
        // Extract from the last section or any explicit format
        const metaMatch = reasoning.match(
          /META_TITLE:\s*([^\n]+)\s*\n\s*META_DESCRIPTION:\s*([^\n]+)\s*\n\s*META_KEYWORDS:\s*([^\n]+)/i,
        );
        if (metaMatch) {
          metaText = `META_TITLE: ${metaMatch[1]}\nMETA_DESCRIPTION: ${metaMatch[2]}\nMETA_KEYWORDS: ${metaMatch[3]}`;
        }
      }

      const metaContent = this.parseMetaContent(
        metaText || metaChoice.message.content?.trim() || "",
      );

      logs.push(
        this.createLog("success", "Meta content generated", {
          titleLength: metaContent.metaTitle.length,
          descLength: metaContent.metaDescription.length,
          keywordsCount: metaContent.metaKeywords.split(",").length,
        }),
      );
      onProgress?.({ ...progress, logs: [...logs] });

      // Step 4: Generate game details
      progress = {
        ...progress,
        stage: "generating_game_details",
        currentField: "Game Details",
      };
      logs.push(this.createLog("api_call", "Generating game details..."));
      onProgress?.({ ...progress, logs: [...logs] });

      const gameDetailsPrompt = this.buildGameDetailsPrompt(
        productName,
        productType,
        categoryName,
        description,
      );
      const gameDetailsResponse = await this.callZaiApi(gameDetailsPrompt);
      const gameDetailsChoice = gameDetailsResponse.choices[0];
      let gameDetailsText = gameDetailsChoice.message.content?.trim() || "";

      // Handle reasoning models
      if (
        !gameDetailsText &&
        (gameDetailsChoice.message as any).reasoning_content
      ) {
        const reasoning = (gameDetailsChoice.message as any)
          .reasoning_content as string;
        // Try to extract from reasoning
        const devMatch = reasoning.match(/DEVELOPER:\s*([^\n]+)/i);
        const pubMatch = reasoning.match(/PUBLISHER:\s*([^\n]+)/i);
        const platMatch = reasoning.match(/PLATFORMS:\s*([^\n]+)/i);
        if (devMatch || pubMatch || platMatch) {
          gameDetailsText = [
            devMatch
              ? `DEVELOPER: ${devMatch[1].trim()}`
              : "DEVELOPER: Unknown",
            pubMatch
              ? `PUBLISHER: ${pubMatch[1].trim()}`
              : "PUBLISHER: Unknown",
            platMatch
              ? `PLATFORMS: ${platMatch[1].trim()}`
              : "PLATFORMS: iOS, Android",
          ].join("\n");
        }
      }

      const gameDetails = this.parseGameDetailsContent(
        gameDetailsText || gameDetailsChoice.message.content?.trim() || "",
      );

      logs.push(
        this.createLog("success", "Game details generated", {
          developer: gameDetails.developer,
          publisher: gameDetails.publisher,
          platforms: gameDetails.platforms,
        }),
      );
      onProgress?.({ ...progress, logs: [...logs] });

      // Step 5: Parse and compile results
      progress = {
        ...progress,
        stage: "parsing",
        currentField: "Compiling Results",
      };
      onProgress?.({ ...progress, logs: [...logs] });

      const results: GeneratedContent = {
        description,
        shortDescription,
        metaTitle: metaContent.metaTitle,
        metaDescription: metaContent.metaDescription,
        metaKeywords: metaContent.metaKeywords,
        gameDetails,
        // Include classification results if available
        ...(classificationResult && {
          categorySlug: classificationResult.categorySlug,
          categoryName: classificationResult.categoryName,
          isFeatured: classificationResult.isFeatured,
          isBestseller: classificationResult.isBestseller,
        }),
      };

      logs.push(
        this.createLog("info", "Compiled results", {
          descriptionLength: results.description?.length || 0,
          shortDescriptionLength: results.shortDescription?.length || 0,
          hasGameDetails: !!results.gameDetails,
        }),
      );

      // Final state
      progress = {
        stage: "completed",
        currentField: "Done",
        logs: [
          ...logs,
          this.createLog("success", "All content generated successfully!"),
        ],
        isGenerating: false,
        results,
      };
      onProgress?.(progress);

      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logs.push(
        this.createLog("error", `Generation failed: ${errorMessage}`, {
          error: error instanceof Error ? error.stack : String(error),
        }),
      );

      progress = {
        ...progress,
        stage: "error",
        logs: [...logs],
        isGenerating: false,
        error: errorMessage,
      };
      onProgress?.(progress);

      throw error;
    }
  }

  // Call Z.ai API with retry logic
  private async callZaiApi(
    prompt: string,
    retries = 2,
  ): Promise<ZaiChatCompletionResponse> {
    const request: ZaiChatCompletionRequest = {
      model: "glm-4.7",
      messages: [
        {
          role: "system",
          content:
            "You are an expert e-commerce copywriter. Respond directly with the requested content. Do not show your reasoning or thinking process. Always write in Thai language for Thai market.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 6000,
      stream: false,
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[Z.ai API] Retry attempt ${attempt}/${retries}...`);
        }

        console.log("[Z.ai API] Sending request:", {
          url: "/chat/completions",
          model: request.model,
          attempt: attempt + 1,
        });

        const response = await this.client.post<ZaiChatCompletionResponse>(
          "/chat/completions",
          request,
        );

        console.log("[Z.ai API] Response received:", {
          status: response.status,
          hasContent: !!response.data?.choices?.[0]?.message?.content,
          hasReasoning: !!(response.data?.choices?.[0]?.message as any)
            ?.reasoning_content,
        });

        return response.data;
      } catch (error) {
        lastError = error as Error;

        if (axios.isAxiosError(error)) {
          const status = error.response?.status;

          // Don't retry on 401 (auth error)
          if (status === 401) {
            throw new Error(
              "Invalid API key. Please check your Z.ai API key configuration.",
            );
          }

          // Retry on timeout or server errors
          if (attempt < retries) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
            console.log(
              `[Z.ai API] Request failed, retrying in ${delay}ms...`,
              error.message,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        // Out of retries or non-retryable error
        break;
      }
    }

    // All retries exhausted - handle the final error
    const finalError = lastError || new Error("Unknown error");
    throw this.formatApiError(finalError);
  }

  // Format API error for user-friendly messages
  private formatApiError(error: Error): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      // Log detailed error info for debugging
      console.error("[Z.ai API Error]", {
        status,
        errorData,
        message: error.message,
        code: error.code,
        requestUrl: error.config?.url,
        hasApiKey: !!ZAI_API_KEY && ZAI_API_KEY.length > 0,
      });

      if (!status) {
        // Network error or no response
        if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
          return new Error(
            "Cannot connect to Z.ai API. Please check your network connection.",
          );
        } else if (
          error.code === "ETIMEDOUT" ||
          error.code === "ECONNABORTED"
        ) {
          return new Error("Request to Z.ai API timed out. Please try again.");
        } else if (!ZAI_API_KEY) {
          return new Error(
            "Z.ai API key is missing. Please set NEXT_PUBLIC_ZAI_API_KEY.",
          );
        } else {
          return new Error(
            `Network error: ${error.message}. Please check your connection and API configuration.`,
          );
        }
      }

      if (status === 401) {
        return new Error(
          "Invalid API key. Please check your Z.ai API key configuration.",
        );
      } else if (status === 429) {
        return new Error(
          "Rate limit exceeded. Please wait a moment and try again.",
        );
      } else if (status === 500) {
        return new Error("Z.ai server error. Please try again later.");
      } else {
        return new Error(
          `API Error (${status}): ${JSON.stringify(errorData) || error.message}`,
        );
      }
    }
    return error;
  }

  // Build prompt for product classification (category + featured/bestseller)
  private buildClassificationPrompt(
    productName: string,
    productType: string,
    availableCategories: AvailableCategory[],
  ): string {
    const categoryList = availableCategories
      .map((c) => `- ${c.name} (slug: ${c.slug})`)
      .join("\n");

    return `จัดหมวดหมู่สินค้าเกมนี้และพิจารณาว่าเป็นสินค้าแนะนำหรือสินค้าขายดีหรือไม่

สินค้า: "${productName}"
ประเภท: ${productType === "DIRECT_TOPUP" ? "เติมตรง (Direct Top-Up)" : "บัตรของขวัญ (Gift Card)"}

หมวดหมู่ที่มีให้เลือก:
${categoryList}

กฎการตัดสินใจ:
1. CATEGORY: เลือกหมวดหมู่ที่เหมาะสมที่สุดจากรายการด้านบน โดยดูจากชื่อสินค้าและแพลตฟอร์มที่เกี่ยวข้อง
   - ถ้าเป็นเกมมือถือทั่วไป (PUBG Mobile, Mobile Legends, Free Fire ฯลฯ) → mobile-games
   - ถ้าเป็น Steam Wallet หรือเกมบน Steam → steam
   - ถ้าเป็น PSN หรือ PlayStation → playstation
   - ถ้าเป็น Xbox หรือ Game Pass → xbox
   - ถ้าเป็น Nintendo eShop → nintendo
   - ถ้าเป็น Garena (ROV, Free Fire SEA, Shells) → garena
   - ถ้าเป็น Roblox/Robux → roblox
   - ถ้าเป็น Epic Games/Fortnite → epic-games
   - ถ้าเป็น Google Play Card → google-play
   - ถ้าเป็น iTunes/App Store Card → app-store
   - ถ้าเป็นเกม PC อื่นๆ (VALORANT, LoL ที่ไม่ใช่ Garena, Battle.net) → pc-gaming

2. IS_FEATURED: พิจารณาว่าเป็นเกมยอดนิยมหรือเกมที่น่าสนใจที่ควรแนะนำให้ผู้ใช้หรือไม่
   - ตอบ true ถ้าเป็นเกมที่เป็นที่รู้จักกว้างขวางและมีผู้เล่นเยอะ
   - ตอบ false ถ้าเป็นเกมที่ไม่ค่อยเป็นที่รู้จักหรือเป็น niche

3. IS_BESTSELLER: พิจารณาว่าเป็นสินค้าขายดีในตลาดเติมเกมหรือไม่
   - ตอบ true ถ้าเป็นเกมที่มียอดเติมเงินสูงในตลาดไทย/เอเชียตะวันออกเฉียงใต้ (เช่น Mobile Legends, Free Fire, PUBG Mobile, Genshin Impact, ROV)
   - ตอบ false ถ้าไม่ใช่เกมที่มียอดเติมเงินสูงเป็นพิเศษ

รูปแบบการตอบ (ตอบเฉพาะรูปแบบนี้เท่านั้น):
CATEGORY_SLUG: [slug ของหมวดหมู่]
CATEGORY_NAME: [ชื่อหมวดหมู่]
IS_FEATURED: [true หรือ false]
IS_BESTSELLER: [true หรือ false]

ตัวอย่าง:
CATEGORY_SLUG: mobile-games
CATEGORY_NAME: Mobile Games
IS_FEATURED: true
IS_BESTSELLER: true

จัดหมวดหมู่ตอนนี้ (ตอบเฉพาะรูปแบบด้านบน):`;
  }

  // Parse classification content from AI response
  private parseClassificationContent(
    content: string,
    availableCategories: AvailableCategory[],
  ): {
    categorySlug: string;
    categoryName: string;
    isFeatured: boolean;
    isBestseller: boolean;
  } {
    const lines = content.split("\n").map((line) => line.trim());

    let categorySlug = "";
    let categoryName = "";
    let isFeatured = false;
    let isBestseller = false;

    for (const line of lines) {
      if (line.startsWith("CATEGORY_SLUG:")) {
        categorySlug = line.replace("CATEGORY_SLUG:", "").trim();
      } else if (line.startsWith("CATEGORY_NAME:")) {
        categoryName = line.replace("CATEGORY_NAME:", "").trim();
      } else if (line.startsWith("IS_FEATURED:")) {
        isFeatured =
          line.replace("IS_FEATURED:", "").trim().toLowerCase() === "true";
      } else if (line.startsWith("IS_BESTSELLER:")) {
        isBestseller =
          line.replace("IS_BESTSELLER:", "").trim().toLowerCase() === "true";
      }
    }

    // Validate category slug against available categories
    const matchedCategory = availableCategories.find(
      (c) => c.slug === categorySlug,
    );
    if (matchedCategory) {
      categoryName = matchedCategory.name; // Use the official name
    } else {
      // Try fuzzy matching by name
      const matchByName = availableCategories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
      );
      if (matchByName) {
        categorySlug = matchByName.slug;
        categoryName = matchByName.name;
      } else {
        // Fallback to first category (mobile-games) if no match found
        categorySlug = availableCategories[0]?.slug || "mobile-games";
        categoryName = availableCategories[0]?.name || "Mobile Games";
      }
    }

    return { categorySlug, categoryName, isFeatured, isBestseller };
  }

  // Build prompt for full description
  //
  // Platform context helper - provides AI with platform-specific knowledge
  private getPlatformContext(categoryName?: string): string {
    if (!categoryName) return "";
    const lower = categoryName.toLowerCase();

    const contextMap: Record<string, string> = {
      steam:
        "แพลตฟอร์ม Steam ของ Valve - ผู้ใช้เติม Steam Wallet หรือซื้อ Gift Card เพื่อใช้ซื้อเกมและไอเทมบน Steam Store ทำงานบน PC/Mac/Linux",
      playstation:
        "แพลตฟอร์ม Sony PlayStation - ผู้ใช้ซื้อ PSN Card หรือสมัคร PS Plus เพื่อใช้บน PlayStation Console (PS4/PS5) ระบบ PlayStation Network",
      xbox: "แพลตฟอร์ม Microsoft Xbox - ผู้ใช้ซื้อ Xbox Gift Card, Game Pass, หรือ Xbox Live Gold เพื่อใช้บน Xbox Console และ PC",
      nintendo:
        "แพลตฟอร์ม Nintendo - ผู้ใช้ซื้อ Nintendo eShop Card เพื่อซื้อเกมบน Nintendo Switch",
      "epic games":
        "แพลตฟอร์ม Epic Games - เกมอย่าง Fortnite (V-Bucks) และ Epic Games Store Gift Card ทำงานบน PC/Console/Mobile",
      garena:
        "แพลตฟอร์ม Garena ในเอเชียตะวันออกเฉียงใต้ - เกมอย่าง ROV (Arena of Valor), Free Fire, League of Legends (SEA) ใช้ Garena Shells",
      roblox:
        "แพลตฟอร์ม Roblox - ผู้ใช้ซื้อ Robux เพื่อใช้ในเกม Roblox ทำงานบน PC/Mobile/Console/Xbox เป็นที่นิยมในกลุ่มเยาวชน",
      "mobile games":
        "เกมมือถือทั่วไป - เล่นบน iOS และ Android เช่น PUBG Mobile, Mobile Legends, Genshin Impact, Free Fire เติมผ่าน User ID/Player ID",
      "pc gaming":
        "เกม PC อื่นๆ นอกเหนือจาก Steam/Epic - เช่น Battle.net (Blizzard), EA Play, Riot Points (VALORANT/LoL), เกม PC ที่มีระบบเติมเฉพาะ",
      "google play":
        "Google Play Gift Card - ใช้เติมเงินใน Google Play Store สำหรับซื้อแอป เกม สื่อบันเทิง และไอเทมในเกมบน Android",
      "app store":
        "Apple App Store / iTunes Gift Card - ใช้เติมเงินใน Apple ID สำหรับซื้อแอป เกม และไอเทมในเกมบน iPhone/iPad (iOS)",
    };

    for (const [key, value] of Object.entries(contextMap)) {
      if (lower.includes(key)) return value;
    }
    return "";
  }

  // Infer likely platforms from category name for game details prompt
  private getPlatformsFromCategory(categoryName?: string): string {
    if (!categoryName) return "";
    const lower = categoryName.toLowerCase();

    const platformMap: Record<string, string> = {
      steam: "PC",
      playstation: "Console",
      xbox: "Console, PC",
      nintendo: "Console",
      "epic games": "PC, Console",
      garena: "iOS, Android, PC",
      roblox: "iOS, Android, PC, Console",
      "mobile games": "iOS, Android",
      "pc gaming": "PC",
      "google play": "Android",
      "app store": "iOS",
    };

    for (const [key, value] of Object.entries(platformMap)) {
      if (lower.includes(key)) return value;
    }
    return "";
  }

  private buildDescriptionPrompt(
    productName: string,
    productType: string,
    categoryName?: string,
  ): string {
    // Build platform-specific context based on category
    const platformContext = this.getPlatformContext(categoryName);

    return `เขียนคำอธิบายสินค้าสำหรับบริการเติมเกม "${productName}"

รายละเอียด:
- ประเภท: ${productType === "DIRECT_TOPUP" ? "เติมตรง (ต้องใช้ User ID)" : "บัตรของขวัญ"}
${categoryName ? `- แพลตฟอร์ม/หมวดหมู่: ${categoryName}` : ""}
${platformContext ? `- บริบทแพลตฟอร์ม: ${platformContext}` : ""}

ข้อกำหนดสำคัญ:
1. เขียนเป็นภาษาไทย
2. ความยาว 200-400 คำ
3. ห้ามใช้ไอคอนหรืออิโมจิทั้งหมด - เขียนเป็นข้อความล้วนเท่านั้น
4. ใช้ Markdown formatting เพื่อให้ดูเป็นมืออาชีพ
5. หัวข้อต้องเป็นธรรมชาติ ห้ามใช้คำแบบ template เช่น "บทนำสินค้า:", "คำกระตุ้นการตัดสินใจ:"
6. วิธีเติมต้องตรงกับข้อมูลจริง ห้ามสร้างขั้นตอนที่ไม่มีอยู่จริง
7. ย่อหน้าเปิดไม่ต้องมีหัวข้อ ให้เริ่มเขียนเนื้อหาเลยทันที
8. ห้ามตัดจบกลางประโยคหรือเว้นส่วนใดส่วนหนึ่ง ให้เขียนครบทุกหัวข้อ หากเนื้อหายาวเกินให้ย่อแต่ต้องครอบคลุมครบ
9. ปิดท้ายด้วยประโยคธรรมชาติ ห้ามขึ้นหัวข้อปิดท้าย

กฎ Markdown:
- หัวข้อหลักใช้ ## (h2)
- หัวข้อย่อยใช้ ### (h3) เฉพาะที่จำเป็น เช่น วิธีหา ID
- **bold** เฉพาะคำสำคัญ เช่น ชื่อเกม ชื่อสกุลเงิน ชื่อ ID ที่ต้องกรอก ชื่อแพลตฟอร์ม
- ใช้ bullet list (-) สำหรับจุดเด่นและข้อมูลที่ต้องใช้
- ใช้ numbered list (1. 2. 3.) สำหรับขั้นตอน
- ห้าม bold ทั้งประโยค ให้ bold เฉพาะคำสำคัญ 1-3 คำต่อจุด
- ย่อหน้าเปิดไม่ต้องมี ## ให้เขียนเป็น paragraph ปกติ

โครงสร้างที่ต้องการ:

1. ย่อหน้าเปิด (ไม่มีหัวข้อ) - แนะนำสินค้าสั้นๆ 2-3 ประโยค

2. ## เกี่ยวกับตัวเกม - ใช้ชื่อธรรมชาติ เช่น "## เกี่ยวกับ Identity V" หรือ "## Echoes ใช้ทำอะไรได้บ้าง"

3. ## ข้อมูลที่ต้องใช้ในการเติม - ระบุ ID ที่ต้องกรอก + ### วิธีหา ID

4. ## ขั้นตอนการสั่งซื้อ - numbered list

5. ## ทำไมต้องเติมกับเรา - bullet list จุดเด่น

6. ## ข้อควรระวัง - เตือนเรื่อง ID ผิด/คืนเงิน

7. ประโยคปิดการขาย (ไม่มีหัวข้อ) 1-2 ประโยค

ตัวอย่างที่ถูกต้อง:

บริการเติมเพชร **Mobile Legends** สำหรับเซิร์ฟเวอร์มาเลเซีย ด้วยระบบอัตโนมัติที่รวดเร็วและปลอดภัย เหมาะสำหรับการซื้อฮีโร่ใหม่ สกินสวยๆ หรือสมัคร **Starlight Member**

## เพชรใช้ทำอะไรได้บ้าง

**Mobile Legends: Bang Bang** เป็นเกม MOBA บนมือถือที่ได้รับความนิยมสูงสุดในเอเชียตะวันออกเฉียงใต้ **เพชร (Diamonds)** เป็นเหรียญพรีเมียมที่ใช้ซื้อฮีโร่ สกิน ไอเทมตกแต่ง และสมัครสมาชิก Starlight

## ข้อมูลที่ต้องใช้ในการเติม

การเติมเพชรต้องใช้ข้อมูลต่อไปนี้:
- **User ID** - รหัสผู้ใช้งานในเกม (ตัวเลข)
- **Zone ID** - รหัสเซิร์ฟเวอร์ (ตัวเลข)

### วิธีหา User ID และ Zone ID

1. เปิดเกม **Mobile Legends**
2. คลิกที่รูปโปรไฟล์ด้านซ้ายบน
3. ดูที่มุมขวาของชื่อผู้ใช้ จะเห็นตัวเลขรูปแบบ "12345678 (1234)"
4. ตัวเลขก่อนวงเล็บคือ **User ID** ตัวเลขในวงเล็บคือ **Zone ID**

## ขั้นตอนการเติมเพชร

1. เลือกจำนวนเพชรหรือแพ็กเกจที่ต้องการ
2. กรอก **User ID** และ **Zone ID** ให้ถูกต้อง
3. เลือกช่องทางชำระเงินและทำการชำระ
4. รอรับเพชรเข้าบัญชีภายใน **1-5 นาที**

## ทำไมต้องเติมกับเรา

- เติมตรงผ่าน **ระบบ API** อย่างเป็นทางการ
- รวดเร็ว ไม่ต้องรอนาน
- **ปลอดภัย 100%** ไม่ต้องให้รหัสผ่าน
- บริการลูกค้า **ตลอด 24 ชั่วโมง**

## ข้อควรระวัง

กรุณาตรวจสอบ **User ID** และ **Zone ID** ให้ถูกต้องก่อนสั่งซื้อทุกครั้ง หากกรอกข้อมูลผิดพลาดทางร้านไม่สามารถคืนเงินหรือแก้ไขได้

สั่งซื้อตอนนี้และยกระดับการเล่นเกมของคุณให้เหนือกว่าใคร!

ห้ามทำ:
- ใช้หัวข้อแบบ template เช่น "บทนำสินค้า:", "คำกระตุ้นการตัดสินใจ:", "Required Information:"
- ใช้ # (h1) สำหรับหัวข้อ (ใช้ ## เท่านั้น)
- ใช้ไอคอนรูปแบบ [IconName] หรืออิโมจิใดๆ
- bold ทั้งประโยค ให้ bold เฉพาะคำสำคัญ
- เขียนรวม paragraph ยาวๆ ไม่มีหัวข้อ
- สร้างขั้นตอนวิธีใช้ที่ไม่มีอยู่จริง
- ใช้ภาษาอังกฤษเป็นหัวข้อ (เช่น "Required Information") ให้ใช้ภาษาไทยทั้งหมด

เขียนคำอธิบายตอนนี้:`;
  }

  // Build prompt for short description
  private buildShortDescriptionPrompt(
    productName: string,
    _productType: string,
    categoryName: string | undefined,
    fullDescription: string,
  ): string {
    return `สร้างคำอธิบายสั้น (ไม่เกิน 255 ตัวอักษร) สำหรับสินค้า "${productName}"${categoryName ? ` (แพลตฟอร์ม: ${categoryName})` : ""}

คำอธิบายเต็ม:
${fullDescription.substring(0, 300)}...

ข้อกำหนด:
1. ภาษาไทย
2. ไม่เกิน 255 ตัวอักษร
3. จุดเด่นหลักของสินค้า${categoryName ? `\n4. ระบุแพลตฟอร์ม ${categoryName} ในคำอธิบาย` : ""}
5. ไม่ใช้ Emoji

เขียนคำอธิบายสั้น (ตอบเฉพาะข้อความ):`;
  }

  // Build prompt for meta content
  private buildMetaPrompt(
    productName: string,
    _productType: string,
    categoryName: string | undefined,
    fullDescription: string,
  ): string {
    return `สร้าง SEO Meta Tags สำหรับ "${productName}"${categoryName ? ` (แพลตฟอร์ม: ${categoryName})` : ""}

คำอธิบายสินค้า:
${fullDescription.substring(0, 200)}...

รูปแบบการตอบ (เขียนเป็นภาษาไทย):
META_TITLE: [ชื่อสินค้า + ประโยชน์หลัก - ไม่เกิน 60 ตัวอักษร]
META_DESCRIPTION: [คำอธิบายสั้น + คำกระตุ้น - ไม่เกิน 160 ตัวอักษร]
META_KEYWORDS: [คีย์เวิร์ด1, คีย์เวิร์ด2, คีย์เวิร์ด3, คีย์เวิร์ด4, คีย์เวิร์ด5]
${categoryName ? `\nหมายเหตุ: ใส่ชื่อแพลตฟอร์ม "${categoryName}" ใน keywords ด้วย` : ""}

ตัวอย่าง:
META_TITLE: เติมเพชร Free Fire ราคาถูก ส่งไวใน 1 นาที
META_DESCRIPTION: บริการเติมเพชร Free Fire ราคาถูกที่สุด ส่งไวอัตโนมัติ ปลอดภัย 100% สั่งซื้อเลยตอนนี้!
META_KEYWORDS: เติมเพชร Free Fire, เติมเกมถูก, รับเติมเพชร, Free Fire Diamonds, เติมเกมออนไลน์

สร้าง Meta Tags ตอนนี้ (ตอบเฉพาะรูปแบบด้านบน):`;
  }

  // Parse meta content from AI response
  private parseMetaContent(content: string): {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  } {
    const lines = content.split("\n").map((line) => line.trim());

    let metaTitle = "";
    let metaDescription = "";
    let metaKeywords = "";

    for (const line of lines) {
      if (line.startsWith("META_TITLE:")) {
        metaTitle = line.replace("META_TITLE:", "").trim();
      } else if (line.startsWith("META_DESCRIPTION:")) {
        metaDescription = line.replace("META_DESCRIPTION:", "").trim();
      } else if (line.startsWith("META_KEYWORDS:")) {
        metaKeywords = line.replace("META_KEYWORDS:", "").trim();
      }
    }

    // Fallback if parsing failed
    if (!metaTitle) {
      metaTitle = content.substring(0, 60);
    }
    if (!metaDescription) {
      const sentences = content.split(/[.!?]/);
      metaDescription =
        sentences[0]?.substring(0, 160) || content.substring(0, 160);
    }
    if (!metaKeywords) {
      // Extract keywords from content
      const words = content
        .toLowerCase()
        .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 8);
      metaKeywords = Array.from(new Set(words)).join(", ");
    }

    return {
      metaTitle: metaTitle.substring(0, 60),
      metaDescription: metaDescription.substring(0, 160),
      metaKeywords,
    };
  }

  // Build prompt for game details
  private buildGameDetailsPrompt(
    productName: string,
    _productType: string,
    categoryName: string | undefined,
    _fullDescription: string,
  ): string {
    const inferredPlatforms = this.getPlatformsFromCategory(categoryName);

    return `ระบุข้อมูลเกมสำหรับสินค้า "${productName}"${categoryName ? ` (แพลตฟอร์ม: ${categoryName})` : ""}

รูปแบบการตอบ (ภาษาอังกฤษหรือไทย):
DEVELOPER: [ชื่อบริษัทผู้พัฒนา เช่น Riot Games, miHoYo, Garena]
PUBLISHER: [ชื่อบริษัทผู้จัดจำหน่าย เช่น Tencent, Garena]
PLATFORMS: [เลือกจาก: iOS, Android, PC, Console]
${inferredPlatforms ? `\nคำแนะนำ: สินค้านี้อยู่ในหมวดหมู่ "${categoryName}" ซึ่งปกติจะรองรับแพลตฟอร์ม: ${inferredPlatforms} (ใช้เป็นแนวทาง แต่ให้ตรวจสอบจากชื่อสินค้าด้วย)` : ""}

ตัวอย่าง 1:
DEVELOPER: Riot Games
PUBLISHER: Riot Games
PLATFORMS: iOS, Android

ตัวอย่าง 2:
DEVELOPER: miHoYo
PUBLISHER: HoYoverse
PLATFORMS: iOS, Android, PC

หากไม่ทราบข้อมูล ให้ใช้ "Unknown"

ระบุข้อมูลเกมตอนนี้ (ตอบเฉพาะรูปแบบด้านบน):`;
  }

  // Parse game details from AI response
  private parseGameDetailsContent(content: string): GeneratedGameDetails {
    const lines = content.split("\n").map((line) => line.trim());

    let developer = "";
    let publisher = "";
    let platforms: string[] = [];

    const validPlatforms = ["iOS", "Android", "PC", "Console"];

    for (const line of lines) {
      if (line.startsWith("DEVELOPER:")) {
        developer = line.replace("DEVELOPER:", "").trim();
      } else if (line.startsWith("PUBLISHER:")) {
        publisher = line.replace("PUBLISHER:", "").trim();
      } else if (line.startsWith("PLATFORMS:")) {
        const platformsText = line.replace("PLATFORMS:", "").trim();
        // Extract valid platforms from the response
        platforms = validPlatforms.filter((platform) =>
          platformsText.toLowerCase().includes(platform.toLowerCase()),
        );
      }
    }

    // Fallback if parsing failed
    if (!developer) {
      developer = "Unknown";
    }
    if (!publisher) {
      publisher = "Unknown";
    }
    if (platforms.length === 0) {
      // Try to infer from content
      const contentLower = content.toLowerCase();
      if (
        contentLower.includes("mobile") ||
        contentLower.includes("ios") ||
        contentLower.includes("android")
      ) {
        platforms.push("iOS", "Android");
      }
      if (
        contentLower.includes("pc") ||
        contentLower.includes("computer") ||
        contentLower.includes("steam")
      ) {
        platforms.push("PC");
      }
      if (
        contentLower.includes("console") ||
        contentLower.includes("playstation") ||
        contentLower.includes("xbox")
      ) {
        platforms.push("Console");
      }
      // Default to mobile if nothing found (most common for top-ups)
      if (platforms.length === 0) {
        platforms = ["iOS", "Android"];
      }
    }

    return {
      developer,
      publisher,
      platforms,
    };
  }

  // ============ Editorial Content Generation ============

  /**
   * Generate FAQ article content using AI
   */
  async generateFaqContent(
    topic: string,
    categoryName: string,
    onProgress?: ContentGenerationProgressCallback,
  ): Promise<GeneratedEditorialContent> {
    return this.generateEditorialContent(
      topic,
      this.buildFaqPrompt(topic, categoryName),
      onProgress,
    );
  }

  /**
   * Generate news article content using AI
   */
  async generateNewsContent(
    topic: string,
    categoryName: string,
    onProgress?: ContentGenerationProgressCallback,
  ): Promise<GeneratedEditorialContent> {
    return this.generateEditorialContent(
      topic,
      this.buildNewsPrompt(topic, categoryName),
      onProgress,
    );
  }

  /**
   * Generate CMS page content using AI
   */
  async generateCmsPageContent(
    topic: string,
    pageType: string,
    onProgress?: ContentGenerationProgressCallback,
  ): Promise<GeneratedEditorialContent> {
    return this.generateEditorialContent(
      topic,
      this.buildCmsPagePrompt(topic, pageType),
      onProgress,
    );
  }

  private async generateEditorialContent(
    topic: string,
    prompt: string,
    onProgress?: ContentGenerationProgressCallback,
  ): Promise<GeneratedEditorialContent> {
    onProgress?.({ stage: "preparing", message: "กำลังเตรียมข้อมูล..." });

    if (!this.isConfigured()) {
      throw new Error(
        "Z.ai API key not configured. Please set NEXT_PUBLIC_ZAI_API_KEY in your .env file.",
      );
    }

    onProgress?.({ stage: "generating", message: "กำลังสร้างเนื้อหาด้วย AI..." });

    const response = await this.callZaiApi(prompt);
    const choice = response.choices[0];
    let content = choice.message.content?.trim() || "";

    // Handle reasoning models
    const reasoning = (choice.message as any).reasoning_content as
      | string
      | undefined;
    if (!content && reasoning) {
      const contentMatch = reasoning.match(/CONTENT:\s*([\s\S]*?)(?=\n\n|$)/i);
      if (contentMatch) {
        content = contentMatch[1].trim();
      }
    }

    if (!content) {
      throw new Error("AI returned empty response. Please try again.");
    }

    onProgress?.({ stage: "parsing", message: "กำลังประมวลผลผลลัพธ์..." });

    const result = this.parseEditorialContent(content, topic);

    onProgress?.({ stage: "completed", message: "สร้างเสร็จสมบูรณ์!" });

    return result;
  }

  private buildFaqPrompt(topic: string, categoryName: string): string {
    return `สร้างบทความ FAQ (คำถามที่พบบ่อย) สำหรับเว็บไซต์เติมเกม

หัวข้อ: "${topic}"
หมวดหมู่: ${categoryName}

รูปแบบการตอบ (ตอบเฉพาะรูปแบบนี้เท่านั้น):
TITLE: [หัวข้อคำถามที่ชัดเจน ไม่เกิน 100 ตัวอักษร]
CONTENT: [คำตอบโดยละเอียด ใช้ภาษาไทย ระดับ 200-500 คำ พร้อมหัวข้อย่อยถ้าจำเป็น]
EXCERPT: [สรุปสั้นๆ ไม่เกิน 150 ตัวอักษร สำหรับแสดงในรายการ]
SLUG: [slug ภาษาอังกฤษ ใช้ตัวพิมพ์เล็ก ตัวเลข และขีดกลางเท่านั้น เช่น account-locked-login-help]

ข้อกำหนด:
1. ใช้ภาษาไทยทั้งหมด
2. เขียนในเชิงให้คำแนะนำ ช่วยเหลือลูกค้า
3. เนื้อหาต้องเป็นประโยชน์และเข้าใจง่าย
4. ถ้าเป็นคำถามเทคนิค ให้อธิบายขั้นตอนอย่างละเอียด
5. ไม่ใช้อิโมจิ
6. ใช้ Markdown formatting ได้ (## สำหรับหัวข้อย่อย, **bold** สำหรับคำสำคัญ)
7. สร้าง SLUG เป็นภาษาอังกฤษ พร้อมเชื่อมคำด้วยขีดกลาง

ตัวอย่างที่ถูกต้อง:
TITLE: วิธีเติมเพชร Mobile Legends อย่างไรให้ปลอดภัย
CONTENT: ## ขั้นตอนการเติมเพชร Mobile Legends

การเติมเพชร **Mobile Legends** ผ่านระบบของเรานั้นง่ายและปลอดภัย โดยมีขั้นตอนดังนี้:

1. เข้าสู่ระบบและเลือกจำนวนเพชรที่ต้องการ
2. กรอก **User ID** และ **Zone ID** ให้ถูกต้อง
3. เลือกช่องทางชำระเงิน
4. รอรับเพชรภายใน 1-5 นาที

## ข้อควรระวัง
- ตรวจสอบ ID ให้ถูกต้องก่อนสั่งซื้อ
- หากมีปัญหาให้ติดต่อแอดมินทันที

EXCERPT: คู่มือเติมเพชร Mobile Legends ขั้นตอนง่ายๆ ปลอดภัย 100% พร้อมข้อควรระวังสำคัญ
SLUG: how-to-topup-mobile-legends-safely

สร้างบทความ FAQ ตอนนี้ (ตอบเฉพาะรูปแบบด้านบน):`;
  }

  private buildNewsPrompt(topic: string, categoryName: string): string {
    return `สร้างบทความข่าวสารสำหรับเว็บไซต์เติมเกม

หัวข้อข่าว: "${topic}"
หมวดหมู่ข่าว: ${categoryName}

รูปแบบการตอบ (ตอบเฉพาะรูปแบบนี้เท่านั้น):
TITLE: [พาดหัวข่าวชัดเจน กระชับ ไม่เกิน 100 ตัวอักษร]
CONTENT: [เนื้อหาข่าวฉบับเต็มภาษาไทย 250-600 คำ มีโครงสร้างอ่านง่าย]
EXCERPT: [สรุปข่าวสั้นๆ ไม่เกิน 160 ตัวอักษร]
SLUG: [slug ภาษาอังกฤษ ใช้ตัวพิมพ์เล็ก ตัวเลข และขีดกลางเท่านั้น]

ข้อกำหนด:
1. ใช้โทนการเขียนแบบข่าวสาร/ประกาศอย่างมืออาชีพ ไม่ใช่สไตล์ FAQ
2. ย่อหน้าแรกต้องสรุปประเด็นสำคัญของข่าวให้ครบ (ใคร/อะไร/เมื่อไร/ผลกระทบ)
3. จัดโครงสร้างเนื้อหาด้วยหัวข้อย่อย (##) และ bullet points เมื่อเหมาะสม
4. เนื้อหาต้องสอดคล้องกับหมวดหมู่ข่าว: ${categoryName}
5. หลีกเลี่ยงข้อมูลเกินจริงและห้ามใช้ภาษาคลุมเครือ
6. ไม่ใช้อิโมจิ
7. สร้าง SLUG เป็นภาษาอังกฤษพร้อมเชื่อมคำด้วยขีดกลาง

ตัวอย่างที่ถูกต้อง:
TITLE: ประกาศปิดปรับปรุงระบบชำระเงินชั่วคราว 24 ก.พ. 2026
CONTENT: ระบบจะปิดปรับปรุงชั่วคราวในวันที่ 24 ก.พ. 2026 เวลา 01:00-03:00 น. เพื่อเพิ่มประสิทธิภาพและความเสถียรของธุรกรรม

## รายละเอียดการปรับปรุง
- ช่วงเวลา: 01:00-03:00 น.
- บริการที่ได้รับผลกระทบ: การชำระเงินบางช่องทาง
- บริการที่ยังใช้งานได้: การเรียกดูสินค้าและประวัติคำสั่งซื้อ

## คำแนะนำสำหรับผู้ใช้งาน
โปรดวางแผนการสั่งซื้อล่วงหน้า หากทำรายการไม่สำเร็จระหว่างช่วงเวลาดังกล่าว สามารถทำรายการใหม่ได้หลังระบบกลับมาปกติ

EXCERPT: แจ้งปิดปรับปรุงระบบชำระเงินชั่วคราว 24 ก.พ. 2026 เวลา 01:00-03:00 น. เพื่อเพิ่มประสิทธิภาพการให้บริการ
SLUG: payment-system-maintenance-feb-24-2026

สร้างบทความข่าวสารตอนนี้ (ตอบเฉพาะรูปแบบด้านบน):`;
  }

  private buildCmsPagePrompt(topic: string, pageType: string): string {
    return `สร้างเนื้อหาหน้าเว็บไซต์แบบ CMS (Static Page) สำหรับเว็บไซต์เติมเกม

ชื่อหน้า: "${topic}"
ประเภทหน้า: ${pageType}

รูปแบบการตอบ (ตอบเฉพาะรูปแบบนี้เท่านั้น):
TITLE: [ชื่อหน้าชัดเจน เหมาะกับการแสดงผลบนเว็บไซต์]
CONTENT: [เนื้อหาเต็มภาษาไทย 300-800 คำ ในรูปแบบอ่านง่าย]
EXCERPT: [สรุปเนื้อหาสั้นๆ ไม่เกิน 160 ตัวอักษร สำหรับ SEO/รายการ]
SLUG: [slug ภาษาอังกฤษ ใช้ตัวพิมพ์เล็ก ตัวเลข และขีดกลางเท่านั้น]

ข้อกำหนด:
1. โทนภาษาเป็นทางการ อ่านง่าย และน่าเชื่อถือ
2. เหมาะสำหรับหน้าเว็บไซต์ถาวร เช่น นโยบายความเป็นส่วนตัว, เงื่อนไขการใช้งาน, เกี่ยวกับเรา
3. ไม่เขียนแบบข่าว และไม่เขียนแบบ Q&A
4. ใช้หัวข้อย่อย (##) เพื่อแบ่งเนื้อหาเป็นส่วนชัดเจน
5. ถ้ามีรายการเงื่อนไข ให้ใช้เลขข้อหรือ bullet points
6. ไม่ใช้อิโมจิ
7. หลีกเลี่ยงการอ้างอิงวันที่เฉพาะเจาะจง เว้นแต่จำเป็น
8. สร้าง SLUG ภาษาอังกฤษให้เหมาะกับ URL ของหน้า CMS

ตัวอย่างที่ถูกต้อง:
TITLE: นโยบายความเป็นส่วนตัว
CONTENT: ## ข้อมูลที่เราเก็บรวบรวม
เราเก็บข้อมูลที่จำเป็นต่อการให้บริการ เช่น ข้อมูลบัญชีผู้ใช้ ประวัติการสั่งซื้อ และข้อมูลการชำระเงินตามความเหมาะสม

## วัตถุประสงค์ในการใช้ข้อมูล
ข้อมูลถูกใช้เพื่อยืนยันตัวตน ประมวลผลคำสั่งซื้อ ปรับปรุงคุณภาพบริการ และป้องกันการทุจริต

## การเก็บรักษาและความปลอดภัยของข้อมูล
เรามีมาตรการด้านเทคนิคและกระบวนการภายในเพื่อคุ้มครองข้อมูลส่วนบุคคลจากการเข้าถึงโดยไม่ได้รับอนุญาต

## การติดต่อ
หากมีคำถามเกี่ยวกับนโยบายนี้ กรุณาติดต่อทีมสนับสนุนผ่านช่องทางที่ระบุบนเว็บไซต์

EXCERPT: นโยบายความเป็นส่วนตัวเกี่ยวกับการเก็บ ใช้ และคุ้มครองข้อมูลส่วนบุคคลของผู้ใช้งานอย่างโปร่งใสและปลอดภัย
SLUG: privacy-policy

สร้างเนื้อหาหน้า CMS ตอนนี้ (ตอบเฉพาะรูปแบบด้านบน):`;
  }

  private parseEditorialContent(
    content: string,
    fallbackTopic: string,
  ): GeneratedEditorialContent {
    const lines = content.split("\n").map((line) => line.trim());

    let title = "";
    let articleContent = "";
    let excerpt = "";
    let slug = "";

    let currentSection: "title" | "content" | "excerpt" | null = null;
    let contentBuffer: string[] = [];

    for (const line of lines) {
      if (line.startsWith("TITLE:")) {
        title = line.replace("TITLE:", "").trim();
        currentSection = null;
      } else if (line.startsWith("CONTENT:")) {
        currentSection = "content";
        contentBuffer = [];
      } else if (line.startsWith("EXCERPT:")) {
        if (currentSection === "content" && contentBuffer.length > 0) {
          articleContent = contentBuffer.join("\n").trim();
        }
        excerpt = line.replace("EXCERPT:", "").trim();
        currentSection = null;
      } else if (line.startsWith("SLUG:")) {
        slug = line.replace("SLUG:", "").trim();
        currentSection = null;
      } else if (currentSection === "content") {
        contentBuffer.push(line);
      }
    }

    // If CONTENT section wasn't closed properly
    if (currentSection === "content" && contentBuffer.length > 0) {
      articleContent = contentBuffer.join("\n").trim();
    }

    // Fallbacks
    if (!title) {
      title = fallbackTopic;
    }
    if (!articleContent) {
      articleContent = content;
    }
    if (!excerpt) {
      excerpt = articleContent.substring(0, 147) + "...";
    }

    // sanitize slug to be URL safe
    const sanitizedSlug = slugify(slug || title || fallbackTopic);

    return { title, content: articleContent, excerpt, slug: sanitizedSlug };
  }
}

export const aiService = new AiService();
