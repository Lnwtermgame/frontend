"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { orderApi } from "@/lib/services/order-api";
import {
  ChevronLeft,
  ShoppingCart,
  Heart,
  Share2,
  Star,
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
} from "lucide-react";
import toast from "react-hot-toast";
import ProductDescription from "@/components/products/ProductDescription";
import {
  productApi,
  Product,
  ProductVariant,
  SeagmProduct,
  ProductType,
  SeagmField,
} from "@/lib/services/product-api";

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
  parValue?: number;
  parValueCurrency?: string;
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
      price: type.sellingPrice ?? (type.originPrice || type.unitPrice),
      originalPrice: type.originPrice || type.unitPrice,
      isPopular: index === 0,
      parValue: type.parValue,
      parValueCurrency: type.parValueCurrency,
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
  const { gameId } = useParams();
  const router = useRouter();
  const [game, setGame] = useState<GameDetails | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("topup");
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [similarGames, setSimilarGames] = useState<Product[]>([]);
  const [relatedGamesByDev, setRelatedGamesByDev] = useState<Product[]>([]);
  const [isBuying, setIsBuying] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    supported: boolean;
    playerInfo: Record<string, string>;
    productName: string;
    optionName: string;
    price: number;
  } | null>(null);

  // Handle buy now - verify first, then show confirmation
  const handleBuyNow = async () => {
    if (!product || !selectedOption) {
      toast.error("กรุณาเลือกตัวเลือกเติมเงิน");
      return;
    }

    // Check if all required fields are filled
    const selectedProductType = productTypes.find(
      (pt) => pt.id === selectedOption,
    );
    const selectedOptionData = game?.topUpOptions.find(
      (opt) => opt.id === selectedOption,
    );

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

    try {
      setIsBuying(true);
      toast.loading("กำลังตรวจสอบข้อมูล...");

      // Verify player info with SEAGM
      let isVerificationSupported = true;
      try {
        const verifyResult = await productApi.verifyPlayer(
          product.id,
          fieldValues,
        );
        isVerificationSupported = verifyResult.supported !== false;

        if (verifyResult.valid && isVerificationSupported) {
          // Verification passed - proceed directly
          toast.dismiss();
          await createOrder();
          return;
        }
      } catch (verifyErr: any) {
        // If verification API fails, assume not supported
        isVerificationSupported = false;
      }

      // Show confirmation modal for unsupported verification or failed verification
      toast.dismiss();
      setVerificationStatus({
        supported: isVerificationSupported,
        playerInfo: fieldValues,
        productName: product.name,
        optionName: selectedOptionData?.title || "",
        price: selectedOptionData?.price || 0,
      });
      setShowConfirmModal(true);
    } catch (err: any) {
      toast.dismiss();
      console.error("Buy now error:", err);
      toast.error(
        err?.response?.data?.error?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setIsBuying(false);
    }
  };

  // Create order after confirmation
  const createOrder = async () => {
    if (!product || !selectedOption) return;

    try {
      setIsBuying(true);
      toast.loading("กำลังสร้างคำสั่งซื้อ...");

      const response = await orderApi.createOrder({
        items: [
          {
            productId: product.id,
            productTypeId: selectedOption, // The selected product type (e.g., 60 UC, 325 UC)
            quantity: 1,
            playerInfo: fieldValues,
          },
        ],
        paymentMethod: "CREDIT_CARD", // Required field for backend
        skipPayment: true, // Bypass payment for testing
      });

      toast.dismiss();

      if (response.success) {
        toast.success("สั่งซื้อสำเร็จ! กำลังดำเนินการ...");
        setShowConfirmModal(false);
        // Redirect to order detail page
        router.push(`/dashboard/orders/${response.data.id}`);
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
  };

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    if (!product) return;

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
    if (typeof gameId !== "string") return;

    const fetchGameDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch product by ID or slug based on format detection
        let productResponse;
        if (isValidDatabaseId(gameId)) {
          // gameId looks like a CUID/UUID - fetch by ID
          productResponse = await productApi.getProductById(gameId);
        } else {
          // gameId looks like a slug - fetch by slug
          productResponse = await productApi.getProductBySlug(gameId);
        }

        if (!productResponse.success || !productResponse.data) {
          throw new Error("Game not found");
        }

        const productData = productResponse.data;
        setProduct(productData);

        // Extract product types from response (now included in single API call)
        let typesData: ProductType[] = [];
        if (productData.types && productData.types.length > 0) {
          typesData = productData.types;
        } else if (
          productData.seagmTypes &&
          productData.seagmTypes.length > 0
        ) {
          typesData = productData.seagmTypes;
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

        // Fetch similar games (other DIRECT_TOPUP products)
        try {
          const similarResponse = await productApi.getProducts({
            isActive: true,
            limit: 20,
          });
          if (similarResponse.success) {
            // Filter out current product and limit to 5
            const filtered = similarResponse.data.filter(
              (p) => p.id !== productData.id,
            );
            setSimilarGames(filtered.slice(0, 5));
          }
        } catch {
          // Ignore errors for similar games
        }

        // Fetch related games by same developer/publisher
        try {
          const currentGameDetails = productData.gameDetails;
          const currentDev = currentGameDetails?.developer;
          const currentPub = currentGameDetails?.publisher;

          if (currentDev || currentPub) {
            const allGamesResponse = await productApi.getProducts({
              isActive: true,
              limit: 50,
            });

            if (allGamesResponse.success) {
              // Filter games with same developer or publisher
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
          // Ignore errors for related games
        }

        // Check if product is in favorites (only for logged in users)
        try {
          const isFav = await productApi.checkIsFavorite(productData.id);
          setIsFavorite(isFav);
          if (isFav) {
            const favId = await productApi.findFavoriteId(productData.id);
            setFavoriteId(favId);
          }
        } catch {
          // Ignore auth errors for guests
        }
      } catch (err) {
        console.error("Error fetching game:", err);
        setError(productApi.getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [gameId]);

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
          <Link
            href="/games"
            className="bg-black hover:bg-gray-800 text-white px-6 py-3 font-bold inline-flex items-center border-[3px] border-black transition-colors"
            style={{ boxShadow: "2px 2px 0 0 #000000" }}
          >
            <ChevronLeft size={18} className="mr-2" />
            กลับไปหน้าเกมทั้งหมด
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
          href="/games"
          className="text-gray-600 hover:text-black transition-colors inline-flex items-center font-medium"
        >
          <ChevronLeft size={18} className="mr-1" />
          กลับไปหน้าเกม
        </Link>
      </div>

      {/* Game Hero */}
      <div
        className="bg-white border-[3px] border-black overflow-hidden mb-8"
        style={{ boxShadow: "4px 4px 0 0 #000000" }}
      >
        <div className="relative h-80 md:h-96 overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>

          {/* Game info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div
                className="relative w-24 h-24 md:w-32 md:h-32 overflow-hidden border-[3px] border-black"
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
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {game.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="bg-brutal-yellow text-black px-3 py-1 font-bold border-[2px] border-black">
                    {game.category}
                  </span>
                  <div className="flex items-center text-brutal-yellow">
                    <Star size={16} className="fill-brutal-yellow" />
                    <span className="ml-1 font-bold">{game.rating}</span>
                    <span className="ml-1 text-gray-300">
                      ({game.ratingCount?.toLocaleString() || 0})
                    </span>
                  </div>
                  {game.releaseDate && (
                    <span className="text-gray-300 flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {new Date(game.releaseDate).getFullYear()}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <span className="text-gray-300 mr-2">โดย</span>
                  <span className="text-white font-medium">
                    {game.developer || game.publisher}
                  </span>
                </div>
              </div>

              <div className="flex mt-4 md:mt-0 space-x-3">
                <motion.button
                  type="button"
                  onClick={handleToggleFavorite}
                  aria-label={
                    isFavorite ? "ลบออกจากรายการโปรด" : "เพิ่มในรายการโปรด"
                  }
                  className={`p-3 border-[3px] border-black transition-all duration-200 ${
                    isFavorite
                      ? "bg-brutal-pink text-black"
                      : "bg-white text-black hover:bg-gray-100"
                  }`}
                  style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <Heart
                    size={20}
                    className={isFavorite ? "fill-black" : ""}
                    aria-hidden="true"
                  />
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleCopyLink}
                  aria-label={copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                  className={`p-3 border-[3px] border-black transition-all duration-200 ${
                    copied
                      ? "bg-brutal-green text-black"
                      : "bg-white text-black hover:bg-gray-100"
                  }`}
                  style={{ boxShadow: "2px 2px 0 0 #000000" }}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  {copied ? (
                    <Check size={20} aria-hidden="true" />
                  ) : (
                    <Share2 size={20} aria-hidden="true" />
                  )}
                </motion.button>
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
              <button
                onClick={() => setActiveTab("topup")}
                className={`py-4 px-6 text-sm font-bold flex items-center ${activeTab === "topup" ? "text-black bg-brutal-yellow border-r-[3px] border-black" : "text-gray-600 hover:text-black hover:bg-gray-100"}`}
              >
                <DollarSign size={18} className="mr-2" />
                ตัวเลือกเติมเงิน
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`py-4 px-6 text-sm font-bold flex items-center ${activeTab === "info" ? "text-black bg-brutal-yellow border-l-[3px] border-r-[3px] border-black" : "text-gray-600 hover:text-black hover:bg-gray-100"}`}
              >
                <Info size={18} className="mr-2" />
                ข้อมูลเกม
              </button>
            </div>

            <div className="p-6 md:p-8">
              {/* Top Up Options */}
              {activeTab === "topup" && (
                <div className="space-y-6">
                  <p className="text-gray-600">เลือกจำนวนที่ต้องการเติม:</p>

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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                      {game.topUpOptions.map((option: any) => (
                        <motion.div
                          key={option.id}
                          onClick={() => setSelectedOption(option.id)}
                          className={`relative border-[3px] p-4 cursor-pointer transition-all ${
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
                            <div className="absolute -top-3 left-0 right-0 flex justify-center">
                              <span className="bg-brutal-pink text-black text-[10px] font-bold px-2 py-0.5 border-[2px] border-black uppercase tracking-wider">
                                ยอดนิยม
                              </span>
                            </div>
                          )}

                          <h4 className="text-black font-bold text-center mb-1">
                            {option.title}
                          </h4>

                          {/* {option.parValue && option.parValueCurrency && (
                            <p className="text-center text-gray-600 text-sm mb-2">
                              {option.parValue} {option.parValueCurrency}
                            </p>
                          )} */}

                          <div className="text-center">
                            {option.originalPrice > option.price ? (
                              <>
                                <span className="line-through text-gray-500 text-sm mr-1">
                                  ฿
                                  {Number(option.originalPrice || 0).toFixed(2)}
                                </span>
                                <span className="text-black font-bold">
                                  ฿{Number(option.price || 0).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-black font-bold">
                                ฿{Number(option.price || 0).toFixed(2)}
                              </span>
                            )}
                          </div>

                          {selectedOption === option.id && (
                            <div className="absolute bottom-2 right-2 text-black">
                              <Check size={16} />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {game.topUpOptions.length > 0 && (
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
                  )}
                </div>
              )}

              {/* Game Info */}
              {activeTab === "info" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-black font-bold mb-2 flex items-center">
                      <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
                      เกี่ยวกับ {game.title}
                    </h3>
                    <ProductDescription
                      description={game.longDescription || game.description}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className="bg-brutal-gray border-[3px] border-black p-4"
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
                      className="bg-brutal-gray border-[3px] border-black p-4"
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
                        className="bg-brutal-gray border-[3px] border-black p-4"
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
                      className="bg-brutal-gray border-[3px] border-black p-4"
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
              )}
            </div>
          </div>

          {/* Related Games - Same Developer/Publisher */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center">
              <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
              เกมที่เกี่ยวข้อง
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedGamesByDev.length > 0 ? (
                relatedGamesByDev.map((relatedGame) => (
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
                            <Star
                              size={12}
                              className="text-brutal-yellow fill-brutal-yellow"
                            />
                            <span className="ml-1 text-xs text-brutal-yellow font-bold">
                              {relatedGame.averageRating?.toFixed(1) || "4.5"}
                            </span>
                            <span className="ml-2 text-xs bg-brutal-blue text-black px-1.5 py-0.5 border border-black font-bold">
                              {relatedGame.gameDetails?.developer || "เกม"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-600">
                  ไม่พบเกมที่เกี่ยวข้อง
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Purchase section */}
        <div>
          <div
            className="bg-white border-[3px] border-black p-6 sticky top-4"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <h3 className="text-xl font-bold text-black mb-4 flex items-center">
              <span className="w-1.5 h-5 bg-brutal-pink mr-2"></span>
              รายละเอียดการเติมเงิน
            </h3>

            {selectedOption &&
              (() => {
                const option = game.topUpOptions.find(
                  (opt: any) => opt.id === selectedOption,
                );
                if (!option) return null;

                return (
                  <div className="space-y-6">
                    {/* Dynamic Fields for Direct Top-Up */}
                    {option.fields && option.fields.length > 0 && (
                      <div className="space-y-4">
                        {option.fields.map((field) => (
                          <div key={field.name} className="mb-4">
                            <label className="block text-sm font-bold text-black mb-2">
                              {translateLabel(field.label)}
                              {field.required && (
                                <span className="text-brutal-pink ml-1">*</span>
                              )}
                            </label>
                            {field.type === "select" ? (
                              <select
                                value={fieldValues[field.name] || ""}
                                onChange={(e) =>
                                  handleFieldChange(field.name, e.target.value)
                                }
                                className="w-full bg-white border-[3px] border-black px-4 py-3 text-black focus:outline-none focus:ring-0"
                              >
                                <option value="" className="bg-white">
                                  เลือก{translateLabel(field.label)}
                                </option>
                                {field.options?.map((opt) => (
                                  <option
                                    key={opt.value}
                                    value={opt.value}
                                    className="bg-white"
                                  >
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={fieldValues[field.name] || ""}
                                onChange={(e) =>
                                  handleFieldChange(field.name, e.target.value)
                                }
                                placeholder={
                                  field.placeholder ||
                                  `กรอก${translateLabel(field.label)}ของคุณ`
                                }
                                className="w-full bg-white border-[3px] border-black px-4 py-3 text-black focus:outline-none focus:ring-0"
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

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">จำนวนที่เลือก:</span>
                      <div className="text-right">
                        <span className="text-black font-bold block">
                          {option.title}
                        </span>
                        {/* {option.parValue && option.parValueCurrency && (
                          <span className="text-gray-600 text-sm">
                            {option.parValue} {option.parValueCurrency}
                          </span>
                        )} */}
                      </div>
                    </div>

                    <div className="py-4 border-y-[3px] border-black">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">ราคา:</span>
                        {option.originalPrice > option.price ? (
                          <div>
                            <span className="line-through text-gray-500 text-sm mr-2">
                              ฿{Number(option.originalPrice || 0).toFixed(2)}
                            </span>
                            <span className="text-black font-bold">
                              ฿{Number(option.price || 0).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-black font-bold">
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
                      <motion.button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={isBuying}
                        className="w-full bg-black text-white py-3 font-bold flex items-center justify-center border-[3px] border-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ boxShadow: "4px 4px 0 0 #000000" }}
                        whileHover={isBuying ? {} : { y: -2 }}
                        whileTap={isBuying ? {} : { y: 0 }}
                      >
                        {isBuying ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            กำลังดำเนินการ...
                          </>
                        ) : (
                          <>
                            <ShoppingCart
                              size={18}
                              className="mr-2"
                              aria-hidden="true"
                            />
                            ซื้อเลย
                          </>
                        )}
                      </motion.button>
                    </div>

                    <div className="bg-brutal-gray border-[3px] border-black p-3 text-sm">
                      <div className="flex">
                        <Clock
                          size={16}
                          className="text-gray-600 mr-2 mt-0.5 flex-shrink-0"
                        />
                        <span className="text-gray-600">
                          จัดส่งอัตโนมัติทันที (ทดสอบระบบ - ข้ามชำระเงิน)
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-xs bg-brutal-blue text-black px-2 py-0.5 border border-black font-bold">
                        {similarGame.category?.name || "เกม"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-black text-sm mb-1 truncate">
                      {similarGame.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-brutal-yellow fill-brutal-yellow" />
                        <span className="text-gray-600 text-xs ml-1">
                          {similarGame.averageRating?.toFixed(1) || "4.5"}
                        </span>
                      </div>
                      <span className="text-xs text-black font-bold">
                        ฿
                        {similarGame.types && similarGame.types.length > 0
                          ? Math.min(
                              ...similarGame.types.map((t) => t.unitPrice),
                            ).toFixed(0)
                          : "0"}
                      </span>
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

      {/* Confirmation Modal */}
      {showConfirmModal && verificationStatus && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white border-[3px] border-black max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: "8px 8px 0 0 #000000" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-brutal-yellow border-b-[3px] border-black p-4 flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle size={24} className="text-black mr-2" />
                <h2 className="text-lg font-bold text-black">
                  {!verificationStatus.supported
                    ? "ไม่สามารถตรวจสอบบัญชีได้"
                    : "ยืนยันข้อมูล"}
                </h2>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 hover:bg-black/10 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Warning message for unsupported verification */}
              {!verificationStatus.supported && (
                <div className="bg-brutal-pink/20 border-[3px] border-brutal-pink p-4">
                  <div className="flex items-start">
                    <ShieldAlert
                      size={20}
                      className="text-brutal-pink mr-2 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="font-bold text-black mb-1">
                        เกมนี้ไม่รองรับการตรวจสอบบัญชีอัตโนมัติ
                      </p>
                      <p className="text-sm text-gray-700">
                        ระบบไม่สามารถตรวจสอบว่าข้อมูลบัญชีถูกต้องหรือไม่
                        กรุณาตรวจสอบข้อมูลให้แน่ใจก่อนดำเนินการ
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-brutal-gray border-[3px] border-black p-4">
                <h3 className="font-bold text-black mb-3 flex items-center">
                  <Package size={18} className="mr-2" />
                  รายละเอียดการสั่งซื้อ
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">สินค้า:</span>
                    <span className="font-medium text-black">
                      {verificationStatus.productName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">จำนวน:</span>
                    <span className="font-medium text-black">
                      {verificationStatus.optionName}
                    </span>
                  </div>
                  <div className="flex justify-between border-t-[2px] border-black/20 pt-2 mt-2">
                    <span className="text-gray-600">ราคา:</span>
                    <span className="font-bold text-black">
                      ฿{verificationStatus.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Player Info Display */}
              {Object.keys(verificationStatus.playerInfo).length > 0 && (
                <div className="bg-white border-[3px] border-black p-4">
                  <h3 className="font-bold text-black mb-3 flex items-center">
                    <User size={18} className="mr-2" />
                    ข้อมูลบัญชีที่ระบุ
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(verificationStatus.playerInfo).map(
                      ([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">
                            {key}:
                          </span>
                          <span className="font-mono font-bold text-black bg-brutal-gray px-2 py-0.5">
                            {value}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* No Refund Warning */}
              <div className="bg-red-50 border-[3px] border-red-500 p-4">
                <div className="flex items-start">
                  <AlertCircle
                    size={20}
                    className="text-red-600 mr-2 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="font-bold text-red-700 mb-1">
                      คำเตือน: ไม่สามารถขอคืนเงินได้
                    </p>
                    <p className="text-sm text-red-600">
                      หากข้อมูลบัญชีที่ระบุไม่ถูกต้อง
                      ระบบจะไม่สามารถคืนเงินหรือยกเลิกรายการได้
                      กรุณาตรวจสอบข้อมูลให้แน่ใจก่อนยืนยัน
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <motion.button
                  type="button"
                  onClick={createOrder}
                  disabled={isBuying}
                  className="w-full bg-black text-white py-3 font-bold flex items-center justify-center border-[3px] border-black hover:bg-gray-800 transition-colors disabled:opacity-50"
                  style={{ boxShadow: "4px 4px 0 0 #000000" }}
                  whileHover={isBuying ? {} : { y: -2 }}
                  whileTap={isBuying ? {} : { y: 0 }}
                >
                  {isBuying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    <>
                      <Check size={18} className="mr-2" />
                      ยืนยันการสั่งซื้อ
                    </>
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isBuying}
                  className="w-full bg-white text-black py-3 font-bold border-[3px] border-black hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
