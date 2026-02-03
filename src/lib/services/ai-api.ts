import axios from "axios";

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
}

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
    return !!ZAI_API_KEY && ZAI_API_KEY.length > 0 && ZAI_API_KEY !== "your_api_key_here";
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
        "Z.ai API key not configured. Please set NEXT_PUBLIC_ZAI_API_KEY in your .env.local file.";
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
      const reasoning = (choice.message as any).reasoning_content as string | undefined;
      if (reasoning) {
        // Check if content is too short, empty, or ends abruptly (truncated)
        const contentTooShort = !description || description.length < 150;
        const contentEndsAbruptly = description && (
          description.endsWith('...') ||
          description.endsWith('   ') ||
          /\d+\.$/.test(description) || // Ends with a number (like "1. ")
          /:$/.test(description) // Ends with colon
        );
        const needsExtraction = contentTooShort || contentEndsAbruptly;

        if (needsExtraction) {
          logs.push(
            this.createLog("warning", "Content incomplete, extracting from reasoning", {
              contentLength: description?.length || 0,
              contentEndsAbruptly,
              reasoningLength: reasoning.length,
            }),
          );
          onProgress?.({ ...progress, logs: [...logs] });

          // Try to extract from "Final Polish", "Final Selection", or "Refined Draft"
          const finalPolishMatch = reasoning.match(/\*Final Polish\*:\s*([\s\S]*?)(?=\n\n|$)/i);
          const finalSelectionMatch = reasoning.match(/\*Final Selection\*:\s*"?([\s\S]*?)(?:"?\s*\n\n|$)/i);
          const refinedMatch = reasoning.match(/\*Refined Draft\*:\s*([\s\S]*?)(?=\n\n\d+\.|$)/i);

          let extractedContent = "";
          if (finalPolishMatch) {
            extractedContent = finalPolishMatch[1].trim();
            logs.push(this.createLog("success", "Extracted content from 'Final Polish' section"));
          } else if (finalSelectionMatch) {
            extractedContent = finalSelectionMatch[1].trim();
            logs.push(this.createLog("success", "Extracted content from 'Final Selection' section"));
          } else if (refinedMatch) {
            extractedContent = refinedMatch[1].trim();
            logs.push(this.createLog("success", "Extracted content from 'Refined Draft' section"));
          } else {
            // Try to extract from any numbered draft section
            const draftMatch = reasoning.match(/\d+\.\s*\*\*[^*]+\*\*:\s*([\s\S]*?)(?=\n\n\d+\.|$)/);
            if (draftMatch) {
              extractedContent = draftMatch[1].trim();
              logs.push(this.createLog("success", "Extracted content from draft section"));
            } else {
              // Last resort: use the last substantial paragraph of reasoning
              const paragraphs = reasoning.split('\n\n').filter(p => p.trim().length > 100);
              if (paragraphs.length > 0) {
                extractedContent = paragraphs[paragraphs.length - 1].trim();
                logs.push(this.createLog("success", "Extracted content from last paragraph"));
              }
            }
          }

          // Use extracted content if it's better
          if (extractedContent && extractedContent.length > (description?.length || 0)) {
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
      let shortDescription = (shortDescChoice.message.content?.trim() || "").substring(0, 255);

      // Handle reasoning models
      if (!shortDescription && (shortDescChoice.message as any).reasoning_content) {
        const reasoning = (shortDescChoice.message as any).reasoning_content as string;
        const draftMatch = reasoning.match(/\d+\.\s*\*?[^*]+\*?:\s*([\s\S]*?)(?=\n\n\d+\.|$)/);
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
        const reasoning = (metaChoice.message as any).reasoning_content as string;
        // Extract from the last section or any explicit format
        const metaMatch = reasoning.match(/META_TITLE:\s*([^\n]+)\s*\n\s*META_DESCRIPTION:\s*([^\n]+)\s*\n\s*META_KEYWORDS:\s*([^\n]+)/i);
        if (metaMatch) {
          metaText = `META_TITLE: ${metaMatch[1]}\nMETA_DESCRIPTION: ${metaMatch[2]}\nMETA_KEYWORDS: ${metaMatch[3]}`;
        }
      }

      const metaContent = this.parseMetaContent(metaText || metaChoice.message.content?.trim() || "");

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
      if (!gameDetailsText && (gameDetailsChoice.message as any).reasoning_content) {
        const reasoning = (gameDetailsChoice.message as any).reasoning_content as string;
        // Try to extract from reasoning
        const devMatch = reasoning.match(/DEVELOPER:\s*([^\n]+)/i);
        const pubMatch = reasoning.match(/PUBLISHER:\s*([^\n]+)/i);
        const platMatch = reasoning.match(/PLATFORMS:\s*([^\n]+)/i);
        if (devMatch || pubMatch || platMatch) {
          gameDetailsText = [
            devMatch ? `DEVELOPER: ${devMatch[1].trim()}` : "DEVELOPER: Unknown",
            pubMatch ? `PUBLISHER: ${pubMatch[1].trim()}` : "PUBLISHER: Unknown",
            platMatch ? `PLATFORMS: ${platMatch[1].trim()}` : "PLATFORMS: iOS, Android",
          ].join("\n");
        }
      }

      const gameDetails = this.parseGameDetailsContent(gameDetailsText || gameDetailsChoice.message.content?.trim() || "");

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
      max_tokens: 4000,
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
        } else if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
          return new Error(
            "Request to Z.ai API timed out. Please try again.",
          );
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

  // Build prompt for full description
  private buildDescriptionPrompt(
    productName: string,
    productType: string,
    categoryName?: string,
  ): string {
    return `เขียนคำอธิบายสินค้าสำหรับบริการเติมเกม "${productName}"

รายละเอียด:
- ประเภท: ${productType === "DIRECT_TOPUP" ? "เติมตรง (ต้องใช้ User ID)" : "บัตรของขวัญ"}
${categoryName ? `- หมวดหมู่: ${categoryName}` : ""}

ข้อกำหนด:
1. เขียนเป็นภาษาไทย
2. ความยาว 200-400 คำ
3. เน้นประโยชน์และจุดเด่น
4. อธิบายวิธีการใช้งาน
5. ระบุความปลอดภัย
6. เพิ่มความเร่งด่วน/ของมีจำกัด
7. โทนกันเองแต่มืออาชีพ
8. ใช้ไอคอนแทนอิโมจิ (รูปแบบ: [IconName])

ไอคอนที่ใช้ได้:
- [Sparkles] = ความพิเศษ
- [Zap] หรือ [Bolt] = ความเร็ว
- [Shield] หรือ [ShieldCheck] = ความปลอดภัย
- [Rocket] = ส่งไว
- [Gamepad2] = เกม
- [Trophy] หรือ [Crown] = ความสำเร็จ
- [Gem] หรือ [Diamond] = ไอเทมเกม
- [CreditCard] หรือ [Wallet] = การชำระเงิน
- [CheckCircle2] หรือ [Check] = ตรวจสอบ/ยืนยัน
- [Clock] หรือ [Timer] = 24 ชั่วโมง
- [Headphones] = บริการลูกค้า
- [Gift] = ของขวัญ/โบนัส
- [Flame] = ความร้อนแรง/มาแรง
- [Star] = คุณภาพ
- [Smartphone] หรือ [Tablet] = อุปกรณ์

โครงสร้าง:
- บทนำที่ดึงดูด (ใช้ไอคอนดึงดูดสายตา)
- คำอธิบายสินค้า
- ประโยชน์
- วิธีใช้งาน
- ความน่าเชื่อถือ
- คำกระตุ้นการตัดสินใจ

ตัวอย่างการใช้ไอคอน:
"เติมเกม [Gamepad2] รวดเร็วด้วยระบบอัตโนมัติ [Zap] ปลอดภัย 100% [ShieldCheck]"

เขียนคำอธิบายตอนนี้ (ตอบเฉพาะเนื้อหาคำอธิบายเท่านั้น):`;
  }

  // Build prompt for short description
  private buildShortDescriptionPrompt(
    productName: string,
    _productType: string,
    _categoryName: string | undefined,
    fullDescription: string,
  ): string {
    return `สร้างคำอธิบายสั้น (ไม่เกิน 255 ตัวอักษร) สำหรับสินค้า "${productName}"

คำอธิบายเต็ม:
${fullDescription.substring(0, 300)}...

ข้อกำหนด:
1. ภาษาไทย
2. ไม่เกิน 255 ตัวอักษร
3. จุดเด่นหลักของสินค้า
4. ไม่ใช้ Emoji

เขียนคำอธิบายสั้น (ตอบเฉพาะข้อความ):`;
  }

  // Build prompt for meta content
  private buildMetaPrompt(
    productName: string,
    _productType: string,
    _categoryName: string | undefined,
    fullDescription: string,
  ): string {
    return `สร้าง SEO Meta Tags สำหรับ "${productName}"

คำอธิบายสินค้า:
${fullDescription.substring(0, 200)}...

รูปแบบการตอบ (เขียนเป็นภาษาไทย):
META_TITLE: [ชื่อสินค้า + ประโยชน์หลัก - ไม่เกิน 60 ตัวอักษร]
META_DESCRIPTION: [คำอธิบายสั้น + คำกระตุ้น - ไม่เกิน 160 ตัวอักษร]
META_KEYWORDS: [คีย์เวิร์ด1, คีย์เวิร์ด2, คีย์เวิร์ด3, คีย์เวิร์ด4, คีย์เวิร์ด5]

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
    _categoryName: string | undefined,
    _fullDescription: string,
  ): string {
    return `ระบุข้อมูลเกมสำหรับสินค้า "${productName}"

รูปแบบการตอบ (ภาษาอังกฤษหรือไทย):
DEVELOPER: [ชื่อบริษัทผู้พัฒนา เช่น Riot Games, miHoYo, Garena]
PUBLISHER: [ชื่อบริษัทผู้จัดจำหน่าย เช่น Tencent, Garena]
PLATFORMS: [เลือกจาก: iOS, Android, PC, Console]

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
      if (contentLower.includes("mobile") || contentLower.includes("ios") || contentLower.includes("android")) {
        platforms.push("iOS", "Android");
      }
      if (contentLower.includes("pc") || contentLower.includes("computer") || contentLower.includes("steam")) {
        platforms.push("PC");
      }
      if (contentLower.includes("console") || contentLower.includes("playstation") || contentLower.includes("xbox")) {
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
}

export const aiService = new AiService();
