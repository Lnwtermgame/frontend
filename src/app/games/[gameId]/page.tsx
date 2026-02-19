"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/use-auth";
import { orderApi } from "@/lib/services/order-api";
import { paymentApi, PaymentMethodOption } from "@/lib/services/payment-api";
import {
  ChevronLeft,
  ShoppingCart,
  Heart,
  Share2,
  Package,
  Award,
  Clock,
  Calendar,
  Smartphone,
  Info,
  DollarSign,
  Gift,
  AlertCircle,
  Check,
  AlertTriangle,
  X,
  User,
  ShieldAlert,
  ChevronRight,
  ShieldCheck,
  ReceiptText,
} from "lucide-react";
import toast from "react-hot-toast";
import ProductDescription from "@/components/products/ProductDescription";
import { CountryFlag, getCountryFlagCode } from "@/components/ui/country-flag";
import {
  productApi,
  Product,
  ProductType,
  SeagmField,
} from "@/lib/services/product-api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Grid } from "@/components/ui/Grid";
import { Sheet } from "@/components/ui/Sheet";

// Field label translation map
const FIELD_LABEL_MAP: Record<string, string> = {
  "Player ID": "ไอดีผู้เล่น (Player ID)",
  "User ID": "ไอดีผู้ใช้ (User ID)",
  "Server ID": "เซิร์ฟเวอร์ (Server ID)",
  "Zone ID": "รหัสโซน (Zone ID)",
  "Role Name": "ชื่อตัวละคร",
  "Character Name": "ชื่อตัวละคร",
  "Character ID": "ไอดีตัวละคร",
  Region: "ภูมิภาค",
  Email: "อีเมล",
  Phone: "เบอร์โทรศัพท์",
  "Riot ID": "Riot ID",
  Tag: "Tag",
};

const translateLabel = (label: string) => {
  return FIELD_LABEL_MAP[label] || label;
};

// Game details interface matching the UI expectations
interface GameDetails {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  mainImage: string;
  coverImage?: string;
  category: string;
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  platforms: string[];
  rating: number;
  ratingCount?: number;
  screenshots?: string[];
  topUpOptions: TopUpOption[];
  relatedGames: string[];
  features?: string[];
  mode?: "directtopup" | "card";
  // Product table fields
  shortDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  salesCount?: number;
  viewCount?: number;
}

interface TopUpOption {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  isPopular?: boolean;
  fields?: SeagmField[];
}

// Helper function to transform Product to GameDetails
function transformProductToGameDetails(
  product: Product,
  productTypes: ProductType[],
): GameDetails {
  // Map product types to topUpOptions (if available)
  const topUpOptions: TopUpOption[] = productTypes.map(
    (type: ProductType, index: number) => ({
      id: type.id,
      title: type.name,
      price: type.displayPrice,
      originalPrice: type.originPrice || type.displayPrice,
      isPopular: index === 0,
      fields: type.fields,
    }),
  );

  // Use game_details from Product table if available
  const gameDetails = product.gameDetails;

  return {
    id: product.id,
    title: product.name,
    description:
      product.shortDescription ||
      product.description ||
      `Top up ${product.name} instantly.`,
    longDescription:
      product.description ||
      `${product.name} offers a convenient way to purchase in-game currency and items.`,
    mainImage:
      product.imageUrl ||
      `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`,
    coverImage: product.coverImageUrl,
    category:
      product.category?.name ||
      (product.productType === "DIRECT_TOPUP" ? "Direct Top Up" : "Gift Card"),
    developer: gameDetails?.developer || product.category?.name || "Unknown",
    publisher: gameDetails?.publisher || "Unknown",
    platforms: gameDetails?.platforms?.length
      ? gameDetails.platforms
      : ["iOS", "Android"],
    rating: 4.5,
    ratingCount: product.reviewCount || 0,
    screenshots: product.images?.map((img) => img.url) || [],
    topUpOptions: topUpOptions.length > 0 ? topUpOptions : [],
    relatedGames: [],
    features: ["Instant Delivery", "Secure Payment", "24/7 Support"],
    mode: product.productType === "DIRECT_TOPUP" ? "directtopup" : "card",
    // Product table fields
    shortDescription: product.shortDescription,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    metaKeywords: product.metaKeywords,
    isFeatured: product.isFeatured,
    isBestseller: product.isBestseller,
    salesCount: product.salesCount,
    viewCount: product.viewCount,
  };
}

