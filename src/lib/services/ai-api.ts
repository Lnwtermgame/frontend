import axios from "axios";

// DuckDuckGo image search result type (from /api/image-search)
interface DDGImageResult {
  image: string;
  title: string;
  height: number;
  width: number;
  thumbnail: string;
  url: string;
  source: string;
}

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

// LiteLLM API configuration
const LITELLM_API_BASE_URL =
  process.env.NEXT_PUBLIC_LITELLM_API_URL ||
  "http://litellm-l8k0ggssggs8k8k44kko0404.89.38.101.12.sslip.io";
const LITELLM_API_KEY = process.env.NEXT_PUBLIC_LITELLM_API_KEY || "";

// Perplexica model configuration (API calls go through /api/perplexica proxy)
let perplexicaChatModel =
  process.env.NEXT_PUBLIC_PERPLEXICA_CHAT_MODEL || "z-ai/glm4.7";
let perplexicaEmbeddingModel =
  process.env.NEXT_PUBLIC_PERPLEXICA_EMBEDDING_MODEL ||
  "mxbai-embed-large-v1";

// AI Model interface
export interface AIModel {
  id: string;
  name?: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

// Cached models
let cachedModels: AIModel[] = [];
let modelsCacheTime = 0;
const MODELS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Perplexica provider cache
export interface PerplexicaProvider {
  id: string;
  name: string;
  chatModels: { name: string; key: string }[];
  embeddingModels: { name: string; key: string }[];
}
let cachedPerplexicaProviders: PerplexicaProvider[] = [];
let perplexicaProvidersCacheTime = 0;
const PERPLEXICA_PROVIDERS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

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

// LiteLLM API request types
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

// ====================================================================
// BUSINESS DNA — Centralized business context for all AI prompts
// ====================================================================
const BUSINESS_DNA = `[Business DNA — Lnwtermgame]
ชื่อแบรนด์: Lnwtermgame (เทพเติมเกม)
URL: https://lnwtermgame.com
ประเภทธุรกิจ: แพลตฟอร์ม E-commerce เติมเกมออนไลน์และสินค้าดิจิทัลครบวงจร
กลุ่มเป้าหมาย: เกมเมอร์ไทยและเอเชียตะวันออกเฉียงใต้ทุกวัย (15-35 ปีเป็นหลัก)

บริการหลัก:
- เติมเกมตรง (Direct Top-Up): เติมเพชร, เติม UC, เติม Robux, เติม V-Bucks ผ่าน User ID/Player ID ไม่ต้องให้รหัสผ่าน
- บัตรของขวัญดิจิทัล (Gift Card): Steam Wallet, PSN Card, Xbox Gift Card, Nintendo eShop, Google Play, iTunes/App Store Card, Garena Shells
- บัตรเติมเงินมือถือ: AIS, DTAC, TrueMove H

แพลตฟอร์มเกมที่รองรับ:
- มือถือ: PUBG Mobile, Mobile Legends, Free Fire, Genshin Impact, ROV (Arena of Valor), Honkai: Star Rail, Call of Duty Mobile, Roblox
- PC: Steam, Epic Games, VALORANT, League of Legends, Battle.net
- Console: PlayStation (PS4/PS5), Xbox, Nintendo Switch

จุดเด่น (USPs):
- จัดส่งอัตโนมัติ ไม่ต้องรอ — ระบบจัดส่งรหัสทันทีหลังชำระเงิน
- ราคาเป็นธรรม — ไม่บวกเพิ่มเกินจริง มีโปรโมชั่นสม่ำเสมอ
- ปลอดภัย 100% — ชำระผ่านระบบที่ได้มาตรฐาน ไม่ต้องให้รหัสผ่านเกม
- บริการลูกค้า 24 ชั่วโมง — ทีมซัพพอร์ตพร้อมช่วยเหลือทุกเมื่อ
- ครอบคลุมทุกเกม — รองรับเกมยอดนิยมทุกแพลตฟอร์ม

ช่องทางชำระเงิน: PromptPay, โอนธนาคาร, TrueMoney Wallet, บัตรเครดิต/เดบิต, 7-Eleven Counter Service

โทนแบรนด์: เป็นมิตร น่าเชื่อถือ ทันสมัย ใช้ภาษาเข้าใจง่าย ไม่ทางการเกินไป เน้นความสะดวกรวดเร็ว

คู่แข่ง: Codashop, Razer Gold, Garena Top-Up Center, MOL
จุดแตกต่าง: ครอบคลุมทุกแพลตฟอร์มในที่เดียว ใช้งานง่าย มีระบบ FAQ และข่าวสารเกมอัปเดตตลอด`;

// AI Service class with debug capabilities
class AiService {
  private client = axios.create({
    baseURL: LITELLM_API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LITELLM_API_KEY}`,
    },
    timeout: 300000, // 300 seconds (5 min) timeout for long AI generation
  });

  private selectedModel: string = ""; // Selected model, empty means use default

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
      !!LITELLM_API_KEY &&
      LITELLM_API_KEY.length > 0 &&
      LITELLM_API_KEY !== "your_api_key_here"
    );
  }

  // Get available models from LiteLLM
  async fetchModels(): Promise<AIModel[]> {
    const now = Date.now();
    if (cachedModels.length > 0 && now - modelsCacheTime < MODELS_CACHE_TTL) {
      return cachedModels;
    }

    try {
      const response = await this.client.get("/v1/models");
      const models = response.data?.data || [];
      cachedModels = models.map((m: any) => ({
        id: m.id,
        name: m.id,
        object: m.object,
        created: m.created,
        owned_by: m.owned_by,
      }));
      modelsCacheTime = now;
      console.log("[LiteLLM] Fetched models:", cachedModels.length);
      return cachedModels;
    } catch (error) {
      console.error("[LiteLLM] Failed to fetch models:", error);
      return [];
    }
  }

  // Get cached models (synchronous)
  getCachedModels(): AIModel[] {
    return cachedModels;
  }

  // Set selected model
  setModel(modelId: string): void {
    this.selectedModel = modelId;
    console.log("[LiteLLM] Model set to:", modelId);
  }

  // Get selected model
  getSelectedModel(): string {
    return this.selectedModel;
  }

  // Get default model (first available or empty string)
  async getDefaultModel(): Promise<string> {
    const models = await this.fetchModels();
    return models.length > 0 ? models[0].id : "";
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
    // Non-gaming Thai sites that pollute results
    "sasimasuk.com",
    "bitkub.com",
    "pantip.com",
    "sanook.com",
    "kapook.com",
    "mthai.com",
    "thairath.co.th",
    "dailynews.co.th",
    "matichon.co.th",
    "bangkokpost.com",
    "manager.co.th",
    "pptvhd36.com",
    "amarintv.com",
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
    /official/i,
    /4k/i,
    /1920/i,
    /1080/i,
    /2560/i,
    /3840/i,
  ];

  /**
   * Keywords that indicate store/commercial content (exclude these)
   */
  private static readonly STORE_KEYWORDS = [
    "เติมเกม",
    "รับเติม",
    "เติมเงิน",
    "ร้าน",
    "ราคาถูก",
    "ส่วนลด",
    "โปรโมชั่น",
    "฿",
    "THB",
    "บาท",
    "topup",
    "เติมทรู",
    "เติมวอลเล็ท",
    "ร้านค้า",
    "สินค้า",
    "ซื้อขาย",
    "ราคา",
    "discount",
    "promotion",
    "store",
    "shop",
    "cheap",
    "sale",
  ];

  /**
   * Keywords that indicate cheating/cheat trainer content (exclude these)
   */
  private static readonly CHEAT_KEYWORDS = [
    "โปร",
    "โปรแกรมช่วยเล่น",
    "โปรแกรมโกง",
    "สอนโกง",
    "hack",
    "cheat",
    "trainer",
    "mod menu",
    "aimbot",
    "wallhack",
    "esp",
    "speed hack",
    "unlimited",
    "free gems",
    "free diamonds",
    "generator",
    "online hack",
    "cheat engine",
    "โกง",
    "ฮัค",
    "โปรฟีฟาย",
    "โปรrov",
    "โปรml",
    "โปรเกม",
    "โปร pubg",
    "โปร free fire",
    "cheat",
    "หลอกลวง",
    "scam",
  ];

  /**
   * Check if image title/content indicates it's from a store/commercial source
   */
  private isStoreImage(title: string = "", url: string = ""): boolean {
    const combined = `${title} ${url}`.toLowerCase();
    return AiService.STORE_KEYWORDS.some((keyword) =>
      combined.includes(keyword.toLowerCase()),
    );
  }

  /**
   * Check if video/content indicates cheating/cheat trainer
   */
  private isCheatContent(
    title: string = "",
    url: string = "",
    content: string = "",
  ): boolean {
    const combined = `${title} ${url} ${content}`.toLowerCase();
    return AiService.CHEAT_KEYWORDS.some((keyword) =>
      combined.includes(keyword.toLowerCase()),
    );
  }

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

  // Get API configuration status for debugging
  private async fetchPerplexicaProviders(): Promise<PerplexicaProvider[]> {
    const now = Date.now();
    const cacheAge = now - perplexicaProvidersCacheTime;
    if (
      cachedPerplexicaProviders.length > 0 &&
      cacheAge < PERPLEXICA_PROVIDERS_CACHE_TTL
    ) {
      console.log("[Perplexica Providers] Using cached providers:", {
        count: cachedPerplexicaProviders.length,
        cacheAgeMs: cacheAge,
        cacheTtlMs: PERPLEXICA_PROVIDERS_CACHE_TTL,
      });
      return cachedPerplexicaProviders;
    }

    console.log("[Perplexica Providers] Cache miss or expired, fetching from API...");
    try {
      const response = await axios.get("/api/perplexica", {
        timeout: 0, // No timeout
      });
      cachedPerplexicaProviders = response.data?.providers || [];
      perplexicaProvidersCacheTime = now;
      console.log(
        "[Perplexica Providers] Fetched providers successfully:",
        cachedPerplexicaProviders.length,
      );
      // Log each provider for debugging
      cachedPerplexicaProviders.forEach((p, i) => {
        console.log(`[Perplexica Providers] Provider ${i + 1}:`, {
          id: p.id,
          name: p.name,
          chatModelsCount: p.chatModels?.length || 0,
          embeddingModelsCount: p.embeddingModels?.length || 0,
        });
      });
      return cachedPerplexicaProviders;
    } catch (error: any) {
      console.error("[Perplexica Providers] Failed to fetch providers:", {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
      });
      return [];
    }
  }

  // Find provider ID by model key prefix (e.g., "z-ai" for "z-ai/glm4.7")
  private findPerplexicaProvider(
    providers: PerplexicaProvider[],
    modelKey: string,
  ): { providerId: string; key: string } | null {
    const modelPrefix = modelKey.split("/")[0];

    for (const provider of providers) {
      const chatModel = provider.chatModels.find(
        (m) => m.key === modelKey || m.key.startsWith(modelPrefix),
      );
      if (chatModel) {
        return { providerId: provider.id, key: chatModel.key };
      }
    }
    return null;
  }

  // Find embedding provider separately (embedding models are often in different providers)
  private findPerplexicaEmbeddingProvider(
    providers: PerplexicaProvider[],
    modelKey: string,
  ): { providerId: string; key: string } | null {
    for (const provider of providers) {
      const embeddingModel = provider.embeddingModels.find(
        (m) => m.key === modelKey || m.key.includes(modelKey.split("/")[0]),
      );
      if (embeddingModel) {
        return { providerId: provider.id, key: embeddingModel.key };
      }
    }
    // Fallback to first available embedding model
    for (const provider of providers) {
      if (provider.embeddingModels.length > 0) {
        return {
          providerId: provider.id,
          key: provider.embeddingModels[0].key,
        };
      }
    }
    return null;
  }

  // Call Perplexica Search API
  private async callPerplexicaSearch(
    query: string,
    systemInstructions?: string,
    optimizationMode: "speed" | "balanced" | "quality" = "balanced",
  ): Promise<{
    message: string;
    sources: { content: string; metadata: { title: string; url: string } }[];
  }> {
    const startTime = Date.now();
    console.log("[Perplexica Search] ========== CALL START ==========");

    console.log("[Perplexica Search] Fetching providers...");
    const providers = await this.fetchPerplexicaProviders();
    console.log("[Perplexica Search] Providers fetched:", providers.length);

    if (providers.length === 0) {
      throw new Error("No Perplexica providers available");
    }

    // Find chat model provider
    console.log("[Perplexica Search] Finding chat model provider for:", perplexicaChatModel);
    const chatProvider = this.findPerplexicaProvider(
      providers,
      perplexicaChatModel,
    );
    if (!chatProvider) {
      console.warn(
        `[Perplexica Search] Chat model ${perplexicaChatModel} not found, using first available`,
      );
    }

    // Find embedding model provider (separate from chat model - often different providers)
    console.log("[Perplexica Search] Finding embedding model provider for:", perplexicaEmbeddingModel);
    const embeddingProvider = this.findPerplexicaEmbeddingProvider(
      providers,
      perplexicaEmbeddingModel,
    );
    if (!embeddingProvider) {
      console.warn(
        `[Perplexica Search] Embedding model ${perplexicaEmbeddingModel} not found, using first available`,
      );
    }

    // Build chat model config
    const chatModelConfig = chatProvider || {
      providerId: providers.find((p) => p.chatModels.length > 0)?.id || "",
      key:
        providers.find((p) => p.chatModels.length > 0)?.chatModels[0]?.key ||
        "",
    };

    // Build embedding model config
    const embeddingModelConfig = embeddingProvider || {
      providerId: providers.find((p) => p.embeddingModels.length > 0)?.id || "",
      key:
        providers.find((p) => p.embeddingModels.length > 0)?.embeddingModels[0]
          ?.key || "",
    };

    console.log("[Perplexica Search] Selected models:", {
      chatModel: chatModelConfig.key,
      chatProvider: chatModelConfig.providerId,
      embeddingModel: embeddingModelConfig.key,
      embeddingProvider: embeddingModelConfig.providerId,
    });

    const requestBody = {
      chatModel: chatModelConfig,
      embeddingModel: embeddingModelConfig,
      optimizationMode,
      sources: ["web"],
      query,
      history: [], // Clear history to avoid previous image uploads
      stream: false,
    };

    if (systemInstructions) {
      (requestBody as any).systemInstructions = systemInstructions;
      console.log("[Perplexica Search] System instructions added, length:", systemInstructions.length);
    }

    console.log("[Perplexica Search] Request body prepared, calling /api/perplexica...");
    console.log("[Perplexica Search] Request details:", {
      query: query.substring(0, 100) + (query.length > 100 ? "..." : ""),
      queryLength: query.length,
      chatModel: requestBody.chatModel.key,
      embeddingModel: requestBody.embeddingModel.key,
      optimizationMode: requestBody.optimizationMode,
      sources: requestBody.sources,
      historyLength: requestBody.history?.length || 0,
      hasSystemInstructions: !!systemInstructions,
    });

    const response = await axios.post("/api/perplexica", requestBody, {
      timeout: 0, // No timeout - AI operations can take a long time
    });

    const elapsed = Date.now() - startTime;
    console.log(`[Perplexica Search] ========== CALL SUCCESS (${elapsed}ms) ==========`);
    console.log("[Perplexica Search] Response received:", {
      hasMessage: !!response.data?.message,
      messageLength: response.data?.message?.length || 0,
      sourcesCount: response.data?.sources?.length || 0,
      hasError: !!response.data?.error,
    });

    return {
      message: response.data?.message || "",
      sources: response.data?.sources || [],
    };
  }

  // Get API configuration status for debugging
  getConfigStatus(): {
    hasKey: boolean;
    keyLength: number;
    baseUrl: string;
    model: string;
  } {
    return {
      hasKey: !!LITELLM_API_KEY && LITELLM_API_KEY.length > 0,
      keyLength: LITELLM_API_KEY?.length || 0,
      baseUrl: LITELLM_API_BASE_URL,
      model: this.selectedModel || "default",
    };
  }

  // Get Perplexica configuration
  getPerplexicaConfig(): {
    baseUrl: string;
    chatModel: string;
    embeddingModel: string;
  } {
    return {
      baseUrl: "/api/perplexica", // Using proxy route
      chatModel: perplexicaChatModel,
      embeddingModel: perplexicaEmbeddingModel,
    };
  }

  // Set Perplexica models
  setPerplexicaChatModel(model: string): void {
    perplexicaChatModel = model;
    console.log("[Perplexica] Chat model set to:", model);
  }

  setPerplexicaEmbeddingModel(model: string): void {
    perplexicaEmbeddingModel = model;
    console.log("[Perplexica] Embedding model set to:", model);
  }

  // Fetch Perplexica providers (public method)
  async getPerplexicaProviders(): Promise<PerplexicaProvider[]> {
    return this.fetchPerplexicaProviders();
  }

  // ============ DuckDuckGo Image Search & Content Insertion ============

  /**
   * Search for game-related images via the /api/image-search proxy route
   */
  /**
   * Check if an image is relevant to the game topic
   * by looking for topic keywords in the title, URL, or source
   */
  private isImageRelevantToTopic(
    img: DDGImageResult,
    topic: string,
  ): boolean {
    const topicWords = topic
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const combined = `${img.title} ${img.url} ${img.source}`.toLowerCase();

    // At least one significant word from the topic must appear
    return topicWords.some((word) => combined.includes(word));
  }

  private async searchGameImages(
    query: string,
    maxResults: number = 10,
    topic?: string,
  ): Promise<DDGImageResult[]> {
    try {
      console.log("[Image Search] Searching:", query);

      const response = await axios.post(
        "/api/image-search",
        { query, iterations: 1 },
        { timeout: 30000 },
      );

      const images: DDGImageResult[] = response.data?.images || [];

      // Filter and score images using existing validation
      const candidates = images
        .filter((img) => {
          if (!this.isValidImageUrl(img.image)) return false;
          if (this.isStoreImage(img.title, img.image)) return false;
          if (this.isCheatContent(img.title, img.image)) return false;
          if (img.width && img.width < 400) return false;
          // Check relevance to the game topic
          if (topic && !this.isImageRelevantToTopic(img, topic)) return false;
          return true;
        })
        .sort((a, b) => {
          const scoreA = this.scoreImageQuality(a.image);
          const scoreB = this.scoreImageQuality(b.image);
          return scoreB - scoreA;
        })
        .slice(0, maxResults * 2); // Fetch extra to account for dead URLs

      if (candidates.length === 0) return [];

      // Verify URLs are still alive via HEAD requests
      const verifyResponse = await axios.post(
        "/api/image-search/verify",
        { urls: candidates.map((img) => img.image) },
        { timeout: 30000 },
      );
      const aliveUrls = new Set<string>(verifyResponse.data?.alive || []);

      const validImages = candidates
        .filter((img) => aliveUrls.has(img.image))
        .slice(0, maxResults);

      console.log(
        `[Image Search] ${candidates.length} candidates -> ${aliveUrls.size} alive -> ${validImages.length} final`,
      );
      return validImages;
    } catch (error: any) {
      console.error("[Image Search] Failed:", error.message);
      return [];
    }
  }

  /**
   * Check if a YouTube video is available via oEmbed API
   */
  private async isYoutubeVideoAvailable(videoId: string): Promise<boolean> {
    try {
      await axios.get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { timeout: 5000 },
      );
      return true;
    } catch {
      console.log(`[YouTube] Video unavailable: ${videoId}`);
      return false;
    }
  }

  /**
   * Search for YouTube videos related to the topic, already verified as available
   */
  private async searchYoutubeVideos(
    topic: string,
    maxResults: number = 2,
  ): Promise<{ videoId: string; title: string }[]> {
    try {
      console.log("[YouTube Search] Searching:", topic);
      const response = await axios.post(
        "/api/youtube-search",
        { query: `${topic} game`, maxResults },
        { timeout: 30000 },
      );
      const videos = response.data?.videos || [];
      console.log("[YouTube Search] Found", videos.length, "verified videos");
      return videos;
    } catch (error: any) {
      console.error("[YouTube Search] Failed:", error.message);
      return [];
    }
  }

  /**
   * Insert images into article content at appropriate positions
   * like a professional news outlet - after headings/between sections
   */
  private async insertImagesIntoContent(
    content: string,
    topic: string,
    maxImages: number = 3,
  ): Promise<{ content: string; coverImage?: string }> {
    // Split content into sections by ## headings
    const sections = content.split(/(?=^## )/m);
    if (sections.length < 2) {
      // No sections found, just try to get a cover image
      const images = await this.searchGameImages(
        `"${topic}" game official screenshot`,
        3,
        topic,
      );
      return {
        content,
        coverImage: images[0]?.image,
      };
    }

    // Extract heading keywords for targeted image searches
    const headingKeywords: { index: number; heading: string }[] = [];
    for (let i = 0; i < sections.length; i++) {
      const headingMatch = sections[i].match(/^## (.+)$/m);
      if (headingMatch) {
        headingKeywords.push({ index: i, heading: headingMatch[1] });
      }
    }

    // Select sections to insert images (spread evenly, max 3)
    // Skip first intro paragraph (no heading) and pick every other section
    const insertTargets: { index: number; heading: string }[] = [];
    if (headingKeywords.length <= maxImages) {
      // Few sections - pick first N
      insertTargets.push(...headingKeywords.slice(0, maxImages));
    } else {
      // Spread evenly across sections
      const step = Math.floor(headingKeywords.length / maxImages);
      for (let i = 0; i < maxImages; i++) {
        insertTargets.push(headingKeywords[Math.min(i * step, headingKeywords.length - 1)]);
      }
    }

    // Search for cover image first (main topic image)
    const coverImages = await this.searchGameImages(
      `"${topic}" game official screenshot`,
      5,
      topic,
    );
    const coverImage = coverImages[0]?.image;

    // Track used image URLs to avoid duplicates
    const usedUrls = new Set<string>();
    if (coverImage) usedUrls.add(coverImage);

    // Search for images per section and insert them
    for (const target of insertTargets) {
      // Use topic as primary keyword, heading is secondary context only
      const searchQuery = `"${topic}" game screenshot gameplay`;
      const images = await this.searchGameImages(searchQuery, 5, topic);

      // Find best unused image
      const bestImage = images.find((img) => !usedUrls.has(img.image));
      if (!bestImage) continue;
      usedUrls.add(bestImage.image);

      // Insert image after the heading line (after the first line break)
      const section = sections[target.index];
      const headingEnd = section.indexOf("\n");
      if (headingEnd === -1) continue;

      // Find the end of the first paragraph after the heading
      const afterHeading = section.substring(headingEnd + 1);
      const firstParaEnd = afterHeading.indexOf("\n\n");

      let insertPos: number;
      if (firstParaEnd !== -1 && firstParaEnd < 500) {
        // Insert after the first paragraph of this section
        insertPos = headingEnd + 1 + firstParaEnd;
      } else {
        // Insert right after the heading
        insertPos = headingEnd;
      }

      const altText = bestImage.title
        ? bestImage.title.replace(/[[\]]/g, "")
        : topic;
      const imageMarkdown = `\n\n![${altText}](${bestImage.image})\n`;

      sections[target.index] =
        section.substring(0, insertPos) +
        imageMarkdown +
        section.substring(insertPos);
    }

    return {
      content: sections.join(""),
      coverImage,
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
        "LiteLLM API key not configured. Please set NEXT_PUBLIC_LITELLM_API_KEY in your .env file.";
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
        keyLength: LITELLM_API_KEY.length,
        baseUrl: LITELLM_API_BASE_URL,
        model: this.selectedModel || "default",
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
              model: this.selectedModel || "default",
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
          await this.callLiteLLMApi(classificationPrompt);
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
          model: this.selectedModel || "default",
        }),
      );
      onProgress?.({ ...progress, logs: [...logs] });

      const descriptionPrompt = this.buildDescriptionPrompt(
        productName,
        productType,
        categoryName,
      );
      const descriptionResponse = await this.callLiteLLMApi(descriptionPrompt);
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
      logs.push(
        this.createLog("api_call", "Generating short description...", {
          model: this.selectedModel || "default",
        }),
      );
      onProgress?.({ ...progress, logs: [...logs] });

      const shortDescPrompt = this.buildShortDescriptionPrompt(
        productName,
        productType,
        categoryName,
        description,
      );
      const shortDescResponse = await this.callLiteLLMApi(shortDescPrompt);
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
      logs.push(
        this.createLog("api_call", "Generating SEO meta content...", {
          model: this.selectedModel || "default",
        }),
      );
      onProgress?.({ ...progress, logs: [...logs] });

      const metaPrompt = this.buildMetaPrompt(
        productName,
        productType,
        categoryName,
        description,
      );
      const metaResponse = await this.callLiteLLMApi(metaPrompt);
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
      logs.push(
        this.createLog("api_call", "Generating game details...", {
          model: this.selectedModel || "default",
        }),
      );
      onProgress?.({ ...progress, logs: [...logs] });

      const gameDetailsPrompt = this.buildGameDetailsPrompt(
        productName,
        productType,
        categoryName,
        description,
      );
      const gameDetailsResponse = await this.callLiteLLMApi(gameDetailsPrompt);
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

  // Call LiteLLM API with retry logic
  private async callLiteLLMApi(
    prompt: string,
    retries = 3,
  ): Promise<ZaiChatCompletionResponse> {
    const modelToUse = this.selectedModel || (await this.getDefaultModel());

    const request: ZaiChatCompletionRequest = {
      model: modelToUse,
      messages: [
        {
          role: "system",
          content: `${BUSINESS_DNA}

You are an expert e-commerce content writer for Lnwtermgame. You specialize in writing detailed, comprehensive, and professional content in Thai language. Always prioritize completeness and depth — never cut content short or summarize when detailed explanation is requested. Respond directly with the requested content. Do not show your reasoning or thinking process.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 16384,
      stream: false,
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[LiteLLM API] Retry attempt ${attempt}/${retries}...`);
        }

        console.log("[LiteLLM API] Sending request:", {
          url: "/v1/chat/completions",
          model: request.model,
          attempt: attempt + 1,
        });

        const response = await this.client.post<ZaiChatCompletionResponse>(
          "/v1/chat/completions",
          request,
        );

        console.log("[LiteLLM API] Response received:", {
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
              "Invalid API key. Please check your LiteLLM API key configuration.",
            );
          }

          // Retry on timeout or server errors
          if (attempt < retries) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(
              `[LiteLLM API] Request failed, retrying in ${delay}ms...`,
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

  // Call LiteLLM API with custom system prompt
  async callLiteLLMApiCustom(
    systemPrompt: string,
    userPrompt: string,
    retries = 3,
  ): Promise<ZaiChatCompletionResponse> {
    const modelToUse = this.selectedModel || (await this.getDefaultModel());

    const request: ZaiChatCompletionRequest = {
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 16384,
      stream: false,
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[LiteLLM Custom] Retry attempt ${attempt}/${retries}...`);
        }
        const response = await this.client.post<ZaiChatCompletionResponse>(
          "/v1/chat/completions",
          request,
        );
        return response.data;
      } catch (error) {
        lastError = error as Error;
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          throw new Error("Invalid API key.");
        }
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        break;
      }
    }
    throw this.formatApiError(lastError || new Error("Unknown error"));
  }

  // Call LiteLLM API with web search tool enabled
  private async callLiteLLMApiWithWebSearch(
    prompt: string,
    retries = 2,
  ): Promise<ZaiChatCompletionResponse> {
    const modelToUse = this.selectedModel || (await this.getDefaultModel());

    const request: ZaiChatCompletionRequest = {
      model: modelToUse,
      messages: [
        {
          role: "system",
          content: `${BUSINESS_DNA}

You are an expert e-commerce copywriter for Lnwtermgame with access to web search. Use web search to find real news, promotions, and updates about gaming. Respond directly with the requested content in Thai language.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 16384,
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
            `[LiteLLM Web Search] Retry attempt ${attempt}/${retries}...`,
          );
        }

        console.log(
          "[LiteLLM Web Search] Sending request with web search enabled:",
          {
            url: "/v1/chat/completions",
            model: request.model,
            attempt: attempt + 1,
          },
        );

        const response = await this.client.post<ZaiChatCompletionResponse>(
          "/v1/chat/completions",
          request,
        );

        console.log("[LiteLLM Web Search] Response received:", {
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
              "Invalid API key. Please check your LiteLLM API key configuration.",
            );
          }

          // Retry on timeout or server errors
          if (attempt < retries) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            console.log(
              `[LiteLLM Web Search] Request failed, retrying in ${delay}ms...`,
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
      console.error("[LiteLLM API Error]", {
        status,
        errorData,
        message: error.message,
        code: error.code,
        requestUrl: error.config?.url,
        hasApiKey: !!LITELLM_API_KEY && LITELLM_API_KEY.length > 0,
      });

      if (!status) {
        // Network error or no response
        if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
          return new Error(
            "Cannot connect to LiteLLM API. Please check your network connection.",
          );
        } else if (
          error.code === "ETIMEDOUT" ||
          error.code === "ECONNABORTED"
        ) {
          return new Error(
            "Request to LiteLLM API timed out. Please try again.",
          );
        } else if (!LITELLM_API_KEY) {
          return new Error(
            "LiteLLM API key is missing. Please set NEXT_PUBLIC_LITELLM_API_KEY.",
          );
        } else {
          return new Error(
            `Network error: ${error.message}. Please check your connection and API configuration.`,
          );
        }
      }

      if (status === 401) {
        return new Error(
          "Invalid API key. Please check your LiteLLM API key configuration.",
        );
      } else if (status === 429) {
        return new Error(
          "Rate limit exceeded. Please wait a moment and try again.",
        );
      } else if (status === 500) {
        return new Error("LiteLLM server error. Please try again later.");
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

    return `${BUSINESS_DNA}

คุณคือผู้เชี่ยวชาญด้านตลาดเกมในภูมิภาคเอเชียตะวันออกเฉียงใต้และตลาดสากล มีความรู้ลึกซึ้งเกี่ยวกับเกมทุกแพลตฟอร์ม จัดหมวดหมู่สินค้าเกมนี้และวิเคราะห์ศักยภาพทางการตลาด

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

    return `${BUSINESS_DNA}

คุณคือ Copywriter ระดับมืออาชีพสำหรับ Lnwtermgame เขียนคำอธิบายสินค้าที่ละเอียด น่าเชื่อถือ ช่วยให้ลูกค้าตัดสินใจซื้อได้ง่าย

สินค้า: "${productName}"

รายละเอียด:
- ประเภท: ${productType === "DIRECT_TOPUP" ? "เติมตรง (ต้องใช้ User ID)" : "บัตรของขวัญ (Gift Card)"}
${categoryName ? `- แพลตฟอร์ม/หมวดหมู่: ${categoryName}` : ""}
${platformContext ? `- บริบทแพลตฟอร์ม: ${platformContext}` : ""}

ข้อกำหนดสำคัญ:
1. เขียนเป็นภาษาไทย
2. ความยาว **400-800 คำ** — ห้ามเขียนสั้นรวบรัด ต้องอธิบายละเอียดทุกหัวข้อ
3. ห้ามใช้ไอคอนหรืออิโมจิทั้งหมด - เขียนเป็นข้อความล้วนเท่านั้น
4. ใช้ Markdown formatting เพื่อให้ดูเป็นมืออาชีพ
5. หัวข้อต้องเป็นธรรมชาติ ห้ามใช้คำแบบ template เช่น "บทนำสินค้า:", "คำกระตุ้นการตัดสินใจ:"
6. วิธีเติมต้องตรงกับข้อมูลจริง ห้ามสร้างขั้นตอนที่ไม่มีอยู่จริง
7. ย่อหน้าเปิดไม่ต้องมีหัวข้อ ให้เริ่มเขียนเนื้อหาเลยทันที
8. ห้ามตัดจบกลางประโยค ให้เขียนครบทุกหัวข้อ
9. ปิดท้ายด้วยประโยคธรรมชาติ ห้ามขึ้นหัวข้อปิดท้าย
10. ทุกหัวข้อ (##) ต้องมีเนื้อหาอย่างน้อย 3-4 ประโยค ไม่ใช่แค่ 1-2 บรรทัด

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
    return `${BUSINESS_DNA}

คุณคือ Copywriter ระดับมืออาชีพสำหรับ Lnwtermgame ที่เชี่ยวชาญด้าน Conversion Copywriting สร้างคำอธิบายสั้นที่กระชับ ดึงดูด และกระตุ้นให้ลูกค้าตัดสินใจซื้อ

    สินค้า: "${productName}"${categoryName ? ` (แพลตฟอร์ม: ${categoryName})` : ""}

    คำอธิบายเต็ม:
${fullDescription.substring(0, 500)}...

    ข้อกำหนด:
    1. ภาษาไทย ไม่เกิน 255 ตัวอักษร
    2. ต้องระบุจุดเด่นหลักของสินค้า(เช่น ส่งไว, ราคาดี, ปลอดภัย)
    3. ต้องระบุประเภทสินค้า(เช่น เติมเพชร, บัตรของขวัญ, เติมเงิน)${categoryName ? `\n4. ระบุแพลตฟอร์ม "${categoryName}" ในคำอธิบาย` : ""}
    5. ไม่ใช้ Emoji ไม่ใช้อิโมจิ
    6. เขียนให้เป็นประโยคที่สมบูรณ์ ไม่ใช่แค่รายการคำ
    7. ต้องมีคำกระตุ้นหรือจุดขายที่ทำให้ลูกค้าอยากซื้อ
    8. ห้ามเขียนซ้ำกับชื่อสินค้า ต้องให้ข้อมูลเพิ่มเติม

    เขียนคำอธิบายสั้น(ตอบเฉพาะข้อความ ไม่ต้องมี prefix): `;
  }

  // Build prompt for meta content
  private buildMetaPrompt(
    productName: string,
    _productType: string,
    categoryName: string | undefined,
    fullDescription: string,
  ): string {
    return `${BUSINESS_DNA}

คุณคือ SEO Specialist ระดับมืออาชีพสำหรับ Lnwtermgame ที่เชี่ยวชาญการเขียน Meta Tags สำหรับ E-commerce เว็บไซต์เติมเกม สร้าง Meta Tags ที่ช่วยเพิ่มอันดับ Google และเพิ่ม CTR

    สินค้า: "${productName}"${categoryName ? ` (แพลตฟอร์ม: ${categoryName})` : ""}

    คำอธิบายสินค้า:
${fullDescription.substring(0, 400)}...

    รูปแบบการตอบ(เขียนเป็นภาษาไทย):
    META_TITLE: [ชื่อสินค้า + จุดขายหลัก + CTA - ไม่เกิน 60 ตัวอักษร]
    META_DESCRIPTION: [สรุปบริการ + จุดเด่น 2 - 3 อย่าง + คำกระตุ้น - ไม่เกิน 160 ตัวอักษร]
    META_KEYWORDS: [คีย์เวิร์ด 7 - 10 คำ ผสมทั้งไทย + อังกฤษ คั่นด้วยลูกน้ำ]
${categoryName ? `\nหมายเหตุ: ใส่ชื่อแพลตฟอร์ม "${categoryName}" ใน keywords ด้วย` : ""}

    ข้อกำหนด:
    1. META_TITLE ต้องมีชื่อสินค้า + คำกระตุ้น(เช่น ราคาถูก, ส่งไว, ปลอดภัย)
    2. META_DESCRIPTION ต้องสรุปจุดเด่น 2 - 3 อย่าง พร้อม CTA ท้ายประโยค
    3. META_KEYWORDS ต้องมี 7 - 10 คำ ผสมทั้งไทย + อังกฤษ ครอบคลุม:
    - คีย์เวิร์ดหลัก(เช่น เติมเพชร[ชื่อเกม])
      - คีย์เวิร์ดแบรนด์(ชื่อเกมภาษาอังกฤษ)
      - คีย์เวิร์ดยาว(เช่น เติมเกม[ชื่อเกม]ราคาถูก)
      - คีย์เวิร์ดพฤติกรรม(เช่น ซื้อ, สั่งซื้อ, เติม)
    4. ไม่ใช้อิโมจิ

สร้าง Meta Tags ตอนนี้(ตอบเฉพาะรูปแบบด้านบน): `;
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

    return `${BUSINESS_DNA}

คุณคือผู้เชี่ยวชาญด้านอุตสาหกรรมเกมที่มีความรู้ครอบคลุมทุกแพลตฟอร์ม ทั้ง Mobile, PC, Console และ Cross-Platform ระบุข้อมูลเกมให้ถูกต้องตามความเป็นจริง

    สินค้า: "${productName}"${categoryName ? ` (แพลตฟอร์ม: ${categoryName})` : ""}

    รูปแบบการตอบ(ตอบเป็นภาษาอังกฤษ):
    DEVELOPER: [ชื่อบริษัทผู้พัฒนาที่ถูกต้อง เช่น Riot Games, miHoYo / HoYoverse, Moonton, Garena]
    PUBLISHER: [ชื่อบริษัทผู้จัดจำหน่ายในภูมิภาค SEA เช่น Tencent, Garena, VNG]
    PLATFORMS: [เลือกจาก: iOS, Android, PC, Console — ระบุทุกแพลตฟอร์มที่รองรับ]
${inferredPlatforms ? `\nคำแนะนำ: สินค้านี้อยู่ในหมวดหมู่ "${categoryName}" ซึ่งปกติจะรองรับแพลตฟอร์ม: ${inferredPlatforms} (ใช้เป็นแนวทาง แต่ให้ตรวจสอบจากชื่อสินค้าด้วย)` : ""}

    ข้อกำหนด:
    1. ใช้ชื่อบริษัทอย่างเป็นทางการ(ไม่ใช่ชื่อย่อหรือชื่อเล่น)
    2. ถ้า Developer กับ Publisher เป็นบริษัทเดียวกัน ให้ระบุชื่อเดียวกัน
    3. สำหรับ Gift Card(Steam, PSN, Xbox, Nintendo) ให้ระบุ Developer / Publisher เป็นเจ้าของแพลตฟอร์มนั้น
    4. ถ้าไม่ทราบข้อมูลจริงๆ ให้ใช้ "Unknown" — ห้ามเดาผิด

    ตัวอย่าง:
    DEVELOPER: Moonton
    PUBLISHER: Moonton
    PLATFORMS: iOS, Android

    ระบุข้อมูลเกมตอนนี้(ตอบเฉพาะรูปแบบด้านบน): `;
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
   * Generate news article content using AI with Perplexica search
   * Includes anti-duplication logic: random angles, dynamic search, and variation
   */
  async generateNewsContent(
    topic: string,
    categoryName: string,
    onProgress?: ContentGenerationProgressCallback,
    existingSlugs?: string[],
    preferredAngle?: string,
    optimizationMode: "speed" | "balanced" | "quality" = "balanced",
  ): Promise<GeneratedEditorialContent> {
    const startTime = Date.now();
    console.log("[AI News] ========== GENERATE NEWS CONTENT START ==========");
    console.log("[AI News] Parameters:", { topic, categoryName, preferredAngle, optimizationMode, existingSlugsCount: existingSlugs?.length || 0 });

    try {
      onProgress?.({
        stage: "preparing",
        message: "กำลังวิเคราะห์และสร้างมุมมองข่าวที่ไม่ซ้ำ...",
      });
      console.log("[AI News] Stage 1: Preparing - Generating content angle...");

      onProgress?.({
        stage: "searching",
        message: "กำลังค้นหาข้อมูลจาก Perplexica...",
      });
      console.log("[AI News] Stage 2: Searching - Calling Perplexica...");

      // Step 1: Generate unique content angle (or use preferred if provided)
      const newsAngle = this.generateNewsAngle(
        topic,
        categoryName,
        preferredAngle,
      );

      console.log("[AI News] Generated angle:", newsAngle);

      // Step 2: Build search query for Perplexica - emphasize gaming
      const searchQuery = `${topic} game gaming ${categoryName} ${newsAngle.angle} news update`;
      console.log("[AI News] Search query:", searchQuery);

      const systemInstructions = this.buildPerplexicaSystemInstructions(
        topic,
        categoryName,
        newsAngle,
        existingSlugs,
      );
      console.log("[AI News] System instructions built, length:", systemInstructions?.length || 0);

      // Step 3: Call Perplexica for search and content generation
      console.log("[AI News] Calling callPerplexicaSearch with optimizationMode:", optimizationMode);

      const perplexicaResult = await this.callPerplexicaSearch(
        searchQuery,
        systemInstructions,
        optimizationMode,
      );

      console.log("[AI News] Perplexica API response received, message length:", perplexicaResult.message?.length || 0);
      console.log("[AI News] Sources count:", perplexicaResult.sources?.length || 0);

      onProgress?.({ stage: "parsing", message: "กำลังประมวลผลผลลัพธ์..." });
      console.log("[AI News] Stage 3: Parsing - Processing response...");

      // Step 4: Parse Perplexica response
      let content = perplexicaResult.message;

      if (!content) {
        throw new Error(
          "Perplexica returned empty response. Please try again.",
        );
      }

      // Clean up citation markers like [1], [42], etc.
      content = content.replace(/\[\d+\]/g, "");
      console.log("[AI News] Content cleaned, new length:", content.length);

      const result = await this.parseEditorialContent(content, topic);
      console.log("[AI News] Editorial content parsed:", {
        titleLength: result.title?.length,
        contentLength: result.content?.length,
        excerptLength: result.excerpt?.length,
      });

      // Add sources from Perplexica results
      if (perplexicaResult.sources.length > 0) {
        result.sources = perplexicaResult.sources
          .slice(0, 5)
          .map((s) => s.metadata.url)
          .filter((url): url is string => !!url);
        console.log("[AI News] Added", result.sources.length, "sources to result");
      }

      // Step 5: Search and insert images + YouTube videos
      onProgress?.({
        stage: "images",
        message: "กำลังค้นหารูปภาพและวิดีโอ...",
      });
      console.log("[AI News] Stage 4: Images/Videos - Searching media...");

      try {
        // Run image and YouTube searches in parallel
        console.log("[AI News] Starting parallel searches: images + YouTube...");
        const [imageResult, youtubeVideos] = await Promise.all([
          this.insertImagesIntoContent(result.content, topic, 3),
          this.searchYoutubeVideos(topic, 2),
        ]);
        console.log("[AI News] Media searches completed:", {
          imagesFound: imageResult.coverImage ? "yes" : "no",
          youtubeVideosFound: youtubeVideos.length,
        });

        result.content = imageResult.content;
        if (imageResult.coverImage && !result.coverImage) {
          result.coverImage = imageResult.coverImage;
        }

        // Insert YouTube embeds spread across sections (not bunched together)
        if (youtubeVideos.length > 0) {
          const makeEmbed = (v: { videoId: string; title: string }) =>
            `\n<iframe width="100%" height="420" src="https://www.youtube.com/embed/${v.videoId}" title="${v.title.replace(/"/g, "&quot;")}" allowfullscreen></iframe>\n`;

          // Find all ## section positions
          const sectionPositions: number[] = [];
          let searchFrom = 0;
          while (true) {
            const pos = result.content.indexOf("\n## ", searchFrom);
            if (pos === -1) break;
            sectionPositions.push(pos);
            searchFrom = pos + 4;
          }

          if (sectionPositions.length >= 2 && youtubeVideos.length >= 2) {
            // 2+ videos: first before 2nd section, second before last section
            const lastIdx = sectionPositions[sectionPositions.length - 1];
            const firstIdx = sectionPositions[0];
            // Insert last video first (to preserve positions)
            result.content =
              result.content.substring(0, lastIdx) +
              "\n" + makeEmbed(youtubeVideos[1]) +
              result.content.substring(lastIdx);
            result.content =
              result.content.substring(0, firstIdx) +
              "\n" + makeEmbed(youtubeVideos[0]) +
              result.content.substring(firstIdx);
          } else if (sectionPositions.length >= 1) {
            // 1 video or 1 section: insert before first ## heading
            result.content =
              result.content.substring(0, sectionPositions[0]) +
              "\n" + makeEmbed(youtubeVideos[0]) +
              result.content.substring(sectionPositions[0]);
          } else {
            // No sections, append at end
            result.content += "\n\n" + makeEmbed(youtubeVideos[0]);
          }
          console.log("[AI News] Inserted", youtubeVideos.length, "YouTube videos (spread)");
        }

        console.log("[AI News] Images inserted successfully");
      } catch (imgError) {
        console.warn("[AI News] Image/video insertion failed, continuing:", imgError);
      }

      const elapsed = Date.now() - startTime;
      console.log(`[AI News] ========== GENERATION COMPLETE (${elapsed}ms) ==========`);

      onProgress?.({ stage: "completed", message: "สร้างเสร็จสมบูรณ์!" });

      return result;
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      console.error(`[AI News] ========== GENERATION FAILED (${elapsed}ms) ==========`);
      console.error("[AI News] Error details:", {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        stack: error?.stack,
      });
      throw error;
    }
  }

  /**
   * Build system instructions for Perplexica
   */
  private buildPerplexicaSystemInstructions(
    topic: string,
    categoryName: string,
    newsAngle: {
      angle: string;
      contentType: string;
      tone: string;
      focusKeywords: string[];
    },
    existingSlugs?: string[],
  ): string {
    const slugHint = `${slugify(topic)}-${newsAngle.contentType}-${Date.now().toString(36).slice(-4)}`;

    return `${BUSINESS_DNA}

You are a professional Thai GAMING journalist writing for Lnwtermgame. Write in-depth, accurate, and well-researched articles based ONLY on factual information.

หัวข้อข่าว: "${topic}"
หมวดหมู่: ${categoryName}
มุมมองที่ต้องการนำเสนอ: ${newsAngle.angle}
ประเภทเนื้อหา: ${newsAngle.contentType}
โทนการเขียน: ${newsAngle.tone}
คำสำคัญ: ${newsAngle.focusKeywords.join(", ")}

⚠️ ข้อกำหนดสำคัญสูงสุด (STRICT RULES):
1. ZERO HALLUCINATION (ห้ามสร้างข่าวปลอม): เนื้อหาทั้งหมดต้องเป็น "ความจริง" ตามแหล่งข้อมูลที่ค้นหามาได้เท่านั้น ห้ามแต่งชื่อกิจกรรม, ตัวละคร, ฟีเจอร์, หรือแพตช์อัปเดตขึ้นมาเองเด็ดขาด หากไม่มีข้อมูลในเรื่องใดให้ข้ามไป
2. เคารพบริบทและประเภทของเกม (Genre Accuracy): 
   - ⛔ ห้ามฝืนเขียนข่าวให้เข้ากับ "มุมมอง (Angle)" หากมันขัดแย้งกับตัวเกม (เช่น หากเป็นเกมปลูกผัก/Life Sim ห้ามใช้คำศัพท์แนวสงคราม, Esports, หรือการแข่งขันชิงแชมป์เด็ดขาด) 
   - ให้ปรับโทนการเขียนให้เข้ากับธรรมชาติของเกมนั้นๆ เสมอ
3. ห้ามเขียนยืดเยื้อหรือออกทะเล: หากข้อมูลจริงมีน้อย ให้เขียนความยาวตามเนื้อหาจริง (400-1000 คำ) ⛔ ห้ามนำข้อมูลรีวิวฮาร์ดแวร์ (เช่น สเปกจอคอม, สเปกมือถือ) หรือเรื่องที่ไม่เกี่ยวกับตัวเกมมายัดเยียดใส่เพื่อเพิ่มความยาวเด็ดขาด

ข้อกำหนดการเขียน (Formatting & Style):
1. เขียนเนื้อหาภาษาไทยทั้งหมด สไตล์นักข่าวเกมมืออาชีพ
2. ใช้หัวข้อย่อย (##) 2-4 หัวข้อ เพื่อแบ่งเนื้อหาให้อ่านง่าย
3. ห้ามใช้อิโมจิในบทความ
4. ห้ามทิ้ง citation markers ไว้ในเนื้อหา (เช่น [1], [42]) ให้เขียนผสานข้อมูลไปอย่างลื่นไหล
5. ใส่ข้อมูลที่เป็นประโยชน์ (ถ้ามีข้อมูลจริง): วันที่วางจำหน่าย, ราคา, ชื่อตัวละคร, รายละเอียดกิจกรรม หรือแพตช์โน้ต
6. ถ้ามี YouTube video ที่เกี่ยวข้องกับเนื้อหา ให้แทรกเป็น embed code HTML ในตำแหน่งที่เหมาะสม:
   <iframe width="100%" height="420" src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen></iframe>
   (เปลี่ยน VIDEO_ID เป็น ID จริงจาก URL วิดีโอ ห้ามพิมพ์ข้อความลอยๆ)
7. ไม่ต้องใส่รูปภาพ - รูปภาพจะถูกเพิ่มอัตโนมัติจากระบบ

รูปแบบการตอบ (ตอบเฉพาะรูปแบบนี้ ห้ามมีข้อความอื่นเจือปน):
TITLE: [พาดหัวข่าวที่น่าสนใจและเป็นความจริง ไม่เกิน 100 ตัวอักษร]
CONTENT: [เนื้อหาข่าวฉบับเต็มภาษาไทย มีหัวข้อย่อย แบ่งย่อหน้าชัดเจน]
EXCERPT: [สรุปข่าวสั้นๆ ไม่เกิน 160 ตัวอักษร]
SLUG: [slug ภาษาอังกฤษ เช่น ${slugHint}]
TAGS: [แท็กที่เกี่ยวข้องกับเกม 5-7 คำ คั่นด้วยลูกน้ำ]
YOUTUBE_VIDEOS: [URL YouTube ที่เกี่ยวข้อง คั่นด้วยลูกน้ำ หรือเว้นว่างหากไม่มี]
SOURCES: [URL แหล่งข่าวที่ใช้อ้างอิง คั่นด้วยลูกน้ำ]

${existingSlugs && existingSlugs.length > 0 ? `ห้ามใช้ slug เหล่านี้ซ้ำ: ${existingSlugs.slice(0, 10).join(", ")}` : ""}`;
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
        "LiteLLM API key not configured. Please set NEXT_PUBLIC_LITELLM_API_KEY in your .env file.",
      );
    }

    onProgress?.({
      stage: "generating",
      message: "กำลังสร้างเนื้อหาด้วย AI...",
    });

    const response = await this.callLiteLLMApi(prompt);
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

    const result = await this.parseEditorialContent(content, topic);

    onProgress?.({ stage: "completed", message: "สร้างเสร็จสมบูรณ์!" });

    return result;
  }

  private buildFaqPrompt(topic: string, categoryName: string): string {
    return `${BUSINESS_DNA}

คุณคือผู้เชี่ยวชาญด้านการเขียนบทความ FAQ สำหรับ Lnwtermgame คุณต้องเขียนคำตอบที่ละเอียด ครบถ้วน เป็นประโยชน์สูงสุดต่อผู้อ่าน

หัวข้อ: "${topic}"
หมวดหมู่: ${categoryName}

รูปแบบการตอบ (ตอบเฉพาะรูปแบบนี้เท่านั้น):
TITLE: [หัวข้อคำถามที่ชัดเจน น่าสนใจ ไม่เกิน 100 ตัวอักษร]
CONTENT: [คำตอบโดยละเอียด ใช้ภาษาไทย ความยาว 800-2,000 คำ มีโครงสร้างชัดเจน]
EXCERPT: [สรุปสั้นๆ ไม่เกิน 150 ตัวอักษร สำหรับแสดงในรายการ]
SLUG: [slug ภาษาอังกฤษ ใช้ตัวพิมพ์เล็ก ตัวเลข และขีดกลางเท่านั้น]

หลักการเขียนที่ต้องปฏิบัติ:

1. ความยาว: เนื้อหาต้อง **ไม่ต่ำกว่า 800 คำ** — ห้ามเขียนสั้นรวบรัด
2. ใช้หัวข้อย่อย (##) อย่างน้อย **5-8 หัวข้อ** เพื่อแบ่งเนื้อหาให้ครบทุกแง่มุม
3. ทุกหัวข้อย่อยต้องมีเนื้อหาอย่างน้อย 3-5 ประโยค ไม่ใช่แค่ 1-2 บรรทัด
4. ถ้าเป็นคำถามเกี่ยวกับขั้นตอน ให้อธิบายทีละขั้นอย่างละเอียด พร้อมเคล็ดลับ (Pro Tips)
5. ถ้าเป็นคำถามเกี่ยวกับปัญหา ให้อธิบายสาเหตุ วิธีแก้ไข และวิธีป้องกัน
6. เขียนในเชิงให้คำแนะนำ ช่วยเหลือลูกค้า น่าเชื่อถือ
7. ใช้ **ตัวหนา** เน้นคำสำคัญ เช่น ชื่อเกม, ชื่อ ID, ขั้นตอนสำคัญ
8. ใช้ numbered list (1. 2. 3.) สำหรับขั้นตอน และ bullet list (-) สำหรับรายการ
9. ไม่ใช้อิโมจิ ไม่ใช้ภาษาวัยรุ่น
10. เพิ่มหัวข้อ "ข้อควรระวัง" และ "คำถามที่เกี่ยวข้อง" เสมอ

โครงสร้างแนะนำ:
- บทนำ (ไม่มีหัวข้อ): สรุปคำตอบโดยย่อ 2-3 ประโยค
- ## หัวข้อหลัก: อธิบายรายละเอียดเต็ม
- ## ขั้นตอนหรือวิธีทำ: step-by-step ละเอียด
- ## เคล็ดลับ/Pro Tips: ข้อมูลเพิ่มเติมที่เป็นประโยชน์
- ## กรณีพิเศษหรือข้อยกเว้น: อธิบายกรณีที่แตกต่าง
- ## ข้อควรระวัง: เตือนสิ่งที่ต้องระวัง
- ## วิธีแก้ไขปัญหา (ถ้ามี): troubleshooting
- ## คำถามที่เกี่ยวข้อง: ลิสต์คำถามอื่นที่เกี่ยวข้อง 3-5 ข้อ (เขียนเป็น bullet list)

สร้างบทความ FAQ ตอนนี้ (ตอบเฉพาะรูปแบบด้านบน):`;
  }

  private buildNewsPrompt(topic: string, categoryName: string): string {
    return `${BUSINESS_DNA}

คุณคือนักข่าวเกมมืออาชีพระดับสูง เขียนบทความข่าวสารเชิงลึกสำหรับ Lnwtermgame คุณต้องเขียนข่าวที่ละเอียด ครบถ้วน มีโครงสร้างเป็นระบบ และมีคุณภาพเทียบเท่าสำนักข่าวเกมชั้นนำ

หัวข้อข่าว: "${topic}"
หมวดหมู่ข่าว: ${categoryName}

รูปแบบการตอบ (ตอบเฉพาะรูปแบบนี้เท่านั้น):
TITLE: [พาดหัวข่าวชัดเจน กระชับ น่าคลิก ไม่เกิน 100 ตัวอักษร]
CONTENT: [เนื้อหาข่าวฉบับเต็มภาษาไทย 1,500-3,000 คำ เขียนเชิงลึกครบทุกมิติ]
EXCERPT: [สรุปข่าวสั้นๆ ไม่เกิน 160 ตัวอักษร]
SLUG: [slug ภาษาอังกฤษ ใช้ตัวพิมพ์เล็ก ตัวเลข และขีดกลางเท่านั้น]
TAGS: [แท็กภาษาไทย 5-8 คำ คั่นด้วยลูกน้ำ ที่เกี่ยวข้องกับเนื้อหาโดยตรง]

หลักการเขียนที่ต้องปฏิบัติ:

1. ความยาว: เนื้อหาต้อง **ไม่ต่ำกว่า 1,500 คำ** — ห้ามเขียนสั้นรวบรัด
2. ต้องเป็นข่าวที่สมจริง (factual) — ห้ามสร้างข่าวปลอมหรือข้อมูลเท็จ
3. ย่อหน้าแรก: สรุปประเด็นสำคัญครบ (ใคร/อะไร/เมื่อไร/ที่ไหน/ทำไม)
4. ใช้หัวข้อย่อย (##) อย่างน้อย **6-10 หัวข้อ** เพื่อแบ่งเนื้อหาให้ครบทุกมุม
5. ทุกหัวข้อย่อยต้องมีเนื้อหาอย่างน้อย 3-5 ประโยค ไม่ใช่แค่ 1-2 บรรทัด
6. ใช้โทนข่าวสารมืออาชีพ เป็นทางการแต่อ่านสนุกและเข้าใจง่าย
7. ไม่ใช้อิโมจิ ไม่ใช้ภาษาวัยรุ่น ไม่ใช้คำสแลง
8. ใช้ **ตัวหนา** เน้นชื่อเกม ชื่อกิจกรรม วันที่สำคัญ ตัวเลขสำคัญ
9. ห้ามฝืนเขียนเนื้อหาที่ขัดแย้งกับประเภทของเกม
10. ห้ามนำข้อมูลที่ไม่เกี่ยวข้อง (เช่น สเปกฮาร์ดแวร์) มายัดเยียดเพิ่มความยาว

โครงสร้างแนะนำ:
- บทนำ (ไม่มีหัวข้อ): สรุปสาระสำคัญของข่าว 3-4 ประโยค
- ## รายละเอียดเหตุการณ์/อัปเดต: อธิบายเนื้อหาหลักอย่างละเอียด
- ## ฟีเจอร์/เนื้อหาใหม่: (ถ้ามี) รายละเอียดสิ่งใหม่ที่เพิ่มมา
- ## ผลกระทบต่อผู้เล่น: วิเคราะห์ว่าข่าวนี้ส่งผลอย่างไร
- ## เงื่อนไขหรือข้อกำหนด: (ถ้ามี) เงื่อนไขการเข้าร่วม
- ## ขั้นตอนการเข้าร่วม/ใช้งาน: (ถ้ามี) step-by-step
- ## ความคิดเห็นจากชุมชน: (ถ้ามี) ปฏิกิริยาของผู้เล่น
- ## บริบทและที่มา: เล่าความเป็นมาของเรื่องนี้
- ## คาดการณ์อนาคต: วิเคราะห์แนวโน้มต่อไป
- ## สรุป: สรุปประเด็นสำคัญและคำแนะนำ

สร้างบทความข่าวสารตอนนี้ (ตอบเฉพาะรูปแบบด้านบน):`;
  }

  // ============ Anti-Duplication Helper Methods ============

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

  private buildCmsPagePrompt(topic: string, pageType: string): string {
    return `${BUSINESS_DNA}

คุณคือนักเขียนเนื้อหากฎหมายและนโยบายเว็บไซต์ระดับมืออาชีพสำหรับ Lnwtermgame เชี่ยวชาญด้านการเขียนหน้า CMS สำหรับธุรกิจ E-commerce ในประเทศไทย คุณต้องเขียนเนื้อหาให้ครบถ้วน ละเอียด มีโครงสร้างเป็นระบบ และมีคุณภาพเทียบเท่าเว็บไซต์ E-commerce ชั้นนำ

ชื่อหน้า: "${topic}"
ประเภทหน้า: ${pageType}

รูปแบบการตอบ (ตอบเฉพาะรูปแบบนี้เท่านั้น ห้ามมีข้อความอื่นนอกรูปแบบ):
TITLE: [ชื่อหน้าชัดเจน เป็นทางการ เหมาะกับการแสดงผลบนเว็บไซต์]
CONTENT: [เนื้อหาเต็มภาษาไทย ความยาว 2,000-5,000 คำ เขียนอย่างละเอียดครบถ้วนทุกมิติ]
EXCERPT: [สรุปเนื้อหาสั้นๆ ไม่เกิน 160 ตัวอักษร สำหรับ SEO/Meta Description]
SLUG: [slug ภาษาอังกฤษ ใช้ตัวพิมพ์เล็ก ตัวเลข และขีดกลางเท่านั้น]

## หลักการเขียนที่ต้องปฏิบัติอย่างเคร่งครัด:

### 1. ความยาวและความละเอียด (CRITICAL)
- เนื้อหาต้องมีความยาว **ไม่ต่ำกว่า 2,000 คำ** และไม่เกิน 5,000 คำ
- ทุกหัวข้อย่อยต้องอธิบายอย่างละเอียด ไม่สรุปแบบรวบรัดจนขาดสาระ
- แต่ละย่อหน้าต้องมีเนื้อหาอย่างน้อย 3-5 ประโยค
- หากเป็นนโยบาย/เงื่อนไข ต้องครอบคลุมทุกกรณีที่อาจเกิดขึ้น
- ใช้ตัวอย่างประกอบเมื่อเหมาะสม เพื่อความชัดเจน

### 2. โครงสร้างเนื้อหา
- ใช้หัวข้อหลัก (##) อย่างน้อย **8-15 หัวข้อ** เพื่อแบ่งเนื้อหาให้ครบทุกมิติ
- ใช้หัวข้อย่อย (###) เพิ่มเติมภายในส่วนที่ซับซ้อน
- ใช้รายการลำดับ (1. 2. 3.) สำหรับขั้นตอนหรือเงื่อนไขที่ต้องเรียงลำดับ
- ใช้ bullet points (-) สำหรับรายการที่ไม่ต้องเรียงลำดับ
- ใช้ **ตัวหนา** เน้นคำสำคัญ คำจำกัดความ หรือเงื่อนไขที่ผู้ใช้ต้องทราบ
- แต่ละส่วนเชื่อมต่อกันอย่างลื่นไหล ไม่กระโดดข้ามเรื่อง

### 3. โทนภาษาและสไตล์
- ภาษาเป็นทางการ สุภาพ น่าเชื่อถือ แต่อ่านเข้าใจง่าย ไม่ใช้ศัพท์กฎหมายที่ซับซ้อนเกินไป
- ไม่เขียนแบบข่าว ไม่เขียนแบบ Q&A ไม่เขียนแบบบล็อก
- ไม่ใช้อิโมจิ ไม่ใช้ภาษาวัยรุ่น ไม่ใช้คำสแลง
- เหมาะสำหรับหน้าเว็บไซต์ถาวร (Static Page) ที่แสดงความน่าเชื่อถือของธุรกิจ
- หลีกเลี่ยงการระบุวันที่เฉพาะเจาะจง เว้นแต่จำเป็นจริงๆ

### 4. ข้อกำหนดตามประเภทหน้า

**หน้านโยบายความเป็นส่วนตัว (Privacy Policy)** ต้องครอบคลุม:
- คำนิยามและขอบเขตของนโยบาย
- ประเภทข้อมูลที่เก็บรวบรวม (ข้อมูลบัญชี, ข้อมูลธุรกรรม, ข้อมูลอุปกรณ์, คุกกี้, ข้อมูลการใช้งาน)
- วิธีการเก็บรวบรวมข้อมูล (โดยตรง, อัตโนมัติ, จากบุคคลที่สาม)
- วัตถุประสงค์ในการใช้ข้อมูลแต่ละประเภท
- ฐานทางกฎหมายในการประมวลผลข้อมูล (ตาม พ.ร.บ. PDPA)
- การเปิดเผยข้อมูลแก่บุคคลที่สาม (ผู้ให้บริการชำระเงิน, ผู้ให้บริการจัดส่งรหัสสินค้า)
- การส่งข้อมูลไปยังต่างประเทศ
- ระยะเวลาในการเก็บรักษาข้อมูล
- มาตรการรักษาความปลอดภัยของข้อมูล
- สิทธิของเจ้าของข้อมูล (เข้าถึง, แก้ไข, ลบ, คัดค้าน, ระงับ, ถอนความยินยอม, ร้องเรียน)
- การใช้คุกกี้และเทคโนโลยีติดตาม
- นโยบายเกี่ยวกับผู้เยาว์
- การเปลี่ยนแปลงนโยบาย
- ข้อมูลติดต่อเจ้าหน้าที่คุ้มครองข้อมูล (DPO)

**หน้าเงื่อนไขการใช้งาน (Terms of Service)** ต้องครอบคลุม:
- คำนิยามศัพท์ที่ใช้ในเงื่อนไข
- เงื่อนไขการสมัครสมาชิกและบัญชีผู้ใช้
- สิทธิและหน้าที่ของผู้ใช้งาน
- ข้อจำกัดการใช้งาน (สิ่งที่ห้ามทำ)
- เงื่อนไขการสั่งซื้อและชำระเงิน
- การจัดส่งสินค้าดิจิทัล (รหัสเกม, บัตรเติมเงิน)
- นโยบายการคืนเงินและการยกเลิก (ระบุเงื่อนไขชัดเจน)
- ทรัพย์สินทางปัญญา
- ข้อจำกัดความรับผิด
- การระงับหรือยกเลิกบัญชี
- การชดใช้ค่าเสียหาย
- เหตุสุดวิสัย
- กฎหมายที่ใช้บังคับและการระงับข้อพิพาท
- การเปลี่ยนแปลงเงื่อนไข
- ข้อมูลติดต่อ

**หน้านโยบายการคืนเงิน (Refund Policy)** ต้องครอบคลุม:
- ขอบเขตของนโยบาย
- เงื่อนไขที่สามารถขอคืนเงินได้ (เช่น รหัสไม่ถูกต้อง, ไม่ได้รับสินค้า, ข้อผิดพลาดของระบบ)
- เงื่อนไขที่ไม่สามารถขอคืนเงินได้ (เช่น ใช้รหัสแล้ว, เปลี่ยนใจหลังใช้งาน, กรอกข้อมูลผิดเอง)
- ขั้นตอนการขอคืนเงินอย่างละเอียด
- ระยะเวลาในการดำเนินการ
- ช่องทางการคืนเงิน
- กรณีพิเศษและข้อยกเว้น
- การอุทธรณ์
- ข้อมูลติดต่อฝ่ายสนับสนุน

**หน้าเกี่ยวกับเรา (About Us)** ต้องครอบคลุม:
- ความเป็นมาและวิสัยทัศน์ของบริษัท
- พันธกิจและคุณค่าหลัก
- บริการที่ให้ (เติมเกม, บัตรดิจิทัล, เติมเงินมือถือ)
- จุดเด่นที่แตกต่าง (จัดส่งอัตโนมัติ, ปลอดภัย, รวดเร็ว)
- ความน่าเชื่อถือ (ระบบชำระเงินที่ปลอดภัย, ฝ่ายสนับสนุน 24 ชม.)
- เกมและบริการที่รองรับ
- ช่องทางติดต่อ

**หน้าอื่นๆ** ให้วิเคราะห์จากชื่อหน้า แล้วเขียนให้ครอบคลุมที่สุด โดยยึดหลักเขียนยาวและละเอียด

สร้างเนื้อหาหน้า CMS ตอนนี้ (ตอบเฉพาะรูปแบบด้านบน):`;
  }

  private async parseEditorialContent(
    content: string,
    fallbackTopic: string,
  ): Promise<GeneratedEditorialContent> {
    const lines = content.split("\n").map((line) => line.trim());

    let title = "";
    let articleContent = "";
    let excerpt = "";
    let slug = "";
    let tags: string[] = [];
    let coverImage = "";
    let youtubeVideos: string[] = [];
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
      } else if (line.startsWith("YOUTUBE_VIDEOS:")) {
        if (currentSection === "content" && contentBuffer.length > 0) {
          articleContent = contentBuffer.join("\n").trim();
        }
        const ytStr = line.replace("YOUTUBE_VIDEOS:", "").trim();
        youtubeVideos = ytStr
          .split(",")
          .map((url) => url.trim())
          .filter((url) => url.includes("youtube") || url.includes("youtu.be"));
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

    // Inject YouTube videos as embeds into content (verify availability first)
    if (youtubeVideos.length > 0 && articleContent) {
      const videoIds = youtubeVideos
        .map((url) => extractYoutubeVideoId(url))
        .filter((id): id is string => !!id);

      // Check all videos in parallel
      const availabilityChecks = await Promise.all(
        videoIds.map(async (id) => ({
          id,
          available: await this.isYoutubeVideoAvailable(id),
        })),
      );

      const youtubeEmbeds = availabilityChecks
        .filter((v) => v.available)
        .map(
          (v) =>
            `\n<iframe width="100%" height="420" src="https://www.youtube.com/embed/${v.id}" allowfullscreen></iframe>\n`,
        );

      // Add videos after the first paragraph or at the end
      if (youtubeEmbeds.length > 0) {
        const paragraphs = articleContent.split("\n\n");
        if (paragraphs.length > 1) {
          paragraphs.splice(1, 0, ...youtubeEmbeds);
          articleContent = paragraphs.join("\n\n");
        } else {
          articleContent += "\n\n" + youtubeEmbeds.join("\n");
        }
      }
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

    // Validate URLs - return undefined for invalid/empty URLs
    let validCoverImage: string | undefined = undefined;
    if (coverImage && coverImage.trim() && coverImage.startsWith("http")) {
      validCoverImage = coverImage.trim();
    }

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

  // Generate multiple FAQ articles using AI
  async generateFAQs(
    topic: string,
    categoryName: string,
    count: number = 5,
    customSystemPrompt?: string,
    locale: string = "th",
  ): Promise<{ title: string; content: string; excerpt: string }[]> {
    const LOCALE_LABELS: Record<string, string> = {
      th: "ภาษาไทย (Thai)",
      en: "English",
      zh: "中文 (Chinese)",
      ja: "日本語 (Japanese)",
      ko: "한국어 (Korean)",
      ms: "Bahasa Melayu (Malay)",
      hi: "हिन्दी (Hindi)",
      es: "Español (Spanish)",
      fr: "Français (French)",
    };

    const langLabel = LOCALE_LABELS[locale] || locale;

    const defaultSystemPrompt = `${BUSINESS_DNA}

คุณคือ FAQ Content Writer ผู้เชี่ยวชาญสำหรับ Lnwtermgame
หน้าที่: สร้างคำถามที่พบบ่อย (FAQ) ที่ครบถ้วน ชัดเจน และเป็นประโยชน์
⚠️ IMPORTANT: You MUST write ALL content (title, content, excerpt) in ${langLabel}. Do NOT mix languages.
กฎ:
- ตอบกลับเป็น JSON array เท่านั้น ไม่ใส่ markdown code block
- ทุกคำตอบต้องละเอียดและเป็นประโยชน์จริง ไม่ generic
- ใช้ภาษาที่เข้าใจง่ายสำหรับผู้ใช้ทั่วไป
- content ต้องยาวพอสมควร (3-5 ย่อหน้า) อธิบายอย่างครบถ้วน
- อ้างอิงบริการ แพลตฟอร์ม และจุดเด่นของ Lnwtermgame ตาม Business DNA
- ALL output MUST be in ${langLabel}`;

    const systemPrompt = customSystemPrompt?.trim() || defaultSystemPrompt;

    const userPrompt = `Generate ${count} FAQ items for topic: "${topic}"
Category: ${categoryName}
Target language: ${langLabel}

Respond with a JSON array ONLY (no \`\`\`json):
[
  {
    "title": "Question in ${langLabel}",
    "content": "Detailed answer in ${langLabel} (3-5 paragraphs)",
    "excerpt": "Short summary in ${langLabel} (1-2 sentences)"
  }
]`;

    const response = await this.callLiteLLMApiCustom(systemPrompt, userPrompt);
    const raw = response.choices?.[0]?.message?.content || "";

    // Strip markdown code fence if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // Extract JSON array
    const arrMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!arrMatch) {
      throw new Error("AI response is not a valid JSON array");
    }

    const parsed = JSON.parse(arrMatch[0]);
    if (!Array.isArray(parsed)) {
      throw new Error("AI response is not an array");
    }

    return parsed.map((item: Record<string, unknown>) => ({
      title: String(item.title || ""),
      content: String(item.content || ""),
      excerpt: String(item.excerpt || ""),
    }));
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
