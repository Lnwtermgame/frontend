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

// SEARXNG API configuration
const SEARXNG_BASE_URL =
  "http://searxng-rkg44wkww4sgo8wcwwos8c44.89.38.101.12.sslip.io";
const SEARXNG_API_KEY = process.env.NEXT_PUBLIC_SEARXNG_API_KEY || "";

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
  tags?: string[];
  coverImage?: string;
  sources?: string[];
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
  tools?: Array<{
    type: string;
    function?: {
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
    };
    web_search?: {
      enable: boolean;
    };
  }>;
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

  // ============ Image URL Validation & Quality Scoring ============

  /**
   * Valid image extensions
   */
  private static readonly VALID_IMAGE_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
  ];

  /**
   * Trusted game image sources (high quality, official)
   * Higher score = better source
   */
  private static readonly TRUSTED_IMAGE_SOURCES: Record<string, number> = {
    // Official game stores & platforms (highest quality)
    "cdn.steamstatic.com": 100,
    "store.steampowered.com": 100,
    "steamuserimages-a.akamaihd.net": 95,
    "cdn.cloudflare.steamstatic.com": 100,
    "cdn2.steamgriddb.com": 90,
    "steamcdn-a.akamaihd.net": 100,

    // Epic Games
    "cdn1.epicgames.com": 95,
    "epicgames.com": 90,

    // Game news & press (high quality)
    "media.steampowered.com": 100,
    "assets.rockstargames.com": 95,
    "images.ctfassets.net": 85,

    // Game journalism (good quality)
    "static.wikia.nocookie.net": 75,
    "vignette.wikia.nocookie.net": 75,
    "upload.wikimedia.org": 80, // Wikipedia
    "commons.wikimedia.org": 80,

    // Game specific CDNs
    "blz-contentstack-images.akamaized.net": 90, // Blizzard
    "images.contentstack.io": 85,
    "ubiservices.cdn.ubi.com": 90, // Ubisoft
    "images.igdb.com": 85, // IGDB
  };

  /**
   * Medium quality sources (acceptable but not ideal)
   */
  private static readonly MEDIUM_QUALITY_SOURCES: Record<string, number> = {
    "i.imgur.com": 70,
    "imgur.com": 65,
    "i.redd.it": 65,
    "preview.redd.it": 60,
    "cdn.discordapp.com": 60,
    "images.unsplash.com": 70,
    "cdn.pixabay.com": 65,
  };

  /**
   * Domains that should be excluded from image results
   * These often return HTML pages, thumbnails, or low quality images
   */
  private static readonly EXCLUDED_IMAGE_DOMAINS = [
    // Social media (thumbnails, profile pics)
    "facebook.com",
    "fb.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "tiktok.com",
    "pinterest.com",
    "linkedin.com",
    "reddit.com", // Use i.redd.it instead
    "t.co",
    // URL shorteners
    "bit.ly",
    "tinyurl.com",
    "goo.gl",
    // YouTube (thumbnails only)
    "youtube.com",
    "youtu.be",
    "i.ytimg.com", // YouTube thumbnails
    "yt3.ggpht.com", // YouTube channel avatars
    "yt3.googleusercontent.com",
    // Generic CDNs that serve thumbnails
    "thumb",
    "avatar",
  ];

  /**
   * URL patterns that indicate low quality/thumbnail images
   */
  private static readonly THUMBNAIL_PATTERNS = [
    /thumb/i,
    /thumbs?\//i,
    /small/i,
    /mini/i,
    /icon/i,
    /avatar/i,
    /profile/i,
    /_\d+x\d+\./i, // like _150x150.jpg
    /\/\d+x\d+\//i, // like /150x150/
    /\/s\d+x\d+\//i, // like /s150x150/
    /\/w\d+\//i, // like /w150/
    /\/h\d+\//i, // like /h150/
    /default/i,
    /placeholder/i,
    /preview/i,
    /lowres/i,
    /low_res/i,
    /crop/i,
    /channel/i, // YouTube channel images
    /userpic/i,
    /favicon/i,
  ];

  /**
   * URL patterns that indicate HIGH quality images
   */
  private static readonly HIGH_QUALITY_PATTERNS = [
    /original/i,
    /full/i,
    /hd/i,
    /high/i,
    /wallpaper/i,
    /screenshot/i,
    /artwork/i,
    /banner/i,
    /header/i,
    /cover/i,
    /hero/i,
    /splash/i,
    /promo/i,
    /official/i,
    /4k/i,
    /1920/i,
    /1080/i,
    /2560/i,
    /3840/i,
  ];

  /**
   * Check if a URL is a valid image URL
   * Validates: extension, domain, URL format, and NOT a thumbnail
   */
  private isValidImageUrl(url: string | undefined | null): boolean {
    if (!url || typeof url !== "string") return false;

    try {
      const parsedUrl = new URL(url);
      const fullUrl = url.toLowerCase();
      const hostname = parsedUrl.hostname.toLowerCase();
      const pathname = parsedUrl.pathname.toLowerCase();

      // Check if domain is excluded
      const isExcluded = AiService.EXCLUDED_IMAGE_DOMAINS.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      );
      if (isExcluded) {
        console.log(`[Image Validation] Excluded domain: ${hostname}`);
        return false;
      }

      // Check for thumbnail patterns - reject these!
      const isThumbnail = AiService.THUMBNAIL_PATTERNS.some((pattern) =>
        pattern.test(fullUrl),
      );
      if (isThumbnail) {
        console.log(`[Image Validation] Rejected thumbnail: ${pathname}`);
        return false;
      }

      // Check pathname has valid image extension
      const hasValidExtension = AiService.VALID_IMAGE_EXTENSIONS.some((ext) =>
        pathname.endsWith(ext),
      );

      // If has valid extension and not thumbnail, it's valid
      if (hasValidExtension) {
        return true;
      }

      // Check if URL contains image-related query params
      const searchParams = parsedUrl.searchParams;
      const hasImageParams =
        searchParams.has("format") ||
        searchParams.has("image") ||
        searchParams.has("img") ||
        searchParams.has("src");

      // Special handling for common image hosting services
      const imageHostingDomains = [
        "imgur.com",
        "i.imgur.com",
        "cdn.",
        "images.",
        "img.",
        "static.",
        "media.",
        "picsum.photos",
        "unsplash.com",
        "pexels.com",
        "flickr.com",
        "cloudinary.com",
        "imgbb.com",
        "postimg.cc",
      ];

      const isImageHosting = imageHostingDomains.some(
        (domain) => hostname.includes(domain) || hostname.startsWith(domain),
      );

      if (isImageHosting) {
        // For image hosting, be more lenient but still check for obvious red flags
        const hasObviousNonImageIndicators =
          pathname.includes("/watch") ||
          pathname.includes("/video") ||
          pathname.includes("/page") ||
          pathname.includes("/post") ||
          pathname.includes("/user") ||
          pathname.includes("/profile");

        return !hasObviousNonImageIndicators;
      }

      // If URL has no extension and no image params, reject
      if (!hasImageParams) {
        console.log(
          `[Image Validation] No valid extension or image params: ${pathname}`,
        );
        return false;
      }

      return true;
    } catch (e) {
      console.log(`[Image Validation] Invalid URL: ${url}`);
      return false;
    }
  }

  /**
   * Score image quality based on source and URL patterns
   * Higher score = better quality image
   */
  private scoreImageQuality(url: string): number {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      const fullUrl = url.toLowerCase();
      let score = 50; // Base score

      // Check trusted sources (high quality)
      for (const [domain, domainScore] of Object.entries(
        AiService.TRUSTED_IMAGE_SOURCES,
      )) {
        if (hostname.includes(domain) || hostname === domain) {
          score = Math.max(score, domainScore);
          break;
        }
      }

      // Check medium quality sources
      for (const [domain, domainScore] of Object.entries(
        AiService.MEDIUM_QUALITY_SOURCES,
      )) {
        if (hostname.includes(domain) || hostname === domain) {
          score = Math.max(score, domainScore);
          break;
        }
      }

      // Bonus for high quality patterns in URL
      for (const pattern of AiService.HIGH_QUALITY_PATTERNS) {
        if (pattern.test(fullUrl)) {
          score += 10;
        }
      }

      // Penalty for any remaining thumbnail-like patterns
      for (const pattern of AiService.THUMBNAIL_PATTERNS) {
        if (pattern.test(fullUrl)) {
          score -= 30;
        }
      }

      // Bonus for larger file size indicators
      if (fullUrl.includes("1920") || fullUrl.includes("1080")) score += 5;
      if (fullUrl.includes("2560") || fullUrl.includes("1440")) score += 10;
      if (fullUrl.includes("4k") || fullUrl.includes("3840")) score += 15;

      return Math.max(0, Math.min(100, score));
    } catch {
      return 0;
    }
  }

  /**
   * Filter and validate image URLs from SEARXNG results
   * Returns only URLs that are likely to be actual HIGH QUALITY images
   * Sorted by quality score (best first)
   */
  private filterValidImageUrls(
    images: any[],
  ): { url: string; title?: string; score: number }[] {
    const validImages: { url: string; title?: string; score: number }[] = [];

    for (const img of images) {
      // Try different URL fields from SEARXNG - prioritize img_src over thumbnail
      const possibleUrls = [
        img.img_src, // Often the full size image
        img.url, // Sometimes the source page
        img.image, // Alternative field
        // Skip thumbnail fields - we want full size images
      ].filter(Boolean);

      for (const url of possibleUrls) {
        if (this.isValidImageUrl(url)) {
          const score = this.scoreImageQuality(url);
          // Only accept images with decent quality score
          if (score >= 40) {
            validImages.push({
              url,
              title: img.title || img.content || "",
              score,
            });
            break; // Only add the first valid URL for this image
          }
        }
      }
    }

    // Sort by score (highest first)
    validImages.sort((a, b) => b.score - a.score);

    console.log(
      `[Image Validation] Filtered ${validImages.length}/${images.length} high quality images`,
    );

    if (validImages.length > 0) {
      console.log(
        `[Image Validation] Top 3 scores:`,
        validImages.slice(0, 3).map((i) => ({
          score: i.score,
          domain: new URL(i.url).hostname,
        })),
      );
    }

    return validImages;
  }

  // Search using SEARXNG via proxy API route
  private async searchWithSearxng(
    query: string,
    categories?: string[],
    lang: string = "th",
  ): Promise<{
    results: any[];
    images: { url: string; title?: string; score: number }[];
    videos: any[];
  }> {
    try {
      console.log("[SEARXNG] Searching for:", query);

      // Search for text content via proxy
      const searchParams = new URLSearchParams({
        q: query,
        language: lang,
        time_range: "week",
      });

      if (categories && categories.length > 0) {
        searchParams.append("category", categories.join(","));
      }

      const proxyUrl = `/api/searxng?${searchParams.toString()}`;

      const response = await axios.get(proxyUrl, {
        timeout: 30000,
        headers: {
          Accept: "application/json",
        },
      });

      console.log("[SEARXNG] Search results:", {
        resultsCount: response.data?.results?.length || 0,
      });

      // Search for images via proxy
      const imageParams = new URLSearchParams({
        q: query,
        category: "images",
        time_range: "month",
      });

      const imageProxyUrl = `/api/searxng?${imageParams.toString()}`;

      let validImages: { url: string; title?: string; score: number }[] = [];
      try {
        const imageResponse = await axios.get(imageProxyUrl, {
          timeout: 30000,
          headers: {
            Accept: "application/json",
          },
        });
        const imageResults = imageResponse.data?.results || [];

        // Filter valid image URLs
        validImages = this.filterValidImageUrls(imageResults);

        console.log("[SEARXNG] Image results:", {
          raw: imageResults.length,
          valid: validImages.length,
        });
      } catch (imageError) {
        console.log("[SEARXNG] Image search failed:", imageError);
      }

      // Search for videos via proxy
      const videoParams = new URLSearchParams({
        q: `${query} official trailer gameplay`,
        category: "videos",
        time_range: "month",
      });

      const videoProxyUrl = `/api/searxng?${videoParams.toString()}`;

      let videoResults: any[] = [];
      try {
        const videoResponse = await axios.get(videoProxyUrl, {
          timeout: 30000,
          headers: {
            Accept: "application/json",
          },
        });
        videoResults = videoResponse.data?.results || [];
        console.log("[SEARXNG] Video results:", {
          videosCount: videoResults.length,
        });
      } catch (videoError) {
        console.log("[SEARXNG] Video search failed:", videoError);
      }

      return {
        results: response.data?.results || [],
        images: validImages, // Return validated images with scores
        videos: videoResults,
      };
    } catch (error) {
      console.error("[SEARXNG] Search error:", error);
      // Return empty results on error so AI can still generate content
      return { results: [], images: [], videos: [] } as {
        results: any[];
        images: { url: string; title?: string; score: number }[];
        videos: any[];
      };
    }
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
    retries = 3, // เพิ่มเป็น 3 ครั้ง
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
      max_tokens: 8000,
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

  // Call Z.ai API with web search tool enabled
  private async callZaiApiWithWebSearch(
    prompt: string,
    retries = 2,
  ): Promise<ZaiChatCompletionResponse> {
    const request: ZaiChatCompletionRequest = {
      model: "glm-4.7",
      messages: [
        {
          role: "system",
          content:
            "You are an expert e-commerce copywriter with access to web search. Use web search to find real news, promotions, and updates about gaming. Respond directly with the requested content in Thai language.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 8000,
      stream: false,
      tools: [
        {
          type: "web_search",
          web_search: {
            enable: true,
          },
        },
      ],
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `[Z.ai Web Search] Retry attempt ${attempt}/${retries}...`,
          );
        }

        console.log(
          "[Z.ai Web Search] Sending request with web search enabled:",
          {
            url: "/chat/completions",
            model: request.model,
            attempt: attempt + 1,
          },
        );

        const response = await this.client.post<ZaiChatCompletionResponse>(
          "/chat/completions",
          request,
        );

        console.log("[Z.ai Web Search] Response received:", {
          status: response.status,
          hasContent: !!response.data?.choices?.[0]?.message?.content,
          hasToolCalls: !!(response.data?.choices?.[0]?.message as any)
            ?.tool_calls,
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
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(
              `[Z.ai Web Search] Request failed, retrying in ${delay}ms...`,
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

  // Store used topics and their variations to prevent duplicates
  private usedTopicsCache: Map<string, string[]> = new Map();

  /**
   * Generate news article content using AI with SEARXNG search
   * Includes anti-duplication logic: random angles, dynamic search, and variation
   */
  async generateNewsContent(
    topic: string,
    categoryName: string,
    onProgress?: ContentGenerationProgressCallback,
    existingSlugs?: string[], // Pass existing article slugs to avoid duplicates
    preferredAngle?: string, // Optional: specific angle to use instead of random
  ): Promise<GeneratedEditorialContent> {
    try {
      onProgress?.({
        stage: "preparing",
        message: "กำลังวิเคราะห์และสร้างมุมมองข่าวที่ไม่ซ้ำ...",
      });

      if (!this.isConfigured()) {
        throw new Error(
          "Z.ai API key not configured. Please set NEXT_PUBLIC_ZAI_API_KEY in your .env file.",
        );
      }

      onProgress?.({
        stage: "searching",
        message: "กำลังค้นหาข้อมูลจากแหล่งต่างๆ...",
      });

      // Step 1: Generate unique search strategy with multiple variations
      const searchVariations = this.generateSearchVariations(
        topic,
        categoryName,
      );

      // Try different search queries and combine results
      let allResults: {
        results: any[];
        images: { url: string; title?: string; score: number }[];
        videos: any[];
      } = {
        results: [],
        images: [],
        videos: [],
      };

      // Search with multiple queries to get diverse results
      for (const query of searchVariations.slice(0, 3)) {
        try {
          const results = await this.searchWithSearxng(query, [
            "general",
            "news",
          ]);
          allResults.results.push(...results.results);
          allResults.images.push(...results.images);
          allResults.videos.push(...results.videos);
        } catch (e) {
          console.log("[AI News] Search variation failed:", query);
        }
      }

      // Remove duplicates from combined results
      allResults.results = this.deduplicateResults(allResults.results, "url");
      allResults.images = this.deduplicateResults(allResults.images, "url");
      allResults.videos = this.deduplicateResults(allResults.videos, "url");

      console.log("[AI News] Combined search completed:", {
        textResults: allResults.results.length,
        imageResults: allResults.images.length,
        videoResults: allResults.videos.length,
      });

      onProgress?.({
        stage: "generating",
        message: "กำลังสร้างเนื้อหาข่าวที่ไม่ซ้ำ...",
      });

      // Step 2: Generate unique content angle (or use preferred if provided)
      const newsAngle = this.generateNewsAngle(
        topic,
        categoryName,
        preferredAngle,
      );

      console.log("[AI News] Generated angle:", newsAngle);

      // Step 3: Build prompt with search results and unique angle
      const prompt = this.buildNewsPromptWithSearxng(
        topic,
        categoryName,
        allResults,
        newsAngle,
        existingSlugs,
      );

      console.log("[AI News] Calling Z.ai API...");

      // Step 3: Generate content with AI
      const response = await this.callZaiApi(prompt);

      console.log("[AI News] Z.ai API response received");

      const choice = response.choices[0];
      let content = choice.message.content?.trim() || "";

      // Handle reasoning models
      const reasoning = (choice.message as any).reasoning_content as
        | string
        | undefined;
      if (!content && reasoning) {
        const contentMatch = reasoning.match(
          /CONTENT:\s*([\s\S]*?)(?=\n\n|$)/i,
        );
        if (contentMatch) {
          content = contentMatch[1].trim();
        }
      }

      if (!content) {
        throw new Error("AI returned empty response. Please try again.");
      }

      onProgress?.({ stage: "parsing", message: "กำลังประมวลผลผลลัพธ์..." });

      const result = this.parseEditorialContent(content, topic);

      // Separate cover image from content images
      // Use first image for cover, rest for content
      const coverImage =
        allResults.images.length > 0 ? allResults.images[0] : null;
      const contentImages = allResults.images.slice(1); // Skip first image for content

      // Set cover image from SEARXNG if not provided by AI
      if (!result.coverImage && coverImage) {
        result.coverImage = coverImage.url;
        console.log(
          "[AI News] Cover image set:",
          result.coverImage,
          `(score: ${coverImage.score})`,
        );
      }

      // Log content images (different from cover)
      if (contentImages.length > 0) {
        console.log(
          "[AI News] Content images available:",
          contentImages.length,
          "images (different from cover)",
        );
      }

      // Embed YouTube video in content if available and not already in content
      if (allResults.videos.length > 0) {
        const officialVideo = allResults.videos.find(
          (v) => v.url?.includes("youtube.com") || v.url?.includes("youtu.be"),
        );
        if (officialVideo && !result.content.includes(officialVideo.url)) {
          // Extract video ID from YouTube URL
          const videoId = extractYoutubeVideoId(officialVideo.url);
          if (videoId) {
            // Append video embed to content
            result.content += `\n\n## วิดีโอที่เกี่ยวข้อง\n\n[![วิดีโอบน YouTube](https://img.youtube.com/vi/${videoId}/0.jpg)](${officialVideo.url})\n\n[▶️ ดูวิดีโอบน YouTube](${officialVideo.url})\n`;
          }
        }
      }

      // Add sources from SEARXNG results
      if (allResults.results.length > 0) {
        result.sources = allResults.results
          .slice(0, 3)
          .map((r) => r.url)
          .filter((url): url is string => !!url);
      }

      onProgress?.({ stage: "completed", message: "สร้างเสร็จสมบูรณ์!" });

      return result;
    } catch (error) {
      console.error("[AI News] Generation failed:", error);
      throw error;
    }
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

    onProgress?.({
      stage: "generating",
      message: "กำลังสร้างเนื้อหาด้วย AI...",
    });

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
CONTENT: [เนื้อหาข่าวฉบับเต็มภาษาไทย 800-1500 คำ มีโครงสร้างอ่านง่าย เนื้อหาละเอียดครบถ้วน]
EXCERPT: [สรุปข่าวสั้นๆ ไม่เกิน 160 ตัวอักษร]
SLUG: [slug ภาษาอังกฤษ ใช้ตัวพิมพ์เล็ก ตัวเลข และขีดกลางเท่านั้น]
TAGS: [แท็ก 3-7 คำ คั่นด้วยลูกน้ำ เช่น โปรโมชั่น, เติมเกม, ส่วนลด, ลูกค้าใหม่]

ข้อกำหนดที่สำคัญ:
1. ต้องเป็นข่าวจริงเท่านั้น (factual news) - ห้ามสร้างข้อมูลเท็จหรือข่าวปลอม
2. เนื้อหาข่าวต้องยาว 800-1500 คำ อย่างน้อย 5-7 ย่อหน้า ครอบคลุมรายละเอียดทุกด้าน
3. ระยะเวลาของเหตุการณ์หรือโปรโมชั่นในข่าวต้องไม่เกิน 7 วันนับจากวันนี้ (ถ้าไม่ระบุวันที่ ให้ถือว่าเป็นข่าวล่าสุด)
4. ใช้โทนการเขียนแบบข่าวสาร/ประกาศอย่างมืออาชีพ เป็นทางการแต่เข้าใจง่าย
5. ย่อหน้าแรกต้องสรุปประเด็นสำคัญของข่าวให้ครบ (ใคร/อะไร/เมื่อไร/ที่ไหน/ทำไม)
6. เนื้อหาต้องประกอบด้วย:
   - บทนำสรุปสาระสำคัญ
   - รายละเอียดเหตุการณ์/โปรโมชั่น
   - เงื่อนไขหรือข้อควรรู้ (ถ้ามี)
   - ขั้นตอนการเข้าร่วม/ใช้งาน (ถ้ามี)
   - สรุปหรือคำแนะนำท้ายข่าว
7. ใช้หัวข้อย่อย (##) แบ่งเนื้อหาให้ชัดเจน อย่างน้อย 3-4 หัวข้อย่อย
8. เนื้อหาต้องสอดคล้องกับหมวดหมู่ข่าว: ${categoryName}
9. หลีกเลี่ยงข้อมูลเกินจริงและห้ามใช้ภาษาคลุมเครือ
10. ไม่ใช้อิโมจิ ไม่ใช้ภาษาวัยรุ่น
11. สร้าง SLUG เป็นภาษาอังกฤษพร้อมเชื่อมคำด้วยขีดกลาง
12. แท็ก (TAGS) ต้องเป็นภาษาไทย 3-7 คำ ที่เกี่ยวข้องกับเนื้อหาโดยตรง คั่นด้วยลูกน้ำ

ตัวอย่างที่ถูกต้อง:
TITLE: ประกาศโปรโมชั่นพิเศษรับวันวาเลนไทน์ ลดสูงสุด 50% ทุกเกม
CONTENT: ## โปรโมชั่นพิเศษรับวันแห่งความรัก

เว็บไซต์ Lnwtermgame ขอมอบของขวัญสุดพิเศษรับเทศกาลวันวาเลนไทน์ 2568 ด้วยโปรโมชั่นลดราคาค่าเติมเกมสูงสุดถึง 50% สำหรับทุกเกมในระบบ ตั้งแต่วันที่ 10-16 กุมภาพันธ์ 2568

## รายละเอียดโปรโมชั่น
- ส่วนลดสูงสุด 50% สำหรับการเติมเกมทุกประเภท
- ไม่จำกัดจำนวนครั้งในการใช้สิทธิ์
- รับสิทธิ์ได้ทันทีโดยไม่ต้องใช้รหัสคูปอง

## เงื่อนไขการเข้าร่วม
1. สมาชิกทุกระดับสามารถใช้สิทธิ์ได้
2. โปรโมชั่นนี้ไม่สามารถใช้ร่วมกับโปรโมชั่นอื่นได้
3. ส่วนลดจะคำนวณจากราคาปกติเท่านั้น

## วิธีการรับสิทธิ์
เพียงเข้าสู่ระบบและทำการสั่งซื้อตามปกติ ระบบจะคำนวณส่วนลดให้อัตโนมัติ หากมีข้อสงสัยสามารถติดต่อฝ่ายบริการลูกค้าได้ตลอด 24 ชั่วโมง

EXCERPT: โปรโมชั่นวันวาเลนไทน์ 2568 ลดสูงสุด 50% ทุกเกม ตั้งแต่ 10-16 ก.พ. นี้ เติมเกมคุ้มกว่าที่เคย
SLUG: valentine-promotion-2026-50-percent-off
TAGS: โปรโมชั่น, วันวาเลนไทน์, ลดราคา, เติมเกม, ส่วนลด 50%, จำกัดเวลา

สร้างบทความข่าวสารตอนนี้ (ตอบเฉพาะรูปแบบด้านบน):`;
  }

  // ============ Anti-Duplication Helper Methods ============

  /**
   * Generate multiple search query variations for the same topic
   * This helps find different sources and angles
   * Includes queries optimized for finding high-quality game images
   */
  private generateSearchVariations(
    topic: string,
    categoryName: string,
  ): string[] {
    const variations: string[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Base variations with different focuses
    const templates = [
      `${topic} latest news`,
      `${topic} update ${currentYear}`,
      `${topic} new features`,
      `${topic} gameplay changes`,
      `${topic} event ${currentMonth}`,
      `${topic} patch notes`,
      `${topic} community`,
      `${topic} esports`,
      `${topic} guide tips`,
      `${topic} review ${currentYear}`,
      `${topic} release date`,
      `${topic} announcement`,
      `${topic} trailer`,
      `${topic} beta alpha`,
      `${topic} season pass`,
    ];

    // Image-optimized search queries (for finding high quality game images)
    const imageOptimizedQueries = [
      `${topic} official screenshot hd`,
      `${topic} gameplay screenshot`,
      `${topic} wallpaper hd`,
      `${topic} official artwork`,
      `${topic} game cover art`,
      `${topic} steam store`,
      `${topic} official website`,
    ];

    // Shuffle and pick random variations
    const shuffled = templates.sort(() => Math.random() - 0.5);
    const shuffledImages = imageOptimizedQueries.sort(
      () => Math.random() - 0.5,
    );

    // Always include base topic + category
    variations.push(`${topic} gaming news ${categoryName}`);

    // Add 3 random content variations
    variations.push(...shuffled.slice(0, 3));

    // Add 2 image-optimized queries (these help find high quality images)
    variations.push(...shuffledImages.slice(0, 2));

    return variations;
  }

  /**
   * Remove duplicate results based on a key field
   */
  private deduplicateResults<T extends Record<string, any>>(
    results: T[],
    keyField: string,
  ): T[] {
    const seen = new Set<string>();
    return results.filter((item) => {
      const key = item[keyField];
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Generate a random news angle/focus to ensure variety
   * If preferredAngle is provided and valid, use that instead of random
   */
  private generateNewsAngle(
    topic: string,
    categoryName: string,
    preferredAngle?: string,
  ): {
    angle: string;
    contentType: string;
    tone: string;
    focusKeywords: string[];
  } {
    // Different news angles to rotate through
    const angles = [
      {
        angle: "ข่าวล่าสุดและการอัปเดต",
        contentType: "breaking-news",
        tone: "ตื่นเต้น เร่งด่วน",
        focusKeywords: ["ล่าสุด", "เพิ่งประกาศ", "อัปเดตใหม่", " Breaking"],
      },
      {
        angle: "คู่มือและเคล็ดลับ",
        contentType: "guide",
        tone: "ให้คำแนะนำ เป็นประโยชน์",
        focusKeywords: ["วิธี", "เคล็ดลับ", "คู่มือ", "สอน"],
      },
      {
        angle: "วิเคราะห์และรีวิว",
        contentType: "analysis",
        tone: "เชิงลึก เป็นกลาง",
        focusKeywords: ["วิเคราะห์", "รีวิว", "ประเมิน", "สรุป"],
      },
      {
        angle: "ข่าวกิจกรรมและโปรโมชั่น",
        contentType: "event",
        tone: "สร้างความตื่นเต้น กระตุ้น",
        focusKeywords: ["กิจกรรม", "โปรโมชั่น", "รางวัล", "ลุ้น"],
      },
      {
        angle: "ข่าวอีสปอร์ตและการแข่งขัน",
        contentType: "esports",
        tone: "กระชับ ตื่นเต้น",
        focusKeywords: ["แข่งขัน", "ทัวร์นาเมนต์", "ทีม", "ชนะ"],
      },
      {
        angle: "เรื่องราวชุมชน",
        contentType: "community",
        tone: "เป็นกันเอง สนุกสนาน",
        focusKeywords: ["ผู้เล่น", "ชุมชน", "แฟนๆ", "พูดคุย"],
      },
      {
        angle: "การเปรียบเทียบและอันดับ",
        contentType: "comparison",
        tone: "ให้ข้อมูล เปรียบเทียบ",
        focusKeywords: ["เปรียบเทียบ", "Top", "อันดับ", "VS"],
      },
      {
        angle: "เบื้องหลังและการพัฒนา",
        contentType: "behind-scenes",
        tone: "ลึกซึ้ง น่าสนใจ",
        focusKeywords: ["พัฒนา", "ทีมงาน", "เบื้องหลัง", "การสร้าง"],
      },
    ];

    // If preferred angle is provided and valid, use it
    let selectedAngle: (typeof angles)[0];

    if (preferredAngle && preferredAngle !== "random") {
      const foundAngle = angles.find((a) => a.contentType === preferredAngle);
      if (foundAngle) {
        selectedAngle = foundAngle;
      } else {
        // Fallback to random if preferred angle not found
        selectedAngle = angles[Math.floor(Math.random() * angles.length)];
      }
    } else {
      // Randomly select an angle
      selectedAngle = angles[Math.floor(Math.random() * angles.length)];
    }

    // Random seed is not needed in keywords - just return the angle as-is
    // The random selection of angles already provides enough variety
    return selectedAngle;
  }

  /**
   * Generate a unique slug by adding timestamp or random suffix if needed
   */
  private generateUniqueSlug(
    baseSlug: string,
    existingSlugs?: string[],
  ): string {
    let slug = baseSlug;
    let attempts = 0;
    const maxAttempts = 100;

    // Check against existing slugs
    if (existingSlugs) {
      while (existingSlugs.includes(slug) && attempts < maxAttempts) {
        const timestamp = Date.now().toString(36).slice(-4);
        const random = Math.floor(Math.random() * 1000);
        slug = `${baseSlug}-${timestamp}-${random}`;
        attempts++;
      }
    }

    // If still not unique, add timestamp
    if (existingSlugs?.includes(slug)) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    return slug;
  }

  /**
   * Get specific writing guidelines based on content type
   */
  private getAngleSpecificGuidelines(contentType: string): string {
    const guidelines: Record<string, string> = {
      "breaking-news": `- เน้นข้อมูลล่าสุดและเพิ่งเกิดขึ้น
- ใช้คำกริยาที่แสดงความเร่งด่วน เช่น "เพิ่งประกาศ", "ล่าสุด", "ด่วน"
- ระบุวันที่และเวลาที่ชัดเจน
- เน้นความใหม่ของข้อมูล`,

      guide: `- โครงสร้างเป็นแบบ Step-by-step
- ใช้หัวข้อย่อยที่ชัดเจน เช่น "ขั้นตอนที่ 1", "ขั้นตอนที่ 2"
- ให้ตัวอย่างที่เข้าใจง่าย
- มีเคล็ดลับพิเศษ (Pro Tips)
- สรุปจุดสำคัญท้ายบทความ`,

      analysis: `- เริ่มต้นด้วยบทสรุปผลการวิเคราะห์
- ให้ข้อมูลเชิงลึกและนัยสำคัญ
- เปรียบเทียบข้อดีข้อเสีย
- อ้างอิงแหล่งที่มาของข้อมูล
- ให้มุมมองที่เป็นกลาง`,

      event: `- ระบุช่วงเวลาของกิจกรรมชัดเจน (วันที่ เวลา)
- เน้นของรางวัลหรือสิทธิประโยชน์
- อธิบายวิธีการเข้าร่วมอย่างละเอียด
- สร้างความตื่นเต้นและอยากเข้าร่วม
- ใส่ Call-to-action ชัดเจน`,

      esports: `- เน้นผลการแข่งขันและสถิติ
- ระบุชื่อทีมและผู้เล่นที่สำคัญ
- อธิบายรูปแบบการแข่งขัน
- ให้ข้อมูลรางวัลและเงินรางวัล
- บอกวันที่และเวลาถ่ายทอดสด`,

      community: `- เล่าเรื่องราวของผู้เล่น
- เน้นประสบการณ์และความรู้สึก
- มี quotes หรือคำพูดที่น่าสนใจ
- สร้างความสัมพันธ์กับผู้อ่าน
- ชวนให้แสดงความคิดเห็น`,

      comparison: `- ใช้ตารางเปรียบเทียบถ้าเป็นไปได้
- ระบุหมวดหมู่ที่เปรียบเทียบชัดเจน
- ให้คะแนนหรืออันดับ
- อธิบายเหตุผลของการจัดอันดับ
- สรุปว่าอันไหนเหมาะกับใคร`,

      "behind-scenes": `- เล่าเรื่องราวเบื้องหลัง
- ให้ข้อมูลเกี่ยวกับทีมพัฒนา
- อธิบายกระบวนการสร้างสรรค์
- มี quotes จากผู้พัฒนา
- เผยข้อมูลที่หลายคนไม่รู้`,
    };

    return guidelines[contentType] || guidelines["breaking-news"];
  }

  private buildNewsPromptWithSearxng(
    topic: string,
    categoryName: string,
    searchResults: {
      results: any[];
      images: { url: string; title?: string; score: number }[];
      videos: any[];
    },
    newsAngle?: {
      angle: string;
      contentType: string;
      tone: string;
      focusKeywords: string[];
    },
    existingSlugs?: string[],
  ): string {
    // Format search results for the prompt
    const topResults = searchResults.results
      .slice(0, 5)
      .map(
        (r, i) =>
          `${i + 1}. ${r.title}\n   ${r.content?.substring(0, 200) || r.title}\n   URL: ${r.url}`,
      )
      .join("\n\n");

    // SEPARATE: Cover image (first) vs Content images (rest)
    // Cover image - use ONLY for COVER_IMAGE field
    const coverImageUrl = searchResults.images[0]?.url || "";
    const coverImageTitle = searchResults.images[0]?.title || "";

    // Content images - use INSIDE the article content
    // Skip the first image since it's used for cover
    const contentImages = searchResults.images.slice(1, 6);
    const contentImageUrls = contentImages
      .map(
        (img, i) =>
          `Content Image ${i + 1}: ${img.url}${img.title ? ` (${img.title})` : ""}`,
      )
      .join("\n");

    const videoUrls = searchResults.videos
      .slice(0, 3)
      .map((v, i) => `Video ${i + 1}: ${v.title} - ${v.url}`)
      .join("\n");

    const sourceUrls = searchResults.results
      .slice(0, 3)
      .map((r) => r.url)
      .filter((url) => !!url)
      .join(", ");

    // Generate random angle-specific instructions
    const angleInstructions = newsAngle
      ? `
=== มุมมองและแนวทางการเขียนข่าว ===
ประเภทข่าว: ${newsAngle.contentType}
มุมมอง: ${newsAngle.angle}
โทนการเขียน: ${newsAngle.tone}
คำสำคัญที่ควรใช้: ${newsAngle.focusKeywords.join(", ")}

คำแนะนำเฉพาะสำหรับมุมมองนี้:
${this.getAngleSpecificGuidelines(newsAngle.contentType)}
`
      : "";

    // Generate unique slug hint based on angle
    const slugHint = newsAngle
      ? `${slugify(topic)}-${newsAngle.contentType}-${Date.now()
          .toString(36)
          .slice(-4)}`
      : slugify(topic);

    return `สร้างบทความข่าวสารสำหรับเว็บไซต์เติมเกม โดยใช้ข้อมูลจากการค้นหาด้านล่าง

หัวข้อข่าว: "${topic}"
หมวดหมู่ข่าว: ${categoryName}
${angleInstructions}
=== ข้อมูลจากการค้นหา (SEARXNG) ===

ข่าวและบทความที่เกี่ยวข้อง:
${topResults || "ไม่พบข้อมูลเฉพาะเจาะจง"}

=== รูปภาพ (แยกชัดเจน) ===

📌 รูปปก (COVER_IMAGE) - ใช้สำหรับหน้าปกเท่านั้น:
${coverImageUrl ? `${coverImageUrl}${coverImageTitle ? ` (${coverImageTitle})` : ""}` : "ไม่พบรูปปก"}

📸 รูปภาพสำหรับเนื้อหา (Content Images) - ใช้แทรกในเนื้อหาเท่านั้น (ต่างจากรูปปก):
${contentImageUrls || "ไม่พบรูปภาพสำหรับเนื้อหา"}

วิดีโอที่เกี่ยวข้อง:
${videoUrls || "ไม่พบวิดีโอ"}

=== ข้อกำหนดสำคัญ ===
1. สร้างบทความข่าวที่มีเนื้อหาเป็นเอกลักษณ์ ไม่ซ้ำกับข่าวอื่น
2. เน้นข้อมูลล่าสุดและเป็นปัจจุบัน
3. เนื้อหาต้องเป็นข้อเท็จจริง ไม่สร้างข้อมูลเท็จ
4. ⚠️ รูปปกและรูปในเนื้อหาต้องเป็นคนละรูปกัน
5. แสดงแหล่งที่มาของข่าวเพื่อความน่าเชื่อถือ

รูปแบบการตอบ (ตอบเฉพาะรูปแบบนี้เท่านั้น):
TITLE: [พาดหัวข่าวชัดเจน กระชับ ไม่เกิน 100 ตัวอักษร]
CONTENT: [เนื้อหาข่าวฉบับเต็มภาษาไทย 800-1500 คำ แทรกรูปภาพจาก "รูปภาพสำหรับเนื้อหา" 2-3 รูป ใช้ Markdown: ![รายละเอียด](URL) และถ้ามีวิดีโอ ใช้ HTML iframe embed]
EXCERPT: [สรุปข่าวสั้นๆ ไม่เกิน 160 ตัวอักษร]
SLUG: [slug ภาษาอังกฤษ เช่น ${slugHint}]
TAGS: [แท็ก 3-7 คำ คั่นด้วยลูกน้ำ]
COVER_IMAGE: [ใช้ URL จาก "รูปปก" ด้านบน เช่น ${coverImageUrl}]
SOURCES: [แหล่งข่าว เช่น ${sourceUrls}]

ข้อกำหนดเพิ่มเติม:
1. เนื้อหาข่าวยาว 800-1500 คำ อย่างน้อย 5-7 ย่อหน้า
2. ⚠️ แทรกรูปภาพในเนื้อหาจาก "รูปภาพสำหรับเนื้อหา" เท่านั้น (ไม่ใช่รูปปก)
3. ⚠️ ถ้ามีวิดีโอ YouTube ให้แทรกเป็น EMBED โดยตรงในเนื้อหา ใช้ HTML:
   <div class="youtube-embed"><iframe src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen></iframe></div>
   (เปลี่ยน VIDEO_ID เป็น ID จริงจาก URL วิดีโอ เช่น ถ้า URL คือ https://www.youtube.com/watch?v=ABC123 ให้ใช้ ABC123)
4. ใช้หัวข้อย่อย (##) อย่างน้อย 3-4 หัวข้อ
5. ไม่ใช้อิโมจิ
6. ⚠️ COVER_IMAGE และรูปใน CONTENT ต้องไม่ซ้ำกัน
7. ห้ามใช้รูปแบบ [▶️ ดูวิดีโอบน YouTube](URL) - ต้องใช้ iframe embed เท่านั้น

สร้างบทความข่าวสารที่น่าสนใจตอนนี้:`;
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
    let tags: string[] = [];
    let coverImage = "";
    let sources: string[] = [];

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
      } else if (line.startsWith("TAGS:")) {
        if (currentSection === "content" && contentBuffer.length > 0) {
          articleContent = contentBuffer.join("\n").trim();
        }
        const tagsStr = line.replace("TAGS:", "").trim();
        tags = tagsStr
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        currentSection = null;
      } else if (line.startsWith("COVER_IMAGE:")) {
        coverImage = line.replace("COVER_IMAGE:", "").trim();
        currentSection = null;
      } else if (line.startsWith("SOURCES:")) {
        if (currentSection === "content" && contentBuffer.length > 0) {
          articleContent = contentBuffer.join("\n").trim();
        }
        const sourcesStr = line.replace("SOURCES:", "").trim();
        sources = sourcesStr
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s.startsWith("http"));
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

    // Validate URLs
    const validCoverImage =
      coverImage && coverImage.startsWith("http") ? coverImage : undefined;

    return {
      title,
      content: articleContent,
      excerpt,
      slug: sanitizedSlug,
      tags,
      coverImage: validCoverImage,
      sources: sources.length > 0 ? sources : undefined,
    };
  }
}

// Helper function to extract YouTube video ID from URL
function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

export const aiService = new AiService();
