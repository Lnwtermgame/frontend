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
  Flame,
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
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";

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
        toast(
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
        // Safely parse payment form HTML — avoid raw innerHTML XSS
        const parser = new DOMParser();
        const doc = parser.parseFromString(paymentFormHtml, "text/html");
        const parsedForm = doc.querySelector("form");
        if (!parsedForm) {
          toast.error(t("error.payment_failed"));
          return false;
        }

        // Reconstruct form with only safe attributes (action, method, hidden inputs)
        const form = document.createElement("form");
        form.method = parsedForm.getAttribute("method") || "POST";
        form.action = parsedForm.getAttribute("action") || "";
        parsedForm.querySelectorAll('input[type="hidden"]').forEach((input) => {
          const safeInput = document.createElement("input");
          safeInput.type = "hidden";
          safeInput.name = input.getAttribute("name") || "";
          safeInput.value = input.getAttribute("value") || "";
          form.appendChild(safeInput);
        });
        document.body.appendChild(form);
        form.submit();
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

  // Client-side document title + meta description for SEO
  // IMPORTANT: This hook must be BEFORE any early returns to satisfy Rules of Hooks
  useEffect(() => {
    if (!game) return;
    const metaTitle = game.metaTitle || game.title;
    document.title = `${metaTitle} | Lnwtermgame`;

    const metaDesc =
      game.metaDescription || game.shortDescription || game.description;
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement("meta");
      descTag.setAttribute("name", "description");
      document.head.appendChild(descTag);
    }
    descTag.setAttribute("content", metaDesc);
  }, [game]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center h-96 bg-transparent">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-site-border border-t-site-accent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400 font-medium">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="page-container bg-transparent">
        <div className="bg-[#222427]/80 backdrop-blur-md border border-site-border p-8 text-center rounded-2xl shadow-ocean">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {t("error.not_found")}
          </h2>
          <p className="text-gray-400 mb-6">
            {error || t("error.not_found_desc")}
          </p>
          <Link href={backHref}>
            <Button variant="outline" className="text-white border-site-border hover:bg-site-border">
              <ChevronLeft size={18} className="mr-2" />
              {backLabel}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Compute price range for JSON-LD
  const priceLow = game?.topUpOptions?.length
    ? Math.min(...game.topUpOptions.map((o) => o.price))
    : undefined;
  const priceHigh = game?.topUpOptions?.length
    ? Math.max(...game.topUpOptions.map((o) => o.price))
    : undefined;

  return (
    <div className="page-container bg-transparent">
      {/* Product JSON-LD for SEO */}
      {game && product && (
        <ProductJsonLd
          name={game.title}
          description={game.metaDescription || game.shortDescription || game.description}
          image={game.mainImage}
          slug={product.slug || product.id}
          priceLow={priceLow}
          priceHigh={priceHigh}
          category={game.category}
          rating={game.rating}
          ratingCount={game.ratingCount}
        />
      )}

      {/* Back link */}
      <div className="mb-6">
        <Link
          href={backHref}
          className="text-gray-400 hover:text-white transition-colors inline-flex items-center font-medium"
        >
          <ChevronLeft size={18} className="mr-1" />
          {backLabel}
        </Link>
      </div>

      {/* Game Hero */}
      <div className="bg-[#222427]/50 backdrop-blur-md border border-site-border overflow-hidden mb-8 rounded-2xl shadow-ocean">
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
              <div className="relative w-24 h-24 md:w-32 md:h-32 overflow-hidden border border-site-border flex-shrink-0 rounded-2xl shadow-ocean">
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
                <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight drop-shadow-md">
                  {game.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="bg-[#111315]/80 backdrop-blur-md text-white px-3 py-1 font-bold border border-white/10 rounded-full text-[11px] md:text-xs inline-flex items-center gap-1.5 shadow-lg tracking-widest uppercase">
                    {getCountryFlagCode(game.category) && (
                      <CountryFlag
                        code={getCountryFlagCode(game.category)}
                        size="S"
                      />
                    )}
                    <span className="text-site-accent">{game.category}</span>
                  </span>
                </div>

                <p className="text-gray-300 text-sm md:text-base font-medium drop-shadow-sm mt-1">
                  {t("by_developer", {
                    developer: game.publisher || game.developer || t("unknown"),
                  })}
                </p>
              </div>

              <div className="absolute top-4 right-4 flex space-x-2 md:static md:mt-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleToggleFavorite}
                  className={`w-9 h-9 md:w-10 md:h-10 border-site-border bg-[#222427]/80 hover:bg-site-border backdrop-blur-sm shadow-ocean rounded-xl ${isFavorite ? "text-red-500 border-red-500/30/50 bg-red-500/10" : "text-gray-300"
                    }`}
                >
                  <Heart size={18} className={isFavorite ? "fill-red-500" : ""} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className={`w-9 h-9 md:w-10 md:h-10 border-site-border bg-[#222427]/80 hover:bg-site-border backdrop-blur-sm shadow-ocean rounded-xl ${copied ? "text-green-400 border-green-500/30/50 bg-green-500/10" : "text-gray-300"
                    }`}
                >
                  {copied ? <Check size={18} className="text-green-400" /> : <Share2 size={18} />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#222427]/80 backdrop-blur-md border border-site-border overflow-hidden rounded-2xl shadow-ocean">
            <div className="flex border-b border-site-border/50 overflow-x-auto hide-scrollbar bg-[#1A1C1E]/50">
              <button
                onClick={() => setActiveTab("topup")}
                className={`hidden md:flex py-4 px-6 text-sm font-semibold items-center whitespace-nowrap flex-shrink-0 transition-colors ${activeTab === "topup" ? "text-site-accent border-b-2 border-site-accent bg-site-accent/5" : "text-gray-400 hover:text-white hover:bg-[#212328]/5"}`}
              >
                <DollarSign size={18} className="mr-2" />
                {optionsTabLabel}
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`hidden md:flex py-4 px-6 text-sm font-semibold items-center whitespace-nowrap flex-shrink-0 transition-colors ${activeTab === "info" ? "text-site-accent border-b-2 border-site-accent bg-site-accent/5" : "text-gray-400 hover:text-white hover:bg-[#212328]/5"}`}
              >
                <Info size={18} className="mr-2" />
                {infoTabLabel}
              </button>

              <div className="md:hidden py-4 px-6 text-sm font-semibold flex items-center w-full bg-site-accent/10 border-b-2 border-site-accent text-site-accent">
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
                    <div className="text-center py-8 bg-[#1A1C1E] border border-site-border rounded-xl">
                      <AlertCircle
                        className="mx-auto text-gray-500 mb-2"
                        size={32}
                      />
                      <p className="text-gray-400 font-medium">
                        {t("no_options")}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
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
                              className={`relative border p-2.5 md:p-4 cursor-pointer transition-all flex flex-col justify-center items-center gap-2 min-h-[100px] md:min-h-[120px] rounded-xl ${selectedOption === option.id
                                ? "bg-site-accent/10 border-site-accent shadow-[0_0_15px_rgba(103,176,186,0.15)]"
                                : "bg-[#1A1C1E] border-site-border hover:border-site-accent/50 hover:bg-[#222427]"
                                }`}
                              whileHover={{ y: -2 }}
                            >
                              {option.isPopular && (
                                <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                                  <span className="bg-gradient-to-r from-[#FF3366] to-[#FF6B35] text-white text-[9px] md:text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full shadow-[0_2px_10px_rgba(255,51,102,0.4)] flex items-center gap-1 border border-white/20 uppercase whitespace-nowrap">
                                    <Flame size={10} className="text-yellow-200 fill-yellow-200" />
                                    {t("popular_badge")}
                                  </span>
                                </div>
                              )}

                              <h4 className="text-white font-bold text-center text-[13px] md:text-base leading-tight line-clamp-2">
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
                                    <span className={`font-bold text-sm md:text-base ${selectedOption === option.id ? "text-site-accent" : "text-white"}`}>
                                      ฿{Number(option.price || 0).toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className={`font-bold text-sm md:text-base ${selectedOption === option.id ? "text-site-accent" : "text-white"}`}>
                                    ฿{Number(option.price || 0).toFixed(2)}
                                  </span>
                                )}
                              </div>

                              {selectedOption === option.id && (
                                <div className="absolute bottom-2 right-2 text-site-accent">
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
                              className={`relative border p-3 cursor-pointer transition-all flex flex-col justify-center items-center gap-2 min-h-[110px] rounded-xl ${selectedOption === option.id
                                ? "bg-site-accent/10 border-site-accent shadow-[0_0_15px_rgba(103,176,186,0.15)]"
                                : "bg-[#1A1C1E] border-site-border hover:border-site-accent/50 hover:bg-[#222427]"
                                }`}
                            >
                              {option.isPopular && (
                                <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                                  <span className="bg-gradient-to-r from-[#FF3366] to-[#FF6B35] text-white text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full shadow-[0_2px_10px_rgba(255,51,102,0.4)] flex items-center gap-1 border border-white/20 uppercase whitespace-nowrap">
                                    <Flame size={10} className="text-yellow-200 fill-yellow-200" />
                                    {t("popular_badge")}
                                  </span>
                                </div>
                              )}

                              <h4 className="text-white font-bold text-center text-[13px] leading-tight line-clamp-2">
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
                                    <span className={`font-bold text-sm ${selectedOption === option.id ? "text-site-accent" : "text-white"}`}>
                                      ฿{Number(option.price || 0).toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className={`font-bold text-sm ${selectedOption === option.id ? "text-site-accent" : "text-white"}`}>
                                    ฿{Number(option.price || 0).toFixed(2)}
                                  </span>
                                )}
                              </div>

                              {selectedOption === option.id && (
                                <div className="absolute bottom-2 right-2 text-site-accent">
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
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 flex items-start md:items-center gap-2 leading-tight">
                      <span className="w-1.5 h-5 bg-site-accent rounded-full flex-shrink-0 mt-1 md:mt-0 shadow-[0_0_10px_rgba(103,176,186,0.5)]"></span>
                      <span>{t("about_product", { name: game.title })}</span>
                    </h3>
                    <ProductDescription
                      description={game.longDescription || game.description}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#1A1C1E] border border-site-border p-3 md:p-4 rounded-xl">
                      <h4 className="text-gray-400 font-medium mb-2 flex items-center text-sm uppercase">
                        <Package className="mr-2 text-gray-400" size={18} />
                        {t("developer")}
                      </h4>
                      <p className="text-white font-medium">
                        {game.developer || t("unknown")}
                      </p>
                    </div>

                    <div className="bg-[#1A1C1E] border border-site-border p-3 md:p-4 rounded-xl">
                      <h4 className="text-gray-400 font-medium mb-2 flex items-center text-sm uppercase">
                        <Award className="mr-2 text-gray-400" size={18} />
                        {t("publisher")}
                      </h4>
                      <p className="text-white font-medium">
                        {game.publisher || t("unknown")}
                      </p>
                    </div>

                    {game.releaseDate && (
                      <div className="bg-[#1A1C1E] border border-site-border p-3 md:p-4 rounded-xl">
                        <h4 className="text-gray-400 font-medium mb-2 flex items-center text-sm uppercase">
                          <Calendar className="mr-2 text-gray-400" size={18} />
                          {t("release_date")}
                        </h4>
                        <p className="text-white font-medium">
                          {new Date(game.releaseDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="bg-[#1A1C1E] border border-site-border p-3 md:p-4 rounded-xl">
                      <h4 className="text-gray-400 font-medium mb-2 flex items-center text-sm uppercase">
                        <Smartphone className="mr-2 text-gray-400" size={18} />
                        {t("platforms")}
                      </h4>
                      <p className="text-white font-medium">
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
              <h2 className="text-xl font-bold text-white mb-4 flex items-center uppercase">
                <span className="w-1.5 h-5 bg-site-accent rounded-full mr-2 shadow-[0_0_10px_rgba(103,176,186,0.5)]"></span>
                {t("related_products")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {relatedGamesByDev.map((relatedGame) => (
                  <Link
                    href={`/games/${relatedGame.slug}`}
                    key={relatedGame.id}
                  >
                    <motion.div
                      className="bg-[#1A1C1E] border border-site-border overflow-hidden group cursor-pointer rounded-2xl shadow-ocean hover:border-site-accent/50"
                      whileHover={{ y: -4 }}
                    >
                      <div className="relative aspect-square overflow-hidden bg-[#222427]">
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
                          <h3 className="text-sm font-bold text-white line-clamp-1 drop-shadow-sm">
                            {relatedGame.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <span className="text-[10px] bg-site-accent/20 text-site-accent px-2 py-0.5 border border-site-accent/30 font-medium uppercase rounded-full">
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
                  className="relative bg-[#222427]/80 backdrop-blur-md border border-site-border p-4 flex items-center justify-between cursor-pointer group rounded-2xl shadow-ocean"
                >
                  <div className="flex-1">
                    <span className="text-[10px] font-medium text-gray-400 uppercase block mb-1">
                      {t("selected_package_label")}
                    </span>
                    <h4 className="text-white font-bold text-base leading-tight">
                      {selected?.title || t("select_package")}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    {selected && (
                      <span className="text-site-accent font-bold text-lg">
                        ฿{Number(selected.price || 0).toFixed(2)}
                      </span>
                    )}
                    <div className="bg-site-accent/10 p-1 border border-site-accent/30 rounded-lg group-hover:bg-site-accent/20 text-site-accent">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="bg-[#222427]/80 backdrop-blur-md border border-site-border p-4 md:p-6 sticky top-24 rounded-2xl shadow-ocean">
            <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center uppercase">
              <span className="w-1.5 h-5 bg-site-accent rounded-full mr-2 shadow-[0_0_10px_rgba(103,176,186,0.5)]"></span>
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
                      <div className="bg-yellow-500/10 border border-yellow-500/30/30 p-3 text-sm flex items-center gap-2 rounded-xl">
                        <AlertTriangle
                          size={16}
                          className="text-yellow-500 flex-shrink-0"
                        />
                        <span className="text-yellow-200/90 font-medium">
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
                      <span className="text-gray-400 flex-shrink-0 pt-0.5 font-medium">
                        {t("selected_package_label")}
                      </span>
                      <div className="text-right min-w-0">
                        <span className="text-white font-bold block leading-tight break-words">
                          {option.title}
                        </span>
                      </div>
                    </div>

                    <div className="py-4 border-y border-site-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 font-medium">
                          {t("price_label")}
                        </span>
                        {option.originalPrice > option.price ? (
                          <div>
                            <span className="line-through text-gray-500 text-sm mr-2">
                              ฿{Number(option.originalPrice || 0).toFixed(2)}
                            </span>
                            <span className="text-site-accent font-bold text-xl">
                              ฿{Number(option.price || 0).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-site-accent font-bold text-xl">
                            ฿{Number(option.price || 0).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {option.originalPrice > option.price && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 font-medium">
                            {t("savings_label")}
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
                      <Button
                        onClick={handleBuyNow}
                        disabled={isBuying}
                        isLoading={isBuying}
                        size="full"
                        className="bg-site-accent hover:bg-site-accent/90 text-white font-bold h-12 shadow-[0_0_15px_rgba(103,176,186,0.5)] border-none"
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

                    <div className="bg-site-accent/5 border border-site-accent/20 p-3 text-sm rounded-xl">
                      <div className="flex items-center">
                        <Clock
                          size={16}
                          className="text-site-accent mr-2 flex-shrink-0"
                        />
                        <span className="text-site-accent/90 font-medium">
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
        <h2 className="text-xl font-bold text-white mb-4 flex items-center uppercase">
          <span className="w-1.5 h-5 bg-site-accent rounded-full mr-2 shadow-[0_0_10px_rgba(103,176,186,0.5)]"></span>
          {t("similar_products")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {similarGames.length > 0 ? (
            similarGames.map((similarGame) => (
              <Link href={`/games/${similarGame.slug}`} key={similarGame.id}>
                <motion.div
                  className="bg-[#1A1C1E] border border-site-border overflow-hidden group cursor-pointer rounded-2xl shadow-ocean hover:border-site-accent/50 transition-colors"
                  whileHover={{ y: -4 }}
                >
                  <div className="aspect-square relative overflow-hidden bg-[#222427]">
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
                      <h3 className="text-sm font-bold text-white line-clamp-1 drop-shadow-sm">
                        {similarGame.name}
                      </h3>
                      <div className="flex items-center mt-1">
                        <span className="text-[10px] bg-site-accent/20 text-site-accent px-2 py-0.5 border border-site-accent/30 font-medium uppercase rounded-full">
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
            <div className="col-span-full text-center py-8 text-gray-500 font-medium">
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
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-md"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#222427] border border-site-border w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`border-b border-site-border p-3 sm:p-4 flex items-center justify-between flex-shrink-0 ${!verificationStatus.supported ? "bg-red-500/10" : "bg-site-accent/10"}`}
              >
                <div className="flex items-center gap-2">
                  {!verificationStatus.supported ? (
                    <ShieldAlert size={22} className="text-red-500" />
                  ) : (
                    <Check size={22} className="text-site-accent" />
                  )}
                  <h2 className="text-base sm:text-lg font-bold text-white uppercase">
                    {!verificationStatus.supported
                      ? t("unverified_account_warning")
                      : t("confirm_order_title")}
                  </h2>
                </div>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1.5 hover:bg-[#212328]/10 rounded-lg transition-colors text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {!verificationStatus.supported && (
                  <div className="bg-red-500/10 border-b border-red-500/30/30 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle
                        size={18}
                        className="text-red-500 mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-red-400 text-sm">
                          {t("unverified_account_warning")}
                        </p>
                        <p className="text-xs text-red-300 mt-0.5 font-medium">
                          {t("verify_info_hint")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  <div className="p-4 sm:p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-site-border">
                    <div className="bg-[#1A1C1E] border border-site-border p-3 sm:p-4 rounded-xl">
                      <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-1.5 uppercase">
                        <Package size={16} className="text-site-accent" />
                        {t("product_details_title")}
                      </h3>
                      <div className="space-y-2 text-sm font-medium">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Product:</span>
                          <span className="text-white text-right max-w-[60%]">
                            {verificationStatus.productName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Package:</span>
                          <span className="text-white">
                            {verificationStatus.optionName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {Object.keys(verificationStatus.playerInfo).length > 0 && (
                      <div className="bg-[#1A1C1E] border border-site-border p-3 sm:p-4 rounded-xl">
                        <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-1.5 uppercase">
                          <User size={16} className="text-site-accent" />
                          {t("account_info_title")}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(verificationStatus.playerInfo).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="bg-[#16181A] p-2 border border-site-border rounded-lg"
                              >
                                <span className="text-[10px] text-gray-500 block uppercase font-bold">
                                  {key}
                                </span>
                                <span className="font-mono font-bold text-white text-sm truncate block mt-0.5">
                                  {value}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-red-500/10 border border-red-500/30/30 p-3 rounded-xl">
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          size={16}
                          className="text-red-500 mt-0.5 flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-red-400 text-xs">
                            {t("no_refund_warning_title")}
                          </p>
                          <p className="text-xs text-red-300/80 mt-0.5 leading-relaxed font-medium">
                            {t("no_refund_warning_desc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4 bg-[#1A1C1E]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400 font-bold uppercase">
                        {t("payment_method_label")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {priceSummary.label || "Select Method"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsPaymentSelectOpen(true)}
                          className="text-[10px] py-1 px-2 h-auto font-bold uppercase border-site-border text-white hover:bg-site-border hover:text-white"
                        >
                          {t("change_button")}
                        </Button>
                      </div>
                    </div>

                    <div className="bg-[#222427] border border-site-border p-4 rounded-xl">
                      <div className="space-y-2 text-sm font-medium">
                        <div className="flex justify-between text-gray-400">
                          <span>{t("subtotal_label")}</span>
                          <span className="text-white">
                            ฿
                            {Number(
                              priceSummary.base ||
                              verificationStatus.price ||
                              0,
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>{t("fee_label")}</span>
                          <span className="text-pink-400">
                            +฿{Number(priceSummary.fee || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t border-site-border pt-2 mt-2">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-white">
                              {t("total_label")}
                            </span>
                            <span className="text-2xl sm:text-3xl font-bold text-site-accent">
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

                    <div className="bg-sky-500/10 border border-sky-500/30 p-2.5 text-[10px] text-sky-400 flex items-start gap-2 font-medium uppercase rounded-xl">
                      <ShieldCheck size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{t("secure_payment_notice")}</span>
                    </div>

                    <div className="pt-4 border-t border-site-border">
                      <div className="mb-4">
                        <label className="flex items-start gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-site-border bg-[#1A1C1E] accent-site-accent flex-shrink-0 cursor-pointer"
                          />
                          <span className="text-[10px] text-gray-400 group-hover:text-gray-300 transition-colors leading-tight font-medium">
                            {t("terms_agreement_prefix")}{" "}
                            <Link
                              href="/terms"
                              target="_blank"
                              className="text-site-accent hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t("terms_label")}
                            </Link>
                            ,{" "}
                            <Link
                              href="/privacy"
                              target="_blank"
                              className="text-site-accent hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t("privacy_label")}
                            </Link>{" "}
                            and{" "}
                            <Link
                              href="/refund-policy"
                              target="_blank"
                              className="text-site-accent hover:underline"
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
                          className="flex-1 bg-site-accent hover:bg-site-accent/90 text-white h-12 sm:h-14 text-base sm:text-lg font-bold disabled:opacity-50 border-none uppercase shadow-[0_0_15px_rgba(103,176,186,0.3)] transition-all"
                        >
                          {!isBuying && <Check size={20} className="mr-2" />}
                          {t("confirm_button")}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => setShowConfirmModal(false)}
                          disabled={isBuying}
                          className="sm:w-auto w-full h-12 sm:h-14 px-6 sm:px-8 font-bold border-site-border bg-transparent text-white hover:bg-site-border hover:text-white uppercase transition-all"
                        >
                          {t("cancel_button")}
                        </Button>
                      </div>

                      <p className="text-center text-[10px] text-gray-500 mt-3 font-medium uppercase">
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
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md"
            onClick={() => setIsPaymentSelectOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#222427] w-full max-w-5xl border border-site-border shadow-2xl p-4 sm:p-6 rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start gap-3 mb-5">
                <div>
                  <h3 className="text-2xl font-bold text-white uppercase">
                    {t("payment_selection_title")}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1 font-medium">
                    {t("payment_selection_desc")}
                  </p>
                </div>
                <button
                  onClick={() => setIsPaymentSelectOpen(false)}
                  className="p-2 hover:bg-[#212328]/10 rounded-lg transition-colors text-white"
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
                        className={`border p-4 flex flex-col gap-3 transition-all rounded-xl ${isActive ? "bg-site-accent/10 border-site-accent shadow-[0_0_15px_rgba(103,176,186,0.15)]" : "bg-[#1A1C1E] border-site-border hover:border-site-accent/50 hover:bg-[#222427]"
                          } ${!isAvailable
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                          }`}
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
                              className="mt-1 accent-site-accent disabled:cursor-not-allowed bg-[#16181A] border-site-border"
                            />
                            <div>
                              <div className="text-white font-bold text-base flex items-center gap-2">
                                {opt.label}
                                {!isAvailable && (
                                  <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                                    Min {TRUEMONEY_MIN_AMOUNT}฿
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-1 font-medium">
                                Gateway: {opt.gateway.name}
                              </div>
                              {unavailableReason && (
                                <div className="text-[10px] text-red-400 mt-1 font-medium">
                                  {unavailableReason}
                                </div>
                              )}
                            </div>
                          </div>
                          {isActive && isAvailable && (
                            <Check size={16} className="text-site-accent" />
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] uppercase border border-site-border px-2 py-0.5 bg-[#16181A] text-gray-400 font-bold rounded ${!isAvailable ? "opacity-50" : ""}`}>
                            {opt.method}
                          </span>
                        </div>

                        <div className="border-t border-site-border/50 pt-2 text-[10px] text-gray-400 space-y-1 font-medium">
                          <div className="flex justify-between">
                            <span>FEE %</span>
                            <span className="text-white">
                              {Number(opt.surchargePercent || 0).toFixed(2)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>FLAT FEE</span>
                            <span className="text-white">{formatTHB(Number(opt.flatFee || 0))}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="border border-site-border p-4 bg-[#1A1C1E] rounded-xl h-fit space-y-4">
                  <h4 className="text-lg font-bold text-white uppercase">
                    {t("transaction_summary_title")}
                  </h4>

                  <div className="space-y-2 text-sm font-medium">
                    <div className="flex justify-between text-gray-400">
                      <span>Product:</span>
                      <span className="text-white max-w-[55%] text-right truncate">
                        {game?.title || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Package:</span>
                      <span className="text-white max-w-[55%] text-right truncate">
                        {selectedTopUp?.title || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal:</span>
                      <span className="text-white">{formatTHB(Number(priceSummary.base || 0))}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Fee:</span>
                      <span className="text-pink-400">{formatTHB(Number(priceSummary.fee || 0))}</span>
                    </div>
                  </div>

                  <div className="border-t border-site-border pt-3 flex justify-between items-end font-bold">
                    <span className="text-sm text-gray-400 uppercase">
                      {t("total_label")}
                    </span>
                    <span className="text-2xl font-bold text-site-accent">
                      {formatTHB(Number(priceSummary.total || 0))}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      onClick={() => setIsPaymentSelectOpen(false)}
                      disabled={!selectedPaymentOption}
                      fullWidth
                      className="font-bold uppercase bg-site-accent hover:bg-site-accent/90 text-white border-none shadow-[0_0_15px_rgba(103,176,186,0.3)] transition-all"
                    >
                      {t("confirm_selection_button")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsPaymentSelectOpen(false)}
                      fullWidth
                      className="font-bold uppercase border-site-border bg-transparent text-white hover:bg-site-border hover:text-white transition-all"
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