export default function GameDetailsPage() {
  const params = useParams<{
    gameId?: string;
    cardId?: string;
    slug?: string;
  }>();
  const isCardRoute = typeof params.cardId === "string";
  const isMobileRechargeRoute =
    typeof params.slug === "string" && typeof params.gameId !== "string";
  const productSlug =
    typeof params.gameId === "string"
      ? params.gameId
      : typeof params.cardId === "string"
        ? params.cardId
        : typeof params.slug === "string"
          ? params.slug
          : null;
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("topup");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<PaymentMethodOption[]>(
    [],
  );
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<
    string | null
  >(null);
  const [isPaymentSelectOpen, setIsPaymentSelectOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    | {
        supported: boolean;
        productName: string;
        optionName: string;
        playerInfo: Record<string, string>;
        price?: number;
      }
    | null
  >(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [mobilePhoneNumber, setMobilePhoneNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [similarGames, setSimilarGames] = useState<Product[]>([]);
  const [relatedGamesByDev, setRelatedGamesByDev] = useState<Product[]>([]);
  const [isBuying, setIsBuying] = useState(false);

  const backHref = "/games";
  const backLabel = "ย้อนกลับ";
  const optionsTabLabel = "ตัวเลือกเติมเงิน";
  const infoTabLabel = "ข้อมูลเกม";
  const purchaseTitle = "สรุปการสั่งซื้อ";

  const selectedTopUp = useMemo(() => {
    if (!selectedOption || !game) return null;
    return game.topUpOptions.find((opt) => opt.id === selectedOption) || null;
  }, [selectedOption, game]);

  const priceSummary = useMemo(() => {
    const base = selectedTopUp?.price || 0;
    if (!selectedPaymentOption) return { base, fee: 0, total: base };
    const opt = paymentOptions.find((o) => o.code === selectedPaymentOption);
    if (!opt) return { base, fee: 0, total: base };
    const percent = Number(opt.surchargePercent || 0) / 100;
    const flat = Number(opt.flatFee || 0);
    const fee = base * percent + flat;
    return {
      base,
      fee,
      total: base + fee,
      label: opt.label,
      method: opt.method,
    };
  }, [selectedPaymentOption, paymentOptions, selectedTopUp]);

  const formatTHB = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error("ไม่สามารถคัดลอกข้อมูลได้");
    }
  };

  // Fetch payment methods (PromptPay default)
  useEffect(() => {
    const loadMethods = async () => {
      try {
        const res = await paymentApi.getMethods();
        if (res.success) {
          setPaymentOptions(res.data);
          if (!selectedPaymentOption && res.data.length > 0) {
            const defaultPromptpay =
              res.data.find((m) => m.method === "PROMPTPAY") || res.data[0];
            setSelectedPaymentOption(defaultPromptpay.code);
          }
        }
      } catch (err) {
        console.error("Load payment methods failed", err);
      }
    };

    loadMethods();
  }, []);

  const buildPlayerInfo = (): Record<string, string> => {
    const info = { ...fieldValues };

    if (isMobileRechargeRoute) {
      const phoneCandidate =
        mobilePhoneNumber ||
        info.Phone ||
        info.phone ||
        info["User ID"] ||
        info["userId"] ||
        "";
      const normalizedPhone = phoneCandidate.trim();

      if (normalizedPhone) {
        info.Phone = normalizedPhone;
        info.phone = normalizedPhone;
        info["User ID"] = normalizedPhone;
      }
    }

    return info;
  };

  const getNormalizedMobilePhone = (): string =>
    (
      mobilePhoneNumber ||
      fieldValues.Phone ||
      fieldValues.phone ||
      fieldValues["User ID"] ||
      ""
    ).trim();

  const handleBuyNow = async () => {
    if (!product || !selectedOption) {
      toast.error("กรุณาเลือกตัวเลือกเติมเงิน");
      return;
    }

    // Check if user is logged in before allowing purchase
    if (!isAuthenticated) {
      toast.error("กรุณาเข้าสู่ระบบเพื่อทำการซื้อ", { duration: 3000 });
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check if all required fields are filled
    const selectedProductType = productTypes.find(
      (pt) => pt.id === selectedOption,
    );
    const selectedOptionData = game?.topUpOptions.find(
      (opt) => opt.id === selectedOption,
    );

    if (isMobileRechargeRoute) {
      const normalizedPhone = getNormalizedMobilePhone();

      if (!normalizedPhone) {
        toast.error("กรุณากรอกเบอร์โทรศัพท์");
        return;
      }

      if (normalizedPhone.length < 9) {
        toast.error("เบอร์โทรศัพท์ไม่ถูกต้อง");
        return;
      }
    }

    if (selectedProductType?.fields) {
      const requiredFields = selectedProductType.fields.filter(
        (f) => f.required !== false,
      );
      const missingFields = requiredFields.filter(
        (f) => !fieldValues[f.name] || fieldValues[f.name].trim() === "",
      );
      if (missingFields.length > 0) {
        toast.error(
          `กรุณากรอกข้อมูล: ${missingFields.map((f) => f.label).join(", ")}`,
        );
        return;
      }
    }

    setShowConfirmModal(true);
    setVerificationStatus({
      supported: true,
      productName: game?.title || product?.name || "",
      optionName: selectedTopUp?.title || "",
      playerInfo: buildPlayerInfo(),
      price: selectedTopUp?.price || priceSummary.total,
    });
  };

  const startPaymentFlow = async (
    orderId: string,
    paymentOptionCode?: string,
  ): Promise<boolean> => {
    try {
      const intentRes = await paymentApi.createIntent(orderId, paymentOptionCode);
      if (!intentRes.success) {
        toast.error("สร้างการชำระเงินไม่สำเร็จ");
        return false;
      }

      const { redirectUrl } = intentRes.data;
      if (!redirectUrl) {
        toast.error("ไม่พบลิงก์สำหรับชำระเงิน");
        return false;
      }

      toast.loading("กำลังนำไปหน้าชำระเงิน...", { duration: 2000 });
      window.location.href = redirectUrl;
      return true;
    } catch (err) {
      console.error("Payment flow error", err);
      toast.error("ไม่สามารถสร้างการชำระเงินได้");
      return false;
    }
  };

  // Create order after confirmation
  const createOrder = async () => {
    if (!product || !selectedOption) return;

    try {
      setIsBuying(true);
      toast.loading("กำลังสร้างคำสั่งซื้อ...");

      const playerInfo = buildPlayerInfo();
      const paymentOptionCode = selectedPaymentOption || undefined;

      const response = await orderApi.createOrder({
        items: [
          {
            productId: product.id,
            productTypeId: selectedOption, // The selected product type (e.g., 60 UC, 325 UC)
            quantity: 1,
            playerInfo,
          },
        ],
        paymentMethod: "PROMPTPAY",
        paymentOptionCode,
      });

      toast.dismiss();

      if (response.success) {
        toast.success("สั่งซื้อสำเร็จ! กำลังนำไปหน้าชำระเงิน...");
        setShowConfirmModal(false);
        setIsPaymentSelectOpen(false);
        await startPaymentFlow(response.data.id, paymentOptionCode);
      } else {
        toast.error(response.message || "สั่งซื้อไม่สำเร็จ");
      }
    } catch (err: any) {
      toast.dismiss();
      console.error("Create order error:", err);

      const errorMessage = err?.response?.data?.error?.message || "";
      const errorCode =
        err?.response?.data?.error?.details?.infoCode ||
        err?.response?.data?.error?.infoCode;

      if (
        errorMessage.includes("Player verification failed") ||
        errorCode === 20133 ||
        errorCode === 20093
      ) {
        toast.error(
          "User ID หรือ Zone ID ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลบัญชีเกมของคุณ",
          { duration: 5000 },
        );
      } else if (
        errorCode === 20114 ||
        /phone number.*region.*match/i.test(errorMessage)
      ) {
        toast.error(
          "เบอร์โทรศัพท์ไม่ตรงกับภูมิภาคของเครือข่ายที่เลือก กรุณาตรวจสอบเบอร์หรือเปลี่ยนแพ็กเกจให้ตรงประเทศ",
          { duration: 5000 },
        );
      } else if (
        errorMessage.includes("Missing required parameter") ||
        errorCode === 10406
      ) {
        toast.error("ข้อมูลไม่ครบถ้วน กรุณากรอกข้อมูลให้ครบ", {
          duration: 5000,
        });
      } else {
        toast.error(errorMessage || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", {
          duration: 5000,
        });
      }
    } finally {
      setIsBuying(false);
    }
  };

  // Handle share/copy link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("คัดลอกลิงก์เรียบร้อยแล้ว");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("ไม่สามารถคัดลอกลิงก์ได้");
    }
  };

  // Handle field value changes
  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
    if (
      isMobileRechargeRoute &&
      ["phone", "Phone", "User ID"].includes(fieldName)
    ) {
      setMobilePhoneNumber(value);
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      toast.error("กรุณาเข้าสู่ระบบเพื่อบันทึก", { duration: 3000 });
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    try {
      if (isFavorite && favoriteId) {
        await productApi.removeFavorite(favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        try {
          await productApi.addFavorite(product.id);
          setIsFavorite(true);
          // Find the favorite ID after adding
          const favId = await productApi.findFavoriteId(product.id);
          setFavoriteId(favId);
        } catch (addErr: any) {
          // If already exists, just update UI state and find the ID
          if (addErr?.response?.data?.error?.code === "ALREADY_EXISTS") {
            setIsFavorite(true);
            const favId = await productApi.findFavoriteId(product.id);
            setFavoriteId(favId);
          } else {
            throw addErr;
          }
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  // Helper function to detect if a string is a CUID or UUID (database ID)
  const isValidDatabaseId = (id: string): boolean => {
    // CUID: starts with 'c' followed by alphanumeric, typically 25 chars
    const cuidPattern = /^c[a-z0-9]{24,}$/i;
    // UUID: 8-4-4-4-12 hex format
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return cuidPattern.test(id) || uuidPattern.test(id);
  };

  // Load game details from Product table
  useEffect(() => {
    if (typeof productSlug !== "string") return;

    const fetchGameDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch product by ID or slug based on format detection
        let productResponse;
        if (isValidDatabaseId(productSlug)) {
          // product slug looks like a CUID/UUID - fetch by ID
          productResponse = await productApi.getProductById(productSlug);
        } else {
          // product slug looks like a slug - fetch by slug
          productResponse = await productApi.getProductBySlug(productSlug);
        }

        if (!productResponse.success || !productResponse.data) {
          throw new Error("Game not found");
        }

        const productData = productResponse.data;
        const productTypeNormalized =
          (productData.productType as string | undefined) || "DIRECT_TOPUP";
        setProduct(productData);

        // Extract product types from response (now included in single API call)
        let typesData: ProductType[] = [];
        if (productData.types && productData.types.length > 0) {
          typesData = productData.types;
        }

        setProductTypes(typesData);

        // Transform to GameDetails
        const gameData = transformProductToGameDetails(productData, typesData);

        setGame(gameData);

        // Set default selected option
        if (gameData.topUpOptions.length > 0) {
          const popularOption = gameData.topUpOptions.find(
            (option) => option.isPopular,
          );
          setSelectedOption(
            popularOption ? popularOption.id : gameData.topUpOptions[0].id,
          );
        }

        // Fetch other games for recommendations (Similar & Related by Dev)
        try {
          const allGamesResponse = await productApi.getProducts({
            isActive: true,
            limit: 50,
          });

          if (allGamesResponse.success) {
            // 1. Similar Games by Category
            const otherGames = allGamesResponse.data.filter((p) => {
              const pType =
                (p.productType as string | undefined) || "DIRECT_TOPUP";
              return p.id !== productData.id && pType === productTypeNormalized;
            });
            setSimilarGames(otherGames.slice(0, 5));

            // 2. Related Games by Developer/Publisher
            const currentGameDetails = productData.gameDetails;
            const currentDev = currentGameDetails?.developer;
            const currentPub = currentGameDetails?.publisher;

            if (currentDev || currentPub) {
              const related = allGamesResponse.data.filter((p) => {
                if (p.id === productData.id) return false;
                const pDetails = p.gameDetails;
                const sameDev =
                  currentDev && pDetails?.developer === currentDev;
                const samePub =
                  currentPub && pDetails?.publisher === currentPub;
                return sameDev || samePub;
              });
              setRelatedGamesByDev(related.slice(0, 4));
            }
          }
        } catch {
          // Ignore errors for recommendations
        }
      } catch (err) {
        console.error("Error fetching game:", err);
        setError(productApi.getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [productSlug]);

  // Check favorite status separately to avoid refetching game details on auth state changes
  useEffect(() => {
    if (!product?.id || !isAuthenticated) {
      setIsFavorite(false);
      setFavoriteId(null);
      return;
    }

    let cancelled = false;

    const checkFavorite = async () => {
      try {
        const isFav = await productApi.checkIsFavorite(product.id);
        if (cancelled) return;

        setIsFavorite(isFav);
        if (isFav) {
          const favId = await productApi.findFavoriteId(product.id);
          if (!cancelled) {
            setFavoriteId(favId);
          }
        } else {
          setFavoriteId(null);
        }
      } catch {
        if (!cancelled) {
          setIsFavorite(false);
          setFavoriteId(null);
        }
      }
    };

    checkFavorite();

    return () => {
      cancelled = true;
    };
  }, [product?.id, isAuthenticated]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center h-96 bg-brutal-gray">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลเกม...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="page-container bg-brutal-gray">
        <div
          className="bg-white border-[3px] border-black p-8 text-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <AlertCircle size={48} className="mx-auto text-brutal-pink mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">ไม่พบเกม</h2>
          <p className="text-gray-600 mb-6">
            {error || "เกมที่คุณกำลังค้นหาไม่มีอยู่หรืออาจถูกลบไปแล้ว"}
          </p>
          <Link href={backHref}>
            <Button>
              <ChevronLeft size={18} className="mr-2" />
              {backLabel}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container bg-brutal-gray">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={backHref}
          className="text-gray-600 hover:text-black transition-colors inline-flex items-center font-medium"
        >
          <ChevronLeft size={18} className="mr-1" />
          {backLabel}
        </Link>
      </div>

      {/* Game Hero */}
      <div
        className="bg-white border-[3px] border-black overflow-hidden mb-8"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        <div className="relative min-h-[18rem] md:h-96 overflow-hidden">
          {/* Main banner image - cover full area with crop */}
          <Image
            src={
              game.coverImage ||
              (game.screenshots && game.screenshots.length > 0
                ? game.screenshots[0]
                : game.mainImage) ||
              `https://placehold.co/800x400?text=${encodeURIComponent(game.title)}`
            }
            alt={game.title}
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

          {/* Game info overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-8">
            <div className="flex flex-row items-center md:items-end gap-3 md:gap-6">
              <div
                className="relative w-20 h-20 md:w-32 md:h-32 overflow-hidden border-[3px] border-black flex-shrink-0"
                style={{ boxShadow: "2px 2px 0 0 #000000" }}
              >
                <Image
                  src={
                    game.mainImage ||
                    `https://placehold.co/200x200?text=${encodeURIComponent(game.title)}`
                  }
                  alt={game.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center md:justify-end gap-1.5 md:gap-2">
                <h1 className="text-xl md:text-4xl font-bold text-white leading-tight drop-shadow-md">
                  {game.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-brutal-yellow text-black px-2 py-0.5 md:px-3 md:py-1 font-bold border-[2px] border-black text-xs md:text-sm inline-flex items-center gap-1 shadow-[2px_2px_0_0_#000]">
                    {getCountryFlagCode(game.category) && (
                      <CountryFlag
                        code={getCountryFlagCode(game.category)}
                        size="S"
                      />
                    )}
                    {game.category}
                  </span>
                </div>

                <p className="text-gray-300 text-sm md:text-base font-bold drop-shadow-sm">
                  โดย {game.publisher || game.developer || "ไม่ระบุ"}
                </p>
              </div>

              <div className="absolute top-4 right-4 flex space-x-2 md:static md:mt-0">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleToggleFavorite}
                  className={
                    isFavorite
                      ? "bg-brutal-pink text-black w-9 h-9 md:w-10 md:h-10"
                      : "w-9 h-9 md:w-10 md:h-10"
                  }
                >
                  <Heart size={18} className={isFavorite ? "fill-black" : ""} />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleCopyLink}
                  className={
                    copied
                      ? "bg-brutal-green text-black w-9 h-9 md:w-10 md:h-10"
                      : "w-9 h-9 md:w-10 md:h-10"
                  }
                >
                  {copied ? <Check size={18} /> : <Share2 size={18} />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Game info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tab navigation */}
          <div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="flex border-b-[3px] border-black overflow-x-auto hide-scrollbar">
              {/* Desktop Tabs */}
              <button
                onClick={() => setActiveTab("topup")}
                className={`hidden md:flex py-4 px-6 text-sm font-bold items-center whitespace-nowrap flex-shrink-0 ${activeTab === "topup" ? "text-black bg-brutal-yellow border-r-[3px] border-black" : "text-gray-600 hover:text-black hover:bg-gray-100"}`}
              >
                <DollarSign size={18} className="mr-2" />
                {optionsTabLabel}
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`hidden md:flex py-4 px-6 text-sm font-bold items-center whitespace-nowrap flex-shrink-0 ${activeTab === "info" ? "text-black bg-brutal-yellow border-l-[3px] border-r-[3px] border-black" : "text-gray-600 hover:text-black hover:bg-gray-100"}`}
              >
                <Info size={18} className="mr-2" />
                {infoTabLabel}
              </button>

              {/* Mobile Header - Always show Game Info header */}
              <div className="md:hidden py-4 px-6 text-sm font-bold flex items-center w-full bg-brutal-yellow text-black">
                <Info size={18} className="mr-2" />
                {infoTabLabel}
              </div>
            </div>

            <div className="p-4 md:p-8">
              {/* Top Up Options - Desktop Only */}
              <div
                className={activeTab === "topup" ? "hidden md:block" : "hidden"}
              >
                <div className="space-y-6">
                  <div className="hidden md:flex items-center justify-between">
                    <p className="text-gray-600 font-bold">
                      เลือกจำนวนที่ต้องการเติม:
                    </p>
                  </div>

                  {game.topUpOptions.length === 0 ? (
                    <div className="text-center py-8 bg-brutal-gray border-[3px] border-black">
                      <AlertCircle
                        className="mx-auto text-gray-500 mb-2"
                        size={32}
                      />
                      <p className="text-gray-600">ไม่มีตัวเลือกการเติมเงิน</p>
                      <p className="text-sm text-gray-500 mt-1">
                        กรุณาลองใหม่อีกครั้งภายหลัง
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Grid */}
                      <div className="hidden md:block">
                        <Grid cols={2} md={3} gap={3} className="md:gap-4">
                          {game.topUpOptions.map((option: any) => (
                            <motion.div
                              key={option.id}
                              onClick={() => setSelectedOption(option.id)}
                              className={`relative border-[3px] p-2.5 md:p-4 cursor-pointer transition-all flex flex-col justify-center items-center gap-2 min-h-[100px] md:min-h-[120px] ${
                                selectedOption === option.id
                                  ? "bg-brutal-yellow border-black"
                                  : "bg-white border-black hover:bg-gray-100"
                              }`}
                              style={{
                                boxShadow:
                                  selectedOption === option.id
                                    ? "4px 4px 0 0 #000000"
                                    : "none",
                              }}
                              whileHover={{ y: -2 }}
                            >
                              {option.isPopular && (
                                <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                                  <span className="bg-brutal-pink text-black text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 border-[2px] border-black uppercase tracking-wider shadow-[2px_2px_0_0_#000] whitespace-nowrap">
                                    ยอดนิยม
                                  </span>
                                </div>
                              )}

                              <h4 className="text-black font-bold text-center text-[13px] md:text-base leading-tight line-clamp-2">
                                {option.title}
                              </h4>

                              <div className="text-center">
                                {option.originalPrice > option.price ? (
                                  <div className="flex flex-col items-center">
                                    <span className="line-through text-gray-500 text-[10px] md:text-xs">
                                      ฿
                                      {Number(
                                        option.originalPrice || 0,
                                      ).toFixed(2)}
                                    </span>
                                    <span className="text-black font-bold text-sm md:text-base">
                                      ฿{Number(option.price || 0).toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-black font-bold text-sm md:text-base">
                                    ฿{Number(option.price || 0).toFixed(2)}
                                  </span>
                                )}
                              </div>

                              {selectedOption === option.id && (
                                <div className="absolute bottom-1 right-1 text-black">
                                  <Check size={14} className="md:w-4 md:h-4" />
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </Grid>
                      </div>

                      {/* Mobile Options - Hidden as we use Sheet/Modal on mobile */}
                      {/* <div className="md:hidden"> ... </div> */}

                      {/* Mobile Options Sheet */}
                      <Sheet
                        isOpen={isOptionsModalOpen}
                        onClose={() => setIsOptionsModalOpen(false)}
                        title="เลือกจำนวนที่ต้องการเติม"
                      >
                        <div className="grid grid-cols-2 gap-3 pb-8">
                          {game.topUpOptions.map((option: any) => (
                            <motion.div
                              key={option.id}
                              onClick={() => {
                                setSelectedOption(option.id);
                                setIsOptionsModalOpen(false);
                              }}
                              className={`relative border-[3px] p-3 cursor-pointer transition-all flex flex-col justify-center items-center gap-2 min-h-[110px] ${
                                selectedOption === option.id
                                  ? "bg-brutal-yellow border-black"
                                  : "bg-white border-black hover:bg-gray-100"
                              }`}
                              style={{
                                boxShadow:
                                  selectedOption === option.id
                                    ? "4px 4px 0 0 #000000"
                                    : "none",
                              }}
                            >
                              {option.isPopular && (
                                <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                                  <span className="bg-brutal-pink text-black text-[9px] font-bold px-1.5 py-0.5 border-[2px] border-black uppercase tracking-wider shadow-[2px_2px_0_0_#000] whitespace-nowrap">
                                    ยอดนิยม
                                  </span>
                                </div>
                              )}

                              <h4 className="text-black font-bold text-center text-[13px] leading-tight line-clamp-2">
                                {option.title}
                              </h4>

                              <div className="text-center">
                                {option.originalPrice > option.price ? (
                                  <div className="flex flex-col items-center">
                                    <span className="line-through text-gray-500 text-[10px]">
                                      ฿
                                      {Number(
                                        option.originalPrice || 0,
                                      ).toFixed(2)}
                                    </span>
                                    <span className="text-black font-bold text-sm">
                                      ฿{Number(option.price || 0).toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-black font-bold text-sm">
                                    ฿{Number(option.price || 0).toFixed(2)}
                                  </span>
                                )}
                              </div>

                              {selectedOption === option.id && (
                                <div className="absolute bottom-1 right-1 text-black">
                                  <Check size={14} />
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </Sheet>
                    </>
                  )}

                  {/* First Purchase Bonus - Removed */}
                  {/* {game.topUpOptions.length > 0 && (
                    <div className="mt-6 bg-brutal-blue/20 border-[3px] border-black p-4">
                      <div className="flex items-start">
                        <Gift
                          className="text-black mr-3 mt-1 flex-shrink-0"
                          size={20}
                        />
                        <div>
                          <h4 className="text-black font-bold mb-1">
                            โบนัสการซื้อครั้งแรก!
                          </h4>
                          <p className="text-gray-700 text-sm">
                            รับโบนัสพิเศษ 10% สำหรับการซื้อครั้งแรก
                            โบนัสจะถูกเพิ่มเข้าบัญชีของคุณอัตโนมัติ
                          </p>
                        </div>
                      </div>
                    </div>
                  )} */}
                </div>
              </div>

              {/* Game Info - Visible on Desktop if activeTab=info, Always visible on Mobile */}
              <div
                className={activeTab === "info" ? "block" : "block md:hidden"}
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-black mb-2 md:mb-3 flex items-start md:items-center gap-2 leading-tight">
                      <span className="w-1.5 h-5 bg-brutal-pink flex-shrink-0 mt-1 md:mt-0"></span>
                      <span>เกี่ยวกับ {game.title}</span>
                    </h3>
                    <ProductDescription
                      description={game.longDescription || game.description}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className="bg-brutal-gray border-[3px] border-black p-3 md:p-4"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                      <h4 className="text-black font-bold mb-2 flex items-center">
                        <Package className="mr-2 text-black" size={18} />
                        ผู้พัฒนา
                      </h4>
                      <p className="text-gray-700">
                        {game.developer || "ไม่ระบุ"}
                      </p>
                    </div>

                    <div
                      className="bg-brutal-gray border-[3px] border-black p-3 md:p-4"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                      <h4 className="text-black font-bold mb-2 flex items-center">
                        <Award className="mr-2 text-black" size={18} />
                        ผู้จัดจำหน่าย
                      </h4>
                      <p className="text-gray-700">
                        {game.publisher || "ไม่ระบุ"}
                      </p>
                    </div>

                    {game.releaseDate && (
                      <div
                        className="bg-brutal-gray border-[3px] border-black p-3 md:p-4"
                        style={{ boxShadow: "2px 2px 0 0 #000000" }}
                      >
                        <h4 className="text-black font-bold mb-2 flex items-center">
                          <Calendar className="mr-2 text-black" size={18} />
                          วันวางจำหน่าย
                        </h4>
                        <p className="text-gray-700">
                          {new Date(game.releaseDate).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" },
                          )}
                        </p>
                      </div>
                    )}

                    <div
                      className="bg-brutal-gray border-[3px] border-black p-3 md:p-4"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                      <h4 className="text-black font-bold mb-2 flex items-center">
                        <Smartphone className="mr-2 text-black" size={18} />
                        แพลตฟอร์ม
                      </h4>
                      <p className="text-gray-700">
                        {game.platforms.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Games - Same Developer/Publisher */}
          {relatedGamesByDev.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
                เกมที่เกี่ยวข้อง
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {relatedGamesByDev.map((relatedGame) => (
                  <Link
                    href={`/games/${relatedGame.slug}`}
                    key={relatedGame.id}
                  >
                    <motion.div
                      className="bg-white border-[3px] border-black overflow-hidden group cursor-pointer"
                      style={{ boxShadow: "4px 4px 0 0 #000000" }}
                      whileHover={{ y: -4 }}
                    >
                      <div className="relative aspect-square bg-brutal-gray overflow-hidden">
                        <img
                          src={
                            relatedGame.imageUrl ||
                            `https://placehold.co/300x300?text=${encodeURIComponent(relatedGame.name)}`
                          }
                          alt={relatedGame.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <h3 className="text-sm font-bold text-white line-clamp-1">
                            {relatedGame.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <span className="text-xs bg-brutal-blue text-black px-1.5 py-0.5 border border-black font-bold">
                              {relatedGame.gameDetails?.developer || "เกม"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Purchase section */}
        <div className="order-first lg:order-last">
          {/* Mobile Selector - Shown above the main box on mobile */}
          <div className="md:hidden mb-4">
            {(() => {
              const selected = game.topUpOptions.find(
                (opt) => opt.id === selectedOption,
              );
              return (
                <div
                  onClick={() => setIsOptionsModalOpen(true)}
                  className="relative bg-white border-[3px] border-black p-4 flex items-center justify-between cursor-pointer group"
                  style={{ boxShadow: "4px 4px 0 0 #000000" }}
                >
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                      แพ็กเกจที่เลือก
                    </span>
                    <h4 className="text-black font-bold text-base leading-tight">
                      {selected?.title || "กรุณาเลือกแพ็กเกจ"}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    {selected && (
                      <span className="text-black font-bold text-lg">
                        ฿{Number(selected.price || 0).toFixed(2)}
                      </span>
                    )}
                    <div className="bg-brutal-yellow p-1 border-[2px] border-black group-hover:bg-brutal-yellow/80">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div
            className="bg-white border-[3px] border-black p-4 md:p-6 sticky top-24"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <h3 className="text-lg md:text-xl font-bold text-black mb-4 flex items-center">
              <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
              {purchaseTitle}
            </h3>

            {selectedOption &&
              (() => {
                const option = game.topUpOptions.find(
                  (opt: any) => opt.id === selectedOption,
                );
                if (!option) return null;

                return (
                  <div className="space-y-6">
                    {/* Login required notice for guests */}
                    {!isAuthenticated && (
                      <div className="bg-gray-100 border-[2px] border-gray-300 p-3 text-sm flex items-center gap-2">
                        <AlertTriangle
                          size={16}
                          className="text-yellow-500 flex-shrink-0"
                        />
                        <span className="text-gray-500">
                          กรุณาเข้าสู่ระบบเพื่อกรอกข้อมูลและทำการซื้อ
                        </span>
                      </div>
                    )}

                    {isMobileRechargeRoute &&
                      !(option.fields || []).some((field) =>
                        /phone|user id/i.test(`${field.name} ${field.label}`),
                      ) && (
                        <Input
                          label="เบอร์โทรศัพท์ *"
                          type="tel"
                          value={mobilePhoneNumber}
                          onChange={(e) => setMobilePhoneNumber(e.target.value)}
                          placeholder="กรอกเบอร์โทรศัพท์"
                          disabled={!isAuthenticated}
                        />
                      )}

                    {/* Dynamic Fields for Direct Top-Up */}
                    {option.fields && option.fields.length > 0 && (
                      <div className="space-y-4">
                        {option.fields.map((field) => (
                          <div key={field.name}>
                            {field.type === "select" ? (
                              <Select
                                label={
                                  <>
                                    {translateLabel(field.label)}{" "}
                                    {field.required && (
                                      <span className="text-red-500">*</span>
                                    )}
                                  </>
                                }
                                options={
                                  field.options?.map((opt) => ({
                                    label: opt.label,
                                    value: opt.value,
                                  })) || []
                                }
                                value={fieldValues[field.name] || ""}
                                onChange={(value) =>
                                  handleFieldChange(field.name, value)
                                }
                                placeholder={`เลือก${translateLabel(field.label)}`}
                                disabled={!isAuthenticated}
                              />
                            ) : (
                              <Input
                                label={`${translateLabel(field.label)} ${field.required ? "*" : ""}`}
                                type="text"
                                value={fieldValues[field.name] || ""}
                                onChange={(e) =>
                                  handleFieldChange(field.name, e.target.value)
                                }
                                placeholder={
                                  field.placeholder ||
                                  `กรอก${translateLabel(field.label)}ของคุณ`
                                }
                                disabled={!isAuthenticated}
                              />
                            )}
                            {field.prefix && (
                              <span className="text-xs text-gray-600 mt-1 block">
                                คำนำหน้า: {field.prefix}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-start gap-4">
                      <span className="text-gray-600 flex-shrink-0 pt-0.5">
                        จำนวนที่เลือก:
                      </span>
                      <div className="text-right min-w-0">
                        <span className="text-black font-bold block leading-tight break-words">
                          {option.title}
                        </span>
                      </div>
                    </div>

                    {/* Payment option selection moved to modal after buy */}

                    <div className="py-4 border-y-[3px] border-black">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">ราคา:</span>
                        {option.originalPrice > option.price ? (
                          <div>
                            <span className="line-through text-gray-500 text-sm mr-2">
                              ฿{Number(option.originalPrice || 0).toFixed(2)}
                            </span>
                            <span className="text-black font-bold text-xl">
                              ฿{Number(option.price || 0).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-black font-bold text-xl">
                            ฿{Number(option.price || 0).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {option.originalPrice > option.price && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">ประหยัด:</span>
                          <span className="text-brutal-green font-bold">
                            ฿
                            {(
                              Number(option.originalPrice || 0) -
                              Number(option.price || 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <Button
                        onClick={handleBuyNow}
                        disabled={isBuying}
                        isLoading={isBuying}
                        size="full"
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        {!isBuying && (
                          <>
                            <ShoppingCart
                              size={18}
                              className="mr-2"
                              aria-hidden="true"
                            />
                            {isAuthenticated
                              ? "ซื้อเลย"
                              : "เข้าสู่ระบบเพื่อซื้อ"}
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="bg-brutal-gray border-[3px] border-black p-3 text-sm">
                      <div className="flex">
                        <Clock
                          size={16}
                          className="text-gray-600 mr-2 mt-0.5 flex-shrink-0"
                        />
                        <span className="text-gray-600">
                          จัดส่งอัตโนมัติทันที
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>

      {/* Related Games section - show actual similar games */}
      <section className="mt-16 mb-10">
        <h2 className="text-xl font-bold text-black mb-4 flex items-center">
          <span className="w-1.5 h-5 bg-brutal-green mr-2"></span>
          เกมที่คล้ายกัน
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {similarGames.length > 0 ? (
            similarGames.map((similarGame) => (
              <Link href={`/games/${similarGame.slug}`} key={similarGame.id}>
                <motion.div
                  className="bg-white border-[3px] border-black overflow-hidden group cursor-pointer"
                  style={{ boxShadow: "4px 4px 0 0 #000000" }}
                  whileHover={{ y: -4 }}
                >
                  <div className="aspect-square relative bg-brutal-gray overflow-hidden">
                    <img
                      src={
                        similarGame.imageUrl ||
                        `https://placehold.co/300x300?text=${encodeURIComponent(similarGame.name)}`
                      }
                      alt={similarGame.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <h3 className="text-sm font-bold text-white line-clamp-1">
                        {similarGame.name}
                      </h3>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-brutal-blue text-black px-1.5 py-0.5 border border-black font-bold">
                          {similarGame.gameDetails?.developer ||
                            similarGame.category?.name ||
                            "เกม"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-600">
              ไม่พบเกมที่คล้ายกัน
            </div>
          )}
        </div>
      </section>

      {/* Confirmation Modal - Redesigned for horizontal layout */}
      <AnimatePresence>
        {showConfirmModal && verificationStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-[3px] border-black w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
              style={{ boxShadow: "8px 8px 0 0 #000000" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={`border-b-[3px] border-black p-3 sm:p-4 flex items-center justify-between flex-shrink-0 ${!verificationStatus.supported ? "bg-brutal-pink" : "bg-brutal-yellow"}`}
              >
                <div className="flex items-center gap-2">
                  {!verificationStatus.supported ? (
                    <ShieldAlert size={22} className="text-black" />
                  ) : (
                    <Check size={22} className="text-black" />
                  )}
                  <h2 className="text-base sm:text-lg font-bold text-black">
                    {!verificationStatus.supported
                      ? "ไม่สามารถตรวจสอบบัญชีได้"
                      : "ยืนยันข้อมูลการสั่งซื้อ"}
                  </h2>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1.5 hover:bg-black/10 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content - Horizontal Layout */}
              <div className="flex-1 overflow-y-auto">
                {/* Warning Banner - Compact */}
                {!verificationStatus.supported && (
                  <div className="bg-red-50 border-b-[2px] border-red-200 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle
                        size={18}
                        className="text-red-600 mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-red-700 text-sm">
                          เกมนี้ไม่รองรับการตรวจสอบบัญชีอัตโนมัติ
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">
                          กรุณาตรวจสอบข้อมูลให้แน่ใจก่อนดำเนินการ
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Left Column - Product Info */}
                  <div className="p-4 sm:p-5 space-y-4 border-b-[2px] lg:border-b-0 lg:border-r-[2px] border-black/10">
                    {/* Product Summary Card */}
                    <div className="bg-brutal-gray border-[2px] border-black p-3 sm:p-4 shadow-[3px_3px_0_0_#000]">
                      <h3 className="font-bold text-black text-sm mb-3 flex items-center gap-1.5">
                        <Package size={16} />
                        รายละเอียดสินค้า
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">สินค้า:</span>
                          <span className="font-medium text-black text-right max-w-[60%]">
                            {verificationStatus.productName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">จำนวน:</span>
                          <span className="font-medium text-black">
                            {verificationStatus.optionName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Player Info - Compact */}
                    {Object.keys(verificationStatus.playerInfo).length > 0 && (
                      <div className="bg-white border-[2px] border-black p-3 sm:p-4 shadow-[3px_3px_0_0_#000]">
                        <h3 className="font-bold text-black text-sm mb-2 flex items-center gap-1.5">
                          <User size={16} />
                          ข้อมูลบัญชี
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(verificationStatus.playerInfo).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="bg-brutal-gray p-2 border border-black/20"
                              >
                                <span className="text-xs text-gray-500 block capitalize">
                                  {key}
                                </span>
                                <span className="font-mono font-bold text-black text-sm truncate block">
                                  {value}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Warning - No Refund */}
                    <div className="bg-red-50 border-l-4 border-red-500 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          size={16}
                          className="text-red-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-red-700 text-xs">
                            ไม่สามารถขอคืนเงินได้
                          </p>
                          <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                            หากข้อมูลไม่ถูกต้อง
                            ระบบไม่สามารถคืนเงินหรือยกเลิกรายการได้
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Payment & Actions */}
                  <div className="p-4 sm:p-5 space-y-4 bg-gray-50/50">
                    {/* Payment Method */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        ช่องทางชำระเงิน
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-black text-sm">
                          {priceSummary.label || "เลือกช่องทาง"}
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setIsPaymentSelectOpen(true)}
                          className="text-xs py-1 px-2 h-auto"
                        >
                          เปลี่ยน
                        </Button>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-white border-[2px] border-black p-4 shadow-[3px_3px_0_0_#000]">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>ยอดสินค้า</span>
                          <span>
                            ฿
                            {Number(
                              priceSummary.base ||
                                verificationStatus.price ||
                                0,
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>ค่าธรรมเนียม</span>
                          <span>
                            ฿{Number(priceSummary.fee || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t-2 border-black pt-2 mt-2">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-black">
                              ยอดสุทธิ
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-black">
                              ฿
                              {Number(
                                priceSummary.total ||
                                  verificationStatus.price ||
                                  0,
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security Note */}
                    <div className="bg-sky-50 border border-sky-200 p-2.5 text-xs text-sky-700 flex items-start gap-2">
                      <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
                      <span>การชำระเงินปลอดภัยผ่านระบบ Stripe</span>
                    </div>

                    {/* Action Buttons - Side by Side Layout */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Primary Action - Confirm */}
                        <Button
                          onClick={createOrder}
                          disabled={isBuying}
                          isLoading={isBuying}
                          className="flex-1 bg-black text-white hover:bg-gray-800 h-12 sm:h-14 text-base sm:text-lg font-bold shadow-[3px_3px_0_0_#000] border-[2px] border-black"
                        >
                          {!isBuying && <Check size={20} className="mr-2" />}
                          ยืนยันการสั่งซื้อ
                        </Button>

                        {/* Secondary Action - Cancel */}
                        <Button
                          variant="secondary"
                          onClick={() => setShowConfirmModal(false)}
                          disabled={isBuying}
                          className="sm:w-auto w-full h-12 sm:h-14 px-6 sm:px-8 font-semibold border-[2px] border-black shadow-[3px_3px_0_0_#000]"
                        >
                          ยกเลิก
                        </Button>
                      </div>

                      {/* Helper Text */}
                      <p className="text-center text-xs text-gray-400 mt-3">
                        กดปุ่มยืนยันเพื่อดำเนินการชำระเงินต่อ
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment selection modal (desktop & mobile) */}
      <AnimatePresence>
        {isPaymentSelectOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setIsPaymentSelectOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-5xl border-[3px] border-black shadow-brutal p-4 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start gap-3 mb-5">
                <div>
                  <p className="text-xs uppercase text-gray-500 font-bold tracking-widest">
                    Payment Method
                  </p>
                  <h3 className="text-2xl font-black text-black">
                    เลือกช่องทางชำระเงิน
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    เลือกวิธีที่สะดวก
                    ระบบจะคำนวณค่าธรรมเนียมและยอดรวมให้อัตโนมัติ
                  </p>
                </div>
                <button
                  onClick={() => setIsPaymentSelectOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[58vh] overflow-y-auto pr-1">
                  {paymentOptions.map((opt: PaymentMethodOption) => {
                    const isActive = selectedPaymentOption === opt.code;
                    return (
                      <label
                        key={opt.code}
                        className={`border-[2px] border-black p-4 flex flex-col gap-3 cursor-pointer transition-all ${
                          isActive ? "bg-brutal-yellow" : "bg-white"
                        }`}
                        style={{ boxShadow: "2px 2px 0 0 #000" }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <input
                              type="radio"
                              name="paymentOptionModal"
                              value={opt.code}
                              checked={isActive}
                              onChange={() =>
                                setSelectedPaymentOption(opt.code)
                              }
                              className="mt-1 accent-black"
                            />
                            <div>
                              <div className="text-black font-semibold text-base flex items-center gap-2">
                                {opt.label}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Gateway: {opt.gateway.name}
                              </div>
                            </div>
                          </div>
                          {isActive && (
                            <Check size={16} className="text-black" />
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[11px] uppercase border border-black px-2 py-0.5 bg-white text-gray-700 font-bold">
                            {opt.method}
                          </span>
                          <span className="text-xs text-gray-600">
                            Code: {opt.code}
                          </span>
                        </div>

                        <div className="border-t border-black/20 pt-2 text-xs text-gray-700 space-y-1">
                          <div className="flex justify-between">
                            <span>ค่าธรรมเนียม %</span>
                            <span>
                              {Number(opt.surchargePercent || 0).toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>ค่าธรรมเนียมคงที่</span>
                            <span>{formatTHB(Number(opt.flatFee || 0))}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="border-[2px] border-black p-4 bg-gray-50 h-fit space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">
                      Transaction Summary
                    </p>
                    <h4 className="text-lg font-bold text-black mt-1">
                      สรุปรายการชำระเงิน
                    </h4>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-700">
                      <span>สินค้า</span>
                      <span className="font-semibold text-black max-w-[55%] text-right truncate">
                        {game?.title || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>แพ็กเกจ</span>
                      <span className="font-semibold text-black max-w-[55%] text-right truncate">
                        {selectedTopUp?.title || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>ยอดสินค้า</span>
                      <span>{formatTHB(Number(priceSummary.base || 0))}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>ค่าธรรมเนียม</span>
                      <span>{formatTHB(Number(priceSummary.fee || 0))}</span>
                    </div>
                  </div>

                  <div className="border-t-2 border-black pt-3 flex justify-between items-end">
                    <span className="text-sm text-gray-600">
                      ยอดที่ต้องชำระ
                    </span>
                    <span className="text-2xl font-black text-black">
                      {formatTHB(Number(priceSummary.total || 0))}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      onClick={() => setIsPaymentSelectOpen(false)}
                      disabled={!selectedPaymentOption}
                      fullWidth
                    >
                      ยืนยันช่องทางนี้
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setIsPaymentSelectOpen(false)}
                      fullWidth
                    >
                      ปิดหน้าต่าง
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
