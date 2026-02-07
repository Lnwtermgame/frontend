"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

// Game details interface matching the UI expectations
interface GameDetails {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  mainImage: string;
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
      price: type.unitPrice,
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
    description: product.shortDescription || product.description || `Top up ${product.name} instantly.`,
    longDescription: product.description || `${product.name} offers a convenient way to purchase in-game currency and items.`,
    mainImage:
      product.imageUrl ||
      `https://placehold.co/400x400?text=${encodeURIComponent(product.name)}`,
    category: product.category?.name || (product.productType === "DIRECT_TOPUP" ? "Direct Top Up" : "Gift Card"),
    developer: gameDetails?.developer || product.category?.name || "Unknown",
    publisher: gameDetails?.publisher || "Unknown",
    platforms: gameDetails?.platforms?.length ? gameDetails.platforms : ["iOS", "Android"],
    rating: 4.5,
    ratingCount: product.reviewCount || 0,
    screenshots: product.images?.map(img => img.url) || [],
    topUpOptions: topUpOptions.length > 0 ? topUpOptions : [{
      id: product.id,
      title: product.name,
      price: product.price,
      originalPrice: product.comparePrice || product.price,
      isPopular: true,
    }],
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

  // Handle share/copy link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('คัดลอกลิงก์เรียบร้อยแล้ว');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('ไม่สามารถคัดลอกลิงก์ได้');
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
          const result = await productApi.addFavorite(product.id);
          setIsFavorite(true);
          // Store the new favorite ID from response
          if (result.data?.id) {
            setFavoriteId(result.data.id);
          }
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
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
        if (productData.seagmTypes && productData.seagmTypes.length > 0) {
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
            productType: "DIRECT_TOPUP",
            isActive: true,
            limit: 6,
          });
          if (similarResponse.success) {
            // Filter out current product and limit to 5
            const filtered = similarResponse.data.filter(p => p.id !== productData.id);
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
              productType: "DIRECT_TOPUP",
              isActive: true,
              limit: 50,
            });

            if (allGamesResponse.success) {
              // Filter games with same developer or publisher
              const related = allGamesResponse.data.filter(p => {
                if (p.id === productData.id) return false;
                const pDetails = p.gameDetails;
                const sameDev = currentDev && pDetails?.developer === currentDev;
                const samePub = currentPub && pDetails?.publisher === currentPub;
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
      <div className="page-container flex items-center justify-center h-96">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-mali-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-mali-text-secondary">
            กำลังโหลดข้อมูลเกม...
          </p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="page-container">
        <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">ไม่พบเกม</h2>
          <p className="text-mali-text-secondary mb-6">
            {error ||
              "เกมที่คุณกำลังค้นหาไม่มีอยู่หรืออาจถูกลบไปแล้ว"}
          </p>
          <Link
            href="/games"
            className="bg-mali-blue-accent hover:bg-mali-blue-accent/90 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
          >
            <ChevronLeft size={18} className="mr-2" />
            กลับไปหน้าเกมทั้งหมด
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/games"
          className="text-mali-text-secondary hover:text-white transition-colors inline-flex items-center"
        >
          <ChevronLeft size={18} className="mr-1" />
          กลับไปหน้าเกม
        </Link>
      </div>

      {/* Game Hero */}
      <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden mb-8">
        <div className="relative h-80 md:h-96">
          {/* Main banner image */}
          <Image
            src={
              (game.screenshots && game.screenshots.length > 0
                ? game.screenshots[0]
                : game.mainImage) ||
              `https://placehold.co/800x400?text=${encodeURIComponent(game.title)}`
            }
            alt={game.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>

          {/* Game info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border-4 border-mali-blue/30">
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
                  <span className="bg-mali-blue/30 text-mali-blue-accent px-3 py-1 rounded-full">
                    {game.category}
                  </span>
                  <div className="flex items-center text-yellow-400">
                    <Star size={16} className="fill-yellow-400" />
                    <span className="ml-1">{game.rating}</span>
                    <span className="ml-1 text-mali-text-secondary">
                      ({game.ratingCount?.toLocaleString() || 0})
                    </span>
                  </div>
                  {game.releaseDate && (
                    <span className="text-mali-text-secondary flex items-center">
                      <Calendar size={14} className="mr-1" />
                      {new Date(game.releaseDate).getFullYear()}
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <span className="text-gray-400 mr-2">โดย</span>
                  <span className="text-white">
                    {game.developer || game.publisher}
                  </span>
                </div>
              </div>

              <div className="flex mt-4 md:mt-0 space-x-3">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  aria-label={isFavorite ? "ลบออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
                  className={`p-3 rounded-full border transition-all duration-200 ${
                    isFavorite
                      ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30"
                      : "bg-mali-blue/10 border-mali-blue/20 text-mali-text-secondary hover:text-white hover:bg-mali-blue/20"
                  }`}
                >
                  <Heart
                    size={20}
                    className={isFavorite ? "fill-white text-white" : ""}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  aria-label={copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                  className={`p-3 rounded-full border transition-all duration-200 ${
                    copied
                      ? "bg-mali-green border-mali-green text-white shadow-lg shadow-mali-green/30"
                      : "bg-mali-blue/10 border-mali-blue/20 text-mali-text-secondary hover:text-white hover:bg-mali-blue/20"
                  }`}
                >
                  {copied ? (
                    <Check size={20} aria-hidden="true" />
                  ) : (
                    <Share2 size={20} aria-hidden="true" />
                  )}
                </button>
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
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden shadow-sm">
            <div className="flex border-b border-mali-blue/20 overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setActiveTab("topup")}
                className={`py-4 px-6 text-sm font-medium flex items-center ${activeTab === "topup" ? "text-mali-blue-accent border-b-2 border-mali-blue-accent" : "text-mali-text-secondary hover:text-white"}`}
              >
                <DollarSign size={18} className="mr-2" />
                ตัวเลือกเติมเงิน
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`py-4 px-6 text-sm font-medium flex items-center ${activeTab === "info" ? "text-mali-blue-accent border-b-2 border-mali-blue-accent" : "text-mali-text-secondary hover:text-white"}`}
              >
                <Info size={18} className="mr-2" />
                ข้อมูลเกม
              </button>
            </div>

            <div className="p-6 md:p-8">
              {/* Top Up Options */}
              {activeTab === "topup" && (
                <div className="space-y-6">
                  <p className="text-mali-text-secondary">
                    เลือกจำนวนที่ต้องการเติม:
                  </p>

                  {game.topUpOptions.length === 0 ? (
                    <div className="text-center py-8 bg-mali-blue/5 border border-mali-blue/20 rounded-xl">
                      <AlertCircle
                        className="mx-auto text-mali-text-secondary mb-2"
                        size={32}
                      />
                      <p className="text-mali-text-secondary">
                        ไม่มีตัวเลือกการเติมเงิน
                      </p>
                      <p className="text-sm text-mali-text-secondary mt-1">
                        กรุณาลองใหม่อีกครั้งภายหลัง
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                      {game.topUpOptions.map((option: any) => (
                        <div
                          key={option.id}
                          onClick={() => setSelectedOption(option.id)}
                          className={`relative border p-4 rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg ${
                            selectedOption === option.id
                              ? "bg-mali-blue/20 border-mali-blue-accent shadow-md"
                              : "bg-mali-blue/5 border-mali-blue/20 hover:border-mali-blue/50"
                          }`}
                        >
                          {option.isPopular && (
                            <div className="absolute -top-3 left-0 right-0 flex justify-center">
                              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                                ยอดนิยม
                              </span>
                            </div>
                          )}

                          <h4 className="text-white font-bold text-center mb-1">
                            {option.title}
                          </h4>

                          {option.parValue && option.parValueCurrency && (
                            <p className="text-center text-mali-text-secondary text-sm mb-2">
                              {option.parValue} {option.parValueCurrency}
                            </p>
                          )}

                          <div className="text-center">
                            {option.originalPrice > option.price ? (
                              <>
                                <span className="line-through text-mali-text-secondary text-sm mr-1">
                                  ฿
                                  {Number(option.originalPrice || 0).toFixed(2)}
                                </span>
                                <span className="text-green-400 font-bold">
                                  ฿{Number(option.price || 0).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-white font-bold">
                                ฿{Number(option.price || 0).toFixed(2)}
                              </span>
                            )}
                          </div>

                          {selectedOption === option.id && (
                            <div className="absolute bottom-2 right-2 text-mali-blue-accent">
                              <Check size={16} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {game.topUpOptions.length > 0 && (
                    <div className="mt-6 bg-mali-blue/10 border border-mali-blue/20 rounded-lg p-4">
                      <div className="flex items-start">
                        <Gift
                          className="text-mali-blue-accent mr-3 mt-1 flex-shrink-0"
                          size={20}
                        />
                        <div>
                          <h4 className="text-white font-medium mb-1">
                            โบนัสการซื้อครั้งแรก!
                          </h4>
                          <p className="text-mali-text-secondary text-sm">
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
                    <h3 className="text-white font-medium mb-2">
                      เกี่ยวกับ {game.title}
                    </h3>
                    <ProductDescription description={game.longDescription || game.description} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <Package
                          className="mr-2 text-mali-blue-accent"
                          size={18}
                        />
                        ผู้พัฒนา
                      </h4>
                      <p className="text-mali-text-secondary">
                        {game.developer || "ไม่ระบุ"}
                      </p>
                    </div>

                    <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <Award
                          className="mr-2 text-mali-blue-accent"
                          size={18}
                        />
                        ผู้จัดจำหน่าย
                      </h4>
                      <p className="text-mali-text-secondary">
                        {game.publisher || "ไม่ระบุ"}
                      </p>
                    </div>

                    {game.releaseDate && (
                      <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-2 flex items-center">
                          <Calendar
                            className="mr-2 text-mali-blue-accent"
                            size={18}
                          />
                          วันวางจำหน่าย
                        </h4>
                        <p className="text-mali-text-secondary">
                          {new Date(game.releaseDate).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" },
                          )}
                        </p>
                      </div>
                    )}

                    <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <Smartphone
                          className="mr-2 text-mali-blue-accent"
                          size={18}
                        />
                        แพลตฟอร์ม
                      </h4>
                      <p className="text-mali-text-secondary">
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
            <h2 className="text-xl font-bold text-white mb-4">เกมที่เกี่ยวข้อง</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedGamesByDev.length > 0 ? (
                relatedGamesByDev.map((relatedGame) => (
                  <Link href={`/games/${relatedGame.slug}`} key={relatedGame.id}>
                    <motion.div
                      className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden group cursor-pointer"
                      whileHover={{
                        y: -5,
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <div className="relative aspect-square bg-mali-blue/10 overflow-hidden">
                        <img
                          src={relatedGame.imageUrl || `https://placehold.co/300x300?text=${encodeURIComponent(relatedGame.name)}`}
                          alt={relatedGame.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <h3 className="text-sm font-bold text-white line-clamp-1">
                            {relatedGame.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <Star size={12} className="text-yellow-400 fill-yellow-400" />
                            <span className="ml-1 text-xs text-yellow-400">
                              {relatedGame.averageRating?.toFixed(1) || "4.5"}
                            </span>
                            <span className="ml-2 text-xs bg-mali-blue/30 text-mali-blue-accent px-1.5 py-0.5 rounded">
                              {relatedGame.gameDetails?.developer || "เกม"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-mali-text-secondary">
                  ไม่พบเกมที่เกี่ยวข้อง
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Purchase section */}
        <div>
          <div className="bg-mali-card border border-mali-blue/20 rounded-xl p-6 sticky top-4">
            <h3 className="text-xl font-bold text-white mb-4">
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
                            <label className="block text-sm font-medium text-mali-text-secondary mb-2">
                              {field.label}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            {field.type === "select" ? (
                              <select
                                value={fieldValues[field.name] || ""}
                                onChange={(e) =>
                                  handleFieldChange(field.name, e.target.value)
                                }
                                className="w-full bg-mali-blue/5 border border-mali-blue/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mali-blue-accent transition-colors"
                              >
                                <option value="" className="bg-mali-card">
                                  เลือก{field.label}
                                </option>
                                {field.options?.map((opt) => (
                                  <option
                                    key={opt.value}
                                    value={opt.value}
                                    className="bg-mali-card"
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
                                  `กรอก${field.label}ของคุณ`
                                }
                                className="w-full bg-mali-blue/5 border border-mali-blue/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-mali-blue-accent transition-colors"
                              />
                            )}
                            {field.prefix && (
                              <span className="text-xs text-mali-text-secondary mt-1 block">
                                คำนำหน้า: {field.prefix}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-mali-text-secondary">
                        จำนวนที่เลือก:
                      </span>
                      <div className="text-right">
                        <span className="text-white font-bold block">
                          {option.title}
                        </span>
                        {option.parValue && option.parValueCurrency && (
                          <span className="text-mali-text-secondary text-sm">
                            {option.parValue} {option.parValueCurrency}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-4 border-y border-mali-blue/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-mali-text-secondary">ราคา:</span>
                        {option.originalPrice > option.price ? (
                          <div>
                            <span className="line-through text-mali-text-secondary text-sm mr-2">
                              ฿{Number(option.originalPrice || 0).toFixed(2)}
                            </span>
                            <span className="text-white font-bold">
                              ฿{Number(option.price || 0).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white font-bold">
                            ฿{Number(option.price || 0).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {option.originalPrice > option.price && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-mali-text-secondary">
                            ประหยัด:
                          </span>
                          <span className="text-green-400 font-bold">
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
                      <button
                        type="button"
                        className="w-full bg-mali-blue hover:bg-mali-blue/90 text-white py-3 rounded-lg font-medium flex items-center justify-center"
                      >
                        <ShoppingCart size={18} className="mr-2" aria-hidden="true" />
                        ซื้อเลย
                      </button>
                    </div>

                    <div className="bg-mali-blue/10 rounded-lg p-3 text-sm">
                      <div className="flex">
                        <Clock
                          size={16}
                          className="text-mali-text-secondary mr-2 mt-0.5 flex-shrink-0"
                        />
                        <span className="text-mali-text-secondary">
                          จัดส่งอัตโนมัติภายใน 5 นาทีหลังชำระเงิน
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
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-4">เกมที่คล้ายกัน</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {similarGames.length > 0 ? (
            similarGames.map((similarGame) => (
              <Link href={`/games/${similarGame.slug}`} key={similarGame.id}>
                <motion.div
                  className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden group cursor-pointer"
                  whileHover={{
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div className="aspect-square relative bg-mali-blue/10 overflow-hidden">
                    <img
                      src={similarGame.imageUrl || `https://placehold.co/300x300?text=${encodeURIComponent(similarGame.name)}`}
                      alt={similarGame.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-xs bg-mali-blue/50 text-white px-2 py-0.5 rounded">
                        {similarGame.category?.name || "เกม"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-white text-sm mb-1 truncate">
                      {similarGame.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <span className="text-mali-text-secondary text-xs ml-1">
                          {similarGame.averageRating?.toFixed(1) || "4.5"}
                        </span>
                      </div>
                      <span className="text-xs text-mali-green font-medium">
                        ฿{similarGame.price.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-mali-text-secondary">
              ไม่พบเกมที่คล้ายกัน
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
