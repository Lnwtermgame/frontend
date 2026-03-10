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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("ProductDetail");
  const tCommon = useTranslations("Common");
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
  const [verificationStatus, setVerificationStatus] = useState<{
    supported: boolean;
    productName: string;
    optionName: string;
    playerInfo: Record<string, string>;
    price?: number;
  } | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [mobilePhoneNumber, setMobilePhoneNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [similarGames, setSimilarGames] = useState<Product[]>([]);
  const [relatedGamesByDev, setRelatedGamesByDev] = useState<Product[]>([]);
  const [isBuying, setIsBuying] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Field label translation map
  const FIELD_LABEL_MAP: Record<string, string> = {
    "Player ID": "Player ID",
    "User ID": "User ID",
    "Server ID": "Server ID",
    "Zone ID": "Zone ID",
    "Role Name": "Role Name",
    "Character Name": "Character Name",
    "Character ID": "Character ID",
    Region: "Region",
    Email: "Email",
    Phone: "Phone",
    "Riot ID": "Riot ID",
    Tag: "Tag",
  };

  const translateLabel = (label: string) => {
    return FIELD_LABEL_MAP[label] || label;
  };

  const backHref = isCardRoute
    ? "/card"
    : isMobileRechargeRoute
      ? "/mobile-recharge"
      : "/games";
  const backLabel = t("back");
  const optionsTabLabel = t("topup_options");
  const infoTabLabel = t("game_info");
  const purchaseTitle = t("purchase_summary");

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

  // TrueWallet minimum amount constraint ( FeelFreePay requirement )
  const TRUEMONEY_MIN_AMOUNT = 20;

  // Check if a payment method is available for the current amount
  const isPaymentMethodAvailable = (method: string, totalAmount: number) => {
    if (method === "TRUEMONEY" && totalAmount < TRUEMONEY_MIN_AMOUNT) {
      return false;
    }
    return true;
  };

  // Get unavailable reason for display
  const getPaymentMethodUnavailableReason = (method: string, totalAmount: number) => {
    if (method === "TRUEMONEY" && totalAmount < TRUEMONEY_MIN_AMOUNT) {
      return t("error.truemoney_minimum", { amount: TRUEMONEY_MIN_AMOUNT });
    }
    return null;
  };

  const copyText = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error(t("copy_link_failed"));
    }
  };

  // Fetch payment methods (PromptPay default)
  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      setPaymentOptions([]);
      setSelectedPaymentOption(null);
      return;
    }

    const loadMethods = async () => {
      try {
        const res = await paymentApi.getMethods();
        if (res.success) {
          setPaymentOptions(res.data);
          setSelectedPaymentOption((prev) => {
            if (prev || res.data.length === 0) return prev;
            const defaultPromptpay =
              res.data.find((m) => m.method === "PROMPTPAY") || res.data[0];
            return defaultPromptpay.code;
          });
        }
      } catch (err) {
        console.error("Load payment methods failed", err);
      }
    };

    loadMethods();
  }, [isInitialized, isAuthenticated]);

  // Reset selected payment option if it becomes unavailable (e.g., TrueWallet below minimum)
  useEffect(() => {
    if (!selectedPaymentOption || paymentOptions.length === 0) return;

    const selectedOpt = paymentOptions.find((o) => o.code === selectedPaymentOption);
    if (!selectedOpt) return;

    const totalAmount = priceSummary.total;
    if (!isPaymentMethodAvailable(selectedOpt.method, totalAmount)) {
      // Find an available alternative (prefer PromptPay)
      const alternative = paymentOptions.find(
        (o) => isPaymentMethodAvailable(o.method, totalAmount)
      );
      if (alternative) {
        setSelectedPaymentOption(alternative.code);
        toast.info(
          t("error.truemoney_minimum", { amount: TRUEMONEY_MIN_AMOUNT })
        );
      } else {
        setSelectedPaymentOption(null);
      }
    }
  }, [priceSummary.total, selectedPaymentOption, paymentOptions]);

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
      toast.error(t("error.select_option"));
      return;
    }

    // Check if user is logged in before allowing purchase
    if (!isAuthenticated) {
      toast.error(t("error.login_required"), { duration: 3000 });
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check if selected payment method is available for the current amount
    if (selectedPaymentOption) {
      const selectedOpt = paymentOptions.find((o) => o.code === selectedPaymentOption);
      if (selectedOpt && !isPaymentMethodAvailable(selectedOpt.method, priceSummary.total)) {
        const reason = getPaymentMethodUnavailableReason(selectedOpt.method, priceSummary.total);
        toast.error(reason || t("error.payment_method_unavailable"));
        return;
      }
    }

    // Check if all required fields are filled
    const selectedProductType = productTypes.find(
      (pt) => pt.id === selectedOption,
    );

    if (isMobileRechargeRoute) {
      const normalizedPhone = getNormalizedMobilePhone();

      if (!normalizedPhone) {
        toast.error(t("error.enter_phone"));
        return;
      }

      if (normalizedPhone.length < 9) {
        toast.error(t("error.invalid_phone"));
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
          t("error.fill_all_fields", {
            fields: missingFields
              .map((f) => translateLabel(f.label))
              .join(", "),
          }),
        );
        return;
      }
    }

    setShowConfirmModal(true);
    setTermsAccepted(false); // Reset acceptance state when opening
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
      // Use createIntent for all payment types (QR, LinePay, TrueMoney)
      const res = await paymentApi.createIntent(orderId, paymentOptionCode);
      if (!res.success) {
        toast.error(t("error.payment_failed"));
        return false;
      }

      const { qrCodeUrl, paymentFormHtml, redirectUrl, referenceNo } = res.data;

      // Handle redirect payments (LinePay, TrueMoney)
      // Backend returns HTML form that auto-submits to payment page
      // Handle redirect payments (LinePay, TrueMoney)
      // Backend returns HTML form that auto-submits to payment page
      if (paymentFormHtml) {
        // Perform direct redirect of the main window
        const container = document.createElement("div");
        container.innerHTML = paymentFormHtml;
        document.body.appendChild(container);
        const form = container.querySelector("form");
        if (form) {
          form.submit();
        }
        return true;
      }

      // Handle direct redirect URL
      if (redirectUrl) {
        window.open(redirectUrl, "_blank");
        return true;
      }

      // Handle QR URL directly inline without popup
      if (qrCodeUrl) {
        // Store QR data in sessionStorage (too large for URL params - causes HTTP 431)
        sessionStorage.setItem(`qr_${orderId}`, qrCodeUrl);
        router.push(
          `/payments/pending?orderId=${orderId}&referenceNo=${referenceNo}`,
        );
        return true;
      }

      toast.error(t("error.no_payment_link"));
      return false;
    } catch (err) {
      console.error("Payment flow error", err);
      toast.error(t("error.payment_error"));
      return false;
    }
  };

  // Create order after confirmation
  const createOrder = async () => {
    if (!product || !selectedOption) return;

    try {
      setIsBuying(true);
      toast.loading(tCommon("loading"));

      const playerInfo = buildPlayerInfo();
      const paymentOptionCode = selectedPaymentOption || undefined;

      // Map the selected option code to its base payment method category
      const selectedOptionObj = paymentOptions.find(
        (opt) => opt.code === selectedPaymentOption
      );
      const paymentMethod = selectedOptionObj ? selectedOptionObj.method : "PROMPTPAY";

      const response = await orderApi.createOrder({
        items: [
          {
            productId: product.id,
            productTypeId: selectedOption,
            quantity: 1,
            playerInfo,
          },
        ],
        paymentMethod,
        paymentOptionCode,
      });

      toast.dismiss();

      if (response.success) {
        toast.success(t("error.order_success_redirect"));
        setShowConfirmModal(false);
        setIsPaymentSelectOpen(false);
        await startPaymentFlow(response.data.id, paymentOptionCode);
      } else {
        toast.error(response.message || tCommon("error_occurred"));
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
          t("error.player_id_invalid", {
            defaultMessage:
              "User ID or Zone ID is invalid. Please check your game account.",
          }),
          { duration: 5000 },
        );
      } else if (
        errorCode === 20114 ||
        /phone number.*region.*match/i.test(errorMessage)
      ) {
        toast.error(
          t("error.phone_region_mismatch", {
            defaultMessage:
              "Phone number does not match the selected region. Please check your number or selection.",
          }),
          { duration: 5000 },
        );
      } else {
        toast.error(errorMessage || tCommon("error_occurred"), {
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
      toast.success(t("copy_link_success"));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t("copy_link_failed"));
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
      toast.error(t("error.login_required"), { duration: 3000 });
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
          const favId = await productApi.findFavoriteId(product.id);
          setFavoriteId(favId);
        } catch (addErr: any) {
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

  const isValidDatabaseId = (id: string): boolean => {
    const cuidPattern = /^c[a-z0-9]{24,}$/i;
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return cuidPattern.test(id) || uuidPattern.test(id);
  };

  // Load game details
  useEffect(() => {
    if (typeof productSlug !== "string") return;

    const fetchGameDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        let productResponse;
        if (isValidDatabaseId(productSlug)) {
          productResponse = await productApi.getProductById(productSlug);
        } else {
          productResponse = await productApi.getProductBySlug(productSlug);
        }

        if (!productResponse.success || !productResponse.data) {
          throw new Error("Product not found");
        }

        const productData = productResponse.data;
        const productTypeNormalized =
          (productData.productType as string | undefined) || "DIRECT_TOPUP";
        setProduct(productData);

        let typesData: ProductType[] = [];
        if (productData.types && productData.types.length > 0) {
          typesData = productData.types;
        }

        setProductTypes(typesData);
        const gameData = transformProductToGameDetails(productData, typesData);
        setGame(gameData);

        if (gameData.topUpOptions.length > 0) {
          const popularOption = gameData.topUpOptions.find(
            (option) => option.isPopular,
          );
          setSelectedOption(
            popularOption ? popularOption.id : gameData.topUpOptions[0].id,
          );
        }

        try {
          const allGamesResponse = await productApi.getProducts({
            isActive: true,
            limit: 50,
          });

          if (allGamesResponse.success) {
            const otherGames = allGamesResponse.data.filter((p) => {
              const pType =
                (p.productType as string | undefined) || "DIRECT_TOPUP";
              return p.id !== productData.id && pType === productTypeNormalized;
            });
            setSimilarGames(otherGames.slice(0, 5));

            const currentGameDetails = productData.gameDetails;
            const currentDev = currentGameDetails?.developer;
            const currentPub = currentGameDetails?.publisher;

            if (currentDev || currentPub) {
              const related = allGamesResponse.data.filter((p) => {
                if (p.id === productData.id) return false;
                const pDetails = p.gameDetails;
                return (
                  (currentDev && pDetails?.developer === currentDev) ||
                  (currentPub && pDetails?.publisher === currentPub)
                );
              });
              setRelatedGamesByDev(related.slice(0, 4));
            }
          }
        } catch {
          // Ignore recommendations errors
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
          if (!cancelled) setFavoriteId(favId);
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
      <div className="page-container flex items-center justify-center h-96 bg-transparent">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-bold">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="page-container bg-transparent">
        <div
          className="bg-white border-[3px] border-black p-8 text-center"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <AlertCircle size={48} className="mx-auto text-brutal-pink mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2 uppercase">
            {t("error.not_found")}
          </h2>
          <p className="text-gray-600 mb-6 font-bold">
            {error || t("error.not_found_desc")}
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
    <div className="page-container bg-transparent">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={backHref}
          className="text-gray-600 hover:text-black transition-colors inline-flex items-center font-bold"
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
                <h1 className="text-xl md:text-4xl font-black text-white leading-tight drop-shadow-md">
                  {game.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-brutal-yellow text-black px-2 py-0.5 md:px-3 md:py-1 font-black border-[2px] border-black text-xs md:text-sm inline-flex items-center gap-1 shadow-[2px_2px_0_0_#000] uppercase">
                    {getCountryFlagCode(game.category) && (
                      <CountryFlag
                        code={getCountryFlagCode(game.category)}
                        size="S"
                      />
                    )}
                    {game.category}
                  </span>
                </div>

                <p className="text-gray-300 text-sm md:text-base font-black drop-shadow-sm">
                  {t("by_developer", {
                    developer: game.publisher || game.developer || t("unknown"),
                  })}
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
        <div className="lg:col-span-2 space-y-8">
          <div
            className="bg-white border-[3px] border-black overflow-hidden"
            style={{ boxShadow: "4px 4px 0 0 #000000" }}
          >
            <div className="flex border-b-[3px] border-black overflow-x-auto hide-scrollbar">
              <button
                onClick={() => setActiveTab("topup")}
                className={`hidden md:flex py-4 px-6 text-sm font-black items-center whitespace-nowrap flex-shrink-0 uppercase ${activeTab === "topup" ? "text-black bg-brutal-yellow border-r-[3px] border-black" : "text-gray-600 hover:text-black hover:bg-gray-100"}`}
              >
                <DollarSign size={18} className="mr-2" />
                {optionsTabLabel}
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`hidden md:flex py-4 px-6 text-sm font-black items-center whitespace-nowrap flex-shrink-0 uppercase ${activeTab === "info" ? "text-black bg-brutal-yellow border-l-[3px] border-r-[3px] border-black" : "text-gray-600 hover:text-black hover:bg-gray-100"}`}
              >
                <Info size={18} className="mr-2" />
                {infoTabLabel}
              </button>

              <div className="md:hidden py-4 px-6 text-sm font-black flex items-center w-full bg-brutal-yellow text-black uppercase">
                <Info size={18} className="mr-2" />
                {infoTabLabel}
              </div>
            </div>

            <div className="p-4 md:p-8">
              <div
                className={activeTab === "topup" ? "hidden md:block" : "hidden"}
              >
                <div className="space-y-6">
                  <div className="hidden md:flex items-center justify-between">
                    <p className="text-gray-600 font-black">
                      {t("select_package")}
                    </p>
                  </div>

                  {game.topUpOptions.length === 0 ? (
                    <div className="text-center py-8 bg-brutal-gray border-[3px] border-black">
                      <AlertCircle
                        className="mx-auto text-gray-500 mb-2"
                        size={32}
                      />
                      <p className="text-gray-600 font-bold">
                        {t("no_options")}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 font-bold">
                        {t("no_options_desc")}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="hidden md:block">
                        <Grid cols={2} md={3} gap={3} className="md:gap-4">
                          {game.topUpOptions.map((option: any) => (
                            <motion.div
                              key={option.id}
                              onClick={() => setSelectedOption(option.id)}
                              className={`relative border-[3px] p-2.5 md:p-4 cursor-pointer transition-all flex flex-col justify-center items-center gap-2 min-h-[100px] md:min-h-[120px] ${selectedOption === option.id
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
                                  <span className="bg-brutal-pink text-black text-[9px] md:text-[10px] font-black px-1.5 md:px-2 py-0.5 border-[2px] border-black uppercase tracking-wider shadow-[2px_2px_0_0_#000] whitespace-nowrap">
                                    {t("popular_badge")}
                                  </span>
                                </div>
                              )}

                              <h4 className="text-black font-black text-center text-[13px] md:text-base leading-tight line-clamp-2">
                                {option.title}
                              </h4>

                              <div className="text-center">
                                {option.originalPrice > option.price ? (
                                  <div className="flex flex-col items-center">
                                    <span className="line-through text-gray-500 text-[10px] md:text-xs font-bold">
                                      ฿
                                      {Number(
                                        option.originalPrice || 0,
                                      ).toFixed(2)}
                                    </span>
                                    <span className="text-black font-black text-sm md:text-base">
                                      ฿{Number(option.price || 0).toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-black font-black text-sm md:text-base">
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

                      <Sheet
                        isOpen={isOptionsModalOpen}
                        onClose={() => setIsOptionsModalOpen(false)}
                        title={t("select_package")}
                      >
                        <div className="grid grid-cols-2 gap-3 pb-8">
                          {game.topUpOptions.map((option: any) => (
                            <motion.div
                              key={option.id}
                              onClick={() => {
                                setSelectedOption(option.id);
                                setIsOptionsModalOpen(false);
                              }}
                              className={`relative border-[3px] p-3 cursor-pointer transition-all flex flex-col justify-center items-center gap-2 min-h-[110px] ${selectedOption === option.id
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
                                  <span className="bg-brutal-pink text-black text-[9px] font-black px-1.5 py-0.5 border-[2px] border-black uppercase tracking-wider shadow-[2px_2px_0_0_#000] whitespace-nowrap">
                                    {t("popular_badge")}
                                  </span>
                                </div>
                              )}

                              <h4 className="text-black font-black text-center text-[13px] leading-tight line-clamp-2">
                                {option.title}
                              </h4>

                              <div className="text-center">
                                {option.originalPrice > option.price ? (
                                  <div className="flex flex-col items-center">
                                    <span className="line-through text-gray-500 text-[10px] font-bold">
                                      ฿
                                      {Number(
                                        option.originalPrice || 0,
                                      ).toFixed(2)}
                                    </span>
                                    <span className="text-black font-black text-sm">
                                      ฿{Number(option.price || 0).toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-black font-black text-sm">
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
                </div>
              </div>

              <div
                className={activeTab === "info" ? "block" : "block md:hidden"}
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-black mb-2 md:mb-3 flex items-start md:items-center gap-2 leading-tight uppercase">
                      <span className="w-1.5 h-5 bg-brutal-pink flex-shrink-0 mt-1 md:mt-0"></span>
                      <span>{t("about_product", { name: game.title })}</span>
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
                      <h4 className="text-black font-black mb-2 flex items-center text-sm uppercase">
                        <Package className="mr-2 text-black" size={18} />
                        {t("developer")}
                      </h4>
                      <p className="text-gray-700 font-bold">
                        {game.developer || t("unknown")}
                      </p>
                    </div>

                    <div
                      className="bg-brutal-gray border-[3px] border-black p-3 md:p-4"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                      <h4 className="text-black font-black mb-2 flex items-center text-sm uppercase">
                        <Award className="mr-2 text-black" size={18} />
                        {t("publisher")}
                      </h4>
                      <p className="text-gray-700 font-bold">
                        {game.publisher || t("unknown")}
                      </p>
                    </div>

                    {game.releaseDate && (
                      <div
                        className="bg-brutal-gray border-[3px] border-black p-3 md:p-4"
                        style={{ boxShadow: "2px 2px 0 0 #000000" }}
                      >
                        <h4 className="text-black font-black mb-2 flex items-center text-sm uppercase">
                          <Calendar className="mr-2 text-black" size={18} />
                          {t("release_date")}
                        </h4>
                        <p className="text-gray-700 font-bold">
                          {new Date(game.releaseDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div
                      className="bg-brutal-gray border-[3px] border-black p-3 md:p-4"
                      style={{ boxShadow: "2px 2px 0 0 #000000" }}
                    >
                      <h4 className="text-black font-black mb-2 flex items-center text-sm uppercase">
                        <Smartphone className="mr-2 text-black" size={18} />
                        {t("platforms")}
                      </h4>
                      <p className="text-gray-700 font-bold">
                        {game.platforms.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {relatedGamesByDev.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-black text-black mb-4 flex items-center uppercase">
                <span className="w-1.5 h-5 bg-brutal-blue mr-2"></span>
                {t("related_products")}
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
                          <h3 className="text-sm font-black text-white line-clamp-1 drop-shadow-sm">
                            {relatedGame.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <span className="text-[10px] bg-brutal-blue text-black px-1.5 py-0.5 border border-black font-black uppercase">
                              {relatedGame.gameDetails?.developer || "GAME"}
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

        {/* Right column */}
        <div className="order-first lg:order-last">
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
                    <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">
                      {t("selected_package_label")}
                    </span>
                    <h4 className="text-black font-black text-base leading-tight">
                      {selected?.title || t("select_package")}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    {selected && (
                      <span className="text-black font-black text-lg">
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
            <h3 className="text-lg md:text-xl font-black text-black mb-4 flex items-center uppercase">
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
                    {!isAuthenticated && (
                      <div className="bg-gray-100 border-[2px] border-gray-300 p-3 text-sm flex items-center gap-2">
                        <AlertTriangle
                          size={16}
                          className="text-yellow-500 flex-shrink-0"
                        />
                        <span className="text-gray-500 font-bold">
                          {t("login_required_notice")}
                        </span>
                      </div>
                    )}

                    {isMobileRechargeRoute &&
                      !(option.fields || []).some((field) =>
                        /phone|user id/i.test(`${field.name} ${field.label}`),
                      ) && (
                        <Input
                          label={t("mobile_number_label")}
                          type="tel"
                          value={mobilePhoneNumber}
                          onChange={(e) => setMobilePhoneNumber(e.target.value)}
                          placeholder={t("mobile_number_placeholder")}
                          disabled={!isAuthenticated}
                        />
                      )}

                    {option.fields && option.fields.length > 0 && (
                      <div className="space-y-4">
                        {option.fields.map((field) => (
                          <div key={field.name}>
                            {field.type === "select" ? (
                              <Select
                                label={
                                  <span className="font-bold">
                                    {translateLabel(field.label)}{" "}
                                    {field.required && (
                                      <span className="text-red-500">*</span>
                                    )}
                                  </span>
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
                                placeholder={`Choose ${translateLabel(field.label)}`}
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
                                  `Enter your ${translateLabel(field.label)}`
                                }
                                disabled={!isAuthenticated}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-start gap-4">
                      <span className="text-gray-600 flex-shrink-0 pt-0.5 font-bold">
                        {t("selected_package_label")}
                      </span>
                      <div className="text-right min-w-0">
                        <span className="text-black font-black block leading-tight break-words">
                          {option.title}
                        </span>
                      </div>
                    </div>

                    <div className="py-4 border-y-[3px] border-black">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-bold">
                          {t("price_label")}
                        </span>
                        {option.originalPrice > option.price ? (
                          <div>
                            <span className="line-through text-gray-500 text-sm mr-2 font-bold">
                              ฿{Number(option.originalPrice || 0).toFixed(2)}
                            </span>
                            <span className="text-black font-black text-xl">
                              ฿{Number(option.price || 0).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-black font-black text-xl">
                            ฿{Number(option.price || 0).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {option.originalPrice > option.price && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600 font-bold">
                            {t("savings_label")}
                          </span>
                          <span className="text-brutal-green font-black">
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
                        className="bg-black text-white hover:bg-gray-800 font-black h-12"
                      >
                        {!isBuying && (
                          <>
                            <ShoppingCart
                              size={18}
                              className="mr-2"
                              aria-hidden="true"
                            />
                            {isAuthenticated
                              ? t("buy_now_button")
                              : t("login_to_buy_button")}
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="bg-brutal-gray border-[3px] border-black p-3 text-sm">
                      <div className="flex items-center">
                        <Clock
                          size={16}
                          className="text-gray-600 mr-2 flex-shrink-0"
                        />
                        <span className="text-gray-600 font-bold">
                          {t("auto_delivery_hint")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>

      {/* Similar products */}
      <section className="mt-16 mb-10">
        <h2 className="text-xl font-black text-black mb-4 flex items-center uppercase">
          <span className="w-1.5 h-5 bg-brutal-green mr-2"></span>
          {t("similar_products")}
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
                      <h3 className="text-sm font-black text-white line-clamp-1 drop-shadow-sm">
                        {similarGame.name}
                      </h3>
                      <div className="flex items-center mt-1">
                        <span className="text-[10px] bg-brutal-blue text-black px-1.5 py-0.5 border border-black font-black uppercase">
                          {similarGame.gameDetails?.developer ||
                            similarGame.category?.name ||
                            "GAME"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-600 font-bold">
              {t("no_similar_found")}
            </div>
          )}
        </div>
      </section>

      {/* Confirmation Modal */}
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
              <div
                className={`border-b-[3px] border-black p-3 sm:p-4 flex items-center justify-between flex-shrink-0 ${!verificationStatus.supported ? "bg-brutal-pink" : "bg-brutal-yellow"}`}
              >
                <div className="flex items-center gap-2">
                  {!verificationStatus.supported ? (
                    <ShieldAlert size={22} className="text-black" />
                  ) : (
                    <Check size={22} className="text-black" />
                  )}
                  <h2 className="text-base sm:text-lg font-black text-black uppercase">
                    {!verificationStatus.supported
                      ? t("unverified_account_warning")
                      : t("confirm_order_title")}
                  </h2>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1.5 hover:bg-black/10 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {!verificationStatus.supported && (
                  <div className="bg-red-50 border-b-[2px] border-red-200 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle
                        size={18}
                        className="text-red-600 mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="font-black text-red-700 text-sm">
                          {t("unverified_account_warning")}
                        </p>
                        <p className="text-xs text-red-600 mt-0.5 font-bold">
                          {t("verify_info_hint")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  <div className="p-4 sm:p-5 space-y-4 border-b-[2px] lg:border-b-0 lg:border-r-[2px] border-black/10">
                    <div className="bg-brutal-gray border-[2px] border-black p-3 sm:p-4 shadow-[3px_3px_0_0_#000]">
                      <h3 className="font-black text-black text-sm mb-3 flex items-center gap-1.5 uppercase">
                        <Package size={16} />
                        {t("product_details_title")}
                      </h3>
                      <div className="space-y-2 text-sm font-bold">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Product:</span>
                          <span className="text-black text-right max-w-[60%]">
                            {verificationStatus.productName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Package:</span>
                          <span className="text-black">
                            {verificationStatus.optionName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {Object.keys(verificationStatus.playerInfo).length > 0 && (
                      <div className="bg-white border-[2px] border-black p-3 sm:p-4 shadow-[3px_3px_0_0_#000]">
                        <h3 className="font-black text-black text-sm mb-2 flex items-center gap-1.5 uppercase">
                          <User size={16} />
                          {t("account_info_title")}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(verificationStatus.playerInfo).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="bg-brutal-gray p-2 border border-black/20"
                              >
                                <span className="text-[10px] text-gray-500 block uppercase font-black">
                                  {key}
                                </span>
                                <span className="font-mono font-black text-black text-sm truncate block">
                                  {value}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-red-50 border-l-4 border-red-500 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          size={16}
                          className="text-red-600 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <p className="font-black text-red-700 text-xs">
                            {t("no_refund_warning_title")}
                          </p>
                          <p className="text-xs text-red-600 mt-0.5 leading-relaxed font-bold">
                            {t("no_refund_warning_desc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 font-black uppercase">
                        {t("payment_method_label")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-black text-sm">
                          {priceSummary.label || "Select Method"}
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setIsPaymentSelectOpen(true)}
                          className="text-[10px] py-1 px-2 h-auto font-black uppercase border-black"
                        >
                          {t("change_button")}
                        </Button>
                      </div>
                    </div>

                    <div className="bg-white border-[2px] border-black p-4 shadow-[3px_3px_0_0_#000]">
                      <div className="space-y-2 text-sm font-bold">
                        <div className="flex justify-between text-gray-600">
                          <span>{t("subtotal_label")}</span>
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
                          <span>{t("fee_label")}</span>
                          <span>
                            ฿{Number(priceSummary.fee || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t-2 border-black pt-2 mt-2">
                          <div className="flex justify-between items-baseline">
                            <span className="font-black text-black">
                              {t("total_label")}
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

                    <div className="bg-sky-50 border border-sky-200 p-2.5 text-[10px] text-sky-700 flex items-start gap-2 font-bold uppercase">
                      <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{t("secure_payment_notice")}</span>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="mb-4">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-black flex-shrink-0 cursor-pointer"
                          />
                          <span className="text-[10px] text-gray-600 leading-tight font-bold">
                            {t("terms_agreement_prefix")}{" "}
                            <Link
                              href="/terms"
                              target="_blank"
                              className="text-brutal-pink hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t("terms_label")}
                            </Link>
                            ,{" "}
                            <Link
                              href="/privacy"
                              target="_blank"
                              className="text-brutal-pink hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t("privacy_label")}
                            </Link>{" "}
                            and{" "}
                            <Link
                              href="/refund-policy"
                              target="_blank"
                              className="text-brutal-pink hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t("refund_label")}
                            </Link>
                          </span>
                        </label>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={createOrder}
                          disabled={isBuying || !termsAccepted}
                          isLoading={isBuying}
                          className="flex-1 bg-black text-white hover:bg-gray-800 h-12 sm:h-14 text-base sm:text-lg font-black shadow-[3px_3px_0_0_#000] border-[2px] border-black disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                        >
                          {!isBuying && <Check size={20} className="mr-2" />}
                          {t("confirm_button")}
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() => setShowConfirmModal(false)}
                          disabled={isBuying}
                          className="sm:w-auto w-full h-12 sm:h-14 px-6 sm:px-8 font-black border-[2px] border-black shadow-[3px_3px_0_0_#000] uppercase"
                        >
                          {t("cancel_button")}
                        </Button>
                      </div>

                      <p className="text-center text-[10px] text-gray-400 mt-3 font-bold uppercase">
                        {t("confirm_hint")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-white w-full max-w-5xl border-[3px] border-black shadow-[8px_8px_0_0_#000] p-4 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start gap-3 mb-5">
                <div>
                  <h3 className="text-2xl font-black text-black uppercase">
                    {t("payment_selection_title")}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 font-bold">
                    {t("payment_selection_desc")}
                  </p>
                </div>
                <button
                  onClick={() => setIsPaymentSelectOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[58vh] overflow-y-auto pr-1">
                  {paymentOptions.map((opt: PaymentMethodOption) => {
                    const isActive = selectedPaymentOption === opt.code;
                    const totalAmount = priceSummary.total;
                    const isAvailable = isPaymentMethodAvailable(opt.method, totalAmount);
                    const unavailableReason = getPaymentMethodUnavailableReason(opt.method, totalAmount);

                    return (
                      <label
                        key={opt.code}
                        className={`border-[2px] border-black p-4 flex flex-col gap-3 transition-all ${
                          isActive ? "bg-brutal-yellow" : "bg-white"
                        } ${
                          !isAvailable
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        style={{ boxShadow: "2px 2px 0 0 #000" }}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedPaymentOption(opt.code);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <input
                              type="radio"
                              name="paymentOptionModal"
                              value={opt.code}
                              checked={isActive}
                              onChange={() =>
                                isAvailable && setSelectedPaymentOption(opt.code)
                              }
                              disabled={!isAvailable}
                              className="mt-1 accent-black disabled:cursor-not-allowed"
                            />
                            <div>
                              <div className="text-black font-black text-base flex items-center gap-2">
                                {opt.label}
                                {!isAvailable && (
                                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                    Min {TRUEMONEY_MIN_AMOUNT}฿
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-600 mt-1 font-bold">
                                Gateway: {opt.gateway.name}
                              </div>
                              {unavailableReason && (
                                <div className="text-[10px] text-red-600 mt-1 font-bold">
                                  {unavailableReason}
                                </div>
                              )}
                            </div>
                          </div>
                          {isActive && isAvailable && (
                            <Check size={16} className="text-black" />
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] uppercase border border-black px-2 py-0.5 bg-white text-gray-700 font-black ${!isAvailable ? "opacity-50" : ""}`}>
                            {opt.method}
                          </span>
                        </div>

                        <div className="border-t border-black/20 pt-2 text-[10px] text-gray-700 space-y-1 font-bold">
                          <div className="flex justify-between">
                            <span>FEE %</span>
                            <span>
                              {Number(opt.surchargePercent || 0).toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>FLAT FEE</span>
                            <span>{formatTHB(Number(opt.flatFee || 0))}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="border-[2px] border-black p-4 bg-gray-50 h-fit space-y-4">
                  <h4 className="text-lg font-black text-black uppercase">
                    {t("transaction_summary_title")}
                  </h4>

                  <div className="space-y-2 text-sm font-bold">
                    <div className="flex justify-between text-gray-700">
                      <span>Product:</span>
                      <span className="text-black max-w-[55%] text-right truncate">
                        {game?.title || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Package:</span>
                      <span className="text-black max-w-[55%] text-right truncate">
                        {selectedTopUp?.title || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal:</span>
                      <span>{formatTHB(Number(priceSummary.base || 0))}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Fee:</span>
                      <span>{formatTHB(Number(priceSummary.fee || 0))}</span>
                    </div>
                  </div>

                  <div className="border-t-2 border-black pt-3 flex justify-between items-end font-bold">
                    <span className="text-sm text-gray-600 uppercase">
                      {t("total_label")}
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
                      className="font-black uppercase"
                    >
                      {t("confirm_selection_button")}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setIsPaymentSelectOpen(false)}
                      fullWidth
                      className="font-black uppercase border-black"
                    >
                      {t("close_window_button")}
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
